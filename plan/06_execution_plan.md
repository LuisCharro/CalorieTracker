# Execution plan for CalorieTracker MVP (post-cycle 40)

## Context
- Cycle 40 completed error simulation infrastructure and test coverage expansion.
- Cycle 39 completed multi-item meal logging with full backend/frontend integration.
- Cycle 38 implemented batch food log creation with frontend integration.
- Cycle 37 wired onboarding completion to correct backend endpoint.
- The stack is stable: backend (port 4000), frontend (port 3000), PostgreSQL (Docker).

## Cycle 40 Summary - Error Simulation & Test Infrastructure

### Backend (Commit `bddc9ab`)
| Feature | Description |
|---------|-------------|
| Error Simulation Endpoints | /api/test/errors/* for testing error scenarios |
| Test Mode Utility | src/utils/test-mode.ts for conditional feature enabling |
| Smoke Tests Updated | Error endpoint coverage in smoke-auth-onboarding.sh |
| Test DB Integration | Already integrated from Cycle 38 |

### Frontend (Commit `2123736`)
| Feature | Description |
|---------|-------------|
| MSW Error Handlers | All error simulation endpoints mocked |
| E2E Error Tests | 36 new tests for error scenarios |
| Total E2E Tests | 138 tests passing |

### Error Simulation Endpoints
```
GET  /api/test/errors/status     - Test mode status
GET  /api/test/errors/500        - Server error simulation
POST /api/test/errors/500        - Server error for POST
GET  /api/test/errors/timeout    - Timeout simulation
GET  /api/test/errors/slow       - Slow response
GET  /api/test/errors/503        - Service unavailable
GET  /api/test/errors/429        - Rate limiting
GET  /api/test/errors/401        - Unauthorized
GET  /api/test/errors/403        - Forbidden
GET  /api/test/errors/400        - Validation error with details
```

## Priorities
1. **Error simulation infrastructure** ✅ COMPLETE - Backend and frontend implemented
2. **E2E error test coverage** ✅ COMPLETE - 36 new error scenario tests
3. **Test database stability** ✅ COMPLETE - Automated setup integrated

## Backend tasks
- [x] Add error-simulation endpoints
  - **Status:** ✅ COMPLETE - `/api/test/errors/*` endpoints available
- [x] Audit and standardize error response structures
  - **Status:** ✅ COMPLETE - Consistent { success, error: { code, message, details? } }
- [x] Create test-mode helper utility
  - **Status:** ✅ COMPLETE - `src/utils/test-mode.ts`
- [x] Update smoke-auth-onboarding.sh with error tests
  - **Status:** ✅ COMPLETE - Error simulation tests added
- [x] Integrate ensure_test_db.sh in restart-stack.sh
  - **Status:** ✅ COMPLETE - Already done in Cycle 38
- [ ] Audit data model against final data model document
- [ ] Support automated cleanup of the `.runtime` state

## Frontend tasks
- [x] Add MSW handlers for error scenarios
  - **Status:** ✅ COMPLETE - All error endpoints mocked
- [x] Expand E2E tests for error scenarios
  - **Status:** ✅ COMPLETE - 36 new tests in error-scenarios.spec.ts
- [x] Verify user-friendly error messages
  - **Status:** ✅ COMPLETE - All error states tested
- [ ] Add error-state mocks for login/onboarding flows (additional Playwright coverage)
- [ ] Update local run scripts README

## Test Coverage (Cycle 40)
- **Backend smoke tests:** All passing (auth + error simulation)
- **Frontend E2E tests:** 138 passing (+36 error scenarios)
- **Browsers tested:** Chromium, Firefox, WebKit

## Error Response Standard
All error responses follow this structure:
```json
{
  "success": false,
  "error": {
    "code": "error_code",
    "message": "Human-readable message",
    "details": [...], // optional
    "retryAfter": 30  // optional, for rate limiting/503
  }
}
```

## Workflow & Automation
- Continue running orchestrator cycles for remaining tasks
- Track systemic issues in `plan/05_quality_automation/04_agent_runbook.md`

## Next checkpoint
- Audit data model against final data model document
- Implement automated cleanup scripts for .runtime state
- Additional Playwright error state mocks