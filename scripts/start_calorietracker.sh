#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="/Users/luis/Repos/CalorieTracker"
BACKEND_DIR="${BASE_DIR}/backend"
FRONTEND_DIR="${BASE_DIR}/frontend"
RUNTIME_DIR="${BACKEND_DIR}/.runtime"
LOG_DIR="${RUNTIME_DIR}/logs"
PID_DIR="${RUNTIME_DIR}/pids"

mkdir -p "${LOG_DIR}" "${PID_DIR}"

BACKEND_LOG="${LOG_DIR}/backend.log"
FRONTEND_LOG="${LOG_DIR}/frontend.log"
BACKEND_PID_FILE="${PID_DIR}/backend.pid"
FRONTEND_PID_FILE="${PID_DIR}/frontend.pid"

kill_pid_file() {
  local pid_file="$1"
  if [[ -f "${pid_file}" ]]; then
    local pid
    pid="$(cat "${pid_file}")"
    if kill -0 "${pid}" >/dev/null 2>&1; then
      kill "${pid}" >/dev/null 2>&1 || true
    fi
    rm -f "${pid_file}"
  fi
}

kill_port() {
  local port="$1"
  local pids
  pids="$(/usr/sbin/lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "Killing processes on port ${port}: ${pids}"
    # shellcheck disable=SC2086
    kill ${pids} >/dev/null 2>&1 || true
    sleep 1
    pids="$(/usr/sbin/lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "${pids}" ]]; then
      echo "Force-killing processes on port ${port}: ${pids}"
      # shellcheck disable=SC2086
      kill -9 ${pids} >/dev/null 2>&1 || true
    fi
  fi
}

wait_for_http() {
  local url="$1"
  local timeout="${2:-90}"
  local i
  for ((i=0; i<timeout; i++)); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

echo "Stopping previous local stack instances..."
kill_pid_file "${FRONTEND_PID_FILE}"
kill_pid_file "${BACKEND_PID_FILE}"
kill_port 3000
kill_port 3001
kill_port 4000

echo "Starting PostgreSQL container..."
cd "${BACKEND_DIR}"
docker compose up -d

echo "Building backend artifacts..."
npm run build

echo "Running backend migrations..."
npm run migrate

# Determine accessible IP for local network
LOCAL_IP="$(/usr/sbin/ipconfig getifaddr en0 2>/dev/null || /usr/sbin/ipconfig getifaddr en1 2>/dev/null || true)"
if [[ -z "${LOCAL_IP}" ]]; then
  echo "Warning: could not detect LOCAL_IP from en0/en1. Falling back to localhost settings."
  LOCAL_IP="127.0.0.1"
fi

echo "Starting backend on :4000..."
export CORS_ORIGIN="http://${LOCAL_IP}:3000"
nohup bash -lc "cd '${BACKEND_DIR}' && CORS_ORIGIN='${CORS_ORIGIN}' npm run dev" >"${BACKEND_LOG}" 2>&1 < /dev/null &
echo "$!" > "${BACKEND_PID_FILE}"

if ! wait_for_http "http://localhost:4000/health" 120; then
  echo "Backend failed to start. Check ${BACKEND_LOG}"
  exit 1
fi

echo "Starting frontend on :3000..."
export NEXT_PUBLIC_API_URL="http://${LOCAL_IP}:4000"
nohup bash -lc "cd '${FRONTEND_DIR}' && NEXT_PUBLIC_API_URL='${NEXT_PUBLIC_API_URL}' npm run dev -- --hostname 0.0.0.0 --port 3000" >"${FRONTEND_LOG}" 2>&1 < /dev/null &
echo "$!" > "${FRONTEND_PID_FILE}"

if ! wait_for_http "http://localhost:3000" 120; then
  echo "Frontend failed to start. Check ${FRONTEND_LOG}"
  exit 1
fi

echo "Stack is running."
echo "Local IP:  ${LOCAL_IP}"
echo "Frontend: http://${LOCAL_IP}:3000"
echo "Backend:  http://${LOCAL_IP}:4000/health"
echo "Logs: ${BACKEND_LOG} | ${FRONTEND_LOG}"
