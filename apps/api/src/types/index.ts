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
  seoTitle: string;
  metaDescription: string;
  altText: string;
  socialCaption: string;
  recommendedChannel: string;
  channelExplanation: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
