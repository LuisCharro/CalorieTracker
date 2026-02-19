# 11 — Codex Review Summary (Critical Audit)

**Date:** 2026-02-15  
**Scope audited:** 00–10 docs in this folder  
**Method:** Internal consistency review + targeted external verification (GDPR text, Vercel/Supabase docs, food data API docs)

---

## 1) Bottom Line

The pack is useful but **not execution-safe yet**. Main issues:

1. **Product/platform contradiction:** Source inspiration is an **iOS app**, but architecture recommendations are **web-first Next.js**.
2. **GDPR overconfidence:** Several sections treat legal interpretations as decided when they are not.
3. **Unverified provider claims:** Example: “Nutritionix has EU endpoints” appears unproven.
4. **Checklist quality drift:** Many checklist items are broad and not decision-forcing.
5. **Research-quality mismatch:** Early docs correctly mark uncertainty; later docs convert assumptions into recommendations without evidence.

---

## 2) Key Contradictions / Coherence Breaks

## A. iOS-first vs Next.js-first
- **Docs 01/02/03** repeatedly frame Amy as iOS-native and recommend iOS-first focus.
- **Docs 06/09/10** prescribe Next.js + Vercel + Supabase web architecture as primary build path.
- **Impact:** Team can waste weeks building the wrong client surface.

**Correction:** Decide explicitly:
- **Path M (mobile-native):** iOS app + minimal backend.
- **Path W (web-first):** Next.js app.

Do not keep both as “default.”

## B. MVP scope inconsistency
- Some docs say MVP = core logging only.
- Others include exercise logs, social features, analytics, OAuth breadth, complex GDPR UI from day 1.
- **Impact:** Scope creep disguised as compliance.

## C. Data sensitivity position drifts
- GDPR doc says food/calorie data “likely general personal data.”
- Same doc set designs controls as if special-category/health data might apply.
- **Correct framing:** Treat as **potentially health-revealing** and apply stricter controls by design while legal classification is pending.

---

## 3) External Verification Findings (Targeted)

## Verified facts

1. **GDPR Art. 9** prohibits processing special-category data (incl. health) unless an exception applies.  
   Source: GDPR Art. 9 text (gdpr-info mirror).

2. **GDPR Art. 33 breach rule is risk-based**, not absolute: notify authority within 72h **unless unlikely risk** to rights/freedoms.  
   Source: GDPR Art. 33 text.

3. **DPIA trigger is high-risk processing**, not automatic for all health/fitness apps. Large-scale special-category processing is one trigger.  
   Source: GDPR Art. 35 text.

4. **Vercel default function region for new projects is iad1 (US)** unless changed.  
   Source: Vercel functions region docs.

5. **Supabase project is single primary region**, with EU regions available.  
   Source: Supabase regions docs.

6. **USDA FoodData Central API:** requires API key, default rate limit ~1000 req/hour/IP, public-domain data.  
   Source: USDA API guide.

7. **Open Food Facts:** open/community data with explicit accuracy disclaimer.  
   Source: OFF API docs.

## Unverified / weak claims in current docs

- “Nutritionix has EU endpoints” → **not verified** in fetched docs.
- “D7 retention standard for calorie trackers is 20–30%” → no cited source in pack.
- “Can handle 10k–100k users” estimates in architecture docs → unsupported by load model.

---

## 4) Quality Issues by File Cluster

## Stronger files
- **04_risks_and_unknowns.md**: best realism on uncertainty.
- **05_next_research_questions.md**: useful prioritization, but still broad.

## Needs major correction
- **06_backend_architecture_options.md**: strong structure, but anchored to web stack without resolving product platform decision.
- **07_gdpr_for_calorietracker.md**: practical, but several legal statements too definitive.
- **09_recommended_stack_and_controls.md**: operationally detailed, but built on unclosed strategic decisions.
- **10_implementation_readiness_checklist.md**: long and thorough, but mixes must-have vs optional, causing false readiness.

---

## 5) Critical Corrections Required Before Build

1. Lock product surface (iOS-native vs web-first) in writing.
2. Freeze MVP to max 6–8 user-facing capabilities.
3. Classify data posture as “potentially health-revealing” and escalate legal review.
4. Replace speculative API/vendor statements with tested evidence.
5. Convert checklist to hard gates with pass/fail criteria.

---

## 6) Confidence Grading

- **High confidence:** Need for strict scope, hybrid parsing+database logic, cost-risk centrality, need for RLS and export/delete rights.
- **Medium confidence:** Supabase/Vercel suitability for early stage.
- **Low confidence:** Provider choices, exact retention/pricing benchmarks, legal classification details without counsel.

---

## 7) Recommended Immediate Action

Use docs 12–14 (added in this pass) as the corrected decision package. Treat old recommendations as draft material, not execution authority.