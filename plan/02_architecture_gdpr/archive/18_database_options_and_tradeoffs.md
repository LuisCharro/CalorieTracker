# Database Options and Tradeoffs for CalorieTracker

**Date:** 2026-02-15
**Context:** B2C calorie/food logging app with potential health-related personal data
**Current Architecture Choice:** Option A - Supabase-First with Next.js
**Status:** Planning phase - database/storage strategy analysis

---

## Executive Summary

This document analyzes database and storage options for CalorieTracker, focusing on tradeoffs for MVP through production scale. The **recommended default is Supabase/PostgreSQL** (aligned with the selected architecture), but this analysis explores alternatives, data model implications, privacy/compliance considerations, cost/scaling tradeoffs, and provides a phased migration path with risk assessment.

**Key Finding:** Supabase/PostgreSQL is the optimal choice for CalorieTracker because it balances speed-to-market, GDPR compliance (EU regions, RLS, audit logging), free-tier efficiency, and has proven patterns from PdfExtractorAi. Alternatives exist but introduce higher complexity, cost, or compliance risk for the MVP phase.

---

## 1. Supabase/PostgreSQL Approach (Default Candidate)

### 1.1 Overview

Supabase provides a managed PostgreSQL database with built-in authentication, real-time subscriptions, storage, and edge functions. It's a "Firebase alternative" with SQL instead of NoSQL.

**Core Components:**
- **Database:** PostgreSQL 15+ (managed, with extensions)
- **Auth:** Built-in JWT-based authentication (email, OAuth, magic links)
- **Storage:** Object storage for files (images, documents)
- **Real-time:** WebSocket subscriptions for live updates
- **Edge Functions:** Serverless compute (Deno-based)
- **RLS:** Row-Level Security for fine-grained access control

### 1.2 Data Model for CalorieTracker

#### Core Tables

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}', -- {theme: 'dark', units: 'metric'}
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Food logs (core feature)
CREATE TABLE public.food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  food_name TEXT NOT NULL,
  brand_name TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL, -- 'g', 'ml', 'cup', 'piece'
  calories NUMERIC NOT NULL,
  protein NUMERIC, -- grams
  carbs NUMERIC, -- grams
  fat NUMERIC, -- grams
  fiber NUMERIC, -- grams
  sugar NUMERIC, -- grams
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}' -- custom fields
);

-- Exercise logs (optional feature)
CREATE TABLE public.exercise_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  exercise_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  calories_burned NUMERIC,
  exercise_type TEXT,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Goals (user targets)
CREATE TABLE public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('daily_calories', 'weight', 'macros')),
  target_value NUMERIC NOT NULL,
  current_value NUMERIC,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weight tracking (if implemented)
CREATE TABLE public.weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  weight NUMERIC NOT NULL, -- kg or lbs
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'lbs')),
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food database cache (API results)
CREATE TABLE public.food_database_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  food_name TEXT NOT NULL,
  brand_name TEXT,
  nutrition_data JSONB NOT NULL,
  source_api TEXT NOT NULL, -- 'nutritionix', 'usda', 'open_food_facts'
  external_id TEXT,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_count INTEGER DEFAULT 0
);

-- Daily aggregations (pre-computed stats)
CREATE TABLE public.daily_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  summary_date DATE NOT NULL,
  total_calories NUMERIC DEFAULT 0,
  total_protein NUMERIC DEFAULT 0,
  total_carbs NUMERIC DEFAULT 0,
  total_fat NUMERIC DEFAULT 0,
  meal_count INTEGER DEFAULT 0,
  exercise_calories_burned NUMERIC DEFAULT 0,
  net_calories NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, summary_date)
);
```

#### GDPR-Required Tables

```sql
-- Consent history (immutable audit trail)
CREATE TABLE public.consent_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  consent_type TEXT NOT NULL, -- 'marketing', 'analytics', 'social', 'ai'
  consent_given BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT immutable_consent_history CHECK (created_at IS NOT NULL)
);

-- Processing activities (Article 30 compliance)
CREATE TABLE public.processing_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  activity_type TEXT NOT NULL, -- 'food_log_created', 'data_exported', 'account_deleted'
  data_categories JSONB DEFAULT '[]', -- ['food_logs', 'user_profile']
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL, -- 'contract', 'consent', 'legitimate_interests'
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events (incident logging)
CREATE TABLE public.security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'auth_failure', 'rate_limit_exceeded', 'suspicious_activity'
  user_id UUID REFERENCES public.users(id),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GDPR requests (data subject requests)
CREATE TABLE public.gdpr_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('access', 'erasure', 'portability', 'rectification')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  rejection_reason TEXT
);
```

#### Indexes for Performance

```sql
-- User-scoped queries
CREATE INDEX idx_food_logs_user_id ON public.food_logs(user_id);
CREATE INDEX idx_food_logs_logged_at ON public.food_logs(logged_at DESC);
CREATE INDEX idx_food_logs_user_date ON public.food_logs(user_id, logged_at DESC);

-- Goal queries
CREATE INDEX idx_goals_user_active ON public.goals(user_id, is_active);

-- Daily summaries
CREATE INDEX idx_daily_summaries_user_date ON public.daily_summaries(user_id, summary_date DESC);

-- Consent history
CREATE INDEX idx_consent_history_user ON public.consent_history(user_id, created_at DESC);

-- Processing activities
CREATE INDEX idx_processing_activities_user ON public.processing_activities(user_id, created_at DESC);

-- Security events
CREATE INDEX idx_security_events_created ON public.security_events(created_at DESC);
CREATE INDEX idx_security_events_user ON public.security_events(user_id);

-- Food database cache
CREATE INDEX idx_food_cache_external_id ON public.food_database_cache(source_api, external_id);
CREATE INDEX idx_food_cache_expires ON public.food_database_cache(expires_at);
```

### 1.3 RLS Policies Example

```sql
-- Enable RLS on all tables
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Food logs: Users can only access their own data
CREATE POLICY "Users can view own food logs"
ON public.food_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own food logs"
ON public.food_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own food logs"
ON public.food_logs FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own food logs"
ON public.food_logs FOR DELETE
USING (user_id = auth.uid());

-- Service role bypass for admin operations
CREATE POLICY "Service role full access on food_logs"
ON public.food_logs FOR ALL
USING (auth.role() = 'service_role');

-- Daily summaries: Read-only for users
CREATE POLICY "Users can view own daily summaries"
ON public.daily_summaries FOR SELECT
USING (user_id = auth.uid());

-- Consent history: Immutable (no updates/deletes)
CREATE POLICY "Users can view own consent history"
ON public.consent_history FOR SELECT
USING (user_id = auth.uid());

-- Security events: Read-only for audit
CREATE POLICY "Users can view own security events"
ON public.security_events FOR SELECT
USING (user_id = auth.uid());

-- Service role: Full access to security events
CREATE POLICY "Service role full access on security_events"
ON public.security_events FOR ALL
USING (auth.role() = 'service_role');
```

### 1.4 Pros and Cons

#### Pros

| Category | Benefit | Impact |
|----------|---------|--------|
| **Speed** | Fastest to MVP (1-2 weeks) | ⚡ High |
| **Cost** | Free tier generous (500MB DB, 50K MAU) | 💰 Low |
| **GDPR** | EU regions, RLS, audit logging built-in | ✅ High |
| **Features** | Auth, real-time, storage, edge functions included | ✅ High |
| **Observability** | Built-in dashboard, logs, metrics | ✅ Medium |
| **Proven** | Battle-tested in PdfExtractorAi | ✅ High |
| **Scaling** | Proven at scale (can handle 100K+ users) | 📊 Medium |

#### Cons

| Category | Concern | Mitigation |
|----------|---------|------------|
| **Lock-in** | Vendor lock-in with Supabase | Build abstraction layers (repository pattern) |
| **Complex Queries** | May need stored procedures for heavy analytics | Use materialized views, pre-aggregation |
| **Cold Starts** | Edge functions have cold starts | Use API routes for hot paths |
| **Customization** | Limited compared to self-hosted Postgres | Use extensions, stored procedures |
| **Free Tier Limits** | 500MB storage, 50K MAU | Implement retention, optimize queries |
| **Migration** | Harder to migrate away from Supabase | Use standard SQL, avoid proprietary features |

### 1.5 Cost Analysis

#### Supabase Pricing (2025)

| Tier | Database | Storage | Bandwidth | MAU | Price |
|------|----------|---------|-----------|-----|-------|
| **Free** | 500MB | 1GB | 2GB | 50,000 | $0 |
| **Pro** | 8GB | 100GB | 250GB | 500,000 | $25/mo |
| **Team** | 32GB | 500GB | 2TB | Unlimited | $100/mo |

#### Storage Breakdown for CalorieTracker

| Data Type | Per User Estimate | 1,000 Users | 10,000 Users | 50,000 Users |
|-----------|------------------|-------------|--------------|--------------|
| User profile | 1 KB | 1 MB | 10 MB | 50 MB |
| Food logs (1 year, 5/day) | 50 KB | 50 MB | 500 MB | 2.5 GB |
| Exercise logs (optional) | 10 KB | 10 MB | 100 MB | 500 MB |
| Consent history | 5 KB | 5 MB | 50 MB | 250 MB |
| Processing activities | 20 KB | 20 MB | 200 MB | 1 GB |
| Security events | 5 KB | 5 MB | 50 MB | 250 MB |
| Food cache (shared) | 0.1 KB per food | 10 MB | 100 MB | 500 MB |
| **Total** | ~91 KB | ~101 MB | ~1 GB | ~5 GB |

**Conclusion:**
- Free tier (500MB) supports ~500 users with 1 year of data
- Pro tier ($25/mo) supports ~5,000 users with 1 year of data
- Team tier ($100/mo) supports ~50,000 users with 1 year of data

**Optimization Strategies:**
- Implement 30-day soft delete for deleted users
- Aggregate old food logs (keep monthly summaries, purge daily details after 2 years)
- Anonymize old analytics instead of deleting
- Use food database cache with TTL (don't cache indefinitely)

---

## 2. Alternative Database Options

### 2.1 Managed PostgreSQL Elsewhere

#### Options

| Provider | Region | Starting Price | Key Features |
|----------|--------|----------------|--------------|
| **Neon** | EU (Frankfurt) | $0 (Free: 0.5GB) | Serverless, auto-scaling, branching |
| **Railway** | EU (multiple) | $5/mo (512MB) | Simple, good DX, integrated |
| **Render** | EU (Frankfurt) | $7/mo (1GB) | Simple, good for MVP |
| **PlanetScale** | Global | $29/mo (5GB) | MySQL, not Postgres |
| **Amazon RDS** | EU (multiple) | ~$15/mo | Full-featured, more expensive |

#### Neon (Most Competitive Alternative)

**Pros:**
- Serverless, auto-scaling (pay for what you use)
- Branching for development (like Git)
- EU region available (Frankfurt)
- Strong Postgres compatibility
- Generous free tier (0.5GB, 3 billion row reads/month)

**Cons:**
- No built-in auth (need separate solution)
- No built-in storage (need separate solution)
- No built-in real-time
- More operational complexity (assemble pieces yourself)
- Less mature than Supabase

**Comparison with Supabase:**

| Feature | Supabase | Neon | Winner |
|---------|----------|------|--------|
| Database | ✅ Postgres | ✅ Postgres | Tie |
| Auth | ✅ Built-in | ❌ Need separate | Supabase |
| Storage | ✅ Built-in | ❌ Need separate | Supabase |
| Real-time | ✅ Built-in | ❌ Need separate | Supabase |
| Serverless | ⚠️ Edge Functions | ✅ True serverless | Neon |
| Branching | ❌ No | ✅ Yes | Neon |
| EU Region | ✅ Yes | ✅ Yes | Tie |
| Free Tier | ✅ 500MB, 50K MAU | ✅ 0.5GB, 3B reads | Neon |
| DX | ✅ Dashboard + CLI | ✅ CLI + API | Tie |
| Migration | ⚠️ Medium | ✅ Easier (standard Postgres) | Neon |

**Use Case: When to Choose Neon Over Supabase:**

- Need advanced Postgres features not available in Supabase
- Want true serverless auto-scaling (pay per query)
- Need branching for feature development
- Have existing auth/storage solutions
- Planning to self-host Postgres later

**Migration Risk:**
- **Low to Medium:** Standard Postgres migrations (pg_dump/pg_restore)
- Need to rebuild auth, storage, real-time layers
- RLS policies need to be recreated
- Overall: More complex than staying on Supabase

#### Railway (Simple Alternative)

**Pros:**
- Very simple deployment (git push)
- Integrated with GitHub
- Good DX for solo developers
- EU regions available

**Cons:**
- More expensive than Supabase ($5/mo vs free)
- No built-in auth, storage, real-time
- Less mature than Supabase
- Harder to scale

**Migration Risk:**
- **Medium:** Standard Postgres migrations
- Need to rebuild auth/storage/real-time

---

### 2.2 SQLite / Local-First Approach

#### Overview

SQLite is an embedded database stored locally on the user's device. "Local-first" means data lives primarily on the device, with sync to a server.

**Variants:**
- **Pure SQLite:** No server, data only on device (WebSQL, SQLite via WASM)
- **Local-First with Sync:** SQLite on device + sync server (ElectricSQL, PowerSync, RxDB)
- **Hybrid:** Supabase for sync + local SQLite for offline

#### Technology Options

| Option | Sync Strategy | Complexity | Offline Support |
|--------|---------------|------------|-----------------|
| **Pure SQLite** | None (no sync) | Low | ✅ Full |
| **ElectricSQL** | Postgres ↔ SQLite sync | Medium | ✅ Full |
| **PowerSync** | Postgres ↔ SQLite sync | Medium | ✅ Full |
| **RxDB** | Custom sync | High | ✅ Full |
| **Supabase + Local-First** | Supabase Real-time + local cache | Medium | ✅ Partial |

#### ElectricSQL (Recommended for Local-First)

**Architecture:**
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Device A   │         │  Device B   │         │  Device C   │
│   (SQLite)  │         │   (SQLite)  │         │   (SQLite)  │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │        ElectricSQL Sync (PostgreSQL)          │
       └───────────────────────┼───────────────────────┘
                               │
                        ┌──────▼──────┐
                        │  Supabase   │
                        │ (PostgreSQL) │
                        └─────────────┘
```

**Pros:**
- ✅ Full offline support (critical for mobile apps)
- ✅ Instant local reads (no network latency)
- ✅ Privacy-first (data primarily on device)
- ✅ Better performance for complex local queries
- ✅ No cold starts
- ✅ Reduced bandwidth usage

**Cons:**
- ❌ Higher complexity (sync layer adds complexity)
- ❌ Conflict resolution (what happens if two devices edit same log?)
- ❌ Larger bundle size (SQLite + sync library)
- ❌ Initial sync time (first login downloads all data)
- ❌ More complex GDPR compliance (data distributed across devices)
- ❌ Harder to implement server-side analytics
- ❌ Need to manage schema migrations on devices

**GDPR Considerations for Local-First:**

| Challenge | Impact | Mitigation |
|-----------|--------|------------|
| **Data Export** | Data scattered across devices | Provide API to export from server + local export from app |
| **Right to Erasure** | Need to wipe data from all devices | Send "wipe command" to all user devices on next sync |
| **Data Portability** | Need to export from multiple sources | Merge device exports with server export |
| **Auditability** | Harder to track data changes | Log all sync operations, track device IDs |
| **Consent Withdrawal** | Harder to stop processing | Send "stop sync" command, wipe local data |

**Cost Analysis:**

| Component | Cost (MVP) | Cost (10K Users) | Cost (100K Users) |
|-----------|------------|-------------------|-------------------|
| Supabase (sync server) | $0 (free) | $25/mo (Pro) | $100/mo (Team) |
| ElectricSQL (open source) | $0 | $0 | $0 |
| Storage (less data on server) | Negligible | Negligible | Negligible |
| **Total** | **$0** | **$25/mo** | **$100/mo** |

**Comparison with Supabase-Only:**

| Metric | Supabase-Only | Local-First (ElectricSQL) | Winner |
|--------|---------------|---------------------------|--------|
| Offline Support | ❌ No | ✅ Full | Local-First |
| Performance | ⚠️ Network latency | ✅ Instant local | Local-First |
| Complexity | ✅ Low | ⚠️ Medium | Supabase |
| GDPR Compliance | ✅ Easy | ⚠️ Harder | Supabase |
| Time to MVP | ✅ 1-2 weeks | ⚠️ 3-4 weeks | Supabase |
| Cost (MVP) | ✅ Free | ✅ Free | Tie |
| Cost (Scale) | ⚠️ Higher | ✅ Lower | Local-First |
| Mobile Experience | ⚠️ Requires network | ✅ Works offline | Local-First |

**Migration Risk:**

| Migration Path | Risk | Effort |
|----------------|------|--------|
| **Supabase → Local-First** | High | High |
| **Local-First → Supabase** | Medium | Medium |

**Supabase → Local-First Migration:**
- Need to implement sync layer
- Conflict resolution strategy
- Device management
- Schema changes for sync metadata
- **Estimated effort:** 2-4 weeks of development

**Local-First → Supabase Migration:**
- Remove sync layer
- Keep server as source of truth
- Simplify app logic
- **Estimated effort:** 1-2 weeks of development

**Recommendation for Local-First:**

**Choose Local-First if:**
- Mobile app is primary platform (not web-first)
- Offline support is critical (users log food without connectivity)
- Target audience has poor connectivity (developing markets)
- Privacy is top priority (data primarily on device)
- You have experience with sync architectures

**Defer Local-First if:**
- Web-first MVP
- Validating product-market fit
- Solo developer with limited time
- Simpler compliance preferred

---

### 2.3 Mongo-like Options (NoSQL)

#### Overview

MongoDB and similar document databases store data as JSON-like documents, rather than tables with fixed schemas.

**Options:**
- **MongoDB Atlas** (managed MongoDB)
- **Firebase Firestore** (Google's NoSQL)
- **Supabase** (actually Postgres, but JSONB columns act like NoSQL)

#### MongoDB Atlas

**Data Model Example:**

```javascript
// Users collection
{
  _id: ObjectId("..."),
  email: "user@example.com",
  displayName: "John Doe",
  preferences: {
    theme: "dark",
    units: "metric"
  },
  createdAt: ISODate("2026-02-15T..."),
  deletedAt: null
}

// Food logs collection
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  foodName: "Chicken Breast",
  brandName: "Store Brand",
  quantity: 150,
  unit: "g",
  nutrition: {
    calories: 248,
    protein: 46,
    carbs: 0,
    fat: 5.5,
    fiber: 0,
    sugar: 0
  },
  mealType: "lunch",
  loggedAt: ISODate("2026-02-15T12:30:00Z"),
  createdAt: ISODate("2026-02-15T12:30:00Z"),
  metadata: {
    source: "manual",
    verified: false
  }
}

// Daily summaries collection
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  date: ISODate("2026-02-15T00:00:00Z"),
  nutrition: {
    totalCalories: 1850,
    totalProtein: 120,
    totalCarbs: 180,
    totalFat: 65
  },
  mealCount: 3,
  exercise: {
    caloriesBurned: 300
  },
  netCalories: 1550,
  createdAt: ISODate("2026-02-15T23:59:59Z")
}
```

**Pros:**
- ✅ Flexible schema (no migrations for schema changes)
- ✅ Natural JSON storage (matches JavaScript objects)
- ✅ Good for nested data (nutrition object)
- ✅ Horizontal scaling (sharding)
- ✅ Rich query language

**Cons:**
- ❌ No built-in RLS equivalent (need app-level auth)
- ❌ Less efficient for relational data (joins are harder)
- ❌ No built-in GDPR tools (need to implement from scratch)
- ❌ Higher cost than Supabase
- ❌ No EU regions in free tier (paid only)
- ❌ No built-in auth/storage/real-time

**GDPR Compliance for MongoDB:**

| Challenge | MongoDB | Supabase |
|-----------|---------|----------|
| **Data Isolation** | ❌ App-level only (complex) | ✅ RLS at DB level |
| **Audit Logging** | ❌ Build from scratch | ✅ Built-in triggers |
| **Data Export** | ⚠️ Manual export | ✅ SQL SELECT * FROM |
| **Data Deletion** | ⚠️ Manual deletion | ✅ CASCADE DELETE |
| **Query Complexity** | ⚠️ App-level filtering | ✅ SQL WHERE clause |
| **Consistency** | ⚠️ Eventual consistency | ✅ ACID transactions |

**Cost Analysis:**

| Tier | Storage | RAM | Price |
|------|---------|-----|-------|
| **Free** | 512MB | 512MB | $0 |
| **M0** | 512MB | 512MB | $0 |
| **M2** | 2GB | 2GB | $9/mo |
| **M5** | 5GB | 4GB | $20/mo |

**Note:** MongoDB's free tier (M0) is actually free but limited. Real free tier (legacy) is being phased out.

**Comparison with Supabase/Postgres:**

| Metric | Supabase (Postgres) | MongoDB | Winner |
|--------|---------------------|---------|--------|
| Schema | ❌ Fixed (migrations) | ✅ Flexible | MongoDB |
| RLS | ✅ Built-in | ❌ None | Supabase |
| GDPR Tools | ✅ Built-in | ❌ None | Supabase |
| Auth | ✅ Built-in | ❌ None | Supabase |
| Storage | ✅ Built-in | ❌ None | Supabase |
| Real-time | ✅ Built-in | ⚠️ Change Streams (paid) | Supabase |
| Free Tier | ✅ 500MB, 50K MAU | ⚠️ 512MB (limited) | Supabase |
| EU Region | ✅ Yes | ⚠️ Paid only | Supabase |
| Horizontal Scaling | ⚠️ Vertical only | ✅ Sharding | MongoDB |
| JSON Support | ✅ JSONB columns | ✅ Native | Tie |
| Data Export | ✅ Easy SQL | ⚠️ Aggregation | Supabase |
| Data Deletion | ✅ CASCADE | ⚠️ Manual | Supabase |

**Recommendation for MongoDB:**

**Choose MongoDB if:**
- You have deep MongoDB experience
- Schema flexibility is critical (rapidly changing data model)
- You need horizontal scaling (millions of users)
- You're building a primarily mobile app (MongoDB popular in mobile)
- You want to use the MongoDB ecosystem (Realm, Stitch)

**Defer MongoDB if:**
- GDPR compliance is priority (RLS is better in Supabase)
- You want fastest time-to-market
- You're solo developer (Supabase is simpler)
- You want free tier for longer (Supabase's free tier is better)

**Migration Risk:**

| Migration Path | Risk | Effort |
|----------------|------|--------|
| **Postgres → MongoDB** | High | High |
| **MongoDB → Postgres** | High | High |

**Postgres → MongoDB Migration:**
- Schema redesign (relational → document)
- Rewrite all queries (SQL → MongoDB aggregation)
- Rebuild RLS (app-level auth)
- Rebuild GDPR tools (audit logging, export, delete)
- **Estimated effort:** 4-6 weeks

**MongoDB → Postgres Migration:**
- Schema redesign (document → relational)
- Rewrite all queries (MongoDB → SQL)
- Implement RLS policies
- Implement GDPR tools
- **Estimated effort:** 4-6 weeks

---

### 2.4 Firebase Firestore (Google's BaaS)

#### Overview

Firebase is Google's Backend-as-a-Service platform, with Firestore as its NoSQL database.

**Pros:**
- ✅ Real-time subscriptions (built-in)
- ✅ Offline support (mobile SDKs)
- ✅ Built-in auth (email, OAuth, phone)
- ✅ Built-in storage
- ✅ Push notifications
- ✅ Great mobile SDKs

**Cons:**
- ❌ No SQL (NoSQL query model)
- ❌ No RLS (use Firestore security rules)
- ❌ No built-in GDPR export/delete (build from scratch)
- ❌ No EU regions in Spark plan (paid only)
- ❌ Expensive at scale
- ❌ Limited querying (no complex joins)
- ❌ Vendor lock-in (Google-specific)

**Cost Analysis:**

| Tier | Reads | Writes | Storage | Price |
|------|-------|--------|---------|-------|
| **Spark (Free)** | 50K/day | 20K/day | 1GB | $0 |
| **Blaze (Pay-as-you-go)** | $0.06/100K | $0.18/100K | $0.18/GB | Variable |

**Example Cost for 10K Users:**
- Reads: 10K users × 5 reads/day × 30 days = 1.5M reads = $0.90
- Writes: 10K users × 2 writes/day × 30 days = 600K writes = $1.08
- Storage: 10K users × 50KB = 500MB = $0.09
- **Total:** ~$2.07/month

**Comparison with Supabase:**

| Metric | Supabase | Firebase | Winner |
|--------|----------|----------|--------|
| Real-time | ✅ Built-in | ✅ Built-in | Tie |
| Offline Support | ⚠️ Limited | ✅ Full | Firebase |
| Auth | ✅ Built-in | ✅ Built-in | Tie |
| Storage | ✅ Built-in | ✅ Built-in | Tie |
| RLS | ✅ SQL-based | ⚠️ Security rules | Supabase |
| GDPR Tools | ✅ Triggers | ❌ Build from scratch | Supabase |
| SQL Support | ✅ Full SQL | ❌ NoSQL | Supabase |
| EU Region (Free) | ✅ Yes | ❌ No | Supabase |
| Cost (10K Users) | ✅ Free | ⚠️ $2/mo | Supabase |
| Cost (100K Users) | ⚠️ $25/mo | ⚠️ $20/mo | Firebase |
| Mobile SDKs | ⚠️ Basic | ✅ Excellent | Firebase |
| Developer Experience | ✅ Good | ✅ Excellent | Tie |

**Recommendation for Firebase:**

**Choose Firebase if:**
- Mobile-first app (native Android/iOS)
- Need excellent offline support
- Already in Google ecosystem
- Need push notifications (Firebase is best)
- Have Firebase experience

**Defer Firebase if:**
- Web-first MVP
- GDPR compliance is priority
- SQL querying is important
- Want EU data residency on free tier

---

## 3. Data Model Implications

### 3.1 Relational vs. Document vs. Hybrid

#### Supabase/Postgres (Relational with JSONB)

**Best for:**
- Structured data with relationships (users ↔ food_logs ↔ goals)
- Complex queries (aggregations, joins, analytics)
- Strong consistency (ACID transactions)
- GDPR compliance (SQL-based RLS)

**Data Model Characteristics:**
```sql
-- Relational: Foreign keys enforce integrity
food_logs.user_id → users.id

-- JSONB: Flexible nested data
food_logs.nutrition → {protein: 30, carbs: 20, fat: 10}

-- Hybrid: Best of both worlds
```

**Tradeoffs:**
- ✅ Strong data integrity
- ✅ Complex queries (SQL)
- ✅ Built-in constraints (CHECK, UNIQUE)
- ⚠️ Schema migrations required
- ⚠️ Less flexible than NoSQL

#### MongoDB/NoSQL (Document)

**Best for:**
- Rapidly evolving schemas
- Nested data structures
- Mobile-first apps
- Horizontal scaling

**Data Model Characteristics:**
```javascript
// Document: Everything in one place
{
  userId: "...",
  dailyLog: {
    date: "2026-02-15",
    meals: [
      {
        type: "breakfast",
        foods: [
          {
            name: "Oatmeal",
            quantity: 150,
            unit: "g",
            nutrition: { calories: 150, protein: 5, ... }
          }
        ]
      }
    ],
    totalNutrition: { calories: 1850, protein: 120, ... }
  }
}
```

**Tradeoffs:**
- ✅ Flexible schema
- ✅ Natural for nested data
- ✅ Good for mobile
- ❌ No joins (need to denormalize)
- ❌ Data duplication (violates DRY)
- ❌ Harder to maintain consistency

#### Hybrid Approach (Postgres with JSONB)

**Recommended for CalorieTracker:**

```sql
-- Core relational tables (structured data)
CREATE TABLE food_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  food_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  logged_at TIMESTAMP NOT NULL
);

-- JSONB for flexible fields
ALTER TABLE food_logs ADD COLUMN nutrition JSONB;
-- nutrition: {calories: 200, protein: 15, carbs: 30, fat: 8}

-- JSONB for metadata
ALTER TABLE food_logs ADD COLUMN metadata JSONB;
-- metadata: {source: "api", verified: true, tags: ["breakfast", "healthy"]}

-- Query JSONB fields
SELECT * FROM food_logs
WHERE nutrition->>'calories' > '500';

-- Index JSONB fields for performance
CREATE INDEX idx_food_logs_nutrition_calories
ON food_logs ((nutrition->>'calories')::NUMERIC);
```

**Benefits:**
- ✅ Best of both worlds (relational + flexible)
- ✅ SQL queries with JSONB support
- ✅ RLS works on JSONB columns
- ✅ No need for separate NoSQL database
- ✅ Postgres mature and stable

### 3.2 Schema Design for CalorieTracker

#### User Profile

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  preferences JSONB DEFAULT '{}',
  -- preferences: {theme, units, notifications_enabled, ...}
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Design Decisions:**
- **JSONB for preferences:** Flexible, future-proof (add new prefs without schema change)
- **Soft delete:** is_deleted flag for GDPR (30-day grace period)
- **Reference to auth.users:** Leverage Supabase Auth

#### Food Logs

```sql
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  food_name TEXT NOT NULL,
  brand_name TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('g', 'ml', 'cup', 'piece', 'serving')),
  logged_at TIMESTAMP NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),

  -- JSONB for nutrition (flexible for different foods)
  nutrition JSONB NOT NULL,
  -- nutrition: {calories: 200, protein: 15, carbs: 30, fat: 8, fiber: 2, sugar: 5}

  -- JSONB for metadata (extensible)
  metadata JSONB DEFAULT '{}',
  -- metadata: {source: "manual", verified: false, tags: [], notes: ""}

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for common queries
CREATE INDEX idx_food_logs_user_id ON food_logs(user_id);
CREATE INDEX idx_food_logs_logged_at ON food_logs(logged_at DESC);
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, logged_at DESC);
CREATE INDEX idx_food_logs_meal_type ON food_logs(meal_type);

-- RLS policies (see section 1.3)
```

**Design Decisions:**
- **JSONB for nutrition:** Flexible (different foods have different nutrients)
- **CHECK constraints:** Enforce valid units, meal types
- **Composite index:** (user_id, logged_at) for date range queries
- **Soft delete:** is_deleted flag for GDPR

#### Daily Summaries (Pre-aggregated)

```sql
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  summary_date DATE NOT NULL,

  -- Pre-aggregated nutrition (faster queries)
  total_calories NUMERIC DEFAULT 0,
  total_protein NUMERIC DEFAULT 0,
  total_carbs NUMERIC DEFAULT 0,
  total_fat NUMERIC DEFAULT 0,

  meal_count INTEGER DEFAULT 0,

  -- Exercise data
  exercise_calories_burned NUMERIC DEFAULT 0,

  -- Net calories
  net_calories NUMERIC DEFAULT 0,

  -- Goal tracking
  calories_goal NUMERIC,
  calories_met BOOLEAN,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, summary_date)
);

-- Indexes
CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, summary_date DESC);

-- Function to update daily summary
CREATE OR REPLACE FUNCTION update_daily_summary(user_id UUID, summary_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_summaries (user_id, summary_date)
  VALUES (user_id, summary_date)
  ON CONFLICT (user_id, summary_date) DO UPDATE SET
    total_calories = (
      SELECT COALESCE(SUM((nutrition->>'calories')::NUMERIC), 0)
      FROM food_logs
      WHERE food_logs.user_id = daily_summaries.user_id
        AND DATE(food_logs.logged_at) = daily_summaries.summary_date
        AND food_logs.is_deleted = FALSE
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update summary on food log insert/update
CREATE TRIGGER trigger_update_daily_summary
AFTER INSERT OR UPDATE ON food_logs
FOR EACH ROW
EXECUTE FUNCTION update_daily_summary(NEW.user_id, DATE(NEW.logged_at));
```

**Design Decisions:**
- **Pre-aggregation:** Faster queries (don't sum all food_logs for dashboard)
- **Trigger-based auto-update:** Always in sync with food_logs
- **UNIQUE constraint:** One summary per user per day
- **Goal tracking:** Track calories_goal and whether met

#### Goals

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  goal_type TEXT NOT NULL CHECK (goal_type IN ('daily_calories', 'weight', 'macros')),
  target_value NUMERIC NOT NULL,

  -- JSONB for macro targets (if goal_type = 'macros')
  macro_targets JSONB,
  -- macro_targets: {protein: 150, carbs: 200, fat: 65}

  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Progress tracking
  current_value NUMERIC,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_goals_user_active ON goals(user_id, is_active);
```

**Design Decisions:**
- **JSONB for macro_targets:** Flexible (different users track different macros)
- **is_active flag:** Archive old goals, keep history
- **current_value:** Track progress (updated daily)

### 3.3 GDPR-Required Tables

#### Consent History

```sql
CREATE TABLE consent_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'marketing', 'analytics', 'social', 'ai', 'third_party_food_db'
  )),
  consent_given BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL, -- e.g., "1.0", "1.1"
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),

  -- Immutable: prevent updates/deletes
  CONSTRAINT immutable_consent_history CHECK (created_at IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_consent_history_user ON consent_history(user_id, created_at DESC);
CREATE INDEX idx_consent_history_type ON consent_history(consent_type);

-- RLS: Users can view their own consent history (read-only)
CREATE POLICY "Users can view own consent history"
ON consent_history FOR SELECT
USING (user_id = auth.uid());
```

**Design Decisions:**
- **Immutable:** No updates/deletes (complete audit trail)
- **Version tracking:** Track consent policy versions
- **IP/User agent:** Audit trail for compliance
- **Read-only RLS:** Users can view but not modify

#### Processing Activities

```sql
CREATE TABLE processing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  activity_type TEXT NOT NULL,
  -- activity_type: 'food_log_created', 'data_exported', 'account_deleted', ...

  data_categories JSONB DEFAULT '[]',
  -- data_categories: ['food_logs', 'user_profile', 'consent_history']

  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL CHECK (legal_basis IN (
    'contract', 'consent', 'legitimate_interests', 'legal_obligation'
  )),

  ip_address INET,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_processing_activities_user ON processing_activities(user_id, created_at DESC);
CREATE INDEX idx_processing_activities_type ON processing_activities(activity_type);

-- RLS: Users can view their own processing activities (read-only)
CREATE POLICY "Users can view own processing activities"
ON processing_activities FOR SELECT
USING (user_id = auth.uid());
```

**Design Decisions:**
- **Article 30 compliance:** Record of all processing activities
- **Legal basis tracking:** Explicitly track legal basis (GDPR requirement)
- **Data categories:** Track what data was accessed/processed

#### Security Events

```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'auth_failure', 'auth_success', 'rate_limit_exceeded',
    'suspicious_activity', 'api_error', 'gdpr_request'
  )),
  user_id UUID REFERENCES users(id),
  ip_address INET NOT NULL,
  user_agent TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_severity ON security_events(severity);

-- RLS: Users can view their own security events (read-only)
CREATE POLICY "Users can view own security events"
ON security_events FOR SELECT
USING (user_id = auth.uid());

-- Service role: Full access for monitoring
CREATE POLICY "Service role full access on security_events"
ON security_events FOR ALL
USING (auth.role() = 'service_role');
```

**Design Decisions:**
- **Security monitoring:** Track auth failures, rate limits, suspicious activity
- **Severity levels:** Prioritize alerts
- **Service role access:** Admin needs full access for monitoring

---

## 4. Privacy/Compliance Operational Considerations

### 4.1 Data Retention Policies

#### GDPR Article 5(1)(e): Storage Limitation

> "Personal data shall be kept in a form which permits identification of data subjects for no longer than is necessary for the purposes for which the personal data are processed"

#### Recommended Retention Policy for CalorieTracker

| Data Type | Retention Period | Rationale | Implementation |
|-----------|------------------|-----------|----------------|
| **Active user data** | Until account deleted | Required for service | Hard delete on account deletion |
| **Deleted user data** | 30 days (soft delete) | Grace period for recovery | Hard delete after 30 days |
| **Audit logs** (consent, processing, security) | 24 months | Security, compliance, debugging | Keep 24 months, then anonymize |
| **Anonymous usage data** | 30 days | Abuse prevention | Hard delete after 30 days |
| **Food logs** | Until account deleted (or 2 years if inactive) | Core service data | Hard delete on account deletion; purge logs from inactive accounts after 2 years |
| **Analytics** | 12 months (anonymized after 6 months) | App improvement | Anonymize after 6 months, keep 12 months |
| **Goals** | Until account deleted | User preferences | Hard delete on account deletion |
| **Daily summaries** | Until account deleted (or 1 year if inactive) | Derived data | Recompute from food logs, keep 1 year |
| **Food database cache** | 30 days (TTL) | Performance | Hard delete after expiry |

#### Implementation: Cron Job

```typescript
// app/api/cron/data-retention/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  const results = {
    deletedUsersPurged: 0,
    inactiveFoodLogsPurged: 0,
    oldFoodCachePurged: 0,
    anonymizedAnalytics: 0
  }

  try {
    // 1. Purge deleted users (soft delete > 30 days)
    const { count: deletedUsers } = await supabase
      .from('users')
      .delete()
      .lt('deleted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .not('deleted_at', 'is', null)

    results.deletedUsersPurged = deletedUsers || 0

    // 2. Purge old food logs (inactive users > 2 years)
    const { count: inactiveFoodLogs } = await supabase
      .from('food_logs')
      .delete()
      .in(
        'user_id',
        supabase.rpc('get_inactive_users', { inactive_days: 730 })
      )
      .lt('logged_at', new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString())

    results.inactiveFoodLogsPurged = inactiveFoodLogs || 0

    // 3. Purge expired food database cache
    const { count: expiredCache } = await supabase
      .from('food_database_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())

    results.oldFoodCachePurged = expiredCache || 0

    // 4. Anonymize old analytics (older than 6 months)
    const { count: anonymized } = await supabase
      .from('processing_activities')
      .update({ user_id: null, ip_address: null, metadata: '{}' })
      .lt('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      .eq('activity_type', 'analytics')

    results.anonymizedAnalytics = anonymized || 0

    return Response.json({ success: true, results })

  } catch (error) {
    console.error('Data retention cron error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

#### Helper Function: Get Inactive Users

```sql
-- Get users who haven't logged in for X days
CREATE OR REPLACE FUNCTION get_inactive_users(inactive_days INTEGER)
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT id FROM users
  WHERE last_login_at < NOW() - (inactive_days || ' days')::INTERVAL
    AND is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Data Deletion (Right to Erasure)

#### GDPR Article 17: Right to Erasure

Users have the right to request deletion of all their personal data.

#### Implementation: Two-Phase Deletion

**Phase 1: Soft Delete (Immediate)**

```typescript
// Soft delete user account
export async function softDeleteUser(userId: UUID) {
  const supabase = createClient()

  // 1. Mark user as deleted
  await supabase
    .from('users')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', userId)

  // 2. Soft delete all user data (keep for 30-day grace period)
  await supabase
    .from('food_logs')
    .update({ is_deleted: true })
    .eq('user_id', userId)

  await supabase
    .from('exercise_logs')
    .update({ is_deleted: true })
    .eq('user_id', userId)

  await supabase
    .from('goals')
    .update({ is_active: false })
    .eq('user_id', userId)

  // 3. Log processing activity
  await supabase
    .from('processing_activities')
    .insert({
      user_id: userId,
      activity_type: 'account_soft_deleted',
      data_categories: ['food_logs', 'user_profile', 'goals'],
      purpose: 'Right to erasure - soft delete',
      legal_basis: 'legal_obligation',
      metadata: { phase: 'soft_delete' }
    })
}
```

**Phase 2: Hard Delete (After 30 Days)**

```typescript
// Hard delete user account (run by cron job)
export async function hardDeleteUser(userId: UUID) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // 1. Delete all user data
  await supabase.from('food_logs').delete().eq('user_id', userId)
  await supabase.from('exercise_logs').delete().eq('user_id', userId)
  await supabase.from('goals').delete().eq('user_id', userId)
  await supabase.from('daily_summaries').delete().eq('user_id', userId)
  await supabase.from('weight_logs').delete().eq('user_id', userId)

  // 2. Delete user profile
  await supabase.from('users').delete().eq('id', userId)

  // 3. Delete Supabase Auth user
  await supabase.auth.admin.deleteUser(userId)

  // 4. Keep consent history (read-only, anonymized)
  await supabase
    .from('consent_history')
    .update({ user_id: null, ip_address: null })
    .eq('user_id', userId)

  // 5. Keep processing activities (read-only, anonymized)
  await supabase
    .from('processing_activities')
    .update({ user_id: null, ip_address: null })
    .eq('user_id', userId)

  // 6. Keep security events (read-only, anonymized)
  await supabase
    .from('security_events')
    .update({ user_id: null })
    .eq('user_id', userId)

  // 7. Log final deletion
  await supabase
    .from('security_events')
    .insert({
      event_type: 'gdpr_request',
      severity: 'medium',
      ip_address: '0.0.0.0',
      user_agent: 'system',
      details: { user_id: userId, action: 'hard_delete_complete' }
    })
}
```

### 4.3 Data Export (Right to Access & Portability)

#### GDPR Article 15: Right to Access
#### GDPR Article 20: Right to Portability

Users have the right to receive a copy of their personal data in a machine-readable format.

#### Implementation: Export Endpoint

```typescript
// app/api/gdpr/export/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Get user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Fetch all user data
    const [userProfile, foodLogs, exerciseLogs, goals, weightLogs, consentHistory, processingActivities] =
      await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('food_logs').select('*').eq('user_id', user.id),
        supabase.from('exercise_logs').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('weight_logs').select('*').eq('user_id', user.id),
        supabase.from('consent_history').select('*').eq('user_id', user.id),
        supabase.from('processing_activities').select('*').eq('user_id', user.id)
      ])

    // 2. Build export object
    const exportData = {
      userProfile: userProfile.data,
      foodLogs: foodLogs.data || [],
      exerciseLogs: exerciseLogs.data || [],
      goals: goals.data || [],
      weightLogs: weightLogs.data || [],
      consentHistory: consentHistory.data || [],
      processingActivities: processingActivities.data || [],
      exportDate: new Date().toISOString(),
      exportFormat: 'json'
    }

    // 3. Log export
    await supabase
      .from('processing_activities')
      .insert({
        user_id: user.id,
        activity_type: 'data_exported',
        data_categories: Object.keys(exportData),
        purpose: 'Right to access / Right to portability',
        legal_basis: 'legal_obligation',
        metadata: { exportFormat: 'json' }
      })

    // 4. Return JSON
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="calorietracker-export-${user.id}-${new Date().toISOString().split('T')[0]}.json"`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

#### Alternative: CSV Export

```typescript
// app/api/gdpr/export/csv/route.ts
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch food logs
  const { data: foodLogs } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: true })

  // Convert to CSV
  const headers = ['date', 'food_name', 'quantity', 'unit', 'calories', 'protein', 'carbs', 'fat', 'meal_type']
  const csvRows = [
    headers.join(','),
    ...(foodLogs || []).map(log => [
      log.logged_at,
      log.food_name,
      log.quantity,
      log.unit,
      log.nutrition?.calories || 0,
      log.nutrition?.protein || 0,
      log.nutrition?.carbs || 0,
      log.nutrition?.fat || 0,
      log.meal_type || ''
    ].join(','))
  ]

  return new Response(csvRows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="food-logs-export-${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}
```

### 4.4 Auditability

#### GDPR Article 30: Record of Processing Activities

Controllers must maintain a record of processing activities under their responsibility.

#### Implementation: Automatic Logging

```typescript
// Middleware: Log all API requests
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get user from auth header
  const authHeader = request.headers.get('authorization')
  const user = await getUserFromAuthHeader(authHeader)

  // Skip logging for public routes
  if (!user && request.nextUrl.pathname.startsWith('/api/public/')) {
    return NextResponse.next()
  }

  // Log processing activity
  if (user) {
    const dataCategories = getDataCategoriesFromPath(request.nextUrl.pathname)

    await supabase
      .from('processing_activities')
      .insert({
        user_id: user.id,
        activity_type: getActivityTypeFromPath(request.nextUrl.pathname),
        data_categories: dataCategories,
        purpose: getPurposeFromPath(request.nextUrl.pathname),
        legal_basis: getLegalBasisFromPath(request.nextUrl.pathname),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        metadata: {
          method: request.method,
          path: request.nextUrl.pathname,
          userAgent: request.headers.get('user-agent')
        }
      })
  }

  return NextResponse.next()
}

// Helper functions
function getActivityTypeFromPath(pathname: string): string {
  if (pathname.includes('/food/')) return 'food_data_accessed'
  if (pathname.includes('/gdpr/')) return 'gdpr_request'
  if (pathname.includes('/stats/')) return 'analytics_accessed'
  return 'api_request'
}

function getDataCategoriesFromPath(pathname: string): string[] {
  if (pathname.includes('/food/')) return ['food_logs']
  if (pathname.includes('/stats/')) return ['food_logs', 'user_profile']
  if (pathname.includes('/gdpr/export')) return ['all_data']
  return []
}

function getPurposeFromPath(pathname: string): string {
  if (pathname.includes('/stats/')) return 'analytics'
  return 'core_functionality'
}

function getLegalBasisFromPath(pathname: string): string {
  if (pathname.includes('/stats/')) return 'legitimate_interests'
  return 'contract'
}
```

#### Audit Query: User Processing History

```sql
-- Get all processing activities for a user
SELECT
  created_at,
  activity_type,
  data_categories,
  purpose,
  legal_basis,
  ip_address
FROM processing_activities
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;

-- Get all consent changes for a user
SELECT
  created_at,
  consent_type,
  consent_given,
  consent_version,
  ip_address
FROM consent_history
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;

-- Get all security events for a user
SELECT
  created_at,
  event_type,
  severity,
  details
FROM security_events
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;
```

### 4.5 Data Subject Request Tracking

#### Implementation: GDPR Request Management

```typescript
// app/api/gdpr/request/route.ts
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { requestType } = await request.json()

  // Validate request type
  if (
!['access', 'erasure', 'portability', 'rectification'].includes(requestType)
) {
    return Response.json({ error: 'Invalid request type' }, { status: 400 })
  }

  // Create GDPR request record
  const { data: gdprRequest } = await supabase
    .from('gdpr_requests')
    .insert({
      user_id: user.id,
      request_type: requestType,
      status: 'pending'
    })
    .select()
    .single()

  // Process request
  switch (requestType) {
    case 'access':
    case 'portability':
      // Trigger export (already implemented)
      break
    case 'erasure':
      // Trigger soft delete
      await softDeleteUser(user.id)
      break
    case 'rectification':
      // User can edit their data directly
      break
  }

  // Update request status
  await supabase
    .from('gdpr_requests')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', gdprRequest.id)

  // Log processing activity
  await supabase
    .from('processing_activities')
    .insert({
      user_id: user.id,
      activity_type: 'gdpr_request_completed',
      data_categories: ['gdpr_request'],
      purpose: `GDPR ${requestType} request`,
      legal_basis: 'legal_obligation',
      metadata: { request_id: gdprRequest.id, request_type }
    })

  return Response.json({ success: true, requestId: gdprRequest.id })
}
```

---

## 5. Cost and Scaling Tradeoffs

### 5.1 Cost Comparison (MVP → Production)

| Phase | Users | Supabase | Neon | Local-First | MongoDB | Firebase |
|-------|-------|----------|------|-------------|---------|----------|
| **MVP** | 0-1,000 | **$0** (Free) | **$0** (Free) | **$0** (Free) | **$0** (Free) | **$0** (Spark) |
| **Growth** | 1,000-10,000 | **$0** (Free) | **$0** (Free) | **$0** (Free) | $9/mo (M2) | ~$2/mo |
| **Scale** | 10,000-50,000 | **$25/mo** (Pro) | ~$10/mo | **$25/mo** (Pro) | $20/mo (M5) | ~$10/mo |
| **Enterprise** | 50,000+ | **$100/mo** (Team) | ~$50/mo | **$100/mo** (Team) | Custom | ~$50/mo |

### 5.2 Scaling Analysis

#### Supabase/Postgres Scaling

**Vertical Scaling (Default):**

| Tier | Database Size | RAM | Concurrent Connections | MAU Limit |
|------|---------------|-----|------------------------|-----------|
| Free | 500MB | 1GB | 60 | 50,000 |
| Pro | 8GB | 4GB | 200 | 500,000 |
| Team | 32GB | 16GB | 500 | Unlimited |

**Scaling Triggers:**

| Metric | Warning Threshold | Critical Threshold | Action |
|--------|-------------------|---------------------|--------|
| **Database Size** | > 400MB (Free) | > 7GB (Pro) | Upgrade tier |
| **Connections** | > 50 (Free) | > 180 (Pro) | Upgrade tier or use connection pooling |
| **Query Performance** | > 1s avg | > 5s avg | Add indexes, optimize queries |
| **MAU** | > 40,000 (Free) | > 450,000 (Pro) | Upgrade tier |

**Horizontal Scaling (Advanced):**

- **Read Replicas:** Distribute read queries (not available in free tier)
- **Connection Pooling:** PgBouncer (Supabase provides this)
- **Caching:** Redis for frequently accessed data
- **Materialized Views:** Pre-compute heavy queries

#### Neon Scaling (Serverless Auto-scaling)

**Pricing Model:** Pay per compute hour + storage

| Resource | Price |
|----------|-------|
| Compute | $0.10 per 1M row reads + $0.20 per 1M row writes |
| Storage | $0.155 per GB/month |
| Backup | $0.155 per GB/month |

**Scaling Behavior:**
- Auto-scales based on load (0 to max)
- No connection limits (serverless)
- Scales down to zero when idle

**Cost Example (10K Users):**

| Metric | Estimate | Cost |
|--------|----------|------|
| Row reads | 10K users × 50 reads/day × 30 days = 15M reads | $1.50 |
| Row writes | 10K users × 10 writes/day × 30 days = 3M writes | $0.60 |
| Storage | 10K users × 50KB = 500MB | $0.08 |
| **Total** | | **~$2.18/mo** |

**Conclusion:** Neon is cost-competitive at scale, especially for read-heavy workloads.

#### Local-First Scaling

**Server-Side Cost:**
- Supabase for sync: Same as Supabase-only
- **Less server-side load** (most reads from local SQLite)

**Client-Side Considerations:**
- Larger app bundle (SQLite + sync library)
- More complex conflict resolution at scale
- Need to manage schema updates on devices

**Cost Savings vs Supabase-Only:**
- ~30% reduction in server load (mostly sync operations)
- Same or higher client-side cost (larger bundle, more complex app)

#### MongoDB Scaling

**Vertical Scaling (Default):**

| Tier | Storage | RAM | Connections | Price |
|------|---------|-----|-------------|-------|
| Free | 512MB | 512MB | 500 | $0 |
| M2 | 2GB | 2GB | 500 | $9/mo |
| M5 | 5GB | 4GB | Unlimited | $20/mo |
| M10 | 10GB | 8GB | Unlimited | $57/mo |

**Horizontal Scaling:**
- **Sharding:** Distribute data across shards (M10+)
- **Read Replicas:** Distribute read queries (M20+)
- **Auto-scaling:** Not available (manual scaling)

**Cost Example (10K Users):**
- Storage: 500MB → M2 tier ($9/mo)
- **No per-query billing**
- **Fixed cost regardless of usage**

**Conclusion:** MongoDB is predictable cost-wise, but more expensive at low scale compared to Supabase/Neon.

#### Firebase Scaling

**Pricing Model:** Pay per operation

| Resource | Price |
|----------|-------|
| Document reads | $0.06 per 100K |
| Document writes | $0.18 per 100K |
| Document deletes | $0.02 per 100K |
| Storage | $0.18 per GB/month |
| Network egress | $0.12 per GB |

**Cost Example (10K Users):**

| Metric | Estimate | Cost |
|--------|----------|------|
| Document reads | 10K users × 50 reads/day × 30 days = 15M reads = 150 × 100K | $9.00 |
| Document writes | 10K users × 10 writes/day × 30 days = 3M writes = 30 × 100K | $5.40 |
| Storage | 10K users × 50KB = 500MB = 0.5GB | $0.09 |
| **Total** | | **~$14.49/mo** |

**Conclusion:** Firebase is expensive at scale compared to Supabase, but has excellent mobile SDKs.

### 5.3 Total Cost of Ownership (TCO)

**3-Year Cost Comparison (assuming growth to 50K users):**

| Phase | Months | Supabase | Neon | Local-First | MongoDB | Firebase |
|-------|--------|----------|------|-------------|---------|----------|
| MVP | 0-6 | $0 | $0 | $0 | $0 | $0 |
| Growth | 7-18 | $0 | ~$10 | $0 | $54 | ~$18 |
| Scale | 19-36 | $600 ($25/mo × 24) | ~$240 | $600 | $480 | ~$240 |
| **Total (36 mo)** | | **$600** | **~$250** | **$600** | **$534** | **~$258** |

**Hidden Costs (Not Included):**

| Cost | Supabase | Neon | Local-First | MongoDB | Firebase |
|------|----------|------|-------------|---------|----------|
| **Development Time** | Low (1-2 weeks) | Medium (2-3 weeks) | High (4-6 weeks) | Medium (3-4 weeks) | Medium (3-4 weeks) |
| **Migration Risk** | Low | Medium | High | High | High |
| **Compliance Effort** | Low (built-in) | Medium (build from scratch) | High (complex) | High (build from scratch) | High (build from scratch) |
| **Operational Overhead** | Low (dashboard) | Medium (more manual) | Medium (sync monitoring) | Medium (monitoring) | Low (dashboard) |

**Conclusion:**

- **Cheapest (TCO):** Neon (lower runtime cost, higher dev effort)
- **Fastest TTM:** Supabase (free tier, low dev effort)
- **Best for Mobile:** Firebase (excellent SDKs, but expensive)
- **Best for Scale:** Supabase or Neon (both scale well)

---

## 6. Recommendation with Phased Path

### 6.1 Primary Recommendation

**Start with Supabase/PostgreSQL (Option A)**

**Why:**

1. **Fastest to MVP:** 1-2 weeks to production
2. **GDPR-Ready:** EU regions, RLS, audit logging built-in
3. **Free Tier Efficient:** Supports up to 5,000 users with optimization
4. **Proven Patterns:** Battle-tested in PdfExtractorAi
5. **Clear Migration Path:** Can evolve to Neon, local-first, or custom Postgres
6. **Low Risk:** Standard SQL, no vendor-specific features needed

**When to Reconsider:**

- Need advanced Postgres features not available in Supabase → **Neon**
- Mobile-first with offline requirement → **Local-First (ElectricSQL)**
- Deep MongoDB experience → **MongoDB Atlas**
- Already in Google ecosystem → **Firebase**

### 6.2 Phased Implementation Path

#### Phase 1: MVP (0-1,000 Users)

**Goal:** Validate product-market fit

**Database Choice:** Supabase (Free Tier)

**Implementation:**

```typescript
// 1. Core tables only (minimal schema)
users, food_logs, goals

// 2. GDPR tables (required from day 1)
consent_history, processing_activities, security_events

// 3. Indexes for performance
food_logs(user_id, logged_at)
goals(user_id, is_active)

// 4. RLS policies on all tables
User-scoped access only

// 5. Cron job: Data retention (weekly)
Soft delete purge (30 days)
```

**Cost:** $0/month

**Timeline:** 2-3 weeks

#### Phase 2: Growth (1,000-10,000 Users)

**Goal:** Scale features, optimize performance

**Database Choice:** Supabase (Free Tier, with optimization)

**Implementation:**

```typescript
// 1. Add optional features
exercise_logs, weight_logs, daily_summaries

// 2. Optimize queries
Add composite indexes
Pre-aggregate daily summaries
Cache food database lookups

// 3. Optimize storage
Implement data retention (purge old logs)
Anonymize old analytics

// 4. Monitor performance
Vercel Analytics
Supabase Dashboard
Custom alerts (query performance > 1s)
```

**Cost:** $0/month (stay within free tier with optimization)

**Timeline:** Ongoing (as users grow)

#### Phase 3A: Scale - Stay on Supabase (10,000-50,000 Users)

**Goal:** Scale without migration

**Database Choice:** Supabase (Pro Tier - $25/mo)

**Implementation:**

```typescript
// 1. Upgrade to Pro tier
8GB database, 4GB RAM, 500K MAU

// 2. Optimize further
Add materialized views for heavy analytics
Use connection pooling (PgBouncer)
Implement Redis caching for hot data

// 3. Monitor scaling
Database size: < 7GB
Connections: < 180
Query performance: < 1s avg
```

**Cost:** $25/month

**Timeline:** Upgrade when hitting free tier limits

#### Phase 3B: Scale - Migrate to Neon (10,000-50,000 Users)

**Goal:** Reduce cost with serverless auto-scaling

**Database Choice:** Neon (Serverless Postgres)

**Implementation:**

```typescript
// 1. Migration from Supabase to Neon
Export from Supabase (pg_dump)
Import to Neon (psql)
Rebuild RLS policies (standard SQL)
Rebuild triggers/functions

// 2. Keep Supabase for Auth/Storage
Auth: Keep Supabase Auth (or migrate to Auth0)
Storage: Keep Supabase Storage (or migrate to Cloudflare R2)

// 3. Update app configuration
Change NEXT_PUBLIC_SUPABASE_URL
Keep NEXT_PUBLIC_SUPABASE_ANON_KEY (for auth/storage)

// 4. Test thoroughly
RLS policies
GDPR endpoints
Performance
```

**Migration Effort:** 2-3 weeks

**Risk:** Medium (standard SQL migration)

**Cost:** ~$10/month (vs $25/mo on Supabase)

**Timeline:** Migrate when cost exceeds benefit

#### Phase 3C: Scale - Add Local-First (10,000+ Users)

**Goal:** Offline support, reduced server load

**Database Choice:** Supabase + ElectricSQL

**Implementation:**

```typescript
// 1. Add ElectricSQL to app
npm install @electric-sql/pglite
Configure sync endpoints

// 2. Add local SQLite to app
Configure local database
Set up conflict resolution

// 3. Update Supabase schema
Add sync metadata tables
Configure ElectricSQL triggers

// 4. Test offline flows
Log food offline
Sync on reconnection
Conflict resolution
```

**Migration Effort:** 4-6 weeks

**Risk:** High (adds complexity)

**Cost:** Same as Supabase-only (server-side), but ~30% reduction in server load

**Timeline:** Add if offline support becomes critical

#### Phase 4: Enterprise (50,000+ Users)

**Goal:** Full-scale, high availability

**Database Choice:** Supabase (Team Tier - $100/mo) or Self-Hosted Postgres

**Implementation Options:**

**Option A: Supabase Team Tier**
- 32GB database, 16GB RAM, unlimited MAU
- Priority support
- Backup retention (30 days)
- **Cost:** $100/month

**Option B: Self-Hosted Postgres (AWS RDS, Google Cloud SQL)**
- Full control over scaling
- Read replicas, connection pooling
- **Cost:** ~$50-100/month (depending on size)
- **Effort:** 4-6 weeks (migration + DevOps)

**Option C: Hybrid (Supabase + Read Replicas)**
- Keep Supabase for writes
- Read replicas for analytics queries
- **Cost:** ~$125/month (Supabase Pro + Read Replica)

### 6.3 Migration Risk Assessment

#### Supabase → Neon

| Aspect | Risk | Mitigation |
|--------|------|------------|
| **Data Migration** | Low | Standard pg_dump/pg_restore |
| **RLS Policies** | Low | Copy SQL policies (standard) |
| **Triggers/Functions** | Low | Copy SQL functions (standard) |
| **Auth** | Medium | Keep Supabase Auth or migrate to Auth0 |
| **Storage** | Medium | Keep Supabase Storage or migrate to Cloudflare R2 |
| **Real-time** | Medium | Keep Supabase Real-time or build custom WebSocket layer |
| **Edge Functions** | Medium | Migrate to Vercel API routes |
| **Overall** | **Medium** | **2-3 weeks effort** |

#### Supabase → Local-First (ElectricSQL)

| Aspect | Risk | Mitigation |
|--------|------|------------|
| **Schema Changes** | Medium | Add sync metadata columns |
| **Conflict Resolution** | High | Implement "last-write-wins" or application-level resolution |
| **Device Management** | High | Track device IDs, sync tokens |
| **Offline Flows** | High | Test thoroughly, handle sync failures |
| **GDPR Compliance** | High | Implement "wipe command" for all devices |
| **Performance** | Medium | Optimize local queries, limit sync payload |
| **Bundle Size** | Low | ElectricSQL adds ~50KB |
| **Overall** | **High** | **4-6 weeks effort** |

#### Supabase → MongoDB

| Aspect | Risk | Mitigation |
|--------|------|------------|
| **Schema Redesign** | High | Relational → document (requires thought) |
| **Query Rewrites** | High | SQL → MongoDB aggregation |
| **RLS** | High | Build app-level auth (no RLS in MongoDB) |
| **GDPR Tools** | High | Build audit logging, export, delete from scratch |
| **Data Consistency** | Medium | MongoDB is eventual consistency |
| **Migration** | Medium | Use ETL tool or custom script |
| **Overall** | **High** | **4-6 weeks effort** |

#### Supabase → Firebase

| Aspect | Risk | Mitigation |
|--------|------|------------|
| **Schema Redesign** | High | SQL → NoSQL (requires thought) |
| **Query Rewrites** | Medium | SQL → Firestore queries |
| **Auth** | Low | Can keep or migrate to Firebase Auth |
| **RLS** | Medium | Firestore security rules (similar to RLS) |
| **GDPR Tools** | High | Build from scratch |
| **Migration** | Medium | Use Firebase Import/Export tools |
| **Overall** | **Medium-High** | **3-4 weeks effort** |

### 6.4 Decision Matrix

#### Stay on Supabase vs. Migrate

**Stay on Supabase if:**

- ✅ Cost is acceptable ($25/mo at 10K-50K users)
- ✅ Need fastest time-to-market
- ✅ Want simplest operations
- ✅ GDPR compliance is priority
- ✅ Team has Postgres experience
- ✅ App is web-first (not mobile-first)

**Migrate to Neon if:**

- ✅ Cost sensitivity (Neon is ~60% cheaper at scale)
- ✅ Need advanced Postgres features
- ✅ Want true serverless auto-scaling
- ✅ Need branching for development
- ✅ Comfortable with more manual operations

**Add Local-First (ElectricSQL) if:**

- ✅ Mobile-first app (native iOS/Android)
- ✅ Offline support is critical
- ✅ Target market has poor connectivity
- ✅ Privacy is top priority (data on device)
- ✅ Have experience with sync architectures

**Switch to MongoDB if:**

- ✅ Deep MongoDB experience
- ✅ Schema flexibility is critical
- ✅ Need horizontal scaling (millions of users)
- ✅ Already in MongoDB ecosystem

**Switch to Firebase if:**

- ✅ Mobile-first with native apps
- ✅ Already in Google ecosystem
- ✅ Need excellent mobile SDKs
- ✅ Push notifications are critical

---

## 7. Short Recommendation Matrix

### Database Options Summary

| Option | Speed to MVP | Cost (MVP) | Cost (10K Users) | GDPR Readiness | Mobile Support | Offline Support | Scaling Ease | Migration Risk |
|--------|-------------|------------|-----------------|----------------|----------------|-----------------|--------------|----------------|
| **Supabase/Postgres** | ⚡⚡ 1-2 weeks | 💰 Free | 💰 Free | ✅ Excellent | ⚠️ Basic | ❌ No | ✅ Good (vertical) | N/A (recommended) |
| **Neon** | ⚡ 2-3 weeks | 💰 Free | 💰 Free | ✅ Good | ⚠️ Basic | ❌ No | ✅ Excellent (serverless) | 🟡 Low-Med (2-3 weeks) |
| **Local-First (ElectricSQL)** | 🐢 4-6 weeks | 💰 Free | 💰 Free | ⚠️ Medium | ✅ Excellent | ✅ Full | ✅ Good (distributed) | 🔴 High (4-6 weeks) |
| **MongoDB Atlas** | ⚡ 2-3 weeks | 💰 Free | 💰 $9/mo | ⚠️ Low-Med | ✅ Good | ❌ No | ✅ Excellent (sharding) | 🔴 High (4-6 weeks) |
| **Firebase Firestore** | ⚡ 2-3 weeks | 💰 Free | 💰 $2/mo | ⚠️ Low-Med | ✅ Excellent | ✅ Full | ✅ Good (auto-scaling) | 🟡 Med-High (3-4 weeks) |

### Final Recommendation by Phase

| Phase | Recommended | Alternative | Trigger |
|-------|-------------|-------------|---------|
| **MVP (0-1K users)** | **Supabase/Postgres** | Neon | Validate product-market fit |
| **Growth (1K-10K users)** | **Supabase/Postgres** | Neon | Stay on free tier with optimization |
| **Scale (10K-50K users)** | **Supabase Pro ($25/mo)** | **Neon (~$10/mo)** | Migrate if cost > $25/mo |
| **Enterprise (50K+ users)** | **Supabase Team ($100/mo)** | Self-hosted Postgres | Migrate if need >32GB DB |

### Quick Decision Tree

```
Need offline support?
├─ Yes → Local-First (ElectricSQL) + Supabase for sync
└─ No → Web or online mobile?

    Web-first?
    ├─ Yes → Supabase (recommended)
    │        └─ Cost > $25/mo? → Migrate to Neon
    └─ Mobile-first?

        Native mobile apps?
        ├─ Yes → Firebase (best mobile SDKs)
        │        └─ Cost too high? → Supabase + local caching
        └─ No → Supabase (recommended)
                 └─ Need advanced Postgres? → Neon
```

### Key Takeaways

1. **Start with Supabase** - Fastest to MVP, GDPR-ready, free tier supports 5K users
2. **Stay on Supabase until cost triggers** - Upgrade to Pro ($25/mo) at 10K users
3. **Migrate to Neon for cost savings** - ~60% cheaper at 10K+ users
4. **Add Local-First for offline** - Only if offline support is critical
5. **Avoid MongoDB/Firebase for GDPR** - Build compliance from scratch
6. **Plan migrations early** - Use standard SQL, avoid vendor lock-in

---

**Next Steps:**
1. Review this document with legal counsel for GDPR classification
2. Confirm target market (EU-only or global?) to finalize region strategy
3. Set up Supabase project in EU region (eu-central-1)
4. Implement database schema with RLS policies
5. Build GDPR endpoints (export, delete, consent management)
6. Configure data retention cron job (30-day soft delete)
7. Deploy MVP and validate with users
8. Monitor usage and scale as needed

---

## Additional Option: Convex (Added 2026-02-15)

Convex is not a classic relational database-first platform like Supabase/Postgres; it is a reactive backend platform with its own data model and function runtime. It can still be a candidate for certain product styles.

### Where Convex fits well
- App experiences that benefit from instant reactive updates.
- Teams prioritizing fast feature iteration over SQL-first governance/reporting.
- Frontend-heavy products where backend complexity should stay minimal at first.

### Where Supabase/Postgres remains stronger for this project
- GDPR process clarity (RLS patterns, SQL auditing, retention jobs, export pipelines).
- Analytics/reporting depth and portability via standard SQL.
- Lower architecture surprise for long-term data governance.

### Convex vs Supabase (high-level)
| Metric | Supabase/Postgres | Convex | Suggested winner for CalorieTracker now |
|---|---|---|---|
| MVP speed | 🟢 Fast | 🟢 Fast | Tie |
| Realtime UX | 🟡 Good | 🟢 Excellent | Convex |
| GDPR governance patterns | 🟢 Strong SQL/RLS posture | 🟡 Needs explicit policy design | Supabase |
| Data portability/reporting | 🟢 Strong (SQL ecosystem) | 🟡 Medium | Supabase |
| Lock-in risk | 🟡 Medium | 🔴 Higher | Supabase |

### Practical recommendation
- **Default:** stay with Supabase/Postgres for MVP and compliance confidence.
- **Convex candidate path:** run a focused spike only if realtime UX becomes a core product differentiator.
- If Convex is piloted, keep strict acceptance gates on GDPR rights workflows before any production commitment.

