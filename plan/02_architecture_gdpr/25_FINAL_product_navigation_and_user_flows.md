# 25_FINAL — Product Navigation and User Flows

**Status:** Canonical planning baseline (replaces conflicting flow scope in 15/19 for execution)  
**Planning mode:** No code

---

## 1) Scope Lock (MVP vs Later)

## MVP (in scope)
- Auth: email/password (OAuth optional)
- Onboarding: goals, preferences, required consents, optional consents, completion gate
- Food logging: text input only
- Today dashboard + history list + entry edit/delete
- Settings: profile, goals, preferences, notifications, privacy
- GDPR rights: export + erasure request
- Partial offline UX: cached reads + queued draft sync

## Later (out of MVP)
- Voice input
- Weekly/monthly analytics screens
- Exercise tracking
- Social features
- Full multi-device local-first sync engine

---

## 2) Canonical User States and Route Guards

1. **Unauthenticated**
   - Allowed: `/`, `/login`, `/signup`, legal pages
   - Protected routes redirect to `/login`

2. **Authenticated, onboarding incomplete**
   - Guard key: `users.onboarding_complete = false`
   - Allowed: `/onboarding/*`, logout
   - Access to app routes redirects to onboarding

3. **Authenticated, onboarding complete**
   - Guard key: `users.onboarding_complete = true`
   - Allowed: `/log`, `/today`, `/history`, `/settings/*`
   - Onboarding routes redirect to `/today`

4. **Soft-deleted account**
   - Guard key: `users.is_deleted = true`
   - Session terminated; no protected access

---

## 3) MVP Navigation Map

- Public: `/`, `/login`, `/signup`, `/privacy`, `/terms`
- Onboarding:  
  `/onboarding/goals` → `/onboarding/preferences` → `/onboarding/consents` → `/onboarding/consents-optional` → `/onboarding/complete`
- App core:  
  `/log`, `/log/search`, `/log/confirm`, `/today`, `/today/meal/[id]`, `/history`, `/history/entry/[id]`
- Settings:  
  `/settings/profile`, `/settings/goals`, `/settings/preferences`, `/settings/notifications`, `/settings/privacy`, `/settings/gdpr/export`, `/settings/gdpr/delete`

**Meal detail identity rule (MVP):** `/today/meal/[id]` resolves to derived key `(date, meal_type)`; no separate persisted meal table in MVP.

---

## 4) Flow Contracts (Decision-Level)

1. **Signup/Login**
   - Create/validate auth identity
   - Ensure `users` profile row exists
   - Write `security_events` auth outcome

2. **Onboarding completion**
   - Save goal/preference inputs
   - Append consent records (required + optional)
   - Set `users.onboarding_complete=true` and timestamp

3. **Food logging**
   - Text input → deterministic nutrition parse/calc → optional confirm → insert `food_logs`
   - Log activity in `processing_activities`

4. **Edit/Delete entry**
   - Edit: update entry fields + timestamp
   - Delete: soft delete (`food_logs.is_deleted=true`)
   - Log activity in `processing_activities`

5. **GDPR export**
   - Create `gdpr_requests` (`access` or `portability`)
   - Deliver JSON export (CSV optional)

6. **GDPR erasure**
   - Create `gdpr_requests` (`erasure`)
   - Soft-delete user (`users.is_deleted=true`, `deleted_at`)
   - Final hard-delete/anonymize via retention job after grace period

---

## 5) Decisions, Assumptions, Risks, Open Questions

## Decisions
- Route gating depends only on explicit user lifecycle fields (not implicit client state).
- Voice and weekly/monthly analytics are deferred.
- GDPR request types use legal taxonomy (`access|portability|erasure|rectification`).

## Assumptions
- MVP remains single-product surface (no admin UI required yet).
- Notification settings require cross-device persistence.

## Risks
- Derived meal identity can become brittle if meal grouping rules evolve.
- Partial offline queues can create duplicate draft submissions if idempotency is not enforced.

## Open Questions (must close before build sprint)
1. OAuth in MVP or v1.1?
2. Exact grace-period duration before irreversible erasure?
3. Should optional consents default to explicit opt-out records or absent records?
