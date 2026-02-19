# FrontEnd Local Runbook

## Prerequisites
- Node 18+ (Node 20+ recommended)
- npm 10+
- Docker (optional, for local Postgres if running full stack)

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env.local
```

Edit `.env.local` if needed:
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000

# Node Environment
NODE_ENV=development
```

### 3. Database Setup (if running full stack)
The Backend manages the database. See `/Users/luis/Repos/CalorieTracker_BackEnd/docs/RUNBOOK_LOCAL.md`

Quick start for local Postgres:
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
docker compose up -d
npm run migrate
npm run seed
```

## Development

### Start Dev Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`

### Build for Production
```bash
npm run build
npm run start
```

### Lint Code
```bash
npm run lint
```

## Testing

### Run Unit Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run E2E Tests

#### Prerequisites
1. Ensure Backend API is running on `http://localhost:4000`
2. Ensure database is migrated and seeded
3. Install Playwright browsers (first time only):
```bash
npx playwright install
```

#### Run E2E Tests
```bash
npm run test:e2e
```

#### Run E2E Tests with UI
```bash
npm run test:e2e:ui
```

#### Run E2E Tests Headed (show browser)
```bash
npm run test:e2e:headed
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages (to be implemented)
│   ├── route-map.ts       # Route definitions
│   └── guards.ts          # Route guards
├── core/
│   ├── api/               # API integration layer
│   │   ├── client.ts      # HTTP client with interceptors
│   │   └── services/      # Domain services
│   ├── contracts/         # Shared contracts with Backend
│   │   ├── enums.ts       # Shared enums
│   │   └── types.ts       # API types
│   └── platform/          # Platform adapters
├── features/              # Feature modules (to be implemented)
├── __tests__/            # Unit tests
└── e2e/                   # E2E tests
    ├── utils/            # Test utilities
    └── tests/            # E2E test suites
```

## API Services Usage

### Import Services
```typescript
import {
  authService,
  logsService,
  goalsService,
  gdprService,
  settingsService,
  apiClient,
  tokenManager
} from '@/core/api';
```

### Example: Login User
```typescript
try {
  const user = await authService.login({ email: 'user@example.com' });
  console.log('Logged in:', user.email);
} catch (error) {
  if (error instanceof ApiClientError) {
    console.error('Login failed:', error.message);
  }
}
```

### Example: Create Food Log
```typescript
const log = await logsService.createLog({
  userId: 'user-id',
  foodName: 'Apple',
  quantity: 1,
  unit: 'piece',
  mealType: MealType.SNACK,
  nutrition: { calories: 95 },
});
```

## Contract Parity Testing

Run contract parity tests to ensure FrontEnd enums match BackEnd:
```bash
npm test contract-parity
```

These tests verify that:
- All enum keys match between FrontEnd and BackEnd
- All enum values match between FrontEnd and BackEnd
- No drift has occurred in shared contracts

## Troubleshooting

### "Module not found" errors
Make sure to install dependencies:
```bash
npm install
```

### E2E tests failing
1. Check that Backend API is running:
```bash
curl http://localhost:4000/health
```

2. Check that database is accessible:
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
npm run db:migrate status
```

3. Check CORS configuration in Backend (should allow `http://localhost:3000`)

### Build errors
Clear Next.js cache and try again:
```bash
rm -rf .next
npm run build
```

## Full Stack Development

To run the entire CalorieTracker stack:

1. Start Postgres:
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
docker compose up -d
```

2. Start Backend API:
```bash
cd /Users/luis/Repos/CalorieTracker_BackEnd
npm run dev
```

3. Start FrontEnd dev server:
```bash
cd /Users/luis/Repos/CalorieTracker_FrontEnd
npm run dev
```

4. Run E2E tests (in another terminal):
```bash
cd /Users/luis/Repos/CalorieTracker_FrontEnd
npm run test:e2e
```

## Additional Resources

- Backend Runbook: `/Users/luis/Repos/CalorieTracker_BackEnd/docs/RUNBOOK_LOCAL.md`
- Canonical Docs: `/Users/luis/Repos/CalorieTracker_ExternalData/02_architecture_gdpr/`
- Next.js Documentation: https://nextjs.org/docs
- Playwright Documentation: https://playwright.dev
