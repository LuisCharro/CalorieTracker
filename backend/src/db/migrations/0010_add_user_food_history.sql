-- Migration: Add user_food_history table for intelligent food suggestions
-- Created: 2026-03-03
-- Purpose: Store user's food logging history for quick-candidate suggestions

CREATE TABLE IF NOT EXISTS user_food_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  brand_name TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  nutrition JSONB NOT NULL DEFAULT '{}',
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_food_history_user ON user_food_history(user_id);

-- Index for meal-type specific queries
CREATE INDEX IF NOT EXISTS idx_user_food_history_meal ON user_food_history(user_id, meal_type);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_user_food_history_date ON user_food_history(user_id, logged_at DESC);

-- Index for popular foods query
CREATE INDEX IF NOT EXISTS idx_user_food_history_food_name ON user_food_history(user_id, food_name);

COMMENT ON TABLE user_food_history IS 'Stores user food logging history for intelligent quick-add suggestions';
COMMENT ON COLUMN user_food_history.meal_type IS 'Meal type when food was logged: breakfast, lunch, dinner, or snack';
