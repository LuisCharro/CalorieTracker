#!/usr/bin/env sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. Export it or load .env.local first."
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f src/db/schema.sql

echo "Migrations applied (schema.sql)."
