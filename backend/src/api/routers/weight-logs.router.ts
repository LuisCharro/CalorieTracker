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
 * GET /api/weight-logs/progress
 * Get aggregated weight progress data for a user
 * Returns: startWeight, currentWeight, targetWeight, goalType, changeKg, remainingKg, progressPercent
 */
router.get('/progress', async (req, res) => {
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

  // Get user's weight goal and target from profile
  const userResult = await query(
    `SELECT weight_goal, target_weight_kg FROM users WHERE id = $1`,
    [userId]
  );

  const goalType = userResult.rows[0]?.weight_goal || null;
  const targetWeight = userResult.rows[0]?.target_weight_kg 
    ? parseFloat(userResult.rows[0].target_weight_kg) 
    : null;

  // Get earliest (start) and latest (current) weight
  const weightRangeResult = await query(
    `SELECT 
       MIN(weight_value) as start_weight,
       MAX(weight_value) as max_weight,
       (SELECT weight_value FROM weight_logs 
        WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 1) as current_weight,
       (SELECT weight_value FROM weight_logs 
        WHERE user_id = $1 ORDER BY logged_at ASC LIMIT 1) as first_weight
     FROM weight_logs
     WHERE user_id = $1`,
    [userId]
  );

  const hasWeightLogs = weightRangeResult.rows.length > 0 && weightRangeResult.rows[0].start_weight !== null;

  if (!hasWeightLogs) {
    return res.json({
      success: true,
      data: {
        startWeight: null,
        currentWeight: null,
        targetWeight,
        goalType,
        changeKg: null,
        remainingKg: null,
        progressPercent: null,
        hasWeightLogs: false,
        hasTarget: targetWeight !== null,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  const startWeight = parseFloat(weightRangeResult.rows[0].first_weight);
  const currentWeight = parseFloat(weightRangeResult.rows[0].current_weight);
  const changeKg = Math.round((currentWeight - startWeight) * 10) / 10;

  // Calculate remaining and progress
  let remainingKg: number | null = null;
  let progressPercent: number | null = null;

  if (targetWeight !== null) {
    const totalJourney = startWeight - targetWeight;
    
    if (totalJourney !== 0) {
      // Calculate remaining based on goal direction
      if (goalType === 'lose') {
        remainingKg = Math.round((currentWeight - targetWeight) * 10) / 10;
        // Progress: how much of the journey completed
        // For losing: if start > target, progress is how much lost vs total to lose
        progressPercent = Math.round(((startWeight - currentWeight) / totalJourney) * 100 * 10) / 10;
      } else if (goalType === 'gain') {
        remainingKg = Math.round((targetWeight - currentWeight) * 10) / 10;
        // For gaining: if start < target, progress is how much gained vs total to gain
        progressPercent = Math.round(((currentWeight - startWeight) / totalJourney) * 100 * 10) / 10;
      } else {
        // maintain - no remaining calculation needed
        remainingKg = 0;
        progressPercent = currentWeight === targetWeight ? 100 : 0;
      }
    } else {
      // Start equals target - divide by zero case
      remainingKg = 0;
      progressPercent = currentWeight === targetWeight ? 100 : 0;
    }

    // Clamp progress to 0-100 range
    progressPercent = Math.max(0, Math.min(100, progressPercent));
  }

  res.json({
    success: true,
    data: {
      startWeight,
      currentWeight,
      targetWeight,
      goalType,
      changeKg,
      remainingKg,
      progressPercent,
      hasWeightLogs: true,
      hasTarget: targetWeight !== null,
    },
    meta: {
      timestamp: new Date().toISOString(),
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
 * GET /api/weight-logs/progress
 * Get weight progress aggregation: startWeight, currentWeight, targetWeight, goalType, changeKg, remainingKg, progressPercent
 */
router.get('/progress', async (req, res) => {
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

  try {
    // Get earliest and latest weight logs
    const weightLogsResult = await query(
      `SELECT 
         MIN(weight_value) as start_weight,
         MAX(weight_value) as current_weight,
         COUNT(*) as log_count
       FROM weight_logs
       WHERE user_id = $1`,
      [userId]
    );

    // Get user's target weight
    const userResult = await query(
      `SELECT target_weight_kg FROM users WHERE id = $1`,
      [userId]
    );

    // Get active goal type
    const goalResult = await query(
      `SELECT goal_type FROM goals WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [userId]
    );

    const startWeight = parseFloat(weightLogsResult.rows[0]?.start_weight);
    const currentWeight = parseFloat(weightLogsResult.rows[0]?.current_weight);
    const logCount = parseInt(weightLogsResult.rows[0]?.log_count, 10);
    const targetWeight = userResult.rows[0]?.target_weight_kg 
      ? parseFloat(userResult.rows[0].target_weight_kg) 
      : null;
    const goalType = goalResult.rows[0]?.goal_type || null;

    // Edge case: no weight logs
    if (!startWeight || !currentWeight || logCount === 0) {
      return res.json({
        success: true,
        data: {
          hasData: false,
          message: 'No weight logs found',
          startWeight: null,
          currentWeight: null,
          targetWeight,
          goalType,
          changeKg: null,
          remainingKg: null,
          progressPercent: null,
        },
      });
    }

    // Calculate change
    const changeKg = Math.round((currentWeight - startWeight) * 10) / 10;

    // Calculate remaining and progress
    let remainingKg: number | null = null;
    let progressPercent: number | null = null;

    if (targetWeight) {
      const totalJourney = Math.abs(targetWeight - startWeight);
      
      if (totalJourney > 0) {
        // Calculate remaining based on goal type
        if (goalType === 'lose') {
          remainingKg = Math.round((currentWeight - targetWeight) * 10) / 10;
          // Progress: how much of the journey completed
          const completed = startWeight - currentWeight;
          progressPercent = Math.round((completed / totalJourney) * 100);
        } else if (goalType === 'gain') {
          remainingKg = Math.round((targetWeight - currentWeight) * 10) / 10;
          const completed = currentWeight - startWeight;
          progressPercent = Math.round((completed / totalJourney) * 100);
        } else {
          // maintain - progress is inverse of distance from target
          const distance = Math.abs(currentWeight - targetWeight);
          progressPercent = Math.round(Math.max(0, 100 - (distance / totalJourney * 100)));
        }
        
        // Clamp progress to 0-100
        progressPercent = Math.max(0, Math.min(100, progressPercent));
      } else {
        // start and target are equal - no journey to measure
        remainingKg = 0;
        progressPercent = currentWeight === targetWeight ? 100 : 0;
      }
    }

    res.json({
      success: true,
      data: {
        hasData: true,
        startWeight,
        currentWeight,
        targetWeight,
        goalType,
        changeKg,
        remainingKg,
        progressPercent,
        logCount,
      },
    });
  } catch (error) {
    console.error('Error calculating weight progress:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'internal_error',
        message: 'Failed to calculate weight progress',
      },
    });
  }
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
