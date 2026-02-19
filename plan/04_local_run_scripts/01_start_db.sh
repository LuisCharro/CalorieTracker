#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed or not in PATH."
  exit 1
fi

echo "Starting PostgreSQL via docker compose..."
cd "${BACKEND_DIR}"
docker compose up -d

echo "Database container status:"
docker compose ps

echo "Database start command completed."
