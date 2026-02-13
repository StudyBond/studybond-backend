// src/modules/bookmarks/bookmarks.routes.ts
// Route definitions for bookmark endpoints

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { BookmarksController } from './bookmarks.controller';
import {
    createBookmarkSchema,
    updateBookmarkSchema,
    bookmarkQuerySchema,
    bookmarkIdParamSchema,
    bookmarkResponseSchema,
    bookmarkListResponseSchema,
    bookmarkSuccessResponseSchema,
} from './bookmarks.schema';

export async function bookmarksRoutes(app: FastifyInstance) {
    const controller = new BookmarksController();

    // Wrap Fastify instance with ZodTypeProvider for type-safe schema validation
    const server = app.withTypeProvider<ZodTypeProvider>();

    /**
     * POST /
     * Create a new bookmark for a question.
     * Requires authentication.
     */
    server.post('/', {
        preValidation: [app.authenticate],
        schema: {
            body: createBookmarkSchema,
            tags: ['Bookmarks'],
            description: 'Create a new bookmark for a question. Free users: max 20 bookmarks with 30-day expiry. Premium: unlimited.',
            response: {
                201: bookmarkResponseSchema,
            },
        },
    }, controller.createBookmark);

    /**
     * GET /
     * List all bookmarks for the authenticated user.
     * Supports pagination and filtering by subject.
     * Requires authentication.
     */
    server.get('/', {
        preValidation: [app.authenticate],
        schema: {
            querystring: bookmarkQuerySchema,
            tags: ['Bookmarks'],
            description: 'List all bookmarks with pagination. Filter by subject using ?subject=Mathematics',
            response: {
                200: bookmarkListResponseSchema,
            },
        },
    }, controller.getBookmarks);

    /**
     * GET /:id
     * Get a single bookmark by its ID.
     * Requires authentication.
     */
    server.get('/:id', {
        preValidation: [app.authenticate],
        schema: {
            params: bookmarkIdParamSchema,
            tags: ['Bookmarks'],
            description: 'Get a specific bookmark by ID',
            response: {
                200: bookmarkResponseSchema,
            },
        },
    }, controller.getBookmarkById);

    /**
     * PATCH /:id
     * Update a bookmark's notes.
     * Requires authentication.
     */
    server.patch('/:id', {
        preValidation: [app.authenticate],
        schema: {
            params: bookmarkIdParamSchema,
            body: updateBookmarkSchema,
            tags: ['Bookmarks'],
            description: 'Update bookmark notes',
            response: {
                200: bookmarkResponseSchema,
            },
        },
    }, controller.updateBookmark);

    /**
     * DELETE /:id
     * Delete a bookmark.
     * Requires authentication.
     */
    server.delete('/:id', {
        preValidation: [app.authenticate],
        schema: {
            params: bookmarkIdParamSchema,
            tags: ['Bookmarks'],
            description: 'Delete a bookmark',
            response: {
                200: bookmarkSuccessResponseSchema,
            },
        },
    }, controller.deleteBookmark);
}
