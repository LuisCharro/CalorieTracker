-- Water Logs table for tracking daily water intake
CREATE TABLE IF NOT EXISTS water_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON water_logs(user_id);

-- Index for sorting by date (for history view)
CREATE INDEX IF NOT EXISTS idx_water_logs_user_logged_at ON water_logs(user_id, logged_at DESC);
