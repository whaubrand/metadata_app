import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.middleware';
import { MetadataService } from '../services/metadata.service';
import { AuthenticatedRequest } from '../types';

export async function resultsRoutes(fastify: FastifyInstance) {
  // Get all results for user with pagination
  fastify.get(
    '/results',
    {
      preHandler: [authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authRequest = request as AuthenticatedRequest;
        const userId = authRequest.user.id;

        // Get query parameters
        const { page = '1', limit = '10' } = request.query as {
          page?: string;
          limit?: string;
        };

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        // Validate pagination parameters
        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid pagination parameters',
          });
        }

        const data = await MetadataService.getUserResults(userId, pageNum, limitNum);

        return reply.send({
          success: true,
          data,
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
    }
  );

  // Get single result by ID
  fastify.get(
    '/results/:id',
    {
      preHandler: [authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authRequest = request as AuthenticatedRequest;
        const userId = authRequest.user.id;
        const { id } = request.params as { id: string };

        const result = await MetadataService.getResultById(id, userId);

        return reply.send({
          success: true,
          data: { result },
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

  // Delete result by ID
  fastify.delete(
    '/results/:id',
    {
      preHandler: [authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authRequest = request as AuthenticatedRequest;
        const userId = authRequest.user.id;
        const { id } = request.params as { id: string };

        const result = await MetadataService.deleteResult(id, userId);

        return reply.send({
          success: true,
          message: result.message,
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
