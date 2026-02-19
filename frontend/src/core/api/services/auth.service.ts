/**
 * Auth Service
 * Handles user authentication and session management
 */

import { apiClient, tokenManager } from '../index';
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  LoginRequest,
  ApiSuccessResponse,
  ApiErrorResponse,
} from '../../contracts/types';

export type AuthResponse = ApiSuccessResponse<User> | ApiErrorResponse;

export class AuthService {
  private readonly basePath = '/api/auth';

  /**
   * Register a new user
   */
  async register(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<AuthResponse>(
      `${this.basePath}/register`,
      data
    );

    if (!response.success) {
      throw new Error('Auth operation failed');
    }

    // Store tokens (MVP: userId from response, no actual token yet)
    tokenManager.setTokens('mock-token', response.data.id);

    return response.data;
  }

  /**
   * Sign up a new user (alias for register)
   */
  async signup(data: CreateUserRequest & { password: string }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      `${this.basePath}/register`,
      data
    );
    return response;
  }

  /**
   * Login a user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      `${this.basePath}/login`,
      data
    );

    if (response.success) {
      // Store tokens (MVP: userId from response, no actual token yet)
      tokenManager.setTokens('mock-token', response.data.id);
    }

    return response;
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User> {
    const response = await apiClient.get<AuthResponse>(
      `${this.basePath}/user/${userId}`
    );

    if (!response.success) {
      throw new Error('Auth operation failed');
    }

    return response.data;
  }

  /**
   * Get current logged-in user
   */
  async getCurrentUser(): Promise<User> {
    const userId = tokenManager.getUserId();
    if (!userId) {
      throw new Error('No user logged in');
    }
    return this.getUser(userId);
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.patch<AuthResponse>(
      `${this.basePath}/user/${userId}`,
      data
    );

    if (!response.success) {
      throw new Error('Auth operation failed');
    }

    return response.data;
  }

  /**
   * Update current user
   */
  async updateCurrentUser(data: UpdateUserRequest): Promise<User> {
    const userId = tokenManager.getUserId();
    if (!userId) {
      throw new Error('No user logged in');
    }
    return this.updateUser(userId, data);
  }

  /**
   * Submit consents
   */
  async submitConsents(data: { userId: string; consents: Record<string, boolean> }): Promise<void> {
    await apiClient.post(`${this.basePath}/user/${data.userId}/consents`, {
      consents: data.consents,
    });
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(data: { userId: string }): Promise<void> {
    await apiClient.patch(`${this.basePath}/user/${data.userId}/onboarding`, {
      onboardingComplete: true,
    });
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/user/${userId}`);

    // Clear tokens if deleting current user
    if (tokenManager.getUserId() === userId) {
      tokenManager.clearTokens();
    }
  }

  /**
   * Logout current user
   */
  logout(): void {
    tokenManager.clearTokens();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return tokenManager.getUserId();
  }
}

export const authService = new AuthService();
export default authService;
