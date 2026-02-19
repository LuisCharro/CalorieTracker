# 04_local_run_scripts

Automation scripts to run CalorieTracker locally from this planning repository.

## Scripts

- `01_start_db.sh`: start PostgreSQL with Docker Compose from backend repo.
- `02_start_backend.sh`: install deps if needed, run migrations, start backend in background.
- `03_start_frontend.sh`: install deps if needed, start frontend in background.
- `10_start_all.sh`: run DB + backend + frontend startup sequence.
- `20_status.sh`: quick health/port status check.
- `30_stop_all.sh`: stop frontend/backend and bring down DB container.

## Runtime Files

Runtime artifacts are written to:

- `/Users/luis/Repos/CalorieTracker/plan/.runtime/logs`
- `/Users/luis/Repos/CalorieTracker/plan/.runtime/pids`

## Typical Usage

```bash
cd /Users/luis/Repos/CalorieTracker/plan/04_local_run_scripts
./10_start_all.sh
./20_status.sh
```

Open:

- http://localhost:3000
- http://localhost:4000/health

## LAN / Mobile access

Use the aggregator-level helper if you need LAN URLs or external-device access:

```bash
/Users/luis/Repos/CalorieTracker/scripts/start_calorietracker.sh
```

It prints the local IP-based frontend/backend URLs and keeps the backend + frontend services running with their usual git-approved guards.

> Legacy note: older docs still mention `/Users/luis/Repos/CalorieTracker_BackEnd` and `/Users/luis/Repos/CalorieTracker_FrontEnd`; treat those as historical paths that now live under `/Users/luis/Repos/CalorieTracker/backend` and `/Users/luis/Repos/CalorieTracker/frontend`.

It starts services detached and prints LAN URLs using local IP (for example `http://192.168.x.x:3000`).
