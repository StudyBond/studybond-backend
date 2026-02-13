// src/jobs/index.ts
// Central entry point for all scheduled jobs

import { startBookmarkCleanupJob } from './cleanup';

/**
 * Starts all scheduled background jobs.
 * Called once from server.ts after the app has started.
 */
export function startScheduledJobs() {
    startBookmarkCleanupJob();
    // Future jobs can be added here:
}
