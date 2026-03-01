-- Add profile fields to users table for onboarding and TDEE/BMR calculations
-- Profile fields: date_of_birth, gender, height, weight, activity_level, weight_goal

ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_goal TEXT CHECK (weight_goal IN ('lose', 'maintain', 'gain'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_weight_kg NUMERIC(5,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create index for profile lookups
CREATE INDEX IF NOT EXISTS idx_users_onboarding_profile ON users(id, onboarding_complete, date_of_birth, gender, activity_level) WHERE NOT is_deleted;
