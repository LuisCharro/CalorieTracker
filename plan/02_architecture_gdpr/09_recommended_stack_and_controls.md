# Recommended Stack & Controls for CalorieTracker

**Date:** 2026-02-15
**Architecture Choice:** Option A - Supabase-First with Next.js
**Based On:** Analysis of PdfExtractorAi patterns + CalorieTracker requirements

---

## Executive Summary

For CalorieTracker's MVP, we recommend **Option A (Supabase-First with Next.js)** for fastest time-to-market while maintaining strong GDPR compliance. This stack is proven in PdfExtractorAi, provides free-tier cost efficiency, and has clear evolution paths to hybrid if needed. Below is the complete technology stack, implementation controls, and operational guidance.

---

## Recommended Tech Stack

### Frontend

| Component | Choice | Version | Rationale |
|-----------|--------|---------|-----------|
| **Framework** | Next.js | 16 (App Router) | Proven in PdfExtractorAi, great DX, Vercel native |
| **UI Library** | React | 19 | Latest stable, good performance |
| **Styling** | Tailwind CSS | 3.4+ | Rapid development, consistent with PdfExtractorAi |
| **Components** | shadcn/ui | Latest | Copy from PdfExtractorAi, save time |
| **Forms** | React Hook Form + Zod | Latest | Validation, type-safe |
| **Icons** | Lucide React | Latest | Consistent with PdfExtractorAi |

### Backend & Database

| Component | Choice | Version | Rationale |
|-----------|--------|---------|-----------|
| **Database** | Supabase (PostgreSQL) | Latest | EU regions, RLS, auth, real-time |
| **ORM/Query Builder** | Supabase Client | @supabase/supabase-js | Direct client, proven patterns |
| **Server Logic** | Next.js API Routes + Server Actions | - | Monorepo, simple deployment |
| **Migrations** | Supabase CLI | Latest | Copy migration patterns from PdfExtractorAi |
| **RLS** | Supabase RLS | - | Proven security model |

### Authentication & Authorization

| Component | Choice | Version | Rationale |
|-----------|--------|---------|-----------|
| **Auth Provider** | Supabase Auth | Latest | Email/password, OAuth (Google, Apple, Microsoft) |
| **Session Management** | Supabase SSR | @supabase/ssr | Copy from PdfExtractorAi lib/session/ |
| **JWT Management** | Supabase Built-in | - | No custom JWT handling needed |
| **Authorization** | RLS Policies | - | User-scoped queries, proven in PdfExtractorAi |

### Email & Notifications

| Component | Choice | Version | Rationale |
|-----------|--------|---------|-----------|
| **Transactional Email** | Resend | Latest | EU region, SMTP via Supabase Auth |
| **Email Templates** | Custom (Resend) | - | Copy/adapt from PdfExtractorAi email-templates/ |
| **Push Notifications** | Web Push API | - | Future feature (post-MVP) |

### Hosting & Deployment

| Component | Choice | Version | Rationale |
|-----------|--------|---------|-----------|
| **Frontend Hosting** | Vercel | Latest | Native Next.js, EU functions, free tier |
| **Database Hosting** | Supabase | Latest | EU regions, free tier, proven in PdfExtractorAi |
| **CDN** | Vercel Edge Network | - | Global, fast, included |
| **Environment Variables** | Vercel Dashboard | - | Secure, per-environment |
| **CI/CD** | Vercel Git Integration | - | Auto-deploy on push |

### Monitoring & Observability

| Component | Choice | Version | Rationale |
|-----------|--------|---------|-----------|
| **Application Monitoring** | Vercel Analytics | Latest | Free, included, privacy-friendly |
| **Error Tracking** | Vercel Logs + Custom | - | Free tier sufficient for MVP |
| **Database Monitoring** | Supabase Dashboard | Latest | Built-in, good for free tier |
| **Security Events** | Custom (security_events table) | - | Copy from PdfExtractorAi |
| **Performance** | Vercel Speed Insights | Latest | Free, included |

### External APIs (Optional)

| Component | Choice | Version | Rationale |
|-----------|--------|---------|-----------|
| **Food Database** | Nutritionix API | v2 | Good free tier, EU endpoints |
| **Alternative** | USDA FoodData Central | v2 | Free, US-based (consider EU alternatives) |
| **Barcode** | Open Food Facts API | v2 | Free, global, EU-friendly |
| **AI Vision** (future) | Google Vision AI | - | If adding photo food recognition |

### Development Tools

| Component | Choice | Version | Rationale |
|-----------|--------|---------|-----------|
| **Language** | TypeScript | 5+ | Type safety, copy from PdfExtractorAi |
| **Package Manager** | npm | Latest | Consistent with PdfExtractorAi |
| **Linting** | ESLint | Latest | Next.js config |
| **Testing** | Jest + Playwright | Latest | Copy test patterns from PdfExtractorAi |
| **Git** | GitHub | - | Version control, collaboration |

---

## Implementation Controls

### 1. Database Schema Controls

**Required Tables (MVP):**

```sql
-- Core tables (copy/adapt from PdfExtractorAi)
users                          -- User profiles
food_logs                      -- Daily food entries
exercise_logs                  -- Optional: exercise tracking
goals                          -- User goals (calories, macros)

-- GDPR tables (copy from PdfExtractorAi)
consent_history                -- Immutable consent audit
processing_activities          -- Article 30 compliance
security_events                -- Incident logging
gdpr_requests                  -- Data subject requests (optional)

-- Food database (new)
food_database_cache           -- Cached API results
```

**RLS Policy Template:**

```sql
-- Enable RLS on all user tables
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

-- User can only see their own data
CREATE POLICY "Users can view own food logs"
ON food_logs FOR SELECT
USING (user_id = auth.uid());

-- User can only insert their own data
CREATE POLICY "Users can insert own food logs"
ON food_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

-- User can only update their own data
CREATE POLICY "Users can update own food logs"
ON food_logs FOR UPDATE
USING (user_id = auth.uid());

-- User can only delete their own data
CREATE POLICY "Users can delete own food logs"
ON food_logs FOR DELETE
USING (user_id = auth.uid());

-- Service role bypass for admin operations
CREATE POLICY "Service role full access"
ON food_logs FOR ALL
USING (auth.role() = 'service_role');
```

**Control Checklist:**
- [ ] Enable RLS on ALL user-facing tables
- [ ] Every table has user_id column (except system tables)
- [ ] Every table has user-scoped RLS policies
- [ ] Service role bypass for admin operations
- [ ] Test RLS with different user sessions
- [ ] No anon access to user data (unless explicitly needed)

---

### 2. GDPR Compliance Controls

**Required API Endpoints (Copy from PdfExtractorAi):**

```
/api/gdpr/export              -- Article 15 (Access) + Article 20 (Portability)
/api/gdpr/delete              -- Article 17 (Erasure)
/api/gdpr/consent-history     -- Consent audit trail
/api/gdpr/processing-activities -- Article 30 (Record of processing)
/api/gdpr/rights              -- Article 18 (Restriction) + Article 21 (Objection)
/api/cron/data-retention      -- Automated cleanup (cron job)
```

**Required UI Components:**

```
/app/privacy/page.tsx          -- Privacy page with GDPR actions
/components/consent/*          -- Consent banner, management
/components/gdpr/*             -- GDPR badges, export buttons
```

**Control Checklist:**
- [ ] All 6 GDPR rights implemented (access, rectify, erase, restrict, port, object)
- [ ] Export endpoint returns complete user data (JSON format)
- [ ] Delete endpoint removes all user data (30-day soft delete)
- [ ] Consent history is immutable and complete
- [ ] Processing activities logged for all data operations
- [ ] Security events logged for auth, API calls, errors
- [ ] Data retention cron job configured (daily/weekly)
- [ ] Privacy page functional and tested
- [ ] Consent management UI functional and tested

---

### 3. Authentication Controls

**Required Auth Features:**

```
✅ Email/password sign-up and sign-in
✅ Email verification (via Supabase Auth)
✅ Password reset (via Supabase Auth)
✅ OAuth providers (Google, Apple, Microsoft)
✅ JWT token management (Supabase handles)
✅ Session management (Supabase SSR)
✅ Account deletion (GDPR-compliant)
```

**Control Checklist:**
- [ ] Email verification required for new accounts
- [ ] Password reset flow tested end-to-end
- [ ] OAuth providers configured and tested
- [ ] Session tokens expire appropriately (1 hour refresh)
- [ ] Account deletion removes auth user AND public user data
- [ ] Service role key never exposed to client
- [ ] Anon key only for public/anonymous operations

---

### 4. Security Controls

**Required Security Measures:**

```
✅ HTTPS/TLS for all connections (Vercel default)
✅ Secure cookies (HttpOnly, SameSite, Secure)
✅ Input validation on all API endpoints
✅ SQL injection prevention (Supabase RLS + parameterized queries)
✅ XSS prevention (React default + CSP headers)
✅ Rate limiting on API endpoints
✅ Security event logging
✅ Environment variables for secrets
```

**Security Headers (Next.js config):**

```javascript
// next.config.mjs
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

// Add to headers in next.config.mjs
```

**Control Checklist:**
- [ ] HTTPS enforced (Vercel default)
- [ ] Secure cookies configured
- [ ] Input validation on all endpoints (Zod schemas)
- [ ] Rate limiting implemented (Vercel or custom middleware)
- [ ] Security events logged (auth failures, API errors)
- [ ] No stack traces in error responses
- [ ] Environment variables never in client code
- [ ] Security headers configured
- [ ] Regular dependency updates

---

### 5. Data Residency Controls

**EU Routing Configuration:**

```typescript
// next.config.mjs - Export region preference
export const preferredRegion = ['fra1', 'dub1']; // Frankfurt/Dublin

// Geolocation detection (copy from PdfExtractorAi)
// lib/compliance/geolocation/detect-region.ts
```

**Supabase Configuration:**
- [ ] Create Supabase project in EU region (`eu-central-1` or `eu-central-2`)
- [ ] Verify region via `supabase projects list`
- [ ] Document region in privacy policy

**Vercel Configuration:**
- [ ] Set Vercel project to EU functions (preferredRegion)
- [ ] Verify with `x-vercel-id` header (should show `fra1` or `dub1`)
- [ ] Document compute region in privacy policy

**Control Checklist:**
- [ ] Supabase in EU region verified
- [ ] Vercel functions in EU region configured
- [ ] Geolocation detection implemented
- [ ] EU routing documented in privacy policy
- [ ] Cross-border transfers documented with safeguards

---

### 6. API Endpoint Controls

**API Route Structure:**

```
/api/auth/*                    -- Authentication endpoints
/api/gdpr/*                    -- GDPR rights endpoints
/api/food/*                    -- Food logging endpoints
/api/stats/*                   -- Analytics endpoints
/api/admin/*                   -- Admin endpoints (protected)
/api/cron/*                    -- Cron jobs (protected with CRON_SECRET)
```

**API Route Template:**

```typescript
// app/api/food/log/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Input validation
const logSchema = z.object({
  food_name: z.string().min(1),
  quantity: z.number().positive(),
  calories: z.number().nonnegative(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional()
})

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate input
    const body = await request.json()
    const validatedData = logSchema.parse(body)

    // Insert into database (RLS enforces user ownership)
    const { data, error } = await supabase
      .from('food_logs')
      .insert({
        user_id: user.id,
        ...validatedData,
        logged_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    // Log processing activity
    await supabase.from('processing_activities').insert({
      user_id: user.id,
      activity_type: 'food_log_created',
      metadata: { food_log_id: data.id }
    })

    return Response.json({ data })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Food log error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Control Checklist:**
- [ ] All routes have auth check (except public routes)
- [ ] All routes have input validation (Zod schemas)
- [ ] All routes have error handling
- [ ] All routes log processing activities
- [ ] Admin routes have additional role checks
- [ ] Cron routes protected with CRON_SECRET
- [ ] No sensitive data in error responses

---

### 7. Testing Controls

**Required Test Suites:**

```
✅ Unit tests (Jest)              -- Business logic, utilities
✅ Integration tests (Supabase)    -- Database operations, RLS
✅ Security tests                  -- RLS policies, auth security
✅ GDPR tests                      -- Export, delete, consent flows
✅ E2E tests (Playwright)          -- User flows (optional for MVP)
```

**Security Test Template:**

```typescript
// tests/security/rls-food-logs.test.ts
import { createClient } from '@supabase/supabase-js'

describe('RLS Policies: food_logs', () => {
  let user1Client, user2Client, adminClient

  beforeAll(async () => {
    // Set up test clients for different users
    user1Client = await createTestUser('user1@test.com')
    user2Client = await createTestUser('user2@test.com')
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  })

  test('User cannot access other users food logs', async () => {
    // User 1 creates a food log
    await user1Client.from('food_logs').insert({
      food_name: 'Test Food',
      quantity: 1,
      calories: 100
    })

    // User 2 cannot see user 1's food log
    const { data, error } = await user2Client
      .from('food_logs')
      .select('*')

    expect(error).toBeNull()
    expect(data).toHaveLength(0) // Should be empty for user 2
  })

  test('User can only access own food logs', async () => {
    // User 1 creates a food log
    const { data: inserted } = await user1Client.from('food_logs').insert({
      food_name: 'Test Food',
      quantity: 1,
      calories: 100
    }).select().single()

    // User 1 can see their own food log
    const { data: retrieved } = await user1Client
      .from('food_logs')
      .select('*')

    expect(retrieved).toHaveLength(1)
    expect(retrieved[0].id).toBe(inserted.id)
  })
})
```

**Control Checklist:**
- [ ] Unit tests for business logic
- [ ] Integration tests for database operations
- [ ] Security tests for RLS policies
- [ ] Security tests for authentication
- [ ] GDPR tests for export/delete flows
- [ ] Test coverage > 70% for core features

---

### 8. Deployment Controls

**Environment Variables Required:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Resend (Email)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Vercel
NEXT_PUBLIC_APP_URL=https://yourdomain.com
CRON_SECRET=your_cron_secret_for_jobs

# Food Database APIs (Optional)
NUTRITIONIX_APP_ID=your_nutritionix_id
NUTRITIONIX_APP_KEY=your_nutritionix_key

# Feature Flags
NEXT_PUBLIC_MAINTENANCE_MODE=false
DEBUG_MODE=false
```

**Deployment Checklist:**
- [ ] All environment variables set in Vercel
- [ ] Service role key never exposed to client
- [ ] CRON_SECRET set for cron jobs
- [ ] Database migrations run before deployment
- [ ] RLS policies verified in production
- [ ] GDPR endpoints tested in production
- [ ] Security event logging verified
- [ ] EU routing verified (x-vercel-id header)

---

### 9. Monitoring & Alerting Controls

**Required Monitoring:**

```
✅ Vercel Analytics (traffic, performance)
✅ Supabase Dashboard (database usage, auth)
✅ Custom security_events table (security incidents)
✅ Vercel Logs (error tracking)
✅ Manual GDPR export test (quarterly)
```

**Alert Thresholds (MVP):**
- Error rate > 5% (investigate)
- Auth failures > 10% of attempts (possible attack)
- Database connections > 90% capacity (scale)
- API response time > 3s (performance issue)

**Control Checklist:**
- [ ] Vercel Analytics configured
- [ ] Supabase dashboard monitored
- [ ] Security events reviewed weekly
- [ ] Error logs reviewed daily
- [ ] GDPR export tested quarterly
- [ ] Performance metrics tracked

---

### 10. Documentation Controls

**Required Documentation:**

```
✅ Privacy Policy (legal review required)
✅ Terms of Service (legal review required)
✅ Subprocessors List (Vercel, Supabase, Resend, food APIs)
✅ Cookie Policy (if using non-essential cookies)
✅ API Documentation (internal)
✅ Architecture Documentation (internal)
```

**Control Checklist:**
- [ ] Privacy policy written and reviewed
- [ ] Terms of service written
- [ ] Subprocessors list accurate
- [ ] Cookie policy (if applicable)
- [ ] API documentation up to date
- [ ] Architecture documented

---

## Operational Guidelines

### Daily Operations (MVP)

- [ ] Check Vercel logs for errors
- [ ] Check Supabase dashboard for usage spikes
- [ ] Review security_events (if any)
- [ ] Monitor user feedback (if launched)

### Weekly Operations

- [ ] Review error logs and trends
- [ ] Check database usage (Supabase free tier limits)
- [ ] Review API rate limits (if applicable)
- [ ] Update dependencies if security patches available

### Monthly Operations

- [ ] Review user growth and engagement metrics
- [ ] Check retention cron job logs
- [ ] Review GDPR export functionality
- [ ] Update documentation if features changed

### Quarterly Operations

- [ ] Full GDPR compliance review
- [ ] Re-verify EU routing (Vercel + Supabase)
- [ ] Review subprocessors list
- [ ] Test all GDPR rights (export, delete, etc.)
- [ ] Legal review of privacy policy (if changed)

---

## Cost Management (Free Tier Strategy)

### Free Tier Limits (Current)

**Vercel Hobby (Free):**
- 100GB bandwidth/month
- 6,000 minutes of execution time/month
- Unlimited deployments

**Supabase Free:**
- 500MB database storage
- 1GB file storage
- 2GB bandwidth/month
- 50,000 MAU (Monthly Active Users)

**Resend Free:**
- 3,000 emails/month
- 300 emails/day

### Cost Optimization Strategies

1. **Database Storage:**
   - Implement data retention (30-day soft delete, then purge)
   - Don't store images locally (use Supabase Storage or external CDN)
   - Anonymize old analytics instead of deleting (for insights)

2. **Bandwidth:**
   - Use CDN (Vercel Edge)
   - Compress images
   - Lazy load components

3. **Execution Time:**
   - Optimize database queries
   - Use caching for food database lookups
   - Batch operations where possible

4. **Email:**
   - Only send essential emails (verification, password reset)
   - Digest notifications instead of immediate (for social features)

### Upgrade Triggers

Consider upgrading to paid plans when:

- **Supabase:** > 50,000 MAU or > 500MB storage
- **Vercel:** > 100GB bandwidth or execution time limits
- **Resend:** > 3,000 emails/month

**Expected Upgrade Timeline:**
- Free tier: 0-5,000 users
- Pro tier: 5,000-50,000 users
- Enterprise: 50,000+ users

---

## Risk Mitigation

### Technical Risks

**Risk:** Supabase RLS bypass or misconfiguration
**Mitigation:**
- Comprehensive RLS testing
- Regular security audits
- Never expose service role key to client
- Review RLS policies before deployment

**Risk:** Data loss from retention cron job
**Mitigation:**
- Implement 30-day soft delete before hard delete
- Test retention job in staging first
- Monitor retention job logs
- Keep backups for critical data

**Risk:** EU routing failure
**Mitigation:**
- Verify with x-vercel-id header
- Quarterly verification
- Document in privacy policy
- Have backup plan (manual routing)

### Operational Risks

**Risk:** Free tier exhaustion
**Mitigation:**
- Monitor usage weekly
- Set up alerts (Supabase dashboard)
- Implement cost optimization strategies
- Have upgrade plan ready

**Risk:** GDPR non-compliance
**Mitigation:**
- Legal review before launch
- Quarterly compliance reviews
- Document all data flows
- Implement all GDPR rights

**Risk:** Security breach
**Mitigation:**
- Security event logging
- Rate limiting
- Regular dependency updates
- Incident response plan

---

## What We Can Decide Now vs. Needs Legal Review

### Can Decide Now (Technical)

**Architecture:**
- ✅ Use Next.js 16 + Supabase (Option A)
- ✅ Configure Supabase EU region
- ✅ Configure Vercel EU functions
- ✅ Implement RLS policies on all tables
- ✅ Copy GDPR endpoints from PdfExtractorAi

**Security:**
- ✅ Use Supabase Auth (email + OAuth)
- ✅ Implement security event logging
- ✅ Use Resend for transactional email
- ✅ Configure rate limiting
- ✅ Use environment variables for secrets

**Data:**
- ✅ Collect only essential data (email, food logs, timestamps)
- ✅ Implement data retention (30-day soft delete)
- ✅ Implement all GDPR rights
- ✅ Use granular consent management

### Needs Legal Review

**Data Classification:**
- ⚠️ Confirm if food/calorie logging is "health data"
- ⚠️ Confirm legal bases (contract vs consent)
- ⚠️ Validate consent language

**Privacy Policy:**
- ⚠️ Review for legal accuracy
- ⚠️ Confirm cross-border transfer safeguards
- ⚠️ Validate subprocessors list

**Food Database APIs:**
- ⚠️ Review API terms for data flows
- ⚠️ Confirm DPA availability
- ⚠️ Validate EU data processing (if applicable)

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Set up Next.js project with Supabase
- [ ] Configure EU regions (Vercel + Supabase)
- [ ] Copy and adapt database schema
- [ ] Implement RLS policies
- [ ] Copy auth endpoints
- [ ] Copy GDPR endpoints
- [ ] Copy consent management

### Week 2: Core Features
- [ ] Implement food database API integration
- [ ] Build food logging UI
- [ ] Implement daily aggregation
- [ ] Build stats dashboard
- [ ] Implement goal tracking

### Week 3: Polish & Testing
- [ ] Copy admin dashboard
- [ ] Adapt email templates
- [ ] Implement security tests
- [ ] Implement GDPR tests
- [ ] Performance optimization
- [ ] Documentation

### Week 4: Launch Preparation
- [ ] Legal review of privacy policy
- [ ] Production deployment
- [ ] Final testing in production
- [ ] Monitor initial usage
- [ ] Iterate based on feedback

---

## Key Takeaways

1. **Proven Stack:** Next.js 16 + Supabase is battle-tested in PdfExtractorAi
2. **Fast to Market:** Can have MVP in 3-4 weeks by reusing patterns
3. **GDPR-Ready:** Copy compliance patterns from PdfExtractorAi (~70% reuse)
4. **Free Tier Friendly:** Stay free up to 5,000 users with optimization
5. **Clear Evolution Path:** Can evolve to hybrid if app scales
6. **Security-First:** RLS, auth, security logging from day 1
7. **EU-Compliant:** EU routing configured, cross-border transfers documented

---

**Next Steps:**
1. Review 10_implementation_readiness_checklist.md
2. Confirm legal classification (health data vs general data)
3. Set up project (Next.js + Supabase)
4. Copy database schema and RLS policies
5. Start with authentication and consent management
6. Build food logging core on top of solid foundation
