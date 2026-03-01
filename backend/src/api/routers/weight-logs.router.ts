/**
 * Weight Logs router
 * Handles weight logging CRUD operations
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';
import {
  validateBody,
  validateParams,
  validateQuery,
  NotFoundError,
  weightLogIdSchema,
} from '../validation/schemas.js';

const router = Router();

/**
 * GET /api/weight-logs
 * Get weight log entries for a user with pagination
 * Returns items sorted by logged_at (most recent first)
 */
router.get('/', async (req, res) => {
  const { userId, page = '1', pageSize = '30' } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 30));
  const offset = (pageNum - 1) * pageSizeNum;

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM weight_logs
     WHERE user_id = $1`,
    [userId]
  );

  const total = parseInt(countResult.rows[0].total, 10);

  // Get paginated results sorted by date
  const result = await query(
    `SELECT id, user_id, weight_value, weight_unit, logged_at, notes, created_at, updated_at
     FROM weight_logs
     WHERE user_id = $1
     ORDER BY logged_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, pageSizeNum, offset]
  );

  const totalPages = Math.ceil(total / pageSizeNum);

  res.json({
    success: true,
    data: result.rows,
    meta: {
      timestamp: new Date().toISOString(),
      page: pageNum,
      pageSize: pageSizeNum,
      total,
      totalPages,
    },
  });
});

/**
 * GET /api/weight-logs/latest
 * Get the most recent weight entry for a user
 */
router.get('/latest', async (req, res) => {
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

  const result = await query(
    `SELECT id, user_id, weight_value, weight_unit, logged_at, notes, created_at, updated_at
     FROM weight_logs
     WHERE user_id = $1
     ORDER BY logged_at DESC
     LIMIT 1`,
    [userId]
  );

  res.json({
    success: true,
    data: result.rows[0] || null,
  });
});

/**
 * GET /api/weight-logs/:id
 * Get a single weight log entry by ID
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
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

  const result = await query(
    `SELECT id, user_id, weight_value, weight_unit, logged_at, notes, created_at, updated_at
     FROM weight_logs
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'not_found',
        message: 'Weight log entry not found',
      },
    });
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
});

/**
 * POST /api/weight-logs
 * Create a new weight log entry
 */
router.post('/', async (req, res) => {
  const { userId, weightValue, weightUnit = 'kg', loggedAt, notes } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  if (weightValue === undefined || weightValue === null) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'weightValue is required',
      },
    });
  }

  const weightValueNum = parseFloat(weightValue);
  if (isNaN(weightValueNum) || weightValueNum <= 0 || weightValueNum > 1000) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'weightValue must be a positive number between 0 and 1000',
      },
    });
  }

  const id = uuidv4();
  const loggedAtTimestamp = loggedAt ? new Date(loggedAt).toISOString() : new Date().toISOString();
  const now = new Date().toISOString();

  const result = await query(
    `INSERT INTO weight_logs (id, user_id, weight_value, weight_unit, logged_at, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, user_id, weight_value, weight_unit, logged_at, notes, created_at, updated_at`,
    [id, userId, weightValueNum, weightUnit || 'kg', loggedAtTimestamp, notes || null, now, now]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0],
  });
});

/**
 * PATCH /api/weight-logs/:id
 * Update a weight log entry
 */
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, weightValue, weightUnit, loggedAt, notes } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  // Check if entry exists
  const existing = await query(
    `SELECT id FROM weight_logs WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (existing.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'not_found',
        message: 'Weight log entry not found',
      },
    });
  }

  // Build update query dynamically
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (weightValue !== undefined) {
    const weightValueNum = parseFloat(weightValue);
    if (isNaN(weightValueNum) || weightValueNum <= 0 || weightValueNum > 1000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'validation_error',
          message: 'weightValue must be a positive number between 0 and 1000',
        },
      });
    }
    updates.push(`weight_value = $${paramIndex++}`);
    values.push(weightValueNum);
  }

  if (weightUnit !== undefined) {
    updates.push(`weight_unit = $${paramIndex++}`);
    values.push(weightUnit);
  }

  if (loggedAt !== undefined) {
    updates.push(`logged_at = $${paramIndex++}`);
    values.push(new Date(loggedAt).toISOString());
  }

  if (notes !== undefined) {
    updates.push(`notes = $${paramIndex++}`);
    values.push(notes);
  }

  updates.push(`updated_at = $${paramIndex++}`);
  values.push(new Date().toISOString());

  values.push(id, userId);

  const result = await query(
    `UPDATE weight_logs
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
     RETURNING id, user_id, weight_value, weight_unit, logged_at, notes, created_at, updated_at`,
    values
  );

  res.json({
    success: true,
    data: result.rows[0],
  });
});

/**
 * DELETE /api/weight-logs/:id
 * Delete a weight log entry
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
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

  const result = await query(
    `DELETE FROM weight_logs
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'not_found',
        message: 'Weight log entry not found',
      },
    });
  }

  res.json({
    success: true,
    data: { id },
  });
});

export default router;
