/**
 * Shared API types for FrontEnd-BackEnd contract alignment
 * These types define the request/response structure for all API endpoints
 */

import { Nutrition, GoalType, MealType, ConsentType, GDPRRequestType, GDPRRequestStatus } from './enums';

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  displayName?: string;
  preferences: Record<string, unknown>;
  onboardingComplete: boolean;
  onboardingCompletedAt?: string;
  createdAt: string;
  lastLoginAt?: string;
  token?: string;
}

export interface CreateUserRequest {
  email: string;
  displayName?: string;
  preferences?: Record<string, unknown>;
}

export interface UpdateUserRequest {
  displayName?: string;
  preferences?: Record<string, unknown>;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

// ============================================================================
// Food Log Types
// ============================================================================

export interface FoodLog {
  id: string;
  userId: string;
  foodName: string;
  brandName?: string;
  quantity: number;
  unit: string;
  mealType: MealType;
  nutrition: Nutrition;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFoodLogRequest {
  userId: string;
  foodName: string;
  brandName?: string;
  quantity: number;
  unit: string;
  mealType: MealType;
  nutrition: Nutrition;
  loggedAt?: string;
}

export interface UpdateFoodLogRequest {
  foodName?: string;
  brandName?: string;
  quantity?: number;
  unit?: string;
  mealType?: MealType;
  nutrition?: Nutrition;
  loggedAt?: string;
}

export interface FoodLogsQuery {
  userId?: string;
  page?: number;
  pageSize?: number;
  mealType?: MealType;
  startDate?: string;
  endDate?: string;
}

export interface TodayLogsResponse {
  breakfast: FoodLog[];
  lunch: FoodLog[];
  dinner: FoodLog[];
  snack: FoodLog[];
}

export interface BatchFoodLogItem {
  foodName: string;
  brandName?: string;
  quantity: number;
  unit: string;
  nutrition: Nutrition;
}

export interface BatchCreateFoodLogRequest {
  userId: string;
  mealName?: string;
  mealType: MealType;
  items: BatchFoodLogItem[];
  loggedAt?: string;
}

export interface BatchCreateFoodLogResponse {
  mealName: string;
  mealType: MealType;
  items: Array<{
    id: string;
    foodName: string;
    success: boolean;
    error?: string;
  }>;
  summary: {
    total: number;
    created: number;
    errors: number;
  };
}

// ============================================================================
// Goal Types
// ============================================================================

export interface Goal {
  id: string;
  userId: string;
  goalType: GoalType;
  targetValue: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  userId: string;
  goalType: GoalType;
  targetValue: number;
  startDate: string;
  endDate?: string;
}

export interface UpdateGoalRequest {
  targetValue?: number;
  isActive?: boolean;
  endDate?: string;
}

export interface GoalProgress {
  goalId: string;
  goalType: GoalType;
  targetValue: number;
  currentValue: number;
  progress: number;
  isOnTrack: boolean;
  remaining: number;
}

export interface GoalsQuery {
  userId?: string;
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  goalType?: GoalType;
}

// ============================================================================
// GDPR Types
// ============================================================================

export interface GDPRRequest {
  id: string;
  userId: string;
  requestType: GDPRRequestType;
  status: GDPRRequestStatus;
  requestedAt: string;
  completedAt?: string;
  metadata: Record<string, unknown>;
}

export interface CreateGDPRRequestRequest {
  userId: string;
  requestType: GDPRRequestType;
  metadata?: Record<string, unknown>;
}

export interface GDPRRequestsQuery {
  page?: number;
  pageSize?: number;
  requestType?: GDPRRequestType;
  status?: GDPRRequestStatus;
}

export interface DataExport {
  user: {
    id: string;
    email: string;
    displayName?: string;
    preferences: Record<string, unknown>;
    onboardingComplete: boolean;
    createdAt: string;
    lastLoginAt?: string;
  };
  foodLogs: FoodLog[];
  goals: Goal[];
  notificationSettings: {
    channels: string[];
    reminderTimes: string[];
    timezone: string;
    updatedAt: string;
  } | null;
  consentHistory: ConsentRecord[];
  gdprRequests: GDPRRequest[];
  processingActivities: ProcessingActivity[];
  exportedAt: string;
}

export interface ConsentRecord {
  id: string;
  consentType: ConsentType;
  consentGiven: boolean;
  consentVersion: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ProcessingActivity {
  id: string;
  activityType: string;
  dataCategories: string[];
  purpose: string;
  legalBasis: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CurrentConsent {
  [consentType: string]: {
    given: boolean;
    version: string;
    updatedAt: string;
  };
}

export interface ConsentHistoryResponse {
  current: CurrentConsent;
  history: ConsentRecord[];
}

// ============================================================================
// Notification Settings Types
// ============================================================================

export interface NotificationSettings {
  id: string;
  userId: string;
  channels: string[];
  reminderTimes: string[];
  timezone: string;
  updatedAt: string;
  emailReminders?: boolean;
  mealReminders?: boolean;
  goalAlerts?: boolean;
  weeklySummary?: boolean;
  marketingEmails?: boolean;
}

export interface UpdateNotificationSettingsRequest {
  channels?: string[];
  reminderTimes?: string[];
  timezone?: string;
}

// ============================================================================
// API Response Wrapper
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedMeta {
  timestamp: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginatedMeta;
}
