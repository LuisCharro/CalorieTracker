-- Food Cache table for storing frequently used foods
CREATE TABLE IF NOT EXISTS food_cache (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  food_name TEXT NOT NULL,
  brand_name TEXT,
  default_quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  default_unit TEXT NOT NULL DEFAULT 'serving',
  nutrition JSONB NOT NULL,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_food_cache_user_id ON food_cache(user_id);

-- Index for sorting by usage (for "recent foods" feature)
CREATE INDEX IF NOT EXISTS idx_food_cache_user_use_count ON food_cache(user_id, use_count DESC);

-- Index for searching by food name
CREATE INDEX IF NOT EXISTS idx_food_cache_food_name ON food_cache(user_id, food_name);
