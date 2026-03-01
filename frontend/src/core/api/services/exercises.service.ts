/**
 * Exercises Service
 * Handles exercise CRUD operations
 */

import { apiClient } from '../index';
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
} from '../../contracts/types';

export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  duration_minutes: number;
  calories_burned: number | null;
  created_at: string;
}

export interface CreateExerciseRequest {
  userId: string;
  name: string;
  durationMinutes: number;
  caloriesBurned?: number;
}

export interface UpdateExerciseRequest {
  userId: string;
  name?: string;
  durationMinutes?: number;
  caloriesBurned?: number | null;
}

export interface ExercisesQuery {
  userId: string;
  page?: number;
  pageSize?: number;
}

export interface ExerciseSummary {
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
}

export type ExerciseResponse = ApiSuccessResponse<Exercise> | ApiErrorResponse;
export type PaginatedExercisesResponse = PaginatedResponse<Exercise>;

export class ExercisesService {
  private readonly basePath = '/api/exercises';

  /**
   * Get exercises with pagination
   */
  async getExercises(query: ExercisesQuery): Promise<{ data: Exercise[]; success: true; meta: any }> {
    const response = await apiClient.get<PaginatedExercisesResponse>(
      this.basePath,
      query
    );

    if (!response.success) {
      throw new Error('Failed to fetch exercises');
    }

    return response;
  }

  /**
   * Get exercise summary
   */
  async getExerciseSummary(userId: string, startDate?: string, endDate?: string): Promise<ExerciseSummary> {
    const params: Record<string, string> = { userId };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get<ApiSuccessResponse<ExerciseSummary>>(
      `${this.basePath}/summary`,
      params
    );

    if (!response.success) {
      throw new Error('Failed to fetch exercise summary');
    }

    return response.data;
  }

  /**
   * Get a single exercise by ID
   */
  async getExercise(exerciseId: string, userId: string): Promise<Exercise> {
    const response = await apiClient.get<ExerciseResponse>(
      `${this.basePath}/${exerciseId}`,
      { userId }
    );

    if (!response.success) {
      throw new Error('Failed to fetch exercise');
    }

    return response.data;
  }

  /**
   * Create a new exercise
   */
  async createExercise(request: CreateExerciseRequest): Promise<Exercise> {
    const response = await apiClient.post<ExerciseResponse>(
      this.basePath,
      request
    );

    if (!response.success) {
      throw new Error('Failed to create exercise');
    }

    return response.data;
  }

  /**
   * Update an exercise
   */
  async updateExercise(exerciseId: string, request: UpdateExerciseRequest): Promise<Exercise> {
    const response = await apiClient.patch<ExerciseResponse>(
      `${this.basePath}/${exerciseId}`,
      request
    );

    if (!response.success) {
      throw new Error('Failed to update exercise');
    }

    return response.data;
  }

  /**
   * Delete an exercise
   */
  async deleteExercise(exerciseId: string, userId: string): Promise<void> {
    const response = await apiClient.delete<ApiSuccessResponse<{ id: string }>>(
      `${this.basePath}/${exerciseId}?userId=${userId}`
    );

    if (!response.success) {
      throw new Error('Failed to delete exercise');
    }
  }
}

const exercisesService = new ExercisesService();
export default exercisesService;
