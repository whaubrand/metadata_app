import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { config } from './utils/config';
import { prisma } from './utils/prisma';
import { authRoutes } from './routes/auth.routes';
import { uploadRoutes } from './routes/upload.routes';
import { generateRoutes } from './routes/generate.routes';
import { resultsRoutes } from './routes/results.routes';

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'error',
  },
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: config.frontendUrl,
    credentials: true,
  });

  // JWT
  await fastify.register(jwt, {
    secret: config.jwtSecret,
  });

  // Multipart (file uploads)
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
  });

  // Static file serving
  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), config.uploadDir),
    prefix: '/uploads/',
  });
}

// Register routes
async function registerRoutes() {
  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Auth routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });

  // Upload routes
  await fastify.register(uploadRoutes, { prefix: '/api' });

  // Generate routes
  await fastify.register(generateRoutes, { prefix: '/api' });

  // Results routes
  await fastify.register(resultsRoutes, { prefix: '/api' });
}

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    await fastify.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    console.log(`🚀 Server running at http://localhost:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();
