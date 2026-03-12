// src/modules/bookmarks/bookmarks.controller.ts
// Request handlers for bookmark management

import { FastifyReply, FastifyRequest } from 'fastify';
import { BookmarksService } from './bookmarks.service';
import { BookmarkQuery } from './bookmarks.schema';

export class BookmarksController {
    private bookmarksService: BookmarksService;

    constructor() {
        this.bookmarksService = new BookmarksService();
    }

    /**
     * POST /
     * Create a new bookmark for a question.
     * Body contains: questionId (required), examId (optional), notes (optional)
     */
    createBookmark = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as { userId: number }).userId;
        const body = req.body as { questionId: number; examId?: number; notes?: string };
        const bookmark = await this.bookmarksService.createBookmark(userId, body);
        return reply.code(201).send(bookmark);
    };

    /**
     * GET /
     * List all bookmarks for the authenticated user.
     * Supports pagination (?page=1&limit=20) and filtering (?subject=Mathematics).
     */
    getBookmarks = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as { userId: number }).userId;
        const query = req.query as BookmarkQuery;
        const result = await this.bookmarksService.getUserBookmarks(userId, query);
        return reply.send(result);
    };

    /**
     * GET /:id
     * Get a single bookmark by ID.
     */
    getBookmarkById = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as { userId: number }).userId;
        const { id: bookmarkId } = req.params as { id: number };
        const bookmark = await this.bookmarksService.getBookmarkById(userId, bookmarkId);
        return reply.send(bookmark);
    };

    /**
     * PATCH /:id
     * Update a bookmark's notes.
     */
    updateBookmark = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as { userId: number }).userId;
        const { id: bookmarkId } = req.params as { id: number };
        const body = req.body as { notes?: string | null };
        const bookmark = await this.bookmarksService.updateBookmark(userId, bookmarkId, body);
        return reply.send(bookmark);
    };

    /**
     * DELETE /:id
     * Delete a bookmark.
     */
    deleteBookmark = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as { userId: number }).userId;
        const { id: bookmarkId } = req.params as { id: number };
        const result = await this.bookmarksService.deleteBookmark(userId, bookmarkId);
        return reply.send(result);
    };
}
