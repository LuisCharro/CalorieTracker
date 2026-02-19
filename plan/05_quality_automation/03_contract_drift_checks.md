# 03 — Contract Drift Checks

Goal: prevent backend/frontend/database drift that causes runtime crashes.

## Required Checks

1. **Schema vs query parity**
- For every DB field referenced in API queries, confirm it exists in active migrations.
- No query may depend on non-existent columns.

2. **Migration impact checks**
- Every migration change must trigger:
  - backend smoke matrix
  - backend integration tests
  - relevant frontend E2E

3. **API contract parity**
- Shared enums and core response shapes must stay aligned between backend and frontend.
- Contract parity tests must run on each PR.

4. **Error contract parity**
- Expected failures return JSON with stable `error.code` and message.
- Frontend maps known codes to user-facing messages.

## Minimum Evidence in PR

- Command list executed
- Status summary
- If failure occurred: root cause + fix + rerun proof

## Failure Policy

Any detected drift => NO-GO until fixed and revalidated.
