/**
 * Main API server
 * Express-based REST API for CalorieTracker backend
 */

import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { closePool } from '../db/pool.js';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';
import authRouter from './routers/auth.router.js';
import logsRouter from './routers/logs.router.js';
import goalsRouter from './routers/goals.router.js';
import gdprRouter from './routers/gdpr.router.js';
import settingsRouter from './routers/settings.router.js';
import syncRouter from './routers/sync.router.js';
import notificationsRouter from './routers/notifications.router.js';
import testErrorsRouter from './routers/test-errors.router.js';
import { startJobScheduler, stopJobScheduler } from './jobs/scheduler.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Trust proxy for proper client IP detection
app.set('trust proxy', true);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
}));
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'calorietracker-backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', idempotencyMiddleware, authRouter);
app.use('/api/logs', idempotencyMiddleware, logsRouter);
app.use('/api/goals', idempotencyMiddleware, goalsRouter);
app.use('/api/gdpr', gdprRouter);
app.use('/api/settings', idempotencyMiddleware, settingsRouter);
app.use('/api/notifications', idempotencyMiddleware, notificationsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/test/errors', testErrorsRouter);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`CalorieTracker backend listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);

    // Start background job scheduler
    startJobScheduler();
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed');
    });
    stopJobScheduler();
    await closePool();
    console.log('Database pool closed');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
