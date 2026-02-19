# 99_local_secrets

Local-only credentials for CalorieTracker demo environment.

Scope:
- Demo project
- Local laptop only
- Not intended for production security hardening

Use this folder to store local secrets needed for running services.

## Suggested files
- `app.env` (app/backend environment variables)
- `db.env` (database credentials)
- `providers.env` (third-party API keys)
- `notes.md` (manual setup notes)

## Important
- Keep real secret values out of other documentation files.
- Reference files by name from planning docs, but do not duplicate secret values.
- If project scope changes to non-local/shared/public, rotate all credentials immediately.
