/**
 * Weight Logs Service
 * Handles weight log CRUD operations
 */

import { apiClient } from '../index';
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
} from '../../contracts/types';

export interface WeightLog {
  id: string;
  user_id: string;
  weight_value: number;
  weight_unit: string;
  logged_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWeightLogRequest {
  userId: string;
  weightValue: number;
  weightUnit?: string;
  loggedAt?: string;
  notes?: string;
}

export interface UpdateWeightLogRequest {
  userId: string;
  weightValue?: number;
  weightUnit?: string;
  loggedAt?: string;
  notes?: string;
}

export interface WeightLogsQuery {
  userId: string;
  page?: number;
  pageSize?: number;
}

export type WeightLogResponse = ApiSuccessResponse<WeightLog> | ApiErrorResponse;
export type PaginatedWeightLogsResponse = PaginatedResponse<WeightLog>;

export class WeightLogsService {
  private readonly basePath = '/api/weight-logs';

  /**
   * Get weight logs with pagination
   */
  async getWeightLogs(query: WeightLogsQuery): Promise<{ data: WeightLog[]; success: true; meta: any }> {
    const response = await apiClient.get<PaginatedWeightLogsResponse>(
      this.basePath,
      query
    );

    if (!response.success) {
      throw new Error('Failed to fetch weight logs');
    }

    return response;
  }

  /**
   * Get latest weight entry
   */
  async getLatestWeight(userId: string): Promise<WeightLog | null> {
    const response = await apiClient.get<ApiSuccessResponse<WeightLog | null>>(
      `${this.basePath}/latest`,
      { userId }
    );

    if (!response.success) {
      throw new Error('Failed to fetch latest weight');
    }

    return response.data;
  }

  /**
   * Get a single weight log by ID
   */
  async getWeightLog(weightLogId: string, userId: string): Promise<WeightLog> {
    const response = await apiClient.get<WeightLogResponse>(
      `${this.basePath}/${weightLogId}`,
      { userId }
    );

    if (!response.success) {
      throw new Error('Failed to fetch weight log');
    }

    return response.data;
  }

  /**
   * Create a new weight log
   */
  async createWeightLog(request: CreateWeightLogRequest): Promise<WeightLog> {
    const response = await apiClient.post<WeightLogResponse>(
      this.basePath,
      request
    );

    if (!response.success) {
      throw new Error('Failed to create weight log');
    }

    return response.data;
  }

  /**
   * Update a weight log
   */
  async updateWeightLog(weightLogId: string, request: UpdateWeightLogRequest): Promise<WeightLog> {
    const response = await apiClient.patch<WeightLogResponse>(
      `${this.basePath}/${weightLogId}`,
      request
    );

    if (!response.success) {
      throw new Error('Failed to update weight log');
    }

    return response.data;
  }

  /**
   * Delete a weight log
   */
  async deleteWeightLog(weightLogId: string, userId: string): Promise<void> {
    const response = await apiClient.delete<ApiSuccessResponse<{ id: string }>>(
      `${this.basePath}/${weightLogId}?userId=${userId}`
    );

    if (!response.success) {
      throw new Error('Failed to delete weight log');
    }
  }
}

const weightLogsService = new WeightLogsService();
export default weightLogsService;
