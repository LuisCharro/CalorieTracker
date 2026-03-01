-- Weight Logs table for tracking body weight over time
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  weight_value NUMERIC(5,1) NOT NULL,
  weight_unit TEXT NOT NULL DEFAULT 'kg',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON weight_logs(user_id);

-- Index for sorting by date (for history view)
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_logged_at ON weight_logs(user_id, logged_at DESC);
