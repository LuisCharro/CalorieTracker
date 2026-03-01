-- Exercises table for tracking physical activities
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  calories_burned INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);

-- Index for sorting by date (for history view)
CREATE INDEX IF NOT EXISTS idx_exercises_user_created_at ON exercises(user_id, created_at DESC);
