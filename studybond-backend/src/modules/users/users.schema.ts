// src/modules/users/users.schema.ts
// Zod validation schemas for the Users module

import { z } from 'zod';


// REQUEST SCHEMAS

/**
 * Schema for updating user profile.
 * All fields are optional - users can update any subset.
 */
export const updateProfileSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    aspiringCourse: z.string().optional(),
    targetScore: z.number().max(400, 'Target score cannot exceed 400').optional(),
    emailUnsubscribed: z.boolean().optional(),
});


// RESPONSE SCHEMAS (for documentation/typing)

/**
 * Safe user profile response - excludes sensitive fields like passwordHash, tokens.
 */
export const userProfileResponseSchema = z.object({
    id: z.number(),
    email: z.string(),
    fullName: z.string(),
    isVerified: z.boolean(),
    role: z.string(),
    aspiringCourse: z.string().nullable(),
    targetScore: z.number().nullable(),
    isPremium: z.boolean(),
    emailUnsubscribed: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

/**
 * User statistics response - SP, streaks, and activity data.
 */
export const userStatsResponseSchema = z.object({
    totalSp: z.number(),
    weeklySp: z.number(),
    currentStreak: z.number(),
    longestStreak: z.number(),
    realExamsCompleted: z.number(),
    hasTakenFreeExam: z.boolean(),
    aiExplanationsUsedToday: z.number(),
});


// TYPE EXPORTS

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;
export type UserStatsResponse = z.infer<typeof userStatsResponseSchema>;
