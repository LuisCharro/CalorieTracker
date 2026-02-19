# GDPR Requirements for CalorieTracker

**Date:** 2026-02-15
**Context:** B2C calorie/food logging app with potential health-related personal data
**App Type:** Health/fitness tracking with food database integration
**Target Market:** EU/EEA (initial consideration), potentially global

---

## Executive Summary

CalorieTracker processes food logs, calorie counts, and potentially weight/health metrics. Under GDPR, this data **may qualify as "health data"** (Article 9), which requires special protections. However, simple calorie counting **without medical context** may fall under general personal data. This document outlines practical GDPR obligations for MVP through production scale, building on PdfExtractorAi's proven patterns.

---

## Critical Question: Is This Health Data?

### Article 9 GDPR - Special Category Data

Health data is defined as:
> "personal data related to the physical or mental health of a natural person, including the provision of health care services, which reveal information about his or her health status."

### Analysis for CalorieTracker

| Data Type | Classification | Reasoning |
|-----------|---------------|-----------|
| **Food logs** (what user ate) | 🟡 Likely General | Food choice alone doesn't reveal health status |
| **Calorie counts** | 🟡 Likely General | Calorie tracking is common, not inherently medical |
| **Weight entries** | 🟠 Possibly Health | Can indicate health status if tracked over time |
| **Exercise logs** | 🟡 Likely General | Fitness data is common and not inherently medical |
| **Health conditions** | 🔴 Definitely Health | If app tracks diabetes, allergies, conditions |
| **Medical advice/recommendations** | 🔴 Definitely Health | If app provides health guidance |
| **Goals (weight loss, gain)** | 🟡 Likely General | Common fitness goals, not inherently medical |

**Assumption for MVP:**
- Start with **general personal data** classification (food, calories, basic exercise)
- Treat as **health data** if adding: medical conditions, treatment tracking, personalized health advice
- **Document the classification decision** and revisit if features change

**Legal Review Required:**
- ⚠️ Get confirmation on data classification before launch
- ⚠️ If classified as health data → Article 9 conditions apply (explicit consent, etc.)

---

## GDPR Core Obligations

### 1. Lawful Basis for Processing (Article 6)

**For General Personal Data:**
- **Contract**: Provide the service (users expect app to store their data)
- **Legitimate Interests**: Improve app, analytics, security (if not intrusive)
- **Consent**: Optional features, marketing, analytics

**Recommended for CalorieTracker MVP:**
- Primary basis: **Contract** (users can't use app without storing data)
- Secondary basis: **Legitimate Interests** (analytics for improvement, security)
- Consent: Marketing communications, optional analytics, social features

**Implementation:**
```
Data Processing Purposes:
1. Core functionality (food logging, tracking) - Contract
2. App improvement and analytics - Legitimate Interests
3. Security and fraud prevention - Legitimate Interests
4. Marketing communications (newsletters, tips) - Consent (opt-in)
5. Social features (sharing, community) - Consent (opt-in)
```

### 2. Special Category Data (If Applicable)

**If app is classified as processing health data (Article 9):**

**Legal Bases:**
- **Explicit Consent** (Article 9(2)(a)): User opts in after clear explanation
- **Public interest in public health** (Article 9(2)(i)): For public health monitoring
- **Manifestly made public by data subject** (Article 9(2)(e)): If users share publicly

**Impact if Health Data:**
- Need **explicit consent** checkbox (not pre-checked)
- Clear notice that data is health-related
- More stringent security measures
- DPIA (Data Protection Impact Assessment) required
- 72-hour breach notification (no threshold)

**Decision:**
- Start with general data classification
- Add explicit consent if later adding health features
- Document decision in privacy policy

---

## Data Subject Rights (Articles 15-21)

### All Rights Must Be Available

| Right | Description | Implementation | Priority for MVP |
|-------|-------------|----------------|------------------|
| **Right to Access** (Art. 15) | User can get copy of their data | `/api/gdpr/export` endpoint, download all data | ✅ Required Day 1 |
| **Right to Rectification** (Art. 16) | Correct inaccurate data | Edit profile, edit food logs | ✅ Required Day 1 |
| **Right to Erasure** (Art. 17) | Delete all data ("right to be forgotten") | Account deletion, full data purge | ✅ Required Day 1 |
| **Right to Restrict** (Art. 18) | Limit processing (keep data but don't use) | "Suspend my account" feature | 🟡 Recommended |
| **Right to Portability** (Art. 20) | Get data in machine-readable format | Same as export (JSON/CSV) | ✅ Required Day 1 |
| **Right to Object** (Art. 21) | Object to legitimate interests processing | Opt-out of analytics | ✅ Required Day 1 |
| **Right to Withdraw Consent** (Art. 7) | Revoke any consent given | Consent management UI | ✅ Required Day 1 |

### Implementation Patterns (Reuse from PdfExtractorAi)

**Access & Portability (Article 15, 20):**
- `/api/gdpr/export` endpoint
- Returns all user data as JSON
- Include: user profile, food logs, activity history, consent records
- Downloadable from account settings

**Erasure (Article 17):**
- `/api/gdpr/delete` endpoint
- Delete: users, food_logs, exercise_logs, goals, social data, consent history, analytics
- Keep: anonymized audit logs (for security, not re-identifiable)
- Supabase Auth user deletion via service role
- **30-day soft delete** before hard delete (like PdfExtractorAi)

**Rectification (Article 16):**
- Edit UI for user profile
- Edit/delete food log entries
- Log all changes to `processing_activities` table

**Restriction (Article 18):**
- User setting: "Restrict processing" toggle
- Pauses non-essential features (analytics, recommendations)
- Keeps data for core functionality (login, data access)

**Objection (Article 21):**
- User setting: "Opt out of analytics" toggle
- Skip analytics tracking when set
- Log objection to consent_history

**Withdraw Consent (Article 7):**
- Consent management UI
- Checkbox for each consent type
- Immediate effect when withdrawn
- Log withdrawal to consent_history

---

## Data Minimization (Article 5)

### Principle: Collect Only What's Necessary

**MVP - What to Collect:**
✅ **Required:**
- Email (for auth, password reset)
- Food logs (date, food item, quantity, calories)
- Basic profile (name optional, optional demographic data for analytics)
- Timestamps (when user logged food)
- Device/app version (for debugging)

❌ **Avoid for MVP:**
- Social media profiles (if OAuth, only get email)
- Location data (unless geolocation features)
- Detailed device info (IMEI, etc.)
- Biometric data
- Health conditions, medications, treatments

**Recommended for MVP:**
```typescript
User Profile {
  email: string,              // Required for auth
  name?: string,              // Optional, display name only
  avatar?: string,            // Optional
  created_at: timestamp,      // Required, for account age
  last_login: timestamp,      // Required, for security
}

Food Log {
  id: string,
  user_id: string,           // Required (RLS scoped)
  food_name: string,         // Required
  quantity: number,          // Required
  calories: number,          // Required
  protein?: number,          // Optional, for macros
  carbs?: number,            // Optional
  fat?: number,              // Optional
  logged_at: timestamp,      // Required
  meal_type?: string,        // Optional (breakfast, lunch, etc.)
}
```

**What to Add Later (if validated):**
- Weight tracking (with explicit consent if health data)
- Exercise logs
- Photos of food (need storage, AI processing)
- Social sharing features (privacy implications)
- AI recommendations (needs separate consent)

---

## Data Retention (Article 5)

### Default: Keep Data Only as Long as Necessary

**MVP Retention Policy:**

| Data Type | Retention Period | Rationale |
|-----------|------------------|-----------|
| **Active user data** | Until account deleted | Required for service |
| **Deleted user data** | 30 days soft delete | Grace period for recovery, then purge |
| **Audit logs** | 12-24 months | Security, compliance, debugging |
| **Analytics** | 12-24 months | Aggregated, anonymized after 6 months |
| **Anonymous usage** | 30 days | Abuse prevention, GDPR limits |

**Implementation:**
- Cron job: `/api/cron/data-retention` (like PdfExtractorAi)
- Daily cleanup of old anonymous data
- Weekly soft-delete purge (after 30 days)
- Monthly archive of old analytics to cold storage (optional)

**Free Tier Constraint:**
- Supabase free tier has storage limits (500MB)
- Must implement retention to stay within limits
- Anonymize old analytics instead of deleting (for insights)

---

## Data Security (Article 32)

### Appropriate Technical Measures

**MVP Security Controls:**

**Transport Security:**
- ✅ HTTPS/TLS for all connections
- ✅ HSTS headers
- ✅ Secure cookies (HttpOnly, SameSite, Secure)

**Access Control:**
- ✅ RLS policies on all tables (user_id-based)
- ✅ JWT tokens with short expiry (1 hour refresh)
- ✅ Service role key only on server (never exposed)

**Data Protection:**
- ✅ Encryption at rest (Supabase default)
- ✅ Hash passwords (Supabase Auth default)
- ✅ Sensitive data in environment variables (never in code)

**Operational Security:**
- ✅ Security event logging (`security_events` table)
- ✅ Regular vulnerability scanning
- ✅ Dependency updates
- ✅ Rate limiting on APIs

**Production-Grade Security (Post-MVP):**
- 🔐 2FA/MFA for sensitive operations
- 🔐 IP allowlisting for admin access
- 🔐 Regular penetration testing
- 🔐 SIEM/log monitoring
- 🔐 DDoS protection (Vercel provides basic)

---

## Data Portability (Article 20)

### Must Provide Data in Common Format

**Implementation:**
- `/api/gdpr/export` returns JSON
- Include all user data:
  ```json
  {
    "userProfile": { ... },
    "foodLogs": [ ... ],
    "exerciseLogs": [ ... ],
    "goals": [ ... ],
    "consentHistory": [ ... ],
    "exportDate": "2026-02-15T..."
  }
  ```
- Option to export as CSV for spreadsheet import
- Machine-readable and structured
- Download from account settings

**Reuse Pattern:**
- Copy PdfExtractorAi's export endpoint
- Adapt data structure for CalorieTracker
- Test export with real data

---

## Consent Management (Article 7)

### Granular, Informed, Withdrawable

**Consent Types Required:**

1. **Essential (No Consent Needed):**
   - Terms of Service
   - Privacy Policy acknowledgment
   - Core data processing (food logging)

2. **Optional (Explicit Consent Required):**
   - Marketing emails (newsletter, tips)
   - Analytics (non-essential)
   - Social features (sharing, community)
   - AI recommendations (if implemented)
   - Third-party food database APIs

**Consent UI Requirements:**
- ✅ Clear, plain language
- ✅ Not pre-checked checkboxes
- ✅ Separate for each purpose
- ✅ Easy to withdraw (account settings)
- ✅ Consent history tracking

**Implementation Pattern:**
```typescript
ConsentRecord {
  user_id: string,
  consent_type: string,        // 'marketing', 'analytics', 'social', 'ai'
  consent_given: boolean,
  timestamp: timestamp,
  metadata: { source: 'onboarding', version: '1.0' }
}
```

**Reuse from PdfExtractorAi:**
- Copy consent banner/component
- Copy consent management page
- Copy consent_history table schema
- Copy consent logging logic

---

## Cookie & Tracking (If Web App)

### GDPR Cookie Requirements

**Cookie Types:**

| Cookie Type | Consent Required | Purpose |
|-------------|------------------|---------|
| **Essential** | ❌ No | Auth session, security, core functionality |
| **Analytics** | ✅ Yes | Vercel Analytics, Google Analytics (if used) |
| **Marketing** | ✅ Yes | Facebook Pixel, ad tracking |
| **Social** | ✅ Yes | Social sharing buttons, integrations |
| **Functional** | 🟡 Case-by-case | User preferences, settings persistence |

**Implementation:**
- Cookie consent banner on first visit
- Granular opt-in/out for each category
- Respect user choices immediately
- Document cookie purposes in privacy policy

**MVP Recommendation:**
- Skip third-party analytics (use Vercel Analytics only, essential)
- Skip marketing pixels (no ads yet)
- Only essential cookies (session, security)
- **Simplifies compliance significantly**

---

## Cross-Border Data Transfers (Article 44-50)

### Data Location Requirements

**Current Architecture (Option A - Supabase-First):**
- **Database:** Supabase EU region (`eu-central-1` or `eu-central-2`)
- **Hosting:** Vercel EU functions (Frankfurt/Dublin)
- **Email:** Resend (EU region)
- **Analytics:** Vercel Analytics (global, but minimal)

**Potential Cross-Border Transfers:**

1. **AI/ML APIs** (if used for food recognition):
   - ⚠️ Most AI APIs are US-based
   - ⚠️ Need SCCs (Standard Contractual Clauses)
   - ⚠️ EU user consent for transfer
   - ✅ Alternative: EU-based AI providers (if available)

2. **Third-Party Food Databases** (Nutritionix, USDA, etc.):
   - ⚠️ Many are US-based
   - ⚠️ Only sending food IDs, not personal data
   - ✅ Likely acceptable if only API lookups
   - ⚠️ Need to review terms and data flows

3. **Analytics Services** (if using GA4, Mixpanel):
   - ⚠️ Most are US-based
   - ✅ Use EU endpoints where available
   - ✅ Enable IP anonymization
   - ✅ Use Vercel Analytics instead (simpler)

**Implementation:**
- Configure Supabase to EU region (like PdfExtractorAi)
- Configure Vercel functions to EU-first routing
- Document all processors in subprocessors list
- Include cross-border transfer safeguards in privacy policy
- Use EU endpoints where available

**Reuse from PdfExtractorAi:**
- Copy geolocation detection (EU vs non-EU users)
- Copy EU routing logic (Vertex AI for EU users)
- Copy subprocessors documentation
- Copy SCC references in privacy policy

---

## Processor/Subprocessor Management (Article 28)

### Data Processors Must Have DPAs

**Current Processors:**
- **Vercel**: Hosting, compute, CDN
- **Supabase**: Database, auth, storage
- **Resend**: Email delivery
- **AI Providers** (if used): OpenAI, Google, etc.
- **Food Database APIs** (if used): Nutritionix, USDA, etc.

**Requirements:**
- ✅ Each processor must have DPA (Data Processing Agreement)
- ✅ DPA must include SCCs for cross-border transfers
- ✅ Document in subprocessors list
- ✅ Update privacy policy with processor locations

**Free Tier Considerations:**
- Most free tiers don't provide signed DPAs
- Workaround: Use published DPA templates from providers
- Upgrade to paid plan if DPA required (unlikely for MVP)
- Document clearly in privacy policy

**Reuse from PdfExtractorAi:**
- Copy subprocessors list structure
- Copy DPA references
- Copy processor location documentation

---

## Breach Notification (Article 33)

### 72-Hour Notification Requirement

**What Constitutes a Breach:**
- Unauthorized access to user data
- Accidental data disclosure
- Data loss/deletion
- Ransomware or malware attack
- Stolen credentials leading to data exposure

**Notification Process:**
1. Detect breach (security monitoring, user reports)
2. Assess risk (is user data affected?)
3. Notify supervisory authority within 72 hours
4. Notify affected users without undue delay
5. Document breach in security_events table

**MVP Readiness:**
- ✅ Security event logging
- ✅ Breach response template (text only OK)
- 🟡 Breach detection monitoring (Vercel/Sentry)
- 🟡 Incident response runbook

**Reuse from PdfExtractorAi:**
- Copy security_events table schema
- Copy security logging patterns
- Copy incident response procedures

---

## Data Protection Impact Assessment (DPIA)

### When Required?

**Required when:**
- ✅ Processing special category data (health data)
- ✅ Large-scale systematic monitoring
- ✅ Processing sensitive data on large scale
- ✅ New technologies that might create privacy risks

**For CalorieTracker:**
- 🟡 **Likely required if app is classified as health data**
- ✅ **Probably not required for basic calorie logging (general data)**
- ⚠️ **DPA needed if adding:**
  - Health conditions tracking
  - Medical advice features
  - AI-powered health recommendations

**DPIA Template:**
1. Describe processing operations
2. Assess necessity and proportionality
3. Assess risks to individuals
4. Identify mitigation measures
5. Sign off on risk assessment

**Reuse from PdfExtractorAi:**
- Copy DPIA patterns (if any)
- Review gdpr-compliance-analysis.md for examples

---

## Documentation Requirements

### Required GDPR Documents

**MVP - Minimum:**
1. ✅ **Privacy Policy** (essential, clear, specific to app)
2. ✅ **Terms of Service** (if applicable, for contract basis)
3. ✅ **Cookie Policy** (if using cookies beyond essential)
4. ✅ **Processors List** (subprocessors page)
5. ✅ **Consent Records** (stored in database)

**Production-Grade:**
1. ✅ All above
2. 🔐 **Record of Processing Activities** (Article 30)
3. 🔐 **Data Protection Policy** (internal)
4. 🔐 **Breach Response Plan** (internal)
5. 🔐 **DPIA** (if required)

**Reuse from PdfExtractorAi:**
- Copy privacy policy template
- Copy subprocessors list
- Adapt to CalorieTracker context

---

## Age Restrictions

### Minimum Age Requirements

**For Health Data (Article 9):**
- EU: **16 years old** (member states can lower to 13)
- Verify age during onboarding
- Parental consent if under 16

**For General Data:**
- EU: **13 years old** (like most social apps)
- No verification required, but reasonable effort

**CalorieTracker Recommendation:**
- Set minimum age to **13** initially
- Add age gate in onboarding
- Update to **16** if app is classified as health data
- Clear policy on children's data

---

## What We Can Decide Now vs. Needs Legal Review

### Can Decide Now (Technical Implementation)

**Architecture & Infrastructure:**
- ✅ Use Supabase EU region
- ✅ Use Vercel EU-first routing
- ✅ Implement RLS policies from day 1
- ✅ Implement all GDPR rights (access, delete, etc.)
- ✅ Build consent management system
- ✅ Implement security event logging
- ✅ Configure data retention policies

**Data Collection:**
- ✅ Collect only essential data (email, food logs, timestamps)
- ✅ Avoid health conditions, medications for MVP
- ✅ Granular consent for optional features
- ✅ Opt-out for analytics

**Security:**
- ✅ HTTPS, RLS, JWT tokens
- ✅ Security event logging
- ✅ Regular vulnerability scanning
- ✅ Rate limiting

### Needs Legal Review

**Data Classification:**
- ⚠️ Is food/calorie logging "health data" under GDPR?
- ⚠️ If yes, what Article 9 basis applies?
- ⚠️ What consent language is required?

**Privacy Policy:**
- ⚠️ Review privacy policy for legal accuracy
- ⚠️ Confirm legal bases are appropriate
- ⚠️ Validate cross-border transfer safeguards

**Third-Party Services:**
- ⚠️ Review food database API terms (Nutritionix, USDA)
- ⚠️ Confirm data flows are acceptable
- ⚠️ Validate DPA availability

**Age Restrictions:**
- ⚠️ Confirm minimum age (13 vs 16)
- ⚠️ Age gate implementation requirements

**Future Features:**
- ⚠️ AI food recognition implications
- ⚠️ Health recommendations implications
- ⚠️ Social features privacy implications

---

## Implementation Roadmap

### Phase 1: MVP (Week 1-2)
- [ ] Implement RLS policies on all tables
- [ ] Build GDPR rights endpoints (export, delete, etc.)
- [ ] Implement consent management UI
- [ ] Configure EU regions (Supabase + Vercel)
- [ ] Write privacy policy (legal review required)
- [ ] Write subprocessors list
- [ ] Implement security event logging

### Phase 2: Production Readiness (Week 3-4)
- [ ] Add data retention cron job
- [ ] Implement breach response plan
- [ ] Set up monitoring and alerting
- [ ] Complete legal review
- [ ] User testing with GDPR flows
- [ ] Document processing activities

### Phase 3: Post-Launch (Ongoing)
- [ ] Quarterly compliance review
- [ ] Update documentation as features change
- [ ] Monitor for regulatory changes
- [ ] User feedback on privacy experience

---

## Key Takeaways

1. **Start conservatively:** Treat as general personal data unless confirmed otherwise
2. **Build privacy in from day 1:** RLS, consent, audit logging
3. **Reuse proven patterns:** PdfExtractorAi has battle-tested GDPR implementation
4. **Get legal review early:** Don't launch without classification confirmation
5. **Stay within free tier:** Simpler compliance, lower risk
6. **Document everything:** Audit logs, consent history, processing activities
7. **Be transparent:** Clear privacy policy, easy-to-use rights

---

**Next Steps:**
1. Consult with legal counsel on data classification
2. Review 08_reuse_from_pdfextractorai.md for reusable components
3. Review 09_recommended_stack_and_controls.md for implementation
4. Follow 10_implementation_readiness_checklist.md before coding
