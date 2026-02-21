# OPEN_QUESTIONS_DECISIONS.md — Decisions on Remaining Open Questions

**Created:** 2026-02-21

---

## Purpose

This document captures decisions on the 4 open questions from the execution readiness checklist (doc 28).

---

## 1) OAuth Inclusion in MVP or Deferred?

### Status: ✅ **DECIDED — DEFERRED**

### Decision
**OAuth is OUT OF MVP scope.**

### Rationale
- Email/password authentication is MVP-complete
- OAuth requires additional complexity (external provider integrations, token refresh, etc.)
- MVP can launch with auth-only approach
- OAuth can be added as a "Later" feature when user demand is clear

### When to Revisit
- User feedback requesting social login
- Clear business case for specific OAuth providers (Google, Apple, etc.)
- Development capacity available

---

## 2) Exact Grace Period and Retention Windows per Data Class

### Status: ✅ **DECIDED — POLICY DEFINED**

### Grace Period (Erasure Requests)

| Data Class | Grace Period | Rationale |
|-------------|-------------|------------|
| **User Data** | 30 days | GDPR standard: users can change mind; prevents accidental loss |
| **Food Logs** | 7 days | Food logging is frequent; 7 days allows reflection/re-entry |
| **Goals** | 7 days | Goal tracking is ongoing; 7 days allows re-setting targets |
| **Consent History** | No grace period | Audit trail — users cannot change consent events |
| **Processing Activities** | No grace period | Audit trail — immutable processing records |
| **Security Events** | No grace period | Audit trail — immutable security records |
| **GDPR Requests** | No grace period | Audit trail — request metadata is immutable |

### Retention Windows (Data Deletion)

| Data Class | Retention Period | Rationale |
|-------------|----------------|------------|
| **Soft-deleted user data** | 180 days (6 months) | GDPR "right to be forgotten" implementation with extended retention for recovery |
| **GDPR Requests** | 3 years | Audit trail for compliance (GDPR recommendation: reasonable period) |
| **Processing Activities** | 3 years | Audit trail for compliance |
| **Security Events** | 1 year | Security audit trail (shorter period, fewer records) |

### Implementation Notes

**Grace Period Enforcement:**
- Backend `gdpr_erasure_job.ts` already has grace period logic
- Update grace period values in job configuration:
  ```typescript
  const GRACE_PERIOD_DAYS = {
    users: 30,
    food_logs: 7,
    goals: 7,
    consent_history: 0,
    processing_activities: 0,
    security_events: 0,
    gdpr_requests: 0
  };
  ```

**Retention Policy Enforcement:**
- Add scheduled cleanup job for expired soft-deleted data (6 months)
- Add scheduled cleanup job for old audit records (3 years)
- Jobs should run daily at 2:00 AM UTC

**User Communication:**
- Display grace period remaining on erasure request page
- Send email confirmation when erasure completes after grace period
- Warning email 3 days before grace period ends

---

## 3) Rectification: User Self-Service or Support Workflow in MVP?

### Status: ✅ **DECIDED — USER SELF-SERVICE**

### Decision
**Rectification in MVP is USER SELF-SERVICE.**

### Rationale

**User Self-Service Approach:**
- ✅ Faster for users (instant action)
- ✅ Reduces support burden
- ✅ Empowers users to correct their own data
- ✅ Aligns with GDPR "access and rectification" rights
- ✅ Simpler implementation (no admin panel needed for MVP)

**Support-Only Approach (REJECTED for MVP):**
- ❌ Slower for users (email exchanges, waiting for support)
- ❌ Higher support cost
- ❌ Complex to implement (admin panel, approval workflows)
- ❌ Not core to MVP value proposition

### Implementation Requirements

**Frontend:**
- Add rectification section to `/settings/gdpr/export` page
- Add "Request Rectification" button to deleted/erased entries
- Form: Explain what needs correction, provide new value(s)
- Success message: "Rectification request submitted"

**Backend:**
- Add endpoint: `POST /api/gdpr/rectification`
- Request body:
  ```json
  {
    "requestId": "uuid", // Original GDPR request (access/erasure)
    "correctionType": "email|food_log|goal|preference", // What to correct
    "description": "User's explanation",
    "newValue": "Corrected value (if applicable)"
  }
  ```
- Processing workflow:
  1. Validate user owns the original GDPR request
  2. Create new `gdpr_request` entry with type `rectification`
  3. Apply correction to affected data
  4. Log in `processing_activities`
  5. Update original `gdpr_request` status to `rectification_submitted`
- Notify user via email upon completion

**Rectification Types (MVP):**
- `email_correction` — Update email address
- `food_log_correction` — Add/correct/replace food log entry
- `goal_correction` — Update daily calorie target
- `preference_correction` — Update timezone, units, etc.

### Limitations (MVP)
- Manual rectification only (no bulk operations)
- No admin approval workflow (deferred to Later)
- No audit trail review workflow (deferred to Later)

---

## 4) Required Monitoring Level for Beta Launch?

### Status: ✅ **DECIDED — BASIC MONITORING**

### Decision
**Beta launch requires BASIC MONITORING level.**

### Monitoring Components

**Required (Must Have):**

| Component | Metrics | Tools | Rationale |
|-----------|----------|--------|------------|
| **Application Health** | Uptime, response time, error rates | Simple uptime monitor (UptimeRobot or similar) | Detect outages quickly |
| **Database Health** | Connection pool, query performance | PostgreSQL logs, slow query logs | Detect database bottlenecks |
| **API Health** | Request volume, error rates, latency | Backend error logs | Detect API issues before users report them |
| **GDPR Job Health** | Erasure job failures, stuck requests | Job logs, alerting | GDPR compliance cannot fail silently |

**Recommended (Nice to Have):**

| Component | Metrics | Tools | Rationale |
|-----------|----------|--------|------------|
| **User Analytics** | Active users, feature usage | Google Analytics (if consent given) | Understand usage patterns |
| **Error Tracking** | Browser errors, API errors (client-side) | Sentry, Rollbar | Detect issues before users report |
| **Performance Monitoring** | Frontend load time, interaction metrics | Lighthouse, Web Vitals | Optimize UX |

### Alerting Thresholds

| Metric | Warning | Critical | Action |
|--------|----------|----------|--------|
| Uptime | < 99.5% | < 95% | Warning: Investigate degraded performance
- API Error Rate | > 1% | > 5% | Critical: Outage detected
- Database Connection Pool | < 3 available | < 1 available | Critical: Database exhaustion |
- GDPR Job Failure | Any failure | N/A | Immediate: Manual intervention required |

### Implementation Notes

**Infrastructure (MVP):**
- Use existing logging infrastructure:
  - Backend: `console.error` with structured logging
  - PostgreSQL: `pg_stat_statements` for slow query detection
- Simple uptime monitor (free tier): UptimeRobot or similar
- Alerting: Email to developer (Luis) for critical issues

**Dashboard (Optional, Later):**
- Grafana + Prometheus for visualization
- PagerDuty or similar for on-call alerting (not needed for beta)

**User Consent:**
- Monitoring for Uptime/Error Tracking requires opt-in consent
- Default: Users must explicitly consent to analytics
- GDPR export does not include monitoring data

### Cost Considerations

| Tier | Monthly Cost (Approx) | Notes |
|-------|---------------------|-------|
| Free | $0 | UptimeRobot free tier, existing logs |
| Basic | ~$10-20 | Sentry basic tier, better uptime monitoring |
| Standard | ~$50-100 | Full observability stack (overkill for beta) |

**Recommendation:** Start with FREE tier for beta, upgrade to Basic if issues detected.

---

## 5) Summary of Decisions

| Question | Decision | Status |
|---------|----------|--------|
| OAuth inclusion | DEFERRED to Later | ✅ Documented |
| Grace period & retention | Policy defined (see above) | ✅ Documented |
| Rectification workflow | User self-service | ✅ Documented |
| Monitoring level | Basic (free tier) | ✅ Documented |

---

## 6) Implementation Checklist

### Immediate (Before Beta Launch)
- [ ] Update `gdpr_erasure_job.ts` with grace period constants
- [ ] Add retention cleanup job for soft-deleted data (6 months)
- [ ] Add retention cleanup job for audit records (3 years)
- [ ] Implement `POST /api/gdpr/rectification` endpoint
- [ ] Add rectification UI to frontend `/settings/gdpr/export` page
- [ ] Setup free uptime monitor (UptimeRobot or similar)
- [ ] Configure alerting email for critical issues

### Before GA Launch
- [ ] Upgrade to Basic monitoring (Sentry + better uptime monitoring)
- [ ] Implement admin panel for rectification approval (if self-service abused)
- [ ] Add bulk rectification operations
- [ ] Implement audit trail review workflow

---

## 7) References

### Related Documents
- Execution Readiness Checklist: `plan/02_architecture_gdpr/28_FINAL_execution_readiness_checklist.md`
- MVP Scope: `backend/docs/MVP_SCOPE.md`
- Execution Plan: `plan/06_execution_plan.md`

---

**End of Document**
