/**
 * Shared enums and types
 * Exported for frontend-backend contract alignment
 */

// Goal Types
export enum GoalType {
  DAILY_CALORIES = 'daily_calories',
}

// Meal Types
export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

// Consent Types
export enum ConsentType {
  PRIVACY_POLICY = 'privacy_policy',
  TERMS_OF_SERVICE = 'terms_of_service',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
}

// GDPR Request Types
export enum GDPRRequestType {
  ACCESS = 'access',
  PORTABILITY = 'portability',
  ERASURE = 'erasure',
  RECTIFICATION = 'rectification',
}

// GDPR Request Status
export enum GDPRRequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

// Security Event Types
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  PASSWORD_CHANGE = 'password_change',
  EMAIL_CHANGE = 'email_change',
  CONSENT_WITHDRAWN = 'consent_withdrawn',
  DATA_EXPORT = 'data_export',
  DATA_ERASURE_REQUEST = 'data_erasure_request',
}

// Security Event Severity
export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Nutrition Types
export interface Nutrition {
  calories: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

// Processing Activity Types
export enum ProcessingActivityType {
  USER_REGISTRATION = 'user_registration',
  FOOD_LOGGING = 'food_logging',
  GOAL_TRACKING = 'goal_tracking',
  CONSENT_MANAGEMENT = 'consent_management',
  DATA_EXPORT = 'data_export',
  DATA_ERASURE = 'data_erasure',
}

// Legal Basis Types (GDPR Article 6)
export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests',
}
