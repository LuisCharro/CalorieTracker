# CalorieTracker Backend Platform & Operations

## Overview

This document defines the local-first development workflow, cloud promotion path, backup/restore procedures, operational triggers, and ownership assignments for incident and GDPR request handling.

---

## 1. Local-First Development Workflow

### Development Environment Stack

| Component | Local | Cloud (Beta) | Cloud (Prod) |
|-----------|-------|--------------|--------------|
| **Runtime** | Node.js 22+ | Node.js 22+ | Node.js 22+ |
| **Database** | PostgreSQL (Docker) | Managed PostgreSQL | Managed PostgreSQL |
| **Cache** | None (MVP) | Redis (optional) | Redis |
| **Queue** | None (MVP) | None | Redis Queue |
| **Storage** | Local filesystem | Object Storage | Object Storage |

### Local Development Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd CalorieTracker/backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with local settings

# 4. Start PostgreSQL
docker compose up -d

# 5. Run migrations
npm run migrate

# 6. Seed development data (optional)
npm run seed

# 7. Start development server
npm run dev
```

### Local-First Principles

1. **Full Stack Locally**: All MVP features work without cloud services
2. **Docker for Services**: PostgreSQL runs in Docker for consistency
3. **Hot Reload**: `npm run dev` uses ts-node with watch mode
4. **Test Database**: Separate test database for integration tests

### Environment Files

| File | Purpose | Version Control |
|------|---------|-----------------|
| `.env.example` | Template with all required vars | Yes |
| `.env.local` | Local development config | No (gitignored) |
| `.env.test` | Test environment config | No (gitignored) |
| `.env.production` | Production config (secrets in vault) | No |

### Required Environment Variables

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

# Auth
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d

# GDPR
GDPR_EXPORT_FORMAT=json
GDPR_ERASURE_GRACE_PERIOD_DAYS=30
```

---

## 2. Cloud Promotion Path

### Environment Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                 DEPLOYMENT PIPELINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Local Dev] ──> [Beta/Staging] ──> [Production]                │
│       │               │                  │                       │
│       │               │                  │                       │
│   Docker         Cloud Run          Cloud Run                   │
│   Postgres       Managed PG         Managed PG                  │
│   No SSL         SSL enabled        SSL + WAF                   │
│   No auth        Basic auth         Full auth                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Promotion Steps

#### Local → Beta
1. Push to `develop` branch
2. CI runs: lint, typecheck, tests
3. Deploy to beta environment
4. Run smoke tests
5. Manual QA review

#### Beta → Production
1. Create PR from `develop` to `main`
2. Code review required
3. CI runs full test suite
4. Merge triggers production deploy
5. Monitor health checks
6. Rollback if issues detected

### Cloud Configuration

| Setting | Beta | Production |
|---------|------|------------|
| **Min Instances** | 0 (scale to zero) | 1 |
| **Max Instances** | 3 | 10 |
| **Memory** | 512MB | 1GB |
| **CPU** | 1 | 2 |
| **Database Tier** | db-custom-1-3840 | db-custom-2-7680 |
| **Backup** | Daily | Hourly + PITR |

---

## 3. Backup & Restore Expectations

### Backup Schedule

| Environment | Frequency | Retention | Method |
|-------------|-----------|-----------|--------|
| **Local** | Manual | None | `pg_dump` |
| **Beta** | Daily | 7 days | Managed backup |
| **Production** | Hourly | 30 days | Managed backup + PITR |

### Backup Commands (Local)

```bash
# Create backup
pg_dump -h localhost -U postgres calorietracker > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -h localhost -U postgres calorietracker < backup_20260220_120000.sql

# Docker volume backup
docker run --rm -v calorietracker_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup_$(date +%Y%m%d).tar.gz /data
```

### Restore Procedure (Production)

1. **Notify stakeholders** of planned maintenance
2. **Stop application** to prevent writes
3. **Restore from backup**:
   ```bash
   # Using managed service restore
   gcloud sql backups restore <backup-id> --restore-instance=<instance-name>
   ```
4. **Verify data integrity** with spot checks
5. **Restart application**
6. **Monitor for issues** for 1 hour

### Point-in-Time Recovery (Production)

Production database enables PITR for recovery to any point within retention window:

```
Recovery window: 7 days
Granularity: 1 minute
```

---

## 4. Operational Triggers

### Scaling Triggers

| Trigger | Threshold | Action | Environment |
|---------|-----------|--------|-------------|
| **CPU Usage** | > 80% for 5 min | Scale up instance count | Production |
| **Memory Usage** | > 85% for 5 min | Scale up memory | Production |
| **Request Latency** | p95 > 500ms | Alert + investigate | All |
| **Error Rate** | > 1% for 5 min | Alert + auto-rollback if recent deploy | Production |
| **Database Connections** | > 80% of pool | Scale connection pool | All |

### Architecture Split Triggers

| Trigger | Threshold | Architecture Change |
|---------|-----------|---------------------|
| **Users** | > 10,000 MAU | Add Redis cache layer |
| **Request Rate** | > 100 req/sec | Move to dedicated queue workers |
| **Database Size** | > 10GB | Add read replicas |
| **Paid Tier** | Any paid users | Separate billing microservice |

### Feature Flag Triggers

| Feature | Trigger | Action |
|---------|---------|--------|
| **Analytics** | User count > 100 | Enable analytics dashboard |
| **Export CSV** | User request | Enable per-user or globally |
| **Queue-based notifications** | User count > 1,000 | Migrate to Redis queue |

---

## 5. Incident Handling Ownership

### Incident Severity Levels

| Level | Description | Response Time | Resolution Target |
|-------|-------------|---------------|-------------------|
| **P1 - Critical** | Service down, data loss risk | 15 minutes | 1 hour |
| **P2 - High** | Major feature broken | 1 hour | 4 hours |
| **P3 - Medium** | Feature degraded | 4 hours | 24 hours |
| **P4 - Low** | Minor issue, workaround exists | 24 hours | 1 week |

### Ownership Matrix

| Incident Type | Primary Owner | Secondary Owner | Escalation |
|---------------|---------------|-----------------|------------|
| **API Down** | Backend Lead | DevOps | After 30 min |
| **Database Issues** | DevOps | Backend Lead | After 15 min |
| **Authentication Failure** | Backend Lead | Security | After 1 hour |
| **Data Corruption** | DevOps + Backend | Security | Immediate |
| **Performance Degradation** | Backend Lead | DevOps | After 2 hours |
| **Security Breach** | Security | Backend Lead + DevOps | Immediate |

### Incident Response Procedure

```
┌─────────────────────────────────────────────────────────────────┐
│                 INCIDENT RESPONSE FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DETECT                                                       │
│     └─> Monitoring alert / User report                          │
│                                                                  │
│  2. TRIAGE                                                       │
│     └─> Assign severity level                                    │
│     └─> Identify primary owner                                   │
│                                                                  │
│  3. RESPOND                                                      │
│     └─> Owner acknowledges within SLA                           │
│     └─> Create incident channel (Slack)                         │
│     └─> Post initial status update                              │
│                                                                  │
│  4. MITIGATE                                                     │
│     └─> Implement temporary fix / rollback                      │
│     └─> Verify service restoration                              │
│     └─> Update stakeholders                                      │
│                                                                  │
│  5. RESOLVE                                                      │
│     └─> Implement permanent fix                                 │
│     └─> Deploy to production                                    │
│     └─> Close incident channel                                  │
│                                                                  │
│  6. POST-MORTEM                                                  │
│     └─> Document within 48 hours                                │
│     └─> Identify root cause                                     │
│     └─> Create action items to prevent recurrence               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Contact Information (Example)

| Role | Primary | Backup |
|------|---------|--------|
| Backend Lead | @backend-lead | @backend-lead-backup |
| DevOps | @devops | @devops-backup |
| Security | @security | @security-backup |
| On-Call | PagerDuty rotation | Escalation policy |

---

## 6. GDPR Request Handling Ownership

### GDPR Request Types & Owners

| Request Type | Primary Owner | SLA | Process |
|--------------|---------------|-----|---------|
| **Access** (`/api/gdpr/export/:userId`) | System (automated) | Immediate | Auto-generate JSON export |
| **Portability** | System (automated) | Immediate | Same as access |
| **Erasure** (`/api/gdpr/erase/:userId`) | Backend Lead + DevOps | 30 days | Grace period then automated |
| **Rectification** | Support + Backend | 7 days | Manual review + data update |

### GDPR Request Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                 GDPR REQUEST HANDLING                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ACCESS / PORTABILITY REQUESTS                                   │
│  ─────────────────────────────                                   │
│  User ──> GET /api/gdpr/export/:userId ──> JSON download        │
│  (Fully automated, no manual intervention)                       │
│                                                                  │
│  ERASURE REQUESTS                                                │
│  ─────────────────                                              │
│  User ──> POST /api/gdpr/erase/:userId                          │
│      │                                                           │
│      ▼                                                           │
│  System creates gdpr_request (status: pending)                  │
│      │                                                           │
│      ▼                                                           │
│  Notification sent to user confirming request                   │
│      │                                                           │
│      ▼                                                           │
│  [30-day grace period - user can cancel via support]            │
│      │                                                           │
│      ▼                                                           │
│  Background job processes erasure (daily at 02:00 UTC)          │
│      │  - Status: pending ──> processing ──> completed          │
│      │  - All user data hard-deleted                            │
│      │  - Audit records anonymized                              │
│      │                                                           │
│      ▼                                                           │
│  Request marked complete                                         │
│                                                                  │
│  RECTIFICATION REQUESTS                                          │
│  ──────────────────────                                          │
│  User ──> Contact support ──> Support reviews ──> Data updated  │
│  (Manual process, requires verification)                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### GDPR Request Monitoring

| Metric | Threshold | Alert |
|--------|-----------|-------|
| **Pending erasure requests** | > 10 | Notify Backend Lead |
| **Erasure request age** | > 25 days | Escalate (5 days to deadline) |
| **Failed erasure jobs** | Any | Alert DevOps + Backend Lead |
| **Export failures** | > 5/hour | Alert Backend Lead |

### GDPR Compliance Checklist

- [x] Automated access endpoint implemented
- [x] Automated portability (same as access)
- [x] Erasure request endpoint implemented
- [x] 30-day grace period enforced
- [x] Background erasure job implemented
- [x] Data anonymization for audit records
- [x] Request status tracking in database

---

## 7. Monitoring & Alerting

### Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `http_requests_total` | Total API requests | N/A (info) |
| `http_request_duration_seconds` | Request latency | p95 > 500ms |
| `http_requests_failed_total` | Failed requests | > 1% rate |
| `db_connections_active` | Active DB connections | > 80% of pool |
| `gdpr_requests_pending` | Pending GDPR erasure requests | > 10 |
| `background_jobs_failed` | Failed background jobs | Any |

### Health Check Endpoint

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "calorietracker-backend",
  "timestamp": "2026-02-20T12:00:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "migrations": "up_to_date"
  }
}
```

### Alert Channels

| Severity | Channel | Response |
|----------|---------|----------|
| P1 | PagerDuty + Slack #incidents | Immediate |
| P2 | Slack #alerts | 1 hour |
| P3 | Slack #alerts | 4 hours |
| P4 | Email digest | Next business day |

---

## 8. Runbook Quick Reference

### Common Operations

#### Restart Application (Production)
```bash
# Cloud Run
gcloud run services update calorietracker-backend --region=us-central1
```

#### Check Database Connections
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'calorietracker';
```

#### Force Erasure Request (Emergency)
```sql
-- Mark request for immediate processing
UPDATE gdpr_requests SET metadata = metadata || '{"force": true}' 
WHERE id = '<request-id>';
```

#### Rollback Migration
```bash
npm run migrate:rollback
```

---

## Operations Checklist

- [x] Local-first dev workflow documented
- [x] Cloud promotion path defined
- [x] Backup schedule: Daily (beta), Hourly (prod)
- [x] Restore procedures documented
- [x] Operational triggers defined (paid tier, queue, architecture split)
- [x] Incident handling ownership assigned
- [x] GDPR request handling ownership assigned
- [x] Monitoring & alerting configured
