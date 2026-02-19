-- Phase 2 migration: Add optimized indexes for query performance
-- These indexes support the API endpoints defined in the routing module

-- Index for filtering food logs by date range (today view, history view)
-- Note: Using logged_at directly since DATE() is not IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_food_logs_user_logged_at_date ON food_logs(user_id, logged_at DESC, is_deleted);

-- Index for food logs by meal type and date (today view filtering)
CREATE INDEX IF NOT EXISTS idx_food_logs_user_meal_date ON food_logs(user_id, meal_type, logged_at DESC);

-- Index for active goals by type (goal calculation endpoints)
CREATE INDEX IF NOT EXISTS idx_goals_user_active_type_start ON goals(user_id, is_active, goal_type, start_date DESC);

-- Index for recent consent history (GDPR compliance endpoints)
CREATE INDEX IF NOT EXISTS idx_consent_user_created ON consent_history(user_id, created_at DESC);

-- Index for GDPR requests by status (processing queue)
CREATE INDEX IF NOT EXISTS idx_gdpr_status_requested ON gdpr_requests(status, requested_at ASC);

-- Index for security events by severity and time (monitoring dashboard)
CREATE INDEX IF NOT EXISTS idx_security_events_severity_created ON security_events(severity, created_at DESC);

-- Composite index for user lookups by email (auth flow)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE is_deleted = FALSE;
