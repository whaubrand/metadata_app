import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../utils/validation';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password } = registerSchema.parse(request.body);

      const user = await AuthService.register(email, password);

      // Generate JWT token
      const token = fastify.jwt.sign(
        { id: user.id, email: user.email },
        { expiresIn: '7d' }
      );

      return reply.status(201).send({
        success: true,
        data: {
          user,
          token,
        },
        message: 'User registered successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        });
      }
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      const user = await AuthService.login(email, password);

      // Generate JWT token
      const token = fastify.jwt.sign(
        { id: user.id, email: user.email },
        { expiresIn: '7d' }
      );

      return reply.send({
        success: true,
        data: {
          user,
          token,
        },
        message: 'Login successful',
      });
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(401).send({
          success: false,
          error: error.message,
        });
      }
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Get current user (protected route)
  fastify.get(
    '/me',
    {
      preHandler: [authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authRequest = request as AuthenticatedRequest;
        const userId = authRequest.user.id;

        const user = await AuthService.getUserById(userId);

        return reply.send({
          success: true,
          data: { user },
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(404).send({
            success: false,
            error: error.message,
          });
        }
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );
}
