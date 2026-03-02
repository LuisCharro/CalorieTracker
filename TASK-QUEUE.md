# CalorieTracker Task Queue — Weight Progress Initiative

## Active Goal
Implement weight progress tracking UX and API so users can track kg lost/gained over time.

## Pending Slices

### W1 — Verify weight logs schema + contracts
Status: COMPLETED
- ✅ Confirmed weight_logs supports date (logged_at)/weight (weight_value)/note (notes) and user scoping
- ✅ Added Zod validation schemas: createWeightLogSchema, updateWeightLogSchema, weightUnitSchema
- ✅ Build: npm run build (backend) - PASSED

### W2 — Progress aggregation API
Status: COMPLETED
- ✅ Added GET /api/weight-logs/progress endpoint
- Returns: startWeight/currentWeight/targetWeight/goalType/changeKg/remainingKg/progressPercent
- Edge cases handled: no logs, no target, divide by zero
- Build: npm run build ✓
- Commit: 3af7804

### W3 — Frontend API service wiring
Status: COMPLETED
- ✅ Added getProgress() method to weight-logs.service.ts (calls GET /api/weight-logs/progress)
- ✅ Exported WeightProgress type from services/index.ts
- ✅ Existing methods (getAll, getLatest, create, update, delete) are properly exported
- Build: npm run build ✓
- Commit: 2afdd74

### W4 — Today page progress card
Status: COMPLETED
- Add Weight Progress card on /today (loading/error/empty states)
- Transcript-independent and non-blocking
- Build: npm run build (frontend)
- Commit: 19efe4b

### W5 — Weight logging UI improvements
Status: COMPLETED
- ✅ Add new weight entry from the Today page (Quick Log Weight button + modal)
- ✅ Edit existing weight entries (edit modal on Settings/Weight page)
- ✅ Delete weight entries with confirmation (modal instead of browser confirm())
- ✅ Immediate refresh of progress after any change
- Build: npm run build (frontend)
- Commit: 0635df4

### W6 — Validation pass
Status: PENDING (MANUAL - requires Luis)
- End-to-end manual check: signup/onboarding -> log weight -> progress updates
- Update RUNLOG.md with evidence
- NOTE: This task requires manual testing by Luis, not autonomous execution

## Rules
- Do not mark complete without build passing for touched app.
- Commit by slice with clear messages.
- Keep Notes/other features untouched in this initiative.
