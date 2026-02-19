# 22 — Navigation → Database Matrix (Reconciled MVP)

**Purpose:** Explicit mapping from screen/flow to actions, entities, key fields, and API/use-cases.  
**Baseline used:** Reconciled MVP (Option A: Next.js + Supabase EU).

---

## 1) Canonical MVP Entities (Required)

- `users`
- `food_logs`
- `goals`
- `consent_history`
- `gdpr_requests`
- `processing_activities`
- `security_events`
- `notification_settings` *(added to close settings gap)*

Optional in MVP (defer unless triggered):
- `weight_logs`
- `food_database_cache` (server-side cache; local IndexedDB cache can exist without table)
- `daily_summaries` (only if query perf trigger hit)
- `exercise_logs`

---

## 2) Screen-to-Data Matrix

| Screen | Primary Actions | Entities/Tables | Key Fields | API / Use-case |
|---|---|---|---|---|
| `/signup` | Create account | `auth.users`, `users` | `id,email,created_at,onboarding_complete=false` | `POST /api/auth/register`, profile sync hook |
| `/login` | Authenticate | `auth.users`, `security_events` | `event_type=auth_success/auth_failure` | `POST /api/auth/login` |
| `/onboarding/goals` | Set/skip goal | `goals` | `user_id,goal_type='daily_calories',target_value,is_active` | `POST /api/goals` / upsert |
| `/onboarding/preferences` | Save units/lang/timezone | `users` | `preferences.units/language/timezone` | `PATCH /api/users/preferences` |
| `/onboarding/consents` | Accept privacy + terms | `consent_history`, `users` | `consent_type in ('privacy_policy','terms_of_service')`, `onboarding_complete` later | `POST /api/consents` |
| `/onboarding/consents-optional` | opt-in/out analytics/marketing | `consent_history` | `consent_type in ('analytics','marketing')` | `POST /api/consents` |
| `/onboarding/complete` | finalize onboarding | `users` | `onboarding_complete=true,onboarding_completed_at` | `PATCH /api/users/onboarding/complete` |
| `/log` | add food entry | `food_logs`, `processing_activities` | `food_name,quantity,unit,nutrition,meal_type,logged_at` | `POST /api/food/log` |
| `/log/search` | search foods | local cache + external API (+ optional `food_database_cache`) | `query,source,nutrition` | `POST /api/food/search` |
| `/log/confirm` | confirm low confidence parse | `food_logs` | parsed item set + confidence metadata | `POST /api/food/log` (with confirmed payload) |
| `/today` | read today totals | `food_logs`,`goals` | date-filtered logs, active calorie goal | `GET /api/stats/daily` |
| `/today/meal/[id]` | read/edit meal subset | `food_logs` | route should map to `(date,meal_type)` OR stable `meal_group_id` | `GET/PATCH /api/food/logs?...` |
| `/history` | list past days and entries | `food_logs` | `logged_at`, derived totals | `GET /api/food/logs?from&to` |
| `/history/entry/[id]` | edit/delete entry | `food_logs`,`processing_activities` | `id,quantity,nutrition,meal_type,logged_at,is_deleted` | `PATCH /api/food/log/:id`, `DELETE /api/food/log/:id` |
| `/settings/profile` | edit profile | `users` | `display_name,email,avatar_url` | `PATCH /api/users/profile` |
| `/settings/goals` | update targets | `goals` | active goal row + history rows | `GET/POST/PATCH /api/goals` |
| `/settings/preferences` | update app prefs | `users` | `preferences.theme/units/language` | `PATCH /api/users/preferences` |
| `/settings/notifications` | set reminder channels/times | `notification_settings` | `push_enabled,email_enabled,in_app_enabled,reminder_times,timezone` | `GET/PATCH /api/settings/notifications` |
| `/settings/privacy` | withdraw consent | `consent_history` | append-only state changes | `POST /api/consents` |
| `/settings/gdpr/export` | request export | `gdpr_requests`,`processing_activities` | `request_type='access'/'portability',status` | `POST /api/gdpr/export`, `GET /api/gdpr/export/:id` |
| `/settings/gdpr/delete` | request erasure | `gdpr_requests`,`users`,`security_events` | `request_type='erasure',is_deleted,deleted_at` | `POST /api/gdpr/delete` |

---

## 3) Missing Fields / Indexes Identified

## Required field additions
1. `users.onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE`
2. `users.onboarding_completed_at TIMESTAMPTZ NULL`
3. `users.is_deleted BOOLEAN NOT NULL DEFAULT FALSE`, `users.deleted_at TIMESTAMPTZ NULL` (canonical soft delete)
4. `notification_settings` table (or strict JSON schema under `users.preferences`)

## Required enum harmonization
- `consent_history.consent_type` must include: `privacy_policy`, `terms_of_service`, `analytics`, `marketing`.
- `gdpr_requests.request_type` must be legal taxonomy: `access`, `portability`, `erasure`, `rectification`.

## Required indexes
- `food_logs(user_id, logged_at DESC, is_deleted)`
- `food_logs(user_id, meal_type, logged_at DESC)`
- `goals(user_id, is_active, goal_type)`
- `consent_history(user_id, consent_type, created_at DESC)`
- `gdpr_requests(user_id, request_type, status, requested_at DESC)`
- `notification_settings(user_id)` UNIQUE

---

## 4) Unnecessary MVP Complexity to Remove

1. `exercise_logs` in MVP schema (not backed by MVP screens).  
2. `daily_summaries` pre-aggregation before real perf trigger.  
3. Broad consent types (`social`, `ai`, `third_party_food_db`) before related features exist.  
4. Full local-first migration track as default when cloud-first is selected.

---

## 5) Fact / Inference / Assumption Notes

- **Fact:** Screen docs require onboarding route guards and GDPR screens.  
- **Inference:** explicit onboarding + request tracking fields are mandatory in DB schema.  
- **Assumption:** reminder settings are stored server-side (if product needs cross-device consistency). Validate during API contract review.
