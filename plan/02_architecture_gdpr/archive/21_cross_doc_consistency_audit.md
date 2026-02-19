# 21 — Cross-Document Consistency Audit (Frontend ↔ Backend ↔ DB ↔ Hosting ↔ GDPR)

**Date:** 2026-02-15  
**Audited docs:** 06, 07, 09, 10, 14, 15, 16, 17, 18, 19, 20  
**Scope:** Planning consistency only (no code)

---

## 1) Audit Method

For each inconsistency:
- **Fact** = directly stated in docs
- **Inference** = logical conclusion from facts
- **Assumption** = uncertain item requiring validation
- **Severity** = Critical / High / Medium / Low
- **Impact** = concrete project risk
- **Exact Fix** = document-level reconciliation action

---

## 2) Executive Findings

- **Current coherence status:** **NO** (not yet coherent for coding)
- Main problem pattern: the docs mix **three different planning baselines**:
  1. narrow MVP (14, parts of 19)
  2. feature-rich MVP (15, parts of 18/09/10)
  3. local-first demo track (20)
- Result: schema and flow definitions conflict on critical items (onboarding flags, consent types, GDPR request enums, feature scope).

---

## 3) Issues Register

## Issue C1 — MVP scope mismatch (voice, offline, weekly)
**Fact:**
- 19 says voice input is v1.1 (not MVP) and weekly/monthly are v1.1.
- 15 includes text/voice in core daily flow and includes `/history/weekly` in main hierarchy.
- 10 checklist says MVP exclusions include offline, while 15/19 include partial offline in MVP.

**Inference:** MVP scope is not frozen; implementation backlog will diverge by contributor.

**Assumption:** Product owner has not yet signed a single MVP definition.

**Severity:** **Critical**  
**Impact:** Rework, missed timeline, test-plan ambiguity.

**Exact Fix:**
1. Declare one canonical MVP scope in 24.
2. Update 15, 19, 10 to identical statements:
   - Voice: v1.1
   - Weekly/monthly history: v1.1
   - Offline: partial MVP (cache + queued draft sync), not full offline nutrition DB.

---

## Issue C2 — `users` schema missing required navigation fields
**Fact:**
- 15/19 require `onboarding_complete` (and completion timestamp) for route guards.
- 18 core `users` schema does not include `onboarding_complete`.
- 20 MVP users table does not include `onboarding_complete` either.

**Inference:** Navigation guards cannot be implemented deterministically from current schema.

**Assumption:** Team intended to store onboarding state inside `preferences` JSON but did not standardize it.

**Severity:** **Critical**  
**Impact:** Broken auth/onboarding redirects; inconsistent UX.

**Exact Fix:** Add explicit columns in canonical schema:
- `onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE`
- `onboarding_completed_at TIMESTAMPTZ NULL`

---

## Issue C3 — Consent taxonomy mismatch
**Fact:**
- Onboarding requires consent records for `privacy_policy` and `terms_of_service` plus optional `analytics`/`marketing` (15/19).
- 18/20 consent schemas list types like `marketing`, `analytics`, `social`, `ai`, `third_party_food_db`, but do not consistently include `privacy_policy` and `terms_of_service`.

**Inference:** essential legal acceptance may not be auditable in the consent ledger.

**Assumption:** some teams may treat terms/privacy acceptance outside `consent_history`.

**Severity:** **Critical**  
**Impact:** compliance evidence gap during legal/audit review.

**Exact Fix:** Canonical `consent_history.consent_type` set must include:
`privacy_policy`, `terms_of_service`, `analytics`, `marketing` (MVP). Others post-MVP.

---

## Issue C4 — `gdpr_requests.request_type` mismatch
**Fact:**
- 15 uses request types like `export` and `delete`.
- 18/20 define enum as `access`, `erasure`, `portability`, `rectification`.

**Inference:** API layer and DB constraints will conflict at runtime.

**Assumption:** product wants user-friendly verbs but DB stores legal terms.

**Severity:** **High**  
**Impact:** failed inserts, broken GDPR workflow tracking.

**Exact Fix:** Standardize DB enum to legal terms only and map endpoints:
- export JSON/CSV => `access` and/or `portability`
- account delete => `erasure`
- profile corrections => `rectification`

---

## Issue C5 — Account deletion field mismatch (`status` vs `is_deleted`)
**Fact:**
- 15/19 deletion flow examples update `users.status = 'deleted'`.
- 18/20 schemas use `is_deleted` and `deleted_at`, no `status` field.

**Inference:** delete workflow pseudocode is incompatible with schema.

**Severity:** **High**  
**Impact:** incorrect implementation guidance; potential dead code path.

**Exact Fix:** Replace all deletion examples with canonical soft-delete fields:
`is_deleted=true`, `deleted_at=NOW()`.

---

## Issue C6 — Data model fragmentation for nutrition fields
**Fact:**
- 18 has two patterns in same doc: explicit nutrition columns (`calories`, `protein`, etc.) and separate JSONB `nutrition` model in later sections.
- 20 uses JSON text/JSONB-style nutrition object.
- 19 screen flows reference direct calories and per-item nutrient edits.

**Inference:** no single source of truth for food log structure.

**Severity:** **High**  
**Impact:** migration churn, API contract instability.

**Exact Fix:** Choose one MVP model. Recommended: JSONB `nutrition` + generated/derived calorie accessor in API, not duplicated scalar nutrient columns.

---

## Issue C7 — Export format conflict
**Fact:**
- 19 says MVP export formats: CSV only (JSON in v1.1).
- 15 and 07 describe JSON/CSV as MVP rights implementation.

**Inference:** GDPR “machine-readable” portability implementation target is unclear.

**Severity:** **Medium**  
**Impact:** scope confusion and legal ambiguity.

**Exact Fix:** Set MVP export to **JSON required**, CSV optional (nice-to-have). Update 19 accordingly.

---

## Issue C8 — Local-first track conflicts with selected cloud-first architecture
**Fact:**
- 14, 16, 09 recommend Option A (Next.js + Supabase EU) as primary MVP path.
- 20 is a full local-first SQLite master plan and marks itself as demo baseline.

**Inference:** Two incompatible execution tracks coexist without decision boundary.

**Severity:** **Medium**  
**Impact:** wasted planning and migration complexity if both are treated as active.

**Exact Fix:** Position 20 as **contingency/prototyping appendix**; 24 must define Supabase/Postgres as implementation baseline.

---

## Issue C9 — Screen/table justification gaps
**Fact:**
- `/settings/notifications` requires reminder times and channels; no explicit normalized table in core schemas.
- `/today/meal/[id]` exists while “Meal” is documented as virtual derived entity.

**Inference:** route contracts are under-specified.

**Severity:** **Medium**  
**Impact:** API ambiguity, UI inconsistency.

**Exact Fix:**
- Add `notification_settings` table (or explicitly store in `users.preferences` with fixed schema contract).
- Define meal detail route key as derived tuple `(date, meal_type)` or add persisted `meal_group_id`.

---

## Issue C10 — Hosting cost statements inconsistent at MVP phase
**Fact:**
- 17 says production MVP recommended Vercel Pro + Supabase Pro (~€40/mo).
- Same doc also states free-tier MVP can be €0.

**Inference:** recommendation is unclear: paid-from-day-1 vs free-until-trigger.

**Severity:** **Low**  
**Impact:** planning/budget confusion.

**Exact Fix:** add explicit rule: start free tier for private alpha; move to paid at first external beta or when limits/compliance ops require backups.

---

## 4) Required Fixes Before Coding (Blocking)

1. Freeze MVP scope and update 15/19/10 to match exactly.  
2. Canonicalize users, consent, GDPR request enums, delete fields.  
3. Canonicalize food log nutrition structure.  
4. Resolve local-first vs cloud-first track (one active baseline).  
5. Specify missing contracts for notifications + meal detail identity.

---

## 5) Final Verdict

## MVP is coherent?
**No.**

### Minimum required fixes before coding
- C1, C2, C3, C4, C5, C6 (**must-fix**)
- C9 (**must-fix for API design clarity**)
- C7/C8/C10 (**should-fix in planning docs before sprint planning**)
