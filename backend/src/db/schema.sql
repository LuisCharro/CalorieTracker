-- Canonical MVP schema aligned with docs 25/26/27/28

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS food_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  food_name TEXT NOT NULL,
  brand_name TEXT,
  quantity NUMERIC(12,3) NOT NULL,
  unit TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  nutrition JSONB NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  goal_type TEXT NOT NULL,
  target_value NUMERIC(12,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  reminder_times JSONB NOT NULL DEFAULT '[]'::jsonb,
  timezone TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consent_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  consent_type TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gdpr_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  request_type TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS processing_activities (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  activity_type TEXT NOT NULL,
  data_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  ip_hash TEXT,
  user_agent TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_logged_deleted ON food_logs(user_id, logged_at DESC, is_deleted);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_meal_logged ON food_logs(user_id, meal_type, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_active_type ON goals(user_id, is_active, goal_type);
CREATE INDEX IF NOT EXISTS idx_consent_user_type_created ON consent_history(user_id, consent_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gdpr_user_type_status_requested ON gdpr_requests(user_id, request_type, status, requested_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_settings_user_unique ON notification_settings(user_id);
