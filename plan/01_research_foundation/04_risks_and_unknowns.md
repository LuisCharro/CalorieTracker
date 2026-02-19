# Risks and Unknowns

Open questions, assumptions, and risks identified from the Amy app research. These need validation before implementation.

---

## Critical Unknowns ⚠️

These are high-impact areas with insufficient data from available research.

### 1. Exact Monetization Details
**Uncertainty**: What is Amy's specific pricing model and conversion rate?

**What We Know**:
- Reached $1000/month revenue
- Dedicated video: "I Genuinely Don't Know What To Price My App"
- Video: "My App Hit $1000/mo (But We Have A Problem)"

**What We Don't Know**:
- [ ] Free vs. paid feature split
- [ ] Monthly vs. annual pricing preference
- [ ] Conversion rate (what % of free users upgrade?)
- [ ] Churn rate
- [ ] Customer Acquisition Cost (CAC)

**Impact**: High - Wrong pricing model can kill monetization

**Validation Needed**: Interview Amy users, analyze App Store reviews for pricing complaints

---

### 2. API Cost Structure
**Uncertainty**: What's the specific cost breakdown that created the "problem" at $1000/mo?

**What We Know**:
- Perplexity Sonar was highlighted ("wow this is so good")
- "But we have a problem" video suggests margin issues
- Comments mention API costs as a concern

**What We Don't Know**:
- [ ] Per-user API cost average
- [ ] Total API calls per month
- [ ] Which providers are being used
- [ ] Whether caching is implemented (assumed yes)
- [ ] Cost per food log request

**Impact**: High - Economics could make business model unviable

**Validation Needed**:
- Test APIs with realistic load (1000+ food logs/day)
- Calculate per-user cost at different scales
- Model P&L at 100, 1000, 10000 users

---

### 3. User Retention Metrics
**Uncertainty**: How many users stick around after first week/month?

**What We Know**:
- Reached 100 users (from video title)
- 2-month update video exists (suggests some retention)

**What We Don't Know**:
- [ ] Day 1, Day 7, Day 30 retention rates
- [ ] Average logs per active user
- [ ] Churn reasons (app abandoned? found alternative?)
- [ ] Most-used features vs. least-used

**Impact**: High - Low retention requires aggressive user acquisition (expensive)

**Validation Needed**: Standard for calorie trackers is 20-30% D7 retention (industry data needed)

---

### 4. Feature Prioritization Methodology
**Uncertainty**: How does Chris decide which features to build next?

**What We Know**:
- Comments mention requests for protein/macro tracking
- Chris mentions "balance between building features users want vs. what solo dev wants to work on"

**What We Don't Know**:
- [ ] Systematic process (user survey, data analysis, or gut feeling?)
- [ ] How many feature requests are ignored vs. implemented
- [ ] Time to implement requested features
- [ ] Whether macro tracking is planned (highly requested in comments)

**Impact**: Medium - Affects development velocity and user satisfaction

**Validation Needed**: Could ask Chris directly (if open to interview) or infer from future videos

---

## Market Risks 🚨

### 1. Competitive Landscape
**Risk**: Established competitors with more features

**Analysis**:
- **MyFitnessPal**: Market leader, free, massive database, BUT complex UI
- **LoseIt**: Simple, but not AI-powered
- **Cronometer**: Detailed nutrition tracking, steep learning curve
- **Other AI apps**: Emerging competitors (e.g., SnapCalorie, BiteSnap)

**Amy's Differentiation**:
- Fast AI-powered logging (assumed)
- Simple UI (not feature-bloated)
- Premium feel (liquid glass design)

**Unknown**:
- [ ] How many AI calorie trackers launched since Amy?
- [ ] Are users migrating from MFP or avoiding MFP entirely?
- [ ] Is "simplicity" enough differentiation?

**Mitigation**: Focus on execution, not features. Speed of logging is the key differentiator.

---

### 2. Market Size Validation
**Risk**: Not enough people willing to pay for faster food logging

**Assumptions**:
- People hate manual calorie logging (pain point is real)
- AI can significantly reduce friction (needs validation)
- iPhone users will pay $5-10/month (needs testing)

**Unknown**:
- [ ] How big is the "willing to pay for AI food logging" segment?
- [ ] Is this a niche or mainstream market?
- [ ] Price sensitivity (is $5/mo too high for most users?)

**Validation Needed**:
- Pre-launch survey: "How much would you pay for an app that logs food in 5 seconds via voice?"
- Landing page test: Measure signups for "early access"

---

### 3. Platform Risk (iOS-Only)
**Risk**: Limiting to iOS excludes Android users (larger market)

**Amy's Choice**: iOS-only
- Higher monetization potential
- Consistent hardware (easier testing)
- Chris's expertise: iOS dev

**For CalorieTracker**:
- Same choice (iOS-first)?
- Cross-platform (larger market, more complex)?
- Start iOS, expand to Android later?

**Impact**: Medium - Platform choice affects reach and development complexity

---

## Technical Risks ⚙️

### 1. AI Hallucination Risk
**Risk**: LLMs providing incorrect calorie information

**Evidence from Comments**:
> "LLMs shouldn't be the ultimate solution to every problem, especially since they're prone to hallucinations and aren't very good at math."

**Amy's Approach** (inferred):
- LLM for parsing food names/quantities
- Structured database for calorie data
- Code for calculations (not LLM)

**Remaining Risk**:
- [ ] What if LLM misinterprets "1 cup rice" as "1 lb rice"?
- [ ] How to handle ambiguous foods?
- [ ] Liability if app provides inaccurate health information?

**Mitigation**:
- User verification step: "Did you mean X calories?"
- Disclaimers: "For educational purposes, consult nutritionist"
- Error reporting mechanism for users to flag inaccuracies

---

### 2. API Dependency Risks
**Risk**: Third-party APIs changing, shutting down, or price hikes

**Potential Issues**:
- API deprecation (Nutrition providers change policies)
- Rate limits hit at scale
- Pricing changes (free tier → paid)
- Outages causing app downtime

**Mitigation**:
- Multi-provider strategy (fallback if one fails)
- Local caching (offline mode)
- Contractual agreements (if possible for B2B APIs)

---

### 3. Data Privacy Concerns
**Risk**: Users concerned about AI analyzing their eating habits

**Amy's Approach** (inferred from local model mentions):
- On-device processing where possible
- Minimal data sent to cloud

**Unknown**:
- [ ] What data is collected?
- [ ] Is data shared with third parties?
- [ ] GDPR/CCPA compliance status?

**Mitigation**:
- Explicit privacy policy
- Opt-in for data sharing
- Local-first architecture

---

## Business Model Risks 💰

### 1. Unit Economics Uncertainty
**Risk**: Per-user costs exceed revenue

**Model**:
```
Revenue per user: $5-10/month
Cost per user: API costs + hosting + support = ???
```

**Unknown**:
- [ ] What's the actual cost per 100 food logs?
- [ ] Do heavy users (daily loggers) cost 10x more than light users?
- [ ] What's the break-even point (users vs. costs)?

**Mitigation**:
- Set usage limits on free tier (e.g., 10 AI logs/day)
- Charge for unlimited usage
- Optimize API calls aggressively

---

### 2. Churn Risk
**Risk**: High churn rate kills revenue growth

**Industry Benchmarks** (estimated):
- Fitness apps: 5-15% monthly churn
- Subscription apps: 3-8% monthly churn (good performers)

**Amy's Churn**: Unknown

**Factors Affecting Churn**:
- [ ] Habit formation (do users stick with logging?)
- [ ] Accuracy frustration (if AI gets it wrong repeatedly)
- [ ] Cost sensitivity (users drop when free trial ends)

**Mitigation**:
- Onboarding that establishes habit (7-day streak)
- Weekly summaries showing progress
- Win-back emails for churned users

---

### 3. Regulatory Risk
**Risk**: App Store or health regulations restricting features

**Potential Issues**:
- App Store rejects "medical" apps without proper certification
- Health claims (e.g., "lose weight fast") trigger review
- Data collection regulations tighten

**Amy's Status**: App is live, so no blocking issues yet

**For CalorieTracker**:
- Avoid "medical advice" language
- Position as "food journal" not "weight loss tool"
- Include prominent disclaimers

---

## Assumptions We're Making 📝

### Validated (Likely True)
- ✅ People want faster food logging (Amy's success implies this)
- ✅ AI can parse food descriptions accurately enough (Amy used it)
- ✅ iPhone users will pay for productivity apps (Amy reached $1000/mo)
- ✅ Simple UI can compete with feature-heavy apps (Amy's differentiation)

### Unvalidated (Need Testing)
- ⚠️ Local + cloud hybrid is the optimal architecture
- ⚠️ $5-10/month pricing is viable
- ⚠️ Voice input is preferred over text/photo
- ⚠️ Our target audience matches Amy's audience
- ⚠️ We can replicate Amy's success without the YouTube audience

### Highly Speculative (Major Uncertainty)
- ❓ Amy's actual retention/churn metrics
- ❓ Exact API cost structure
- ❓ Whether Amy is profitable or just breaking even
- ❓ How much of Amy's success is due to Chris's YouTube audience

---

## Pre-Launch Validation Checklist

### Market Validation
- [ ] Interview 10-20 potential users about current food tracking habits
- [ ] Test willingness to pay with landing page pre-signups
- [ ] Analyze App Store reviews of competitors (MFP, LoseIt, etc.)
- [ ] Identify top 3 pain points users report

### Technical Validation
- [ ] Test 3+ nutrition APIs for accuracy
- [ ] Build prototype with 50+ common foods to test accuracy
- [ ] Calculate per-user cost at 100, 1000, 10000 users
- [ ] Test offline mode behavior

### Business Validation
- [ ] Model P&L at 100, 500, 1000 users
- [ ] Define break-even point
- [ ] Set realistic revenue goals for first 6 months
- [ ] Plan pricing A/B tests

---

## Risk Register Summary

| Risk | Likelihood | Impact | Mitigation | Status |
|------|-----------|--------|------------|--------|
| API costs too high | Medium | High | Caching, local models, usage limits | Needs testing |
| User churn > industry avg | High | Medium | Onboarding, engagement features | Monitor post-launch |
| AI hallucinations | Medium | Medium | User verification, disclaimers | Technical design |
| Pricing too high/low | Medium | High | A/B testing, iterate quickly | Pre-launch test |
| App Store rejection | Low | Critical | Follow guidelines, avoid medical claims | Review process |
| Competitive launch | High | Medium | Focus on execution/speed | Market monitor |
| Privacy concerns | Medium | Medium | Local-first, clear policy | Compliance check |

---

## Questions to Answer Before Coding

### Must Answer (Blocking)
1. What's the per-user API cost at target scale?
2. Will users pay $5-10/month for this?
3. Can we achieve >90% calorie accuracy with AI?

### Should Answer (Recommended)
4. What's the target retention rate (D7, D30)?
5. Which nutrition API is most accurate?
6. What's the competitor churn rate?

### Nice to Answer (Optimization)
7. What features do users wish Amy had?
8. What's Chris's long-term vision for Amy?
9. Are there emerging competitors we should watch?

---

**Last Updated**: February 15, 2026
**Risk Status**: Multiple high-impact unknowns require validation
**Next Step**: User interviews and API testing before implementation
