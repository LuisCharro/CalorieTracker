/**
 * Goals router
 * Handles goal CRUD operations and calculations
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';
import {
  validateBody,
  validateParams,
  validateQuery,
  NotFoundError,
  goalsQuerySchema,
  createGoalSchema,
  updateGoalSchema,
  goalIdSchema,
} from '../validation/schemas.js';

const router = Router();

/**
 * GET /api/goals
 * Get goals with pagination and filtering
 */
router.get('/', async (req, res) => {
  const params = validateQuery(goalsQuerySchema, req.query);
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

  if (params.isActive !== undefined) {
    whereClauses.push(`is_active = $${paramIndex++}`);
    queryParams.push(params.isActive);
  }

  if (params.goalType) {
    whereClauses.push(`goal_type = $${paramIndex++}`);
    queryParams.push(params.goalType);
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM goals
     WHERE ${whereClauses.join(' AND ')}`,
    queryParams
  );

  const total = parseInt(countResult.rows[0].total, 10);

  // Get paginated results
  const result = await query(
    `SELECT id, user_id, goal_type, target_value, is_active, start_date, end_date, created_at, updated_at
     FROM goals
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY created_at DESC
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
 * GET /api/goals/active
 * Get active goals for a user
 */
router.get('/active', async (req, res) => {
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
    `SELECT id, user_id, goal_type, target_value, is_active, start_date, end_date, created_at, updated_at
     FROM goals
     WHERE user_id = $1 AND is_active = TRUE
       AND (end_date IS NULL OR end_date >= CURRENT_DATE)
     ORDER BY goal_type, start_date DESC`,
    [userId]
  );

  res.json({
    success: true,
    data: result.rows,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/goals/:goalId
 * Get a single goal
 */
router.get('/:goalId', async (req, res) => {
  const { goalId } = validateParams(goalIdSchema, req.params);

  const result = await query(
    `SELECT id, user_id, goal_type, target_value, is_active, start_date, end_date, created_at, updated_at
     FROM goals
     WHERE id = $1`,
    [goalId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Goal', goalId);
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
 * GET /api/goals/:goalId/progress
 * Calculate goal progress
 */
router.get('/:goalId/progress', async (req, res) => {
  const { goalId } = validateParams(goalIdSchema, req.params);

  // Get goal details
  const goalResult = await query(
    `SELECT id, user_id, goal_type, target_value, is_active, start_date, end_date, created_at, updated_at
     FROM goals
     WHERE id = $1`,
    [goalId]
  );

  if (goalResult.rows.length === 0) {
    throw new NotFoundError('Goal', goalId);
  }

  const goal = goalResult.rows[0];

  // Calculate progress based on goal type
  let progress = 0;
  let currentValue = 0;

  if (goal.goal_type === 'daily_calories') {
    // Sum today's calories
    const caloriesResult = await query(
      `SELECT SUM(nutrition->>'calories'::numeric) as total
       FROM food_logs
       WHERE user_id = $1
         AND DATE(logged_at) = CURRENT_DATE
         AND is_deleted = FALSE`,
      [goal.user_id]
    );

    currentValue = parseFloat(caloriesResult.rows[0].total) || 0;
    progress = (currentValue / goal.target_value) * 100;
  }

  res.json({
    success: true,
    data: {
      goalId: goal.id,
      goalType: goal.goal_type,
      targetValue: goal.target_value,
      currentValue,
      progress: Math.min(progress, 100),
      isOnTrack: currentValue <= goal.target_value,
      remaining: Math.max(goal.target_value - currentValue, 0),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * POST /api/goals
 * Create a new goal
 */
router.post('/', async (req, res) => {
  const data = validateBody(createGoalSchema, req.body);

  const id = uuidv4();
  const startDate = new Date(data.startDate);
  const endDate = data.endDate ? new Date(data.endDate) : null;

  const result = await query(
    `INSERT INTO goals (id, user_id, goal_type, target_value, is_active, start_date, end_date, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, user_id, goal_type, target_value, is_active, start_date, end_date, created_at, updated_at`,
    [id, data.userId, data.goalType, data.targetValue, true, startDate, endDate, new Date(), new Date()]
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
 * PATCH /api/goals/:goalId
 * Update a goal
 */
router.patch('/:goalId', async (req, res) => {
  const { goalId } = validateParams(goalIdSchema, req.params);
  const data = validateBody(updateGoalSchema, req.body);

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.targetValue !== undefined) {
    updates.push(`target_value = $${paramIndex++}`);
    values.push(data.targetValue);
  }

  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }

  if (data.endDate !== undefined) {
    updates.push(`end_date = $${paramIndex++}`);
    values.push(data.endDate ? new Date(data.endDate) : null);
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

  updates.push(`updated_at = NOW()`);
  values.push(goalId);

  const result = await query(
    `UPDATE goals
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, user_id, goal_type, target_value, is_active, start_date, end_date, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Goal', goalId);
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
 * DELETE /api/goals/:goalId
 * Delete a goal
 */
router.delete('/:goalId', async (req, res) => {
  const { goalId } = validateParams(goalIdSchema, req.params);

  const result = await query(
    `DELETE FROM goals WHERE id = $1 RETURNING id`,
    [goalId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Goal', goalId);
  }

  res.status(204).send();
});

export default router;
