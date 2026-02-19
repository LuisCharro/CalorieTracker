# 24 — Final Reconciled MVP Schema and Flows

**Status:** Reconciled planning baseline for implementation kickoff  
**Architecture baseline:** Option A (Next.js + Supabase EU)  
**This document supersedes conflicting scope statements across 15/18/19/20 for MVP execution.**

---

## 1) Locked MVP Scope (Canonical)

## Included
- Auth (email/password; OAuth optional)
- Onboarding (welcome, goals, preferences, essential + optional consent, complete)
- Food logging (text input only)
- Today dashboard + daily history + entry edit/delete
- Settings (profile, goals, preferences, notifications, privacy)
- GDPR rights: export + delete + consent withdrawal
- Partial offline UX: cached reads + queued drafts/sync (not full offline nutrition DB)

## Excluded (v1.1+)
- Voice input
- Weekly/monthly analytics screens
- Exercise tracking
- Social features
- Full local-first sync architecture

---

## 2) Canonical MVP Schema (Reconciled)

## Required tables
1. `users`
2. `food_logs`
3. `goals`
4. `notification_settings`
5. `consent_history`
6. `gdpr_requests`
7. `processing_activities`
8. `security_events`

## Required fields (high-priority)

### `users`
- `id` (UUID PK; auth reference)
- `email`
- `display_name`
- `preferences JSONB`
- `onboarding_complete BOOLEAN DEFAULT FALSE`
- `onboarding_completed_at TIMESTAMPTZ NULL`
- `is_deleted BOOLEAN DEFAULT FALSE`
- `deleted_at TIMESTAMPTZ NULL`
- `created_at`, `last_login_at`

### `food_logs`
- `id`, `user_id`
- `food_name`, `brand_name`
- `quantity`, `unit`
- `nutrition JSONB` (contains calories + optional macros)
- `meal_type` (`breakfast|lunch|dinner|snack`)
- `logged_at`, `created_at`, `updated_at`
- `is_deleted BOOLEAN DEFAULT FALSE`

### `goals`
- `id`, `user_id`
- `goal_type` (`daily_calories` for MVP)
- `target_value`
- `is_active`
- `start_date`, `end_date`

### `notification_settings`
- `user_id` (PK/FK)
- `push_enabled`, `email_enabled`, `in_app_enabled`
- `reminder_times JSONB`
- `timezone`
- `updated_at`

### `consent_history` (append-only)
- `id`, `user_id`
- `consent_type` ENUM-like values: `privacy_policy`, `terms_of_service`, `analytics`, `marketing`
- `consent_given`, `consent_version`
- `metadata`, `created_at`

### `gdpr_requests`
- `id`, `user_id`
- `request_type`: `access|portability|erasure|rectification`
- `status`: `pending|processing|completed|rejected`
- `requested_at`, `completed_at`, `metadata`

### `processing_activities`
- `id`, `user_id`
- `activity_type`, `data_categories`, `purpose`, `legal_basis`
- `metadata`, `created_at`

### `security_events`
- `id`, `event_type`, `user_id`, `severity`
- `ip_hash`, `user_agent`, `details`, `created_at`

---

## 3) Canonical Flow-to-Data Contracts

1. **Signup/Login**
   - Create `users` row and auth identity.
   - Write `security_events` for auth outcomes.

2. **Onboarding complete gate**
   - Route guards depend only on `users.onboarding_complete`.
   - Consent steps append to `consent_history`.

3. **Log food**
   - Parse input -> deterministic nutrition calc -> optional confirm -> insert `food_logs`.
   - Log processing event in `processing_activities`.

4. **Edit/Delete food log**
   - Update or soft-delete `food_logs`.
   - Record processing event.

5. **GDPR export**
   - Create `gdpr_requests` (`access`/`portability`) and provide JSON export (CSV optional).

6. **GDPR delete**
   - Create `gdpr_requests` (`erasure`), set `users.is_deleted=true`, `deleted_at`.
   - Hard-delete/anonymize per retention job policy after grace period.

---

## 4) RLS/Access Baseline

- RLS enabled for all user-scoped tables.
- Policy pattern: `user_id = auth.uid()`.
- Service role only for background/admin operations.

---

## 5) Scalability Sanity (Now vs Later)

## Scale-ready now
- Indexed access by `(user_id, timestamp)` on logs/events.
- Append-only compliance/security records.
- Clear soft-delete + retention workflow.
- JSONB nutrition payload (extensible without schema churn).

## Defer until trigger
- `daily_summaries` precompute table (add only if p95 dashboard query >500ms).
- Server-side `food_database_cache` (add when API cost/latency justifies).
- Async queue infra beyond simple cron.

---

## 6) Required Fixes to Apply to Existing Docs

1. Replace `status='deleted'` examples with `is_deleted/deleted_at`.
2. Harmonize consent types and GDPR request types everywhere.
3. Remove voice/weekly from MVP sections in 15 where conflicting.
4. Mark local-first plan (20) as non-default track.
5. Add `onboarding_complete` fields explicitly in DB planning docs.

---

## 7) Fact / Inference / Assumption

- **Fact:** Current docs contain direct contradictions on MVP features and schema enums.  
- **Inference:** coding directly from current set risks incompatible API/db contracts.  
- **Assumption:** product owner accepts this reconciled baseline as the single source for sprint planning.

---

## 8) Final Coherence Verdict

## MVP is coherent?
**No (yet)** across source docs.

## Can it become coherent without redesign?
**Yes.**

## Required before coding starts
- Apply the 6 required fixes above and adopt this doc as canonical baseline.
