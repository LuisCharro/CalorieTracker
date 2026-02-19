# 04 — Agent Runbook (Test/Fix Loop)

Use this for AI agents working on backend/frontend quality and bug fixing.

## Standard Loop

1. Start clean local stack
- `/Users/luis/Repos/CalorieTracker_BackEnd/dev-scripts/restart-stack.sh`

2. Run backend smoke gate
- `/Users/luis/Repos/CalorieTracker_BackEnd/dev-scripts/smoke-auth-onboarding.sh`

3. Run backend tests
- `cd /Users/luis/Repos/CalorieTracker_BackEnd && npm test`

4. Run frontend E2E
- `cd /Users/luis/Repos/CalorieTracker_FrontEnd && npm run test:e2e`

5. If any check fails
- Identify root cause.
- Fix smallest safe scope.
- Rerun from step 1.

6. Stop only when all gates pass
- Smoke pass
- Backend tests pass
- Frontend E2E pass

## Required Agent Output

- What failed
- Root cause
- What changed
- Commands rerun
- Final pass/fail table

## Guardrails

- Do not skip failing tests.
- Do not mark complete with known crashes.
- Update stale E2E selectors in same PR when UI changes.
