#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RUNTIME_DIR="${BACKEND_DIR}/.runtime"
LOG_DIR="${RUNTIME_DIR}/logs"
PID_DIR="${RUNTIME_DIR}/pids"

echo "Cleaning up CalorieTracker development environment..."

kill_pid_file() {
  local pid_file="$1"
  if [[ -f "${pid_file}" ]]; then
    local pid
    pid="$(cat "${pid_file}")"
    if kill -0 "${pid}" >/dev/null 2>&1; then
      echo "Stopping process ${pid}..."
      kill "${pid}" >/dev/null 2>&1 || true
      sleep 1
      if kill -0 "${pid}" >/dev/null 2>&1; then
        echo "Force-killing process ${pid}..."
        kill -9 "${pid}" >/dev/null 2>&1 || true
      fi
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
    kill ${pids} >/dev/null 2>&1 || true
    sleep 1
    pids="$(/usr/sbin/lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "${pids}" ]]; then
      echo "Force-killing processes on port ${port}: ${pids}"
      kill -9 ${pids} >/dev/null 2>&1 || true
    fi
  fi
}

echo "Stopping backend and frontend processes..."
kill_pid_file "${PID_DIR}/backend.pid"
kill_pid_file "${PID_DIR}/frontend.pid"
kill_port 3000
kill_port 3001
kill_port 4000

echo "Stopping Docker containers..."
cd "${BACKEND_DIR}"
docker compose down --remove-orphans 2>/dev/null || true

echo "Cleaning up runtime files..."
rm -rf "${PID_DIR}"/*.pid 2>/dev/null || true

echo "Cleanup complete."
