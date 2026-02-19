/**
 * Logs Service
 * Handles food log CRUD operations
 */

import { apiClient } from '../index';
import type {
  FoodLog,
  CreateFoodLogRequest,
  UpdateFoodLogRequest,
  FoodLogsQuery,
  TodayLogsResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
} from '../../contracts/types';

export interface ParsedFood {
  quantity: number;
  unit: string;
  foodName: string;
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  };
}

export type LogsResponse = ApiSuccessResponse<FoodLog> | ApiErrorResponse;
export type TodayResponse = ApiSuccessResponse<TodayLogsResponse> | ApiErrorResponse;
export type PaginatedLogsResponse = PaginatedResponse<FoodLog>;

export class LogsService {
  private readonly basePath = '/api/logs';

  /**
   * Parse food text and extract nutrition information
   */
  async parseFoodText(text: string): Promise<ParsedFood> {
    const response = await apiClient.post<ApiSuccessResponse<ParsedFood>>(
      `${this.basePath}/parse`,
      { text }
    );

    if (!response.success) {
      throw new Error('Failed to parse food text');
    }

    return response.data;
  }

  /**
   * Get food logs with pagination and filtering
   */
  async getLogs(query?: FoodLogsQuery): Promise<{ data: FoodLog[]; success: true; meta: any }> {
    const response = await apiClient.get<PaginatedLogsResponse>(
      this.basePath,
      query
    );

    if (!response.success) {
      throw new Error('Failed to fetch logs');
    }

    return response;
  }

  /**
   * Get today's food logs grouped by meal type
   */
  async getTodayLogs(userId: string): Promise<TodayLogsResponse> {
    const response = await apiClient.get<TodayResponse>(
      `${this.basePath}/today`,
      { userId }
    );

    if (!response.success) {
      throw new Error('Failed to fetch logs');
    }

    return response.data;
  }

  /**
   * Get a single food log by ID
   */
  async getLog(logId: string): Promise<FoodLog> {
    const response = await apiClient.get<LogsResponse>(
      `${this.basePath}/${logId}`
    );

    if (!response.success) {
      throw new Error('Failed to fetch logs');
    }

    return response.data;
  }

  /**
   * Create a new food log
   */
  async createLog(data: CreateFoodLogRequest): Promise<FoodLog> {
    const response = await apiClient.post<LogsResponse>(
      this.basePath,
      data
    );

    if (!response.success) {
      throw new Error('Failed to fetch logs');
    }

    return response.data;
  }

  /**
   * Update a food log
   */
  async updateLog(logId: string, data: UpdateFoodLogRequest): Promise<FoodLog> {
    const response = await apiClient.patch<LogsResponse>(
      `${this.basePath}/${logId}`,
      data
    );

    if (!response.success) {
      throw new Error('Failed to fetch logs');
    }

    return response.data;
  }

  /**
   * Delete a food log (soft delete)
   */
  async deleteLog(logId: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${logId}`);
  }
}

export const logsService = new LogsService();
export default logsService;
