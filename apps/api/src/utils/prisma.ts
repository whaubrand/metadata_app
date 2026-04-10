import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle connection errors
prisma.$connect().catch((err) => {
  console.error('❌ Failed to connect to database:', err);
  process.exit(1);
});
