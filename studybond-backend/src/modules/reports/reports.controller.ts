// src/modules/reports/reports.controller.ts
// Request handlers for the Reports module

import { FastifyRequest, FastifyReply } from 'fastify';
import { ReportsService } from './reports.service';
import type { CreateReportInput, ReportQuery } from './reports.schema';

/**
 * ReportsController handles HTTP request/response logic.
 * Extracts user ID from JWT, casts request body/params/query,
 * and delegates business logic to ReportsService.
 */
export class ReportsController {
    private reportsService: ReportsService;

    constructor() {
        this.reportsService = new ReportsService();
    }

    /**
     * POST /api/reports
     * Creates a new question report.
     * Body contains: questionId (required), issueType (required), description (optional)
     */
    createReport = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as { userId: number }).userId;
        const body = req.body as CreateReportInput;
        const report = await this.reportsService.createReport(userId, body);
        return reply.code(201).send(report);
    };

    /**
     * GET /api/reports
     * Lists the authenticated user's reports with pagination and optional status filter.
     */
    getUserReports = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as { userId: number }).userId;
        const query = req.query as ReportQuery;
        const result = await this.reportsService.getUserReports(userId, query);
        return reply.send(result);
    };

    /**
     * GET /api/reports/:id
     * Gets a single report by ID (ownership enforced in service).
     */
    getReportById = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as { userId: number }).userId;
        const { id: reportId } = req.params as { id: number };
        const report = await this.reportsService.getReportById(userId, reportId);
        return reply.send(report);
    };

    /**
     * DELETE /api/reports/:id
     * Deletes a report (only if PENDING, ownership enforced in service).
     */
    deleteReport = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as { userId: number }).userId;
        const { id: reportId } = req.params as { id: number };
        const result = await this.reportsService.deleteReport(userId, reportId);
        return reply.send(result);
    };
}
