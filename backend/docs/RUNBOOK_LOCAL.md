# BackEnd Local Runbook

## Prerequisites
- Node 22+
- npm 10+
- Docker (optional, for local Postgres)
- `psql` client if running migrations manually

## Setup

### 1. Copy Environment Template
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
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

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Local Postgres (Optional)
Using Docker Compose (recommended):
```bash
docker compose up -d
```

Or use your own Postgres instance.

### 4. Run Database Migrations
```bash
npm run migrate
```

Check migration status:
```bash
npm run migrate:status
```

### 5. Seed Database (Optional)
For development with sample data:
```bash
npm run seed
```

## Development

### Start API Server
```bash
npm run dev
```
The API will be available at `http://localhost:4000`

### Health Check
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "calorietracker-backend",
  "timestamp": "2024-02-15T20:00:00.000Z",
  "environment": "development"
}
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Suite
```bash
# Auth endpoints
npm test auth-endpoints

# Logs endpoints
npm test logs-endpoints

# API health
npm test api-health

# Unit tests
npm test goal-calculations
npm test log-validation
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/user/:userId` - Get user by ID
- `PATCH /api/auth/user/:userId` - Update user
- `DELETE /api/auth/user/:userId` - Soft delete user

### Food Logs
- `GET /api/logs` - Get food logs (paginated)
- `GET /api/logs/today` - Get today's food logs
- `GET /api/logs/:foodLogId` - Get single food log
- `POST /api/logs` - Create food log
- `PATCH /api/logs/:foodLogId` - Update food log
- `DELETE /api/logs/:foodLogId` - Delete food log (soft delete)

### Goals
- `GET /api/goals` - Get goals (paginated)
- `GET /api/goals/active` - Get active goals
- `GET /api/goals/:goalId` - Get single goal
- `GET /api/goals/:goalId/progress` - Get goal progress
- `POST /api/goals` - Create goal
- `PATCH /api/goals/:goalId` - Update goal
- `DELETE /api/goals/:goalId` - Delete goal

### GDPR
- `GET /api/gdpr/requests` - Get GDPR requests (paginated)
- `GET /api/gdpr/requests/:requestId` - Get single GDPR request
- `POST /api/gdpr/requests` - Create GDPR request
- `GET /api/gdpr/export/:userId` - Export user data
- `POST /api/gdpr/erase/:userId` - Request data erasure
- `GET /api/gdpr/consent/:userId` - Get consent history

### Settings
- `GET /api/settings/notifications/:userId` - Get notification settings
- `PATCH /api/settings/notifications/:userId` - Update notification settings

## Database Schema

### Tables
- `users` - User accounts and profiles
- `food_logs` - Food log entries
- `goals` - User goals
- `notification_settings` - User notification preferences
- `consent_history` - Consent change history
- `gdpr_requests` - GDPR requests
- `processing_activities` - Processing activity logs
- `security_events` - Security event logs

### Migrations
Migrations are located in `src/db/migrations/`:
- `0001_init.sql` - Initial schema
- `0002_add_indexes.sql` - Performance indexes

### Seeds
Seed scripts are in `src/db/seeds/`:
- `seed_dev.sql` - Development data

## E2E Testing Setup

### Database Cleanup for E2E Tests

The FrontEnd E2E tests use test users that should be cleaned up. Tests include cleanup logic, but manual cleanup may be needed:

```sql
-- Delete test users created today
DELETE FROM users WHERE email LIKE 'test-%@example.com';

-- Or delete a specific user
DELETE FROM users WHERE id = 'user-id';
```

### Reset Database for Clean E2E Test Run

```bash
# Drop and recreate database
dropdb calorietracker
createdb calorietracker

# Run migrations
npm run migrate
```

## Troubleshooting

### Database Connection Issues
1. Check if Postgres is running:
```bash
docker ps | grep postgres
```

2. Check database credentials in `.env.local`

3. Test connection:
```bash
psql -h localhost -U postgres -d calorietracker
```

### Migration Errors
1. Check migration status:
```bash
npm run migrate:status
```

2. Run a dry-run to see what will be executed:
```bash
npm run migrate:dry-run
```

3. Manually run SQL if needed:
```bash
psql -h localhost -U postgres -d calorietracker -f src/db/migrations/0001_init.sql
```

### API Not Responding
1. Check if server is running:
```bash
lsof -i :4000
```

2. Check server logs for errors

3. Verify PORT in `.env.local`

### CORS Errors
If FrontEnd cannot connect to Backend, verify:
- `CORS_ORIGIN` in Backend `.env.local` matches FrontEnd URL
- Default is `http://localhost:3000`

## Development Workflow

1. Make changes to code
2. Run unit tests: `npm test`
3. Run integration tests: `npm test -- integration`
4. Check API health: `curl http://localhost:4000/health`
5. Test with Postman or similar tool

## Production Deployment Considerations

1. Set `NODE_ENV=production`
2. Use strong database password
3. Enable SSL/TLS for database connections
4. Configure proper CORS origins
5. Set up monitoring and logging
6. Configure backup strategy for database

## Additional Resources

- FrontEnd Runbook: `/Users/luis/Repos/CalorieTracker_FrontEnd/docs/RUNBOOK_LOCAL.md`
- Canonical Docs: `/Users/luis/Repos/CalorieTracker_ExternalData/02_architecture_gdpr/`
- API Documentation: See endpoint descriptions above
