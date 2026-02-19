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