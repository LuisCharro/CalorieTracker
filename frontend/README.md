# CalorieTracker FrontEnd (Phase 1 Foundation)

Web-first frontend foundation for CalorieTracker MVP, aligned with canonical docs 25–28.

## Scope in this phase
- Architecture baseline and folder skeleton
- Canonical route map + lifecycle guards
- Platform boundaries for future Capacitor/React Native reuse
- Local runbook/checklists
- Starter quality tooling (lint/test/CI stubs)

## Canonical references
- `25_FINAL_product_navigation_and_user_flows.md`
- `26_FINAL_data_model_and_database_plan_local_first.md`
- `27_FINAL_backend_hosting_and_portability_strategy.md`
- `28_FINAL_execution_readiness_checklist.md`

## MVP Route Map (locked)
- Public: `/`, `/login`, `/signup`, `/privacy`, `/terms`
- Onboarding: `/onboarding/goals` → `/onboarding/preferences` → `/onboarding/consents` → `/onboarding/consents-optional` → `/onboarding/complete`
- Core: `/log`, `/log/search`, `/log/confirm`, `/today`, `/today/meal/[id]`, `/history`, `/history/entry/[id]`
- Settings: `/settings/profile`, `/settings/goals`, `/settings/preferences`, `/settings/notifications`, `/settings/privacy`, `/settings/gdpr/export`, `/settings/gdpr/delete`

## Local start
See `docs/RUNBOOK_LOCAL.md`.

## Notes
This repository intentionally focuses on foundation artifacts and boundaries. Feature implementation is deferred to next phases.
