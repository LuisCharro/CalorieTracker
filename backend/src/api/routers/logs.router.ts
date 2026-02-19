/**
 * Food logs router
 * Handles food log CRUD operations
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';
import {
  validateBody,
  validateParams,
  validateQuery,
  NotFoundError,
  foodLogsQuerySchema,
  createFoodLogSchema,
  updateFoodLogSchema,
  foodLogIdSchema,
} from '../validation/schemas.js';

const router = Router();

/**
 * GET /api/logs
 * Get food logs with pagination and filtering
 */
router.get('/', async (req, res) => {
  const params = validateQuery(foodLogsQuerySchema, req.query);
  const { userId } = req.query; // TODO: Extract from auth session

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

  let whereClauses = ['user_id = $1', 'is_deleted = FALSE'];
  let queryParams: unknown[] = [userId];
  let paramIndex = 2;

  if (params.mealType) {
    whereClauses.push(`meal_type = $${paramIndex++}`);
    queryParams.push(params.mealType);
  }

  if (params.startDate) {
    whereClauses.push(`logged_at >= $${paramIndex++}`);
    queryParams.push(params.startDate);
  }

  if (params.endDate) {
    whereClauses.push(`logged_at <= $${paramIndex++}`);
    queryParams.push(params.endDate);
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM food_logs
     WHERE ${whereClauses.join(' AND ')}`,
    queryParams
  );

  const total = parseInt(countResult.rows[0].total, 10);

  // Get paginated results
  const result = await query(
    `SELECT id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at
     FROM food_logs
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY logged_at DESC
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
 * GET /api/logs/today
 * Get today's food logs grouped by meal type
 */
router.get('/today', async (req, res) => {
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
    `SELECT id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at
     FROM food_logs
     WHERE user_id = $1
       AND DATE(logged_at) = CURRENT_DATE
       AND is_deleted = FALSE
     ORDER BY meal_type, logged_at ASC`,
    [userId]
  );

  // Group by meal type
  const grouped: Record<string, typeof result.rows> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  for (const row of result.rows) {
    const mealType = row.meal_type as string;
    if (grouped[mealType]) {
      grouped[mealType].push(row);
    }
  }

  res.json({
    success: true,
    data: grouped,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/logs/:foodLogId
 * Get a single food log
 */
router.get('/:foodLogId', async (req, res) => {
  const { foodLogId } = validateParams(foodLogIdSchema, req.params);

  const result = await query(
    `SELECT id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at
     FROM food_logs
     WHERE id = $1 AND is_deleted = FALSE`,
    [foodLogId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Food log', foodLogId);
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
 * POST /api/logs
 * Create a new food log
 */
router.post('/', async (req, res) => {
  const data = validateBody(createFoodLogSchema, req.body);

  const id = uuidv4();
  const loggedAt = data.loggedAt ? new Date(data.loggedAt) : new Date();

  const result = await query(
    `INSERT INTO food_logs (id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at`,
    [
      id,
      data.userId,
      data.foodName,
      data.brandName || null,
      data.quantity,
      data.unit,
      data.mealType,
      JSON.stringify(data.nutrition),
      loggedAt,
      new Date(),
      new Date(),
    ]
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
 * PATCH /api/logs/:foodLogId
 * Update a food log
 */
router.patch('/:foodLogId', async (req, res) => {
  const { foodLogId } = validateParams(foodLogIdSchema, req.params);
  const data = validateBody(updateFoodLogSchema, req.body);

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.foodName !== undefined) {
    updates.push(`food_name = $${paramIndex++}`);
    values.push(data.foodName);
  }

  if (data.brandName !== undefined) {
    updates.push(`brand_name = $${paramIndex++}`);
    values.push(data.brandName);
  }

  if (data.quantity !== undefined) {
    updates.push(`quantity = $${paramIndex++}`);
    values.push(data.quantity);
  }

  if (data.unit !== undefined) {
    updates.push(`unit = $${paramIndex++}`);
    values.push(data.unit);
  }

  if (data.mealType !== undefined) {
    updates.push(`meal_type = $${paramIndex++}`);
    values.push(data.mealType);
  }

  if (data.nutrition !== undefined) {
    updates.push(`nutrition = $${paramIndex++}`);
    values.push(JSON.stringify(data.nutrition));
  }

  if (data.loggedAt !== undefined) {
    updates.push(`logged_at = $${paramIndex++}`);
    values.push(new Date(data.loggedAt));
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
  values.push(foodLogId);

  const result = await query(
    `UPDATE food_logs
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex} AND is_deleted = FALSE
     RETURNING id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Food log', foodLogId);
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
 * DELETE /api/logs/:foodLogId
 * Soft delete a food log
 */
router.delete('/:foodLogId', async (req, res) => {
  const { foodLogId } = validateParams(foodLogIdSchema, req.params);

  const result = await query(
    `UPDATE food_logs
     SET is_deleted = TRUE, updated_at = NOW()
     WHERE id = $1 AND is_deleted = FALSE
     RETURNING id`,
    [foodLogId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Food log', foodLogId);
  }

  res.status(204).send();
});

export default router;
