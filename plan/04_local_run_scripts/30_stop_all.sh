#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

stop_from_pid_file() {
  local pid_file="$1"
  local label="$2"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid"
      echo "Stopped ${label} (pid ${pid})"
    else
      echo "${label} pid file found, but process is not running (pid ${pid})"
    fi
    rm -f "$pid_file"
  else
    echo "No pid file for ${label}"
  fi
}

stop_from_pid_file "${PID_DIR}/frontend.pid" "frontend"
stop_from_pid_file "${PID_DIR}/backend.pid" "backend"

echo "Stopping database container..."
cd "${BACKEND_DIR}"
docker compose down

echo "All stop commands completed."
