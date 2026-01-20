import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../../../generated/prisma';

const SALT_ROUNDS = 10;

// Hash Password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify Password
export async function verifyPassword(candidate: string, hash: string): Promise<boolean> {
  return bcrypt.compare(candidate, hash);
}

// Generate Tokens
export function generateTokens(user: User, sessionId: string, deviceId: string) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId,
    deviceId
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRY || '15m') as SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || '30d') as SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
}

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}