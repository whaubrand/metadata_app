import { FastifyRequest } from 'fastify';

// Authenticated request with user payload
export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
  };
}

// Metadata generation result
export interface MetadataResult {
  suggestedFilename: string;
  title: string;
  altText: string;
  caption: string;
  description: string;
  seoKeywords: string;
  clarifyingQuestions: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
