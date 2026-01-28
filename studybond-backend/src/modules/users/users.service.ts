// src/modules/users/users.service.ts
// Business logic for user profile management

import { prisma } from '../../config/database';
import { UpdateProfileInput } from './users.schema';
import { AppError } from '../../shared/errors/AppError';

export class UsersService {

    /**
     * Get user profile by ID.
     * Excludes sensitive fields like passwordHash, tokens, OTP data.
     */
    async getProfile(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                // Basic info
                id: true,
                email: true,
                fullName: true,
                isVerified: true,
                role: true,
                // Personalization
                aspiringCourse: true,
                targetScore: true,
                // Premium status
                isPremium: true,
                subscriptionEndDate: true,
                // Email preferences
                emailUnsubscribed: true,
                // Timestamps
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }

    /**
     * Update user profile with allowed fields only.
     * Returns the updated profile.
     */
    async updateProfile(userId: number, data: UpdateProfileInput) {
        // Verify user exists first (edge case: user deleted but token still valid)
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!existingUser) {
            throw new AppError('User not found', 404);
        }

        // Only update fields that were actually provided
        const updateData: Partial<UpdateProfileInput> = {};

        if (data.fullName !== undefined) updateData.fullName = data.fullName;
        if (data.aspiringCourse !== undefined) updateData.aspiringCourse = data.aspiringCourse;
        if (data.targetScore !== undefined) updateData.targetScore = data.targetScore;
        if (data.emailUnsubscribed !== undefined) updateData.emailUnsubscribed = data.emailUnsubscribed;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                fullName: true,
                isVerified: true,
                role: true,
                aspiringCourse: true,
                targetScore: true,
                isPremium: true,
                emailUnsubscribed: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return updatedUser;
    }

    /**
     * Get user statistics - SP, streaks, exam counts, AI usage.
     */
    async getStats(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                totalSp: true,
                weeklySp: true,
                currentStreak: true,
                longestStreak: true,
                realExamsCompleted: true,
                hasTakenFreeExam: true,
                aiExplanationsUsedToday: true,
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }

    /**
     * Permanently delete user account and all associated data.
     * Prisma cascade delete will handle related records.
     */
    async deleteAccount(userId: number) {
        // Verify user exists first
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Delete the user - cascade will handle related records
        await prisma.user.delete({
            where: { id: userId },
        });

        return {
            success: true,
            message: 'Account deleted successfully',
            deletedAt: new Date().toISOString(),
        };
    }
}
