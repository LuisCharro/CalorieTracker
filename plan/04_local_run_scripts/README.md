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

- `/Users/luis/Repos/CalorieTracker_Plan/.runtime/logs`
- `/Users/luis/Repos/CalorieTracker_Plan/.runtime/pids`

## Typical Usage

```bash
cd /Users/luis/Repos/CalorieTracker_Plan/04_local_run_scripts
./10_start_all.sh
./20_status.sh
```

Open:

- http://localhost:3000
- http://localhost:4000/health

## LAN / Mobile access

For same-network access from phone/laptop, prefer:

```bash
/Users/luis/Repos/CalorieTracker_BackEnd/dev-scripts/restart-stack.sh
```

It starts services detached and prints LAN URLs using local IP (for example `http://192.168.x.x:3000`).
