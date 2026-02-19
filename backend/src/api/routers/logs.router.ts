/**
 * Food logs router
 * Handles food log CRUD operations
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';
import { parseFoodText } from '../utils/nutrition-parser.js';
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
 * Returns items grouped by meal type when groupByMeal=true
 */
router.get('/', async (req, res) => {
  const params = validateQuery(foodLogsQuerySchema, req.query);
  const { userId, groupByMeal } = req.query;

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

  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM food_logs
     WHERE ${whereClauses.join(' AND ')}`,
    queryParams
  );

  const total = parseInt(countResult.rows[0].total, 10);

  const result = await query(
    `SELECT id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at
     FROM food_logs
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY logged_at DESC, created_at ASC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...queryParams, params.pageSize, offset]
  );

  const totalPages = Math.ceil(total / params.pageSize);

  interface FoodLogRow {
    id: string;
    user_id: string;
    food_name: string;
    brand_name: string | null;
    quantity: string | number;
    unit: string;
    meal_type: string;
    nutrition: { calories?: number; protein?: number; carbohydrates?: number; fat?: number };
    logged_at: Date;
    created_at: Date;
    updated_at: Date;
  }

  const items = result.rows.map((row): FoodLogRow => ({
    ...row,
    quantity: parseFloat(row.quantity as string),
  }));

  if (groupByMeal === 'true') {
    const grouped: Record<string, FoodLogRow[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    const mealTotals: Record<string, { count: number; calories: number }> = {
      breakfast: { count: 0, calories: 0 },
      lunch: { count: 0, calories: 0 },
      dinner: { count: 0, calories: 0 },
      snack: { count: 0, calories: 0 },
    };

    for (const item of items) {
      const mealType = item.meal_type as string;
      if (grouped[mealType]) {
        grouped[mealType].push(item);
        mealTotals[mealType].count++;
        mealTotals[mealType].calories += item.nutrition?.calories || 0;
      }
    }

    return res.json({
      success: true,
      data: grouped,
      mealTotals,
      meta: {
        timestamp: new Date().toISOString(),
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages,
      },
    });
  }

  const totalCalories = items.reduce((sum, item) => sum + (item.nutrition?.calories || 0), 0);
  const totalProtein = items.reduce((sum, item) => sum + (item.nutrition?.protein || 0), 0);

  res.json({
    success: true,
    data: items,
    summary: {
      totalCalories,
      totalProtein,
    },
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
 * Returns full item details with calorie totals per meal
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
     ORDER BY meal_type, created_at ASC`,
    [userId]
  );

  interface FoodLogRow {
    id: string;
    user_id: string;
    food_name: string;
    brand_name: string | null;
    quantity: string | number;
    unit: string;
    meal_type: string;
    nutrition: { calories?: number; protein?: number; carbohydrates?: number; fat?: number };
    logged_at: Date;
    created_at: Date;
    updated_at: Date;
  }

  interface MealGroup {
    items: FoodLogRow[];
    itemCount: number;
    totalCalories: number;
    totalProtein: number;
  }

  const grouped: Record<string, MealGroup> = {
    breakfast: { items: [], itemCount: 0, totalCalories: 0, totalProtein: 0 },
    lunch: { items: [], itemCount: 0, totalCalories: 0, totalProtein: 0 },
    dinner: { items: [], itemCount: 0, totalCalories: 0, totalProtein: 0 },
    snack: { items: [], itemCount: 0, totalCalories: 0, totalProtein: 0 },
  };

  for (const row of result.rows) {
    const mealType = row.meal_type as string;
    if (grouped[mealType]) {
      const calories = row.nutrition?.calories || 0;
      const protein = row.nutrition?.protein || 0;
      
      grouped[mealType].items.push({
        ...row,
        quantity: parseFloat(row.quantity as string),
      });
      grouped[mealType].itemCount++;
      grouped[mealType].totalCalories += calories;
      grouped[mealType].totalProtein += protein;
    }
  }

  const totalCount = result.rows.length;
  const totalCalories = Object.values(grouped).reduce((sum, meal) => sum + meal.totalCalories, 0);
  const totalProtein = Object.values(grouped).reduce((sum, meal) => sum + meal.totalProtein, 0);

  res.json({
    success: true,
    data: grouped,
    summary: {
      totalItems: totalCount,
      totalCalories,
      totalProtein,
      mealsWithItems: Object.entries(grouped).filter(([_, m]) => m.itemCount > 0).map(([type]) => type),
    },
    meta: {
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      userId,
    },
  });
});

/**
 * GET /api/logs/meal/:mealType
 * Get all items for a specific meal type on a given date
 */
router.get('/meal/:mealType', async (req, res) => {
  const { mealType } = req.params;
  const { userId, date } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  if (!validMealTypes.includes(mealType)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: `Invalid mealType. Must be one of: ${validMealTypes.join(', ')}`,
      },
    });
  }

  const targetDate = date || new Date().toISOString().split('T')[0];

  const result = await query(
    `SELECT id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at
     FROM food_logs
     WHERE user_id = $1
       AND meal_type = $2
       AND DATE(logged_at) = $3
       AND is_deleted = FALSE
     ORDER BY created_at ASC`,
    [userId, mealType, targetDate]
  );

  interface FoodLogRow {
    id: string;
    user_id: string;
    food_name: string;
    brand_name: string | null;
    quantity: number;
    unit: string;
    meal_type: string;
    nutrition: { calories?: number; protein?: number; carbohydrates?: number; fat?: number };
    logged_at: Date;
    created_at: Date;
    updated_at: Date;
  }

  const items: FoodLogRow[] = result.rows.map(row => ({
    ...row,
    quantity: parseFloat(row.quantity as string),
  }));

  const totalCalories = items.reduce((sum, item) => sum + (item.nutrition?.calories || 0), 0);
  const totalProtein = items.reduce((sum, item) => sum + (item.nutrition?.protein || 0), 0);

  res.json({
    success: true,
    data: {
      mealType,
      date: targetDate,
      items,
      itemCount: items.length,
      totals: {
        calories: totalCalories,
        protein: totalProtein,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
      userId,
    },
  });
});

/**
 * POST /api/logs/parse
 * Parse food text and extract nutrition information
 */
router.post('/parse', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'text is required and must be a string',
      },
    });
  }

  try {
    const parsed = parseFoodText(text);
    res.json({
      success: true,
      data: parsed,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'parse_error',
        message: (error as Error).message || 'Failed to parse food text',
      },
    });
  }
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
 * POST /api/logs/batch
 * Create multiple food logs for a meal (batch operation)
 * Returns complete item details for all created items
 */
router.post('/batch', async (req, res) => {
  const { userId, mealName, mealType, items, loggedAt } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  if (!mealType) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'mealType is required',
      },
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'items must be a non-empty array',
      },
    });
  }

  const loggedAtValue = loggedAt ? new Date(loggedAt) : new Date();
  const createdAt = new Date();
  
  interface BatchItemResult {
    id: string;
    userId: string;
    foodName: string;
    brandName: string | null;
    quantity: number;
    unit: string;
    mealType: string;
    nutrition: Record<string, number>;
    loggedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    success: boolean;
    error?: string;
  }
  
  const results: BatchItemResult[] = [];

  for (const item of items) {
    try {
      if (!item.foodName || !item.quantity || !item.unit || !item.nutrition) {
        results.push({
          id: '',
          userId,
          foodName: item.foodName || 'Unknown',
          brandName: item.brandName || null,
          quantity: item.quantity || 0,
          unit: item.unit || '',
          mealType,
          nutrition: item.nutrition || {},
          loggedAt: loggedAtValue,
          createdAt,
          updatedAt: createdAt,
          success: false,
          error: 'Missing required fields: foodName, quantity, unit, nutrition',
        });
        continue;
      }

      const id = uuidv4();
      const insertResult = await query(
        `INSERT INTO food_logs (id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at`,
        [
          id,
          userId,
          item.foodName,
          item.brandName || null,
          item.quantity,
          item.unit,
          mealType,
          JSON.stringify(item.nutrition),
          loggedAtValue,
          createdAt,
          createdAt,
        ]
      );

      const row = insertResult.rows[0];
      results.push({
        id: row.id,
        userId: row.user_id,
        foodName: row.food_name,
        brandName: row.brand_name,
        quantity: parseFloat(row.quantity),
        unit: row.unit,
        mealType: row.meal_type,
        nutrition: row.nutrition,
        loggedAt: row.logged_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        success: true,
      });
    } catch (error) {
      results.push({
        id: '',
        userId,
        foodName: item.foodName || 'Unknown',
        brandName: item.brandName || null,
        quantity: item.quantity || 0,
        unit: item.unit || '',
        mealType,
        nutrition: item.nutrition || {},
        loggedAt: loggedAtValue,
        createdAt,
        updatedAt: createdAt,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;
  const createdItems = results.filter(r => r.success);

  const totalCalories = createdItems.reduce((sum, item) => sum + (item.nutrition?.calories || 0), 0);
  const totalProtein = createdItems.reduce((sum, item) => sum + (item.nutrition?.protein || 0), 0);

  res.status(201).json({
    success: errorCount === 0,
    data: {
      mealName: mealName || mealType,
      mealType,
      items: results,
      summary: {
        total: items.length,
        created: successCount,
        errors: errorCount,
      },
      totals: {
        calories: totalCalories,
        protein: totalProtein,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
      userId,
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
