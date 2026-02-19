# FrontEnd Architecture Baseline (MVP, Phase 1)

## Goals
- Keep UI web-first and fast for MVP.
- Keep domain contracts portable for future Capacitor/React Native clients.
- Keep all lifecycle/guard logic aligned with canonical doc 25.

## Layers
1. `src/core/contracts`
   - Shared enums/types mirrored from backend contracts (consents, GDPR request types, onboarding states).
2. `src/core/platform`
   - Platform adapter interfaces (storage, connectivity, queue, notifications).
   - Web implementation now; native adapters later.
3. `src/features/*`
   - Feature modules by domain surface (auth, onboarding, food-log, today, history, settings).
4. `src/app`
   - App shell, route registration, guard wiring.

## Guard model (canonical)
- Unauthenticated => only public routes.
- Authenticated + onboarding incomplete => onboarding routes only.
- Authenticated + onboarding complete => app routes; onboarding redirects to `/today`.
- Soft-deleted => force logout/session termination.

## Local-first posture
- Cached reads + queued draft writes in adapter boundary.
- Idempotency key required per queued write (to avoid duplicates).
- Offline queue is a platform capability, not feature business logic.

## Non-goals in MVP
- Voice input
- Weekly/monthly analytics screens
- Exercise/social
- Full multi-device sync engine
