// src/modules/users/users.plugin.ts
// Fastify plugin wrapper for the Users module

import { FastifyInstance } from 'fastify';
import { usersRoutes } from './users.routes';

export async function usersPlugin(app: FastifyInstance) {
    // Register routes - prefix will be set in app.ts when registering this plugin
    await app.register(usersRoutes);

    app.log.info('✅ Users module registered');
}
