/**
 * Authentication router
 * Handles user authentication and session management
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../../db/pool.js';
import { validateBody, validateParams, NotFoundError, ConflictError, UnauthorizedError } from '../validation/schemas.js';
import { createUserSchema, updateUserSchema, userIdSchema, loginSchema } from '../validation/schemas.js';

const BCRYPT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const router = Router();

/**
 * Generate JWT token for a user
 */
function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as '7d' }
  );
}

async function logSecurityEvent(params: {
  eventType: 'signup_success' | 'login_success' | 'login_failure';
  severity: 'info' | 'warning';
  userId?: string;
  req: any;
  details?: Record<string, unknown>;
}): Promise<void> {
  const ip = params.req.ip || params.req.headers['x-forwarded-for'] || 'unknown';
  const ipHash = crypto.createHash('sha256').update(ip.toString()).digest('hex').substring(0, 32);
  const userAgent = params.req.headers['user-agent'] || null;

  await query(
    `INSERT INTO security_events (id, event_type, severity, user_id, ip_hash, user_agent, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      uuidv4(),
      params.eventType,
      params.severity,
      params.userId || null,
      ipHash,
      userAgent,
      JSON.stringify(params.details || {}),
    ]
  );
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  const data = validateBody(createUserSchema, req.body);

  try {
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const result = await query(
      `INSERT INTO users (id, email, password_hash, display_name, preferences, onboarding_complete)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, display_name, preferences, onboarding_complete, created_at`,
      [
        userId,
        data.email,
        passwordHash,
        data.displayName || null,
        JSON.stringify(data.preferences),
        false,
      ]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    await logSecurityEvent({
      eventType: 'signup_success',
      severity: 'info',
      userId: user.id,
      req,
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        preferences: user.preferences,
        onboardingComplete: user.onboarding_complete,
        createdAt: user.created_at,
        token,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if ((error as any).code === '23505') {
      throw new ConflictError('User with this email already exists');
    }
    throw error;
  }
});

/**
 * POST /api/auth/login
 * Login a user with email and password
 */
router.post('/login', async (req, res) => {
  const data = validateBody(loginSchema, req.body);

  const result = await query(
    `SELECT id, email, password_hash, display_name, preferences, onboarding_complete, created_at
     FROM users
     WHERE email = $1 AND is_deleted = FALSE`,
    [data.email]
  );

  if (result.rows.length === 0) {
    await logSecurityEvent({
      eventType: 'login_failure',
      severity: 'warning',
      req,
      details: { reason: 'user_not_found', email: data.email },
    });
    throw new UnauthorizedError('Invalid email or password');
  }

  const user = result.rows[0];

  if (!user.password_hash) {
    await logSecurityEvent({
      eventType: 'login_failure',
      severity: 'warning',
      userId: user.id,
      req,
      details: { reason: 'no_password_set' },
    });
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordValid = await bcrypt.compare(data.password, user.password_hash);

  if (!passwordValid) {
    await logSecurityEvent({
      eventType: 'login_failure',
      severity: 'warning',
      userId: user.id,
      req,
      details: { reason: 'invalid_password' },
    });
    throw new UnauthorizedError('Invalid email or password');
  }

  await query(
    `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
    [user.id]
  );

  const token = generateToken(user.id);

  await logSecurityEvent({
    eventType: 'login_success',
    severity: 'info',
    userId: user.id,
    req,
  });

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      preferences: user.preferences,
      onboardingComplete: user.onboarding_complete,
      createdAt: user.created_at,
      token,
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
