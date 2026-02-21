# Data Model Audit — 2026-02-21

## Purpose
Audit backend schema, enums, and frontend alignment against canonical data model plan (doc 26).

---

## Schema Audit

### Canonical Tables (from doc 26)
All 8 required MVP tables present in `schema.sql`:

| Table | Status | Notes |
|-------|--------|-------|
| `users` | ✅ Complete | All required fields present |
| `food_logs` | ✅ Complete | User-scoped, soft-delete, meal_type |
| `goals` | ✅ Complete | goal_type, is_active, date range |
| `notification_settings` | ✅ Complete | One row per user, channels JSONB |
| `consent_history` | ✅ Complete | consent_type, consent_version, metadata |
| `gdpr_requests` | ✅ Complete | request_type, status, timestamps |
| `processing_activities` | ✅ Complete | activity_type, data_categories, legal_basis |
| `security_events` | ✅ Complete | event_type, severity, user_id |

### Indexes (from doc 26)
All required indexes present:

| Index | Status |
|-------|--------|
| `idx_food_logs_user_logged_deleted` | ✅ Present |
| `idx_food_logs_user_meal_logged` | ✅ Present |
| `idx_goals_user_active_type` | ✅ Present |
| `idx_consent_user_type_created` | ✅ Present |
| `idx_gdpr_user_type_status_requested` | ✅ Present |
| `idx_notification_settings_user_unique` | ✅ Present (UNIQUE) |

### Soft-Delete Pattern (from doc 26)
Canonical fields applied consistently:
- `is_deleted` boolean flag ✅
- `deleted_at` timestamp ✅
- Applied to: `users`, `food_logs`

---

## Enums Audit

### Backend Enums (`src/shared/enums.ts`)

| Enum Type | Count | Values |
|-----------|-------|--------|
| `GoalType` | 1 | DAILY_CALORIES |
| `MealType` | 4 | BREAKFAST, LUNCH, DINNER, SNACK |
| `ConsentType` | 4 | PRIVACY_POLICY, TERMS_OF_SERVICE, ANALYTICS, MARKETING |
| `GDPRRequestType` | 4 | ACCESS, PORTABILITY, ERASURE, RECTIFICATION |
| `GDPRRequestStatus` | 4 | PENDING, PROCESSING, COMPLETED, REJECTED |
| `SecurityEventType` | 7 | LOGIN_SUCCESS, LOGIN_FAILURE, PASSWORD_CHANGE, EMAIL_CHANGE, CONSENT_WITHDRAWN, DATA_EXPORT, DATA_ERASURE_REQUEST |
| `SecurityEventSeverity` | 4 | LOW, MEDIUM, HIGH, CRITICAL |
| `ProcessingActivityType` | 6 | USER_REGISTRATION, FOOD_LOGGING, GOAL_TRACKING, CONSENT_MANAGEMENT, DATA_EXPORT, DATA_ERASURE |
| `LegalBasis` | 6 | CONSENT, CONTRACT, LEGAL_OBLIGATION, VITAL_INTERESTS, PUBLIC_TASK, LEGITIMATE_INTERESTS |

### Frontend Enums (`src/core/contracts/enums.ts`)

**Status:** ✅ **PERFECT ALIGNMENT** — All enums and values match backend exactly.

| Enum Type | Match Status |
|-----------|-------------|
| `GoalType` | ✅ Identical |
| `MealType` | ✅ Identical |
| `ConsentType` | ✅ Identical |
| `GDPRRequestType` | ✅ Identical |
| `GDPRRequestStatus` | ✅ Identical |
| `SecurityEventType` | ✅ Identical |
| `SecurityEventSeverity` | ✅ Identical |
| `ProcessingActivityType` | ✅ Identical |
| `LegalBasis` | ✅ Identical |

### Nutrition Interface

Both repos define identical `Nutrition` interface:
- `calories`: number (required)
- Optional macros: protein, carbohydrates, fat, fiber, sugar, sodium

---

## Migrations History

| Migration | Date | Change |
|-----------|-------|--------|
| `0001_init.sql` | 2025-02-15 | Core MVP tables |
| `0002_add_indexes.sql` | 2025-02-15 | Performance indexes |
| `0003_add_password_hash.sql` | 2025-02-19 | Add password_hash column |
| `0004_add_notifications_table.sql` | 2025-02-19 | Notification settings table |

All migrations are incremental and non-breaking.

---

## Consistency Summary

### ✅ Pass
- Schema matches doc 26 exactly
- All required MVP tables present
- Soft-delete pattern consistent
- All indexes from doc 26 present
- Enums frozen and synchronized
- Frontend/backend enum parity maintained

### ⚠️ Notes
- `password_hash` was added in migration 0003 (post-doc-26) — this is acceptable for security hardening
- No schema drift detected
- No enum mismatches detected

---

## Recommendations

1. **Maintain enum parity** — Any new enum changes must be applied to both `backend/src/shared/enums.ts` and `frontend/src/core/contracts/enums.ts` simultaneously
2. **Add contract parity tests** (future) — Automated tests to detect enum drift in CI/CD
3. **Document password_hash addition** — Update doc 26 to reflect security hardening if needed

---

## Conclusion

**Status:** ✅ **DATA MODEL HEALTHY**

All canonical tables, fields, enums, and indexes from doc 26 are correctly implemented. Frontend and backend enums are perfectly synchronized. No action required beyond monitoring for future drift.
