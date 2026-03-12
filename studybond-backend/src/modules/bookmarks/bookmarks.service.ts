// src/modules/bookmarks/bookmarks.service.ts
// Business logic for bookmark management

import { prisma } from '../../config/database';
import {
    CreateBookmarkInput,
    UpdateBookmarkInput,
    BookmarkQuery,
    BOOKMARK_LIMITS
} from './bookmarks.schema';
import { AppError } from '../../shared/errors/AppError';

export class BookmarksService {

    /**
     * Create a new bookmark for a question.
     * 
     * Business rules:
     * - Free users: Max 20 bookmarks, expires in 30 days
     * - Premium users: Unlimited bookmarks, never expires
     * - Duplicate bookmarks (same user + question) are rejected
     * 
     * @param userId - ID of the authenticated user
     * @param data - Bookmark creation data (questionId, optional examId and notes)
     */
    async createBookmark(userId: number, data: CreateBookmarkInput) {
        // Step 1: Get user to check premium status
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, isPremium: true },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Step 2: Verify the question exists
        const question = await prisma.question.findUnique({
            where: { id: data.questionId },
            select: { id: true, questionText: true, subject: true, topic: true, hasImage: true },
        });

        if (!question) {
            throw new AppError('Question not found', 404);
        }

        // Step 3: Check bookmark limit (20 for free, 50 for premium)
        const maxBookmarks = user.isPremium
            ? BOOKMARK_LIMITS.PREMIUM_USER_MAX_BOOKMARKS
            : BOOKMARK_LIMITS.FREE_USER_MAX_BOOKMARKS;

        const bookmarkCount = await prisma.bookmarkedQuestion.count({
            where: { userId },
        });

        if (bookmarkCount >= maxBookmarks) {
            const message = user.isPremium
                ? `You have reached the maximum of ${maxBookmarks} bookmarks. Please review and remove old bookmarks to add new ones.`
                : `Free users can only have ${maxBookmarks} bookmarks. Upgrade to premium for up to ${BOOKMARK_LIMITS.PREMIUM_USER_MAX_BOOKMARKS} bookmarks.`;
            throw new AppError(message, 403);
        }

        // Step 4: Check for duplicate bookmark
        const existingBookmark = await prisma.bookmarkedQuestion.findUnique({
            where: {
                userId_questionId: { userId, questionId: data.questionId },
            },
        });

        if (existingBookmark) {
            throw new AppError('Question is already bookmarked', 409);
        }

        // Step 5: If examId provided, verify exam exists and belongs to user
        if (data.examId) {
            const exam = await prisma.exam.findUnique({
                where: { id: data.examId },
                select: { id: true, userId: true },
            });

            if (!exam) {
                throw new AppError('Exam not found', 404);
            }

            if (exam.userId !== userId) {
                throw new AppError('Exam does not belong to this user', 403);
            }
        }

        // Step 6: Calculate expiry date (30 days for all users)
        const expiresAt = new Date(Date.now() + BOOKMARK_LIMITS.EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        // Step 7: Create the bookmark
        const bookmark = await prisma.bookmarkedQuestion.create({
            data: {
                userId,
                questionId: data.questionId,
                examId: data.examId ?? null,
                notes: data.notes ?? null,
                expiresAt,
            },
            include: {
                question: {
                    select: {
                        id: true,
                        questionText: true,
                        subject: true,
                        topic: true,
                        hasImage: true,
                    },
                },
            },
        });

        return bookmark;
    }

    /**
     * Get all bookmarks for a user with pagination and optional filtering.
     * 
     * @param userId - ID of the authenticated user
     * @param query - Pagination and filter options (page, limit, subject)
     */
    async getUserBookmarks(userId: number, query: BookmarkQuery) {
        const { page, limit, subject } = query;
        const skip = (page - 1) * limit;

        // Build where clause with optional subject filter
        const whereClause: any = {
            userId,
            // Exclude expired bookmarks
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
            ],
        };

        // Add subject filter if provided (filter by question's subject)
        if (subject) {
            whereClause.question = { subject };
        }

        // Get total count for pagination
        const total = await prisma.bookmarkedQuestion.count({
            where: whereClause,
        });

        // Get paginated bookmarks with question details
        const bookmarks = await prisma.bookmarkedQuestion.findMany({
            where: whereClause,
            include: {
                question: {
                    select: {
                        id: true,
                        questionText: true,
                        subject: true,
                        topic: true,
                        hasImage: true,
                    },
                },
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }, // Most recent first
        });

        return {
            bookmarks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get a single bookmark by ID.
     * Validates that the bookmark belongs to the requesting user.
     * 
     * @param userId - ID of the authenticated user
     * @param bookmarkId - ID of the bookmark to retrieve
     */
    async getBookmarkById(userId: number, bookmarkId: number) {
        const bookmark = await prisma.bookmarkedQuestion.findUnique({
            where: { id: bookmarkId },
            include: {
                question: {
                    select: {
                        id: true,
                        questionText: true,
                        subject: true,
                        topic: true,
                        hasImage: true,
                    },
                },
            },
        });

        if (!bookmark) {
            throw new AppError('Bookmark not found', 404);
        }

        // Ownership check - users can only access their own bookmarks
        if (bookmark.userId !== userId) {
            throw new AppError('Bookmark not found', 404); // Return 404 to avoid leaking existence
        }

        // Check if bookmark has expired
        if (bookmark.expiresAt && bookmark.expiresAt < new Date()) {
            throw new AppError('Bookmark has expired', 410); // 410 Gone
        }

        return bookmark;
    }

    /**
     * Update a bookmark's notes.
     * Only the notes field can be updated - questionId and examId are immutable.
     * 
     * @param userId - ID of the authenticated user
     * @param bookmarkId - ID of the bookmark to update
     * @param data - Update data (notes only)
     */
    async updateBookmark(userId: number, bookmarkId: number, data: UpdateBookmarkInput) {
        // First verify bookmark exists and belongs to user
        const existingBookmark = await prisma.bookmarkedQuestion.findUnique({
            where: { id: bookmarkId },
            select: { id: true, userId: true, expiresAt: true },
        });

        if (!existingBookmark) {
            throw new AppError('Bookmark not found', 404);
        }

        if (existingBookmark.userId !== userId) {
            throw new AppError('Bookmark not found', 404);
        }

        // Check expiry
        if (existingBookmark.expiresAt && existingBookmark.expiresAt < new Date()) {
            throw new AppError('Cannot update expired bookmark', 410);
        }

        // Update the bookmark
        const updatedBookmark = await prisma.bookmarkedQuestion.update({
            where: { id: bookmarkId },
            data: {
                notes: data.notes,
            },
            include: {
                question: {
                    select: {
                        id: true,
                        questionText: true,
                        subject: true,
                        topic: true,
                        hasImage: true,
                    },
                },
            },
        });

        return updatedBookmark;
    }

    /**
     * Delete a bookmark.
     * Validates ownership before deletion.
     * 
     * @param userId - ID of the authenticated user
     * @param bookmarkId - ID of the bookmark to delete
     */
    async deleteBookmark(userId: number, bookmarkId: number) {
        // Verify bookmark exists and belongs to user
        const bookmark = await prisma.bookmarkedQuestion.findUnique({
            where: { id: bookmarkId },
            select: { id: true, userId: true },
        });

        if (!bookmark) {
            throw new AppError('Bookmark not found', 404);
        }

        if (bookmark.userId !== userId) {
            throw new AppError('Bookmark not found', 404);
        }

        // Delete the bookmark
        await prisma.bookmarkedQuestion.delete({
            where: { id: bookmarkId },
        });

        return {
            success: true,
            message: 'Bookmark deleted successfully',
        };
    }
}
