#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

echo "Deep cleaning $repo_root"
rm -rf node_modules .turbo .cache coverage
rm -rf frontend/node_modules frontend/.next frontend/dist frontend/coverage frontend/.turbo frontend/.cache frontend/playwright-report
rm -rf backend/node_modules backend/dist backend/coverage backend/.cache
find . -maxdepth 2 -type f \( -name '*.log' -o -name '*.tmp' \) -delete

echo "Done. Reinstall deps before next run."
