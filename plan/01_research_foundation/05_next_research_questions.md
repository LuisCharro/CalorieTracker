# Next Research Questions

Priority research questions to answer before implementing CalorieTracker.

---

## PRIORITY 1: Must Answer Before Coding 🚨

These questions block meaningful progress and must be validated before writing code.

### 1. Will Users Actually Use This?
**Question**: Is "fast AI food logging" a genuine pain point, or are people happy with existing apps?

**Why It Matters**:
- Amy succeeded, but Chris has a built-in YouTube audience
- Real-world adoption may differ from early adopter feedback
- If no one uses it, technical excellence doesn't matter

**Research Actions**:
- [ ] Interview 10-20 people who currently track calories
- [ ] Ask: "What do you hate most about your current calorie tracking app?"
- [ ] Ask: "If an app could log your food in 5 seconds with voice, how much would you pay?"
- [ ] Test with competitor users (MyFitnessPower, LoseIt): "Would you switch for faster logging?"

**Success Criteria**:
- At least 70% say current logging is too slow/frustrating
- At least 50% express willingness to pay $5-10/month
- Clear patterns emerge on what features matter most

---

### 2. What's the Actual Per-User API Cost?
**Question**: Can the business model support AI API costs at scale?

**Why It Matters**:
- Amy hit $1000/mo but "we have a problem" (likely costs)
- At $5/user/month, need <20% margin loss to be viable
- If API costs are $3-4/user, economics don't work

**Research Actions**:
- [ ] Test Perplexity Sonar (Amy's choice) with 1000 realistic food queries
- [ ] Test alternative APIs (USDA, FatSecret, Edamam, OpenAI)
- [ ] Measure: response time, accuracy, cost per query
- [ ] Model cost structure at different scales:
  - 100 users (1000 queries/day)
  - 1000 users (10,000 queries/day)
  - 10,000 users (100,000 queries/day)

**Success Criteria**:
- Per-user cost < $1/month at 1000-user scale
- Cost curve is sub-linear (economies of scale)
- At least 2 viable API options with reasonable costs

---

### 3. Can We Achieve High Accuracy Without Hallucinations?
**Question**: Will the AI provide accurate calorie data 90%+ of the time?

**Why It Matters**:
- One bad hallucination loses user trust permanently
- Users will manually verify at first (frustrating if often wrong)
- Liability concerns if health data is incorrect

**Research Actions**:
- [ ] Test hybrid architecture: Local LLM for parsing + database for calories
- [ ] Build prototype with 50 common foods (chicken breast, rice, avocado, etc.)
- [ ] Test edge cases: "a big bowl of pasta", "2 slices of pizza", "a handful of nuts"
- [ ] Compare AI results against manual lookup (gold standard)

**Success Criteria**:
- Accuracy >90% on common foods
- Accuracy >70% on edge cases (can improve over time)
- Zero catastrophic errors (e.g., 100 calories vs. 1000)

---

## PRIORITY 2: Should Answer Before Scaling 🎯

These questions optimize implementation but don't block initial development.

### 4. What's the Right Pricing Model?
**Question**: Freemium, subscription, or one-time purchase?

**Why It Matters**:
- Amy iterated on pricing (dedicated video on uncertainty)
- Wrong model leaves money on table or drives users away
- Affects retention (subscriptions have higher lifetime value)

**Research Actions**:
- [ ] Survey 50-100 potential users:
  - "Would you pay $5 one-time or $5/month for unlimited AI food logging?"
  - "What's your maximum monthly budget for a fitness app?"
  - "Do you prefer one-time purchases or subscriptions?"
- [ ] Analyze competitor pricing:
  - MyFitnessPal: Freemium ($19.99/month premium)
  - LoseIt: Freemium ($9.99/month premium)
  - Cronometer: Freemium ($7.99/month premium)
- [ ] Test 3 pricing models with landing page A/B test

**Success Criteria**:
- Clear preference emerges (>60% choose one model)
- Pricing aligns with competitor expectations
- Lifetime value (LTV) > Customer Acquisition Cost (CAC)

---

### 5. What Features Are Must-Haves vs. Nice-to-Haves?
**Question**: What's the minimum viable feature set?

**Why It Matters**:
- Feature creep killed many apps
- Amy launched with core logging + AI (minimal features)
- Every feature increases dev time and maintenance burden

**Research Actions**:
- [ ] Analyze App Store reviews of competitors:
  - Top complaints: What do users HATE?
  - Top requests: What do users WANT but don't have?
- [ ] Categorize requests into:
  - Critical blockers (would cause uninstall)
  - Important but not blocking (nice to have)
  - Irrelevant (too niche)
- [ ] Test mockups with 10-20 users: "Which features would you use daily?"

**Success Criteria**:
- MVP defined in <8 features
- 0-2 critical blockers identified
- Clear roadmap for post-launch features

---

### 6. How Do We Acquire Users Without a YouTube Audience?
**Question**: What's the go-to-market strategy?

**Why It Matters**:
- Amy leveraged Chris's YouTube audience (built-in marketing)
- Most indie devs don't have this advantage
- User acquisition is the #1 cause of startup failure

**Research Actions**:
- [ ] Research successful indie app launches (Case Studies):
  - How did they acquire first 100 users?
  - What was their CAC?
  - Which channels worked best?
- [ ] Test pre-launch marketing:
  - Product Hunt announcement (cost: $0-50)
  - Reddit/IndieHackers posts (cost: $0)
  - Twitter/X threads with before/after demos (cost: $0)
- [ ] Identify low-hanging fruit:
  - App Store SEO (keywords: "calorie tracker", "food journal")
  - Influencer partnerships (fitness micro-influencers)

**Success Criteria**:
- At least 3 viable acquisition channels identified
- Target CAC < $5/user (to break even at $5-10/month revenue)
- Marketing plan for first 1000 users

---

## PRIORITY 3: Optimize After Launch 📈

These questions improve the product but can be answered iteratively.

### 7. What's the Target Retention Rate?
**Question**: What's good vs. bad retention for calorie trackers?

**Why It Matters**:
- High churn kills revenue growth
- Need benchmarks to measure success
- Retention is more important than acquisition (leaky bucket problem)

**Research Actions**:
- [ ] Research industry benchmarks for health/fitness apps:
  - Day 1 retention: typically 30-50%
  - Day 7 retention: typically 15-30%
  - Day 30 retention: typically 5-15%
- [ ] Analyze Amy's trajectory (if data available)
- [ ] Define success criteria:
  - Good: Top 25% of industry
  - Great: Top 10% of industry

**Success Criteria**:
- Clear retention targets set (e.g., D7 >20%)
- Dashboard planned to measure retention
- Engagement features planned to improve retention

---

### 8. Should We Be Cross-Platform or iOS-First?
**Question**: Do we build for iOS only, or launch on Android too?

**Why It Matters**:
- Android has 2x more users globally
- iOS users pay more (higher monetization)
- Cross-platform increases dev time 2-3x

**Research Actions**:
- [ ] Analyze target audience demographics:
  - Are they iPhone or Android users?
  - What's the iPhone vs. Android split in fitness space?
- [ ] Test hypothesis with survey:
  - "Would you use a calorie tracker app if it's iOS-only?"
  - "Would you pay $5 more for an Android version?"
- [ ] Estimate revenue impact:
  - iOS-only: 100% of potential iPhone users
  - Cross-platform: 150-200% of total market, but 2-3x dev cost

**Success Criteria**:
- Decision made on platform strategy
- If cross-platform: tech stack chosen (React Native, Flutter, etc.)
- If iOS-only: plan for Android expansion in future

---

### 9. What's the Competitive Differentiator Beyond Speed?
**Question**: How do we defend against competitors copying us?

**Why It Matters**:
- "Speed" is easy to copy
- MyFitnessPal could add AI overnight
- Need sustainable moat (long-term advantage)

**Research Actions**:
- [ ] Analyze competitor moats:
  - MyFitnessPal: Massive database, brand, social features
  - Cronometer: Detailed nutrition tracking
  - LoseIt: Simple, long-standing
- [ ] Brainstorm potential moats:
  - Data network effect (user recipes improve AI)
  - Personalization (AI learns user's eating patterns)
  - Integration (Apple Health, Fitbit, smart scales)
  - Community (private groups, challenges)

**Success Criteria**:
- At least 2 sustainable moats identified
- Roadmap planned to build moats over 6-12 months
- Competitive strategy documented

---

## Additional Research Questions 🤔

### User Experience
- Is voice input preferred, or do users prefer text?
- What's the optimal onboarding flow (how many steps)?
- Should we ask users to verify AI guesses (adds friction but improves accuracy)?

### Technical
- Which local LLM is best for food parsing (speed, accuracy, battery)?
- Can we pre-load a local nutrition database to reduce API calls 90%?
- What's the offline mode requirement (e.g., no network, cache only)?

### Business
- Should we offer a free trial (7 days, 14 days)?
- Should we have annual discounts (20% off yearly)?
- What's the optimal App Store keywords for ranking?

### Legal/Regulatory
- Do we need HIPAA compliance (US health data law)?
- What disclaimers are required (not medical advice)?
- What data must we collect (GDPR/CCPA)?

---

## Research Timeline 📅

### Week 1-2: Critical Validation
- [ ] 10-20 user interviews
- [ ] API testing (accuracy, cost, speed)
- [ ] Competitor analysis (pricing, features, reviews)

### Week 3: Strategic Decisions
- [ ] Pricing model decision
- [ ] Platform strategy (iOS vs. cross-platform)
- [ ] MVP feature set finalization

### Week 4: Pre-Launch Prep
- [ ] Marketing plan (first 1000 users)
- [ ] Landing page A/B test
- [ ] App Store assets (screenshots, keywords)

### Week 5-6: Build & Launch
- [ ] MVP development (if validation positive)
- [ ] Beta testing with 10-20 users
- [ ] App Store submission

### Week 7-8: Launch & Iterate
- [ ] Go live
- [ ] Monitor metrics (retention, revenue, bugs)
- [ ] Plan next features based on data

---

## Success Metrics 📊

### Pre-Launch (Validation)
- **User interviews**: 10-20 completed
- **API accuracy**: >90% on common foods
- **Cost validation**: <$1/user/month at 1000-user scale
- **Willingness to pay**: >50% at $5-10/month

### Post-Launch (First 30 Days)
- **User acquisition**: 100-500 users
- **Retention**: D7 >20%, D30 >10%
- **Revenue**: >$100 MRR
- **NPS score**: >30 (user satisfaction)

### Post-Launch (First 90 Days)
- **User acquisition**: 500-2000 users
- **Retention**: D7 >25%, D30 >15%
- **Revenue**: >$500 MRR
- **Churn**: <10% monthly

---

## Decision Gates 🚦

### ✅ GO if:
- User interviews confirm "fast logging" is a pain point
- API costs are <$1/user/month at target scale
- At least 50% express willingness to pay $5-10/month

### ⚠️ PROCEED WITH CAUTION if:
- Pain point confirmed but weaker than expected
- API costs are $1-2/user/month (marginal economics)
- Willingness to pay is 30-50%

### 🛑 STOP if:
- Users don't see fast logging as a problem
- API costs are >$2/user/month (unviable)
- Less than 30% willing to pay

---

## Resources for Research 📚

### User Research
- SurveyMonkey / Typeform for surveys
- UserInterviews.com for paid interviews
- Reddit/r/loseit, r/fitness for organic feedback

### API Testing
- Postman or Insomnia for API testing
- Jupyter notebooks for batch testing
- Local LLM: Ollama, LM Studio

### Market Research
- App Annie / Sensor Tower for app store data (paid)
- Product Hunt for indie app launches
- IndieHackers.com for developer stories

### Case Studies
- "Indie Hackers" success stories
- "How I Built X" articles (Medium, Dev.to)
- Chris Raroque's other videos (pricing, launch strategy)

---

**Last Updated**: February 15, 2026
**Next Action**: Start user interviews and API testing (Week 1-2)
**Decision**: Proceed with validation before writing any code
