# 01 — Backend Smoke Matrix

Run this matrix on every change touching auth, onboarding, routes, validation, or DB migrations.

## Required Scenarios

1. `GET /health`
- Expect: `200`

2. `POST /api/auth/register` with new email
- Expect: `201`

3. `POST /api/auth/register` duplicate email
- Expect: `409`
- Post-check: `/health` still `200`

4. `POST /api/auth/login` existing user
- Expect: `200`

5. `POST /api/auth/login` non-existent user
- Expect: `404`
- Post-check: `/health` still `200`

6. `PATCH /api/auth/user/:id` preferences update
- Expect: `200`
- Post-check: `/health` still `200`

## Required Output

- Endpoint
- Input payload summary
- HTTP status
- Pass/fail
- Health-after-error status

## Automation

Primary script:
- `/Users/luis/Repos/CalorieTracker_BackEnd/dev-scripts/smoke-auth-onboarding.sh`

Failure policy:
- Any mismatch or backend crash => NO-GO.
