# 28_FINAL — Execution Readiness Checklist

**Status:** Canonical go/no-go checklist before coding

---

## 1) Hard Go/No-Go Gate (Must Pass)

Coding starts only if **all** items below are true:

1. **Scope lock accepted**
   - MVP and later scope from doc 25 is explicitly approved.
2. **Data contract lock accepted**
   - Canonical tables, fields, enums and soft-delete semantics from doc 26 are approved.
3. **Architecture/hosting lock accepted**
   - Strategy and triggers from doc 27 are approved.
4. **Contradictions retired**
   - Any conflicting statements in docs 15–24 are marked historical/non-canonical.
5. **Compliance baseline confirmed**
   - Consent taxonomy + GDPR request taxonomy + retention responsibility owner defined.

**Go decision:** all 5 = YES
**No-go decision:** any NO blocks coding.

---

## 2) Readiness Checklist (Execution-Oriented)

## Product and flow readiness
- [x] Route guards and lifecycle states are unambiguous.
- [x] Food logging flow (parse/confirm/save/edit/delete) is accepted.
- [x] GDPR export and erasure UX outcomes are defined.
- [x] MVP exclusions are listed in backlog, not mixed into MVP acceptance.

## Data and API contract readiness
- [x] Table list and required fields match doc 26 exactly.
- [x] Enum sets are frozen: consent + GDPR request types.
- [x] Notification settings persistence strategy is fixed.
- [x] Derived meal identity rule is documented for `/today/meal/[id]`.

## Security and compliance readiness
- [x] Access control model for user-scoped data is approved.
- [x] Security/compliance event capture requirements are approved.
- [x] Retention + erasure timing policy is documented.
- [x] Data export format commitment (JSON required; CSV optional) is accepted.

## Platform and operations readiness
- [x] Local-first dev workflow and cloud promotion path are agreed.
- [x] Backup/restore expectations for beta/prod are defined.
- [x] Operational triggers (paid tier, queue, architecture split) are accepted.
- [x] Ownership for incident handling and GDPR requests is assigned.

## Crash-proof flow readiness (frontend + backend)
- [x] Critical flows (`signup`, `login`, onboarding preferences, consents) are covered by repeatable smoke/E2E checks.
- [x] Known business errors (duplicate email, user not found, invalid payload) return controlled JSON 4xx responses.
- [x] Backend stays alive after negative test cases (`/health` still returns 200 after handled errors).
- [x] API query fields are verified against active migrations (no schema/contract drift like missing columns).
- [x] Frontend renders API error messages (not only generic network errors) for expected failure paths.
- [x] E2E selectors are aligned with current UI components (tests updated when UI changes).

---

## 3) MVP vs Later Control

Before each sprint, verify:
- [ ] Sprint stories map only to MVP scope unless explicitly tagged **Later**.
- [ ] Any “Later” item includes trigger/rationale and is excluded from MVP success criteria.

---

## 4) Primary Risks Before Build

1. Scope creep reintroducing voice/analytics into MVP.
2. Enum/field drift across frontend/backend/database artifacts.
3. GDPR process ambiguity (who executes, in what timeline).
4. Local-first queue edge cases causing duplicate or stale writes.

---

## 5) Open Questions to Close Pre-Kickoff

1. OAuth inclusion in MVP or deferred?
2. Exact grace period and retention windows per data class?
3. Rectification: user self-service or support workflow in MVP?
4. Required monitoring level for beta launch?

---

## 6) Decision Log (Fill Before Coding)

- Go/No-Go result: `GO`
- Decision date: 2026-02-21
- Decision owner: Luis (approved via chat)
- Blocking gaps (if NO-GO): None
- Revalidation date: N/A
