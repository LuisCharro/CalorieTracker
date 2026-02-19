# 30 — Frontend Component Inventory

**Status:** Work-in-progress
**Created:** 2026-02-19
**Purpose:** Document active screens/components and their API dependencies

---

## Overview

This document lists all active frontend screens and components in the CalorieTracker application, along with their API dependencies. Use this to spot missing coverage, verify backend-frontend contract alignment, and track API calls across the application.

---

## Authentication & Onboarding Flow

### 1. Signup Page (`/signup`)
**Path:** `/frontend/src/app/signup/page.tsx`
**Route:** `/signup`

**Purpose:** Create new user account

**API Dependencies:**
- `POST /api/auth/register` (via `authService.signup()`)
  - **Request:** `{ email, displayName?, password, confirmPassword }`
  - **Response:** `{ success, data: { id, email, displayName, preferences, onboardingComplete, createdAt, token } }`

**Fields Validated:**
- Email (email format)
- Password (minimum length, requirements)
- Confirm Password (matches password)
- Display Name (optional)

**Success Flow:** Redirect to `/onboarding/goals`
**Error Handling:** Shows inline error messages from API

---

### 2. Onboarding Goals Page (`/onboarding/goals`)
**Path:** `/frontend/src/app/onboarding/goals/page.tsx`
**Route:** `/onboarding/goals`

**Purpose:** Set primary calorie goal (lose/maintain/gain weight)

**API Dependencies:**
- `POST /api/goals` (via `goalsService.createGoal()`)
  - **Request:** `{ userId, goalType, targetValue, startDate }`
  - **Response:** `{ success, data: Goal, meta: { timestamp } }`

**Fields:**
- Goal Selection: `'lose' | 'maintain' | 'gain'`
- Target Calories: Number (1200-4000 range via slider)
- Goal Type: `GoalType.DAILY_CALORIES` (enum)

**Presets:**
- Lose: 1800 calories
- Maintain: 2000 calories
- Gain: 2500 calories

**Success Flow:** Redirect to `/onboarding/preferences`
**Error Handling:** Shows alert error message on failure

---

### 3. Onboarding Preferences Page (`/onboarding/preferences`)
**Path:** `/frontend/src/app/onboarding/preferences/page.tsx`
**Route:** `/onboarding/preferences`

**Purpose:** Customize diet type and meal tracking preferences

**API Dependencies:**
- `PATCH /api/auth/user/:userId` (via `authService.updateCurrentUser()`)
  - **Request:** `{ displayName?, preferences? }`
  - **Response:** `{ success, data: User }`

**Fields (stored in preferences):**
- `diet`: `'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo'`
- `meals`: JSON string array `['breakfast', 'lunch', 'dinner', 'snack']`
- `timezone`: Detected from `Intl.DateTimeFormat().resolvedOptions().timeZone`

**Success Flow:** Redirect to `/onboarding/consents`
**Error Handling:** Shows alert error message on failure

---

### 4. Onboarding Consents Page (`/onboarding/consents`)
**Path:** `/frontend/src/app/onboarding/consents/page.tsx`
**Route:** `/onboarding/consents`

**Purpose:** Accept required privacy and terms consents

**API Dependencies:**
- `POST /api/auth/user/:userId/consents` (via `authService.submitConsents()`)
  - **Request:** `{ userId, consents: Record<string, boolean> }`
  - **Response:** `{ success: true }`

**Required Consents:**
- `privacy_policy`: Required (must be true to continue)
- `terms_of_service`: Required (must be true to continue)

**Success Flow:** Redirect to `/onboarding/consents-optional`
**Error Handling:** Shows alert if not all required consents accepted

---

### 5. Onboarding Optional Consents Page (`/onboarding/consents-optional`)
**Path:** `/frontend/src/app/onboarding/consents-optional/page.tsx`
**Route:** `/onboarding/consents-optional`

**Purpose:** Accept optional consents (analytics, marketing)

**API Dependencies:**
- `POST /api/auth/user/:userId/consents` (via `authService.submitConsents()`)
  - **Request:** `{ userId, consents: Record<string, boolean> }`
  - **Response:** `{ success: true }`

**Optional Consents:**
- `analytics`: User consent for usage analytics
- `marketing`: User consent for marketing emails

**Success Flow:** Redirect to `/onboarding/complete`
**Skip Flow:** Can skip without accepting optional consents

---

### 6. Onboarding Complete Page (`/onboarding/complete`)
**Path:** `/frontend/src/app/onboarding/complete/page.tsx`
**Route:** `/onboarding/complete`

**Purpose:** Mark onboarding complete and redirect to dashboard

**API Dependencies:**
- `PATCH /api/auth/user/:userId/onboarding` (via `authService.completeOnboarding()`)
  - **Request:** `{ onboardingComplete: true }`
  - **Response:** `{ success, data: { onboardingComplete } }`

**Success Flow:** Redirect to `/today` (dashboard)
**Auto-redirect:** Wait 3 seconds then redirect

---

### 7. Login Page (`/login`)
**Path:** `/frontend/src/app/login/page.tsx`
**Route:** `/login`

**Purpose:** Authenticate existing user

**API Dependencies:**
- `POST /api/auth/login` (via `authService.login()`)
  - **Request:** `{ email, password? }`
  - **Response:** `{ success, data: { id, email, displayName, preferences, onboardingComplete, createdAt, token } }`

**Fields:**
- Email (required)
- Password (required)

**Success Flow:** Redirect to `/today` (if onboarding complete) or `/onboarding/goals` (if not)
**Error Handling:** Shows inline error messages for invalid credentials

---

## Main Application Screens

### 8. Dashboard / Today Page (`/today`)
**Path:** `/frontend/src/app/today/page.tsx`
**Route:** `/today`

**Purpose:** View today's calorie intake and log meals

**API Dependencies:**
- `GET /api/goals/active` (via `goalsService.getActiveGoals(userId)`)
  - **Response:** `{ success, data: Goal[] }`
- `GET /api/goals/:goalId/progress` (via `goalsService.getGoalProgress(goalId)`)
  - **Response:** `{ success, data: GoalProgress }`
- GET endpoints for food logs (TBD - implementation pending)

**Features:**
- View active calorie goal
- Track progress toward daily target
- Log meals (implementation pending)
- View breakdown by meal type (implementation pending)

---

### 9. History Page (`/history`)
**Path:** `/frontend/src/app/history/page.tsx`
**Route:** `/history`

**Purpose:** View historical food log entries

**API Dependencies:**
- GET endpoints for food logs with pagination (TBD - implementation pending)

**Features:**
- List of past entries
- Filter by date range (implementation pending)
- View entry details (implementation pending)

---

### 10. History Entry Detail Page (`/history/entry/[id]`)
**Path:** `/frontend/src/app/history/entry/[id]/page.tsx`
**Route:** `/history/entry/:id`

**Purpose:** View detailed information for a specific food log entry

**API Dependencies:**
- GET endpoints for specific food log entry (TBD - implementation pending)

---

### 11. Today Meal Detail Page (`/today/meal/[id]`)
**Path:** `/frontend/src/app/today/meal/[id]/page.tsx`
**Route:** `/today/meal/:id`

**Purpose:** View or edit a specific meal entry for today

**API Dependencies:**
- GET/PUT/DELETE endpoints for food log entry (TBD - implementation pending)

---

## Settings Screens

### 12. Profile Settings (`/settings/profile`)
**Path:** `/frontend/src/app/settings/profile/page.tsx`
**Route:** `/settings/profile`

**Purpose:** Update user profile information

**API Dependencies:**
- `PATCH /api/auth/user/:userId` (via `authService.updateCurrentUser()`)
  - **Request:** `{ displayName? }`
  - **Response:** `{ success, data: User }`

**Fields:**
- Display Name

---

### 13. Goals Settings (`/settings/goals`)
**Path:** `/frontend/src/app/settings/goals/page.tsx`
**Route:** `/settings/goals`

**Purpose:** View and update goals

**API Dependencies:**
- `GET /api/goals` (via `goalsService.getGoals(query)`)
  - **Request:** `{ page, pageSize, isActive?, goalType? }`
  - **Response:** `{ success, data: Goal[], meta: { page, pageSize, total, totalPages } }`
- `POST /api/goals` (via `goalsService.createGoal(data)`)
  - **Request:** `{ userId, goalType, targetValue, startDate, endDate? }`
  - **Response:** `{ success, data: Goal }`
- `PATCH /api/goals/:goalId` (via `goalsService.updateGoal(goalId, data)`)
  - **Request:** `{ targetValue?, isActive?, endDate? }`
  - **Response:** `{ success, data: Goal }`
- `DELETE /api/goals/:goalId` (via `goalsService.deleteGoal(goalId)`)
  - **Response:** 204 No Content

**Features:**
- List all goals
- Create new goals
- Edit existing goals
- Delete goals
- Activate/deactivate goals

---

### 14. Preferences Settings (`/settings/preferences`)
**Path:** `/frontend/src/app/settings/preferences/page.tsx`
**Route:** `/settings/preferences`

**Purpose:** Update user preferences (diet type, tracked meals, timezone)

**API Dependencies:**
- `PATCH /api/auth/user/:userId` (via `authService.updateCurrentUser()`)
  - **Request:** `{ preferences? }`
  - **Response:** `{ success, data: User }`

**Fields:**
- Diet type
- Tracked meals
- Timezone

---

### 15. Notifications Settings (`/settings/notifications`)
**Path:** `/frontend/src/app/settings/notifications/page.tsx`
**Route:** `/settings/notifications`

**Purpose:** Configure notification preferences

**API Dependencies:**
- GET/PUT endpoints for notification settings (TBD - implementation pending)

---

### 16. Privacy Settings (`/settings/privacy`)
**Path:** `/frontend/src/app/settings/privacy/page.tsx`
**Route:** `/settings/privacy`

**Purpose:** Manage privacy and GDPR-related settings

**API Dependencies:**
- GDPR-related endpoints (TBD - implementation pending)

---

### 17. GDPR Delete Page (`/settings/gdpr/delete`)
**Path:** `/frontend/src/app/settings/gdpr/delete/page.tsx`
**Route:** `/settings/gdpr/delete`

**Purpose:** Request account deletion (GDPR right to erasure)

**API Dependencies:**
- `POST /api/gdpr/requests` (via `gdprService.createRequest()`)
  - **Request:** `{ userId, requestType, metadata? }`
  - **Response:** `{ success, data: GDPRRequest }`

**Request Type:** `GDPRRequestType.ERASURE`

---

### 18. GDPR Export Page (`/settings/gdpr/export`)
**Path:** `/frontend/src/app/settings/gdpr/export/page.tsx`
**Route:** `/settings/gdpr/export`

**Purpose:** Request data export (GDPR right to portability)

**API Dependencies:**
- `POST /api/gdpr/requests` (via `gdprService.createRequest()`)
  - **Request:** `{ userId, requestType, metadata? }`
  - **Response:** `{ success, data: GDPRRequest }`

**Request Type:** `GDPRRequestType.PORTABILITY`

---

## Static Pages

### 19. Privacy Policy (`/privacy`)
**Path:** `/frontend/src/app/privacy/page.tsx`
**Route:** `/privacy`

**Purpose:** Display privacy policy document

**API Dependencies:** None (static content)

---

### 20. Terms of Service (`/terms`)
**Path:** `/frontend/src/app/terms/page.tsx`
**Route:** `/terms`

**Purpose:** Display terms of service document

**API Dependencies:** None (static content)

---

## Other Pages

### 21. Log Confirm Page (`/log/confirm`)
**Path:** `/frontend/src/app/log/confirm/page.tsx`
**Route:** `/log/confirm`

**Purpose:** Confirm food log entry (implementation pending)

**API Dependencies:** TBD

---

## Core Components & Services

### Auth Context (`/frontend/src/core/auth/AuthContext.tsx`)
**Purpose:** Manage authentication state and provide user context

**Dependencies:**
- `authService` for API calls
- `tokenManager` for token storage
- Route guards for protected pages

---

### Offline Queue Context (`/frontend/src/core/contexts/OfflineQueueContext.tsx`)
**Purpose:** Manage offline queue for local-first functionality

**Dependencies:**
- `offlineQueueService` for queue operations
- `syncService` for synchronization

**Status:** Infrastructure in place, implementation pending

---

### API Client (`/frontend/src/core/api/client.ts`)
**Purpose:** Centralized HTTP client for all API requests

**Features:**
- Request/response interceptors
- Token injection
- Error handling
- Base URL configuration

---

### Services

#### Auth Service (`/frontend/src/core/api/services/auth.service.ts`)
- `register()` / `signup()`
- `login()`
- `getUser()` / `getCurrentUser()`
- `updateUser()` / `updateCurrentUser()`
- `submitConsents()`
- `completeOnboarding()`
- `deleteUser()`
- `logout()`

#### Goals Service (`/frontend/src/core/api/services/goals.service.ts`)
- `getGoals()` - with pagination
- `getActiveGoals()`
- `getGoal()`
- `getGoalProgress()`
- `createGoal()`
- `updateGoal()`
- `deleteGoal()`

#### GDPR Service (`/frontend/src/core/api/services/gdpr.service.ts`)
- `createRequest()` - GDPR requests (access, portability, erasure, rectification)
- `getRequests()` - list user's GDPR requests
- `exportData()` - get data export

#### Settings Service (`/frontend/src/core/api/services/settings.service.ts`)
- `getNotificationSettings()`
- `updateNotificationSettings()`

#### Offline Queue Service (`/frontend/src/core/api/services/offline-queue.service.ts`)
- Queue operations for offline mode
- **Status:** Implementation pending

#### Sync Service (`/frontend/src/core/api/services/sync.service.ts`)
- Synchronization operations
- **Status:** Implementation pending

---

## Shared Components (`/frontend/src/shared/components`)

### Layout Components
- `Layout` - Main application layout wrapper
- `Header` - Page header with title and subtitle
- `Footer` - Application footer

### UI Components
- `Button` - Button with variants and loading states
- `Card`, `CardHeader`, `CardBody` - Card layout components
- `Alert` - Alert messages for errors, warnings, info
- `Input` - Form input field
- `Select` - Dropdown select component
- `Modal` - Modal dialog component
- Loading states, spinners, etc.

---

## Missing Coverage / TODO

### Not Yet Implemented
- Food log CRUD operations
- Meal logging UI
- Nutrition search/add (external API integration)
- Offline queue operations
- Sync operations
- Notification settings UI
- Full GDPR request management UI

### Error State Coverage
- Duplicate signup error handling in E2E tests
- Network failure scenarios
- Backend unavailable scenarios
- Validation error scenarios

### Test Gaps
- Integration tests for full onboarding flow
- Error state mock handlers in MSW
- Playwright tests for error scenarios

---

## API Contract Alignment Notes

### ✅ Aligned
- Signup/register flow
- Goals creation
- Preferences update
- Consents submission
- Login flow

### ⚠️ Needs Review
- Food log operations (not yet implemented)
- Offline queue operations (not yet implemented)
- Sync operations (not yet implemented)

### 📝 Documentation Needed
- Expected error response formats
- Rate limiting behavior
- Pagination conventions
- Field validation rules (client vs server)

---

**Last Updated:** 2026-02-19
