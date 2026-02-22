# CalorieTracker Backend Security & Compliance

## Overview

This document defines the access control model, data retention policies, erasure procedures, and data export formats for GDPR compliance.

---

## 1. Access Control Model

### User-Scoped Data Access

All user data is scoped to the individual user. No cross-user data access is permitted.

### Data Categories by Access Level

| Data Category | Owner | Access Rules |
|--------------|-------|--------------|
| **User Profile** | User | Only user can read/write own profile |
| **Food Logs** | User | Only user can CRUD own logs |
| **Goals** | User | Only user can CRUD own goals |
| **Notification Settings** | User | Only user can read/write own settings |
| **Consent History** | User | User can read own consent history |
| **GDPR Requests** | User | User can create/read own requests |
| **Processing Activities** | System | Logged automatically, user can view |
| **Security Events** | System | Logged automatically, admin-only |

### Access Control Enforcement

#### API Level
- **User ID Validation**: Every endpoint requiring user-scoped data validates `userId` parameter
- **Token Verification**: JWT token contains `userId`, validated on protected routes
- **Soft Delete Filter**: All queries include `is_deleted = FALSE` condition

#### Implementation Example
```typescript
// src/api/routers/logs.router.ts
router.get('/', async (req, res) => {
  const { userId } = req.query;
  
  // Validate userId presence
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: { code: 'validation_error', message: 'userId is required' }
    });
  }
  
  // Query with user scope and soft-delete filter
  const result = await query(
    `SELECT * FROM food_logs WHERE user_id = $1 AND is_deleted = FALSE`,
    [userId]
  );
  // ...
});
```

### Who Can Access What

| Actor | Own Data | Other User Data | System Data |
|-------|----------|-----------------|-------------|
| **Anonymous User** | N/A | None | Public endpoints only |
| **Authenticated User** | Full CRUD | None | Own consent/events |
| **Admin** (future) | N/A | Read-only for support | Full access |
| **System** | N/A | N/A | Write for logging |

### Authorization Matrix

| Endpoint | User Scope Check | Notes |
|----------|------------------|-------|
| `GET /api/auth/user/:userId` | URL param userId must match token | Profile read |
| `PATCH /api/auth/user/:userId` | URL param userId must match token | Profile update |
| `DELETE /api/auth/user/:userId` | URL param userId must match token | Self-delete |
| `GET /api/logs` | Query param userId required | Logs list |
| `POST /api/logs` | Body.userId must match token | Create log |
| `PATCH /api/logs/:foodLogId` | foodLog must belong to token user | Update log |
| `DELETE /api/logs/:foodLogId` | foodLog must belong to token user | Delete log |
| `GET /api/goals` | Query param userId required | Goals list |
| `GET /api/gdpr/export/:userId` | URL param userId must match token | Data export |
| `POST /api/gdpr/erase/:userId` | URL param userId must match token | Request erasure |

---

## 2. Data Retention Policies

### Retention Schedule

| Data Type | Retention Period | After Retention | Legal Basis |
|-----------|------------------|-----------------|-------------|
| **Daily Food Logs** | 7 days active, 30 days soft-deleted | Hard delete | User consent |
| **User Goals** | Until user deletion | Cascade delete | Contract |
| **Consent History** | Duration of account + 3 years | Anonymize | Legal obligation |
| **GDPR Requests** | Duration of account + 7 years | Archive | Legal obligation |
| **Processing Activities** | 2 years | Anonymize | Legal obligation |
| **Security Events** | 1 year | Hard delete | Legitimate interest |

### Daily Log Retention Details

```
┌────────────────────────────────────────────────────────────────┐
│                 FOOD LOG LIFECYCLE                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Created]                                                      │
│      │                                                          │
│      ▼                                                          │
│  ──[Active: 7 days]──> [Soft Deleted by user or retention]     │
│                              │                                  │
│                              ▼                                  │
│                    ──[Grace: 30 days]──> [Hard Delete]          │
│                                                                 │
│  Active logs: is_deleted = FALSE                                │
│  Soft deleted: is_deleted = TRUE, deleted_at IS NOT NULL        │
│  Hard deleted: Row removed from table                           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Retention Job Configuration

```typescript
// Environment variables for retention
DAILY_LOG_ACTIVE_DAYS=7          // Days before soft-delete
DAILY_LOG_GRACE_DAYS=30          // Days after soft-delete before hard delete
SECURITY_EVENT_RETENTION_DAYS=365
PROCESSING_ACTIVITY_RETENTION_DAYS=730
```

---

## 3. Erasure Policies

### Erasure Types

| Type | Trigger | Timeline | Scope |
|------|---------|----------|-------|
| **Soft Delete** | User action (DELETE endpoint) | Immediate | Sets `is_deleted = TRUE` |
| **GDPR Erasure Request** | `POST /api/gdpr/erase/:userId` | 30-day grace period | Full account deletion |
| **Explicit User Deletion** | Account deletion flow | Immediate | Full account deletion |
| **Retention Expiry** | Automated job | Per retention schedule | Per-data-type cleanup |

### GDPR Erasure Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GDPR ERASURE FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User requests erasure                                        │
│     └─> POST /api/gdpr/erase/:userId                            │
│          Response: { status: 'pending', gracePeriodDays: 30 }   │
│                                                                  │
│  2. System creates GDPR request (status: pending)               │
│     └─> Stored in gdpr_requests table                           │
│                                                                  │
│  3. Grace period (30 days)                                       │
│     └─> User can cancel by contacting support                   │
│                                                                  │
│  4. Grace period expires                                         │
│     └─> Background job picks up pending requests                │
│          - Status changes to 'processing'                        │
│          - User account soft-deleted                             │
│                                                                  │
│  5. Erasure execution                                            │
│     └─> All user data hard-deleted:                             │
│          - users (hard delete)                                   │
│          - food_logs (hard delete)                               │
│          - goals (hard delete)                                   │
│          - notification_settings (hard delete)                   │
│          - consent_history (anonymize)                           │
│          - gdpr_requests (mark as completed, keep record)        │
│          - processing_activities (anonymize)                     │
│          - security_events (anonymize)                           │
│                                                                  │
│  6. Request marked complete                                      │
│     └─> Status: 'completed', completed_at timestamp set         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Erasure Implementation

Background job located at: `src/api/jobs/gdpr-erasure-job.ts`

```typescript
// Grace period configuration
GDPR_ERASURE_GRACE_PERIOD_DAYS=30  // Default: 30 days

// Erasure job runs daily at 02:00 UTC
// Processes requests where:
// - status = 'pending'
// - requested_at < NOW() - INTERVAL '30 days'
```

### Immediate Erasure (Explicit User Request)

For explicit account deletion (not GDPR erasure request):

```http
DELETE /api/auth/user/:userId
```

This performs immediate soft delete. Hard delete follows retention schedule.

### Data Anonymization

When hard deleting, certain records are anonymized rather than deleted for audit purposes:

| Table | Anonymization Method |
|-------|---------------------|
| `consent_history` | Replace `user_id` with `ANONYMIZED_{hash}` |
| `processing_activities` | Replace `user_id` with `ANONYMIZED_{hash}` |
| `security_events` | Replace `user_id` with `ANONYMIZED_{hash}` |
| `gdpr_requests` | Keep record with status `completed` |

---

## 4. Data Export Format

### Export Endpoint

```http
GET /api/gdpr/export/:userId
```

### Export Format: JSON (Required)

JSON is the primary export format for GDPR data portability requests.

```typescript
{
  user: {
    id: string,
    email: string,
    displayName: string | null,
    preferences: {
      theme: 'light' | 'dark' | 'system',
      units: 'metric' | 'imperial',
      language: string
    },
    onboardingComplete: boolean,
    createdAt: string,
    lastLoginAt: string | null
  },
  foodLogs: Array<{
    id: string,
    foodName: string,
    brandName: string | null,
    quantity: number,
    unit: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    nutrition: {
      calories: number,
      protein?: number,
      carbohydrates?: number,
      fat?: number
    },
    loggedAt: string,
    createdAt: string,
    updatedAt: string
  }>,
  goals: Array<{
    id: string,
    goalType: 'daily_calories',
    targetValue: number,
    isActive: boolean,
    startDate: string,
    endDate: string | null,
    createdAt: string,
    updatedAt: string
  }>,
  notificationSettings: {
    channels: {
      email: boolean,
      push: boolean,
      sms: boolean
    },
    reminderTimes: {
      breakfast: string | null,
      lunch: string | null,
      dinner: string | null
    },
    timezone: string,
    updatedAt: string
  } | null,
  consentHistory: Array<{
    consentType: string,
    consentGiven: boolean,
    consentVersion: string,
    metadata: object,
    createdAt: string
  }>,
  gdprRequests: Array<{
    requestType: 'access' | 'portability' | 'erasure' | 'rectification',
    status: 'pending' | 'processing' | 'completed' | 'rejected',
    requestedAt: string,
    completedAt: string | null,
    metadata: object
  }>,
  processingActivities: Array<{
    activityType: string,
    dataCategories: string[],
    purpose: string,
    legalBasis: string,
    metadata: object,
    createdAt: string
  }>,
  exportedAt: string  // ISO 8601 timestamp
}
```

### Export Format: CSV (Optional)

CSV export is optional and can be implemented per-data-type:

| Data Type | CSV Availability |
|-----------|-----------------|
| Food Logs | Optional |
| Goals | Optional |
| User Profile | Optional |

### Export Metadata

```typescript
{
  success: true,
  data: { /* export structure above */ },
  meta: {
    timestamp: string,
    format: 'json' | 'csv',  // Default: json
    version: '1.0'
  }
}
```

### Format Configuration

```bash
# .env configuration
GDPR_EXPORT_FORMAT=json     # Required format
GDPR_EXPORT_VERSION=1.0     # Export schema version
```

---

## 5. Security Event Logging

### Logged Events

| Event Type | Severity | Trigger | Data Logged |
|------------|----------|---------|-------------|
| `signup_success` | info | Account created | userId, ip_hash, user_agent |
| `login_success` | info | Successful login | userId, ip_hash, user_agent |
| `login_failure` | warning | Failed login attempt | email (hashed), ip_hash, reason |
| `data_export` | info | GDPR export | userId, format |
| `data_erasure_request` | warning | Erasure requested | userId |

### IP Hashing

IP addresses are hashed before storage for privacy:

```typescript
// src/api/routers/auth.router.ts
const ipHash = crypto.createHash('sha256')
  .update(ip.toString())
  .digest('hex')
  .substring(0, 32);
```

### Security Event Schema

```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  user_id UUID REFERENCES users(id),
  ip_hash VARCHAR(32),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. Consent Management

### Consent Types

| Type | Required | Description |
|------|----------|-------------|
| `privacy_policy` | Yes | Acceptance of privacy policy |
| `terms_of_service` | Yes | Acceptance of terms of service |
| `analytics` | No | Analytics data collection |
| `marketing` | No | Marketing communications |

### Consent Recording

```http
POST /api/auth/user/:userId/consents
Content-Type: application/json

{
  "consents": {
    "privacy_policy": true,
    "terms_of_service": true,
    "analytics": false,
    "marketing": false
  }
}
```

### Consent History Query

```http
GET /api/gdpr/consent/:userId
```

Returns current consent state and full history of changes.

---

## Compliance Checklist

- [x] Access control model documented (user-scoped data)
- [x] Retention policy: 7-day active for daily logs
- [x] Erasure grace period: 30 days for GDPR requests
- [x] Immediate erasure for explicit user deletion
- [x] Data export format: JSON required
- [x] CSV export: Optional (future)
- [x] Security event logging implemented
- [x] Consent management documented
