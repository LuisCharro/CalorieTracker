# CalorieTracker BackEnd (Phase 1 Foundation)

Backend foundation for CalorieTracker MVP with local-first development and cloud-portable contracts.

## Delivered in Phase 1
- Local API/service skeleton
- Canonical database schema + initial migration scaffold
- Environment templates (no secrets)
- Runbook/checklists for local startup
- CI starter

## Canonical alignment
This repository follows docs 25–28 in `CalorieTracker_ExternalData/02_architecture_gdpr`.

## Local quickstart
1. `cp .env.example .env.local`
2. Start local Postgres (optional helper): `docker compose up -d`
3. Apply migration: `npm run db:migrate`
4. Start API: `npm run dev`

See `docs/RUNBOOK_LOCAL.md` for full details.
