#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

FRONTEND_PID_FILE="${PID_DIR}/frontend.pid"
FRONTEND_LOG_FILE="${LOG_DIR}/frontend.log"

if port_is_open 3000; then
  echo "Frontend already running on port 3000."
  exit 0
fi

cd "${FRONTEND_DIR}"

if [[ ! -d node_modules ]]; then
  echo "Installing frontend dependencies..."
  npm install
fi

ensure_env_file "${FRONTEND_DIR}"

echo "Starting frontend on port 3000..."
start_detached "${FRONTEND_DIR}" "./node_modules/.bin/next dev" "${FRONTEND_LOG_FILE}" "${FRONTEND_PID_FILE}"

sleep 2
if ! kill -0 "$(cat "${FRONTEND_PID_FILE}")" >/dev/null 2>&1; then
  echo "Frontend process exited early. Check ${FRONTEND_LOG_FILE}"
  exit 1
fi

if wait_for_http "http://localhost:3000" 120; then
  echo "Frontend is up: http://localhost:3000"
else
  echo "Frontend did not become available in time. Check ${FRONTEND_LOG_FILE}"
  exit 1
fi
