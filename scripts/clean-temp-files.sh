#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

echo "Cleaning temporary/build artifacts in $repo_root"

rm -rf .turbo .cache coverage
rm -rf frontend/.next frontend/dist frontend/coverage frontend/.turbo frontend/.cache
rm -rf backend/dist backend/coverage backend/.cache
find . -maxdepth 1 -type f -name '*.log' -delete

echo "Done."
