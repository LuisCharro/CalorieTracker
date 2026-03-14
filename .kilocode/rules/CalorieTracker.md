# CalorieTracker Umbrella Repo Rules

Start with:

- `$HOME/SKILLS/_shared/fullstack-repo-map.SKILL.md`
- `$HOME/SKILLS/_shared/app-architecture-bootstrap.SKILL.md`
- `$HOME/SKILLS/frontend/nextjs-feature-architecture-bootstrap.SKILL.md`
- `$HOME/SKILLS/backend/typescript-backend-baseline.SKILL.md`

Use this local rule only for umbrella-repo-specific context.

## Workspace role

`/Users/luis/Repos/CalorieTracker` is the canonical umbrella workspace.

It owns:

- `backend/`
- `frontend/`
- `plan/`
- `scripts/`

## Local expectations

- Backend default local port: `4000`
- Frontend default local port: `3000`
- Local stack entrypoint: `./scripts/start_calorietracker.sh`

## Guardrails

- Keep workspace automation at the root, but keep app logic inside `backend/` and `frontend/`.
- Do not turn `plan/` into a dumping ground for active code instructions.
- If a rule is reusable across repos, move it to `$HOME/SKILLS` instead of growing this file.
