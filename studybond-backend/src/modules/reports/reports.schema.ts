// src/modules/reports/reports.schema.ts
// Zod validation schemas for the Reports module

import { z } from 'zod';


// CONSTANTS

/**
 * Business rule limits - centralized for easy modification.
 * Description max length is 500 characters to allow enough detail
 * for users to explain the issue while keeping reports concise.
 */
export const REPORT_LIMITS = {
    DESCRIPTION_MAX_CHARS: 500,
} as const;

/**
 * Valid issue types that can be reported for a question.
 * Maps directly to the Prisma ReportIssueType enum.
 */
export const REPORT_ISSUE_TYPES = [
    'WRONG_ANSWER',
    'TYPO',
    'AMBIGUOUS',
    'IMAGE_MISSING',
    'OTHER',
] as const;

/**
 * Valid report statuses for filtering.
 * Maps directly to the Prisma ReportStatus enum.
 */
export const REPORT_STATUSES = [
    'PENDING',
    'REVIEWED',
    'RESOLVED',
] as const;


// REQUEST SCHEMAS

/**
 * Schema for creating a new question report.
 * - questionId: Required - which question to report
 * - issueType: Required - what type of issue (WRONG_ANSWER, TYPO, etc.)
 * - description: Optional - additional details about the issue (max 500 chars)
 */
export const createReportSchema = z.object({
    questionId: z.number().int().positive('Question ID must be a positive integer'),
    issueType: z.enum(REPORT_ISSUE_TYPES, {
        message: `Issue type must be one of: ${REPORT_ISSUE_TYPES.join(', ')}`,
    }),
    description: z.string().max(REPORT_LIMITS.DESCRIPTION_MAX_CHARS,
        `Description cannot exceed ${REPORT_LIMITS.DESCRIPTION_MAX_CHARS} characters`).optional(),
});

/**
 * Schema for report list query parameters.
 * Supports pagination and filtering by status.
 */
export const reportQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(REPORT_STATUSES).optional(),
});

/**
 * Schema for report ID parameter.
 */
export const reportIdParamSchema = z.object({
    id: z.coerce.number().int().positive('Report ID must be a positive integer'),
});


// RESPONSE SCHEMAS (for Swagger documentation)

/**
 * Question summary embedded in report response.
 * Only includes fields needed for display context.
 */
export const questionSummarySchema = z.object({
    id: z.number(),
    questionText: z.string(),
    subject: z.string(),
    topic: z.string().nullable(),
});

/**
 * Single report response schema.
 */
export const reportResponseSchema = z.object({
    id: z.number(),
    questionId: z.number(),
    issueType: z.enum(REPORT_ISSUE_TYPES),
    description: z.string().nullable(),
    status: z.enum(REPORT_STATUSES),
    createdAt: z.date(),
    updatedAt: z.date(),
    question: questionSummarySchema,
});

/**
 * Paginated reports list response schema.
 */
export const reportListResponseSchema = z.object({
    reports: z.array(reportResponseSchema),
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
export const reportSuccessResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});


// TYPE EXPORTS

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type ReportIdParam = z.infer<typeof reportIdParamSchema>;
export type ReportResponse = z.infer<typeof reportResponseSchema>;
export type ReportListResponse = z.infer<typeof reportListResponseSchema>;
