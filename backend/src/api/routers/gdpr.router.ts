/**
 * GDPR router
 * Handles GDPR requests (access, portability, erasure, rectification)
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../../db/pool.js';
import {
  validateBody,
  validateParams,
  validateQuery,
  NotFoundError,
  gdpRequestsQuerySchema,
  createGDPRRequestSchema,
  gdpRequestIdSchema,
} from '../validation/schemas.js';

const router = Router();

/**
 * GET /api/gdpr/requests
 * Get GDPR requests with pagination and filtering
 */
router.get('/requests', async (req, res) => {
  const params = validateQuery(gdpRequestsQuerySchema, req.query);
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  const offset = (params.page - 1) * params.pageSize;

  let whereClauses = ['user_id = $1'];
  let queryParams: unknown[] = [userId];
  let paramIndex = 2;

  if (params.requestType) {
    whereClauses.push(`request_type = $${paramIndex++}`);
    queryParams.push(params.requestType);
  }

  if (params.status) {
    whereClauses.push(`status = $${paramIndex++}`);
    queryParams.push(params.status);
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM gdpr_requests
     WHERE ${whereClauses.join(' AND ')}`,
    queryParams
  );

  const total = parseInt(countResult.rows[0].total, 10);

  // Get paginated results
  const result = await query(
    `SELECT id, user_id, request_type, status, requested_at, completed_at, metadata
     FROM gdpr_requests
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY requested_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...queryParams, params.pageSize, offset]
  );

  const totalPages = Math.ceil(total / params.pageSize);

  res.json({
    success: true,
    data: result.rows,
    meta: {
      timestamp: new Date().toISOString(),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages,
    },
  });
});

/**
 * GET /api/gdpr/requests/:requestId
 * Get a single GDPR request
 */
router.get('/requests/:requestId', async (req, res) => {
  const { requestId } = validateParams(gdpRequestIdSchema, req.params);

  const result = await query(
    `SELECT id, user_id, request_type, status, requested_at, completed_at, metadata
     FROM gdpr_requests
     WHERE id = $1`,
    [requestId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('GDPR request', requestId);
  }

  res.json({
    success: true,
    data: result.rows[0],
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * POST /api/gdpr/requests
 * Create a new GDPR request
 */
router.post('/requests', async (req, res) => {
  const data = validateBody(createGDPRRequestSchema, req.body);

  const id = uuidv4();

  const result = await query(
    `INSERT INTO gdpr_requests (id, user_id, request_type, status, requested_at, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, request_type, status, requested_at, metadata`,
    [id, data.userId, data.requestType, 'pending', new Date(), JSON.stringify(data.metadata)]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0],
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/gdpr/export/:userId
 * Export all user data (GDPR access/portability)
 */
router.get('/export/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Invalid userId format',
      },
    });
  }

  // Gather all user data
  const exportData = {
    user: null,
    foodLogs: [],
    goals: [],
    notificationSettings: null,
    consentHistory: [],
    gdprRequests: [],
    processingActivities: [],
    exportedAt: new Date().toISOString(),
  };

  // User
  const userResult = await query(
    `SELECT id, email, display_name, preferences, onboarding_complete, created_at, last_login_at
     FROM users
     WHERE id = $1 AND is_deleted = FALSE`,
    [userId]
  );
  exportData.user = userResult.rows[0] || null;

  if (!exportData.user) {
    throw new NotFoundError('User', userId);
  }

  // Food logs
  const logsResult = await query(
    `SELECT id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at
     FROM food_logs
     WHERE user_id = $1 AND is_deleted = FALSE
     ORDER BY logged_at DESC`,
    [userId]
  );
  exportData.foodLogs = logsResult.rows;

  // Goals
  const goalsResult = await query(
    `SELECT id, goal_type, target_value, is_active, start_date, end_date, created_at, updated_at
     FROM goals
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  exportData.goals = goalsResult.rows;

  // Notification settings
  const notifResult = await query(
    `SELECT channels, reminder_times, timezone, updated_at
     FROM notification_settings
     WHERE user_id = $1`,
    [userId]
  );
  exportData.notificationSettings = notifResult.rows[0] || null;

  // Consent history
  const consentResult = await query(
    `SELECT consent_type, consent_given, consent_version, metadata, created_at
     FROM consent_history
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  exportData.consentHistory = consentResult.rows;

  // GDPR requests
  const gdprResult = await query(
    `SELECT request_type, status, requested_at, completed_at, metadata
     FROM gdpr_requests
     WHERE user_id = $1
     ORDER BY requested_at DESC`,
    [userId]
  );
  exportData.gdprRequests = gdprResult.rows;

  // Processing activities
  const activitiesResult = await query(
    `SELECT activity_type, data_categories, purpose, legal_basis, metadata, created_at
     FROM processing_activities
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  exportData.processingActivities = activitiesResult.rows;

  res.json({
    success: true,
    data: exportData,
    meta: {
      timestamp: new Date().toISOString(),
      format: process.env.GDPR_EXPORT_FORMAT || 'json',
    },
  });
});

/**
 * POST /api/gdpr/erase/:userId
 * Request data erasure (GDPR right to be forgotten)
 * This creates an erasure request that will be processed by a background job after the grace period
 */
router.post('/erase/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Invalid userId format',
      },
    });
  }

  // Check if user exists and is not already soft deleted
  const userResult = await query(
    `SELECT id FROM users WHERE id = $1 AND is_deleted = FALSE`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User', userId);
  }

  // Check for existing pending erasure request
  const existingRequest = await query(
    `SELECT id, status FROM gdpr_requests
     WHERE user_id = $1 AND request_type = 'erasure' AND status IN ('pending', 'processing')
     LIMIT 1`,
    [userId]
  );

  if (existingRequest.rows.length > 0) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'conflict',
        message: 'An erasure request is already pending for this user',
        data: {
          requestId: existingRequest.rows[0].id,
          status: existingRequest.rows[0].status,
        },
      },
    });
  }

  // Create erasure request (status: pending)
  const requestId = uuidv4();
  const gracePeriodDays = parseInt(process.env.GDPR_ERASURE_GRACE_PERIOD_DAYS || '30', 10);

  await query(
    `INSERT INTO gdpr_requests (id, user_id, request_type, status, requested_at, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [requestId, userId, 'erasure', 'pending', new Date(), JSON.stringify({ gracePeriodDays })]
  );

  // Soft delete the user immediately (blocks login, but data is preserved until grace period ends)
  await query(
    `UPDATE users
     SET is_deleted = TRUE, deleted_at = NOW()
     WHERE id = $1`,
    [userId]
  );

  res.status(202).json({
    success: true,
    data: {
      requestId,
      userId,
      requestType: 'erasure',
      status: 'pending',
      message: `Erasure request submitted. Account will be permanently deleted after ${gracePeriodDays} day grace period.`,
      gracePeriodDays,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/gdpr/consent/:userId
 * Get all consent history for a user
 */
router.get('/consent/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Invalid userId format',
      },
    });
  }

  const result = await query(
    `SELECT id, consent_type, consent_given, consent_version, metadata, created_at
     FROM consent_history
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  // Group by consent type to get current state
  const currentConsent: Record<string, { given: boolean; version: string; updatedAt: Date }> = {};

  for (const row of result.rows) {
    if (!currentConsent[row.consent_type]) {
      currentConsent[row.consent_type] = {
        given: row.consent_given,
        version: row.consent_version,
        updatedAt: row.created_at,
      };
    }
  }

  res.json({
    success: true,
    data: {
      current: currentConsent,
      history: result.rows,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
