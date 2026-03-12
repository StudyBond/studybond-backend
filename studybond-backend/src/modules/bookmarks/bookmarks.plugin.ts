// src/modules/bookmarks/bookmarks.plugin.ts
// Fastify plugin wrapper for the Bookmarks module

import { FastifyInstance } from 'fastify';
import { bookmarksRoutes } from './bookmarks.routes';

export async function bookmarksPlugin(app: FastifyInstance) {
    // Register routes - prefix '/api/bookmarks' is set in app.ts
    await app.register(bookmarksRoutes);

    app.log.info('✅ Bookmarks module registered');
}
