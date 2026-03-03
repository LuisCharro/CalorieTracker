/**
 * API Services Barrel
 * Central export point for all API services
 */

export { default as authService, AuthService } from './auth.service';
export { default as logsService, LogsService } from './logs.service';
export { default as goalsService, GoalsService } from './goals.service';
export { default as gdprService, GdprService } from './gdpr.service';
export { default as settingsService, SettingsService } from './settings.service';
export { default as weightLogsService, WeightLogsService } from './weight-logs.service';
export { default as waterLogsService, WaterLogsService } from './water-logs.service';
export type { WeightLog, CreateWeightLogRequest, UpdateWeightLogRequest, WeightLogsQuery, WeightProgress } from './weight-logs.service';
export type { WaterLog, CreateWaterLogRequest, WaterProgress } from './water-logs.service';
export type { DailySummary } from './logs.service';

export { default as foodHistoryService, FoodHistoryService } from './food-history.service';
export type { FoodHistoryItem, FoodSuggestion, SuggestionsResponse } from './food-history.service';
