# CalorieTracker Backend Execution Plan - MVP

## Overview

This document defines the MVP flow specifications, route guards, and lifecycle states for all frontend pages interacting with the backend API.

---

## 1. Route Guards for Frontend Pages

### Guard Definitions

| Guard | Check | Behavior on Fail |
|-------|-------|------------------|
| `AUTHENTICATED` | Valid JWT token in header | Redirect to /login |
| `ONBOARDING_COMPLETE` | `user.onboardingComplete === true` | Redirect to /onboarding |
| `USER_EXISTS` | User not soft-deleted | Redirect to /signup |
| `USER_OWNER` | `request.userId === resource.userId` | 403 Forbidden |

### Route Guard Matrix

| Page | Path | Required Guards | Notes |
|------|------|-----------------|-------|
| **Signup** | `/signup` | None (public) | Creates user, returns JWT |
| **Login** | `/login` | None (public) | Validates credentials, returns JWT |
| **Today** | `/today` | AUTHENTICATED, ONBOARDING_COMPLETE | Main dashboard |
| **History** | `/history` | AUTHENTICATED, ONBOARDING_COMPLETE | Paginated log view |
| **Settings** | `/settings` | AUTHENTICATED | User preferences |
| **Goals** | `/goals` | AUTHENTICATED, ONBOARDING_COMPLETE | Goal management |
| **Onboarding** | `/onboarding` | AUTHENTICATED, `!ONBOARDING_COMPLETE` | First-time setup |

---

## 2. Page Lifecycle States

### State Definitions

```
UNAUTHENTICATED -> AUTHENTICATING -> AUTHENTICATED -> LOADING -> READY -> ERROR
                                                       |
                                                       v
                                                    REFRESHING
```

### Per-Page State Matrix

#### Signup Page (`/signup`)
| State | Description | API Calls | UI Behavior |
|-------|-------------|-----------|-------------|
| `idle` | Initial form display | None | Show signup form |
| `submitting` | Form submission in progress | `POST /api/auth/register` | Disable form, show spinner |
| `success` | Registration complete | None | Redirect to /onboarding |
| `error` | Registration failed | None | Show error message, enable form |

#### Login Page (`/login`)
| State | Description | API Calls | UI Behavior |
|-------|-------------|-----------|-------------|
| `idle` | Initial form display | None | Show login form |
| `authenticating` | Credentials validation | `POST /api/auth/login` | Disable form, show spinner |
| `authenticated` | Login successful | None | Check onboarding, redirect |
| `error` | Login failed | None | Show error, enable form |

#### Today Page (`/today`)
| State | Description | API Calls | UI Behavior |
|-------|-------------|-----------|-------------|
| `loading` | Initial data fetch | `GET /api/logs/today?userId={id}` | Show skeleton |
| `ready` | Data loaded | None | Show meal groups |
| `refreshing` | Silent refresh | `GET /api/logs/today` | Keep content, update in place |
| `adding` | Adding food item | `POST /api/logs` | Show inline loader |
| `error` | API failure | None | Show retry button |

#### History Page (`/history`)
| State | Description | API Calls | UI Behavior |
|-------|-------------|-----------|-------------|
| `loading` | Initial fetch | `GET /api/logs?page=1` | Show skeleton |
| `ready` | Data loaded | None | Show paginated list |
| `loading_more` | Loading next page | `GET /api/logs?page=N` | Show loading indicator at bottom |
| `error` | API failure | None | Show retry |

#### Settings Page (`/settings`)
| State | Description | API Calls | UI Behavior |
|-------|-------------|-----------|-------------|
| `loading` | Fetch settings | `GET /api/auth/user/{userId}` | Show skeleton |
| `ready` | Settings loaded | None | Show editable form |
| `saving` | Saving changes | `PATCH /api/auth/user/{userId}` | Disable save button |
| `saved` | Save successful | None | Show success toast |
| `error` | Save failed | None | Show error toast |

#### Goals Page (`/goals`)
| State | Description | API Calls | UI Behavior |
|-------|-------------|-----------|-------------|
| `loading` | Fetch goals | `GET /api/goals/active?userId={id}` | Show skeleton |
| `ready` | Goals loaded | None | Show goal cards |
| `creating` | Creating goal | `POST /api/goals` | Show inline loader |
| `updating` | Updating goal | `PATCH /api/goals/{goalId}` | Show saving state |
| `error` | API failure | None | Show retry |

#### Onboarding Page (`/onboarding`)
| State | Description | API Calls | UI Behavior |
|-------|-------------|-----------|-------------|
| `loading` | Fetch user state | `GET /api/auth/user/{userId}` | Show loading |
| `step_N` | On step N of flow | None | Show step form |
| `submitting` | Submitting step | `PATCH /api/auth/user/{userId}/onboarding` | Disable form |
| `complete` | Onboarding done | None | Redirect to /today |
| `error` | Submission failed | None | Show error, retry |

---

## 3. Food Logging Flow Specification

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FOOD LOGGING FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. INPUT                                                        │
│     └─> User enters food text (e.g., "2 cups rice 400 cal")     │
│          │                                                       │
│  2. PARSE                                                        │
│     └─> POST /api/logs/parse                                     │
│          │  Request: { text: "2 cups rice 400 cal" }            │
│          │  Response: {                                          │
│          │    foodName: "rice",                                  │
│          │    quantity: 2,                                       │
│          │    unit: "cups",                                      │
│          │    nutrition: { calories: 400 }                       │
│          │  }                                                    │
│          ▼                                                       │
│  3. CONFIRM                                                      │
│     └─> Frontend shows parsed result for user confirmation      │
│          │  User can edit: foodName, quantity, unit, nutrition  │
│          │  User selects: mealType (breakfast|lunch|dinner|snack)│
│          ▼                                                       │
│  4. SAVE                                                         │
│     └─> POST /api/logs                                           │
│          │  Request: {                                           │
│          │    userId: "uuid",                                    │
│          │    foodName: "rice",                                  │
│          │    quantity: 2,                                       │
│          │    unit: "cups",                                      │
│          │    mealType: "lunch",                                 │
│          │    nutrition: { calories: 400, protein: 8 },         │
│          │    loggedAt: "2026-02-20T12:00:00Z"                  │
│          │  }                                                    │
│          │  Response: {                                          │
│          │    success: true,                                     │
│          │    data: { id: "uuid", ... }                          │
│          │  }                                                    │
│          ▼                                                       │
│  5. EDIT (Optional)                                              │
│     └─> PATCH /api/logs/{foodLogId}                              │
│          │  Request: { quantity: 3, nutrition: { calories: 600}}│
│          │  Response: { success: true, data: { ... updated } }  │
│          ▼                                                       │
│  6. DELETE (Optional)                                            │
│     └─> DELETE /api/logs/{foodLogId}                             │
│             Response: 204 No Content (soft delete)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow Step Details

#### Step 1: Input
- **Source**: Text input field or voice input (future)
- **Format**: Natural language food description
- **Examples**:
  - "2 eggs scrambled"
  - "1 cup coffee with milk 50 calories"
  - "chicken breast 200g 330 cal"

#### Step 2: Parse
- **Endpoint**: `POST /api/logs/parse`
- **Implementation**: `src/api/utils/nutrition-parser.ts`
- **Parses**: foodName, quantity, unit, nutrition values
- **Error Handling**: Returns `parse_error` if text cannot be parsed

#### Step 3: Confirm
- **Frontend Responsibility**: Display parsed result
- **User Actions**: Edit any field, select meal type
- **Validation**: Frontend validates before save

#### Step 4: Save
- **Endpoint**: `POST /api/logs`
- **Request Schema** (see `src/api/validation/schemas.ts`):
  ```typescript
  {
    userId: string (required, UUID)
    foodName: string (required, min 1 char)
    brandName?: string (optional)
    quantity: number (required, positive)
    unit: string (required)
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' (required)
    nutrition: {
      calories: number (required)
      protein?: number
      carbohydrates?: number
      fat?: number
    }
    loggedAt?: string (ISO 8601, defaults to now)
  }
  ```
- **Response**: Full food log object with generated `id`

#### Step 5: Edit
- **Endpoint**: `PATCH /api/logs/{foodLogId}`
- **Partial Update**: Only include changed fields
- **Ownership Check**: foodLog must belong to authenticated user

#### Step 6: Delete
- **Endpoint**: `DELETE /api/logs/{foodLogId}`
- **Implementation**: Soft delete (sets `is_deleted = true`)
- **Ownership Check**: foodLog must belong to authenticated user

### Batch Operations

For logging multiple items at once (e.g., entire meal):

- **Endpoint**: `POST /api/logs/batch`
- **Request**:
  ```typescript
  {
    userId: string
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    mealName?: string
    items: Array<{
      foodName: string
      brandName?: string
      quantity: number
      unit: string
      nutrition: Nutrition
    }>
    loggedAt?: string
  }
  ```
- **Response**: Array of results with success/error per item

---

## 4. Meal Item Identity Rule

### `/today/meal/[mealType]` Endpoint Specification

**Endpoint**: `GET /api/logs/meal/:mealType?userId={userId}&date={date}`

### Identity Rules

1. **Item Uniqueness**: Each food log entry has a unique UUID (`id` field)
2. **User Scope**: Items are scoped to `userId` - no cross-user access
3. **Date Scope**: Items are filtered by `DATE(logged_at) = date`
4. **Meal Type Scope**: Items are filtered by `meal_type = mealType`
5. **Deletion Filter**: Items with `is_deleted = TRUE` are excluded

### Response Structure

```typescript
{
  success: true,
  data: {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    date: '2026-02-20',
    items: Array<{
      id: string,           // UUID - primary identifier for edit/delete
      userId: string,       // Owner reference
      foodName: string,
      brandName: string | null,
      quantity: number,
      unit: string,
      mealType: string,
      nutrition: {
        calories: number,
        protein?: number,
        carbohydrates?: number,
        fat?: number
      },
      loggedAt: string,     // ISO 8601 timestamp
      createdAt: string,
      updatedAt: string
    }>,
    itemCount: number,
    totals: {
      calories: number,
      protein: number
    }
  },
  meta: {
    timestamp: string,
    userId: string
  }
}
```

### Meal Identity for Frontend Routing

For frontend route `/today/meal/[mealType]`:
- **Valid mealTypes**: `breakfast`, `lunch`, `dinner`, `snack`
- **Invalid mealType**: Returns 400 validation error
- **Date default**: If no date provided, uses current date

### Item Operations by ID

| Operation | Endpoint | ID Source |
|-----------|----------|-----------|
| View single | `GET /api/logs/{foodLogId}` | URL param |
| Edit | `PATCH /api/logs/{foodLogId}` | URL param |
| Delete | `DELETE /api/logs/{foodLogId}` | URL param |

**Critical**: All item operations require `foodLogId` (UUID), not meal-level identifier.

---

## 5. API Response Envelope

All endpoints follow this envelope structure:

### Success Response
```typescript
{
  success: true,
  data: T,              // Endpoint-specific data
  meta: {
    timestamp: string,  // ISO 8601
    // Additional pagination/filtering metadata as needed
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,       // Machine-readable error code
    message: string,    // Human-readable message
    details?: any       // Optional additional context
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `validation_error` | 400 | Request validation failed |
| `not_found` | 404 | Resource not found |
| `unauthorized` | 401 | Authentication required |
| `forbidden` | 403 | Access denied |
| `conflict` | 409 | Resource conflict |
| `internal_error` | 500 | Server error |

---

## 6. Authentication Flow

### JWT Token Handling

- **Algorithm**: HS256
- **Secret**: `JWT_SECRET` environment variable
- **Expiry**: 7 days (configurable via `JWT_EXPIRES_IN`)
- **Payload**: `{ userId: string }`

### Token Usage

```http
Authorization: Bearer <token>
```

### Token Lifecycle

1. **Issuance**: `POST /api/auth/register` or `POST /api/auth/login`
2. **Storage**: Frontend stores in secure storage
3. **Refresh**: Not implemented for MVP (7-day expiry)
4. **Revocation**: Token invalid on user soft-delete

---

## Acceptance Criteria

- [x] Route guards defined for all pages
- [x] Lifecycle states documented per page
- [x] Food logging flow (parse/confirm/save/edit/delete) specified
- [x] Meal item identity rule documented for `/today/meal/[mealType]`
- [x] API response envelope standardized
- [x] Authentication flow documented
