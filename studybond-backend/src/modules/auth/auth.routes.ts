import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AuthController } from './auth.controller';
import { registerSchema, loginSchema, verifyOtpSchema } from './auth.schema';

export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController();
  // Wrap the Fastify instance with ZodTypeProvider to enable Zod schema validation.
  // This allows us to pass Zod schemas directly to route definitions and get full TypeScript inference.
  const server = app.withTypeProvider<ZodTypeProvider>();

  /*
  app.post('/register', {
    schema: {
      body: registerSchema,
      tags: ['Auth'],
      description: 'Register a new user and device',
    }
  }, controller.register);
  */
  server.post('/register', {
    schema: {
      body: registerSchema,
      tags: ['Auth'],
      description: 'Register a new user and device',
    }
  }, controller.register);

  /*
  app.post('/login', {
    schema: {
      body: loginSchema,
      tags: ['Auth'],
      description: 'Login user (may return requiresOTP: true)',
    }
  }, controller.login);
  */
  server.post('/login', {
    schema: {
      body: loginSchema,
      tags: ['Auth'],
      description: 'Login user (may return requiresOTP: true)',
    }
  }, controller.login);

  /*
  app.post('/verify-otp', {
    schema: {
      body: verifyOtpSchema,
      tags: ['Auth'],
      description: 'Verify new device with email OTP',
    }
  }, controller.verifyOtp);
  */
  server.post('/verify-otp', {
    schema: {
      body: verifyOtpSchema,
      tags: ['Auth'],
      description: 'Verify new device with email OTP',
    }
  }, controller.verifyOtp);

  /*
  app.get('/me', {
    preValidation: [app.authenticate], // Assuming we have this decorator from app.ts setup
  }, controller.me);
  */
  server.get('/me', {
    preValidation: [app.authenticate], // Assuming we have this decorator from app.ts setup
  }, controller.me);
}