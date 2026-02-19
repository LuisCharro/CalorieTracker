# Backend Architecture Options for CalorieTracker

**Date:** 2026-02-15
**Context:** B2C calorie/food logging app with health-related personal data
**Status:** Research phase - no implementation yet

---

## Executive Summary

After analyzing PdfExtractorAi's architecture and considering CalorieTracker's specific requirements (health-related data, potential long-term user engagement, B2C focus), we have four main architectural approaches. Each has different tradeoffs in speed, cost, scalability, maintainability, and observability.

---

## Architecture Options

### Option A: Supabase-First with Next.js API Routes

**Description:** Full-stack Next.js 16 with App Router, Supabase for all backend services (database, auth, real-time, storage), API routes for server logic.

**Stack:**
- Next.js 16 (App Router)
- Supabase (PostgreSQL, Auth, Storage, Real-time)
- Vercel for hosting (EU regions preferred)
- Server Actions for mutations
- API routes for complex queries/integrations

**Tradeoffs:**

| Criteria | Assessment | Notes |
|----------|-----------|-------|
| **Speed** | ⚡ Fast | 1-2 weeks to MVP. No separate backend to build. |
| **Cost** | 💰 Low-Medium | Vercel free tier + Supabase free tier. Scales with usage. |
| **Scalability** | 📊 Medium | Can handle 10K-100K users. May need optimization beyond. |
| **Maintainability** | ✅ Good | Monorepo, single codebase. Easier for solo dev. |
| **Observability** | 🔍 Medium | Vercel Analytics + Supabase dashboard. May need external tools. |

**Pros:**
- Fastest to market
- Free tiers handle early growth
- Built-in auth, real-time, storage
- Proven in PdfExtractorAi
- Strong RLS support for data security

**Cons:**
- Vendor lock-in with Supabase/Vercel
- Complex queries may need stored procedures
- Limited customization compared to custom backend
- Cold starts on Vercel serverless

**GDPR Impact:**
- ✅ Supabase EU regions available (like PdfExtractorAi)
- ✅ RLS provides strong data isolation
- ✅ Built-in audit logging via triggers
- ⚠️ Need to configure EU routing (Vercel + Supabase)
- ⚠️ AI integrations (if any) need EU routing

**Operational Complexity:**
- Low to Medium
- Single platform to monitor (Supabase + Vercel)
- Environment variables in one place
- Deploy via git push to Vercel

---

### Option B: Hybrid - Next.js + Separate Node.js Backend

**Description:** Next.js frontend with dedicated Node.js backend (Express or Fastify) for business logic, Supabase for database/auth.

**Stack:**
- Next.js 16 (frontend + API routes)
- Node.js + Express/Fastify (backend service)
- Supabase (PostgreSQL, Auth only)
- Vercel for frontend, VPS/Render/Railway for backend
- REST API between frontend and backend

**Tradeoffs:**

| Criteria | Assessment | Notes |
|----------|-----------|-------|
| **Speed** | 🐢 Medium | 2-4 weeks to MVP. Need to build and deploy backend. |
| **Cost** | 💰💰 Medium | Vercel free + backend hosting ($5-20/mo). More infrastructure. |
| **Scalability** | 📊 High | Can scale backend independently. Better for complex logic. |
| **Maintainability** | ⚠️ Medium | Two codebases, two deployments. More moving parts. |
| **Observability** | 🔍 Good | More flexibility with monitoring tools. |

**Pros:**
- Separation of concerns (frontend vs backend)
- Better control over long-running processes
- Easier to add background jobs (cron, queues)
- Can use different hosting per service
- More flexibility with business logic

**Cons:**
- Slower to build and deploy
- Two infrastructure stacks to manage
- More deployment complexity
- May be overkill for early-stage MVP
- API layer adds latency

**GDPR Impact:**
- ✅ Can route EU traffic to EU backend instances
- ✅ More control over data residency
- ⚠️ Need to secure inter-service communication
- ⚠️ More components to audit

**Operational Complexity:**
- Medium to High
- Two deployments to coordinate
- Need API versioning strategy
- More monitoring endpoints
- Network latency between services

---

### Option C: BaaS-Only - Supabase Heavy

**Description:** Minimal Next.js frontend, almost all logic in Supabase (Edge Functions, Database Functions, RLS, Triggers).

**Stack:**
- Next.js 16 (thin frontend layer)
- Supabase (everything: database, auth, edge functions, storage)
- PostgreSQL functions/triggers for business logic
- RLS for all authorization
- Supabase dashboard for management

**Tradeoffs:**

| Criteria | Assessment | Notes |
|----------|-----------|-------|
| **Speed** | ⚡⚡ Very Fast | 1 week to MVP. Most logic in SQL/Edge Functions. |
| **Cost** | 💰 Low | Supabase free tier + minimal Vercel usage. |
| **Scalability** | 📊 Medium | Good for simple apps. Complex logic gets messy in SQL. |
| **Maintainability** | ⚠️ Medium | Business logic in SQL can be hard to debug. |
| **Observability** | 🔍 Good | Supabase provides good built-in tools. |

**Pros:**
- Fastest to build
- Single platform (Supabase)
- Great for data-centric apps
- Strong RLS enforcement at DB level
- Real-time out of the box

**Cons:**
- Business logic in SQL (harder for JS devs)
- Limited testing for DB functions
- Debugging edge functions is harder
- Vendor lock-in
- Harder to migrate away later

**GDPR Impact:**
- ✅ All data in Supabase EU regions
- ✅ Strong RLS at database level
- ✅ Built-in audit via triggers
- ⚠️ Edge functions may route globally (need config)

**Operational Complexity:**
- Low (initially)
- Single platform
- Dashboard-driven management
- ⚠️ SQL expertise required for logic changes

---

### Option D: Traditional Monolith - NestJS/Fastify + Database

**Description:** Traditional backend-first approach with Node.js framework, custom auth, database-agnostic design.

**Stack:**
- NestJS or Fastify (backend)
- Next.js 16 (frontend as SPA)
- PostgreSQL/MySQL/SQLite (database)
- Custom auth or Passport.js
- Render/Railway/VPS for hosting
- REST or GraphQL API

**Tradeoffs:**

| Criteria | Assessment | Notes |
|----------|-----------|-------|
| **Speed** | 🐢🐢 Slow | 4-6 weeks to MVP. Build auth, DB layer, API from scratch. |
| **Cost** | 💰💰💰 High | Backend hosting ($10-50/mo) + frontend. |
| **Scalability** | 📊📊 Very High | Full control over scaling, caching, architecture. |
| **Maintainability** | ✅ Good | Clean separation, TypeScript, structured code. |
| **Observability** | 🔍🔍 Excellent | Full control over monitoring, logging, tracing. |

**Pros:**
- Full control over stack
- Easy to swap components
- Great for complex business logic
- Better for team collaboration
- Vendor-independent

**Cons:**
- Slowest to build
- Need to implement auth, RBAC, etc.
- More boilerplate
- Higher infrastructure cost
- Overkill for simple apps

**GDPR Impact:**
- ✅ Full control over data residency
- ✅ Can implement custom audit logging
- ✅ Easy to add compliance features
- ⚠️ Need to build everything from scratch

**Operational Complexity:**
- High
- Need to manage full stack
- More infrastructure decisions
- Need observability stack (logs, metrics, tracing)
- More DevOps overhead

---

## Comparison Summary

### Speed to MVP (Fastest → Slowest)
1. **C: BaaS-Only** - ~1 week
2. **A: Supabase-First** - ~1-2 weeks
3. **B: Hybrid** - ~2-4 weeks
4. **D: Traditional** - ~4-6 weeks

### Cost (Lowest → Highest)
1. **C: BaaS-Only** - Free tiers dominate
2. **A: Supabase-First** - Free tiers, scales predictably
3. **B: Hybrid** - Backend hosting added
4. **D: Traditional** - Full infrastructure cost

### Scalability Potential (Lowest → Highest)
1. **C: BaaS-Only** - Limited by Supabase constraints
2. **A: Supabase-First** - Good with optimization
3. **B: Hybrid** - Independent scaling
4. **D: Traditional** - Unlimited (with effort)

### Maintainability for Solo Dev (Best → Worst)
1. **A: Supabase-First** - Single codebase, proven patterns
2. **C: BaaS-Only** - Single platform but SQL complexity
3. **B: Hybrid** - Two codebases
4. **D: Traditional** - More boilerplate

### GDPR Compliance Ease (Easiest → Hardest)
1. **A/C: Supabase options** - Built-in tools, RLS, EU regions
2. **B: Hybrid** - Good control, more components
3. **D: Traditional** - Build everything from scratch

---

## Key Decision Factors for CalorieTracker

### App-Specific Considerations

**Data Characteristics:**
- Health-related data (food logs, calories, potentially weight/health metrics)
- Potentially sensitive (users may consider it personal health data)
- Long-term user engagement (daily logging over months/years)
- Analytics/reporting features likely needed

**User Patterns:**
- B2C consumer app
- Mobile-first likely (web + mobile web or native app)
- Daily active users (logging food throughout day)
- Social features possible (sharing progress, recipes)

**Technical Requirements:**
- Real-time sync across devices (mobile + web)
- Offline capability (logging while offline)
- Push notifications (reminders, social)
- Analytics (personal stats, trends)
- Potentially ML/AI for food recognition or recommendations

### Critical Success Factors

1. **Time to market** - Need to validate quickly
2. **User experience** - Fast, responsive, offline-capable
3. **Privacy trust** - Health data requires strong security posture
4. **Scalability** - Potential for viral growth
5. **Developer velocity** - Solo dev or small team

---

## Recommendations

### For MVP/Validation Phase

**Recommended: Option A - Supabase-First with Next.js**

**Why:**
- Fastest to validate with users
- Free tiers handle early growth
- Proven patterns from PdfExtractorAi
- Strong GDPR foundation already tested
- Good balance of control vs speed
- Easy to evolve to hybrid if needed

**Mitigation of Cons:**
- Vendor lock-in: Build abstraction layers (e.g., repository pattern)
- Cold starts: Use edge functions where possible, cache aggressively
- Complex queries: Use Supabase stored procedures for heavy lifting

### For Growth Phase (Post-Validation)

**Evolution Path:**
- If app succeeds → **Option B - Hybrid**
- Add dedicated backend for:
  - Heavy analytics/reporting
  - Background jobs (notifications, data aggregation)
  - ML/AI inference pipelines
  - Complex business rules

**Why defer:**
- Don't over-engineer before validation
- Save complexity for when you have users
- Learn from real usage patterns

### Alternative Consideration

**If App is Simple/Commodity Market:**
- Consider **Option C - BaaS-Only**
- Even faster to market
- Lower cost
- OK if app is straightforward (food logging without complex features)

---

## Migration Paths

### From Option A → Option B
- Extract API routes to separate service
- Keep Next.js for frontend
- Gradually move logic to backend
- Supabase remains database/auth layer
- Minimal code changes (API calls remain same)

### From Option C → Option A
- Add Next.js API routes
- Move logic from Edge Functions to API routes
- Easier testing and debugging
- Frontend becomes richer

### From Any Option → Option D
- Extract database access (repository pattern)
- Build new backend service
- Migrate auth to new system (or keep Supabase)
- Gradual cutover per feature

---

## Final Thoughts

For CalorieTracker's B2C context and health-related data:

**Start with Option A (Supabase-First)** for these reasons:
1. Validated by PdfExtractorAi's success
2. Strong GDPR foundation (RLS, EU regions, audit logging)
3. Fastest to market while maintaining quality
4. Free tiers reduce risk
5. Clean evolution path to hybrid if needed

**Defer complexity until validation proves demand:**
- Don't build separate backend until you have users
- Don't over-optimize for scale prematurely
- Use Supabase's features to stay lean

**Critical for health data:**
- Implement RLS from day 1
- Configure EU routing (Vercel + Supabase)
- Build audit logging (reuse PdfExtractorAi patterns)
- Clear privacy policies and consent flows

---

## What We Can Decide Now vs. Needs Legal Review

### Can Decide Now
- ✅ Use Option A (Supabase-First + Next.js) for MVP
- ✅ Configure Supabase in EU region
- ✅ Configure Vercel for EU-first routing
- ✅ Implement RLS policies for all user data
- ✅ Reuse PdfExtractorAi's consent management patterns
- ✅ Build audit logging from day 1

### Needs Legal Review
- ⚠️ Classification of food/calorie data as "health data" under GDPR
- ⚠️ Required consent types (explicit consent for health data?)
- ⚠️ Data retention periods (how long to keep logs, analytics)
- ⚠️ Whether app requires "Data Protection by Design" certification
- ⚠️ AI/ML features (if any) - data processing implications
- ⚠️ Age restrictions (health apps may have stricter requirements)
- ⚠️ Third-party food database APIs (Nutritionix, USDA, etc.) - data flows

---

**Next Steps:**
1. Review this with legal counsel for GDPR classification
2. Confirm AI/ML plans (food recognition, recommendations)
3. Define target market (EU-only initially or global?)
4. Review 07_gdpr_for_calorietracker.md for detailed requirements
5. Review 08_reuse_from_pdfextractorai.md for reusable patterns
6. Use 09_recommended_stack_and_controls.md for implementation guidance
7. Follow 10_implementation_readiness_checklist.md before starting
