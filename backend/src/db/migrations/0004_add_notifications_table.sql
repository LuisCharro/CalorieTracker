-- Add notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for querying user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, read, created_at DESC);

-- Create index for querying by type
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_created ON notifications(user_id, type, created_at DESC);
