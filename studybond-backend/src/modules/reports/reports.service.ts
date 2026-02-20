// src/modules/reports/reports.service.ts
// Business logic for the Reports module

import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import type { CreateReportInput, ReportQuery } from './reports.schema';

/**
 * ReportsService handles all question report operations.
 *
 * Reports allow users to flag issues with questions such as wrong answers,
 * typos, ambiguous wording, or missing images. Each report is tied to
 * the user who created it and the question being reported.
 *
 * Key rules:
 * - One report per user per question per issue type (duplicate prevention)
 * - Users can only view/delete their own reports
 * - Reports can only be deleted while still in PENDING status
 */
export class ReportsService {

    /**
     * Create a new question report.
     *
     * Validates that the question exists and prevents duplicate reports
     * (same user + same question + same issue type).
     */
    async createReport(userId: number, data: CreateReportInput) {
        // Verify the question exists before creating a report
        const question = await prisma.question.findUnique({
            where: { id: data.questionId },
            select: { id: true },
        });

        if (!question) {
            throw new AppError('Question not found', 404);
        }

        // Check for duplicate: same user, same question, same issue type
        const existingReport = await prisma.questionReport.findFirst({
            where: {
                userId,
                questionId: data.questionId,
                issueType: data.issueType,
            },
        });

        if (existingReport) {
            throw new AppError(
                'You have already reported this issue for this question',
                409, // 409 Conflict
            );
        }

        // Create the report with PENDING status (default in Prisma)
        // Wrapped in try/catch to handle the DB-level unique constraint
        // as a safety net for concurrent requests
        try {
            const report = await prisma.questionReport.create({
                data: {
                    userId,
                    questionId: data.questionId,
                    issueType: data.issueType,
                    description: data.description || null,
                },
                include: {
                    question: {
                        select: {
                            id: true,
                            questionText: true,
                            subject: true,
                            topic: true,
                        },
                    },
                },
            });

            return report;
        } catch (error) {
            // P2002 = Prisma unique constraint violation (race condition fallback)
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new AppError(
                    'You have already reported this issue for this question',
                    409,
                );
            }
            throw error;
        }
    }

    /**
     * Get all reports created by a specific user.
     *
     * Supports pagination and optional filtering by report status
     * (PENDING, REVIEWED, RESOLVED).
     */
    async getUserReports(userId: number, query: ReportQuery) {
        const { page, limit, status } = query;
        const skip = (page - 1) * limit;

        // Build the where clause - always filter by userId
        const where: Record<string, unknown> = { userId };

        // Add optional status filter
        if (status) {
            where.status = status;
        }

        // Fetch reports and total count in parallel for efficiency
        const [reports, total] = await Promise.all([
            prisma.questionReport.findMany({
                where,
                include: {
                    question: {
                        select: {
                            id: true,
                            questionText: true,
                            subject: true,
                            topic: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.questionReport.count({ where }),
        ]);

        return {
            reports,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get a single report by ID.
     *
     * Enforces ownership - users can only view their own reports.
     */
    async getReportById(userId: number, reportId: number) {
        const report = await prisma.questionReport.findUnique({
            where: { id: reportId },
            include: {
                question: {
                    select: {
                        id: true,
                        questionText: true,
                        subject: true,
                        topic: true,
                    },
                },
            },
        });

        if (!report) {
            throw new AppError('Report not found', 404);
        }

        // Ownership check - return 404 instead of 403 to avoid leaking
        // that the resource exists but belongs to another user
        if (report.userId !== userId) {
            throw new AppError('Report not found', 404);
        }

        return report;
    }

    /**
     * Delete a report by ID.
     *
     * Enforces two rules:
     * 1. Ownership - users can only delete their own reports
     * 2. Status check - only PENDING reports can be deleted
     *    (once reviewed/resolved, they become part of the audit trail)
     */
    async deleteReport(userId: number, reportId: number) {
        const report = await prisma.questionReport.findUnique({
            where: { id: reportId },
            select: { id: true, userId: true, status: true },
        });

        if (!report) {
            throw new AppError('Report not found', 404);
        }

        // Ownership check - return 404 to avoid leaking resource existence
        if (report.userId !== userId) {
            throw new AppError('Report not found', 404);
        }

        // Status check - only PENDING reports can be deleted
        if (report.status !== 'PENDING') {
            throw new AppError(
                `Cannot delete a report that has been ${report.status.toLowerCase()}. Only pending reports can be deleted.`,
                400,
            );
        }

        await prisma.questionReport.delete({
            where: { id: reportId },
        });

        return { success: true, message: 'Report deleted successfully' };
    }
}
