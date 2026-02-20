# Execution plan for CalorieTracker MVP (post-cycle 39)

## Context
- Cycle 39 completed multi-item meal logging with full backend/frontend integration.
- Cycle 38 implemented batch food log creation with frontend integration.
- Cycle 37 wired onboarding completion to correct backend endpoint.
- The stack is stable: backend (port 4000), frontend (port 3000), PostgreSQL (Docker).

## Cycle 39 Summary - Multi-Item Meal Logging Complete

### Backend (Commit `cbcb2e6`)
| Endpoint | Enhancement |
|----------|-------------|
| POST /api/logs/batch | Returns complete item details with totals |
| GET /api/logs/today | Groups by meal with itemCount, totalCalories, totalProtein |
| GET /api/logs?groupByMeal=true | History with meal grouping and mealTotals |
| GET /api/logs/meal/:mealType | Items for specific meal/date with totals |

### Frontend (Commit `0b9785b`)
| Component | Enhancement |
|-----------|-------------|
| Log Page | "Log & Add More" button, session counter, clear form |
| Today View | Delete with confirmation, auto-sync, 4-column summary |
| Types | MealGroup interface, BatchCreateFoodLogResponse with totals |

### Test Coverage
- **Backend:** 119 tests passing (+12 logs-endpoints)
- **Frontend E2E:** 102 tests passing (+10 multi-item-meal)

## Priorities
1. **Multi-item meal logging** ✅ COMPLETE - Backend and frontend fully implemented
2. **Enhanced retrieval endpoints** ✅ COMPLETE - Today view, history grouping, meal-specific endpoints
3. **Test coverage** ✅ COMPLETE - 119 backend tests, 102 e2e tests passing

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
  - GET /api/logs/meal/:mealType - Items for specific meal on date
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
- [x] **Enhanced Today view (Cycle 38-39)**
  - Item count per meal
  - Numbered items with visual hierarchy
  - Offline/sync status indicators
  - Delete functionality with confirmation
  - Auto-sync before loading data
- [x] **Continuous logging (Cycle 39)**
  - "Log & Add More" button for session-based logging
  - Clear form button
  - Session item counter
- [ ] Add error-state mocks for login/onboarding flows (Playwright verification)
- [ ] Update `plan/04_local_run_scripts/README.md` with aggregator-root script documentation

## Test Coverage (Cycle 39)
- **Backend tests:** 119 passing
  - 12 logs-endpoints tests (newly enabled)
  - 15+ error attack tests for auth/onboarding
  - Batch endpoint tests with complete item validation
- **Frontend e2e tests:** 102 passing (Chromium, Firefox, WebKit)
  - 10 new multi-item-meal tests
- **Smoke tests:** All passing (register, login, preferences)

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/logs/batch | Create multiple items per meal with complete details |
| GET | /api/logs/today | Today's logs grouped by meal with totals |
| GET | /api/logs?groupByMeal=true | History with meal grouping |
| GET | /api/logs/meal/:mealType | Items for specific meal on date |
| GET | /api/logs/:foodLogId | Single item by ID |
| POST | /api/logs | Create single item |
| PATCH | /api/logs/:foodLogId | Update item |
| DELETE | /api/logs/:foodLogId | Soft delete item |

## Workflow & Automation
- Continue running orchestrator cycles for remaining tasks
- Track systemic issues in `plan/05_quality_automation/04_agent_runbook.md`

## Next checkpoint
- Audit data model against final data model document
- Implement remaining error-state mocks for e2e tests
- Add automated cleanup scripts for .runtime state