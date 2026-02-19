/**
 * API Client with interceptors for auth, errors, and idempotency
 * Uses axios for HTTP requests
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ============================================================================
// Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  public code: string;
  public details?: unknown;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ============================================================================
// Token Management (MVP: Simple in-memory storage)
// ============================================================================

class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  setTokens(accessToken: string, userId: string): void {
    this.accessToken = accessToken;
    this.userId = userId;
    // In production, store in secure httpOnly cookie or localStorage with caution
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('userId', userId);
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    this.userId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userId');
    }
  }

  getAccessToken(): string | null {
    if (this.accessToken) {
      return this.accessToken;
    }
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  getUserId(): string | null {
    if (this.userId) {
      return this.userId;
    }
    if (typeof window !== 'undefined') {
      this.userId = localStorage.getItem('userId');
    }
    return this.userId;
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null && this.getUserId() !== null;
  }
}

// ============================================================================
// Idempotency Key Generator
// ============================================================================

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add auth token if available
        const token = TokenManager.getInstance().getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add idempotency key for write operations
        if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
          if (config.headers) {
            config.headers['Idempotency-Key'] = generateIdempotencyKey();
          }
        }

        // Add request timestamp
        if (config.headers) {
          config.headers['X-Request-Timestamp'] = new Date().toISOString();
        }

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  private handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as { error?: ApiError };

      if (data?.error) {
        // API-formatted error
        throw new ApiClientError(
          data.error.code,
          data.error.message,
          status,
          data.error.details
        );
      }

      // Non-API formatted error
      throw new ApiClientError(
        'http_error',
        error.message || 'An unexpected error occurred',
        status
      );
    } else if (error.request) {
      // Request was made but no response received
      throw new ApiClientError(
        'network_error',
        'Unable to connect to the server. Please check your internet connection.',
        0
      );
    } else {
      // Error in request setup
      throw new ApiClientError(
        'request_error',
        error.message || 'Failed to make request',
        0
      );
    }
  }

  // ============================================================================
  // HTTP Methods
  // ============================================================================

  async get<T>(url: string, params?: unknown): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  // Get the underlying axios instance for advanced usage
  getInstance(): AxiosInstance {
    return this.client;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const apiClient = new ApiClient();
export const tokenManager = TokenManager.getInstance();
export default apiClient;
