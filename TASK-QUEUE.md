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
Status: PENDING
- Add endpoint returning: startWeight/currentWeight/targetWeight/goalType/changeKg/remainingKg/progressPercent
- Cover edge cases (missing target, divide by zero)
- Build: npm run build (backend)

### W3 — Frontend API service wiring
Status: PENDING
- Add client service methods for weight logs and progress summary
- Build: npm run build (frontend)

### W4 — Today page progress card
Status: PENDING
- Add Weight Progress card on /today (loading/error/empty states)
- Transcript-independent and non-blocking
- Build: npm run build (frontend)

### W5 — Weight logging UI improvements
Status: PENDING
- Add/edit/delete weight entries flow and immediate progress refresh
- Build: npm run build (frontend)

### W6 — Validation pass
Status: PENDING
- End-to-end manual check: signup/onboarding -> log weight -> progress updates
- Update RUNLOG.md with evidence

## Rules
- Do not mark complete without build passing for touched app.
- Commit by slice with clear messages.
- Keep Notes/other features untouched in this initiative.
