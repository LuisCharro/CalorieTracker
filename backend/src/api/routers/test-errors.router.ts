/**
 * Error Simulation Router
 * Test endpoints for simulating various error conditions
 * Only enabled in test/development mode
 */

import { Router, Request, Response } from 'express';
import { shouldEnableErrorSimulation } from '../../utils/test-mode.js';

const router = Router();

/**
 * GET /api/test/errors/status
 * Returns current test mode status
 */
router.get('/status', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      testModeEnabled: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
      errorSimulationEnabled: shouldEnableErrorSimulation(),
      environment: process.env.NODE_ENV || 'development',
      availableEndpoints: [
        'GET /api/test/errors/500',
        'POST /api/test/errors/500',
        'GET /api/test/errors/timeout?delay=ms',
        'GET /api/test/errors/slow?delay=ms',
        'GET /api/test/errors/network-failure',
        'GET /api/test/errors/503',
        'GET /api/test/errors/429',
        'GET /api/test/errors/401',
        'GET /api/test/errors/403',
        'GET /api/test/errors/400',
      ],
    },
  });
});

/**
 * GET /api/test/errors/500
 * Simulates a server error
 */
router.get('/500', (_req: Request, res: Response): void => {
  res.status(500).json({
    success: false,
    error: {
      code: 'internal_error',
      message: 'Simulated server error for testing',
      requestId: `test-${Date.now()}`,
    },
  });
});

/**
 * POST /api/test/errors/500
 * Simulates a server error for POST requests
 */
router.post('/500', (_req: Request, res: Response): void => {
  res.status(500).json({
    success: false,
    error: {
      code: 'internal_error',
      message: 'Simulated server error for testing',
      requestId: `test-${Date.now()}`,
    },
  });
});

/**
 * GET /api/test/errors/timeout
 * Simulates a timeout by delaying response
 */
router.get('/timeout', async (_req: Request, res: Response): Promise<void> => {
  const delay = parseInt(_req.query.delay as string) || 5000;
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  res.status(200).json({
    success: true,
    data: {
      message: `Response after ${delay}ms delay`,
      delayed: true,
    },
  });
});

/**
 * GET /api/test/errors/slow
 * Simulates a slow response (returns after delay but still succeeds)
 */
router.get('/slow', async (_req: Request, res: Response): Promise<void> => {
  const delay = parseInt(_req.query.delay as string) || 2000;
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  res.status(200).json({
    success: true,
    data: {
      message: `Slow response after ${delay}ms`,
      delay,
    },
  });
});

/**
 * GET /api/test/errors/network-failure
 * Simulates a network failure by closing connection
 */
router.get('/network-failure', (_req: Request, res: Response): void => {
  res.socket?.destroy();
});

/**
 * GET /api/test/errors/503
 * Simulates service unavailable
 */
router.get('/503', (_req: Request, res: Response): void => {
  res.status(503).json({
    success: false,
    error: {
      code: 'service_unavailable',
      message: 'Service temporarily unavailable - simulated for testing',
      retryAfter: 60,
    },
  });
});

/**
 * GET /api/test/errors/429
 * Simulates rate limiting
 */
router.get('/429', (_req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    error: {
      code: 'rate_limited',
      message: 'Too many requests - simulated for testing',
      retryAfter: 30,
    },
  });
});

/**
 * GET /api/test/errors/401
 * Simulates unauthorized
 */
router.get('/401', (_req: Request, res: Response): void => {
  res.status(401).json({
    success: false,
    error: {
      code: 'unauthorized',
      message: 'Authentication required - simulated for testing',
    },
  });
});

/**
 * GET /api/test/errors/403
 * Simulates forbidden
 */
router.get('/403', (_req: Request, res: Response): void => {
  res.status(403).json({
    success: false,
    error: {
      code: 'forbidden',
      message: 'Access denied - simulated for testing',
    },
  });
});

/**
 * GET /api/test/errors/400
 * Simulates bad request with validation errors
 */
router.get('/400', (_req: Request, res: Response): void => {
  res.status(400).json({
    success: false,
    error: {
      code: 'validation_error',
      message: 'Validation failed - simulated for testing',
      details: [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' },
      ],
    },
  });
});

export default router;
