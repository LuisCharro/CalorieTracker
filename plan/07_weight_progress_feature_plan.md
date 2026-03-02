# 07 — Weight Progress Feature Plan (Detailed)

## Status
- **Created:** 2026-03-02
- **Owner:** AirClaw + Luis
- **Scope:** Add full "weight-loss progress" capability (data, API, UI, metrics)
- **Priority:** High (core value for users with lose/gain goals)

---

## 1) Current Situation (Confirmed)

Your current user already has onboarding profile data stored:

- `email`: `luisjchg@gmail.com`
- `date_of_birth`: `1980-04-21`
- `gender`: `male`
- `height_cm`: `188.0`
- `weight_kg`: `95.0`
- `activity_level`: `sedentary`
- `weight_goal`: `lose`
- `target_weight_kg`: `85.0`
- `onboarding_complete`: `true`

So yes, the **initial data exists** and is valid.  
What is missing is the full **progress-tracking experience** (logging, trend/progress metrics, and UI surfaces).

---

## 2) Product Goals

### Primary Goal
Enable users to track body-weight progress over time and understand progress toward a target.

### Secondary Goals
- Make progress visible from **Today** page.
- Keep flow simple enough for daily/weekly check-ins.
- Reuse existing onboarding fields as baseline.

### Non-Goals (v1)
- No medical recommendations.
- No advanced predictive coaching.
- No wearable integrations.

---

## 3) Functional Requirements

### FR-1: Weight Logging
- User can add a new weight entry:
  - `date` (default: today)
  - `weight` (kg, with future unit conversion support)
  - optional `note`
- User can edit/delete entries.

### FR-2: Progress Summary
Given a user with `weight_goal` + `target_weight_kg`, show:
- Start weight
- Current/latest weight
- Target weight
- Net change (kg)
- Remaining to target (kg)
- Progress percent

### FR-3: Goal-aware calculations
- `lose`: progress increases as weight goes down toward target
- `gain`: progress increases as weight goes up toward target
- `maintain`: progress shown as stability band (special behavior)

### FR-4: Visualization (v1 light)
- 7d and 30d trend summaries
- Simple line chart (optional in first delivery; cards first)

### FR-5: Home/TODAY integration
- A progress widget/card on `/today` with quick CTA:
  - “Log today’s weight”
  - “View full history”

---

## 4) Technical Design

## 4.1 Data Model

Assumed existing table: `weight_logs`.

If fields are missing, normalize to:
- `id UUID PK`
- `user_id UUID FK users(id)`
- `weight_kg NUMERIC(5,1) NOT NULL`
- `logged_at TIMESTAMPTZ NOT NULL`
- `note TEXT NULL`
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`

Indexes:
- `(user_id, logged_at DESC)`

## 4.2 Derived Metrics Logic

Definitions:
- `startWeight`:
  - earliest weight log, else fallback to `users.weight_kg`
- `currentWeight`:
  - latest weight log, else fallback to `users.weight_kg`
- `targetWeight`:
  - `users.target_weight_kg`

For `lose`:
- `totalNeeded = startWeight - targetWeight`
- `done = startWeight - currentWeight`
- `progress = clamp(done / totalNeeded, 0..1)`
- `remaining = currentWeight - targetWeight`

For `gain`:
- `totalNeeded = targetWeight - startWeight`
- `done = currentWeight - startWeight`
- `progress = clamp(done / totalNeeded, 0..1)`
- `remaining = targetWeight - currentWeight`

For `maintain` (v1):
- show deviation from baseline/current target rather than classic progress
- keep simpler UI text (e.g. “within ±X kg”)

Edge cases:
- missing target -> show setup CTA
- target equals start -> avoid divide-by-zero (show complete/neutral)

## 4.3 API Endpoints (v1)

- `POST /api/weights`
  - create weight entry
- `GET /api/weights?userId=...&from=...&to=...&page=...`
  - list entries
- `PATCH /api/weights/:id`
  - edit entry
- `DELETE /api/weights/:id`
  - delete entry
- `GET /api/weights/progress?userId=...`
  - aggregated progress payload

Progress response shape:
- `startWeight`
- `currentWeight`
- `targetWeight`
- `goalType`
- `changeKg`
- `remainingKg`
- `progressPercent`
- `lastUpdatedAt`
- `trend7d` (optional)
- `trend30d` (optional)

## 4.4 Frontend Pages/Components

### New/Updated
- `/today`:
  - add `WeightProgressCard`
- `/settings/weight` (or `/progress/weight`):
  - list + add/edit/delete logs
- shared components:
  - `WeightLogForm`
  - `WeightProgressSummary`

### UX behavior
- If no logs: prompt “Log your first weight”
- If goal missing: prompt to set target in profile/goals

---

## 5) Execution Plan (Phases)

## Phase 1 — Data & API Foundations
1. Verify `weight_logs` schema and migrations.
2. Add/adjust validation schemas.
3. Implement CRUD API for weight logs.
4. Implement progress aggregation endpoint.
5. Add backend tests for calculations and edge cases.

**Done when:** API supports full lifecycle and stable progress math.

## Phase 2 — UI Integration (MVP)
1. Create weight progress card on `/today`.
2. Create weight logs page/form.
3. Wire API service layer.
4. Add loading/empty/error states.

**Done when:** user can log weight and see meaningful progress values.

## Phase 3 — Polish
1. Add trend mini-chart.
2. Better copy for lose/gain/maintain modes.
3. Improve unit-system support (kg/lbs UI conversion).
4. E2E tests for full flow.

**Done when:** UX is clear and robust for daily use.

---

## 6) Acceptance Criteria (MVP)

- [ ] User with `weight_goal=lose` and target weight sees non-empty progress card.
- [ ] After adding a new lower weight, progress increases.
- [ ] Remaining kg decreases correctly.
- [ ] No divide-by-zero or NaN in UI.
- [ ] Empty states are user-friendly.
- [ ] Works after fresh signup + onboarding.

---

## 7) Risks / Notes

- Existing historical test data can distort analytics (already cleaned in local DB).
- Timezone/date handling must be consistent for `logged_at`.
- Maintain-goal semantics can be ambiguous; keep it simple in MVP.

---

## 8) Suggested Next Action (Now)

Implement **Phase 1 + Phase 2 (MVP)** immediately in current branch, then you test live:
1. Log a new weight in UI.
2. Confirm progress card updates on `/today`.
3. Validate numbers with your profile:
   - start: 95 kg
   - target: 85 kg
   - goal: lose

---

## 9) Definition of Success

Luis can answer, at a glance:
- “How much have I lost?”
- “How much remains to my target?”
- “Am I moving in the right direction?”

without manually calculating anything.
