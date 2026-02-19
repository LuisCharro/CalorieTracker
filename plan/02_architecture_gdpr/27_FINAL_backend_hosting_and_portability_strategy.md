# 27_FINAL — Backend, Hosting, and Portability Strategy

**Status:** Canonical execution strategy (planning only)

---

## 1) Strategy in One Page

- **Primary application architecture:** Next.js backend-for-frontend + managed Postgres/Auth in EU (Supabase path).
- **Development posture:** local-first development and testing, portable contracts from day one.
- **Deployment posture:** start cost-minimal; upgrade tiers only at explicit triggers.

This keeps MVP fast while preserving a clean path from local validation to cloud beta/production.

---

## 2) MVP vs Later

## MVP
- Single web/PWA client
- Next.js API/use-case layer
- Managed auth + Postgres in EU region
- Basic scheduled jobs for GDPR and retention workflows
- Centralized security/compliance logging tables

## Later
- Separate backend service (if domain complexity/traffic justifies)
- Queue infrastructure beyond simple scheduler
- Advanced feature flags/admin control planes
- Multi-region/high-availability topology

---

## 3) Environments and Promotion Path

1. **Local development**
   - Local app + local data stack for rapid iteration
   - Seeded synthetic data only

2. **Private cloud preview (alpha)**
   - Deploy same contracts in EU cloud environment
   - Validate auth, email, mobile browser behavior, and end-to-end GDPR flows

3. **External beta / production**
   - Paid tiers enabled when usage/compliance triggers are hit
   - Formal backup, restore, and incident process required

---

## 4) Portability Guardrails

- Keep core business rules in app layer, not provider-specific SQL/functions where avoidable.
- Treat provider SDK usage as adapter boundary (replaceable).
- Keep schema and enum contracts aligned with doc 26.
- Avoid irreversible coupling to edge-provider-only primitives in MVP.

---

## 5) Operational Triggers (Decision Rules)

- **Move from free to paid hosting:** first external beta user cohort or when backup/compliance ops need guaranteed support.
- **Add queue system:** >3 recurring async workflows or retry/dead-letter needs.
- **Split to dedicated backend service:** sustained complexity in business logic, job orchestration, or performance isolation requirements.
- **Add precomputed summaries:** measured p95 dashboard query >500ms.

---

## 6) Decisions, Assumptions, Risks, Open Questions

## Decisions
- EU data residency is mandatory baseline for hosted environments.
- Local-first work mode is preserved, but contracts are cloud-portable from start.
- Infrastructure complexity is added only by measured trigger, not pre-emptively.

## Assumptions
- Single-developer operations in MVP stage.
- Current BaaS feature set is sufficient for MVP compliance duties.

## Risks
- Vendor lock-in risk if adapter boundaries are not enforced early.
- Underestimating operational load for GDPR request SLAs.
- Drift between local and cloud environments without strict parity checks.

## Open Questions
1. Exact SLA target for GDPR request completion?
2. When to require 24/7 alerting vs best-effort monitoring?
3. Which non-functional threshold triggers architecture split first: latency, cost, or maintainability?
