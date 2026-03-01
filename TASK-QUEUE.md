# CalorieTracker Task Queue
**Branch:** development  
**Created:** 2026-03-01  
**Based on:** plan/DEVELOPMENT_PLAN.md

---

## Phase 1: Onboarding Rebuild (Priority: HIGH)

### Task 1.1: Add Profile Fields to User Model
- **Scope:** Backend user model + migration
- **Files:** backend/Models/, backend/Data/
- **Commands:** dotnet ef migrations add ProfileFields
- **Verification:** API returns new profile fields
- **Status:** PENDING

### Task 1.2: Create Unit Conversion Utilities
- **Scope:** Backend service
- **Files:** backend/Services/UnitConverter.cs
- **Commands:** dotnet build
- **Verification:** Unit conversion tests pass
- **Status:** PENDING

### Task 1.3: Add TDEE/BMR Calculation Service
- **Scope:** Backend service
- **Files:** backend/Services/CalorieCalculator.cs
- **Commands:** dotnet build
- **Verification:** TDEE calculation matches expected values
- **Status:** PENDING

### Task 1.4: Rebuild Onboarding - Welcome + Profile (Steps 1-5)
- **Scope:** Frontend pages
- **Files:** frontend/src/app/onboarding/
- **Commands:** npm run build
- **Verification:** All 5 profile steps work
- **Status:** PENDING

### Task 1.5: Rebuild Onboarding - Activity + Goals (Steps 6-7)
- **Scope:** Frontend pages
- **Files:** frontend/src/app/onboarding/
- **Commands:** npm run build
- **Verification:** Activity level + goals work
- **Status:** PENDING

### Task 1.6: Rebuild Onboarding - Preferences + Complete (Step 8)
- **Scope:** Frontend pages
- **Files:** frontend/src/app/onboarding/
- **Commands:** npm run build
- **Verification:** Preferences + completion work
- **Status:** PENDING

---

## Phase 2: Food Cache (Priority: MEDIUM)

### Task 2.1: Create Food Cache Table
- **Scope:** Backend database
- **Files:** backend/Migrations/, backend/Models/
- **Commands:** dotnet ef migrations add FoodCache
- **Verification:** Table created
- **Status:** PENDING

### Task 2.2: Add Food Cache API Endpoints
- **Scope:** Backend API
- **Files:** backend/Controllers/
- **Commands:** dotnet build
- **Verification:** CRUD endpoints work
- **Status:** PENDING

### Task 2.3: Add Recent Foods to Meal Entry
- **Scope:** Frontend
- **Files:** frontend/src/app/today/
- **Commands:** npm run build
- **Verification:** Recent foods show per meal
- **Status:** PENDING

---

## Phase 3: Placeholder Tables (Priority: LOW)

### Task 3.1: Create Weight Logs Table + UI
- **Scope:** Backend + Frontend
- **Files:** backend/Migrations/, frontend/src/app/
- **Commands:** dotnet build && npm run build
- **Verification:** Weight logging works
- **Status:** PENDING

### Task 3.2: Create Exercises Table + UI
- **Scope:** Backend + Frontend
- **Files:** backend/Migrations/, frontend/src/app/
- **Commands:** dotnet build && npm run build
- **Verification:** Exercise logging works
- **Status:** PENDING

### Task 3.3: Create Water Logs Table + UI
- **Scope:** Backend + Frontend
- **Files:** backend/Migrations/, frontend/src/app/
- **Commands:** dotnet build && npm run build
- **Verification:** Water logging works
- **Status:** PENDING

---

## Phase 4: Polish (Priority: LOW)

### Task 4.1: Empty States
- **Scope:** Frontend components
- **Files:** frontend/src/shared/components/
- **Commands:** npm run build
- **Verification:** Empty states look good
- **Status:** PENDING

### Task 4.2: Loading + Error States
- **Scope:** Frontend components
- **Files:** frontend/src/shared/components/
- **Commands:** npm run build
- **Verification:** Loading/error states work
- **Status:** PENDING

---

## Notes

- Phase 1 is blocking - must complete first
- Phase 2 depends on Phase 1
- Phase 3 can be done in parallel after Phase 1
- Phase 4 is final polish
