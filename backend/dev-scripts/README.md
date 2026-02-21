# Backend Development Scripts

This directory contains utility scripts for local development, testing, and runtime management.

---

## Available Scripts

### restart-stack.sh
**Purpose:** Start/restart the complete development stack (backend, frontend, PostgreSQL)

**Usage:**
```bash
cd backend/dev-scripts
./restart-stack.sh
```

**What it does:**
1. Kills any existing processes on ports 3000 and 4000
2. Starts PostgreSQL container (Docker)
3. Verifies test database exists and runs migrations
4. Starts backend server on port 4000
5. Starts frontend dev server on port 3000
6. Shows access URLs and log locations

**Output:**
```
Stack is running.
Local IP:  192.168.1.208
Frontend: http://192.168.1.208:3000
Backend:  http://192.168.1.208:4000/health
Logs: backend/.runtime/logs/backend.log | frontend.log
```

---

### smoke-auth-onboarding.sh
**Purpose:** Run smoke tests for authentication and onboarding flows

**Usage:**
```bash
cd backend/dev-scripts
./smoke-auth-onboarding.sh
```

**Prerequisites:**
- Backend server must be running (usually on http://localhost:4000)
- PostgreSQL test database must be available

**What it tests (12 checks):**
1. Backend health check (`/health` returns 200)
2. User registration (`POST /api/auth/register` returns 201)
3. Duplicate email detection (returns 409 Conflict)
4. Login existing user (returns 200 with user data)
5. Login non-existent user (returns 404 Not Found)
6. Patch user preferences (returns 200)
7. Error simulation endpoints status
8. 500 error simulation
9. 503 error simulation
10. 429 error simulation
11. Create goal (`POST /api/goals` returns 201)
12. Get goals for user (`GET /api/goals` returns 200)

**Output:**
```
Smoke auth/onboarding against http://localhost:4000
Email: smoke_1771696554@example.com
initial_health:200
1) register user
register:201
...
Smoke auth/onboarding passed.
```

---

### cleanup-runtime.sh
**Purpose:** Safely clean up runtime logs and state files

**Usage:**
```bash
cd backend/dev-scripts
./cleanup-runtime.sh [--dry-run]
```

**Options:**
- `--dry-run` — Preview what would be deleted without actually deleting

**What it cleans:**
- Backend log files: `.runtime/logs/backend.log*`
- Frontend log files: `.runtime/logs/frontend.log*`
- State files: `.runtime/state/*.json` (except `.gitkeep`)
- PID files: `.runtime/pids/*.pid`

**Safety features:**
- Interactive confirmation before deletion (unless `--dry-run`)
- Dry-run mode for preview
- Preserves `.gitkeep` files
- Shows remaining files after cleanup

**Output:**
```
[INFO] Runtime directory: /path/to/.runtime
[WARN] This will delete all runtime logs and state files.
Continue? (y/N): y
[INFO] Cleaning up...
[INFO] Deleted: Backend log file
[INFO] Deleted: Frontend log file
[INFO] Cleanup complete
```

**When to use:**
- Before starting a new test cycle
- When log files grow too large
- After encountering test pollution
- When state files contain stale data

---

## Common Workflows

### Full Stack Restart + Smoke Test
```bash
cd backend/dev-scripts
./restart-stack.sh
./smoke-auth-onboarding.sh
```

### Cleanup Before New Test Run
```bash
cd backend/dev-scripts
./cleanup-runtime.sh --dry-run  # Preview first
./cleanup-runtime.sh           # Then confirm and clean
./restart-stack.sh
./smoke-auth-onboarding.sh
```

### From Frontend (npm script shortcut)
```bash
cd frontend
npm run cleanup:runtime  # Calls backend cleanup script
```

---

## File Structure

```
dev-scripts/
├── restart-stack.sh          # Full stack startup
├── smoke-auth-onboarding.sh  # Integration smoke tests
├── cleanup-runtime.sh         # Safe cleanup script
└── README.md                 # This file
```

---

## Troubleshooting

### PostgreSQL won't start
```bash
# Check Docker is running
docker ps

# Check PostgreSQL container logs
docker logs calorietracker-postgres

# Restart container
docker restart calorietracker-postgres
```

### Port already in use
```bash
# Check what's using port 3000 or 4000
lsof -i :3000
lsof -i :4000

# Kill the process manually (script does this automatically)
kill -9 <PID>
```

### Smoke test fails
1. Check backend server is running: `curl http://localhost:4000/health`
2. Check logs: `cat backend/.runtime/logs/backend.log`
3. Verify test database exists: `docker exec calorietracker-postgres psql -U postgres -d calorietracker_test -c "\dt"`
4. Run migrations manually: `npm run migrate`

---

## Environment Variables

These scripts use the following environment variables (if set):

| Variable | Purpose | Default |
|----------|---------|---------|
| `POSTGRES_HOST` | PostgreSQL host | localhost |
| `POSTGRES_PORT` | PostgreSQL port | 5432 |
| `POSTGRES_USER` | PostgreSQL user | postgres |
| `POSTGRES_DB` | Test database name | calorietracker_test |
| `BACKEND_PORT` | Backend server port | 4000 |
| `FRONTEND_PORT` | Frontend dev server port | 3000 |

---

## Contributing

When adding new scripts:
1. Make scripts executable: `chmod +x <script.sh>`
2. Add usage examples to this README
3. Add safety checks before destructive operations
4. Include dry-run mode where appropriate
5. Test scripts before committing
