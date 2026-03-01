/**
 * Exercises router
 * Handles exercise logging CRUD operations
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';

const router = Router();

/**
 * GET /api/exercises
 * Get exercise entries for a user with pagination
 * Returns items sorted by created_at (most recent first)
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
     FROM exercises
     WHERE user_id = $1`,
    [userId]
  );

  const total = parseInt(countResult.rows[0].total, 10);

  // Get paginated results sorted by date
  const result = await query(
    `SELECT id, user_id, name, duration_minutes, calories_burned, created_at
     FROM exercises
     WHERE user_id = $1
     ORDER BY created_at DESC
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
 * GET /api/exercises/summary
 * Get exercise summary for a user (total duration and calories for date range)
 */
router.get('/summary', async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  let dateFilter = '';
  const params = [userId];

  if (startDate && endDate) {
    dateFilter = 'AND created_at >= $2 AND created_at <= $3';
    params.push(startDate as string, endDate as string);
  } else if (startDate) {
    dateFilter = 'AND created_at >= $2';
    params.push(startDate as string);
  } else if (endDate) {
    dateFilter = 'AND created_at <= $2';
    params.push(endDate as string);
  }

  const result = await query(
    `SELECT 
       COUNT(*) as total_workouts,
       COALESCE(SUM(duration_minutes), 0) as total_minutes,
       COALESCE(SUM(calories_burned), 0) as total_calories
     FROM exercises
     WHERE user_id = $1 ${dateFilter}`,
    params
  );

  res.json({
    success: true,
    data: {
      totalWorkouts: parseInt(result.rows[0].total_workouts, 10),
      totalMinutes: parseInt(result.rows[0].total_minutes, 10),
      totalCalories: parseInt(result.rows[0].total_calories, 10),
    },
  });
});

/**
 * GET /api/exercises/:id
 * Get a single exercise entry by ID
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
    `SELECT id, user_id, name, duration_minutes, calories_burned, created_at
     FROM exercises
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'not_found',
        message: 'Exercise entry not found',
      },
    });
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
});

/**
 * POST /api/exercises
 * Create a new exercise entry
 */
router.post('/', async (req, res) => {
  const { userId, name, durationMinutes, caloriesBurned } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'name is required',
      },
    });
  }

  if (durationMinutes === undefined || durationMinutes === null) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'durationMinutes is required',
      },
    });
  }

  const durationMinutesNum = parseInt(durationMinutes, 10);
  if (isNaN(durationMinutesNum) || durationMinutesNum <= 0 || durationMinutesNum > 1440) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'durationMinutes must be a positive number between 1 and 1440',
      },
    });
  }

  let caloriesBurnedNum = null;
  if (caloriesBurned !== undefined && caloriesBurned !== null) {
    caloriesBurnedNum = parseInt(caloriesBurned, 10);
    if (isNaN(caloriesBurnedNum) || caloriesBurnedNum < 0 || caloriesBurnedNum > 10000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'validation_error',
          message: 'caloriesBurned must be a number between 0 and 10000',
        },
      });
    }
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  const result = await query(
    `INSERT INTO exercises (id, user_id, name, duration_minutes, calories_burned, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, name, duration_minutes, calories_burned, created_at`,
    [id, userId, name.trim(), durationMinutesNum, caloriesBurnedNum, now]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0],
  });
});

/**
 * PATCH /api/exercises/:id
 * Update an exercise entry
 */
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, name, durationMinutes, caloriesBurned } = req.body;

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
    `SELECT id FROM exercises WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (existing.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'not_found',
        message: 'Exercise entry not found',
      },
    });
  }

  // Build update query dynamically
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'validation_error',
          message: 'name must be a non-empty string',
        },
      });
    }
    updates.push(`name = $${paramIndex++}`);
    values.push(name.trim());
  }

  if (durationMinutes !== undefined) {
    const durationMinutesNum = parseInt(durationMinutes, 10);
    if (isNaN(durationMinutesNum) || durationMinutesNum <= 0 || durationMinutesNum > 1440) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'validation_error',
          message: 'durationMinutes must be a positive number between 1 and 1440',
        },
      });
    }
    updates.push(`duration_minutes = $${paramIndex++}`);
    values.push(durationMinutesNum);
  }

  if (caloriesBurned !== undefined) {
    let caloriesBurnedNum = null;
    if (caloriesBurned !== null) {
      caloriesBurnedNum = parseInt(caloriesBurned, 10);
      if (isNaN(caloriesBurnedNum) || caloriesBurnedNum < 0 || caloriesBurnedNum > 10000) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'validation_error',
            message: 'caloriesBurned must be a number between 0 and 10000',
          },
        });
      }
    }
    updates.push(`calories_burned = $${paramIndex++}`);
    values.push(caloriesBurnedNum);
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

  values.push(id, userId);

  const result = await query(
    `UPDATE exercises
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
     RETURNING id, user_id, name, duration_minutes, calories_burned, created_at`,
    values
  );

  res.json({
    success: true,
    data: result.rows[0],
  });
});

/**
 * DELETE /api/exercises/:id
 * Delete an exercise entry
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
    `DELETE FROM exercises
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'not_found',
        message: 'Exercise entry not found',
      },
    });
  }

  res.json({
    success: true,
    data: { id },
  });
});

export default router;
