/**
 * Settings router
 * Handles user settings including notifications and preferences
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';
import {
  validateBody,
  validateParams,
  NotFoundError,
  createConsentSchema,
  updateNotificationSettingsSchema,
  userIdSchema,
} from '../validation/schemas.js';

const router = Router();

/**
 * GET /api/settings/:userId/notifications
 * Get notification settings for a user
 */
router.get('/:userId/notifications', async (req, res) => {
  const { userId } = validateParams(userIdSchema, req.params);

  const result = await query(
    `SELECT id, user_id, channels, reminder_times, timezone, updated_at
     FROM notification_settings
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    // Return default settings if not found
    return res.json({
      success: true,
      data: {
        channels: [],
        reminderTimes: [],
        timezone: 'UTC',
        updatedAt: null,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  const settings = result.rows[0];

  res.json({
    success: true,
    data: {
      id: settings.id,
      userId: settings.user_id,
      channels: settings.channels,
      reminderTimes: settings.reminder_times,
      timezone: settings.timezone,
      updatedAt: settings.updated_at,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * PUT /api/settings/:userId/notifications
 * Update notification settings
 */
router.put('/:userId/notifications', async (req, res) => {
  const { userId } = validateParams(userIdSchema, req.params);
  const data = validateBody(updateNotificationSettingsSchema, req.body);

  const result = await query(
    `INSERT INTO notification_settings (id, user_id, channels, reminder_times, timezone, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id)
     DO UPDATE SET
       channels = EXCLUDED.channels,
       reminder_times = EXCLUDED.reminder_times,
       timezone = EXCLUDED.timezone,
       updated_at = NOW()
     RETURNING id, user_id, channels, reminder_times, timezone, updated_at`,
    [
      uuidv4(),
      userId,
      JSON.stringify(data.channels || []),
      JSON.stringify(data.reminderTimes || []),
      data.timezone || 'UTC',
    ]
  );

  const settings = result.rows[0];

  res.json({
    success: true,
    data: {
      id: settings.id,
      userId: settings.user_id,
      channels: settings.channels,
      reminderTimes: settings.reminder_times,
      timezone: settings.timezone,
      updatedAt: settings.updated_at,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/settings/:userId/preferences
 * Get user preferences
 */
router.get('/:userId/preferences', async (req, res) => {
  const { userId } = validateParams(userIdSchema, req.params);

  const result = await query(
    `SELECT preferences FROM users WHERE id = $1 AND is_deleted = FALSE`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User', userId);
  }

  res.json({
    success: true,
    data: {
      preferences: result.rows[0].preferences,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * PATCH /api/settings/:userId/preferences
 * Update user preferences
 */
router.patch('/:userId/preferences', async (req, res) => {
  const { userId } = validateParams(userIdSchema, req.params);
  const { preferences } = req.body;

  if (!preferences || typeof preferences !== 'object') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'preferences must be an object',
      },
    });
  }

  const result = await query(
    `UPDATE users
     SET preferences = preferences || $2, updated_at = NOW()
     WHERE id = $1 AND is_deleted = FALSE
     RETURNING id, preferences, updated_at`,
    [userId, JSON.stringify(preferences)]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User', userId);
  }

  res.json({
    success: true,
    data: {
      preferences: result.rows[0].preferences,
      updatedAt: result.rows[0].updated_at,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * POST /api/settings/consent
 * Record or update consent
 */
router.post('/consent', async (req, res) => {
  const data = validateBody(createConsentSchema, req.body);

  const id = uuidv4();

  const result = await query(
    `INSERT INTO consent_history (id, user_id, consent_type, consent_given, consent_version, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id, consent_type, consent_given, consent_version, metadata, created_at`,
    [id, data.userId, data.consentType, data.consentGiven, data.consentVersion, JSON.stringify(data.metadata), new Date()]
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
 * GET /api/settings/consent/current/:userId
 * Get current consent state for all consent types
 */
router.get('/consent/current/:userId', async (req, res) => {
  const { userId } = validateParams(userIdSchema, req.params);

  const result = await query(
    `SELECT DISTINCT ON (consent_type) consent_type, consent_given, consent_version, created_at
     FROM consent_history
     WHERE user_id = $1
     ORDER BY consent_type, created_at DESC`,
    [userId]
  );

  const currentConsent: Record<string, { given: boolean; version: string; updatedAt: Date }> = {};

  for (const row of result.rows) {
    currentConsent[row.consent_type] = {
      given: row.consent_given,
      version: row.consent_version,
      updatedAt: row.created_at,
    };
  }

  res.json({
    success: true,
    data: currentConsent,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
