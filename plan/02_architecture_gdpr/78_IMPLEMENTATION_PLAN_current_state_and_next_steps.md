# 78 — Current State Assessment and Implementation Plan

**Status:** Concrete implementation roadmap derived from 25/26/27/28 docs + codebase audit
**Date:** 2026-02-19

---

## 1) Current State Analysis

### What EXISTS (Foundation Phase - Complete)

#### Backend (`/Users/luis/Repos/CalorieTracker/backend`)
- ✅ Database schema initialized (`0001_init.sql`)
  - All MVP tables: `users`, `food_logs`, `goals`, `notification_settings`, `consent_history`, `gdpr_requests`, `processing_activities`, `security_events`
  - Required indexes created
  - Canonical enums and field types match doc 26

- ✅ Route skeleton implemented
  - `src/api/routers/auth.router.ts` (signup, login, user CRUD)
  - `src/api/routers/logs.router.ts` (CRUD for food logs)
  - `src/api/routers/goals.router.ts` (goals CRUD + progress)
  - `src/api/routers/settings.router.ts` (preferences, notifications)
  - `src/api/routers/gdpr.router.ts` (export, erasure, requests)

- ✅ Environment setup
  - `.env.example` templates
  - `dev-scripts/restart-stack.sh` (DB + API start)
  - `dev-scripts/smoke-auth-onboarding.sh` (health checks)

#### Frontend (`/Users/luis/Repos/CalorieTracker/frontend`)
- ✅ Route structure matches doc 25 navigation map
  - `/`, `/login`, `/signup`, `/privacy`, `/terms`
  - Onboarding: `/onboarding/goals` → `/onboarding/preferences` → `/onboarding/consents` → `/onboarding/consents-optional` → `/onboarding/complete`
  - Core: `/log`, `/log/search`, `/log/confirm`, `/today`, `/today/meal/[id]`, `/history`, `/history/entry/[id]`
  - Settings: all required pages

- ✅ Route guards implemented
  - `src/core/auth/routeGuard.tsx` enforces:
    - Unauthenticated users → public routes only
    - Authenticated but `onboarding_complete=false` → onboarding routes only
    - Authenticated and `onboarding_complete=true` → app routes
    - Soft-deleted users → blocked access

- ✅ API contracts defined
  - `src/core/contracts/types.ts`: all request/response types
  - `src/core/contracts/enums.ts`: canonical enums matching plan 26

- ✅ E2E test framework
  - `e2e/tests/` with Playwright tests for signup, onboarding, GDPR, history

#### Plan Repository (`/Users/luis/Repos/CalorieTracker/plan`)
- ✅ Canonical planning docs (25–28) approved and frozen
- ✅ Quality gates defined (`05_quality_automation/00_quality_gates.md`)
- ✅ Execution readiness checklist completed (`28_FINAL_execution_readiness_checklist.md`)

---

### What's MISSING (Implementation Phase)

#### Backend Gaps
- ❌ Auth routes are skeleton/placeholder
  - No password hashing implementation
  - No security event logging (`security_events` table unused)
  - No duplicate email validation (returns 409 on signup)
  - No JWT/session handling

- ❌ Onboarding routes are not implemented
  - `POST /api/users/:userId/preferences` → placeholder
  - `POST /api/users/:userId/consents` → placeholder
  - `PUT /api/users/:userId/onboarding` → placeholder (completion gate)

- ❌ Food logging routes are skeleton
  - No nutrition parsing from text input
  - `POST /api/logs` → placeholder
  - No soft delete handling (`is_deleted` flag)
  - No edit/update logic

- ❌ GDPR routes are skeleton
  - Export endpoint doesn't generate JSON files
  - Erasure endpoint doesn't soft delete user
  - Request status tracking not implemented

- ❌ Business logic missing
  - No actual meal calculations
  - No goal progress tracking
  - No notification delivery

#### Frontend Gaps
- ❌ UI pages are shells/empty components
  - Onboarding forms don't save to backend
  - Food logging forms don't submit
  - Settings pages are static HTML with no API integration

- ❌ API integration incomplete
  - Most `src/core/api/services/*.ts` files may be stubs
  - No error handling for API failures
  - No loading states or optimistic UI

- ❌ Data persistence
  - Local storage cache not implemented (plan calls for "partial offline UX")
  - No queue for offline writes

#### Integration Gaps
- ❌ Contract drift likely
  - Frontend contracts may not match actual backend responses
  - Enums/fields may be inconsistent between repos

- ❌ No validation logic
  - Backend doesn't validate required fields per doc 26
  - Frontend forms don't enforce schema constraints

---

## 2) Root Cause: Why Cycles Only Ran Tests

### Pattern Analysis
Last 27 cycles (from execution logs) were:
- Running `restart-stack.sh`, `smoke-auth-onboarding.sh`, `npm test`
- Checking test passes
- Committing execution logs
- **No code changes**

### Why No Implementation?
1. **Orchestrator was in "validation mode"**
   - Workers were told: *"review planner notes and validate gates"*
   - Not given explicit implementation tasks
   - Result: tests pass, no code written

2. **Next-steps notes were generic**
   - Each cycle generated `next_steps_cycle_*.md` with same text:
     - "Restart stack, run smoke tests, run npm test"
   - No specific feature tasks (e.g., "implement auth signup")

3. **No breakdown to concrete units of work**
   - Plan docs 25–28 are high-level architecture
   - Need implementation-phase plan breaking down to:
     - Which routes to implement?
     - Which UI components to build?
     - Which API calls to wire up?

---

## 3) Implementation Plan (Concrete Phases)

### Phase 1: Backend Core Logic (Priority: HIGH)

#### 1.1 Auth Implementation
**File:** `src/api/routers/auth.router.ts`

**Tasks:**
- Implement password hashing (bcrypt)
- Add security event logging on:
  - Signup success → `LOGIN_SUCCESS` in `security_events`
  - Login success → `LOGIN_SUCCESS`
  - Login failure → `LOGIN_FAILURE` (with ip hash, user agent)
- Duplicate email check on signup:
  - Query `users` table for existing email
  - Return 409 Conflict if exists
- JWT/session token generation (using `jsonwebtoken`)

**Acceptance:**
- Smoke test: `/api/auth/register` with duplicate email → 409
- Smoke test: `/api/auth/login` with valid credentials → 200 + token
- Smoke test: `/api/auth/login` with invalid credentials → 401

#### 1.2 Onboarding Completion
**File:** `src/api/routers/settings.router.ts`

**Tasks:**
- Implement `POST /api/users/:userId/preferences`
  - Validate `preferences` JSONB structure
  - Update `users.preferences` field
- Implement `POST /api/users/:userId/consents`
  - Insert rows into `consent_history`
  - Validate consent types: `privacy_policy`, `terms_of_service`, `analytics`, `marketing`
- Implement `PUT /api/users/:userId/onboarding`
  - Set `users.onboarding_complete = true`
  - Set `users.onboarding_completed_at = NOW()`

**Acceptance:**
- Smoke test: complete onboarding flow → user has `onboarding_complete=true`
- DB check: `consent_history` has required consent records

#### 1.3 Food Logging Core
**File:** `src/api/routers/logs.router.ts`

**Tasks:**
- Implement text nutrition parsing
  - Simple deterministic parser (no ML in MVP)
  - Extract calories from text (e.g., "apple 100g" → 52 kcal)
- Implement `POST /api/logs` (create)
  - Validate required fields per doc 26
  - Insert into `food_logs` table
- Implement `PATCH /api/logs/:foodLogId` (edit)
  - Update fields with validation
- Implement `DELETE /api/logs/:foodLogId` (soft delete)
  - Set `is_deleted = true`
  - Add processing activity record

**Acceptance:**
- Unit test: text "100g chicken breast" → ~165 calories
- Smoke test: POST log → row created in DB
- Smoke test: DELETE log → `is_deleted=true` (row still exists)

#### 1.4 GDPR Export & Erasure
**File:** `src/api/routers/gdpr.router.ts`

**Tasks:**
- Implement `GET /api/gdpr/export/:userId`
  - Query all user-scoped data (users, food_logs, goals, consent_history, etc.)
  - Generate JSON file structure
  - Return file download or data payload
- Implement `POST /api/gdpr/erase/:userId`
  - Create `gdpr_requests` row (`request_type=erasure`, `status=pending`)
  - Soft delete user: `users.is_deleted = true`, `deleted_at = NOW()`
- Implement async job to process erasure
  - Mark `gdpr_requests.status = processing`
  - After grace period, hard delete/anonymize (scheduled job)

**Acceptance:**
- Smoke test: export endpoint → JSON includes all user data
- Smoke test: erasure request → user `is_deleted=true`

---

### Phase 2: Frontend UI Implementation (Priority: HIGH)

#### 2.1 Onboarding Pages
**Files:**
- `src/app/onboarding/goals/page.tsx`
- `src/app/onboarding/preferences/page.tsx`
- `src/app/onboarding/consents/page.tsx`
- `src/app/onboarding/consents-optional/page.tsx`
- `src/app/onboarding/complete/page.tsx`

**Tasks:**
- Goals page:
  - Form for daily calorie target
  - Validation: numeric, reasonable range
  - Submit to `POST /api/users/:userId/goals`
- Preferences page:
  - Form for unit preferences, timezone, etc.
  - Submit to `POST /api/users/:userId/preferences`
- Required consents page:
  - Checkboxes for privacy policy, terms of service
  - Must agree to proceed
  - Submit to `POST /api/users/:userId/consents`
- Optional consents page:
  - Optional checkboxes (analytics, marketing)
  - Submit to same consents endpoint
- Completion page:
  - Call `PUT /api/users/:userId/onboarding`
  - Redirect to `/today`

**Acceptance:**
- E2E test: complete onboarding → user lands on `/today`
- DB check: user has `onboarding_complete=true`

#### 2.2 Food Logging Pages
**Files:**
- `src/app/log/page.tsx`
- `src/app/log/confirm/page.tsx`
- `src/app/today/page.tsx`
- `src/app/today/meal/[id]/page.tsx`

**Tasks:**
- Log page:
  - Textarea for food input
  - Real-time nutrition preview (if parsing is fast enough)
  - Quantity/unit input fields
  - Meal type dropdown (breakfast/lunch/dinner/snack)
  - Submit to `POST /api/logs`
- Confirm page:
  - Show parsed nutrition summary
  - Edit fields if needed
  - Confirm → save to DB
- Today page:
  - List today's meals from `GET /api/today`
  - Click meal → navigate to `/today/meal/[id]`
- Meal detail page:
  - Show full nutrition breakdown
  - Edit/delete buttons

**Acceptance:**
- E2E test: log food → appears in today view
- E2E test: edit log → DB updated
- E2E test: delete log → soft deleted (hidden from UI)

#### 2.3 Settings Pages
**Files:**
- `src/app/settings/profile/page.tsx`
- `src/app/settings/goals/page.tsx`
- `src/app/settings/preferences/page.tsx`
- `src/app/settings/gdpr/export/page.tsx`
- `src/app/settings/gdpr/delete/page.tsx`

**Tasks:**
- Profile page:
  - Display name input
  - Email (read-only)
  - Submit to `PATCH /api/users/:userId`
- Goals page:
  - List active goals
  - Add/edit/delete goal forms
- Preferences page:
  - Unit selector (g, ml, oz, etc.)
  - Timezone selector
  - Submit to `PATCH /api/users/:userId/preferences`
- GDPR export page:
  - Button to trigger export
  - Download JSON file
- GDPR delete page:
  - Warning text
  - Confirmation button
  - Submit to `POST /api/gdpr/erase/:userId`

**Acceptance:**
- E2E test: update profile → DB updated
- E2E test: trigger export → JSON downloaded
- E2E test: request erasure → account soft deleted

---

### Phase 3: Integration & Validation (Priority: MEDIUM)

#### 3.1 API Integration
**File:** `src/core/api/services/` (multiple files)

**Tasks:**
- Implement auth service (token storage, refresh)
- Implement logs service (CRUD)
- Implement goals service
- Implement settings service
- Implement GDPR service
- Add error handling (user-friendly messages)
- Add loading states (spinners, skeletons)

#### 3.2 Contract Validation
**Tasks:**
- Run `backend/src/db/migrations/runner.ts` → verify schema
- Compare frontend contracts to actual backend responses
- Fix mismatches (field names, types, enums)

#### 3.3 E2E Test Updates
**File:** `e2e/tests/` (update existing files)

**Tasks:**
- Update `signup-onboarding.spec.ts` → verify real signup flow
- Update `gdpr.spec.ts` → verify export/erasure endpoints
- Update `full-onboarding.spec.ts` → end-to-end onboarding
- Update `history.spec.ts` → verify edit/delete operations
- Ensure all selectors match new UI components

#### 3.4 Quality Gates
**Tasks:**
- Run `npm test` (backend) → all unit tests pass
- Run `npm run test:e2e` (frontend) → all E2E tests pass
- Run `./dev-scripts/restart-stack.sh` → stack healthy
- Run `./dev-scripts/smoke-auth-onboarding.sh` → all smoke checks pass

---

## 4) Task Prioritization (Next Free Cycle)

### Backend Worker Tasks (Cycle 28)
**Priority 1 (Must complete):**
1. Implement auth password hashing and security events
2. Implement duplicate email check on signup
3. Implement onboarding completion endpoint

**Priority 2 (High value):**
4. Implement food logging text parsing
5. Implement create/edit/delete log endpoints
6. Implement GDPR export endpoint

**Priority 3 (Lower):**
7. Implement async GDPR erasure job
8. Implement notification delivery (deferred)

### Frontend Worker Tasks (Cycle 28)
**Priority 1 (Must complete):**
1. Wire onboarding forms to API
2. Implement food logging form with submission
3. Implement today view with meal list

**Priority 2 (High value):**
4. Implement settings forms (profile, goals, preferences)
5. Implement GDPR export/erasure UI

**Priority 3 (Lower):**
6. Implement meal detail page
7. Add loading states and error handling

---

## 5) Success Criteria for Cycle 28

### Backend
- ✅ Auth signup with 409 duplicate check
- ✅ Auth login with security event logging
- ✅ Onboarding completion sets `onboarding_complete=true`
- ✅ Food logging create/edit/delete endpoints work
- ✅ GDPR export returns JSON with user data

### Frontend
- ✅ Onboarding forms submit to backend
- ✅ Food logging form creates entries
- ✅ Today view shows meals
- ✅ Settings pages are functional (not static)

### Integration
- ✅ No contract drift between frontend and backend
- ✅ All E2E tests pass for implemented flows

### Commits Expected
- Backend: 2–3 commits (auth, onboarding, logs)
- Frontend: 2–3 commits (onboarding, food logging)

---

## 6) Notes & Risks

### Notes
- This plan replaces the generic "run tests" pattern with concrete implementation tasks
- Each worker should receive this document as the authoritative task list
- Workers should reference this document when making implementation decisions

### Risks
- Text nutrition parsing may be inaccurate without ML (acceptable for MVP)
- Async GDPR erasure job may need additional infrastructure (deferred)
- Frontend API error handling may be incomplete without extensive testing

### Open Questions
1. Should nutrition parsing be server-side or client-side for MVP?
2. What's the timeout duration for GDPR erasure grace period?
3. Should we implement local storage queue now or defer to later phase?
