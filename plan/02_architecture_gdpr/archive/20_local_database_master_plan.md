# Local-First Database Master Plan for CalorieTracker

**Date:** 2026-02-15  
**Context:** B2C calorie/food logging app with GDPR requirements  
**Approach:** Local-first demo (SQLite) → cloud-portable (Supabase/PostgreSQL)  
**Status:** Planning phase — no coding, SQL-first design

---

## Executive Summary

This document defines a comprehensive database strategy for CalorieTracker, designed to start as a local-first demo using SQLite and seamlessly migrate to Supabase/PostgreSQL for production. The plan balances immediate demo needs with long-term portability, GDPR compliance, and production readiness.

**Key Principles:**

1. **Standard SQL-First**: Design using standard SQL features available in both SQLite and PostgreSQL
2. **Minimal MVP Schema**: Start with essential tables only; defer advanced features
3. **GDPR Built-In**: Retention, deletion, export, and audit logging from day one
4. **Zero-Cost Demo**: Use local SQLite for initial development and testing
5. **Cloud-Portable Design**: Avoid SQLite-specific features that don't map to Postgres

---

## 1. Canonical Entity Model (Local-First Demo)

### 1.1 MVP Schema Subset (Must-Have for Demo)

The following tables are **required for the initial demo**:

```sql
-- ========================================
-- TABLE 1: users
-- ========================================
-- Purpose: User profile and preferences
-- Relationships: One-to-many with food_logs, goals
-- Lifecycle: Created on signup, soft-deleted on account deletion

CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- UUID string (compatible with Supabase)
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),  -- ISO-8601 string
  last_login_at TEXT,
  preferences TEXT,                      -- JSON string: {"theme":"dark","units":"metric"}
  is_deleted INTEGER DEFAULT 0,          -- Boolean: 0=false, 1=true (SQLite convention)
  deleted_at TEXT
);

-- ========================================
-- TABLE 2: food_logs
-- ========================================
-- Purpose: Core food logging feature
-- Relationships: Many-to-one with users
-- Lifecycle: Created on food entry, soft-deleted on deletion
-- Privacy: User-scoped via user_id (enforced at app layer for local demo)

CREATE TABLE food_logs (
  id TEXT PRIMARY KEY,                   -- UUID string
  user_id TEXT NOT NULL,                 -- References users.id
  food_name TEXT NOT NULL,
  brand_name TEXT,
  quantity REAL NOT NULL,                 -- REAL = NUMERIC in SQLite
  unit TEXT NOT NULL,                     -- 'g', 'ml', 'cup', 'piece', 'serving'
  
  -- Nutrition data stored as JSON string for flexibility
  nutrition TEXT NOT NULL,               -- JSON: {"calories":200,"protein":15,"carbs":30,"fat":8,"fiber":2,"sugar":5}
  
  meal_type TEXT,                         -- 'breakfast', 'lunch', 'dinner', 'snack'
  logged_at TEXT NOT NULL,                -- ISO-8601 timestamp
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_deleted INTEGER DEFAULT 0,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- TABLE 3: goals
-- ========================================
-- Purpose: User targets (daily calories, macros, weight)
-- Relationships: Many-to-one with users
-- Lifecycle: Created when user sets goal, archived when goal ends

CREATE TABLE goals (
  id TEXT PRIMARY KEY,                   -- UUID string
  user_id TEXT NOT NULL,                 -- References users.id
  goal_type TEXT NOT NULL,               -- 'daily_calories', 'weight', 'macros'
  target_value REAL NOT NULL,
  
  -- JSON for macro targets (if goal_type = 'macros')
  macro_targets TEXT,                    -- JSON: {"protein":150,"carbs":200,"fat":65}
  
  start_date TEXT NOT NULL,              -- ISO-8601 date string
  end_date TEXT,
  is_active INTEGER DEFAULT 1,           -- Boolean: 0=false, 1=true
  
  -- Progress tracking
  current_value REAL,
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- TABLE 4: weight_logs (Optional for MVP)
-- ========================================
-- Purpose: Track weight over time
-- Relationships: Many-to-one with users
-- Lifecycle: Created on weight entry, never deleted

CREATE TABLE weight_logs (
  id TEXT PRIMARY KEY,                   -- UUID string
  user_id TEXT NOT NULL,                 -- References users.id
  weight REAL NOT NULL,                   -- kg or lbs
  unit TEXT NOT NULL,                     -- 'kg', 'lbs'
  logged_at TEXT NOT NULL,                -- ISO-8601 timestamp
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 1.2 Future Schema Subset (Post-MVP/Production)

Defer these tables until after MVP validation:

```sql
-- ========================================
-- TABLE 5: exercise_logs (Future)
-- ========================================
CREATE TABLE exercise_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  calories_burned REAL,
  exercise_type TEXT,
  performed_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_deleted INTEGER DEFAULT 0,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- TABLE 6: food_database_cache (Future)
-- ========================================
CREATE TABLE food_database_cache (
  id TEXT PRIMARY KEY,
  food_name TEXT NOT NULL,
  brand_name TEXT,
  nutrition_data TEXT NOT NULL,          -- JSON
  source_api TEXT NOT NULL,               -- 'nutritionix', 'usda', 'open_food_facts'
  external_id TEXT,
  cached_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  access_count INTEGER DEFAULT 0
);

-- ========================================
-- TABLE 7: daily_summaries (Future)
-- ========================================
-- Pre-computed daily aggregations for performance
CREATE TABLE daily_summaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  summary_date TEXT NOT NULL,            -- ISO-8601 date string
  total_calories REAL DEFAULT 0,
  total_protein REAL DEFAULT 0,
  total_carbs REAL DEFAULT 0,
  total_fat REAL DEFAULT 0,
  meal_count INTEGER DEFAULT 0,
  exercise_calories_burned REAL DEFAULT 0,
  net_calories REAL DEFAULT 0,
  
  -- Goal tracking
  calories_goal REAL,
  calories_met INTEGER DEFAULT 0,        -- Boolean: 0=false, 1=true
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  UNIQUE(user_id, summary_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- TABLE 8: saved_meals (Future)
-- ========================================
CREATE TABLE saved_meals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  meal_name TEXT NOT NULL,
  meal_data TEXT NOT NULL,                -- JSON array of food items
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 1.3 GDPR-Required Tables (Required for Demo)

These tables are **required even for the demo** to validate compliance flows:

```sql
-- ========================================
-- TABLE 9: consent_history
-- ========================================
-- Purpose: Immutable audit trail of user consents
-- GDPR Requirement: Article 7 (Withdrawal of consent)
-- Lifecycle: Created on consent change, never updated/deleted

CREATE TABLE consent_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,                          -- References users.id (nullable for deleted users)
  consent_type TEXT NOT NULL,            -- 'marketing', 'analytics', 'social', 'ai', 'third_party_food_db'
  consent_given INTEGER NOT NULL,        -- Boolean: 0=false, 1=true
  consent_version TEXT NOT NULL,          -- e.g., "1.0", "1.1"
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT,                          -- JSON: {"source":"onboarding","version":"1.0"}
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ========================================
-- TABLE 10: processing_activities
-- ========================================
-- Purpose: Record of all data processing activities (Article 30 compliance)
-- GDPR Requirement: Article 30 (Record of processing activities)
-- Lifecycle: Created on data access/processing, anonymized after 6 months

CREATE TABLE processing_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT,                          -- References users.id (nullable for deleted/anonymized users)
  activity_type TEXT NOT NULL,           -- 'food_log_created', 'data_exported', 'account_deleted', etc.
  data_categories TEXT DEFAULT '[]',      -- JSON array: ["food_logs", "user_profile", "consent_history"]
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL,              -- 'contract', 'consent', 'legitimate_interests', 'legal_obligation'
  ip_address TEXT,
  metadata TEXT,                          -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ========================================
-- TABLE 11: security_events
-- ========================================
-- Purpose: Security monitoring and incident logging
-- GDPR Requirement: Article 32 (Security of processing)
-- Lifecycle: Created on security event, kept for 12-24 months

CREATE TABLE security_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,              -- 'auth_failure', 'auth_success', 'rate_limit_exceeded', 'suspicious_activity', 'api_error', 'gdpr_request'
  user_id TEXT,                          -- References users.id (nullable for deleted users)
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  severity TEXT,                          -- 'low', 'medium', 'high', 'critical'
  details TEXT,                          -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ========================================
-- TABLE 12: gdpr_requests
-- ========================================
-- Purpose: Track data subject requests (access, erasure, portability)
-- GDPR Requirement: Articles 15, 17, 20
-- Lifecycle: Created on request, updated throughout processing

CREATE TABLE gdpr_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT,                          -- References users.id (nullable for deleted users)
  request_type TEXT NOT NULL,             -- 'access', 'erasure', 'portability', 'rectification'
  status TEXT NOT NULL,                   -- 'pending', 'processing', 'completed', 'rejected'
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  metadata TEXT,                          -- JSON: {"format":"json","delivery_method":"download"}
  rejection_reason TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 2. Relationships and Lifecycle of Core Records

### 2.1 Entity Relationship Diagram (Text-Based)

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │◄──────────┐
│ email           │           │
│ display_name    │           │
│ preferences     │           │
│ is_deleted      │           │
└─────────────────┘           │
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    food_logs    │  │     goals      │  │   weight_logs   │
│─────────────────│  │─────────────────│  │─────────────────│
│ id (PK)         │  │ id (PK)         │  │ id (PK)         │
│ user_id (FK)    │  │ user_id (FK)    │  │ user_id (FK)    │
│ food_name       │  │ goal_type       │  │ weight          │
│ nutrition       │  │ target_value    │  │ unit            │
│ logged_at       │  │ is_active       │  │ logged_at       │
│ is_deleted      │  └─────────────────┘  └─────────────────┘
└─────────────────┘
         │
         │ (Optional future tables)
         ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ exercise_logs   │  │ food_db_cache   │  │ daily_summaries │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ consent_history │  │processing_act.  │  │ security_events │
│─────────────────│  │─────────────────│  │─────────────────│
│ id (PK)         │  │ id (PK)         │  │ id (PK)         │
│ user_id (FK)    │  │ user_id (FK)    │  │ user_id (FK)    │
│ consent_type    │  │ activity_type   │  │ event_type      │
│ consent_given   │  │ legal_basis     │  │ severity        │
│ created_at      │  │ created_at      │  │ created_at      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2 Lifecycle Definitions

#### users
- **Created**: On user signup/registration
- **Updated**: On profile changes, preferences updates
- **Soft-Deleted**: On account deletion request (is_deleted = 1, deleted_at = NOW)
- **Hard-Deleted**: 30 days after soft delete (cascade deletes all user data)
- **Retention**: Active users: until account deletion; Deleted users: 30 days

#### food_logs
- **Created**: When user logs a food item
- **Updated**: When user edits nutrition values or meal type
- **Soft-Deleted**: When user deletes a food log entry (is_deleted = 1)
- **Hard-Deleted**: When user account is hard-deleted (CASCADE)
- **Retention**: Active users: until account deletion or 2 years inactive; Deleted users: 30 days

#### goals
- **Created**: When user sets a goal (daily calories, weight target, macros)
- **Updated**: When goal is modified (target value, dates)
- **Archived**: When goal expires (end_date passed) or user deactivates (is_active = 0)
- **Deleted**: When user account is hard-deleted (CASCADE)
- **Retention**: Active users: until account deletion; Archived goals: 1 year after expiration

#### weight_logs
- **Created**: When user logs weight
- **Never Updated**: Immutable record of weight at specific time
- **Deleted**: When user account is hard-deleted (CASCADE)
- **Retention**: Active users: until account deletion; No automatic purge

#### consent_history
- **Created**: On every consent change (grant, withdrawal, modification)
- **Never Updated**: Immutable audit trail
- **Never Deleted**: Required for GDPR compliance
- **Anonymization**: After 24 months, set user_id = NULL, ip_address = NULL
- **Retention**: 24 months minimum (anonymized after 6 months)

#### processing_activities
- **Created**: On every data access/processing event (login, export, delete, etc.)
- **Never Updated**: Immutable record of what happened
- **Never Deleted**: Required for Article 30 compliance
- **Anonymization**: After 6 months, set user_id = NULL, ip_address = NULL
- **Retention**: 12 months (anonymized after 6 months)

#### security_events
- **Created**: On security-related events (auth failures, rate limits, etc.)
- **Never Updated**: Immutable record
- **Never Deleted**: Required for security monitoring
- **Anonymization**: After 12 months, set user_id = NULL
- **Retention**: 24 months

#### gdpr_requests
- **Created**: When user submits GDPR request (access, erasure, portability, rectification)
- **Updated**: As request progresses through statuses
- **Never Deleted**: Required for audit trail
- **Anonymization**: After 24 months, set user_id = NULL
- **Retention**: 24 months

---

## 3. Minimal Migration Strategy (Versioned SQL)

### 3.1 Migration Versioning Scheme

**Format:** `V{major}_{minor}__{description}.sql`

**Example:**
- `V1_0__create_initial_schema.sql`
- `V1_1__add_weight_logs_table.sql`
- `V1_2__add_gdpr_tables.sql`
- `V2_0__add_daily_summaries_table.sql`

**Migration Table:**
```sql
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 3.2 Initial Schema Migration (V1_0)

```sql
-- File: migrations/V1_0__create_initial_schema.sql

-- Migration metadata
INSERT INTO schema_migrations (version, name) 
VALUES (1, 'V1_0__create_initial_schema');

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT,
  preferences TEXT,
  is_deleted INTEGER DEFAULT 0,
  deleted_at TEXT
);

-- Food logs table
CREATE TABLE food_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  food_name TEXT NOT NULL,
  brand_name TEXT,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  nutrition TEXT NOT NULL,
  meal_type TEXT,
  logged_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Goals table
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  target_value REAL NOT NULL,
  macro_targets TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_active INTEGER DEFAULT 1,
  current_value REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX idx_food_logs_user_id ON food_logs(user_id);
CREATE INDEX idx_food_logs_logged_at ON food_logs(logged_at DESC);
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, logged_at DESC);
CREATE INDEX idx_goals_user_active ON goals(user_id, is_active);
```

### 3.3 GDPR Tables Migration (V1_1)

```sql
-- File: migrations/V1_1__add_gdpr_tables.sql

INSERT INTO schema_migrations (version, name) 
VALUES (2, 'V1_1__add_gdpr_tables');

-- Consent history
CREATE TABLE consent_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  consent_type TEXT NOT NULL,
  consent_given INTEGER NOT NULL,
  consent_version TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Processing activities
CREATE TABLE processing_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  activity_type TEXT NOT NULL,
  data_categories TEXT DEFAULT '[]',
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  ip_address TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Security events
CREATE TABLE security_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  severity TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- GDPR requests
CREATE TABLE gdpr_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  metadata TEXT,
  rejection_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for GDPR queries
CREATE INDEX idx_consent_history_user ON consent_history(user_id, created_at DESC);
CREATE INDEX idx_processing_activities_user ON processing_activities(user_id, created_at DESC);
CREATE INDEX idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX idx_security_events_user ON security_events(user_id);
```

### 3.4 Weight Logs Migration (V1_2 - Optional for MVP)

```sql
-- File: migrations/V1_2__add_weight_logs_table.sql

INSERT INTO schema_migrations (version, name) 
VALUES (3, 'V1_2__add_weight_logs_table');

CREATE TABLE weight_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  weight REAL NOT NULL,
  unit TEXT NOT NULL,
  logged_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_weight_logs_user ON weight_logs(user_id, logged_at DESC);
```

### 3.5 Future Schema Migrations (Post-MVP)

```sql
-- File: migrations/V2_0__add_post_mvp_tables.sql

-- Exercise logs
CREATE TABLE exercise_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  calories_burned REAL,
  exercise_type TEXT,
  performed_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Food database cache
CREATE TABLE food_database_cache (
  id TEXT PRIMARY KEY,
  food_name TEXT NOT NULL,
  brand_name TEXT,
  nutrition_data TEXT NOT NULL,
  source_api TEXT NOT NULL,
  external_id TEXT,
  cached_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  access_count INTEGER DEFAULT 0
);

-- Daily summaries
CREATE TABLE daily_summaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  summary_date TEXT NOT NULL,
  total_calories REAL DEFAULT 0,
  total_protein REAL DEFAULT 0,
  total_carbs REAL DEFAULT 0,
  total_fat REAL DEFAULT 0,
  meal_count INTEGER DEFAULT 0,
  exercise_calories_burned REAL DEFAULT 0,
  net_calories REAL DEFAULT 0,
  calories_goal REAL,
  calories_met INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, summary_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Saved meals
CREATE TABLE saved_meals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  meal_name TEXT NOT NULL,
  meal_data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_exercise_logs_user ON exercise_logs(user_id, performed_at DESC);
CREATE INDEX idx_food_cache_external_id ON food_database_cache(source_api, external_id);
CREATE INDEX idx_food_cache_expires ON food_database_cache(expires_at);
CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, summary_date DESC);
CREATE INDEX idx_saved_meals_user ON saved_meals(user_id, last_used_at DESC);
```

### 3.6 Migration Execution Order

For local SQLite demo:
1. `V1_0__create_initial_schema.sql`
2. `V1_1__add_gdpr_tables.sql`
3. `V1_2__add_weight_logs_table.sql` (optional, add if needed for demo)

For Postgres migration (see section 6):
- Use same SQL files with minor modifications (see section 6.2)

---

## 4. Data Retention/Deletion/Export Behavior

### 4.1 Retention Policy (Demo-Level)

| Table | Retention Period | Deletion Method | Rationale |
|-------|------------------|-----------------|-----------|
| **users** | Until account deleted | Hard delete (CASCADE) | Core data, user-owned |
| **food_logs** | Until account deleted or 2 years inactive | Hard delete (CASCADE) | Core service data |
| **goals** | Until account deleted; archived 1 year after expiration | Hard delete (CASCADE) | User preferences |
| **weight_logs** | Until account deleted | Hard delete (CASCADE) | User health data |
| **consent_history** | 24 months (anonymized after 6 months) | Anonymize, then delete | GDPR compliance |
| **processing_activities** | 12 months (anonymized after 6 months) | Anonymize, then delete | Article 30 compliance |
| **security_events** | 24 months | Anonymize, then delete | Security monitoring |
| **gdpr_requests** | 24 months | Anonymize, then delete | Audit trail |

### 4.2 Deletion Strategy

#### Soft Delete (Immediate)

For **users** and **food_logs**, use soft delete with a 30-day grace period:

```sql
-- Soft delete user account
UPDATE users 
SET is_deleted = 1, 
    deleted_at = datetime('now')
WHERE id = ?;

-- Soft delete food log
UPDATE food_logs 
SET is_deleted = 1, 
    updated_at = datetime('now')
WHERE id = ?;

-- Query for active users (exclude soft-deleted)
SELECT * FROM users WHERE is_deleted = 0;

-- Query for active food logs (exclude soft-deleted)
SELECT * FROM food_logs 
WHERE user_id = ? AND is_deleted = 0;
```

#### Hard Delete (After 30 Days)

Cron job or scheduled task to purge soft-deleted data:

```sql
-- Hard delete soft-deleted users (cascade deletes all user data)
DELETE FROM users 
WHERE is_deleted = 1 
  AND deleted_at < datetime('now', '-30 days');

-- Hard delete soft-deleted food logs (if not cascaded)
DELETE FROM food_logs 
WHERE is_deleted = 1 
  AND updated_at < datetime('now', '-30 days');

-- Anonymize old consent history (set user_id to NULL)
UPDATE consent_history 
SET user_id = NULL, 
    ip_address = NULL 
WHERE created_at < datetime('now', '-6 months');

-- Anonymize old processing activities
UPDATE processing_activities 
SET user_id = NULL, 
    ip_address = NULL 
WHERE created_at < datetime('now', '-6 months');

-- Anonymize old security events
UPDATE security_events 
SET user_id = NULL 
WHERE created_at < datetime('now', '-12 months');
```

#### Inactive User Cleanup

For users who haven't logged in for 2 years:

```sql
-- Soft delete inactive users
UPDATE users 
SET is_deleted = 1, 
    deleted_at = datetime('now')
WHERE last_login_at < datetime('now', '-730 days')
  AND is_deleted = 0;
```

### 4.3 Export Behavior (Data Portability)

#### Full Data Export (JSON Format)

```sql
-- Export all user data (for GDPR Article 15/20)
-- This would typically be done via application code, not raw SQL

-- Application-level export query structure:
-- 1. Fetch user profile
SELECT * FROM users WHERE id = ? AND is_deleted = 0;

-- 2. Fetch all food logs
SELECT * FROM food_logs 
WHERE user_id = ? AND is_deleted = 0 
ORDER BY logged_at ASC;

-- 3. Fetch all goals
SELECT * FROM goals WHERE user_id = ? ORDER BY created_at ASC;

-- 4. Fetch all weight logs
SELECT * FROM weight_logs WHERE user_id = ? ORDER BY logged_at ASC;

-- 5. Fetch consent history
SELECT * FROM consent_history WHERE user_id = ? ORDER BY created_at ASC;

-- 6. Fetch processing activities
SELECT * FROM processing_activities WHERE user_id = ? ORDER BY created_at ASC;

-- 7. Fetch GDPR requests
SELECT * FROM gdpr_requests WHERE user_id = ? ORDER BY requested_at ASC;
```

#### Export JSON Structure

```json
{
  "userProfile": {
    "id": "...",
    "email": "user@example.com",
    "display_name": "John Doe",
    "preferences": {"theme": "dark", "units": "metric"},
    "created_at": "2026-02-15T10:00:00Z"
  },
  "foodLogs": [
    {
      "id": "...",
      "food_name": "Chicken Breast",
      "quantity": 150,
      "unit": "g",
      "nutrition": {"calories": 248, "protein": 46, "carbs": 0, "fat": 5.5},
      "meal_type": "lunch",
      "logged_at": "2026-02-15T12:30:00Z"
    }
  ],
  "goals": [
    {
      "goal_type": "daily_calories",
      "target_value": 2000,
      "is_active": true,
      "start_date": "2026-02-01"
    }
  ],
  "weightLogs": [
    {
      "weight": 75.5,
      "unit": "kg",
      "logged_at": "2026-02-15T08:00:00Z"
    }
  ],
  "consentHistory": [
    {
      "consent_type": "analytics",
      "consent_given": true,
      "consent_version": "1.0",
      "created_at": "2026-02-15T10:05:00Z"
    }
  ],
  "exportDate": "2026-02-15T10:00:00Z",
  "exportFormat": "json"
}
```

---

## 5. Index/Query Strategy for Expected App Screens

### 5.1 Expected App Screens

Based on research (Amy app analysis) and product requirements:

1. **Daily View (Main Screen)**: Show today's food logs, totals, progress
2. **History/Calendar View**: Browse past entries by date
3. **Settings/Profile**: Goals, preferences, account management
4. **Add Food Screen**: Quick-add, search, manual entry
5. **Export/Delete Account**: GDPR compliance screens
6. **Weekly Overview**: Weekly summaries and progress charts

### 5.2 Query Strategy per Screen

#### Daily View (Main Screen)

**Queries Needed:**
1. Get today's food logs for user
2. Calculate daily totals (calories, macros)
3. Get active daily calorie goal

```sql
-- Today's food logs (local date)
SELECT id, food_name, quantity, unit, nutrition, meal_type, logged_at
FROM food_logs
WHERE user_id = ? 
  AND is_deleted = 0
  AND DATE(logged_at) = DATE('now', 'local')
ORDER BY logged_at ASC;

-- Daily totals (calculated in app, not SQL for flexibility)
-- SELECT query above, then aggregate nutrition JSON in application code

-- Active daily calorie goal
SELECT target_value 
FROM goals 
WHERE user_id = ? 
  AND goal_type = 'daily_calories' 
  AND is_active = 1
  AND start_date <= DATE('now', 'local')
  AND (end_date IS NULL OR end_date >= DATE('now', 'local'))
ORDER BY created_at DESC
LIMIT 1;
```

**Indexes Used:**
- `idx_food_logs_user_date` (user_id, logged_at DESC)
- `idx_goals_user_active` (user_id, is_active)

#### History/Calendar View

**Queries Needed:**
1. Get food logs for specific date range
2. Get daily summaries (if using daily_summaries table)
3. Get unique dates with logs for calendar display

```sql
-- Food logs for specific date range
SELECT id, food_name, quantity, unit, nutrition, meal_type, logged_at
FROM food_logs
WHERE user_id = ? 
  AND is_deleted = 0
  AND logged_at >= ? 
  AND logged_at < ?
ORDER BY logged_at ASC;

-- Get dates with logs for calendar (last 30 days)
SELECT DISTINCT DATE(logged_at) as log_date
FROM food_logs
WHERE user_id = ? 
  AND is_deleted = 0
  AND logged_at >= datetime('now', '-30 days')
ORDER BY log_date DESC;
```

**Indexes Used:**
- `idx_food_logs_user_date` (user_id, logged_at DESC)

#### Settings/Profile Screen

**Queries Needed:**
1. Get user profile
2. Get all goals (active and archived)
3. Get current weight (latest)

```sql
-- User profile
SELECT id, email, display_name, preferences, created_at
FROM users
WHERE id = ? AND is_deleted = 0;

-- All goals
SELECT * 
FROM goals 
WHERE user_id = ? 
ORDER BY is_active DESC, created_at DESC;

-- Latest weight entry
SELECT * 
FROM weight_logs 
WHERE user_id = ? 
ORDER BY logged_at DESC 
LIMIT 1;
```

**Indexes Used:**
- `idx_goals_user_active` (user_id, is_active)

#### Add Food Screen

**Queries Needed:**
1. Get saved meals (if using saved_meals table)
2. Get recent foods (user's common foods)
3. Search food database cache (if implemented)

```sql
-- Saved meals
SELECT id, meal_name, meal_data, last_used_at
FROM saved_meals
WHERE user_id = ?
ORDER BY last_used_at DESC;

-- Recent foods (last 30 days, distinct)
SELECT DISTINCT food_name, brand_name, nutrition, unit
FROM food_logs
WHERE user_id = ? 
  AND is_deleted = 0
  AND logged_at >= datetime('now', '-30 days')
ORDER BY logged_at DESC
LIMIT 50;
```

**Indexes Used:**
- `idx_food_logs_user_date` (user_id, logged_at DESC)

#### Export/Delete Account Screens

**Queries Needed:**
1. Export all user data (see section 4.3)
2. Get consent history
3. Get processing activities
4. Get GDPR requests

```sql
-- Consent history
SELECT * FROM consent_history WHERE user_id = ? ORDER BY created_at DESC;

-- Processing activities
SELECT * FROM processing_activities WHERE user_id = ? ORDER BY created_at DESC;

-- GDPR requests
SELECT * FROM gdpr_requests WHERE user_id = ? ORDER BY requested_at DESC;
```

**Indexes Used:**
- `idx_consent_history_user` (user_id, created_at DESC)
- `idx_processing_activities_user` (user_id, created_at DESC)

#### Weekly Overview Screen

**Queries Needed:**
1. Get last 7 days of food logs
2. Calculate daily totals for each day
3. Compare to goals

```sql
-- Last 7 days of food logs
SELECT id, food_name, quantity, unit, nutrition, meal_type, logged_at
FROM food_logs
WHERE user_id = ? 
  AND is_deleted = 0
  AND logged_at >= datetime('now', '-7 days')
ORDER BY logged_at ASC;

-- Daily summaries (if using daily_summaries table)
SELECT * 
FROM daily_summaries 
WHERE user_id = ? 
  AND summary_date >= DATE('now', '-7 days')
ORDER BY summary_date ASC;
```

**Indexes Used:**
- `idx_food_logs_user_date` (user_id, logged_at DESC)
- `idx_daily_summaries_user_date` (user_id, summary_date DESC)

### 5.3 Index Summary (MVP Tables)

```sql
-- Users table indexes (none needed for MVP, email is already UNIQUE)

-- Food logs indexes
CREATE INDEX idx_food_logs_user_id ON food_logs(user_id);
CREATE INDEX idx_food_logs_logged_at ON food_logs(logged_at DESC);
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, logged_at DESC);
CREATE INDEX idx_food_logs_meal_type ON food_logs(meal_type);  -- Optional

-- Goals indexes
CREATE INDEX idx_goals_user_active ON goals(user_id, is_active);

-- Weight logs indexes
CREATE INDEX idx_weight_logs_user ON weight_logs(user_id, logged_at DESC);

-- GDPR tables indexes
CREATE INDEX idx_consent_history_user ON consent_history(user_id, created_at DESC);
CREATE INDEX idx_processing_activities_user ON processing_activities(user_id, created_at DESC);
CREATE INDEX idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX idx_security_events_user ON security_events(user_id);
```

---

## 6. Portability Strategy to Supabase/PostgreSQL

### 6.1 Migration Path Overview

```
┌─────────────────────┐
│  SQLite (Local)     │  ← Demo/Development
│  - Zero cost         │
│  - Fast iteration   │
│  - Offline capable  │
└──────────┬──────────┘
           │
           │ Schema + Data Migration
           │ (pg_dump / pg_restore or manual)
           ▼
┌─────────────────────┐
│  Supabase/Postgres  │  ← Production
│  - EU region        │
│  - RLS policies     │
│  - Built-in auth    │
│  - Real-time        │
└─────────────────────┘
```

### 6.2 Schema Modifications for Postgres

**SQLite → Postgres Changes:**

| SQLite | Postgres | Notes |
|--------|----------|-------|
| `TEXT` | `TEXT` | Same |
| `REAL` | `NUMERIC` | More precise for nutrition values |
| `INTEGER` (boolean) | `BOOLEAN` | Native boolean type |
| `datetime('now')` | `NOW()` | Built-in function |
| `datetime('now', '-30 days')` | `NOW() - INTERVAL '30 days'` | Interval syntax |
| `DATE(logged_at)` | `DATE(logged_at)` | Same |
| `AUTOINCREMENT` | `SERIAL` or `gen_random_uuid()` | UUID preferred |

**Modified Schema for Postgres:**

```sql
-- ========================================
-- TABLE 1: users (Postgres version)
-- ========================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),  -- Link to Supabase auth
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}',  -- JSONB instead of TEXT
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- TABLE 2: food_logs (Postgres version)
-- ========================================
CREATE TABLE public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  brand_name TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('g', 'ml', 'cup', 'piece', 'serving')),
  
  -- JSONB for nutrition (flexible, queryable)
  nutrition JSONB NOT NULL,  -- {"calories":200,"protein":15,"carbs":30,"fat":8}
  
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- ========================================
-- TABLE 3: goals (Postgres version)
-- ========================================
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('daily_calories', 'weight', 'macros')),
  target_value NUMERIC NOT NULL,
  macro_targets JSONB,  -- {"protein":150,"carbs":200,"fat":65}
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  current_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6.3 RLS Policies (Postgres-Only)

SQLite demo will enforce access control at the application layer. Postgres production will use RLS:

```sql
-- Enable RLS on all tables
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Food logs: Users can only access their own data
CREATE POLICY "Users can view own food_logs"
ON public.food_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own food_logs"
ON public.food_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own food_logs"
ON public.food_logs FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own food_logs"
ON public.food_logs FOR DELETE
USING (user_id = auth.uid());

-- Users: Read-only for user profile
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (id = auth.uid());

-- Goals: Users can manage own goals
CREATE POLICY "Users can manage own goals"
ON public.goals FOR ALL
USING (user_id = auth.uid());

-- GDPR tables: Read-only for users, full access for service role
CREATE POLICY "Users can view own consent_history"
ON public.consent_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view own processing_activities"
ON public.processing_activities FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view own security_events"
ON public.security_events FOR SELECT
USING (user_id = auth.uid());

-- Service role bypass for admin operations
CREATE POLICY "Service role full access on food_logs"
ON public.food_logs FOR ALL
USING (auth.role() = 'service_role');
```

### 6.4 Data Migration Strategy

#### Option 1: Manual Export/Import (Recommended for MVP)

1. **Export from SQLite:**
   ```bash
   # Use application code to export all data to JSON
   # (See section 4.3 for export structure)
   ```

2. **Import to Supabase:**
   ```typescript
   // Application code to import JSON to Supabase
   const { data, error } = await supabase
     .from('users')
     .insert(exportData.userProfile);
   
   const { data: foodLogs, error: foodError } = await supabase
     .from('food_logs')
     .insert(exportData.foodLogs);
   // ... continue for all tables
   ```

**Advantages:**
- Full control over data transformation
- Can handle UUID mapping (SQLite TEXT IDs → Postgres UUIDs)
- Can validate data before import

**Disadvantages:**
- More manual effort
- Need to handle UUID generation for new records

#### Option 2: pg_dump/pg_restore (For Larger Datasets)

If SQLite has significant data, use pg_dump from Postgres-compatible source:

```bash
# This would require setting up a Postgres instance locally first
# Then using pg_dump to export, and importing to Supabase
```

**Advantages:**
- Faster for large datasets
- Native Postgres tools

**Disadvantages:**
- Requires local Postgres setup
- More complex

### 6.5 Feature Mapping: SQLite Demo → Postgres Production

| Feature | SQLite Demo | Postgres Production |
|---------|-------------|---------------------|
| **UUID Generation** | App-layer (e.g., `uuid.v4()`) | `gen_random_uuid()` built-in |
| **Boolean Type** | `INTEGER` (0/1) | Native `BOOLEAN` |
| **Timestamps** | `TEXT` (ISO-8601 strings) | `TIMESTAMP WITH TIME ZONE` |
| **JSON Storage** | `TEXT` (manual parsing) | `JSONB` (queryable, indexed) |
| **Access Control** | App-layer (manual checks) | RLS (database-level) |
| **Foreign Keys** | Standard FKs | Standard FKs + ON DELETE CASCADE |
| **Indexes** | Standard indexes | Standard indexes + GIN for JSONB |
| **Constraints** | CHECK constraints | CHECK + NOT NULL + UNIQUE |
| **Auth** | Custom (local) | Supabase Auth (JWT-based) |
| **Real-time** | None (polling only) | Supabase Real-time (WebSocket) |

---

## 7. Risk List and Assumptions

### 7.1 Risk Register

| Risk | Severity | Probability | Mitigation Strategy | Owner |
|------|----------|-------------|---------------------|-------|
| **SQLite → Postgres migration fails** | High | Medium | Test migration early; use JSON export/import; manual validation | Developer |
| **Legal classification as health data** | High | Low | Legal consultation before launch; treat as health data conservatively | Product Owner + Legal |
| **GDPR non-compliance** | High | Medium | Follow proven patterns from PdfExtractorAi; legal review; test all GDPR flows | Developer + Legal |
| **Performance issues with SQLite demo** | Medium | Low | Use indexes; limit dataset size; optimize queries | Developer |
| **Data loss during migration** | High | Low | Backup before migration; test with staging data; validate counts | Developer |
| **Access control bypass in local demo** | Low | Medium | Document app-layer checks; enforce user_id filtering | Developer |
| **JSON parsing errors** | Medium | Medium | Validate JSON before insert; use schema validation; error handling | Developer |
| **Soft delete cleanup accidentally deletes wrong data** | High | Low | Careful SQL queries; test with staging; add safety checks | Developer |
| **Timestamp timezone issues** | Medium | Medium | Store all timestamps in UTC; convert to local for display | Developer |
| **UUID collisions** | Low | Low | Use proper UUID v4; test with large dataset | Developer |
| **Supabase RLS policies block legitimate access** | Medium | Low | Test RLS policies thoroughly; use service role for admin ops | Developer |
| **Export functionality incomplete or incorrect** | Medium | Medium | Test export with real data; validate JSON structure | Developer |
| **Retention policy not enforced** | High | Medium | Implement cron job; test retention logic; monitor disk usage | Developer |
| **Database version conflicts (multiple developers)** | Low | Low | Use migration scripts; version control schema; manual conflict resolution | Developer |
| **Supabase quota exceeded** | Medium | Low | Monitor usage; implement retention; upgrade plan if needed | Product Owner |

### 7.2 Assumptions

#### Technical Assumptions

1. **SQLite as Demo Database**
   - SQLite will handle demo workload (< 100 users, < 10K records)
   - Performance will be acceptable for demo purposes
   - No concurrent write conflicts expected in demo

2. **Standard SQL Compatibility**
   - Most SQL queries will work in both SQLite and Postgres with minor modifications
   - JSONB in Postgres can replace TEXT-based JSON in SQLite
   - Indexes will provide sufficient query performance

3. **UUID Generation**
   - Application layer can generate UUIDs for SQLite demo
   - Supabase will generate UUIDs for production
   - No UUID collisions expected with v4

4. **Timestamp Handling**
   - ISO-8601 string format works in both SQLite and Postgres
   - UTC timezone for storage, local conversion for display
   - No timezone-related data corruption expected

5. **Access Control**
   - App-layer checks sufficient for demo (small user base, trusted)
   - RLS in Postgres sufficient for production
   - No privilege escalation attacks expected

#### Business Assumptions

1. **User Growth**
   - Demo will have < 100 users
   - Production launch will have < 1K users in first month
   - Growth will be gradual, allowing monitoring and scaling

2. **GDPR Classification**
   - Calorie tracking will be classified as "general personal data" (not health data)
   - If classified as health data, additional consent will be added
   - Legal consultation will confirm classification before launch

3. **Pricing/Monetization**
   - Free tier will handle demo users
   - Paid subscriptions will offset cloud costs at scale
   - API costs (nutrition lookup) will be manageable with caching

4. **Data Volume**
   - Average user logs 5-10 food items per day
   - Average user stays active for 90 days
   - Database growth will be predictable and manageable

#### Compliance Assumptions

1. **GDPR Applicability**
   - EU users will be served from EU region (Supabase)
   - Cross-border transfers will be documented and safeguarded
   - Data subject rights will be implemented and tested

2. **Retention Policy**
   - 30-day soft delete grace period is acceptable
   - 24-month retention for audit logs is compliant
   - Anonymization after 6 months is sufficient

3. **Consent Management**
   - Granular consent will be implemented (marketing, analytics, social)
   - Consent withdrawal will be effective immediately
   - Consent history will be immutable

#### Product Assumptions

1. **Feature Scope**
   - MVP will include food logging, daily tracking, goals, export/delete
   - Features will be added gradually based on user feedback
   - No complex features (workouts, social, AI recommendations) in MVP

2. **UI/UX Patterns**
   - Daily view is main screen (based on Amy app research)
   - History view for past entries
   - Settings screen for goals and preferences
   - Quick-add for saved meals

3. **Offline Capability**
   - Demo may include offline mode (SQLite local)
   - Production may have limited offline support (PWA caching)
   - Full offline sync deferred to post-MVP

---

## 8. MVP Schema Subset vs Future Schema

### 8.1 MVP Schema Subset (Day 1 Demo)

**Tables Required (4 core + 4 GDPR):**

| Table | Purpose | Required for Demo? |
|-------|---------|-------------------|
| `users` | User profile | ✅ Yes |
| `food_logs` | Core food logging | ✅ Yes |
| `goals` | User targets | ✅ Yes |
| `weight_logs` | Weight tracking | 🟡 Optional (add if needed) |
| `consent_history` | GDPR consent tracking | ✅ Yes |
| `processing_activities` | GDPR processing log | ✅ Yes |
| `security_events` | Security monitoring | ✅ Yes |
| `gdpr_requests` | GDPR request tracking | ✅ Yes |

**Total Tables for MVP:** 7-8 (depending on weight_logs)

**Migration Files Required:**
- `V1_0__create_initial_schema.sql` (users, food_logs, goals)
- `V1_1__add_gdpr_tables.sql` (consent_history, processing_activities, security_events, gdpr_requests)
- `V1_2__add_weight_logs_table.sql` (optional, add if needed)

**MVP Exclusions (Deliberate):**
- ❌ Exercise logs (deferred to post-MVP)
- ❌ Food database cache (deferred to post-MVP)
- ❌ Daily summaries (deferred to post-MVP)
- ❌ Saved meals (deferred to post-MVP)
- ❌ Social features (deferred to post-MVP)
- ❌ AI recommendations (deferred to post-MVP)
- ❌ Workout tracking (deferred to post-MVP)

### 8.2 Future Schema (Post-MVP Validation)

**Tables to Add After MVP:**

| Table | Purpose | Priority (After MVP) |
|-------|---------|---------------------|
| `exercise_logs` | Exercise tracking | High (if users request) |
| `food_database_cache` | Nutrition API caching | High (for performance) |
| `daily_summaries` | Pre-computed daily stats | Medium (if performance issues) |
| `saved_meals` | Quick-add saved meals | High (for UX) |

**Migration File:**
- `V2_0__add_post_mvp_tables.sql` (all 4 tables)

### 8.3 Feature Gating Strategy

#### MVP Launch (Day 1)

**Available Features:**
- ✅ User registration/login (local auth)
- ✅ Food logging (text/voice input)
- ✅ Daily view (today's logs, totals)
- ✅ History view (past entries by date)
- ✅ Goal setting (daily calories, macros)
- ✅ Weight tracking (optional)
- ✅ Settings (preferences, goals)
- ✅ Export data (JSON/CSV)
- ✅ Delete account (soft/hard delete)
- ✅ Consent management (analytics, marketing)

**Unavailable Features:**
- ❌ Exercise tracking
- ❌ Saved meals
- ❌ Weekly overview
- ❌ Advanced analytics
- ❌ Social features
- ❌ AI recommendations
- ❌ Meal suggestions
- ❌ Recipe database

#### Post-MVP Release (Month 2-3)

**Add Based on User Feedback:**

**If 20%+ users request exercise tracking:**
- Add `exercise_logs` table
- Migration: `V2_1__add_exercise_logs_table.sql`

**If performance issues with daily view:**
- Add `daily_summaries` table
- Add background job to pre-compute summaries
- Migration: `V2_2__add_daily_summaries_table.sql`

**If users ask for quick-add functionality:**
- Add `saved_meals` table
- Migration: `V2_3__add_saved_meals_table.sql`

**If API costs are high:**
- Add `food_database_cache` table
- Implement caching layer
- Migration: `V2_4__add_food_cache_table.sql`

### 8.4 Schema Version Timeline

```
MVP Launch (Day 1)
├── V1.0: Initial schema (users, food_logs, goals)
├── V1.1: GDPR tables (consent, processing, security, requests)
└── V1.2: Weight logs (optional)

Post-MVP (Month 2-3)
├── V2.0: Post-MVP tables (exercise, cache, summaries, saved_meals)
└── V2.1-V2.4: Individual feature tables (gated by user feedback)

Production Migration (Month 3-4)
├── Migrate from SQLite to Supabase/Postgres
├── Add RLS policies
└── Enable real-time subscriptions

Future (Month 6+)
├── V3.0: Social features (if validated)
├── V3.1: AI recommendations (if validated)
└── V3.2: Meal planning (if validated)
```

---

## 9. Implementation Checklist (Planning Only)

### 9.1 Pre-Implementation Tasks (Before Coding)

**Architecture & Schema:**
- [x] Define canonical entity model (this document)
- [x] Define relationships and lifecycle (section 2)
- [x] Define retention/deletion/export behavior (section 4)
- [x] Define index/query strategy (section 5)
- [x] Define portability strategy (section 6)
- [x] Create migration files (V1_0, V1_1, V1_2)

**Legal & Compliance:**
- [ ] Legal consultation on data classification (health vs. general)
- [ ] Privacy policy draft
- [ ] Terms of service draft
- [ ] Cookie policy draft (if web-based)
- [ ] Subprocessors list (Vercel, Supabase, nutrition APIs)

**Technical Validation:**
- [ ] Choose SQLite library for demo (e.g., better-sqlite3, sql.js)
- [ ] Choose UUID generation library (e.g., uuid)
- [ ] Choose JSON validation library (e.g., zod)
- [ ] Set up Supabase project (EU region)
- [ ] Test migration from SQLite to Postgres (staging)

**Environment Setup:**
- [ ] Initialize project repository
- [ ] Set up database directory structure
- [ ] Create migration files folder
- [ ] Set up test data fixtures
- [ ] Configure environment variables

### 9.2 MVP Implementation Tasks (Day 1-30)

**Database Setup:**
- [ ] Initialize SQLite database
- [ ] Run V1_0 migration (initial schema)
- [ ] Run V1_1 migration (GDPR tables)
- [ ] Run V1_2 migration (weight logs, if needed)
- [ ] Create test data (5-10 users, 50-100 food logs)

**Application Layer (Demo):**
- [ ] Implement database connection layer
- [ ] Implement user CRUD operations
- [ ] Implement food log CRUD operations
- [ ] Implement goal CRUD operations
- [ ] Implement weight log CRUD operations (if needed)

**GDPR Flows (Demo):**
- [ ] Implement export functionality (JSON)
- [ ] Implement soft delete (account deletion)
- [ ] Implement hard delete (30-day cron job)
- [ ] Implement consent management
- [ ] Implement processing activity logging
- [ ] Implement security event logging

**Testing (Demo):**
- [ ] Test all CRUD operations
- [ ] Test export functionality with real data
- [ ] Test deletion flows (soft/hard)
- [ ] Test retention policy (manual cron run)
- [ ] Validate data integrity after migration
- [ ] Performance testing (100 users, 10K records)

### 9.3 Post-MVP Implementation Tasks (Month 2-3)

**Feature Gating:**
- [ ] Collect user feedback on missing features
- [ ] Prioritize features based on demand
- [ ] Add exercise_logs if requested
- [ ] Add saved_meals if requested
- [ ] Add daily_summaries if performance issues

**Migration to Supabase:**
- [ ] Set up Supabase project (production)
- [ ] Create Postgres migration files (modified from SQLite)
- [ ] Implement RLS policies
- [ ] Test migration with staging data
- [ ] Perform production migration
- [ ] Validate data integrity post-migration

**Production Readiness:**
- [ ] Implement Supabase Auth integration
- [ ] Replace local auth with Supabase Auth
- [ ] Implement real-time subscriptions (if needed)
- [ ] Set up monitoring and alerting
- [ ] Set up backup and disaster recovery
- [ ] Load testing with realistic traffic

---

## 10. Appendices

### Appendix A: Sample Data Fixtures

```sql
-- Sample user 1
INSERT INTO users (id, email, display_name, preferences, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'john.doe@example.com',
  'John Doe',
  '{"theme":"dark","units":"metric"}',
  '2026-02-15T10:00:00Z'
);

-- Sample food logs for user 1
INSERT INTO food_logs (id, user_id, food_name, quantity, unit, nutrition, meal_type, logged_at, created_at, updated_at)
VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Chicken Breast',
  150,
  'g',
  '{"calories":248,"protein":46,"carbs":0,"fat":5.5,"fiber":0,"sugar":0}',
  'lunch',
  '2026-02-15T12:30:00Z',
  '2026-02-15T12:30:00Z',
  '2026-02-15T12:30:00Z'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  'Brown Rice',
  200,
  'g',
  '{"calories":216,"protein":5,"carbs":45,"fat":1.8,"fiber":2.3,"sugar":0.4}',
  'lunch',
  '2026-02-15T12:30:00Z',
  '2026-02-15T12:30:00Z',
  '2026-02-15T12:30:00Z'
);

-- Sample goal for user 1
INSERT INTO goals (id, user_id, goal_type, target_value, start_date, is_active, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  'daily_calories',
  2000,
  '2026-02-15',
  1,
  '2026-02-15T10:00:00Z',
  '2026-02-15T10:00:00Z'
);

-- Sample consent history for user 1
INSERT INTO consent_history (id, user_id, consent_type, consent_given, consent_version, created_at)
VALUES
(
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440000',
  'analytics',
  1,
  '1.0',
  '2026-02-15T10:05:00Z'
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440000',
  'marketing',
  0,
  '1.0',
  '2026-02-15T10:05:00Z'
);
```

### Appendix B: JSON Schema Validation

```typescript
// Nutrition JSON schema
const nutritionSchema = {
  type: "object",
  properties: {
    calories: { type: "number", minimum: 0 },
    protein: { type: "number", minimum: 0 },
    carbs: { type: "number", minimum: 0 },
    fat: { type: "number", minimum: 0 },
    fiber: { type: "number", minimum: 0 },
    sugar: { type: "number", minimum: 0 }
  },
  required: ["calories"]
};

// Preferences JSON schema
const preferencesSchema = {
  type: "object",
  properties: {
    theme: { type: "string", enum: ["light", "dark", "auto"] },
    units: { type: "string", enum: ["metric", "imperial"] },
    notifications_enabled: { type: "boolean" }
  }
};

// Macro targets JSON schema
const macroTargetsSchema = {
  type: "object",
  properties: {
    protein: { type: "number", minimum: 0 },
    carbs: { type: "number", minimum: 0 },
    fat: { type: "number", minimum: 0 }
  }
};
```

### Appendix C: Common Query Patterns

#### Pattern 1: Paginated Food Logs

```sql
-- Get food logs with pagination (20 items per page)
SELECT id, food_name, quantity, unit, nutrition, meal_type, logged_at
FROM food_logs
WHERE user_id = ? AND is_deleted = 0
ORDER BY logged_at DESC
LIMIT 20 OFFSET 0;  -- Page 1

-- Page 2
LIMIT 20 OFFSET 20;
```

#### Pattern 2: Date Range Query

```sql
-- Get food logs for specific date range
SELECT id, food_name, quantity, unit, nutrition, meal_type, logged_at
FROM food_logs
WHERE user_id = ? 
  AND is_deleted = 0
  AND logged_at >= ?  -- Start date
  AND logged_at < ?   -- End date (exclusive)
ORDER BY logged_at ASC;
```

#### Pattern 3: Daily Totals (Aggregation)

```sql
-- Calculate daily totals for last 7 days
SELECT 
  DATE(logged_at) as log_date,
  COUNT(*) as meal_count,
  SUM(CAST(json_extract(nutrition, '$.calories') AS REAL)) as total_calories,
  SUM(CAST(json_extract(nutrition, '$.protein') AS REAL)) as total_protein,
  SUM(CAST(json_extract(nutrition, '$.carbs') AS REAL)) as total_carbs,
  SUM(CAST(json_extract(nutrition, '$.fat') AS REAL)) as total_fat
FROM food_logs
WHERE user_id = ? AND is_deleted = 0
  AND logged_at >= datetime('now', '-7 days')
GROUP BY DATE(logged_at)
ORDER BY log_date DESC;
```

#### Pattern 4: Search by Food Name

```sql
-- Search food logs by food name (case-insensitive)
SELECT id, food_name, brand_name, quantity, unit, nutrition, meal_type, logged_at
FROM food_logs
WHERE user_id = ? 
  AND is_deleted = 0
  AND LOWER(food_name) LIKE LOWER(?)
ORDER BY logged_at DESC
LIMIT 20;
```

### Appendix D: Glossary

| Term | Definition |
|------|------------|
| **RLS** | Row-Level Security - Database-level access control in Postgres |
| **JSONB** | Binary JSON - Queryable and indexable JSON data type in Postgres |
| **Soft Delete** | Marking records as deleted (is_deleted = 1) instead of removing them |
| **Hard Delete** | Permanently removing records from the database |
| **GDPR** | General Data Protection Regulation - EU data protection law |
| **RLS Policy** | Database rule that restricts access to rows based on conditions |
| **Migration** | Versioned database schema changes |
| **UUID** | Universally Unique Identifier - 128-bit unique identifier |
| **ISO-8601** | Standard format for date/time strings (e.g., "2026-02-15T10:00:00Z") |
| **CASCADE** | Referential action that deletes child records when parent is deleted |
| **GDPR Request** | Data subject request (access, erasure, portability, rectification) |
| **Retention Policy** | Rules defining how long data is kept before deletion |
| **Anonymization** | Removing or obscuring personal identifiers from data |

---

## Conclusion

This document provides a comprehensive database planning framework for CalorieTracker, starting with a local-first SQLite demo and seamlessly migrating to Supabase/PostgreSQL for production. The plan balances immediate demo needs with long-term portability, GDPR compliance, and production readiness.

**Key Takeaways:**

1. **Start Small**: MVP requires 7-8 tables only (4 core + 4 GDPR)
2. **Plan for Growth**: Future tables are clearly defined and gated by user feedback
3. **GDPR First**: Compliance tables are required from day one, not an afterthought
4. **Portable Design**: Standard SQL features ensure smooth SQLite → Postgres migration
5. **Retention Defined**: Clear data lifecycle policies for all table types
6. **Query Optimized**: Indexes designed for expected app screens and user flows

**Next Steps:**

1. Review and approve this plan with stakeholders
2. Legal consultation on data classification (health vs. general)
3. Begin implementation of migration files (V1_0, V1_1, V1_2)
4. Set up local SQLite database for demo
5. Create test data fixtures for validation

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-15  
**Author:** AI Assistant (Subagent)  
**Status:** Ready for Review and Approval
