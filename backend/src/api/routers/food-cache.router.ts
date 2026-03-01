/**
 * Food Cache router
 * Handles food cache CRUD operations for frequently used foods
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';
import {
  validateBody,
  validateParams,
  validateQuery,
  NotFoundError,
  foodCacheQuerySchema,
  createFoodCacheSchema,
  updateFoodCacheSchema,
  foodCacheIdSchema,
} from '../validation/schemas.js';

const router = Router();

/**
 * GET /api/food-cache
 * Get food cache entries for a user with pagination
 * Returns items sorted by use_count (most frequently used first)
 */
router.get('/', async (req, res) => {
  const params = validateQuery(foodCacheQuerySchema, req.query);
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

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM food_cache
     WHERE user_id = $1`,
    [userId]
  );

  const total = parseInt(countResult.rows[0].total, 10);

  // Get paginated results sorted by use_count
  const result = await query(
    `SELECT id, user_id, food_name, brand_name, default_quantity, default_unit, nutrition, use_count, last_used_at, created_at, updated_at
     FROM food_cache
     WHERE user_id = $1
     ORDER BY use_count DESC, last_used_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, params.pageSize, offset]
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
 * GET /api/food-cache/search
 * Search food cache by name for a user
 */
router.get('/search', async (req, res) => {
  const { userId, query: searchQuery, limit } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  if (!searchQuery || typeof searchQuery !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'query parameter is required',
      },
    });
  }

  const searchLimit = limit ? parseInt(limit as string, 10) : 10;

  const result = await query(
    `SELECT id, user_id, food_name, brand_name, default_quantity, default_unit, nutrition, use_count, last_used_at
     FROM food_cache
     WHERE user_id = $1 AND food_name ILIKE $2
     ORDER BY use_count DESC
     LIMIT $3`,
    [userId, `%${searchQuery}%`, searchLimit]
  );

  res.json({
    success: true,
    data: result.rows,
    meta: {
      timestamp: new Date().toISOString(),
      query: searchQuery,
      count: result.rows.length,
    },
  });
});

/**
 * GET /api/food-cache/recent
 * Get recently used foods (top 10)
 */
router.get('/recent', async (req, res) => {
  const { userId, limit } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  const searchLimit = limit ? parseInt(limit as string, 10) : 10;

  const result = await query(
    `SELECT id, user_id, food_name, brand_name, default_quantity, default_unit, nutrition, use_count, last_used_at
     FROM food_cache
     WHERE user_id = $1
     ORDER BY last_used_at DESC
     LIMIT $2`,
    [userId, searchLimit]
  );

  res.json({
    success: true,
    data: result.rows,
    meta: {
      timestamp: new Date().toISOString(),
      count: result.rows.length,
    },
  });
});

/**
 * GET /api/food-cache/:foodCacheId
 * Get a single food cache entry
 */
router.get('/:foodCacheId', async (req, res) => {
  const { foodCacheId } = validateParams(foodCacheIdSchema, req.params);

  const result = await query(
    `SELECT id, user_id, food_name, brand_name, default_quantity, default_unit, nutrition, use_count, last_used_at, created_at, updated_at
     FROM food_cache
     WHERE id = $1`,
    [foodCacheId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Food cache entry', foodCacheId);
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
 * POST /api/food-cache
 * Create a new food cache entry
 * Also increments use_count if food already exists (upsert logic)
 */
router.post('/', async (req, res) => {
  const data = validateBody(createFoodCacheSchema, req.body);

  // Check if this food already exists for the user
  const existingResult = await query(
    `SELECT id, use_count FROM food_cache
     WHERE user_id = $1 AND LOWER(food_name) = LOWER($2) AND (brand_name = $3 OR (brand_name IS NULL AND $3 IS NULL))`,
    [data.userId, data.foodName, data.brandName || null]
  );

  if (existingResult.rows.length > 0) {
    // Food exists, increment use_count and update last_used_at
    const existing = existingResult.rows[0];
    const updatedResult = await query(
      `UPDATE food_cache
       SET use_count = use_count + 1,
           last_used_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, food_name, brand_name, default_quantity, default_unit, nutrition, use_count, last_used_at, created_at, updated_at`,
      [existing.id]
    );

    return res.json({
      success: true,
      data: updatedResult.rows[0],
      meta: {
        timestamp: new Date().toISOString(),
        action: 'incremented',
      },
    });
  }

  // Create new entry
  const id = uuidv4();
  const result = await query(
    `INSERT INTO food_cache (id, user_id, food_name, brand_name, default_quantity, default_unit, nutrition, use_count, last_used_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, user_id, food_name, brand_name, default_quantity, default_unit, nutrition, use_count, last_used_at, created_at, updated_at`,
    [
      id,
      data.userId,
      data.foodName,
      data.brandName || null,
      data.defaultQuantity || 1,
      data.defaultUnit || 'serving',
      JSON.stringify(data.nutrition),
      1, // Initial use_count
      new Date(),
      new Date(),
      new Date(),
    ]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0],
    meta: {
      timestamp: new Date().toISOString(),
      action: 'created',
    },
  });
});

/**
 * POST /api/food-cache/use/:foodCacheId
 * Record usage of a food cache entry (increment use_count)
 */
router.post('/use/:foodCacheId', async (req, res) => {
  const { foodCacheId } = validateParams(foodCacheIdSchema, req.params);

  const result = await query(
    `UPDATE food_cache
     SET use_count = use_count + 1,
         last_used_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, food_name, brand_name, default_quantity, default_unit, nutrition, use_count, last_used_at, created_at, updated_at`,
    [foodCacheId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Food cache entry', foodCacheId);
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
 * PATCH /api/food-cache/:foodCacheId
 * Update a food cache entry
 */
router.patch('/:foodCacheId', async (req, res) => {
  const { foodCacheId } = validateParams(foodCacheIdSchema, req.params);
  const data = validateBody(updateFoodCacheSchema, req.body);

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

  if (data.defaultQuantity !== undefined) {
    updates.push(`default_quantity = $${paramIndex++}`);
    values.push(data.defaultQuantity);
  }

  if (data.defaultUnit !== undefined) {
    updates.push(`default_unit = $${paramIndex++}`);
    values.push(data.defaultUnit);
  }

  if (data.nutrition !== undefined) {
    updates.push(`nutrition = $${paramIndex++}`);
    values.push(JSON.stringify(data.nutrition));
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
  values.push(foodCacheId);

  const result = await query(
    `UPDATE food_cache
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, user_id, food_name, brand_name, default_quantity, default_unit, nutrition, use_count, last_used_at, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Food cache entry', foodCacheId);
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
 * DELETE /api/food-cache/:foodCacheId
 * Delete a food cache entry
 */
router.delete('/:foodCacheId', async (req, res) => {
  const { foodCacheId } = validateParams(foodCacheIdSchema, req.params);

  const result = await query(
    `DELETE FROM food_cache
     WHERE id = $1
     RETURNING id`,
    [foodCacheId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Food cache entry', foodCacheId);
  }

  res.status(204).send();
});

export default router;
