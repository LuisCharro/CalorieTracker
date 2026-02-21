# MVP_SCOPE.md — CalorieTracker MVP vs Later Features

**Status:** Canonical scope definition for MVP development
**Created:** 2026-02-21

---

## 1) Scope Overview

This document defines what is **IN** MVP versus what is **DEFERRED** to "Later" releases. This guides sprint planning, feature acceptance, and success criteria.

---

## 2) MVP Features (IN SCOPE)

### Authentication
**Status:** ✅ COMPLETE

**Features:**
- Email/password registration and login
- Password validation (min length, complexity)
- Duplicate email detection (409 Conflict)
- Email format validation
- Session management with JWT tokens

**Out of MVP (Later):**
- OAuth login (Google, Apple, etc.)

**Backend endpoints:**
- `POST /api/auth/register` — Create new user
- `POST /api/auth/login` — Authenticate user
- `GET /api/auth/user/:id` — Get user profile
- `PATCH /api/auth/user/:id` — Update user profile

**Frontend routes:**
- `/login` — Login page
- `/signup` — Registration page
- `/onboarding/*` — Protected onboarding routes

---

### Onboarding
**Status:** ✅ COMPLETE

**Features:**
- Goals page: Set daily calorie target
- Preferences page: Set timezone, units preference
- Consents page: Required consents (privacy policy, TOS) + Optional consents (analytics, marketing)
- Completion gate: Must complete all required steps before accessing app

**Consent Types (Required vs Optional):**
- **Required:** `privacy_policy`, `terms_of_service`
- **Optional:** `analytics`, `marketing`

**Backend endpoints:**
- `GET /api/auth/user/:id/onboarding` — Get onboarding state
- `PATCH /api/auth/user/:id/onboarding` — Save goals/preferences
- `PATCH /api/auth/user/:id/consents` — Submit consents

**Frontend routes:**
- `/onboarding/goals` — Set daily calorie goal
- `/onboarding/preferences` — Timezone, units
- `/onboarding/consents` — Required consents
- `/onboarding/consents-optional` — Optional consents
- `/onboarding/complete` — Final completion page

**Route Guard:**
- `users.onboarding_complete = false` → Redirect to `/onboarding/*`
- `users.onboarding_complete = true` → Allow app routes (`/log`, `/today`, `/history`, `/settings/*`)

---

### Food Logging
**Status:** ✅ COMPLETE

**Features:**
- Text input (food name, brand name, quantity, unit, meal type)
- Deterministic nutrition parsing (calories required, macros optional)
- Meal type selection (breakfast, lunch, dinner, snack)
- Optional confirm screen before save
- Edit existing food log entry
- Soft delete food log entries

**Meal Types:**
- `breakfast`
- `lunch`
- `dinner`
- `snack`

**Nutrition Contract (JSON):**
```json
{
  "calories": number,
  "protein": number,
  "carbohydrates": number,
  "fat": number,
  "fiber": number,
  "sugar": number,
  "sodium": number
}
```

**Backend endpoints:**
- `POST /api/logs/batch` — Create multiple food logs
- `GET /api/logs` — Get user's food logs (filtered by date, meal type)
- `GET /api/logs/:id` — Get specific food log entry
- `PATCH /api/logs/:id` — Update food log entry
- `DELETE /api/logs/:id` — Soft delete food log entry

**Frontend routes:**
- `/log` — Food log entry form
- `/log/confirm` — Confirmation screen
- `/log/search` — Search food logs
- `/today` — Today's meals dashboard
- `/today/meal/:id` — Specific meal detail view
- `/history` — Historical list view
- `/history/entry/:id` — Edit specific entry

**Meal Identity Rule:**
- `/today/meal/[id]` resolves to derived key `(date, meal_type)`, NOT a separate persisted meal table in MVP.

---

### Goals
**Status:** ✅ COMPLETE

**Features:**
- Set daily calorie target
- Track progress against target
- Update or deactivate goals
- Goal type: `daily_calories` (MVP only)

**Goal Types (MVP only):**
- `daily_calories` — Target daily calorie intake

**Backend endpoints:**
- `POST /api/goals` — Create goal
- `GET /api/goals` — Get user's goals
- `PATCH /api/goals/:id` — Update goal
- `DELETE /api/goals/:id` — Soft delete goal

**Frontend routes:**
- `/settings/goals` — Goals management page

---

### Settings
**Status:** ✅ COMPLETE

**Features:**
- Profile management (display name)
- Goals management (daily calorie target)
- Preferences (timezone, units)
- Notification settings (channels, reminder times)
- Privacy controls (consent management)
- GDPR export request
- GDPR erasure request

**Backend endpoints:**
- `GET /api/auth/user/:id` — Get profile
- `PATCH /api/auth/user/:id` — Update profile
- `POST /api/goals` — Create/update goals
- `GET /api/settings/notifications` — Get notification settings
- `PATCH /api/settings/notifications` — Update notification settings
- `POST /api/gdpr/export` — Request data export
- `POST /api/gdpr/erasure` — Request account deletion

**Frontend routes:**
- `/settings/profile` — Profile settings
- `/settings/goals` — Goals settings
- `/settings/preferences` — App preferences (timezone, units)
- `/settings/notifications` — Notification channels, reminder times
- `/settings/privacy` — Manage consents
- `/settings/gdpr/export` — Request data export
- `/settings/gdpr/delete` — Request account deletion

**Notification Channels (MVP):**
- In-app notifications (stored in database)

---

### GDPR Rights
**Status:** ✅ COMPLETE

**Features:**
- **Data Export:** User can request full data export in JSON format (CSV optional)
- **Data Erasure:** User can request account deletion with grace period
- **Processing Activities:** Audit trail of data processing
- **Security Events:** Audit trail of security events

**GDPR Request Types:**
- `access` — View all data
- `portability` — Download data for transfer
- `erasure` — Delete account (with grace period)
- `rectification` — Correct inaccurate data (user self-service vs support TBD)

**Data Export Format:**
- **Required:** JSON
- **Optional:** CSV

**Grace Period (Decision Required):**
- Erasure requests have configurable grace period before execution
- Default: TBD (needs decision)

**Backend endpoints:**
- `POST /api/gdpr/export` — Create export request
- `POST /api/gdpr/erasure` — Create erasure request
- `GET /api/gdpr/user/:id` — Get user's GDPR requests
- `GET /api/gdpr/requests` — Admin endpoint (if applicable)

**Frontend routes:**
- `/settings/gdpr/export` — Request data export
- `/settings/gdpr/delete` — Request account deletion

**GDPR Tables:**
- `gdpr_requests` — User requests
- `processing_activities` — Processing audit trail
- `security_events` — Security event audit trail

---

### Offline Mode (Partial)
**Status:** ✅ COMPLETE

**Features:**
- Cached reads for last-viewed data
- Queued draft sync when offline
- Basic offline indicator in UI

**Limitations (MVP):**
- No full conflict resolution UI
- No multi-device sync engine
- Manual conflict resolution required if sync conflicts occur

**Backend endpoints:**
- `POST /api/sync/offline-queue` — Sync queued drafts when back online

**Frontend:**
- Offline indicator UI
- Sync queue visualization

---

### Dashboard
**Status:** ✅ COMPLETE

**Features:**
- Today's meals overview
- Calorie summary for today
- Quick action buttons (add meal, view history, settings)

**Frontend routes:**
- `/` — Landing page (redirects based on auth state)
- `/today` — Today's dashboard
- `/history` — Historical list view

**Navigation Map (MVP):**
- **Public:** `/`, `/login`, `/signup`, `/privacy`, `/terms`
- **Onboarding:** `/onboarding/goals` → `/onboarding/preferences` → `/onboarding/consents` → `/onboarding/consents-optional` → `/onboarding/complete`
- **App Core:** `/log`, `/log/search`, `/log/confirm`, `/today`, `/today/meal/[id]`, `/history`, `/history/entry/[id]`
- **Settings:** `/settings/profile`, `/settings/goals`, `/settings/preferences`, `/settings/notifications`, `/settings/privacy`, `/settings/gdpr/export`, `/settings/gdpr/delete`

---

## 3) Later Features (OUT OF MVP - DEFERRED)

### Voice Input
**Status:** ❌ DEFERRED

**Description:** Voice-to-text food logging
**Rationale:** Requires voice API integration, complex parsing of spoken food names, high error rate for accuracy.

**Trigger for Inclusion:**
- Voice API accuracy improves to >95%
- Clear user demand for voice input
- Sufficient development capacity

---

### Weekly/Monthly Analytics Screens
**Status:** ❌ DEFERRED

**Description:** Visual charts showing calorie trends, weekly summaries, monthly reports

**Rationale:** Requires additional chart library integration, complex aggregation queries, not core to MVP value proposition.

**Trigger for Inclusion:**
- User feedback requesting analytics
- MVP stability achieved
- Development capacity available

---

### Exercise Tracking
**Status:** ❌ DEFERRED

**Description:** Log workouts, track calories burned, integrate with calorie intake.

**Rationale:** Requires complex exercise database, API integration for exercise data, significant additional UI complexity.

**Trigger for Inclusion:**
- User feedback requesting exercise tracking
- Integration with reliable exercise data source
- Development capacity available

---

### Social Features
**Status:** ❌ DEFERRED

**Description:** Share meals, follow friends, community challenges, leaderboards.

**Rationale:** Requires additional database tables, privacy implications, significant backend complexity.

**Trigger for Inclusion:**
- Clear user demand for social features
- Privacy model defined for social sharing
- Development capacity available

---

### Full Multi-Device Local-First Sync Engine
**Status:** ❌ DEFERRED

**Description:** Automatic conflict resolution across devices, offline-first sync engine, queue management, merge strategies.

**Rationale:** Extremely complex to build correctly, significant risk of data loss, requires extensive testing and edge case handling.

**Trigger for Inclusion:**
- MVP stability and usage patterns understood
- Clear multi-device use case from users
- Development capacity available for major feature

**Current State (MVP):**
- Partial offline UX only (cached reads + queued drafts)
- No automatic conflict resolution
- Manual conflict resolution if sync conflicts occur

---

## 4) MVP Success Criteria

The MVP is considered COMPLETE when:

1. ✅ All MVP features listed above are implemented and working
2. ✅ All route guards and lifecycle states are correct
3. ✅ All backend endpoints for MVP features are functional
4. ✅ All frontend routes for MVP features are navigable
5. ✅ GDPR export/erasure flows are working
6. ✅ E2E tests cover all critical user flows
7. ✅ All enum types are frozen and synchronized between frontend/backend
8. ✅ No "Later" features are in MVP codebase
9. ✅ Data model matches canonical document (doc 26)

---

## 5) Decision Log

### Open Questions (from doc 28)

| Question | Status | Decision |
|---------|--------|----------|
| OAuth inclusion in MVP or deferred? | ✅ DECIDED | DEFERRED to Later |
| Exact grace period and retention windows per data class? | ⚠️ PENDING | Needs decision |
| Rectification: user self-service or support workflow in MVP? | ⚠️ PENDING | Needs decision |
| Required monitoring level for beta launch? | ⚠️ PENDING | Needs decision |

### Scope Freeze Decision
**Date:** 2026-02-21
**Decision:** MVP scope is now LOCKED
- No new features can be added to MVP without explicit approval
- "Later" features must be documented here with rationale
- All future sprints must map to MVP scope unless explicitly tagged "Later"

---

## 6) References

### Canonical Documents
- **Product Navigation:** `plan/02_architecture_gdpr/25_FINAL_product_navigation_and_user_flows.md`
- **Data Model:** `plan/02_architecture_gdpr/26_FINAL_data_model_and_database_plan_local_first.md`
- **Execution Readiness:** `plan/02_architecture_gdpr/28_FINAL_execution_readiness_checklist.md`
- **Execution Plan:** `plan/06_execution_plan.md`

### Database Schema
- **Tables:** 8 MVP tables (users, food_logs, goals, notification_settings, consent_history, gdpr_requests, processing_activities, security_events)
- **Indexes:** 6 required indexes (see doc 26)
- **Soft-delete:** `is_deleted` + `deleted_at` pattern applied consistently

### Enums
- **Backend:** `backend/src/shared/enums.ts`
- **Frontend:** `frontend/src/core/contracts/enums.ts`
- **Count:** 9 enum types (GoalType, MealType, ConsentType, GDPRRequestType, GDPRRequestStatus, SecurityEventType, SecurityEventSeverity, ProcessingActivityType, LegalBasis)
- **Status:** ✅ Perfect parity between frontend/backend

---

## 7) Version History

| Date | Version | Changes |
|-------|---------|---------|
| 2026-02-21 | 1.0 | Initial MVP scope document created |

---

## 8) Appendices

### Appendix A: Route Guards Summary

| Guard Key | Condition | Allowed Routes | Redirect Target |
|-----------|------------|----------------|----------------|
| Unauthenticated | `no session` | `/`, `/login`, `/signup`, `/privacy`, `/terms` | Protected routes → `/login` |
| Onboarding Incomplete | `onboarding_complete = false` | `/onboarding/*`, logout | App routes → `/onboarding` |
| Onboarding Complete | `onboarding_complete = true` | `/log`, `/today`, `/history`, `/settings/*` | Onboarding routes → `/today` |
| Soft Deleted | `is_deleted = true` | None | Session terminated; all routes → `/login` |

### Appendix B: GDPR Request States

| Request Type | States | Transition Logic |
|--------------|---------|-----------------|
| Access | `pending` → `processing` → `completed` | Immediate, no grace period |
| Portability | `pending` → `processing` → `completed` | Immediate, no grace period |
| Erasure | `pending` → `processing` → `completed` | Grace period required (TBD) |
| Rectification | `pending` → `processing` → `completed` | Immediate, support workflow TBD |

### Appendix C: Consent Types

| Consent Type | Required | Description |
|--------------|-----------|-------------|
| `privacy_policy` | ✅ YES | Privacy policy acceptance |
| `terms_of_service` | ✅ YES | Terms of service acceptance |
| `analytics` | ❌ NO | Analytics/tracking consent |
| `marketing` | ❌ NO | Marketing communications consent |

---

**End of Document**
