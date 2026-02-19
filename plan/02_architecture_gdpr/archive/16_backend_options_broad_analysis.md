# Backend Options — Broad Analysis (Decision-Oriented)

**Date:** 2026-02-15  
**Context:** CalorieTracker B2C app with health-adjacent data  
**Purpose:** Concise comparison of backend architectures with decision triggers

---

## Option A: Next.js Server Routes + Supabase

**Stack:** Next.js 16 (App Router, Server Actions/API Routes) + Supabase (PostgreSQL, Auth, Storage, Real-time)  
**Hosting:** Vercel (EU) + Supabase (EU region)

### Pros/Cons Summary

| Criteria | Rating | Notes |
|----------|--------|-------|
| **Complexity** | 🟢 Low | Single codebase, built-in auth/db, minimal ops |
| **Speed** | 🟢 Very Fast | 1-2 weeks to MVP, proven in PdfExtractorAi |
| **Cost** | 🟢 Low | Free tiers handle early growth, scales predictably |
| **Maintainability** | 🟢 Good | Monorepo, TypeScript, shared models |
| **Observability** | 🟡 Medium | Vercel Analytics + Supabase dashboard |
| **Compliance Control** | 🟢 Good | RLS built-in, EU regions, audit triggers |

### Strengths
- Fastest validation path
- Strong GDPR foundation (RLS, EU hosting)
- Proven pattern from PdfExtractorAi
- Minimal DevOps overhead

### Weaknesses
- Vendor lock-in (Vercel + Supabase)
- Cold starts on serverless
- Complex queries may need stored procedures

---

## Option B: Separate Backend Service (NestJS/Fastify/.NET) + Web Frontend

**Stack:** Next.js frontend + dedicated backend (NestJS/Fastify/.NET) + Supabase (database only)  
**Hosting:** Vercel (frontend) + Render/Railway/VPS (backend)

### Pros/Cons Summary

| Criteria | Rating | Notes |
|----------|--------|-------|
| **Complexity** | 🟡 Medium-High | Two codebases, two deployments, API versioning |
| **Speed** | 🟡 Medium | 2-4 weeks to MVP, more boilerplate |
| **Cost** | 🟡 Medium | Backend hosting + frontend ($5-50/mo) |
| **Maintainability** | 🟡 Medium | Clean separation but more moving parts |
| **Observability** | 🟢 Good | Full control over monitoring stack |
| **Compliance Control** | 🟢 Excellent | Full control over data residency, audit logging |

### Strengths
- Independent scaling of services
- Better for complex business logic
- Long-running processes (jobs, queues)
- Future-proof architecture

### Weaknesses
- Slower to market
- More infrastructure to manage
- Overkill for early validation
- API layer adds latency

---

## Option C: Local-First Development Backend → Cloud Migration

**Stack:** Local SQLite/PostgreSQL + local auth → migrate to Supabase/Postgres later  
**Development:** Docker or Turso for local persistence, sync logic deferred

### Pros/Cons Summary

| Criteria | Rating | Notes |
|----------|--------|-------|
| **Complexity** | 🟡 Medium | Migration strategy adds complexity |
| **Speed** | 🟡 Medium | Fast initial dev, migration overhead later |
| **Cost** | 🟢 Low | Local dev is free, cloud costs deferred |
| **Maintainability** | 🟡 Medium | Risk of migration pain points |
| **Observability** | 🔴 Poor initially | Local monitoring limited |
| **Compliance Control** | 🟡 Medium | Cloud migration needs GDPR audit trail |

### Strengths
- Zero cloud costs during development
- Works offline
- Fast iteration without network latency
- Can defer cloud decisions until needed

### Weaknesses
- Migration is non-trivial (schema sync, auth migration)
- Harder to test multi-user scenarios
- Real-time sync complexity
- May delay GDPR compliance validation

### When This Makes Sense
- Solo developer working on UI/experience first
- Uncertain about cloud provider choice
- Want to defer infrastructure costs until validation

---

## Option D: BaaS-Heavy Approach (Supabase-Heavy, Minimal Custom Backend)

**Stack:** Thin Next.js frontend + Supabase Edge Functions + PostgreSQL functions/triggers  
**Hosting:** Supabase (EU) + minimal Vercel deployment

### Pros/Cons Summary

| Criteria | Rating | Notes |
|----------|--------|-------|
| **Complexity** | 🟢 Low (initially) | Single platform, but SQL complexity grows |
| **Speed** | 🟢 Very Fast | ~1 week to MVP |
| **Cost** | 🟢 Low | Supabase free tier dominates |
| **Maintainability** | 🟡 Medium | Business logic in SQL = harder for JS devs |
| **Observability** | 🟡 Medium | Supabase dashboard good, edge functions harder to debug |
| **Compliance Control** | 🟢 Good | All data in EU, RLS at DB level |

### Strengths
- Fastest to market
- Single platform management
- Strong data security (RLS at DB level)
- Real-time built-in

### Weaknesses
- Business logic in SQL (learning curve)
- Testing DB functions is harder
- Debugging edge functions
- Vendor lock-in
- Harder to migrate away

---

## Comparative Summary

### Speed to Market (Fastest → Slowest)
1. **D: BaaS-Heavy** (~1 week)
2. **A: Next.js + Supabase** (1-2 weeks)
3. **C: Local-First** (2-3 weeks + migration later)
4. **B: Separate Backend** (2-4 weeks)

### Cost at MVP (Lowest → Highest)
1. **D: BaaS-Heavy** (free tiers)
2. **A: Next.js + Supabase** (free tiers)
3. **C: Local-First** (free now, pay later)
4. **B: Separate Backend** ($5-50/mo)

### Scalability Ceiling (Lowest → Highest)
1. **D: BaaS-Heavy** (limited by Supabase constraints)
2. **A: Next.js + Supabase** (good with optimization)
3. **C: Local-First** (depends on migration path)
4. **B: Separate Backend** (unlimited with effort)

### Compliance Control (Best → Worst)
1. **B: Separate Backend** (full control)
2. **A: Next.js + Supabase** (strong RLS, EU regions)
3. **D: BaaS-Heavy** (strong RLS, but SQL complexity)
4. **C: Local-First** (deferred validation risk)

---

## Recommendations by Phase

### MVP Phase (Days 1–90)

**Primary Recommendation: Option A (Next.js + Supabase)**

**Why:**
- Fastest to validate with users
- Free tiers handle early growth
- Proven GDPR patterns from PdfExtractorAi
- Clean evolution path to Option B if needed
- Low operational overhead

**Secondary Choice: Option D (BaaS-Heavy)**

**When to choose D over A:**
- App is straightforward (no complex business logic)
- You're comfortable with PostgreSQL functions
- Want maximum speed over flexibility
- Willing to accept SQL-based business logic

**When to consider Option C (Local-First):**
- Solo dev, uncertain about product direction
- Want to defer cloud costs until post-validation
- Primary focus on UX/experimentation
- Accepting migration overhead later

**Avoid Option B in MVP** unless:
- You have complex business logic requirements upfront
- Need background jobs/cron from day one
- Planning to scale immediately (enterprise customers)

---

### Post-MVP Phase (Months 3–12)

**If MVP succeeds and growth validates:**

**Migrate to Option B (Separate Backend)**

**Why:**
- Independent scaling of services
- Add analytics/reporting backend
- Background jobs for notifications, data aggregation
- ML/AI inference pipelines
- Better team collaboration (if growing)

**Migration Triggers:**
- >10K active users
- Response time degradation (>500ms p95)
- Need for complex analytics
- Adding team members
- Compliance audits requiring more control

**Stay on Option A if:**
- Growth is steady but manageable
- No complex business logic needed
- Solo dev maintaining control
- Cost efficiency is priority

---

### Scale-Up Phase (12+ Months)

**Recommended: Option B (Separate Backend)**

**Architecture refinements:**
- Microservices per domain (auth, nutrition, analytics, notifications)
- Separate read/write databases
- Caching layer (Redis)
- Message queue (RabbitMQ/SQS)
- Dedicated ML service for food recognition

**Alternative: Hybrid Evolution**
- Keep Next.js frontend
- Migrate hot paths to dedicated backend services
- Supabase remains as database/auth layer
- Gradual migration, not big bang

---

## Decision Criteria & Triggers

### Criteria for Choosing Initial Architecture

| Criterion | Weight | Notes |
|-----------|--------|-------|
| Time to market | 30% | Validation speed |
| Cost efficiency | 20% | Free tiers, predictable scaling |
| Compliance readiness | 25% | GDPR, data residency |
| Technical risk | 15% | Proven patterns vs unknowns |
| Team capacity | 10% | Solo dev vs team |

**Score Example for CalorieTracker:**
- Option A: 8.5/10 (highest)
- Option D: 8.0/10
- Option C: 7.0/10
- Option B: 6.5/10

### Triggers to Switch Architecture

**From Option A → Option B:**
- ❌ **Trigger:** Response time >500ms p95 for core flows
- ❌ **Trigger:** Need for background jobs (notifications, aggregation)
- ❌ **Trigger:** Complex analytics requiring read replicas
- ❌ **Trigger:** Adding ML/AI inference pipelines
- ❌ **Trigger:** Team size >2 developers

**From Option D → Option A:**
- ❌ **Trigger:** SQL business logic becomes unmaintainable
- ❌ **Trigger:** Need for extensive server-side logic
- ❌ **Trigger:** Testing pain points slowing development
- ❌ **Trigger:** Debugging edge functions is blocking

**From Option C → Option A/B:**
- ❌ **Trigger:** MVP validated, ready for multi-user testing
- ❌ **Trigger:** Need real-time sync across devices
- ❌ **Trigger:** GDPR compliance requires cloud infrastructure
- ❌ **Trigger:** User growth >1K DAUs

---

## Migration Complexity Matrix

| From | To Option A | To Option B | To Option C | To Option D |
|------|-------------|-------------|-------------|-------------|
| **Option A** | — | 🟡 Medium | 🔴 Hard | 🟢 Easy |
| **Option B** | 🟡 Medium | — | 🔴 Hard | 🔴 Very Hard |
| **Option C** | 🟡 Medium | 🟡 Medium | — | 🟡 Medium |
| **Option D** | 🟢 Easy | 🟡 Medium | 🔴 Hard | — |

**Key:** 🟢 Easy (1-2 weeks), 🟡 Medium (1-2 months), 🔴 Hard (3+ months)

---

## Final Recommendation

### Start Here: Option A (Next.js + Supabase)

**Rationale:**
1. **Validation first:** Don't over-engineer before proving product-market fit
2. **GDPR-ready:** Strong foundation from PdfExtractorAi experience
3. **Evolution-friendly:** Clean paths to Option B or Option D
4. **Low risk:** Proven stack, minimal ops, free tiers

### Defer Complexity Until Validated

- **Option B:** Wait until you have users and need scale
- **Option C:** Only if you're uncertain about product direction
- **Option D:** Consider if you're a SQL expert and need speed

### Architecture Decision Flow

```
Start: Do we need fast validation?
├─ Yes → Option A (Next.js + Supabase)
│   └─ After validation: Growing fast?
│       ├─ Yes → Migrate to Option B
│       └─ No → Stay on Option A
│
└─ No (complex logic from day 1) → Option B (Separate Backend)
    └─ Or Option D if BaaS-heavy is acceptable
```

---

## Notes from Existing Research

From `06_backend_architecture_options.md`:
- PdfExtractorAi validated Option A for B2C app with personal data
- Supabase EU regions + RLS = strong GDPR baseline
- Migration to Option B is incremental, not big bang

From `14_final_planning_brief_for_execution.md`:
- 30-day gated plan assumes Option A as baseline
- Legal validation required before any architecture commits
- Deterministic nutrition pipeline needed (not LLM-only)

---

**Decision Point:** Proceed with Option A for MVP, validate within 30-day gated plan, defer Option B until post-validation growth triggers.

---

## Option E: Convex-First Backend (Added 2026-02-15)

**Stack:** Next.js frontend + Convex backend (functions, reactive queries, auth integration) + optional external SQL/analytics store for long-term reporting.

### Why consider Convex
- Very fast iteration for product features that need real-time/reactive UI.
- Strong developer ergonomics for app-style backends (queries/mutations/actions model).
- Good fit for collaborative/live state patterns.

### Tradeoffs vs Option A (Next.js + Supabase)
- **Pros**
  - Faster frontend-backend loop for reactive features.
  - Simpler mental model for live updates than custom polling/sync.
- **Cons**
  - Smaller ecosystem than Postgres-first stacks for analytics/compliance-heavy workloads.
  - More vendor coupling at application logic layer.
  - GDPR/data-governance workflows may need extra explicit design compared to SQL+RLS patterns.

### Rating (relative to current needs)
| Dimension | Option E (Convex) | Notes |
|---|---|---|
| Complexity | 🟡 Medium | Easy to start, but architectural lock-in risk |
| Speed to MVP | 🟢 High | Excellent for rapid app iteration |
| Cost predictability | 🟡 Medium | Depends on usage shape and realtime load |
| Maintainability | 🟡 Medium | Good DX, but fewer standard SQL ops patterns |
| Observability | 🟡 Medium | Adequate, still maturing compared to mature SQL stack tooling |
| Compliance control | 🟡/🔴 Medium-Low | Requires explicit governance design for GDPR workflows |

### Recommendation for CalorieTracker
- Keep **Option A (Next.js + Supabase)** as primary MVP path.
- Consider **Option E (Convex)** if product direction strongly prioritizes realtime-first UX and rapid UI iteration over SQL-first governance simplicity.
- If piloting Convex, run a constrained spike first (1-2 weeks) with explicit GDPR workflow checklist.

### Decision trigger to choose Convex
Choose Convex only if all are true:
1. Realtime/reactive UX is core differentiator (not optional).
2. Team accepts higher backend lock-in risk.
3. Compliance workflows are designed and tested explicitly (export/delete/retention/audit).

