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

`agent/skills-manifest.txt` is the source of truth for which shared skills are
copied into this repo. Resolve shared-skill references by exact local path under
`./.agent-local/skills/`; do not use global machine paths in repo instructions.

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

For implementation work, prefer `agent/README.md` for exact commands and this
file for routing, boundaries, and repo-level rules.

## Shared skills to use when relevant

### Available skills (`.agent-local/skills/`)

**_shared:**
- `repo-bootstrap-check.SKILL.md` — first-time repo assessment
- `fullstack-repo-map.SKILL.md` — fullstack repo structure mapping
- `app-architecture-bootstrap.SKILL.md` — architecture framing
- `problem-shaping.SKILL.md` — problem framing before implementation
- `repo-devtools-layout.SKILL.md` — script/tooling placement

**Frontend:**
- `frontend-implementation-baseline.SKILL.md` — frontend implementation standards
- `nextjs-app-router-data-fetching.SKILL.md` — Next.js data fetching patterns
- `nextjs-feature-architecture-bootstrap.SKILL.md` — Next.js feature structure
- `nextjs-server-client-boundaries.SKILL.md` — server/client component boundaries
- `modern-web-stack-review.SKILL.md` — web stack review
- `visual-distinctiveness-review.SKILL.md` — final visual distinctiveness review
- `references/frontend-antipattern-vocabulary.md` — frontend anti-pattern vocabulary
- `references/frontend-distinctiveness-checklist.md` — visual distinctiveness checklist

**Backend:**
- `architecture-review.SKILL.md` — backend architecture review
- `express-typescript-api-review.SKILL.md` — Express/TypeScript API review
- `postgres-app-schema-review.SKILL.md` — Postgres schema review
- `postgres-migration-review.SKILL.md` — migration safety review
- `typescript-backend-baseline.SKILL.md` — TypeScript backend standards
- `security-review.SKILL.md` — security review

### Starter
- `./.agent-local/skills/_shared/repo-bootstrap-check.SKILL.md`
- `./.agent-local/skills/_shared/fullstack-repo-map.SKILL.md`
- `./.agent-local/skills/_shared/app-architecture-bootstrap.SKILL.md`
- `./.agent-local/skills/publish/google-stitch-workflow/SKILL.md` for Stitch-assisted UI work

If repo-local rules conflict with a shared skill, prefer the repo-local rules.

## Task routing

- Cross-layer feature: start with `fullstack-repo-map`, then route separately to
  backend and frontend skills.
- Backend API/security/schema: use
  `./.agent-local/skills/backend/architecture-review.SKILL.md`,
  `./.agent-local/skills/backend/express-typescript-api-review.SKILL.md`, and
  the relevant Postgres or security skill.
- Frontend App Router/UI: use the Next.js frontend skills and
  `./.agent-local/skills/frontend/visual-distinctiveness-review.SKILL.md`
  before browser verification.
- Stitch-assisted UI work: use
  `./.agent-local/skills/publish/google-stitch-workflow/SKILL.md` before coding
  screens.

## Code map

- Backend entrypoint is `backend/src/api/server.ts`; routers live in
  `backend/src/api/routers/`.
- Backend middleware lives in `backend/src/api/middleware/`; idempotency is
  applied to most write-heavy routers in the server.
- Backend jobs live in `backend/src/api/jobs/`; migrations and schema are under
  `backend/src/db/`.
- Backend tests live in `backend/src/__tests__/`, split into `unit/` and
  `integration/`.
- Frontend App Router pages live in `frontend/src/app/`.
- Frontend API client and service layer live in `frontend/src/core/api/`;
  contract mirrors live in `frontend/src/core/contracts/`.
- Offline sync state lives in `frontend/src/core/contexts/OfflineQueueContext.tsx`
  and `frontend/src/core/api/services/sync.service.ts`.
- Feature docs live in `frontend/src/features/*/README.md`; shared UI lives in
  `frontend/src/shared/`.
- Browser scenarios live in `frontend/e2e/tests/` and repo-level scenario notes
  live in `tests/e2e/`.

For cross-layer API changes, update backend router/schema/types, frontend
service/contracts, and matching tests in the same task.

## Repo Working Guidance

- Backend and frontend are independent npm projects. Run commands from the
  correct subdirectory unless using a root wrapper.
- Backend server applies `idempotencyMiddleware` to most write-heavy routers.
  Preserve idempotency semantics when adding write endpoints.
- Backend tests use Jest with ESM/ts-jest and a shared setup file at
  `backend/src/__tests__/setup.ts`; add tests near the affected router/service.
- Frontend tests are split between Jest component/service tests and Playwright
  E2E under `frontend/e2e/`.
- Playwright auto-detects LAN IP and can run in mock mode with
  `E2E_USE_MOCK=true`; use mock mode for fast UI coverage when backend behavior
  is not under test.
- Frontend writes should go through `frontend/src/core/api/services/` and shared
  contracts, not direct `fetch` calls from pages.
- Offline queue behavior is a first-class product surface. Any change to logs,
  sync, auth token storage, or API error handling needs offline/sync validation.
- Do not edit generated/runtime folders such as `frontend/playwright-report/`,
  `frontend/test-results/`, backend `dist/`, or TypeScript build info as source.

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

For build-impacting changes, also run the relevant build:

```bash
cd backend && npm run build
cd frontend && npm run build
```

## Documentation rule

If you add a recurring workspace convention or local run workflow, update the relevant file in:

- `agent/README.md`
- `plan/`
- `backend/docs/`
- `frontend/docs/`
- `.kilocode/`

Global reusable heuristics belong in the shared skills repo, not here.
