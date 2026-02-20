# 13 — Gaps and Required Validations

**Purpose:** Explicitly list what is unknown, why it matters, and what evidence closes each gap.

---

## Gap Register (Blocking First Build)

| ID | Gap | Why it matters | Required validation | Owner | Exit criterion |
|---|---|---|---|---|---|
| G1 | Product surface unresolved (iOS vs web-first) | Drives architecture, cost, timeline | Written decision memo | Founder/Product | One selected path, other deferred |
| G2 | Data classification uncertainty (general vs special-category in context) | Impacts lawful basis, consent model, DPIA need | Legal counsel review + documented rationale | Legal | Signed memo + policy text |
| G3 | Nutrition provider suitability unproven | Accuracy, cost, legal transfer exposure | 2-provider benchmark (accuracy/latency/cost/ToS) | Engineering | Benchmark report + chosen provider |
| G4 | Per-user unit economics unknown | Can destroy margins quickly | 30-day cost model with conservative usage assumptions | Product/Finance | Gross margin target defined and feasible |
| G5 | Retention assumptions not evidence-backed | Prevents realistic forecast | 10–20 user interviews + prototype diary test | Product/Research | Documented retention risk profile |
| G6 | GDPR rights operational flow not tested | Legal failure at launch | End-to-end dry runs: export/delete/consent withdrawal | Engineering/Compliance | Test logs + pass checklist |
| G7 | Cross-border transfer map incomplete | Hidden GDPR exposure | Processor-by-processor transfer inventory | Compliance | Complete RoPA + transfer register |

---

## Fact / Inference / Assumption Ledger

## Fact (verified)
- GDPR Art. 33 breach notification is required within 72h unless breach unlikely to risk rights/freedoms.
- Vercel function default region is US (`iad1`) for new projects unless configured.
- Supabase projects are deployed to one primary region; EU regions exist.
- USDA API has key + rate-limit constraints.
- Open Food Facts data has explicit reliability disclaimers.

## Inference (reasonable but not final)
- Food logs can become health-revealing in practical context.
- Deterministic calorie pipeline will outperform LLM-only approach for trust.

## Assumption (must validate)
- Chosen provider can meet accuracy/latency/cost targets at scale.
- Expected retention and willingness-to-pay are sufficient.
- Current checklist effort fits actual team capacity.

---

## Required Validation Plan (14 days)

## Workstream A — Legal/compliance validation
1. Confirm classification logic with counsel.
2. Confirm lawful bases per processing purpose.
3. Confirm if DPIA required at MVP scope.
4. Confirm age threshold policy by target market.

**Deliverables:** signed legal memo + revised privacy matrix.

## Workstream B — Provider and economics validation
1. Run 500–1000 query dataset through two nutrition pipelines.
2. Measure:
   - match accuracy
   - ambiguous-match rate
   - p95 latency
   - cost per request
3. Build monthly cost scenarios (low/base/high usage).

**Deliverables:** benchmark report + selected provider + kill criteria.

## Workstream C — User/problem validation
1. Interview 10–20 active calorie trackers.
2. Prototype test on logging speed and correction burden.
3. Capture objections to subscription pricing.

**Deliverables:** evidence-backed MVP value proposition.

---

## Hard Stop Conditions (No build until resolved)

1. No signed decision on product surface.
2. No legal sign-off on data-classification posture.
3. No provider benchmark with acceptable economics.
4. No tested GDPR rights flow.

---

## Minimum Evidence Pack Before Coding

- Decision memo (platform + scope)
- Legal memo (classification + lawful bases + DPIA status)
- Provider benchmark + unit economics model
- MVP requirements doc with accepted non-goals
- Go/No-Go sheet signed by owner

---

## Notes on Existing Docs

Current docs are strong on breadth but weak on enforceable evidence gates. This file replaces broad “to-do” language with objective pass/fail closure conditions.
---

## Data Model Audit (2026-02-20)

**Source:** Comparison of `src/db/schema.sql` + migrations against `26_FINAL_data_model_and_database_plan_local_first.md`

### Tables Verified

| Table | Plan Fields | Actual | Status |
|-------|-------------|--------|--------|
| users | id, email, display_name, preferences, onboarding_complete, onboarding_completed_at, is_deleted, deleted_at, created_at, last_login_at | All present + password_hash | PASS |
| food_logs | id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at, is_deleted | All present | PASS |
| goals | id, user_id, goal_type, target_value, is_active, start_date, end_date | All present + created_at, updated_at | PASS |
| notification_settings | id, user_id, channels, reminder_times, timezone, updated_at | All present | PASS |
| consent_history | id, user_id, consent_type, consent_given, consent_version, metadata, created_at | All present | PASS |
| gdpr_requests | id, user_id, request_type, status, requested_at, completed_at, metadata | All present | PASS |
| processing_activities | id, user_id, activity_type, data_categories, purpose, legal_basis, metadata, created_at | All present | PASS |
| security_events | id, event_type, severity, user_id, ip_hash, user_agent, details, created_at | All present | PASS |

### Indexes Verified

All required indexes from plan are implemented:
- `food_logs(user_id, logged_at DESC, is_deleted)`
- `food_logs(user_id, meal_type, logged_at DESC)`
- `goals(user_id, is_active, goal_type)`
- `consent_history(user_id, consent_type, created_at DESC)`
- `gdpr_requests(user_id, request_type, status, requested_at DESC)`
- `notification_settings(user_id)` unique

### Discrepancies Found

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| DM1 | `users.password_hash` column not in plan | Low | Document in plan - required for auth |
| DM2 | `notifications` table (migration 0004) not in plan | Low | Document in plan - used for in-app notifications |
| DM3 | No ENUM constraints on consent_type, request_type, status | Medium | Add CHECK constraints for data integrity |
| DM4 | Retention timing not enforced in code | Medium | Add retention job for soft-deleted records |
| DM5 | Erasure grace period defaults to 30 days | Low | Document in plan as configurable |

### Soft-Delete Semantics

- `is_deleted` + `deleted_at` pattern correctly implemented
- GDPR erasure job respects grace period (configurable via `GDPR_ERASURE_GRACE_PERIOD_DAYS`)
- Security events are anonymized (user_id = NULL) rather than deleted for audit compliance

### TypeScript Enum Alignment

`src/shared/enums.ts` correctly defines:
- `ConsentType`: privacy_policy, terms_of_service, analytics, marketing
- `GDPRRequestType`: access, portability, erasure, rectification
- `GDPRRequestStatus`: pending, processing, completed, rejected
- `GoalType`: daily_calories

### Action Items

1. Add CHECK constraints for enum fields in schema (DM3)
2. Implement retention policy job for soft-deleted records (DM4)
3. Update plan doc 26 to include password_hash and notifications table (DM1, DM2)
