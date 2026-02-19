# Product Decisions Checklist

Pre-implementation checklist for CalorieTracker, based on learnings from Amy app.

---

## Before Writing Code

### 1. Core Value Proposition
- [ ] **Define the single primary value**: What's the ONE thing this app does better than anyone else?
  - Example: "Fastest AI-powered food logging"
  - Avoid: "Track calories, macros, workouts, sleep, mood" (too broad)

- [ ] **Write user hypothesis**: "I believe users struggle with X because Y, and will pay for Z"
  - Amy's hypothesis: Users want faster food logging via AI

- [ ] **Identify target platform**: iOS, Android, or Web-first?
  - Amy chose iOS (higher monetization)
  - Consider: Your audience, resources, market size

---

### 2. MVP Scope Definition
- [ ] **List MUST-HAVE features only** (launch in 2-4 weeks)
  - [ ] Food input method (voice/text/photo)
  - [ ] Calorie lookup database integration
  - [ ] Daily tracking view
  - [ ] Basic settings (goals, profile)

- [ ] **List NICE-TO-HAVE features** (post-launch)
  - [ ] Macro tracking (protein, carbs, fats)
  - [ ] Weekly analytics
  - [ ] Social features
  - [ ] Meal suggestions

- [ ] **List features to deliberately exclude** (prevents scope creep)
  - Example: Workout tracking, recipe sharing, community forums

---

### 3. Technical Architecture Decisions

#### AI/LLM Strategy
- [ ] **Choose AI model for food parsing**
  - [ ] Local model (fast, private, limited knowledge)
  - [ ] Cloud model (accurate, costly, latency)
  - [ ] Hybrid: Local parse + cloud nutrition lookup ✅ **RECOMMENDED**

- [ ] **Select nutrition data source**
  - [ ] USDA database (free, US-focused, limited)
  - [ ] FatSecret API (comprehensive, usage limits)
  - [ ] Edamam API (good free tier, rate limits)
  - [ ] Custom database build (scraping, maintenance burden)

- [ ] **Plan cost mitigation**
  - [ ] Implement caching layer (reduce API calls 70-90%)
  - [ ] Batch requests when possible
  - [ ] Set API usage alerts/budgets
  - [ ] Local-first architecture (offline mode)

#### Platform & Tech Stack
- [ ] **Choose development approach**
  - [ ] Native iOS (Swift/SwiftUI) - Amy's choice
  - [ ] Cross-platform (React Native, Flutter)
  - [ ] PWA (web-first, lower quality)

- [ ] **Define design system**
  - [ ] iOS design guidelines (HIG compliance)
  - [ ] Android Material Design (if cross-platform)
  - [ ] Custom design (riskier, more differentiation)

---

### 4. Data & Privacy
- [ ] **Decide data storage strategy**
  - [ ] Local-only (privacy-first, no cloud costs)
  - [ ] Cloud backup (convenience, costs, privacy concerns)
  - [ ] Hybrid: Local + optional cloud sync

- [ ] **Address privacy compliance**
  - [ ] GDPR compliance (EU users)
  - [ ] CCPA compliance (California)
  - [ ] Clear privacy policy
  - [ ] Explicit consent for data usage

- [ ] **Plan for data portability**
  - [ ] Export feature (CSV/JSON)
  - [ ] Account deletion mechanism
  - [ ] Data recovery options

---

### 5. Monetization Strategy
- [ ] **Choose pricing model**
  - [ ] Freemium (free tier + paid upgrades)
  - [ ] Subscription (monthly/yearly)
  - [ ] One-time purchase
  - [ ] Usage-based (pay per API call - NOT recommended for consumers)

- [ ] **Define free vs. paid features**
  - Free: Basic logging, limited AI calls
  - Paid: Unlimited AI, analytics, advanced features

- [ ] **Set pricing tiers**
  - Entry: $4.99/month or $29.99/year
  - Pro: $9.99/month or $79.99/year (if justified)
  - Consider: Amy reached $1000/mo (assumes ~100-200 users at $5-10/mo)

- [ ] **Plan price testing**
  - [ ] A/B test pricing points
  - [ ] Offer launch discounts
  - [ ] Monitor conversion rates weekly

---

### 6. User Experience Design
- [ ] **Define core user flow**
  1. Open app → 2. Input food → 3. See calories → 4. Done
  - **Goal**: Complete flow in <10 seconds

- [ ] **Design input methods**
  - [ ] Voice input (fastest, hands-free)
  - [ ] Text input (backup for clarity)
  - [ ] Photo input (complex, optional)

- [ ] **Plan feedback mechanisms**
  - [ ] Instant calorie display (no loading states)
  - [ ] Error messages for unrecognized foods
  - [ ] Suggestions for similar foods

- [ ] **Accessibility considerations**
  - [ ] VoiceOver support
  - [ ] High contrast mode
  - [ ] Large text option

---

### 7. Launch Strategy
- [ ] **Define success metrics**
  - [ ] User acquisition goal (e.g., 100 users in first month)
  - [ ] Retention goal (e.g., 50% DAU after 1 week)
  - [ ] Revenue goal (e.g., $100 MRR by month 2)

- [ ] **Plan marketing channels**
  - [ ] Build in public (Twitter, YouTube, blog)
  - [ ] Product Hunt launch
  - [ ] App Store optimization (keywords, screenshots)
  - [ ] Early adopter outreach (Reddit, indie hackers)

- [ ] **Prepare launch assets**
  - [ ] App Store screenshots (5-6)
  - [ ] Preview video (30 seconds)
  - [ ] App description (keywords: calorie, tracker, fitness)
  - [ ] Privacy policy link
  - [ ] Support email/website

---

### 8. Risk Mitigation
- [ ] **Technical risks**
  - [ ] API rate limits (implement queue/retry logic)
  - [ ] API outages (fallback to cached data)
  - [ ] Model hallucinations (disclaimers, user verification)

- [ ] **Business risks**
  - [ ] Pricing too high/low (plan to iterate)
  - [ ] Competitor launches (focus on differentiation)
  - [ ] User churn (implement engagement features)

- [ ] **Legal risks**
  - [ ] App Store review guidelines compliance
  - [ ] Health/medical claims (avoid "medical advice")
  - [ ] Data privacy laws (GDPR/CCPA)

---

### 9. Post-Launch Plan
- [ ] **Define iteration schedule**
  - [ ] Week 1-2: Bug fixes only
  - [ ] Week 3-4: Small feature requests
  - [ ] Month 2+: Major features based on data

- [ ] **Set up analytics**
  - [ ] Event tracking (food logs, feature usage)
  - [ ] Retention analysis (DAU, WAU, MAU)
  - [ ] Funnel analysis (onboarding drop-offs)
  - [ ] Revenue tracking (conversions, churn)

- [ ] **Plan feedback loop**
  - [ ] In-app feedback form
  - [ ] Email support
  - [ ] Social media monitoring
  - [ ] User interview schedule (5-10 users/month)

---

### 10. Success Criteria
- [ ] **Define "done" for MVP**
  - [ ] Users can log food in <10 seconds
  - [ ] Calorie accuracy >90% (verified against manual entry)
  - [ ] No critical bugs (crash-free rate >99%)
  - [ ] Launch day: App Store approved

- [ ] **Set timeline milestones**
  - [ ] Week 1: Prototype
  - [ ] Week 2-3: MVP build
  - [ ] Week 4: Testing & polish
  - [ ] Week 5: Submit to App Store
  - [ ] Week 6-8: Review & launch

---

## Critical Decision Gates

### 🛑 STOP and Reconsider IF:
- MVP cannot be built in 4-6 weeks → **Scope is too big**
- Need more than 2 AI API providers → **Architecture is too complex**
- Pricing model takes >1 page to explain → **Too confusing for users**
- Launch depends on complex partnership → **Launch risk too high**

### ✅ GO AHEAD WHEN:
- Single clear value proposition
- MVP defined in <10 features
- Tech stack chosen and validated
- Pricing model tested with 5+ potential users
- Launch assets ready

---

## Pre-Code Validation

### Before writing first line of code:
1. ✅ Talk to 5-10 potential users about their current calorie tracking workflow
2. ✅ Validate that "fast AI food logging" is a real pain point
3. ✅ Test 2-3 nutrition APIs for accuracy and performance
4. ✅ Mock up UI in Figma/Prototype tool and get feedback
5. ✅ Confirm willingness to pay (interview users: "Would you pay $5/mo for this?")

---

## References

- Amy App Store: https://apps.apple.com/us/app/amy-food-journal/id6753904989
- YouTube Channel: https://www.youtube.com/@raroque
- Detailed Learnings: See 02_learnings_synthesis.md
- Video Timeline: See 01_video_index.md

---

**Created**: February 15, 2026
**Status**: Pre-Implementation Planning
**Next**: Validate decisions with user research before coding
