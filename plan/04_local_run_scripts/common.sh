#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAN_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

AGGREGATOR_ROOT="/Users/luis/Repos/CalorieTracker"
BACKEND_DIR="${AGGREGATOR_ROOT}/backend"
FRONTEND_DIR="${AGGREGATOR_ROOT}/frontend"

RUNTIME_DIR="${PLAN_DIR}/.runtime"
LOG_DIR="${RUNTIME_DIR}/logs"
PID_DIR="${RUNTIME_DIR}/pids"

mkdir -p "${LOG_DIR}" "${PID_DIR}"

wait_for_http() {
  local url="$1"
  local timeout_seconds="${2:-60}"
  local elapsed=0

  while (( elapsed < timeout_seconds )); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done

  return 1
}

port_is_open() {
  local port="$1"
  lsof -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
}

start_detached() {
  local workdir="$1"
  local command="$2"
  local log_file="$3"
  local pid_file="$4"

  nohup bash -lc "cd '${workdir}' && ${command}" >"${log_file}" 2>&1 < /dev/null &
  local pid=$!
  echo "${pid}" >"${pid_file}"
}

ensure_env_file() {
  local repo_dir="$1"

  if [[ ! -f "${repo_dir}/.env.local" && -f "${repo_dir}/.env.example" ]]; then
    cp "${repo_dir}/.env.example" "${repo_dir}/.env.local"
    echo "Created ${repo_dir}/.env.local from .env.example"
  fi
}
