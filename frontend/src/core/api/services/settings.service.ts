/**
 * Settings Service
 * Handles user settings and preferences
 */

import { apiClient } from '../index';
import type {
  NotificationSettings,
  UpdateNotificationSettingsRequest,
  ApiSuccessResponse,
  ApiErrorResponse,
} from '../../contracts/types';

export type SettingsResponse = ApiSuccessResponse<NotificationSettings> | ApiErrorResponse;

export class SettingsService {
  private readonly basePath = '/api/settings';

  /**
   * Get user notification settings
   */
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    const response = await apiClient.get<SettingsResponse>(
      `${this.basePath}/notifications/${userId}`
    );

    if (!response.success) {
      throw new Error('Failed to fetch settings');
    }

    return response.data;
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(userId: string, data: UpdateNotificationSettingsRequest): Promise<NotificationSettings> {
    const response = await apiClient.patch<SettingsResponse>(
      `${this.basePath}/notifications/${userId}`,
      data
    );

    if (!response.success) {
      throw new Error('Failed to fetch settings');
    }

    return response.data;
  }

  /**
   * Get current user's notification settings
   */
  async getCurrentUserNotificationSettings(): Promise<NotificationSettings> {
    // This would typically get userId from token manager
    // For now, we'll need to pass it explicitly
    throw new Error('User ID required. Use getNotificationSettings(userId) instead.');
  }
}

export const settingsService = new SettingsService();
export default settingsService;
