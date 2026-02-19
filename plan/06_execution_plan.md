# Execution plan for CalorieTracker MVP (post-cycle 27)

## Context
- Cycle 27 just finished the automated stack (backend restart + smoke + npm test, frontend restart + Playwright). The backend now serves `/signup -> /onboarding` flows reliably; frontend E2E passes. The plan folder tracks every next-steps note, but the code repo itself still needs an actionable plan that keeps focus on ship-worthy features rather than tooling failures.

## Priorities
1. **Lock down the onboarding journey contracts** (finishing the `Signup -> Goals -> Preferences -> Summary` path). Document fields, validations, and expected API responses so backend/frontend stay aligned.
2. **Stabilize local-first test DB setup** (avoid the recurring `calorietracker_test` missing warning). Create the test database/migrations or script that ensures it exists before tests run so future automation has clean signal.
3. **Capture remaining product-decision gaps**: note open questions (e.g., offline data sync, user profile persistence) in the plan so we can assess what deserves follow-up research vs. implementation.

## Backend tasks
- [x] Confirm `calorietracker_test` schema mirrors production migrations (create a script `scripts/ensure_test_db.sh` or extend `dev-scripts/restart-stack.sh` to `createdb -w calorietracker_test`).
  - **Status:** ✅ Script exists at `backend/scripts/ensure_test_db.sh`
  - **Todo:** Integrate into `backend/dev-scripts/restart-stack.sh` to auto-run before tests
- [x] Add integration coverage for onboarding endpoints (`POST /signup`, `/onboarding/goals`, `/onboarding/preferences`) to smoke matrix.
  - **Status:** ✅ Basic smoke test exists at `backend/dev-scripts/smoke-auth-onboarding.sh`
  - **Coverage:** register, duplicate register, login, missing user login, patch preferences
  - **Todo:** Add goals and consents endpoints to smoke tests
- [ ] Audit data model against `plan/02_architecture_gdpr/26_FINAL_data_model...` and align any missing fields (e.g., tracking goals, macronutrient targets). Document gaps in `plan/02_architecture_gdpr/13_gaps_and_required_validations.md`.
- [ ] Support automated cleanup of the `.runtime` state (log rotation + `docker compose down`). Move these housekeeping steps into `frontend/dev-scripts/restart-stack.sh` and `backend/dev-scripts/restart-stack.sh` so future cycles start clean.

## Frontend tasks
- [x] Tighten the onboarding screens (goal selection, preference toggles, summary) to match the backend contract from the plan document; ensure the UI assertions reference the same fields.
  - **Status:** ✅ Verified - All onboarding endpoints are aligned
  - **Details:** See `/Users/luis/.openclaw/workspace/frontend-contract-alignment-summary.md`
- [x] Generate a `plan/02_architecture_gdpr/30_FRONTEND_COMPONENT_INVENTORY.md` (new doc) to list active screens/components and their API dependencies; use it to spot missing coverage.
  - **Status:** ✅ Created - Document generated at `plan/02_architecture_gdpr/30_FRONTEND_COMPONENT_INVENTORY.md`
- [ ] Add error-state mocks for the login/onboarding flows so Playwright can verify fallback experiences (`Plan/05_quality_automation/02_frontend_e2e_matrix.md` checklist).
  - **Status:** 🔄 In Progress - Basic error tests exist (duplicate signup, invalid login), need to expand coverage
  - **Existing:** `error-quality.spec.ts` tests preferences save failure
  - **Needed:** Network failures, backend unavailable scenarios, additional validation errors
- [ ] Update `plan/04_local_run_scripts/README.md` to mention the aggregator-root aware scripts (`backend/dev-scripts/restart-stack.sh`, `frontend/dev-scripts/restart-stack.sh`, `scripts/start_calorietracker.sh`). This keeps onboarding for future collaborators smooth.

## Workflow & Automation
- Continue running the free-dev-orchestrator cycle whenever there’s a clear batch of tasks. After this commit, the plan for backend+frontend should appear in the new file above, and further cycles can reference this plan note for context instead of logging failures.
- If automation finds a blocker (Docker, CLI hang), log it in `plan/05_quality_automation/04_agent_runbook.md` under a new section `## 2026-02-19 runner notes` so we track systemic issues separately.

## Next checkpoint
- After implementing the plan items above, update `plan/02_architecture_gdpr/28_FINAL_execution_readiness_checklist.md` with completion dates and rerun the orchestrator to validate the next backend/frontend iteration.