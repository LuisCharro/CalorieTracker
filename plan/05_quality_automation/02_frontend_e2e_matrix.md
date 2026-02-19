# 02 — Frontend E2E Matrix

Purpose: verify end-user flows and ensure backend failures are surfaced clearly in UI.

## Critical Journeys

1. Signup -> goals -> preferences -> consents -> complete
- Expected: successful route transitions and completion.

2. Login existing user
- Expected: redirect to `/today`.

3. Duplicate signup
- Expected: user-friendly conflict message (not generic network message).

4. Missing-user login
- Expected: user-friendly not-found/invalid-credentials style message.

5. Preferences save (`/onboarding/preferences`)
- Expected: successful continue to consents when backend is healthy.
- If backend returns controlled error, show actionable error message.

## Selector Contract Rule

- Tests must use selectors that match current UI components.
- Any UI change that breaks selectors must include E2E selector updates in same PR.

## Execution

From frontend repo:
- `npm run test:e2e`

Prerequisite:
- backend API must be running and healthy (`http://localhost:4000/health`).
