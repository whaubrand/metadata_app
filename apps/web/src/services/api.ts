import axios from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  User,
  UploadResponse,
  MetadataResult,
  PaginatedResults,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: async (email: string, password: string) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/register', {
      email,
      password,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  me: async () => {
    const response = await api.get<ApiResponse<{ user: User }>>('/api/auth/me');
    return response.data;
  },
};

// Upload API
export const uploadApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<UploadResponse>>('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Generate API
export const generateApi = {
  generate: async (imageUrl: string, contextInput: string) => {
    const response = await api.post<ApiResponse<MetadataResult>>('/api/generate', {
      imageUrl,
      contextInput,
    });
    return response.data;
  },
};

// Results API
export const resultsApi = {
  getAll: async (page: number = 1, limit: number = 10) => {
    const response = await api.get<ApiResponse<PaginatedResults>>(
      `/api/results?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<{ result: MetadataResult }>>(
      `/api/results/${id}`
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/api/results/${id}`);
    return response.data;
  },
};
