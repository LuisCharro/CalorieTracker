# Full Stack Startup Guide

This guide shows how to start the complete CalorieTracker stack (FrontEnd + Backend + Database) for local development and E2E testing.

## Prerequisites

- Node.js 20+
- npm 10+
- Docker and Docker Compose

## Quick Start (One Terminal Per Service)

### Terminal 1: Start Postgres Database
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
docker compose up -d
```

Verify Postgres is running:
```bash
docker ps
```

### Terminal 2: Start Backend API
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
npm install  # First time only
cp .env.example .env.local
npm run migrate
npm run dev
```

Backend will be available at `http://localhost:4000`

Verify backend health:
```bash
curl http://localhost:4000/health
```

### Terminal 3: Start FrontEnd Dev Server
```bash
cd /Users/luis/Repos/CalorieTracker_FrontEnd
npm install  # First time only
cp .env.example .env.local
npm run dev
```

FrontEnd will be available at `http://localhost:3000`

### One-command detached startup (recommended)

Use backend script to start DB + backend + frontend in detached mode:

```bash
/Users/luis/Repos/CalorieTracker_BackEnd/dev-scripts/restart-stack.sh
```

This script now auto-detects local LAN IP and prints URLs like:

- `http://<LOCAL_IP>:3000` (frontend)
- `http://<LOCAL_IP>:4000/health` (backend)

This allows access from other devices in the same Wi-Fi network (phone/laptop).

### Terminal 4: Run E2E Tests (Optional)
```bash
cd /Users/luis/Repos/CalorieTracker_FrontEnd
npx playwright install  # First time only
npm run test:e2e
```

## Service Overview

| Service | URL | Port | Description |
|---------|-----|------|-------------|
| FrontEnd | http://localhost:3000 | 3000 | Next.js web application |
| Backend API | http://localhost:4000 | 4000 | Express REST API |
| Postgres | localhost:5432 | 5432 | PostgreSQL database |

## Environment Variables

### Backend (.env.local)
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calorietracker
DB_USER=postgres
DB_PASSWORD=postgres

# API
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# GDPR
GDPR_EXPORT_FORMAT=json
```

### FrontEnd (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000

# Node Environment
NODE_ENV=development
```

## Database Management

### Run Migrations
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
npm run migrate
```

### Check Migration Status
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
npm run migrate:status
```

### Seed Database (Optional)
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
npm run seed
```

### Reset Database (Clean Slate)
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
docker compose down -v  # Remove volumes
docker compose up -d    # Start fresh
npm run migrate
```

### Access Database Directly
```bash
psql -h localhost -U postgres -d calorietracker
```

## Testing

### Run Backend Unit Tests
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
npm test
```

### Run FrontEnd Unit Tests
```bash
cd /Users/luis/Repos/CalorieTracker_FrontEnd
npm test
```

### Run Contract Parity Tests
```bash
cd /Users/luis/Repos/CalorieTracker_FrontEnd
npm test contract-parity
```

### Run E2E Tests
```bash
cd /Users/luis/Repos/CalorieTracker_FrontEnd
npm run test:e2e
```

### Run E2E Tests with UI
```bash
cd /Users/luis/Repos/CalorieTracker_FrontEnd
npm run test:e2e:ui
```

## Development Workflow

### 1. Make Code Changes
Edit files in either FrontEnd or Backend repository.

### 2. Test Changes
- For API changes: Run backend tests and verify endpoints
- For UI changes: Run frontend tests and verify in browser
- For integration: Run E2E tests

### 3. Verify Contract Parity
After making changes to shared enums or types:
```bash
cd /Users/luis/Repos/CalorieTracker_FrontEnd
npm test contract-parity
```

### 4. Commit Changes
Follow Git workflow (see below)

## Common Tasks

### Add a New API Endpoint

1. Add route handler in Backend `src/api/routers/`
2. Add types to Backend `src/shared/types.ts`
3. Add service method to FrontEnd `src/core/api/services/`
4. Add types to FrontEnd `src/core/contracts/types.ts`
5. Write tests (backend integration, frontend E2E)

### Add a New Enum

1. Add to Backend `src/shared/enums.ts`
2. Add to FrontEnd `src/core/contracts/enums.ts`
3. Update contract parity test expectations
4. Run `npm test contract-parity` to verify

### Debug Backend Issues

Check logs in Terminal 2 where Backend is running.

Enable verbose logging by setting `NODE_ENV=development` (default).

### Debug FrontEnd Issues

Check browser console for errors.

Check Next.js dev server logs in Terminal 3.

### Database Issues

Check Docker logs:
```bash
docker logs calorietracker-postgres
```

Restart Postgres:
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
docker compose restart
```

## Cleanup

### Stop All Services
```bash
# Terminal 1
cd /Users/luis/Repos/CalorieTracker_BackEnd
docker compose down

# Terminal 2 and 3: Ctrl+C to stop servers
```

### Remove All Data (Fresh Start)
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
docker compose down -v  # Remove database volume
docker compose up -d
npm run migrate
```

## Git Workflow

### Create Feature Branch
```bash
cd /Users/luis/Repos/CalorieTracker_FrontEnd
git checkout -b feature/my-feature

cd /Users/luis/Repos/CalorieTracker_BackEnd
git checkout -b feature/my-feature
```

### Commit Changes
```bash
git add .
git commit -m "feat: add my feature"
```

### Push to Remote
```bash
git push -u origin feature/my-feature
```

### Merge to Development
After tests pass:
```bash
git checkout development
git merge feature/my-feature
git push origin development
```

### Delete Feature Branch
```bash
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

## Troubleshooting

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Find process using the port
lsof -i :4000

# Kill the process
kill -9 <PID>
```

### Docker Issues

**Problem:** Postgres container won't start

**Solution:**
```bash
# Check Docker status
docker ps -a

# View container logs
docker logs calorietracker-postgres

# Recreate container
cd /Users/luis/Repos/CalorieTracker_BackEnd
docker compose down
docker compose up -d
```

### Module Not Found Errors

**Problem:** `Error: Cannot find module '...'`

**Solution:**
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
npm install

cd /Users/luis/Repos/CalorieTracker_FrontEnd
npm install
```

### CORS Errors in Browser

**Problem:** FrontEnd cannot connect to Backend

**Solution:**
1. Check Backend CORS setting in `.env.local`:
```bash
CORS_ORIGIN=http://localhost:3000
```

2. Restart Backend after changing `.env.local`

### E2E Tests Failing

**Problem:** E2E tests fail with connection errors

**Solution:**
1. Verify Backend is running: `curl http://localhost:4000/health`
2. Verify FrontEnd dev server is running: `curl http://localhost:3000`
3. Verify database is accessible: `cd /Users/luis/Repos/CalorieTracker_BackEnd && npm run migrate:status`
4. Check CORS configuration
5. Restart all services and try again

## Additional Resources

- FrontEnd Runbook: `/Users/luis/Repos/CalorieTracker_FrontEnd/docs/RUNBOOK_LOCAL.md`
- Backend Runbook: `/Users/luis/Repos/CalorieTracker_BackEnd/docs/RUNBOOK_LOCAL.md`
- Canonical Docs: `/Users/luis/Repos/CalorieTracker_Plan/02_architecture_gdpr/`
- Execution Log: `/Users/luis/Repos/CalorieTracker_Plan/02_architecture_gdpr/32_EXECUTION_LOG_phase3_e2e_integration_2026-02-15.md`

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review service-specific runbooks
3. Check canonical documentation
4. Review execution log for known issues
