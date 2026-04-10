import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.middleware';
import { UploadService } from '../services/upload.service';
import { AuthenticatedRequest } from '../types';

export async function uploadRoutes(fastify: FastifyInstance) {
  // Upload image
  fastify.post(
    '/upload',
    {
      preHandler: [authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authRequest = request as AuthenticatedRequest;
        const userId = authRequest.user.id;

        // Get uploaded file
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({
            success: false,
            error: 'No file uploaded',
          });
        }

        // Save file
        const fileData = await UploadService.saveFile(data, userId);

        // Generate image URL
        const protocol = request.protocol;
        const host = request.hostname;
        const port = request.port ? `:${request.port}` : '';
        const baseUrl = `${protocol}://${host}${port}`;
        const imageUrl = UploadService.getImageUrl(fileData.filename, baseUrl);

        return reply.status(201).send({
          success: true,
          data: {
            filename: fileData.filename,
            url: imageUrl,
            mimetype: fileData.mimetype,
            size: fileData.size,
          },
          message: 'File uploaded successfully',
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

  // Serve uploaded images
  fastify.get('/uploads/:filename', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { filename } = request.params as { filename: string };
      const fs = await import('fs/promises');
      const path = await import('path');
      const { config } = await import('../utils/config');

      const filepath = path.join(config.uploadDir, filename);

      // Check if file exists
      try {
        await fs.access(filepath);
      } catch {
        return reply.status(404).send({
          success: false,
          error: 'File not found',
        });
      }

      // Send file
      return reply.sendFile(filename, config.uploadDir);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });
}
