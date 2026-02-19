#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${SCRIPT_DIR}/01_start_db.sh"
"${SCRIPT_DIR}/02_start_backend.sh"
"${SCRIPT_DIR}/03_start_frontend.sh"

echo
echo "All services should now be running:"
echo "- Frontend: http://localhost:3000"
echo "- Backend:  http://localhost:4000/health"
