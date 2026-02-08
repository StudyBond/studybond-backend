import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export const authenticate = fp(async (fastify: FastifyInstance) => {
    fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            // Return 401 Unauthorized and stop request processing
            reply.code(401).send({
                success: false,
                error: {
                    message: 'Unauthorized: Invalid or missing token',
                    statusCode: 401,
                },
            });
            throw err; // Prevents the route handler from executing
        }
    });
});

