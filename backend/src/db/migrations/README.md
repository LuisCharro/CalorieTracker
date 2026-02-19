# Migrations

This folder stores ordered SQL migrations.

- `0001_init.sql` initializes canonical MVP tables and indexes.
- For new migrations, use monotonic naming (`0002_*.sql`, etc).

Portability rule: keep SQL Postgres-compatible and avoid provider-locked features unless explicitly approved.
