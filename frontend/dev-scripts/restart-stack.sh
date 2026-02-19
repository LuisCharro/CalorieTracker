#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGGREGATOR_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

exec "${AGGREGATOR_ROOT}/backend/dev-scripts/restart-stack.sh"
