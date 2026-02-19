# 14 — Final Planning Brief for Execution

**Audience:** Luis (decision owner)  
**Purpose:** Convert research into an executable, gated 30-day plan.

---

## Executive Decision Snapshot

## What we can decide now (high confidence)

1. **Build web-first (responsive PWA with Next.js)** for v1; postpone store-native apps.
2. Use **deterministic nutrition pipeline** (parse → DB match → code math), not LLM-only calorie truth.
3. Use **EU-hosted primary data** and enforce user isolation via RLS.
4. Keep MVP narrow: fast logging, daily totals, history, export/delete.
5. Treat legal uncertainty as a gate, not a post-launch cleanup item.

## What must be validated before coding

1. Legal classification posture and lawful basis matrix.
2. Nutrition provider benchmark (accuracy/latency/cost/terms).
3. Unit economics at realistic usage levels.
4. End-to-end GDPR rights workflows (export/delete/consent withdrawal).

---

## Recommended Architecture

## Architecture v1 (recommended)

**Client:** Next.js web app (mobile-first responsive) + PWA installability  
**Backend:** Supabase in EU region + thin backend service for provider orchestration  
**Data flow:**
1. User entry (text/voice)
2. Parser (rule-based + optional model assistance)
3. Nutrition database/provider lookup
4. Deterministic nutrition calculation
5. User confirmation for low-confidence matches
6. Persist user-scoped log + audit event

**Controls:**
- RLS on all user data tables
- Immutable consent/event history
- Export/delete APIs tested before launch
- Explicit transfer inventory for all subprocessors

## Architecture v2 (fallback)

If PWA/web limitations block UX goals (background sync, deep native integrations):
- Add Capacitor wrapper first (max reuse of web code)
- Or evaluate React Native/Flutter for dedicated native clients
- Keep same backend/compliance posture
- Preserve deterministic nutrition logic

**Do not do by default:** full native rewrite before product/retention validation.

---

## 30-Day Phased Execution Plan (Research → Build)

## Phase 0 (Days 1–3): Decision Lock
- Finalize platform decision memo (web-first PWA, native deferred).
- Freeze MVP scope (include/exclude list).
- Define success KPIs and failure thresholds.

**Outputs:** signed scope memo + KPI sheet.

## Phase 1 (Days 4–10): Validation Sprint
- Legal consult on classification/lawful basis/DPIA need.
- Provider benchmark (2 candidates, 500–1000 realistic entries).
- Unit economics model (low/base/high scenarios).
- 10–20 user interviews on friction + willingness-to-pay.

**Outputs:** legal memo + benchmark report + economics model + interview synthesis.

## Phase 2 (Days 11–18): Compliance/Architecture Spec Finalization
- Finalize data model and RLS policy set.
- Draft privacy policy + processor register + retention policy.
- Specify GDPR flows (export/delete/objection/withdrawal) with acceptance tests.
- Finalize incident and breach response runbook.

**Outputs:** implementation spec pack ready for dev.

## Phase 3 (Days 19–30): Build-Prep and Pilot Readiness
- Create backlog with strict MVP boundaries.
- Define QA matrix: security, GDPR flows, accuracy checks.
- Prepare internal alpha test plan and instrumentation.
- Conduct Go/No-Go review.

**Outputs:** ready-to-build backlog + release gates + Go/No-Go decision.

---

## Go / No-Go Gate Criteria

## GO (all required)
1. Platform and MVP scope locked in writing.
2. Legal memo confirms acceptable compliance posture.
3. Provider benchmark meets thresholds:
   - acceptable accuracy on common foods
   - manageable ambiguity rate
   - cost/user supports pricing hypothesis
4. GDPR rights flows pass end-to-end tests.
5. Transfer map and processor list complete.

## NO-GO (any one triggers stop)
1. Legal classification unresolved or high-risk unresolved.
2. Unit economics fail target margin.
3. Provider accuracy too weak for trust.
4. MVP scope keeps expanding beyond agreed boundary.
5. Compliance flows are untested or failing.

---

## Fact / Inference / Assumption Summary

## Fact
- GDPR breach notification is risk-thresholded (Art. 33).
- Vercel defaults function region to US unless changed.
- Supabase supports EU single-primary-region deployment.

## Inference
- Health-adjacent food logging can be interpreted as health-revealing contextually.

## Assumption (must validate)
- Retention and willingness-to-pay are strong enough for subscription viability.

---

## Final Recommendation to Luis

Proceed only if you accept a **discipline-first build**:
- narrow MVP,
- legal gates before coding,
- deterministic nutrition accuracy over AI novelty,
- and explicit economics proof.

If you want speed at all costs, you can launch faster—but you will likely buy legal and trust debt immediately.