#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="/Users/luis/Repos/CalorieTracker"
BACKEND_SRC="/Users/luis/Repos/CalorieTracker_BackEnd"
FRONTEND_SRC="/Users/luis/Repos/CalorieTracker_FrontEnd"
PLAN_SRC="/Users/luis/Repos/CalorieTracker_Plan"

COMMON_EXCLUDES=(
  ".git"
  "node_modules"
  "dist"
  "build"
  "coverage"
  ".runtime"
  "logs"
  "*.lock"
)

rsync_options=("-av" "--delete")
for pattern in "${COMMON_EXCLUDES[@]}"; do
  rsync_options+=("--exclude=${pattern}")
done

sync_repo() {
  local name="$1"
  local src dest

  case "$name" in
    backend)
      src="$BACKEND_SRC"
      dest="$BASE_DIR/backend"
      ;;
    frontend)
      src="$FRONTEND_SRC"
      dest="$BASE_DIR/frontend"
      ;;
    plan)
      src="$PLAN_SRC"
      dest="$BASE_DIR/plan"
      ;;
    *)
      echo "Unknown component: $name"
      return 1
      ;;
  esac

  if [[ ! -d "$src" ]]; then
    echo "Source directory missing: $src"
    return 1
  fi

  mkdir -p "$dest"
  echo "Syncing $name ($src -> $dest)"
  rsync "${rsync_options[@]}" "$src/" "$dest/"
}

sync_repo backend
sync_repo frontend
sync_repo plan

echo "Sync complete. You can inspect $BASE_DIR/{backend,frontend,plan}."
