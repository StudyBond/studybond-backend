// src/modules/reports/reports.routes.ts
// Route definitions for the Reports module

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ReportsController } from './reports.controller';
import {
    createReportSchema,
    reportQuerySchema,
    reportIdParamSchema,
    reportResponseSchema,
    reportListResponseSchema,
    reportSuccessResponseSchema,
} from './reports.schema';

/**
 * Registers all report routes.
 * All routes require JWT authentication via preValidation hook.
 *
 * Endpoints:
 * - POST   /           Create a new question report
 * - GET    /           List user's own reports (paginated, filterable)
 * - GET    /:id        Get single report by ID
 * - DELETE /:id        Delete a pending report
 */
export async function reportRoutes(app: FastifyInstance) {
    const controller = new ReportsController();

    const server = app.withTypeProvider<ZodTypeProvider>();

    /**
     * POST /
     * Create a new question report.
     * Prevents duplicate reports (same user + question + issue type).
     */
    server.post('/', {
        preValidation: [app.authenticate],
        schema: {
            body: createReportSchema,
            tags: ['Reports'],
            summary: 'Report a question issue',
            description: 'Create a new report for a question. Users can report wrong answers, typos, ambiguous wording, or missing images. Duplicate reports (same user, question, and issue type) are prevented.',
            security: [{ bearerAuth: [] }],
            response: {
                201: reportResponseSchema,
            },
        },
    }, controller.createReport);

    /**
     * GET /
     * List all reports created by the authenticated user.
     * Supports pagination and optional status filtering.
     */
    server.get('/', {
        preValidation: [app.authenticate],
        schema: {
            querystring: reportQuerySchema,
            tags: ['Reports'],
            summary: 'List your reports',
            description: 'Returns a paginated list of reports created by the authenticated user. Optionally filter by status (PENDING, REVIEWED, RESOLVED).',
            security: [{ bearerAuth: [] }],
            response: {
                200: reportListResponseSchema,
            },
        },
    }, controller.getUserReports);

    /**
     * GET /:id
     * Get a single report by its ID.
     * Ownership enforced - only the creator can view.
     */
    server.get('/:id', {
        preValidation: [app.authenticate],
        schema: {
            params: reportIdParamSchema,
            tags: ['Reports'],
            summary: 'Get a report by ID',
            description: 'Returns a single report. Users can only view reports they created.',
            security: [{ bearerAuth: [] }],
            response: {
                200: reportResponseSchema,
            },
        },
    }, controller.getReportById);

    /**
     * DELETE /:id
     * Delete a report.
     * Only PENDING reports can be deleted. Ownership enforced.
     */
    server.delete('/:id', {
        preValidation: [app.authenticate],
        schema: {
            params: reportIdParamSchema,
            tags: ['Reports'],
            summary: 'Delete a pending report',
            description: 'Deletes a report. Only reports with PENDING status can be deleted. Users can only delete their own reports.',
            security: [{ bearerAuth: [] }],
            response: {
                200: reportSuccessResponseSchema,
            },
        },
    }, controller.deleteReport);
}
