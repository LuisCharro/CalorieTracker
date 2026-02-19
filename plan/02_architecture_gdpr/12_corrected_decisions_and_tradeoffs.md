# 12 — Corrected Decisions and Tradeoffs

**Purpose:** Replace ambiguous recommendations with explicit decision points.

---

## Decision 1 — Product Surface (Non-negotiable)

## Fact
- Amy reference product is iOS-native.
- Current architecture docs default to Next.js web-first.

## Inference
- Current pack mixes two product strategies and will cause execution drift.

## Decision
- **Primary v1 decision:** Build **iOS-first client**.
- **Backend choice for iOS:** Supabase (EU region) + thin service layer for nutrition provider orchestration.

## Tradeoff
- Slower web reach, faster fit with original user behavior and monetization patterns.

---

## Decision 2 — Data Handling Posture

## Fact
- GDPR Art. 9 includes health data; diet/weight context can become health-revealing.

## Inference
- Even if legal classification starts as general personal data, regulator view may tighten based on feature design and inference risk.

## Decision
- **Engineering posture:** Treat user logs as **sensitive-by-design** from day 1.

## Tradeoff
- Slightly more implementation overhead, materially lower legal/brand risk.

---

## Decision 3 — Nutrition Intelligence Architecture

## Fact
- LLM-only calorie estimation has hallucination risk.
- Structured nutrition databases are available (USDA/OFF, etc.) with known constraints.

## Decision
- **Use deterministic pipeline:**
  1. Parse user input (rules/LLM-lite)
  2. Match to structured food DB
  3. Do all arithmetic in deterministic code
  4. Require user confirmation on low-confidence matches

## Tradeoff
- Slightly higher implementation complexity vs much better trust/safety.

---

## Decision 4 — Vendor/Region Controls

## Fact
- Vercel defaults to US function region unless configured.
- Supabase supports EU regions.

## Decision
- If Vercel used at all, set explicit EU function regions and document transfer map.
- Keep personal data persistence in EU-hosted data stores.
- Create transfer inventory for every processor before launch.

## Tradeoff
- Some operational overhead; avoids hidden cross-border exposure.

---

## Decision 5 — MVP Scope Freeze

## Include in MVP
1. Auth (email or Apple Sign-In)
2. Manual + natural-language food logging
3. Daily totals (calories; optional basic macros)
4. History view + edit/delete entries
5. Data export (machine-readable)
6. Account deletion flow

## Exclude from MVP
- Social features
- Photo recognition
- Exercise tracking
- Advanced recommendations
- Marketing automations

## Tradeoff
- Less launch novelty, higher chance of reliable first release.

---

## Decision 6 — KPI Set for First 30 Days

## Leading indicators (must track)
- Time-to-log median (target ≤10s for common entries)
- Log completion success rate
- D1/D7 retention
- Error rate for food match ambiguity
- Cost per active user (API + infra)

## Why
Without these metrics, pricing and architecture decisions remain guesswork.

---

## Decision 7 — Legal Statements Policy

All legal-sensitive statements in specs must be labeled:
- **Fact (source cited)**
- **Inference (internal interpretation)**
- **Needs legal review**

Any statement that drives compliance implementation and lacks source/counsel sign-off is blocked.

---

## Corrected Architecture Choices

## Recommended v1 (for immediate build prep)
- **Client:** iOS native
- **Backend:** Supabase (EU) + thin API service (only where needed)
- **Data model:** User-scoped logs + immutable compliance events
- **Security:** RLS + strict server-side validation + audit trail

## Fallback v2 (if velocity or staffing forces change)
- Cross-platform client (React Native/Flutter)
- Keep same backend and compliance posture
- Do not switch to full web-first unless strategy explicitly changes

---

## Rejected/Deferred Choices

1. Full Next.js web-first as default (strategy misalignment)
2. LLM-as-source-of-truth calories
3. “Ship now, legal later” for GDPR-critical flows
4. Multi-provider complexity before first usage evidence

---

## Summary
The corrected plan is stricter and less glamorous: **iOS-first, deterministic nutrition, EU-first data controls, legal uncertainty explicitly gated, and hard scope discipline.**