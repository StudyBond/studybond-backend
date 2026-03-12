// src/jobs/cleanup.ts
// Scheduled job: Deletes expired bookmarks from the database

import cron from 'node-cron';
import { prisma } from '../config/database';

/**
 * Runs daily at midnight (00:00) to remove bookmarks that have passed
 * their expiresAt date. This keeps the database clean and prevents
 * free-user bookmarks from persisting beyond their 30-day window.
 */

export function startBookmarkCleanupJob() {
    // Schedule: every day at midnight
    cron.schedule('0 0 * * *', async () => {
        try {
            const result = await prisma.bookmarkedQuestion.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(), // Expired = expiresAt is in the past
                    },
                },
            });

            if (result.count > 0) {
                console.log(`[CRON] Cleaned up ${result.count} expired bookmark(s)`);
            }
        } catch (error) {
            console.error('[CRON] Bookmark cleanup failed:', error);
        }
    });

    console.log('⏰ Bookmark cleanup job scheduled (daily at midnight)');
}
