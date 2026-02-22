# Test Report: {{ TEST_ID }}

## Metadata
- **Test ID:** {{ TEST_ID }}
- **Scenario:** {{ SCENARIO_NAME }}
- **Executed At:** {{ EXECUTED_TIME }}
- **Executed By:** AirClaw (browser automation)
- **Environment:**
  - Frontend: {{ FRONTEND_URL }}
  - Backend: {{ BACKEND_URL }}
  - Database: PostgreSQL

## Summary
| Status | Result |
|--------|--------|
| Overall Status | {{ PASS_FAIL }} |
| Total Assertions | {{ TOTAL_ASSERTIONS }} |
| Passed | {{ PASSED }} |
| Failed | {{ FAILED }} |

## Step-by-Step Results

### Setup
- [ ] Database prep completed
- [ ] Test user created/verified

{{ STEP_RESULTS }}

## Assertions

### Frontend
{{ FRONTEND_ASSERTIONS }}

### Database
{{ DATABASE_ASSERTIONS }}

## Screenshots

### Failure Screenshots (if any)
{{ FAILURE_SCREENSHOTS }}

### Success Screenshots
{{ SUCCESS_SCREENSHOTS }}

## Notes
{{ EXECUTION_NOTES }}

## Cleanup
- [ ] Test data removed from database
- [ ] Environment restored to initial state

## Next Steps
{{ NEXT_STEPS }}
