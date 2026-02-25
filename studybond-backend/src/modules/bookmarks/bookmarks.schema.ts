// src/modules/bookmarks/bookmarks.schema.ts
// Zod validation schemas for the Bookmarks module

import { z } from 'zod';


// CONSTANTS

/**
 * Business rule limits - centralized for easy modification.
 * Free users: max 20 bookmarks, 30-day expiry
 * Premium users: max 50 bookmarks, 30-day expiry
 */
export const BOOKMARK_LIMITS = {
    FREE_USER_MAX_BOOKMARKS: 20,
    PREMIUM_USER_MAX_BOOKMARKS: 50,
    EXPIRY_DAYS: 30,
    NOTES_MAX_CHARS: 300, // ~50 words
} as const;


// REQUEST SCHEMAS

/**
 * Schema for creating a new bookmark.
 * - questionId: Required - which question to bookmark
 * - examId: Optional - track which exam context this came from
 * - notes: Optional - user's personal notes (max 300 chars / ~50 words)
 */
export const createBookmarkSchema = z.object({
    questionId: z.number().int().positive('Question ID must be a positive integer'),
    examId: z.number().int().positive('Exam ID must be a positive integer').optional(),
    notes: z.string().max(BOOKMARK_LIMITS.NOTES_MAX_CHARS,
        `Notes cannot exceed ${BOOKMARK_LIMITS.NOTES_MAX_CHARS} characters`).optional(),
});

/**
 * Schema for updating a bookmark.
 * Only notes can be updated - questionId/examId are immutable.
 */
export const updateBookmarkSchema = z.object({
    notes: z.string().max(BOOKMARK_LIMITS.NOTES_MAX_CHARS,
        `Notes cannot exceed ${BOOKMARK_LIMITS.NOTES_MAX_CHARS} characters`).optional().nullable(),
});

/**
 * Schema for bookmark list query parameters.
 * Supports pagination and filtering by subject.
 */
export const bookmarkQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    subject: z.string().optional(),
});

/**
 * Schema for bookmark ID parameter.
 */
export const bookmarkIdParamSchema = z.object({
    id: z.coerce.number().int().positive('Bookmark ID must be a positive integer'),
});


// RESPONSE SCHEMAS (for Swagger documentation)

/**
 * Question summary embedded in bookmark response.
 * Only includes fields needed for display, not full question data.
 */
export const questionSummarySchema = z.object({
    id: z.number(),
    questionText: z.string(),
    subject: z.string(),
    topic: z.string().nullable(),
    hasImage: z.boolean(),
});

/**
 * Single bookmark response schema.
 */
export const bookmarkResponseSchema = z.object({
    id: z.number(),
    questionId: z.number(),
    examId: z.number().nullable(),
    notes: z.string().nullable(),
    createdAt: z.date(),
    expiresAt: z.date().nullable(),
    question: questionSummarySchema,
});

/**
 * Paginated bookmarks list response schema.
 */
export const bookmarkListResponseSchema = z.object({
    bookmarks: z.array(bookmarkResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
});

/**
 * Success message response schema.
 */
export const bookmarkSuccessResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});


// TYPE EXPORTS

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;
export type BookmarkQuery = z.infer<typeof bookmarkQuerySchema>;
export type BookmarkIdParam = z.infer<typeof bookmarkIdParamSchema>;
export type BookmarkResponse = z.infer<typeof bookmarkResponseSchema>;
export type BookmarkListResponse = z.infer<typeof bookmarkListResponseSchema>;
