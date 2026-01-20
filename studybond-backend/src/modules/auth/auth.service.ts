import { prisma } from '../../config/database';
import { RegisterInput, LoginInput, VerifyOtpInput } from './auth.schema';
import { hashPassword, verifyPassword, generateTokens, generateOTP } from './auth.utils';
import { AppError } from '../../shared/errors/AppError';

export class AuthService {

  /**
   * We ensure only ONE active session exists per user.
   * If User logs in on Device B, Device A session is killed.
   */
  private async killOtherSessions(userId: number, currentDeviceId: string) {
    await prisma.userSession.updateMany({
      where: {
        userId,
        deviceId: { not: currentDeviceId }, // Kill everyone else
        isActive: true,
      },
      data: { isActive: false },
    });
  }

  // REGISTER
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new AppError('Email already in use', 409);

    const passwordHash = await hashPassword(data.password);

    // Transaction: Create User -> Device -> Session -> Audit Log
    const result = await prisma.$transaction(async (tx) => {
      // Create User
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          aspiringCourse: data.aspiringCourse,
          targetScore: data.targetScore,
        },
      });

      // Create Verified Device (First device is trusted)
      await tx.userDevice.create({
        data: {
          userId: user.id,
          deviceId: data.deviceId,
          deviceName: data.deviceName,
          userAgent: 'App/Browser',
          isVerified: true,
          isActive: true,
          lastLoginAt: new Date(),
        },
      });

      // Create Session
      const session = await tx.userSession.create({
        data: {
          userId: user.id,
          deviceId: data.deviceId,
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_SUCCESS', // Registration counts as first login
          deviceId: data.deviceId,
          metadata: { reason: 'Registration' }
        }
      });

      return { user, session };
    });

    // Generate Tokens
    const tokens = generateTokens(result.user, result.session.id, data.deviceId);

    return {
      user: result.user,
      ...tokens,
      requiresOTP: false
    };
  }

  // LOGIN
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError('Invalid credentials', 401);

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) throw new AppError('Invalid credentials', 401);

    // Check Device Status
    const device = await prisma.userDevice.findUnique({
      where: {
        userId_deviceId: { userId: user.id, deviceId: data.deviceId }
      }
    });

    // Scenario A: Known & Verified Device
    if (device && device.isVerified) {
      // Kill other sessions
      await this.killOtherSessions(user.id, data.deviceId);

      // Then create new session
      const session = await prisma.userSession.create({
        data: {
          userId: user.id,
          deviceId: data.deviceId,
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // And then update Device activity
      await prisma.userDevice.update({
        where: { id: device.id },
        data: { isActive: true, lastLoginAt: new Date() }
      });

      const tokens = generateTokens(user, session.id, data.deviceId);
      return { user, ...tokens, requiresOTP: false };
    }

    // Scenario B: New or Unverified Device -> Require OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Upsert device (create if new, update if exists but unverified)
    await prisma.userDevice.upsert({
      where: { userId_deviceId: { userId: user.id, deviceId: data.deviceId } },
      create: {
        userId: user.id,
        deviceId: data.deviceId,
        deviceName: data.deviceName || 'Unknown',
        userAgent: 'Unknown',
        isVerified: false,
        isActive: false
      },
      update: {
        isActive: false // Ensure it's inactive until verified
      }
    });

    // Store OTP in User record (or a separate OTP table if you prefer)
    // For now, using verificationToken/ExpiresAt on User model as per schema availability
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: otp, // Hashed in production, plain for now
        tokenExpiresAt: expiresAt,
        lastOtpRequestDate: new Date()
      }
    });

    // TODO: Send Email via SendGrid here
    console.log(`[DEV MODE] OTP for ${user.email}: ${otp}`);

    return {
      requiresOTP: true,
      message: 'New device detected. Please verify OTP sent to email.'
    };
  }

  // VERIFY OTP
  async verifyDeviceOtp(data: VerifyOtpInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError('User not found', 404);

    // Validate OTP
    if (user.verificationToken !== data.otp || !user.tokenExpiresAt || user.tokenExpiresAt < new Date()) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Verify the Device
    await prisma.userDevice.update({
      where: { userId_deviceId: { userId: user.id, deviceId: data.deviceId } },
      data: { isVerified: true, isActive: true, lastLoginAt: new Date() }
    });

    // Clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: null, tokenExpiresAt: null }
    });

    // Kill other sessions & Create new one
    await this.killOtherSessions(user.id, data.deviceId);

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        deviceId: data.deviceId,
        isActive: true,
      }
    });

    const tokens = generateTokens(user, session.id, data.deviceId);
    return { user, ...tokens, message: 'Device verified successfully' };
  }
}