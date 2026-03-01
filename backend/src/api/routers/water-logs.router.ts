/**
 * Water Logs router
 * Handles water intake logging CRUD operations
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';

const router = Router();

/**
 * GET /api/water-logs
 * Get water log entries for a user with pagination
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
     FROM water_logs
     WHERE user_id = $1`,
    [userId]
  );

  const total = parseInt(countResult.rows[0].total, 10);

  // Get paginated results sorted by date
  const result = await query(
    `SELECT id, user_id, amount_ml, logged_at, created_at, updated_at
     FROM water_logs
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
 * GET /api/water-logs/latest
 * Get the most recent water entries for a user (last 24 hours)
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

  // Get today's entries
  const result = await query(
    `SELECT id, user_id, amount_ml, logged_at, created_at, updated_at
     FROM water_logs
     WHERE user_id = $1 AND logged_at >= NOW() - INTERVAL '24 hours'
     ORDER BY logged_at DESC`,
    [userId]
  );

  // Calculate total for today
  const totalResult = await query(
    `SELECT COALESCE(SUM(amount_ml), 0) as total_ml
     FROM water_logs
     WHERE user_id = $1 AND logged_at >= NOW() - INTERVAL '24 hours'`,
    [userId]
  );

  res.json({
    success: true,
    data: result.rows,
    summary: {
      totalMl: parseInt(totalResult.rows[0].total_ml, 10),
    },
  });
});

/**
 * GET /api/water-logs/:id
 * Get a single water log entry by ID
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
    `SELECT id, user_id, amount_ml, logged_at, created_at, updated_at
     FROM water_logs
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'not_found',
        message: 'Water log entry not found',
      },
    });
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
});

/**
 * POST /api/water-logs
 * Create a new water log entry
 */
router.post('/', async (req, res) => {
  const { userId, amountMl, loggedAt } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  if (amountMl === undefined || amountMl === null) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'amountMl is required',
      },
    });
  }

  const amountMlNum = parseInt(amountMl, 10);
  if (isNaN(amountMlNum) || amountMlNum <= 0 || amountMlNum > 10000) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'amountMl must be a positive integer between 0 and 10000',
      },
    });
  }

  const id = uuidv4();
  const loggedAtTimestamp = loggedAt ? new Date(loggedAt).toISOString() : new Date().toISOString();
  const now = new Date().toISOString();

  const result = await query(
    `INSERT INTO water_logs (id, user_id, amount_ml, logged_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, amount_ml, logged_at, created_at, updated_at`,
    [id, userId, amountMlNum, loggedAtTimestamp, now, now]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0],
  });
});

/**
 * PATCH /api/water-logs/:id
 * Update a water log entry
 */
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, amountMl, loggedAt } = req.body;

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
    `SELECT id FROM water_logs WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (existing.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'not_found',
        message: 'Water log entry not found',
      },
    });
  }

  // Build update query dynamically
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (amountMl !== undefined) {
    const amountMlNum = parseInt(amountMl, 10);
    if (isNaN(amountMlNum) || amountMlNum <= 0 || amountMlNum > 10000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'validation_error',
          message: 'amountMl must be a positive integer between 0 and 10000',
        },
      });
    }
    updates.push(`amount_ml = $${paramIndex++}`);
    values.push(amountMlNum);
  }

  if (loggedAt !== undefined) {
    updates.push(`logged_at = $${paramIndex++}`);
    values.push(new Date(loggedAt).toISOString());
  }

  updates.push(`updated_at = $${paramIndex++}`);
  values.push(new Date().toISOString());

  values.push(id, userId);

  const result = await query(
    `UPDATE water_logs
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
     RETURNING id, user_id, amount_ml, logged_at, created_at, updated_at`,
    values
  );

  res.json({
    success: true,
    data: result.rows[0],
  });
});

/**
 * DELETE /api/water-logs/:id
 * Delete a water log entry
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
    `DELETE FROM water_logs
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'not_found',
        message: 'Water log entry not found',
      },
    });
  }

  res.json({
    success: true,
    data: { id },
  });
});

export default router;
