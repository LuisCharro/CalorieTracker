# AGENTS.md

This repo uses a short repo-local wrapper plus reusable global skills from
`$HOME/SKILLS`.

## Product identity

This repo is the `CalorieTracker` umbrella workspace.
It aggregates:

- `backend/` - Express/Node.js API
- `frontend/` - Next.js App Router frontend
- `plan/` - planning and execution docs
- `scripts/` - workspace-level helper scripts

Treat this repo as the canonical root for local automation and cross-layer work.

## Read first

Before substantial work, read:

- `README.md`
- `plan/README.md`
- `backend/README.md` when touching backend behavior
- `frontend/README.md` when touching frontend behavior
- `scripts/start_calorietracker.sh` when touching local run flow

Then read only the relevant global skill and local doc for the task.

## Global skills to use when relevant

Start with:

- `$HOME/SKILLS/_shared/repo-bootstrap-check.SKILL.md`
- `$HOME/SKILLS/_shared/fullstack-repo-map.SKILL.md`
- `$HOME/SKILLS/_shared/app-architecture-bootstrap.SKILL.md`

Use these when the task matches:

- Next.js App Router architecture:
  `$HOME/SKILLS/frontend/nextjs-feature-architecture-bootstrap.SKILL.md`
- Next.js server/client boundaries:
  `$HOME/SKILLS/frontend/nextjs-server-client-boundaries.SKILL.md`
- Next.js data fetching and caching:
  `$HOME/SKILLS/frontend/nextjs-app-router-data-fetching.SKILL.md`
- Frontend implementation baseline:
  `$HOME/SKILLS/frontend/frontend-implementation-baseline.SKILL.md`
- Modern web stack review:
  `$HOME/SKILLS/frontend/modern-web-stack-review.SKILL.md`
- TypeScript backend baseline:
  `$HOME/SKILLS/backend/typescript-backend-baseline.SKILL.md`
- Express API review:
  `$HOME/SKILLS/backend/express-typescript-api-review.SKILL.md`
- Postgres schema review:
  `$HOME/SKILLS/backend/postgres-app-schema-review.SKILL.md`
- Postgres migration safety:
  `$HOME/SKILLS/backend/postgres-migration-review.SKILL.md`
- Repo-internal helper script placement:
  `$HOME/SKILLS/_shared/repo-devtools-layout.SKILL.md`

If repo-local rules conflict with a global skill, prefer the repo-local rules.

## Repo-local guides

Use these when the task is specifically about this workspace:

- `backend/docs/ARCHITECTURE.md`
- `backend/docs/RUNBOOK_LOCAL.md`
- `backend/docs/SECURITY_COMPLIANCE.md`
- `frontend/docs/ARCHITECTURE.md`
- `frontend/docs/PLATFORM_BOUNDARIES.md`
- `frontend/docs/RUNBOOK_LOCAL.md`
- `.kilocode/rules/CalorieTracker.md`

## Working rules

- Keep workspace-level changes separate from backend-only or frontend-only code changes.
- Prefer feature ownership inside `backend/` and `frontend/` over growing generic shared folders.
- Treat `plan/` as documentation and decision memory, not app runtime code.
- Use `scripts/` for stable workspace entrypoints; do not scatter root-level helper scripts.
- Keep the backend and frontend mirrors aligned with the umbrella-repo role instead of treating this repo as a loose dump.

## Verification rule

Do not call work complete until the relevant verification for the changed area has been attempted.

Typical examples:

```bash
cd backend && npm test
cd frontend && npm test
```

For full local stack work, prefer:

```bash
./scripts/start_calorietracker.sh
```

## Documentation rule

If you add a recurring workspace convention or local run workflow, update the relevant file in:

- `plan/`
- `backend/docs/`
- `frontend/docs/`
- `.kilocode/`

Global reusable heuristics belong in `$HOME/SKILLS`, not here.
