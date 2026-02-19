/**
 * Goals Service
 * Handles goal CRUD operations and progress calculation
 */

import { apiClient } from '../index';
import type {
  Goal,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalProgress,
  GoalsQuery,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
} from '../../contracts/types';

export type GoalResponse = ApiSuccessResponse<Goal> | ApiErrorResponse;
export type GoalProgressResponse = ApiSuccessResponse<GoalProgress> | ApiErrorResponse;
export type PaginatedGoalsResponse = PaginatedResponse<Goal>;

export class GoalsService {
  private readonly basePath = '/api/goals';

  /**
   * Get goals with pagination and filtering
   */
  async getGoals(query?: GoalsQuery): Promise<{ data: Goal[]; success: true; meta: any }> {
    const response = await apiClient.get<PaginatedGoalsResponse>(
      this.basePath,
      query
    );

    if (!response.success) {
      throw new Error('Failed to fetch goals');
    }

    return response;
  }

  /**
   * Get active goals for a user
   */
  async getActiveGoals(userId: string): Promise<Goal[]> {
    const response = await apiClient.get<ApiSuccessResponse<Goal[]>>(
      `${this.basePath}/active`,
      { userId }
    );

    if (!response.success) {
      throw new Error('Failed to fetch goals');
    }

    return response.data;
  }

  /**
   * Get a single goal by ID
   */
  async getGoal(goalId: string): Promise<Goal> {
    const response = await apiClient.get<GoalResponse>(
      `${this.basePath}/${goalId}`
    );

    if (!response.success) {
      throw new Error('Failed to fetch goals');
    }

    return response.data;
  }

  /**
   * Calculate goal progress
   */
  async getGoalProgress(goalId: string): Promise<GoalProgress> {
    const response = await apiClient.get<GoalProgressResponse>(
      `${this.basePath}/${goalId}/progress`
    );

    if (!response.success) {
      throw new Error('Failed to fetch goals');
    }

    return response.data;
  }

  /**
   * Create a new goal
   */
  async createGoal(data: CreateGoalRequest): Promise<Goal> {
    const response = await apiClient.post<GoalResponse>(
      this.basePath,
      data
    );

    if (!response.success) {
      throw new Error('Failed to fetch goals');
    }

    return response.data;
  }

  /**
   * Update a goal
   */
  async updateGoal(goalId: string, data: UpdateGoalRequest): Promise<Goal> {
    const response = await apiClient.patch<GoalResponse>(
      `${this.basePath}/${goalId}`,
      data
    );

    if (!response.success) {
      throw new Error('Failed to fetch goals');
    }

    return response.data;
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${goalId}`);
  }
}

export const goalsService = new GoalsService();
export default goalsService;
