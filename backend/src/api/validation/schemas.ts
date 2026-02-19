/**
 * Request validation schemas using Zod
 * Provides input validation and error handling for all API endpoints
 */

import { z } from 'zod';
import { GoalType, MealType, ConsentType, GDPRRequestType } from '../../shared/enums.js';

// ============================================================================
// Utility Schemas
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z.string().email('Invalid email address');

export const dateSchema = z.coerce.date().or(z.string().datetime());

export const positiveNumberSchema = z.number().positive('Value must be positive');

// ============================================================================
// User Schemas
// ============================================================================

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().min(1).max(255).optional(),
  preferences: z.record(z.unknown()).default({}),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  preferences: z.record(z.unknown()).optional(),
});

export const userIdSchema = z.object({
  userId: uuidSchema,
});

// ============================================================================
// Food Log Schemas
// ============================================================================

export const nutritionSchema = z.object({
  calories: positiveNumberSchema,
  protein: z.number().min(0).optional(),
  carbohydrates: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
});

export const createFoodLogSchema = z.object({
  userId: uuidSchema,
  foodName: z.string().min(1).max(500),
  brandName: z.string().max(255).optional(),
  quantity: positiveNumberSchema,
  unit: z.string().min(1).max(50),
  mealType: z.nativeEnum(MealType),
  nutrition: nutritionSchema,
  loggedAt: dateSchema.optional(),
});

export const updateFoodLogSchema = z.object({
  foodName: z.string().min(1).max(500).optional(),
  brandName: z.string().max(255).optional(),
  quantity: positiveNumberSchema.optional(),
  unit: z.string().min(1).max(50).optional(),
  mealType: z.nativeEnum(MealType).optional(),
  nutrition: nutritionSchema.optional(),
  loggedAt: dateSchema.optional(),
});

export const foodLogIdSchema = z.object({
  foodLogId: uuidSchema,
});

// ============================================================================
// Goal Schemas
// ============================================================================

export const createGoalSchema = z.object({
  userId: uuidSchema,
  goalType: z.nativeEnum(GoalType),
  targetValue: positiveNumberSchema,
  startDate: dateSchema,
  endDate: dateSchema.optional(),
});

export const updateGoalSchema = z.object({
  targetValue: positiveNumberSchema.optional(),
  isActive: z.boolean().optional(),
  endDate: dateSchema.optional(),
});

export const goalIdSchema = z.object({
  goalId: uuidSchema,
});

// ============================================================================
// Notification Settings Schemas
// ============================================================================

export const updateNotificationSettingsSchema = z.object({
  channels: z.array(z.string()).optional(),
  reminderTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format, use HH:MM')).optional(),
  timezone: z.string().min(1).optional(),
});

// ============================================================================
// Consent Schemas
// ============================================================================

export const createConsentSchema = z.object({
  userId: uuidSchema,
  consentType: z.nativeEnum(ConsentType),
  consentGiven: z.boolean(),
  consentVersion: z.string().min(1).max(50),
  metadata: z.record(z.unknown()).default({}),
});

// ============================================================================
// GDPR Request Schemas
// ============================================================================

export const createGDPRRequestSchema = z.object({
  userId: uuidSchema,
  requestType: z.nativeEnum(GDPRRequestType),
  metadata: z.record(z.unknown()).default({}),
});

export const gdpRequestIdSchema = z.object({
  requestId: uuidSchema,
});

// ============================================================================
// Pagination Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

// ============================================================================
// Query Parameter Schemas
// ============================================================================

export const foodLogsQuerySchema = paginationSchema
  .merge(dateRangeSchema)
  .merge(
    z.object({
      mealType: z.nativeEnum(MealType).optional(),
    })
  );

export const goalsQuerySchema = paginationSchema.merge(
  z.object({
    isActive: z.coerce.boolean().optional(),
    goalType: z.nativeEnum(GoalType).optional(),
  })
);

export const consentQuerySchema = paginationSchema.merge(
  z.object({
    consentType: z.nativeEnum(ConsentType).optional(),
  })
);

export const gdpRequestsQuerySchema = paginationSchema.merge(
  z.object({
    requestType: z.nativeEnum(GDPRRequestType).optional(),
    status: z.enum(['pending', 'processing', 'completed', 'rejected']).optional(),
  })
);

// ============================================================================
// Error Response Schema
// ============================================================================

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
  meta: z.object({
    timestamp: z.string().datetime(),
  }).optional(),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate request body against a schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Validation failed', formattedErrors);
    }
    throw error;
  }
}

/**
 * Validate query parameters against a schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, query: Record<string, unknown>): T {
  try {
    return schema.parse(query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Query validation failed', formattedErrors);
    }
    throw error;
  }
}

/**
 * Validate path parameters against a schema
 */
export function validateParams<T>(schema: z.ZodSchema<T>, params: Record<string, unknown>): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Parameter validation failed', formattedErrors);
    }
    throw error;
  }
}

// ============================================================================
// Custom Error Classes
// ============================================================================

export class ValidationError extends Error {
  public readonly errors: Array<{ path: string; message: string }>;

  constructor(message: string, errors: Array<{ path: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: 'validation_error',
        message: this.message,
        details: { errors: this.errors },
      },
    };
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`);
    this.name = 'NotFoundError';
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: 'not_found',
        message: this.message,
      },
    };
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: 'conflict',
        message: this.message,
      },
    };
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: 'unauthorized',
        message: this.message,
      },
    };
  }
}

export class IdempotencyConflictError extends Error {
  constructor(idempotencyKey: string) {
    super(`Idempotency key already used: ${idempotencyKey}`);
    this.name = 'IdempotencyConflictError';
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: 'idempotency_conflict',
        message: this.message,
      },
    };
  }
}
