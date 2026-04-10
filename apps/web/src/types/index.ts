// User types
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

// Auth types
export interface AuthResponse {
  user: User;
  token: string;
}

// Metadata types
export interface MetadataResult {
  id: string;
  imageUrl: string;
  contextInput: string;
  suggestedFilename: string;
  title: string;
  altText: string;
  caption: string;
  description: string;
  seoKeywords: string;
  clarifyingQuestions: string;
  createdAt: string;
}

// Upload response
export interface UploadResponse {
  filename: string;
  url: string;
  mimetype: string;
  size: number;
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResults {
  results: MetadataResult[];
  pagination: Pagination;
}
