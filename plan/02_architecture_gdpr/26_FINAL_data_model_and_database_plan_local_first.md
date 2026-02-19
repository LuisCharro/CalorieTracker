# 26_FINAL — Data Model and Database Plan (Local-First, Cloud-Portable)

**Status:** Canonical data planning baseline  
**Planning mode:** No code

---

## 1) Baseline Strategy

- **MVP runtime posture:** local-first UX (cached reads + queued writes) with cloud-ready contracts.
- **Portability target:** schema and API contracts remain compatible with hosted Postgres (Supabase EU) when moving to external beta/production.
- **Single source of truth for semantics:** this document + doc 25 flow contracts.

---

## 2) Canonical MVP Tables (Required)

1. `users`
2. `food_logs`
3. `goals`
4. `notification_settings`
5. `consent_history` (append-only)
6. `gdpr_requests`
7. `processing_activities` (append-only)
8. `security_events` (append-only)

## Core field decisions

### `users`
- `id`, `email`, `display_name`, `preferences`
- `onboarding_complete` (required explicit guard field)
- `onboarding_completed_at`
- `is_deleted`, `deleted_at`
- `created_at`, `last_login_at`

### `food_logs`
- Identity + ownership: `id`, `user_id`
- Content: `food_name`, `brand_name`, `quantity`, `unit`, `meal_type`
- Nutrition: `nutrition` JSON object (calories required, macros optional)
- Time/audit: `logged_at`, `created_at`, `updated_at`, `is_deleted`

### `goals`
- `id`, `user_id`, `goal_type`, `target_value`, `is_active`, `start_date`, `end_date`
- MVP `goal_type`: `daily_calories`

### `notification_settings`
- One row per user: channels, reminder times, timezone, updated timestamp

### `consent_history`
- Required consent types in MVP: `privacy_policy`, `terms_of_service`, `analytics`, `marketing`
- `consent_given`, `consent_version`, `metadata`, `created_at`

### `gdpr_requests`
- `request_type`: `access|portability|erasure|rectification`
- `status`: `pending|processing|completed|rejected`
- request/completion timestamps + metadata

### `processing_activities`
- `activity_type`, `data_categories`, `purpose`, `legal_basis`, `metadata`, `created_at`

### `security_events`
- `event_type`, `severity`, `user_id`, `ip_hash`, `user_agent`, `details`, `created_at`

---

## 3) Explicit MVP Exclusions (Data Layer)

- `exercise_logs`
- `weight_logs` (optional later)
- `daily_summaries` precompute table (only on measured perf trigger)
- `food_database_cache` server table (only on external API cost/latency trigger)
- Broad consent types (`social`, `ai`, `third_party_food_db`) without corresponding features

---

## 4) Indexing and Access Control Baseline

## Required indexes
- `food_logs(user_id, logged_at DESC, is_deleted)`
- `food_logs(user_id, meal_type, logged_at DESC)`
- `goals(user_id, is_active, goal_type)`
- `consent_history(user_id, consent_type, created_at DESC)`
- `gdpr_requests(user_id, request_type, status, requested_at DESC)`
- `notification_settings(user_id)` unique

## Access baseline
- User-scoped data must enforce owner-only access.
- Background/compliance operations run through privileged service context only.

---

## 5) Local-First to Cloud Portability Rules

1. No business logic depends on engine-specific features that block Postgres migration.
2. IDs, enums, timestamps, and soft-delete semantics remain identical across local and cloud modes.
3. JSON nutrition contract is immutable at API boundary (forward-compatible keys allowed).
4. Consent and GDPR taxonomies are fixed and shared across frontend/backend/storage.

---

## 6) Decisions, Assumptions, Risks, Open Questions

## Decisions
- Nutrition model is JSON-based (no duplicated scalar macro columns in MVP).
- Soft-delete canonical fields are `is_deleted` + `deleted_at`.
- Notifications are persisted server-side for cross-device consistency.

## Assumptions
- MVP write volume remains low enough for non-partitioned tables.
- Local-first queue conflict resolution can be handled with simple idempotency keys.

## Risks
- JSON nutrition flexibility can drift without strict contract tests.
- GDPR workflow timing can fail if async job handling is under-specified.

## Open Questions
1. Is rectification user-facing in MVP UI or internal/admin-only path?
2. What exact retention windows apply to logs vs compliance records?
3. Do we need immutable event signatures for audit-strength evidence at MVP stage?
