/**
 * Shared TypeScript types
 * Exported for frontend-backend contract alignment
 */

import { GoalType, MealType, ConsentType, GDPRRequestType, GDPRRequestStatus, SecurityEventType, SecurityEventSeverity, Nutrition, ProcessingActivityType, LegalBasis } from './enums.js';

// User
export interface User {
  id: string;
  email: string;
  displayName?: string;
  preferences: Record<string, unknown>;
  onboardingComplete: boolean;
  onboardingCompletedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface CreateUserInput {
  email: string;
  displayName?: string;
  preferences?: Record<string, unknown>;
}

export interface UpdateUserInput {
  displayName?: string;
  preferences?: Record<string, unknown>;
}

// Food Log
export interface FoodLog {
  id: string;
  userId: string;
  foodName: string;
  brandName?: string;
  quantity: number;
  unit: string;
  mealType: MealType;
  nutrition: Nutrition;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface CreateFoodLogInput {
  userId: string;
  foodName: string;
  brandName?: string;
  quantity: number;
  unit: string;
  mealType: MealType;
  nutrition: Nutrition;
  loggedAt?: Date;
}

export interface UpdateFoodLogInput {
  foodName?: string;
  brandName?: string;
  quantity?: number;
  unit?: string;
  mealType?: MealType;
  nutrition?: Nutrition;
  loggedAt?: Date;
}

// Goal
export interface Goal {
  id: string;
  userId: string;
  goalType: GoalType;
  targetValue: number;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoalInput {
  userId: string;
  goalType: GoalType;
  targetValue: number;
  startDate: Date;
  endDate?: Date;
}

export interface UpdateGoalInput {
  targetValue?: number;
  isActive?: boolean;
  endDate?: Date;
}

// Notification Settings
export interface NotificationSettings {
  id: string;
  userId: string;
  channels: string[];
  reminderTimes: string[];
  timezone: string;
  updatedAt: Date;
}

export interface UpdateNotificationSettingsInput {
  channels?: string[];
  reminderTimes?: string[];
  timezone?: string;
}

// Consent History
export interface ConsentHistory {
  id: string;
  userId: string;
  consentType: ConsentType;
  consentGiven: boolean;
  consentVersion: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateConsentInput {
  userId: string;
  consentType: ConsentType;
  consentGiven: boolean;
  consentVersion: string;
  metadata?: Record<string, unknown>;
}

// GDPR Request
export interface GDPRRequest {
  id: string;
  userId: string;
  requestType: GDPRRequestType;
  status: GDPRRequestStatus;
  requestedAt: Date;
  completedAt?: Date;
  metadata: Record<string, unknown>;
}

export interface CreateGDPRRequestInput {
  userId: string;
  requestType: GDPRRequestType;
  metadata?: Record<string, unknown>;
}

// Processing Activity
export interface ProcessingActivity {
  id: string;
  userId?: string;
  activityType: ProcessingActivityType;
  dataCategories: string[];
  purpose: string;
  legalBasis: LegalBasis;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// Security Event
export interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  ipHash?: string;
  userAgent?: string;
  details: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateSecurityEventInput {
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  ipHash?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    idempotencyKey?: string;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: {
    idempotencyKey?: string;
    timestamp: string;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Error Codes
export enum ErrorCode {
  VALIDATION_ERROR = 'validation_error',
  NOT_FOUND = 'not_found',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  CONFLICT = 'conflict',
  INTERNAL_ERROR = 'internal_error',
  IDEMPOTENCY_CONFLICT = 'idempotency_conflict',
}
