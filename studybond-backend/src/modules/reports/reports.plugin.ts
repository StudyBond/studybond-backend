// src/modules/reports/reports.plugin.ts
// Fastify plugin wrapper for the Reports module

import { FastifyInstance } from 'fastify';
import { reportRoutes } from './reports.routes';

/**
 * Reports plugin - registers all report-related routes.
 * Mounted at /api/reports in app.ts.
 */
export async function reportsPlugin(app: FastifyInstance) {
    app.register(reportRoutes);
}
