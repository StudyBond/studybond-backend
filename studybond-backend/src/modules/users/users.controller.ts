// src/modules/users/users.controller.ts
// Request handlers for user profile management

import { FastifyReply, FastifyRequest } from 'fastify';
import { UsersService } from './users.service';
import { UpdateProfileInput } from './users.schema';

export class UsersController {
    private usersService: UsersService;

    constructor() {
        this.usersService = new UsersService();
    }

    /**
     * GET /profile
     * Returns the authenticated user's profile.
     */
    getProfile = async (req: FastifyRequest, reply: FastifyReply) => {
        // req.user is populated by the JWT verify middleware
        const userId = (req.user as { userId: number }).userId;
        const profile = await this.usersService.getProfile(userId);
        return reply.send(profile);
    };

    /**
     * PATCH /profile
     * Updates the authenticated user's profile.
     */
    updateProfile = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as { userId: number }).userId;
        const body = req.body as UpdateProfileInput;
        const updatedProfile = await this.usersService.updateProfile(userId, body);
        return reply.send(updatedProfile);
    };

    /**
     * GET /stats
     * Returns the authenticated user's statistics.
     */
    getStats = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as { userId: number }).userId;
        const stats = await this.usersService.getStats(userId);
        return reply.send(stats);
    };

    /**
     * DELETE /account
     * Permanently deletes the authenticated user's account.
     */
    deleteAccount = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as { userId: number }).userId;
        const result = await this.usersService.deleteAccount(userId);
        return reply.send(result);
    };
}
