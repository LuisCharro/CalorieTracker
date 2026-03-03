/**
 * Food History Router
 * Handles user's food history for intelligent suggestions
 */

import { Router } from 'express';
import { query } from '../../db/pool.js';

const router = Router();

/**
 * GET /api/food-history/recent
 * Get recently used foods for a user (last 30 days)
 * Used for quick-add suggestions
 */
router.get('/recent', async (req, res) => {
  const { userId, limit = '10' } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));

  try {
    const result = await query(
      `SELECT DISTINCT ON (food_name)
        id, user_id, food_name, brand_name, quantity, unit, nutrition, meal_type, logged_at
       FROM user_food_history
       WHERE user_id = $1
         AND logged_at >= NOW() - INTERVAL '30 days'
       ORDER BY food_name, logged_at DESC
       LIMIT $2`,
      [userId, limitNum]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error getting recent foods:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'internal_error',
        message: 'Failed to get recent foods',
      },
    });
  }
});

/**
 * GET /api/food-history/by-meal/:mealType
 * Get foods commonly logged for a specific meal type
 */
router.get('/by-meal/:mealType', async (req, res) => {
  const { mealType } = req.params;
  const { userId, limit = '10' } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  const validMeals = ['breakfast', 'lunch', 'dinner', 'snack'];
  if (!validMeals.includes(mealType)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Invalid meal type',
      },
    });
  }

  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));

  try {
    // Get most frequently logged foods for this meal type
    const result = await query(
      `SELECT 
        food_name, 
        brand_name,
        AVG(quantity) as avg_quantity,
        unit,
        nutrition,
        COUNT(*) as log_count,
        MAX(logged_at) as last_logged
       FROM user_food_history
       WHERE user_id = $1
         AND meal_type = $2
         AND logged_at >= NOW() - INTERVAL '60 days'
       GROUP BY food_name, brand_name, unit, nutrition
       ORDER BY log_count DESC
       LIMIT $3`,
      [userId, mealType, limitNum]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error getting foods by meal:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'internal_error',
        message: 'Failed to get foods by meal',
      },
    });
  }
});

/**
 * GET /api/food-history/suggestions
 * Get smart suggestions based on current time and meal type
 */
router.get('/suggestions', async (req, res) => {
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

  // Determine meal type from current hour
  const hour = new Date().getHours();
  let mealType: string;
  
  if (hour >= 6 && hour < 11) {
    mealType = 'breakfast';
  } else if (hour >= 11 && hour < 15) {
    mealType = 'lunch';
  } else if (hour >= 17 && hour < 21) {
    mealType = 'dinner';
  } else {
    mealType = 'snack';
  }

  try {
    // Get foods for the current meal type, sorted by frequency
    const result = await query(
      `SELECT 
        food_name, 
        brand_name,
        AVG(quantity) as avg_quantity,
        unit,
        nutrition,
        COUNT(*) as log_count,
        MAX(logged_at) as last_logged
       FROM user_food_history
       WHERE user_id = $1
         AND meal_type = $2
         AND logged_at >= NOW() - INTERVAL '30 days'
       GROUP BY food_name, brand_name, unit, nutrition
       ORDER BY log_count DESC
       LIMIT 10`,
      [userId, mealType]
    );

    res.json({
      success: true,
      data: {
        suggestions: result.rows,
        mealType,
        hour,
      },
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'internal_error',
        message: 'Failed to get suggestions',
      },
    });
  }
});

/**
 * GET /api/food-history/popular
 * Get most frequently logged foods across all meals
 */
router.get('/popular', async (req, res) => {
  const { userId, limit = '10' } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));

  try {
    const result = await query(
      `SELECT 
        food_name, 
        brand_name,
        AVG(quantity) as avg_quantity,
        unit,
        nutrition,
        COUNT(*) as log_count,
        MAX(logged_at) as last_logged,
        MODE() WITHIN GROUP (ORDER BY meal_type) as most_common_meal
       FROM user_food_history
       WHERE user_id = $1
         AND logged_at >= NOW() - INTERVAL '60 days'
       GROUP BY food_name, brand_name, unit, nutrition
       ORDER BY log_count DESC
       LIMIT $2`,
      [userId, limitNum]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error getting popular foods:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'internal_error',
        message: 'Failed to get popular foods',
      },
    });
  }
});

/**
 * POST /api/food-history
 * Add a food entry to user's history
 * Called automatically when user logs a food
 */
router.post('/', async (req, res) => {
  const { userId, foodName, brandName, quantity, unit, nutrition, mealType, loggedAt } = req.body;

  if (!userId || !foodName || !quantity || !unit || !mealType) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Missing required fields',
      },
    });
  }

  const validMeals = ['breakfast', 'lunch', 'dinner', 'snack'];
  if (!validMeals.includes(mealType)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Invalid meal type',
      },
    });
  }

  try {
    const result = await query(
      `INSERT INTO user_food_history 
        (user_id, food_name, brand_name, quantity, unit, nutrition, meal_type, logged_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, foodName, brandName || null, quantity, unit, JSON.stringify(nutrition), mealType, loggedAt || new Date()]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error adding to food history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'internal_error',
        message: 'Failed to add to food history',
      },
    });
  }
});

export default router;
