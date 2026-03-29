# AGENTS.md

This repo uses repo-local copied shared skills under `./.agent-local/skills`.

If those copied skills are missing, restore them before substantial work:

```bash
./agent/sync-shared-skills.sh
```

If auto-detect fails on this machine, pass the shared skills repo path once:

```bash
./agent/sync-shared-skills.sh /path/to/skills
```

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

Then read only the relevant shared skill and local doc for the task.

## Shared skills to use when relevant

Start with:

- `./.agent-local/skills/_shared/repo-bootstrap-check.SKILL.md`
- `./.agent-local/skills/_shared/fullstack-repo-map.SKILL.md`
- `./.agent-local/skills/_shared/app-architecture-bootstrap.SKILL.md`

Use these when the task matches:

- Next.js App Router architecture:
  `./.agent-local/skills/frontend/nextjs-feature-architecture-bootstrap.SKILL.md`
- Next.js server/client boundaries:
  `./.agent-local/skills/frontend/nextjs-server-client-boundaries.SKILL.md`
- Next.js data fetching and caching:
  `./.agent-local/skills/frontend/nextjs-app-router-data-fetching.SKILL.md`
- Frontend implementation baseline:
  `./.agent-local/skills/frontend/frontend-implementation-baseline.SKILL.md`
- Modern web stack review:
  `./.agent-local/skills/frontend/modern-web-stack-review.SKILL.md`
- TypeScript backend baseline:
  `./.agent-local/skills/backend/typescript-backend-baseline.SKILL.md`
- Express API review:
  `./.agent-local/skills/backend/express-typescript-api-review.SKILL.md`
- Postgres schema review:
  `./.agent-local/skills/backend/postgres-app-schema-review.SKILL.md`
- Postgres migration safety:
  `./.agent-local/skills/backend/postgres-migration-review.SKILL.md`
- Repo-internal helper script placement:
  `./.agent-local/skills/_shared/repo-devtools-layout.SKILL.md`

If repo-local rules conflict with a shared skill, prefer the repo-local rules.

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

Global reusable heuristics belong in the shared skills repo, not here.
