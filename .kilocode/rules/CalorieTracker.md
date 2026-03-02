# CalorieTracker Project Rules

## Overview
CalorieTracker is a Next.js + Express/Node.js + PostgreSQL fitness tracking app.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, TypeScript
- **Backend**: Express/Node.js, TypeScript
- **Database**: PostgreSQL (local), Supabase optional
- **Auth**: Custom JWT-based auth

## Project Structure
```
/Users/luis/Repos/CalorieTracker/
├── backend/              # Express API server
│   ├── src/
│   │   ├── api/         # API routes
│   │   ├── db/         # Database queries/pool
│   │   └── ...
├── frontend/             # Next.js frontend
│   ├── src/
│   │   ├── app/        # Next.js pages
│   │   ├── core/       # API clients, services
│   │   └── ...
├── scripts/             # Dev/build scripts
└── tests/              # Test files
```

## Development Scripts
```bash
# Backend
cd backend && npm run dev      # Start on port 4000

# Frontend  
cd frontend && npm run dev    # Start on port 3000
```

## API Endpoints
- Base: `http://localhost:4000/api/`
- Auth: `/api/auth/*`
- Users: `/api/users/*`
- Goals: `/api/goals/*`
- Food Logs: `/api/food-logs/*`
- Weight Logs: `/api/weight-logs/*`

## Database
- Local PostgreSQL: `postgres://postgres:postgres@localhost:5432/calorietracker`
- Use `psql` for direct queries

## Key Tables
- `users` - User accounts
- `goals` - Calorie/macro goals
- `food_logs` - Daily food entries
- `weight_logs` - Weight tracking entries

## Code Standards
- Follow general rules in `~/.kilocode/rules/General Coding.md`
- Use TypeScript
- Use TailwindCSS for frontend styling
- Comments in English
- Conventional commits

## UI Patterns
See general UI/UX rules in global shared rules.
