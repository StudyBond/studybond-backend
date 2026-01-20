import { z } from 'zod';


// Register schema
export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name required'),
    aspiringCourse: z.string().optional(),
    targetScore: z.number().int().min(0).max(400).optional(),
    deviceId: z.string().min(10, 'Device ID required'),
});

// Login schema
export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password required'),
    deviceId: z.string().min(10, 'Device ID required'),
});

// TypeScript types inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// SERVICE RESPONSE TYPES
export interface AuthResponse {
    user: {
        id: number;
        email: string;
        fullName: string;
        isPremium: boolean;
        role: string;
    };
    accessToken: string;
    refreshToken: string;
}