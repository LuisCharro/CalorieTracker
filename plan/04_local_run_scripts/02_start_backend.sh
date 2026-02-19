#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

BACKEND_PID_FILE="${PID_DIR}/backend.pid"
BACKEND_LOG_FILE="${LOG_DIR}/backend.log"

if port_is_open 4000; then
  echo "Backend already running on port 4000."
  exit 0
fi

cd "${BACKEND_DIR}"

if [[ ! -d node_modules ]]; then
  echo "Installing backend dependencies..."
  npm install
fi

ensure_env_file "${BACKEND_DIR}"

echo "Running backend migrations..."
npm run migrate

echo "Starting backend on port 4000..."
start_detached \
  "${BACKEND_DIR}" \
  "./node_modules/.bin/nodemon --watch src --ext ts,js,json --exec node --loader ts-node/esm src/api/server.ts" \
  "${BACKEND_LOG_FILE}" \
  "${BACKEND_PID_FILE}"

sleep 2
if ! kill -0 "$(cat "${BACKEND_PID_FILE}")" >/dev/null 2>&1; then
  echo "Backend process exited early. Check ${BACKEND_LOG_FILE}"
  exit 1
fi

if wait_for_http "http://localhost:4000/health" 90; then
  echo "Backend is up: http://localhost:4000/health"
else
  echo "Backend did not become healthy in time. Check ${BACKEND_LOG_FILE}"
  exit 1
fi
