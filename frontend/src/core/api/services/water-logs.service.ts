/**
 * Water Logs Service
 * Handles water intake logging operations
 */

import { apiClient } from '../index';
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
} from '../../contracts/types';

export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

export interface WaterProgress {
  date: string;
  totalMl: number;
  entryCount: number;
}

export interface CreateWaterLogRequest {
  userId: string;
  amountMl: number;
}

export class WaterLogsService {
  private readonly basePath = '/api/water-logs';

  async getWaterLogs(userId: string, page = 1, pageSize = 30): Promise<{ data: WaterLog[]; success: true; meta: any }> {
    const response = await apiClient.get<ApiSuccessResponse<WaterLog[]>>(
      this.basePath,
      { userId, page, pageSize }
    );

    if (!response.success) {
      throw new Error('Failed to fetch water logs');
    }

    return response;
  }

  async getLatestWater(userId: string): Promise<WaterLog | null> {
    const response = await apiClient.get<ApiSuccessResponse<WaterLog | null>>(
      `${this.basePath}/latest`,
      { userId }
    );

    if (!response.success) {
      throw new Error('Failed to fetch latest water');
    }

    return response.data;
  }

  async createWaterLog(request: CreateWaterLogRequest): Promise<WaterLog> {
    const response = await apiClient.post<ApiSuccessResponse<WaterLog>>(
      this.basePath,
      request
    );

    if (!response.success) {
      throw new Error('Failed to create water log');
    }

    return response.data;
  }

  async updateWaterLog(waterLogId: string, amountMl: number): Promise<WaterLog> {
    const response = await apiClient.patch<ApiSuccessResponse<WaterLog>>(
      `${this.basePath}/${waterLogId}`,
      { amountMl }
    );

    if (!response.success) {
      throw new Error('Failed to update water log');
    }

    return response.data;
  }

  async deleteWaterLog(waterLogId: string, userId: string): Promise<void> {
    const response = await apiClient.delete<ApiSuccessResponse<{ id: string }>>(
      `${this.basePath}/${waterLogId}?userId=${userId}`
    );

    if (!response.success) {
      throw new Error('Failed to delete water log');
    }
  }

  async getProgress(userId: string, startDate?: string, endDate?: string): Promise<WaterProgress[]> {
    const params = new URLSearchParams({ userId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<ApiSuccessResponse<WaterProgress[]>>(
      `${this.basePath}/progress?${params.toString()}`
    );

    if (!response.success) {
      throw new Error('Failed to fetch water progress');
    }

    return response.data;
  }
}

const waterLogsService = new WaterLogsService();
export default waterLogsService;
