/**
 * Food History Service
 * Handles user's food history for intelligent suggestions
 */

import { apiClient } from '../index';
import type { ApiSuccessResponse } from '../../contracts/types';

export interface FoodHistoryItem {
  id: string;
  user_id: string;
  food_name: string;
  brand_name: string | null;
  quantity: number;
  unit: string;
  nutrition: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
  };
  meal_type: string;
  logged_at: string;
}

export interface FoodSuggestion {
  food_name: string;
  brand_name: string | null;
  avg_quantity: number;
  unit: string;
  nutrition: Record<string, unknown>;
  log_count: number;
  last_logged: string;
  most_common_meal?: string;
}

export interface SuggestionsResponse {
  suggestions: FoodSuggestion[];
  mealType: string;
  hour: number;
}

export class FoodHistoryService {
  private readonly basePath = '/api/food-history';

  /**
   * Get recently used foods
   */
  async getRecent(userId: string, limit = 10): Promise<FoodHistoryItem[]> {
    const response = await apiClient.get<ApiSuccessResponse<FoodHistoryItem[]>>(
      `${this.basePath}/recent`,
      { userId, limit: limit.toString() }
    );

    if (!response.success) {
      throw new Error('Failed to fetch recent foods');
    }

    return response.data;
  }

  /**
   * Get foods by meal type
   */
  async getByMeal(userId: string, mealType: string, limit = 10): Promise<FoodSuggestion[]> {
    const response = await apiClient.get<ApiSuccessResponse<FoodSuggestion[]>>(
      `${this.basePath}/by-meal/${mealType}`,
      { userId, limit: limit.toString() }
    );

    if (!response.success) {
      throw new Error('Failed to fetch foods by meal');
    }

    return response.data;
  }

  /**
   * Get smart suggestions based on current time
   */
  async getSuggestions(userId: string): Promise<SuggestionsResponse> {
    const response = await apiClient.get<ApiSuccessResponse<SuggestionsResponse>>(
      `${this.basePath}/suggestions`,
      { userId }
    );

    if (!response.success) {
      throw new Error('Failed to fetch suggestions');
    }

    return response.data;
  }

  /**
   * Get popular foods
   */
  async getPopular(userId: string, limit = 10): Promise<FoodSuggestion[]> {
    const response = await apiClient.get<ApiSuccessResponse<FoodSuggestion[]>>(
      `${this.basePath}/popular`,
      { userId, limit: limit.toString() }
    );

    if (!response.success) {
      throw new Error('Failed to fetch popular foods');
    }

    return response.data;
  }
}

const foodHistoryService = new FoodHistoryService();
export default foodHistoryService;
