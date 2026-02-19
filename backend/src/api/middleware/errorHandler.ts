/**
 * Global error handling middleware
 * Provides consistent error responses across all endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, ConflictError, UnauthorizedError, IdempotencyConflictError } from '../validation/schemas.js';

/**
 * Convert unknown errors to consistent API error format
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('API Error:', {
    message: err.message,
    name: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle custom validation errors
  if (err instanceof ValidationError) {
    res.status(400).json(err.toJSON());
    return;
  }

  // Handle not found errors
  if (err instanceof NotFoundError) {
    res.status(404).json(err.toJSON());
    return;
  }

  // Handle conflict errors
  if (err instanceof ConflictError) {
    res.status(409).json(err.toJSON());
    return;
  }

  // Handle unauthorized errors
  if (err instanceof UnauthorizedError) {
    res.status(401).json(err.toJSON());
    return;
  }

  // Handle idempotency conflicts
  if (err instanceof IdempotencyConflictError) {
    res.status(409).json(err.toJSON());
    return;
  }

  // Handle Postgres unique constraint violations
  if ((err as any).code === '23505') {
    res.status(409).json({
      success: false,
      error: {
        code: 'conflict',
        message: 'Resource already exists',
      },
    });
    return;
  }

  // Handle Postgres foreign key violations
  if ((err as any).code === '23503') {
    res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Referenced resource does not exist',
      },
    });
    return;
  }

  // Handle Postgres not null violations
  if ((err as any).code === '23502') {
    res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Required field is missing',
      },
    });
    return;
  }

  // Handle syntax errors (invalid JSON, etc.)
  if (err instanceof SyntaxError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Invalid request format',
      },
    });
    return;
  }

  // Default internal server error
  res.status(500).json({
    success: false,
    error: {
      code: 'internal_error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    },
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'not_found',
      message: 'Endpoint not found',
    },
  });
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  console.log(`${req.method} ${req.path}`);
  next();
}
