#!/bin/bash
#
# cleanup-runtime.sh — Safe cleanup of .runtime state
#
# Usage: ./cleanup-runtime.sh [--dry-run]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="${SCRIPT_DIR}/../.runtime"

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "DRY RUN MODE — No files will be deleted"
  echo ""
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if runtime directory exists
if [[ ! -d "${RUNTIME_DIR}" ]]; then
  log_info "Runtime directory does not exist: ${RUNTIME_DIR}"
  exit 0
fi

log_info "Runtime directory: ${RUNTIME_DIR}"
echo ""

# Function to delete a file/directory with confirmation
delete_item() {
  local item="$1"
  local description="$2"

  if [[ -e "${item}" ]]; then
    if [[ "${DRY_RUN}" == true ]]; then
      echo "  [DRY-RUN] Would delete: ${item}"
    else
      rm -rf "${item}"
      log_info "Deleted: ${description}"
    fi
  else
    log_warn "Not found: ${description}"
  fi
}

# Stop and confirm
log_warn "This will delete all runtime logs and state files."
if [[ "${DRY_RUN}" == false ]]; then
  read -p "Continue? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Cleanup cancelled"
    exit 0
  fi
fi

echo ""
log_info "Cleaning up..."

# Log files
delete_item "${RUNTIME_DIR}/logs/backend.log" "Backend log file"
delete_item "${RUNTIME_DIR}/logs/frontend.log" "Frontend log file"

# State files (keep .gitkeep)
if [[ -d "${RUNTIME_DIR}/state" ]]; then
  for file in "${RUNTIME_DIR}/state"/*.json; do
    if [[ -f "${file}" && ! "$(basename "${file}")" == ".gitkeep" ]]; then
      delete_item "${file}" "State file: $(basename "${file}")"
    fi
  done
fi

echo ""
log_info "Cleanup complete"

# Show remaining files
echo ""
log_info "Remaining in .runtime:"
find "${RUNTIME_DIR}" -type f -o -type d | sort || true
