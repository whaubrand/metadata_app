import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',

  // Gemini
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Upload
  uploadDir: process.env.UPLOAD_DIR || './uploads',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
} as const;

// Validate required environment variables
export function validateConfig() {
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env file');
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not set — using mock metadata generation');
  }
}
