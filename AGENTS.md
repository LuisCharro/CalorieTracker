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
- `agent/README.md`

Then read only the relevant shared skill and local doc for the task.

## Shared skills to use when relevant

Start with:

- `./.agent-local/skills/_shared/repo-bootstrap-check.SKILL.md`
- `./.agent-local/skills/_shared/fullstack-repo-map.SKILL.md`
- `./.agent-local/skills/_shared/app-architecture-bootstrap.SKILL.md`

Use these when the task matches:

- `./.agent-local/skills/frontend/`
  Use for Next.js architecture, UI implementation, review, and data-boundary work.
- `./.agent-local/skills/backend/`
  Use for TypeScript backend, Express/API, schema, and migration work.
- `./.agent-local/skills/_shared/repo-devtools-layout.SKILL.md`
  Use when placing repo-internal helper scripts or tooling wrappers.

If repo-local rules conflict with a shared skill, prefer the repo-local rules.

## Repo-local guides

Use these when the task is specifically about this workspace:

- `agent/README.md`
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
- Keep repo-specific operational detail in `agent/README.md` and local docs.

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

- `agent/README.md`
- `plan/`
- `backend/docs/`
- `frontend/docs/`
- `.kilocode/`

Global reusable heuristics belong in the shared skills repo, not here.
