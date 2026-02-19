#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

echo "Service status:"

if port_is_open 5432; then
  echo "- Postgres (5432): LISTENING"
else
  echo "- Postgres (5432): NOT LISTENING"
fi

if wait_for_http "http://localhost:4000/health" 2; then
  echo "- Backend (4000): HEALTHY"
else
  echo "- Backend (4000): NOT HEALTHY"
fi

if wait_for_http "http://localhost:3000" 2; then
  echo "- Frontend (3000): RESPONDING"
else
  echo "- Frontend (3000): NOT RESPONDING"
fi

echo
echo "Logs:"
echo "- Backend: ${LOG_DIR}/backend.log"
echo "- Frontend: ${LOG_DIR}/frontend.log"
