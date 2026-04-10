import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Metadata generation validation schema
export const generateMetadataSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  contextInput: z.string().min(1, 'Context input is required').max(500, 'Context input too long'),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GenerateMetadataInput = z.infer<typeof generateMetadataSchema>;
