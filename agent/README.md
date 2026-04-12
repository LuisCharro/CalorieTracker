# CalorieTracker Repo Agent Guide

Use this file for CalorieTracker-specific truth that should stay inside this
workspace repo.

Keep here:
- workspace identity and boundaries
- exact commands and preferred wrappers
- cross-layer workflow notes
- repo-specific architecture and run constraints

Keep reusable heuristics in copied shared skills under `./.agent-local/skills/`.

## Product and stack

CalorieTracker is an umbrella workspace repo that aggregates the backend,
frontend, planning assets, and workspace scripts for the CalorieTracker product.
Treat this repo as the canonical root for local automation and cross-layer
changes.

Main areas:
- `backend/` — Express and Node.js API
- `frontend/` — Next.js App Router app
- `plan/` — planning and execution docs
- `scripts/` — workspace-level helper scripts

## Read this repo in this order

- `README.md`
- `plan/README.md`
- `backend/README.md` when touching backend behavior
- `frontend/README.md` when touching frontend behavior
- `scripts/start_calorietracker.sh` when touching local run flow
- `.kilocode/rules/CalorieTracker.md`

## Common commands

- install backend deps: `cd backend && npm install`
- install frontend deps: `cd frontend && npm install`
- start the local stack from the workspace root: `./scripts/start_calorietracker.sh`
- backend verification: `cd backend && npm test`
- frontend verification: `cd frontend && npm test`

## Shared-skills router

If `./.agent-local/skills/` is present, start shared-skill routing with:

- `./.agent-local/skills/_shared/repo-bootstrap-check.SKILL.md`
- `./.agent-local/skills/_shared/fullstack-repo-map.SKILL.md`
- `./.agent-local/skills/frontend/README.md`
- `./.agent-local/skills/backend/README.md`

Then load only the copied shared skill that matches the task.

## Repo-local constraints

- Keep workspace-level changes separate from backend-only or frontend-only code
  changes when practical.
- Use `scripts/` for stable workspace entrypoints instead of ad hoc root-level
  shell sequences.
- Treat `plan/` as documentation and decision memory, not runtime code.
- Keep the backend and frontend mirrors aligned with this repo’s umbrella-workspace
  role instead of treating it as a loose dump.

## Docs to keep updated

- `agent/README.md`
- `plan/`
- `backend/docs/`
- `frontend/docs/`
- `.kilocode/rules/CalorieTracker.md`
