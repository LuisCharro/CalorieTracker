#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-calorietracker}"
TEST_DB_NAME="${TEST_DB_NAME:-calorietracker_test}"
MAX_RETRIES="${MAX_RETRIES:-30}"
RETRY_INTERVAL="${RETRY_INTERVAL:-1}"

export PGPASSWORD="$DB_PASSWORD"

echo "Ensuring test database exists and is up to date..."

wait_for_postgres() {
  echo "Waiting for PostgreSQL to be ready..."
  local retries=0
  while [ $retries -lt $MAX_RETRIES ]; do
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" >/dev/null 2>&1; then
      echo "PostgreSQL is ready!"
      return 0
    fi
    retries=$((retries + 1))
    echo "PostgreSQL not ready yet (attempt $retries/$MAX_RETRIES), waiting..."
    sleep $RETRY_INTERVAL
  done
  echo "ERROR: PostgreSQL did not become ready after $MAX_RETRIES attempts"
  return 1
}

if ! wait_for_postgres; then
  exit 1
fi

echo "Checking if test database exists..."
EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT 1 FROM pg_database WHERE datname='$TEST_DB_NAME'" 2>/dev/null || echo "")

if [[ -z "$EXISTS" ]]; then
  echo "Creating test database: $TEST_DB_NAME"
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE DATABASE \"$TEST_DB_NAME\";" || {
    echo "Failed to create test database. Please ensure PostgreSQL is running and credentials are correct."
    exit 1
  }
else
  echo "Test database already exists: $TEST_DB_NAME"
fi

echo "Running migrations on test database..."
cd "$BACKEND_DIR"
DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$TEST_DB_NAME" npm run migrate || {
  echo "Failed to run migrations on test database."
  exit 1
}

echo "Verifying test database tables..."
TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null || echo "0")

if [[ "$TABLE_COUNT" -lt 5 ]]; then
  echo "Warning: Test database has fewer tables than expected ($TABLE_COUNT)"
fi

echo "Test database is ready: $TEST_DB_NAME"
echo "Connection string: postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$TEST_DB_NAME"
