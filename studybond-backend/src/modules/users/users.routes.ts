// src/modules/users/users.routes.ts
// Route definitions for user profile management

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { UsersController } from './users.controller';
import {
    updateProfileSchema,
    userProfileResponseSchema,
    userStatsResponseSchema
} from './users.schema';
import { z } from 'zod';

// Reusable success response wrapper for API responses
const successResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

// Account deletion response schema
const deleteAccountResponseSchema = successResponseSchema.extend({
    deletedAt: z.string().describe('ISO timestamp of deletion'),
});

export async function usersRoutes(app: FastifyInstance) {
    const controller = new UsersController();

    // Wrap the Fastify instance with ZodTypeProvider to enable Zod schema validation.
    // This allows us to pass Zod schemas directly to route definitions and get full TypeScript inference.
    const server = app.withTypeProvider<ZodTypeProvider>();

    /**
     * GET /profile
     * Returns the authenticated user's profile.
     * Requires valid JWT token.
     */
    server.get('/profile', {
        preValidation: [app.authenticate],
        schema: {
            tags: ['Users'],
            description: 'Get authenticated user profile',
            response: {
                200: userProfileResponseSchema,
            },
        },
    }, controller.getProfile);

    /**
     * PATCH /profile
     * Updates the authenticated user's profile.
     * Requires valid JWT token.
     */
    server.patch('/profile', {
        preValidation: [app.authenticate],
        schema: {
            body: updateProfileSchema,
            tags: ['Users'],
            description: 'Update authenticated user profile',
            response: {
                200: userProfileResponseSchema,
            },
        },
    }, controller.updateProfile);

    /**
     * GET /stats
     * Returns the authenticated user's statistics (SP, streaks, exam counts).
     * Requires valid JWT token.
     */
    server.get('/stats', {
        preValidation: [app.authenticate],
        schema: {
            tags: ['Users'],
            description: 'Get authenticated user statistics',
            response: {
                200: userStatsResponseSchema,
            },
        },
    }, controller.getStats);

    /**
     * DELETE /account
     * Permanently deletes the authenticated user's account and all associated data.
     * Requires valid JWT token.
     */
    server.delete('/account', {
        preValidation: [app.authenticate],
        schema: {
            tags: ['Users'],
            description: 'Delete authenticated user account',
            response: {
                200: deleteAccountResponseSchema,
            },
        },
    }, controller.deleteAccount);
}
