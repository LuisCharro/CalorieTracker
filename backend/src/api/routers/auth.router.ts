/**
 * Authentication router
 * Handles user authentication and session management
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';
import { validateBody, validateParams, NotFoundError, ConflictError } from '../validation/schemas.js';
import { createUserSchema, updateUserSchema, userIdSchema } from '../validation/schemas.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  const data = validateBody(createUserSchema, req.body);

  try {
    const userId = uuidv4();
    const result = await query(
      `INSERT INTO users (id, email, display_name, preferences, onboarding_complete)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, display_name, preferences, onboarding_complete, created_at`,
      [
        userId,
        data.email,
        data.displayName || null,
        JSON.stringify(data.preferences),
        false,
      ]
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        preferences: user.preferences,
        onboardingComplete: user.onboarding_complete,
        createdAt: user.created_at,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if ((error as any).code === '23505') {
      // Unique constraint violation
      throw new ConflictError('User with this email already exists');
    }
    throw error;
  }
});

/**
 * POST /api/auth/login
 * Login a user (MVP: simple email lookup, no password yet)
 */
router.post('/login', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Email is required',
      },
    });
  }

  const result = await query(
    `SELECT id, email, display_name, preferences, onboarding_complete, created_at
     FROM users
     WHERE email = $1 AND is_deleted = FALSE`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User', email);
  }

  const user = result.rows[0];

  // Update last login
  await query(
    `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
    [user.id]
  );

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      preferences: user.preferences,
      onboardingComplete: user.onboarding_complete,
      createdAt: user.created_at,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/auth/user/:userId
 * Get user by ID
 */
router.get('/user/:userId', async (req, res) => {
  const { userId } = validateParams(userIdSchema, req.params);

  const result = await query(
    `SELECT id, email, display_name, preferences, onboarding_complete, onboarding_completed_at, created_at, last_login_at
     FROM users
     WHERE id = $1 AND is_deleted = FALSE`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User', userId);
  }

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      preferences: user.preferences,
      onboardingComplete: user.onboarding_complete,
      onboardingCompletedAt: user.onboarding_completed_at,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    },
  });
});

/**
 * PATCH /api/auth/user/:userId
 * Update user
 */
router.patch('/user/:userId', async (req, res) => {
  const { userId } = validateParams(userIdSchema, req.params);
  const data = validateBody(updateUserSchema, req.body);

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.displayName !== undefined) {
    updates.push(`display_name = $${paramIndex++}`);
    values.push(data.displayName);
  }

  if (data.preferences !== undefined) {
    updates.push(`preferences = $${paramIndex++}`);
    values.push(JSON.stringify(data.preferences));
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'No fields to update',
      },
    });
  }

  values.push(userId);

  const result = await query(
    `UPDATE users
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex} AND is_deleted = FALSE
     RETURNING id, email, display_name, preferences, onboarding_complete`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User', userId);
  }

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      preferences: user.preferences,
      onboardingComplete: user.onboarding_complete,
    },
  });
});

/**
 * DELETE /api/auth/user/:userId
 * Soft delete user
 */
router.delete('/user/:userId', async (req, res) => {
  const { userId } = validateParams(userIdSchema, req.params);

  const result = await query(
    `UPDATE users
     SET is_deleted = TRUE, deleted_at = NOW()
     WHERE id = $1 AND is_deleted = FALSE
     RETURNING id`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User', userId);
  }

  res.status(204).send();
});

/**
 * POST /api/auth/user/:userId/consents
 * Submit user consents
 */
router.post('/user/:userId/consents', async (req, res) => {
  const { userId } = validateParams(userIdSchema, req.params);
  const { consents } = req.body;

  if (!consents || typeof consents !== 'object') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Consents object is required',
      },
    });
  }

  for (const [type, given] of Object.entries(consents)) {
    await query(
      `INSERT INTO consent_history (id, user_id, consent_type, consent_given, consent_version, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [uuidv4(), userId, type, given, '1.0']
    );
  }

  res.json({ success: true });
});

/**
 * PATCH /api/auth/user/:userId/onboarding
 * Complete user onboarding
 */
router.patch('/user/:userId/onboarding', async (req, res) => {
  const { userId } = validateParams(userIdSchema, req.params);
  const { onboardingComplete } = req.body;

  const result = await query(
    `UPDATE users
     SET onboarding_complete = $1,
         onboarding_completed_at = CASE WHEN $1 = TRUE THEN NOW() ELSE onboarding_completed_at END
     WHERE id = $2 AND is_deleted = FALSE
     RETURNING id, onboarding_complete`,
    [onboardingComplete, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User', userId);
  }

  res.json({
    success: true,
    data: {
      onboardingComplete: result.rows[0].onboarding_complete,
    },
  });
});

export default router;
