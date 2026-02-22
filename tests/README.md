# CalorieTracker Tests

## Folder Structure

```
tests/
├── e2e/                    # End-to-End browser tests
│   ├── scenarios/           # Test scenario definitions (steps, expectations)
│   └── reports/            # Test execution reports and screenshots
├── unit/                   # Unit tests (frontend/backend)
└── integration/             # Integration tests (API tests)
```

## E2E Test Scenarios

Each scenario is a markdown file with:
- **Setup**: Database prep, test user creation
- **Steps**: Browser actions to perform
- **Assertions**: Expected outcomes
- **Cleanup**: Database cleanup after test

## Running E2E Tests

```bash
# From CalorieTracker root
node tests/e2e/runner.js scenario-name
```

## Test Requirements

- Browser: OpenClaw browser tool automation
- Frontend: http://localhost:3000 (or http://192.168.1.208:3000)
- Backend: http://localhost:4000
- Database: PostgreSQL connection configured

## Naming Convention

- Files: `kebab-case.md` (e.g., `user-login.md`)
- Test IDs: `TEST-001`, `TEST-002`, etc.
