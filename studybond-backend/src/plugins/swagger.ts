// src/plugins/swagger.ts
// Swagger/OpenAPI documentation plugin for StudyBond API

import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';

/**
 * Registers Swagger (OpenAPI) documentation for the API.
 * - OpenAPI spec available at /api/docs/json
 * - Interactive UI available at /api/docs
 * 
 * Works automatically with Zod schemas via fastify-type-provider-zod.
 */
async function swaggerPlugin(app: FastifyInstance) {
    // Register @fastify/swagger for OpenAPI spec generation
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'StudyBond API',
                description: 'Backend API for StudyBond - A study platform for exam preparation with past questions, collaboration, and AI-powered features.',
                version: '1.0.0',
                contact: {
                    name: 'StudyBond Team',
                },
            },
            servers: [
                {
                    url: process.env.API_URL || 'http://localhost:5000',
                    description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
                },
            ],
            // Security scheme for JWT authentication
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'Enter your JWT token obtained from /api/auth/login',
                    },
                },
            },
            // Tags for organizing endpoints
            tags: [
                { name: 'Auth', description: 'Authentication endpoints (register, login, OTP)' },
                { name: 'Users', description: 'User profile and statistics management' },
                { name: 'Exams', description: 'Exam creation and management' },
                { name: 'Questions', description: 'Questions and answers' },
                { name: 'Bookmarks', description: 'Question bookmarking' },
                { name: 'Collaboration', description: 'Group study sessions' },
                { name: 'Leaderboard', description: 'Rankings and study points' },
                { name: 'Streaks', description: 'Study streak tracking' },
                { name: 'AI', description: 'AI-powered explanations' },
                { name: 'Subscriptions', description: 'Premium subscription management' },
                { name: 'Admin', description: 'Admin-only endpoints' },
                { name: 'Reports', description: 'Question and user reporting' },
            ],
        },
    });

    // Register Swagger UI for interactive documentation
    await app.register(swaggerUi, {
        routePrefix: '/api/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
            displayRequestDuration: true,
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
    });

    app.log.info('✅ Swagger documentation registered at /api/docs');
}

// Export as Fastify plugin with metadata
export default fp(swaggerPlugin, {
    name: 'swagger',
    dependencies: [],
});
