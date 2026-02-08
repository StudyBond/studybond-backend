import Fastify, { FastifyInstance } from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import prisma, { connectDatabase } from './config/database';
import { authPlugin } from './modules/auth/auth.plugin';
import { authenticate } from './shared/decorators/authenticate';

import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

export async function buildApp(): Promise<FastifyInstance> {
    const app = Fastify({
        logger: {
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            transport: process.env.NODE_ENV === 'development'
                ? {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'HH:MM:ss Z',
                        ignore: 'pid,hostname'
                    }
                }
                : undefined,
        },
        requestIdLogLabel: 'reqId',
        disableRequestLogging: false,
        trustProxy: true, // Trust X-Forwarded-* headers
    });

    /* ZOD TYPE PROVIDER SETUP
     * These compilers allow Fastify to use Zod schemas directly for request/response validation.
     * Without this, Fastify expects JSON Schema format by default.
     * This enables type-safe validation with automatic TypeScript inference in route handlers.
     */
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    /* Security Headers (Helmet)*/
    await app.register(fastifyHelmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        // HSTS: Force HTTPS (in production)
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },
    });

    /* CORS */
    await app.register(fastifyCors, {
        origin: (origin, callback) => {
            // In development: Allow any origin
            if (process.env.NODE_ENV === 'development') {
                callback(null, true);
                return;
            }

            // In production: Only allow specific origins
            const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true, // Allow cookies
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    });

    /* JWT AUTHENTICATION */
    await app.register(fastifyJwt, {
        secret: process.env.JWT_SECRET!,
        sign: {
            expiresIn: process.env.JWT_EXPIRY || '15m',
        },
    });

    /* RATE LIMITING */
    await app.register(fastifyRateLimit, {
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        timeWindow: process.env.RATE_LIMIT_WINDOW || '15m',
        cache: 10000, // Track up to 10k different IPs
        allowList: ['127.0.0.1'], // Never rate limit localhost (for testing)
        errorResponseBuilder: (_req, context) => ({
            success: false,
            message: `Too many requests. Try again after ${context.after}`,
            statusCode: 429,
            error: 'Too Many Requests',
        }),
    });

    /*DATABASE CONNECTION */
    try {
        await connectDatabase();
        app.decorate('prisma', prisma);
        app.log.info('✅ Prisma client decorated on app instance');
    } catch (error) {
        app.log.error('❌ Failed to connect to database');
        throw error;
    }
    await app.register(authenticate);

    // Swagger/OpenAPI documentation 
    const swaggerPlugin = (await import('./plugins/swagger')).default;
    await app.register(swaggerPlugin);

    await app.register(authPlugin);

    // Users module - profile management, stats, account deletion
    const { usersPlugin } = await import('./modules/users/users.plugin');
    await app.register(usersPlugin, { prefix: '/api/users' });

    /* HEALTH CHECK ENDPOINT */
    app.get('/health', async (_req, _reply) => {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
        };
    });

    /* ROOT ENDPOINT (API Info) */
    app.get('/', async (_req, _reply) => {
        return {
            name: 'StudyBond API',
            version: '1.0.0',
            status: 'running',
            documentation: '/api/docs', // We'll add Swagger later
            timestamp: new Date().toISOString(),
        };
    });

    /* GLOBAL ERROR HANDLER */
    app.setErrorHandler((error: any, req, reply) => {
        // Log the full error (with stack trace) for debugging
        req.log.error({
            error: {
                message: error.message,
                stack: error.stack,
                code: error.code,
            },
            request: {
                method: req.method,
                url: req.url,
                params: req.params,
                query: req.query,
            },
        }, 'Request error');

        const statusCode = error.statusCode || 500;
        return reply.status(statusCode).send({
            success: false,
            error: {
                message: error.message || 'Internal Server Error',
                statusCode,
                // Only show stack in development
                ...(process.env.NODE_ENV === 'development' && {
                    stack: error.stack
                }),
            },
            timestamp: new Date().toISOString(),
        });
    });

    /* 404 HANDLER */
    app.setNotFoundHandler((req, reply) => {
        req.log.warn({
            method: req.method,
            url: req.url,
        }, 'Route not found');

        return reply.status(404).send({
            success: false,
            error: {
                message: `Route ${req.method} ${req.url} not found`,
                statusCode: 404,
            },
            timestamp: new Date().toISOString(),
        });
    });

    /* REQUEST LOGGING HOOK */
    app.addHook('onRequest', async (req, _reply) => {
        req.log.info({
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        }, 'Incoming request');
    });

    /* RESPONSE LOGGING HOOK */
    app.addHook('onResponse', async (req, reply) => {
        req.log.info({
            method: req.method,
            url: req.url,
            statusCode: reply.statusCode,
            responseTime: reply.elapsedTime, // In milliseconds
        }, 'Request completed');
    });

    app.log.info('✅ Fastify app configured successfully');

    return app;
}