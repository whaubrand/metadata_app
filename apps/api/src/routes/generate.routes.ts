import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.middleware';
import { OpenAIService } from '../services/openai.service';
import { MetadataService } from '../services/metadata.service';
import { generateMetadataSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../utils/prisma';

export async function generateRoutes(fastify: FastifyInstance) {
  // Generate metadata from image and context
  fastify.post(
    '/generate',
    {
      preHandler: [authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authRequest = request as AuthenticatedRequest;
        const userId = authRequest.user.id;

        // Validate input
        const { filename, contextInput } = generateMetadataSchema.parse(request.body);

        // Verify the file exists and belongs to this user
        const image = await prisma.image.findFirst({
          where: { filename, userId },
        });
        if (!image) {
          return reply.status(404).send({
            success: false,
            error: 'Image not found',
          });
        }

        // Generate metadata using OpenAI (or mock if no API key)
        const metadata = await OpenAIService.generateMetadata(filename, contextInput);

        // Build image URL for storage
        const protocol = request.protocol;
        const host = request.hostname;
        const port = request.port ? `:${request.port}` : '';
        const baseUrl = `${protocol}://${host}${port}`;
        const imageUrl = `${baseUrl}/uploads/${filename}`;

        // Save to database
        const savedResult = await MetadataService.saveMetadata(
          userId,
          imageUrl,
          contextInput,
          metadata
        );

        return reply.status(201).send({
          success: true,
          data: {
            id: savedResult.id,
            ...metadata,
            imageUrl,
            contextInput,
            createdAt: savedResult.createdAt,
          },
          message: 'Metadata generated successfully',
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
}
