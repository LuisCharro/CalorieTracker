# Execution plan for CalorieTracker MVP (post-cycle 39)

## Context
- Cycle 39 completed multi-item meal logging with full backend retrieval endpoints. 
- Cycle 38 implemented batch food log creation with frontend integration.
- Cycle 37 wired onboarding completion to correct backend endpoint.
- The stack is stable: backend (port 4000), frontend (port 3000), PostgreSQL (Docker).

## Priorities
1. **Multi-item meal logging** ✅ COMPLETE - Backend and frontend fully implemented
2. **Enhanced retrieval endpoints** ✅ COMPLETE - Today view, history grouping, meal-specific endpoints
3. **Test coverage** ✅ COMPLETE - 119 backend tests passing, 72 e2e tests passing

## Backend tasks
- [x] Confirm `calorietracker_test` schema mirrors production migrations
  - **Status:** ✅ COMPLETE - Script at `backend/scripts/ensure_test_db.sh`, integrated into restart-stack.sh
- [x] Add integration coverage for onboarding endpoints
  - **Status:** ✅ COMPLETE - Smoke test at `backend/dev-scripts/smoke-auth-onboarding.sh`
- [x] **Multi-item meal logging (Cycle 38-39)**
  - POST /api/logs/batch - Creates multiple food logs per meal
  - Returns complete item details (not just summary)
  - Supports partial failures with error details
- [x] **Enhanced retrieval endpoints (Cycle 39)**
  - GET /api/logs/today - Grouped by meal with item counts and totals
  - GET /api/logs?groupByMeal=true - History with meal grouping
  - GET /api/logs/meal/:mealType - Items for specific meal/date
  - All endpoints maintain insertion order and return calorie/protein totals
- [ ] Audit data model against `plan/02_architecture_gdpr/26_FINAL_data_model...` and align any missing fields
- [ ] Support automated cleanup of the `.runtime` state (log rotation + docker compose down)

## Frontend tasks
- [x] Tighten the onboarding screens to match backend contract
  - **Status:** ✅ COMPLETE
- [x] Generate frontend component inventory
  - **Status:** ✅ COMPLETE - Document at `plan/02_architecture_gdpr/30_FRONTEND_COMPONENT_INVENTORY.md`
- [x] **Multi-item log page (Cycle 38)**
  - Dynamic add/remove food items
  - Auto-parse nutrition from food descriptions
  - Offline support with queue integration
- [x] **Enhanced Today view (Cycle 38)**
  - Item count per meal
  - Numbered items with visual hierarchy
  - Offline/sync status indicators
- [ ] Add error-state mocks for login/onboarding flows (Playwright verification)
- [ ] Update `plan/04_local_run_scripts/README.md` with aggregator-root script documentation

## Test Coverage (Cycle 39)
- **Backend tests:** 119 passing
  - 12 logs-endpoints tests (newly enabled)
  - 15+ error attack tests for auth/onboarding
  - Batch endpoint tests with complete item validation
- **Frontend e2e tests:** 72 passing (Chromium, Firefox, WebKit)
- **Smoke tests:** All passing (register, login, preferences)

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/logs/batch | Create multiple items per meal |
| GET | /api/logs/today | Today's logs grouped by meal with totals |
| GET | /api/logs?groupByMeal=true | History with meal grouping |
| GET | /api/logs/meal/:mealType | Items for specific meal on date |

## Workflow & Automation
- Continue running orchestrator cycles for remaining tasks
- Track systemic issues in `plan/05_quality_automation/04_agent_runbook.md`

## Next checkpoint
- Audit data model against final data model document
- Implement remaining error-state mocks for e2e tests
- Add automated cleanup scripts for .runtime state