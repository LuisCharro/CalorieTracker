# BackEnd Architecture Baseline (MVP, Phase 1)

## Principles
- Keep business rules provider-portable (doc 27).
- Keep schema and enums locked to canonical data contract (doc 26).
- Keep local-first UX support through idempotent write endpoints and clear contracts.

## Modules
- `src/modules/*`: domain slices (food logs, gdpr, consents, security, users)
- `src/config`: env/config loading
- `src/db`: schema + migration + seed artifacts
- `src/api`: server bootstrap + route registration

## MVP data contract
Required tables:
`users`, `food_logs`, `goals`, `notification_settings`, `consent_history`, `gdpr_requests`, `processing_activities`, `security_events`

## Guardrail notes
- Soft delete semantics: `is_deleted` + `deleted_at`
- GDPR types: `access|portability|erasure|rectification`
- Consent types: `privacy_policy|terms_of_service|analytics|marketing`
- JSON export required (CSV optional later)
