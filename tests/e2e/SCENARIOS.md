# E2E Test Scenarios

## Available Tests

| Test ID | Description | Status |
|----------|-------------|--------|
| E2E-001 | Log a Meal with Food Items | ✅ Ready |
| E2E-002 | User Registration | ✅ Ready |
| E2E-003 | User Login | 🚧 TODO |
| E2E-004 | View Today's Logs | 🚧 TODO |
| E2E-005 | Edit Food Log | 🚧 TODO |
| E2E-006 | Delete Food Log | 🚧 TODO |
| E2E-007 | Offline Queue Sync | 🚧 TODO |
| E2E-008 | Meal Goals | 🚧 TODO |

## Running Tests

Ask AirClaw to run a scenario by referencing the Test ID:

```
"Run E2E-001: Log a Meal"
```

Or specify the file:
```
"Run tests/e2e/scenarios/e2e-001-log-meal.md"
```

## Test Execution

Each test includes:
- **Setup**: Database preparation SQL
- **Steps**: Browser actions with exact selectors/actions
- **Assertions**: Frontend + Database checks
- **Cleanup**: SQL to remove test data
- **Variations**: Edge cases to test

## Reporting

Test results will be saved to `tests/e2e/reports/` with:
- Execution timestamp
- Pass/fail status
- Screenshots of failures
- Database query results
