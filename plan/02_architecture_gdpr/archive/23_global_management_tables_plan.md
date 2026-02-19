# 23 — Global Management Tables Plan (MVP-Appropriate)

**Goal:** Define internal/admin/global operational tables that keep MVP safe/compliant now and scalable later.

---

## 1) Design Principles

- Keep row volume low at MVP.
- Prefer append-only logs for compliance/security evidence.
- Add scale-heavy operational tables only with explicit trigger conditions.

---

## 2) Required vs Optional Tables

## Required in MVP

| Table | Why Required Now | Core Columns |
|---|---|---|
| `security_events` | Security monitoring + incident evidence | `id,event_type,user_id,severity,ip_hash,user_agent,details,created_at` |
| `processing_activities` | GDPR Article 30 processing record | `id,user_id,activity_type,data_categories,purpose,legal_basis,metadata,created_at` |
| `gdpr_requests` | Workflow tracking for rights handling | `id,user_id,request_type,status,requested_at,completed_at,metadata` |
| `consent_history` | Immutable consent audit trail | `id,user_id,consent_type,consent_given,consent_version,metadata,created_at` |
| `schema_migrations` *(if not tool-managed)* | Operational traceability of DB changes | `version,name,applied_at` |

## Optional (defer until trigger)

| Table | Value | Trigger to Add |
|---|---|---|
| `feature_flags` | Safer rollout, A/B toggles | first staged rollout or >2 envs |
| `system_settings` | Runtime config without deploy | >5 configurable ops knobs |
| `job_queue` | Reliable async jobs | >1 background workflow beyond simple cron |
| `rate_limit_counters` | Durable anti-abuse controls | repeated abuse or API monetization |
| `webhook_deliveries` | Retries/audit for outbound events | when external integrations start |
| `api_keys` (internal/service) | Secure machine access management | first third-party integrator |
| `audit_admin_actions` | Admin accountability | first non-founder admin user |

---

## 3) Recommended Minimal Schemas (Planning-Level)

## `feature_flags` (optional)
- `key` (PK)
- `enabled` (bool)
- `rules_json` (targeting)
- `updated_by`, `updated_at`

## `system_settings` (optional)
- `key` (PK)
- `value_json`
- `scope` (`global`/`env`)
- `updated_at`

## `job_queue` (optional)
- `id` (PK)
- `job_type`
- `payload_json`
- `status` (`pending/running/retry/succeeded/failed`)
- `attempt_count`, `run_at`, `last_error`, `created_at`

---

## 4) Scale-Ready Now vs Defer Until Trigger

## Scale-ready now (implement now)
1. Append-only event tables (`security_events`, `processing_activities`, `consent_history`).
2. Basic partition-ready timestamps (`created_at`) and indexed retrieval patterns.
3. Deterministic statuses in `gdpr_requests`.
4. Retention/anonymization policy fields and jobs.

## Defer until trigger
1. Queue infrastructure (`job_queue`) beyond simple cron.
2. Dynamic feature flags beyond environment variables.
3. Per-IP persistent rate-limit storage table.
4. Dedicated admin RBAC tables (until multiple internal operators exist).

---

## 5) Operational Triggers (Concrete)

- Add `job_queue` when: daily async jobs > 3 types or failure recovery needs retries/dead-letter handling.
- Add `feature_flags` when: you need partial rollout to cohorts or canary release.
- Add `rate_limit_counters` table when: abuse events exceed threshold (e.g., >100 suspicious events/day).
- Add admin audit tables when: second admin/operator receives production access.

---

## 6) Fact / Inference / Assumption

- **Fact:** existing docs already rely on security, consent, and GDPR request logs.  
- **Inference:** those are not optional and should be treated as operational core.  
- **Assumption:** MVP remains single-developer operated; if team grows, admin governance tables become required quickly.
