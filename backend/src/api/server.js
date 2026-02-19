// Re-export Express app from server.ts for testing
// The actual server.ts starts the HTTP server, but for testing we just need the Express app
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

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
