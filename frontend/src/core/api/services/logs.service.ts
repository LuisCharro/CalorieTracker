/**
 * Logs Service
 * Handles food log CRUD operations with offline queue support
 */

import { apiClient, ApiClientError } from '../index';
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
import {
  addToQueue,
  isOnline,
} from './offline-queue.service';
import { tokenManager } from '../client';

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
   * Create a new food log with offline support
   */
  async createLog(data: CreateFoodLogRequest): Promise<FoodLog> {
    try {
      const response = await apiClient.post<LogsResponse>(
        this.basePath,
        data
      );

      if (!response.success) {
        throw new Error('Failed to create log');
      }

      return response.data;
    } catch (error) {
      // Check if it's a network error and we're offline
      if (error instanceof ApiClientError && error.code === 'network_error' && !isOnline()) {
        console.log('[Logs Service] Offline detected, queuing create_log operation');

        // Generate optimistic ID for UI
        const optimisticId = `local_${Date.now()}`;
        const userId = tokenManager.getUserId() || 'unknown';

        // Add to offline queue
        addToQueue({
          type: 'create_log',
          data: {
            ...data,
            userId,
            localId: optimisticId,
          },
          timestamp: new Date().toISOString(),
        });

        // Return optimistic result for UI
        return {
          id: optimisticId,
          foodName: data.foodName,
          brandName: data.brandName || null,
          quantity: data.quantity,
          unit: data.unit,
          mealType: data.mealType,
          nutrition: data.nutrition,
          loggedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId,
        } as FoodLog;
      }

      // Re-throw non-network errors
      throw error;
    }
  }

  /**
   * Update a food log with offline support
   */
  async updateLog(logId: string, data: UpdateFoodLogRequest): Promise<FoodLog> {
    try {
      const response = await apiClient.patch<LogsResponse>(
        `${this.basePath}/${logId}`,
        data
      );

      if (!response.success) {
        throw new Error('Failed to update log');
      }

      return response.data;
    } catch (error) {
      // Check if it's a network error and we're offline
      if (error instanceof ApiClientError && error.code === 'network_error' && !isOnline()) {
        console.log('[Logs Service] Offline detected, queuing update_log operation');

        // Add to offline queue
        addToQueue({
          type: 'update_log',
          data: {
            logId,
            ...data,
          },
          timestamp: new Date().toISOString(),
        });

        // Return optimistic result for UI (merge with existing data)
        const existingLog = await this.getLog(logId).catch(() => null);
        return {
          ...existingLog,
          ...data,
          updatedAt: new Date().toISOString(),
        } as FoodLog;
      }

      // Re-throw non-network errors
      throw error;
    }
  }

  /**
   * Delete a food log (soft delete) with offline support
   */
  async deleteLog(logId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.basePath}/${logId}`);
    } catch (error) {
      // Check if it's a network error and we're offline
      if (error instanceof ApiClientError && error.code === 'network_error' && !isOnline()) {
        console.log('[Logs Service] Offline detected, queuing delete_log operation');

        // Add to offline queue
        addToQueue({
          type: 'delete_log',
          data: {
            logId,
          },
          timestamp: new Date().toISOString(),
        });

        // Return void (optimistic - assume deletion succeeded)
        return;
      }

      // Re-throw non-network errors
      throw error;
    }
  }
}

export const logsService = new LogsService();
export default logsService;

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    error.code === 'network_error'
  );
}

/**
 * Check if the device is offline (network or API unavailable)
 */
export function isOffline(): boolean {
  return !isOnline();
}
