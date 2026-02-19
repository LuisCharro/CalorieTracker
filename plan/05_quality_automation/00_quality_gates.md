# 00 — Quality Gates (Mandatory Before Merge)

Purpose: prevent runtime regressions (crashes, schema mismatches, stale UI contracts) without manual spot-checking.

## Hard Gates (all must pass)

1. **Crash-proof API behavior**
- Handled business errors must return controlled JSON `4xx` (not crash server).
- Examples: duplicate signup, missing user login, invalid payload.

2. **Health-after-error**
- After each negative-path test, `GET /health` must still return `200`.

3. **Schema-contract parity**
- API queries must match migrated DB schema (no missing columns/tables).
- Any migration change requires parity validation.

4. **Critical flow E2E**
- Frontend E2E must pass for:
  - signup
  - login
  - onboarding goals -> preferences -> consents
  - onboarding completion navigation

5. **Frontend error quality**
- Expected API failures must show actionable UI messages.
- Generic "Unable to connect" is allowed only for true network/down scenarios.

6. **E2E selector accuracy**
- Test selectors must reflect current UI implementation.
- Outdated selectors block merge.

## Merge Rule

If any gate fails: **NO-GO**. Fix, rerun, and only merge when all gates are green.
