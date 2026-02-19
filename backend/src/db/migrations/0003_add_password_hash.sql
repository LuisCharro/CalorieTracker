-- Add password_hash column for secure password storage
-- Uses bcrypt hashing with appropriate work factor

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index for faster user lookups during authentication
CREATE INDEX IF NOT EXISTS idx_users_email_password ON users(email) WHERE is_deleted = FALSE AND password_hash IS NOT NULL;
