# Client Navigation Master Blueprint - CalorieTracker

**Date:** 2026-02-15
**Purpose:** Implementation-ready product/navigation blueprint for web-first mobile PWA
**Context:** Based on research foundation, architecture decisions, and video learnings
**Status:** Planning Document - No Code

---

## Executive Summary

This blueprint defines the complete client-side navigation architecture for CalorieTracker's v1 MVP. The design prioritizes **speed to log (<10 seconds core flow)**, **GDPR compliance**, and **mobile-first PWA experience**. Navigation is deliberately simple with 4 primary sections, clear user state management, and comprehensive edge case handling.

**Core Design Principle:** Minimize friction between "I want to log food" and "Done."

**Key Decisions:**
- Web-first PWA (Next.js), mobile-first responsive design
- Deterministic nutrition pipeline (not LLM-only calorie truth)
- 4-tab primary navigation (Log, Today, History, Settings)
- Minimal onboarding (2-3 minutes, can skip)
- GDPR-first consent management (essential + optional)
- Partial offline support (cached data, draft logging)

---

## 1. User Personas + User States

### 1.1 User Personas

| Persona | Description | Primary Motivation | Technical Comfort |
|---------|-------------|-------------------|-------------------|
| **Busy Professional** | 25-40, works full-time, time-poor, health-conscious | Track calories quickly during breaks | High (mobile-native) |
| **Fitness Enthusiast** | 20-35, works out 3-5x/week, tracks macros | Monitor nutrition to support training | Medium-High |
| **Health Beginner** | 30-55, recently started health journey, not tech-savvy | Simple, non-intimidating way to track | Low-Medium |
| **Data-Driven User** | 25-45, loves analytics, wants detailed insights | See trends, optimize nutrition | High |

### 1.2 User States

#### State 1: First-Time Visitor (Unauthenticated)

**Characteristics:**
- No session, no local storage data
- May have arrived via direct link, search, or referral
- Zero knowledge of app features

**Entry Points:**
- Landing page (`/`)
- Auth pages (`/signup`, `/login`)
- Public marketing content

**Allowed Navigation:**
- Landing page content
- Auth flows (signup, login, password reset)
- Public legal pages (privacy policy, terms of service)
- ❌ Cannot access protected routes (redirected to login with redirect param)

**Storage:**
- Session: None
- Local: May store `referral_source` for analytics attribution
- Cookies: Essential only (auth session after signup)

**Transition Triggers:**
- → State 2: After successful signup
- → State 1 (remains): Logs out, closes browser

---

#### State 2: Signed-Up, Not Onboarded

**Characteristics:**
- Has valid auth session
- Account exists in database
- Has not completed onboarding (`onboarding_complete` flag = false)
- No goals, preferences, or consents set

**Entry Points:**
- After successful signup (automatic redirect)
- Returning user who abandoned onboarding

**Allowed Navigation:**
- Onboarding flow only (`/onboarding/*`)
- ❌ Cannot access main app (redirected to onboarding)
- Can logout → return to State 1

**Storage:**
- Session: Auth token, user profile
- Local: Onboarding progress (step index, draft answers)

**Termination:**
- → State 3: Completes onboarding
- → State 1: Logout
- Terminated: Account delete

---

#### State 3: Active User (Fully Onboarded)

**Characteristics:**
- Has valid auth session
- Completed onboarding (`onboarding_complete` flag = true)
- Has goals, preferences set
- Consent records exist

**Entry Points:**
- After onboarding completion
- Returning login with existing session

**Allowed Navigation:**
- All protected routes (tabs, settings, profile)
- ❌ Cannot access onboarding (skipped unless explicitly reset)
- Full account settings (GDPR rights, preferences, consents)

**Storage:**
- Session: Auth token, user profile
- Local: App preferences (theme, notifications, last logged meal)
- IndexedDB: Offline food log cache (for PWA offline support)

**Sub-States:**
- **Daily Active User:** Logged food today, engaged
- **Occasional User:** Has account but logs infrequently (>7 days inactive)
- **Power User:** Logs 3+ times daily, uses advanced features

**Transition Triggers:**
- → State 4: No food logs for 30+ days (soft transition)
- → State 1: Logout
- Terminated: Account delete

---

#### State 4: Returning Inactive User

**Characteristics:**
- Has valid auth session (or can restore via login)
- Completed onboarding in the past
- No food logs in last 30+ days
- May have outdated goals or preferences

**Entry Points:**
- Login after extended absence
- Returning via deep link or notification

**Allowed Navigation:**
- Full access to app (same as State 3)
- Optional re-engagement prompts (non-blocking)
- May show "welcome back" state with options to update goals

**Storage:**
- Session: Auth token, user profile
- Local: Previous app state (may be stale)

**Re-Engagement Triggers:**
- First log after 30+ days: Show "Welcome back! Update your goals?" modal (non-blocking)
- First log after 90+ days: Show "Let's set fresh goals" (optional re-onboarding)

**Transition Triggers:**
- → State 3: Logs food again (active)
- → State 1: Logout
- Terminated: Account delete

---

## 2. End-to-End User Journeys

### 2.1 First Day Journey (New User → Active)

```
┌─────────────────────────────────────────────────────────┐
│  FIRST DAY JOURNEY                                       │
├─────────────────────────────────────────────────────────┤
│  1. User lands on / (Landing Page)                      │
│     - Sees value prop: "Track food in 10 seconds"     │
│     - Sees CTA: "Get Started Free"                     │
│                                                          │
│  2. User clicks "Get Started" → /signup               │
│     - Enters email + password                           │
│     - (Optional) Social login (Google, Apple)          │
│     - Submits form                                       │
│                                                          │
│  3. Email verification (if required)                   │
│     - User clicks verification link                      │
│     - Redirected to /onboarding/welcome                │
│                                                          │
│  4. Onboarding Step 1: Welcome                         │
│     - Sees 3 key benefits                               │
│     - Clicks "Get Started"                             │
│                                                          │
│  5. Onboarding Step 2: Goals (Optional)                │
│     - Sets calorie goal (or skips → default 2000)      │
│     - Clicks "Next"                                     │
│                                                          │
│  6. Onboarding Step 3: Preferences                      │
│     - Units auto-detected (can override)                │
│     - Timezone auto-detected                            │
│     - Language auto-detected                            │
│     - Clicks "Next"                                     │
│                                                          │
│  7. Onboarding Step 4: Essential Consents              │
│     - Reads privacy policy + terms summaries            │
│     - Checks both required checkboxes                   │
│     - Clicks "I Agree"                                  │
│                                                          │
│  8. Onboarding Step 5: Optional Consents               │
│     - Analytics: unchecked (default)                    │
│     - Marketing: unchecked (default)                    │
│     - Clicks "Complete Onboarding"                      │
│                                                          │
│  9. Onboarding Complete                                 │
│     - Success screen: "You're all set!"                 │
│     - CTA: "Start Logging" → Redirects to /log         │
│                                                          │
│ 10. First Food Log                                       │
│     - Types: "chicken breast 150g with rice"           │
│     - Sees instant calorie estimate                     │
│     - Clicks "Log Food"                                 │
│     - Success: "Logged: 378 kcal"                       │
│                                                          │
│ 11. View Today's Progress                               │
│     - Auto-redirects to /today                          │
│     - Sees: "378 / 2000 kcal" (19%)                     │
│     - Progress bar: 19%                                  │
│     - Shows logged meal under "Lunch"                   │
│                                                          │
│ 12. Second Food Log (Same Session)                      │
│     - Bottom nav: Tap "Log"                             │
│     - Quick suggestions shows "chicken breast"          │
│     - Taps suggestion → Adjust quantity → Log           │
│                                                          │
│ 13. End of First Day                                    │
│     - User closes app / navigates away                   │
│     - Session persists (auth token)                      │
│     - Data synced to server                              │
└─────────────────────────────────────────────────────────┘
```

**Key Metrics to Track:**
- Signup to onboarding completion rate (target: >60%)
- Onboarding drop-off by step (identify friction)
- Time to first successful log (target: <5 minutes from signup)
- First day retention (target: >40% return next day)

---

### 2.2 Daily Use Journey (Active User)

```
┌─────────────────────────────────────────────────────────┐
│  DAILY USE JOURNEY (Morning Flow)                       │
├─────────────────────────────────────────────────────────┤
│  1. User opens app (or receives notification)           │
│     - Auth check: Token valid → Redirects to /today    │
│     - Sees yesterday's summary (if logged)              │
│                                                          │
│  2. User wants to log breakfast                         │
│     - Bottom nav: Tap "Log"                             │
│     - Input auto-focuses                                │
│     - Types: "oatmeal with banana 200g"                 │
│                                                          │
│  3. Instant calorie estimate appears                    │
│     - Shows: "Oatmeal: 150g (150 kcal) + ..."          │
│     - Total: ~280 kcal                                   │
│                                                          │
│  4. User confirms → "Log Food"                          │
│     - Success animation + toast: "Logged: 280 kcal"     │
│     - Returns to input, ready for next entry            │
│                                                          │
│  5. User checks today's progress                        │
│     - Bottom nav: Tap "Today"                           │
│     - Sees: "280 / 2000 kcal" (14%)                     │
│     - Breakfast section shows logged entry              │
│                                                          │
│  6. User closes app / continues day                      │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  DAILY USE JOURNEY (Evening Flow)                │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  1. User opens app (evening)                      │  │
│  │  2. Logs lunch and dinner (repeat morning flow)  │  │
│  │  3. Taps "Today" → Sees full day progress        │  │
│  │  4. At end of day: "1850 / 2000 kcal (93%)"       │  │
│  │  5. Optional: Add snack or adjust entries        │  │
│  │  6. User closes app, satisfied with progress      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Target Metrics:**
- Time to log food (target: <10 seconds)
- Daily logs per active user (target: 2-3 entries)
- Session length (target: <2 minutes for quick logging)

---

### 2.3 Weekly Review Journey (Engaged User)

```
┌─────────────────────────────────────────────────────────┐
│  WEEKLY REVIEW JOURNEY                                   │
├─────────────────────────────────────────────────────────┤
│  1. User opens app on Sunday evening                    │
│     - Navigates to /history (Bottom nav)               │
│                                                          │
│  2. Views weekly overview                               │
│     - Toggles from "Daily" to "Weekly" view             │
│     - Sees bar chart of daily totals                    │
│     - Average: 1,950 kcal/day                           │
│     - Highlight: "You stayed within goal 5/7 days"     │
│                                                          │
│  3. Drills into specific day                            │
│     - Taps Thursday bar (high: 2,400 kcal)             │
│     - Sees detailed breakdown                           │
│     - Notices: "Double dinner entry" (mistake)         │
│                                                          │
│  4. Corrects mistake                                    │
│     - Taps entry → Edit screen                          │
│     - Deletes duplicate entry                          │
│     - Thursday total updates to 1,800 kcal              │
│                                                          │
│  5. Reviews goals                                       │
│     - Navigates to /settings/goals                      │
│     - Considers: "Should I lower goal to 1,900?"       │
│     - Leaves unchanged for now                         │
│                                                          │
│  6. Closes app, feeling in control                      │
└─────────────────────────────────────────────────────────┘
```

**Note:** Weekly review features (charts, averages) are **post-MVP** (v1.1+). MVP will support daily history only.

---

### 2.4 Churn & Return Journey (Inactive User)

```
┌─────────────────────────────────────────────────────────┐
│  CHURN & RETURN JOURNEY                                 │
├─────────────────────────────────────────────────────────┤
│  1. User stops logging (Day 1-7)                        │
│     - No food entries                                   │
│     - App not opened                                    │
│     - Background: Life event, vacation, loss of motivation│
│                                                          │
│  2. Day 8: In-app notification (if enabled)            │
│     - Push: "Haven't logged today. How are you?"       │
│     - User: Ignores (or taps to view, closes quickly)   │
│                                                          │
│  3. Day 15: Email reminder (if opted in)               │
│     - Subject: "Your 14-day streak is waiting..."       │
│     - User: Doesn't open email                          │
│                                                          │
│  4. Day 30: User marked as "Inactive"                   │
│     - System sets `last_active_date` > 30 days ago     │
│     - No further automatic outreach                     │
│                                                          │
│  5. Day 60: User returns (motivation renewed)           │
│     - Opens app → Login screen                           │
│     - Enters credentials → Authenticates               │
│                                                          │
│  6. Re-engagement modal appears                         │
│     - "Welcome back! It's been 2 months."              │
│     - Question: "Want to update your goals?"            │
│     - Options: "Update Goals" | "Skip"                  │
│     - User chooses "Skip" → Proceeds to /log          │
│                                                          │
│  7. First return log                                    │
│     - Types: "salad with grilled chicken"              │
│     - Quick suggestion shows "grilled chicken"         │
│     - (Note: Suggestions from 2 months ago)           │
│     - Logs successfully                                 │
│                                                          │
│  8. User returns to active state (State 3)              │
│     - System records: `last_active_date = today`       │
│     - Streak counter resets to 1                        │
│     - User engaged again                                │
└─────────────────────────────────────────────────────────┘
```

**Re-engagement Strategies (Post-MVP):**
- Win-back emails after 30, 60, 90 days
- Personalized insights: "Your average was 1,950 kcal"
- Gamification: "Your longest streak was 21 days. Beat it?"
- Limited-time offers: "Come back, 1 month free"

---

## 3. Screen Inventory with Purpose & Required Data

### 3.1 Public Screens (No Auth Required)

| Screen | Route | Purpose | Required Data | MVP Priority |
|--------|-------|---------|---------------|--------------|
| **Landing Page** | `/` | Convert visitors to signups | - Hero content<br>- Feature benefits<br>- CTA to signup | ✅ MVP |
| **Signup** | `/signup` | Create new account | - Email<br>- Password<br>- (Optional) Social login | ✅ MVP |
| **Email Verification** | `/signup/verify-email` | Verify email address | - Verification token (URL param) | ✅ MVP |
| **Login** | `/login` | Authenticate returning user | - Email<br>- Password<br>- "Remember me" | ✅ MVP |
| **Forgot Password** | `/login/forgot-password` | Initiate password reset | - Email | ✅ MVP |
| **Reset Password** | `/reset-password/[token]` | Set new password | - New password<br>- Confirm password<br>- Reset token (URL param) | ✅ MVP |
| **Privacy Policy** | `/privacy` | Legal compliance document | - Static legal text | ✅ MVP |
| **Terms of Service** | `/terms` | Legal compliance document | - Static legal text | ✅ MVP |

---

### 3.2 Onboarding Screens (Auth Required, Not Onboarded)

| Screen | Route | Purpose | Required Data | MVP Priority |
|--------|-------|---------|---------------|--------------|
| **Welcome** | `/onboarding/welcome` | Set expectations, explain value | - (None - informational) | ✅ MVP |
| **Goals** | `/onboarding/goals` | Set daily calorie target | - Calorie goal (number, optional)<br>- Macros enabled (boolean, default false) | ✅ MVP |
| **Preferences** | `/onboarding/preferences` | Capture basic preferences | - Units (metric/imperial)<br>- Timezone (auto-detect)<br>- Language (auto-detect)<br>- Push notifications (ask permission) | ✅ MVP |
| **Essential Consents** | `/onboarding/consents` | GDPR legal acceptance | - Privacy policy accepted (boolean, required)<br>- Terms accepted (boolean, required) | ✅ MVP |
| **Optional Consents** | `/onboarding/consents-optional` | Collect non-essential opt-ins | - Analytics consent (boolean, default false)<br>- Marketing consent (boolean, default false) | ✅ MVP |
| **Complete** | `/onboarding/complete` | Success state, transition to app | - (None - display only) | ✅ MVP |

---

### 3.3 Primary App Screens (Auth Required, Onboarded)

| Screen | Route | Purpose | Required Data | MVP Priority |
|--------|-------|---------|---------------|--------------|
| **Log Food** | `/log` | Primary food entry interface | - User input (text/voice)<br>- Quick suggestions (recent foods)<br>- Search results (nutrition API)<br>- Food database cache | ✅ MVP |
| **Food Search Results** | `/log/search` | Display search results | - Search query<br>- Food matches from API<br>- Calories per serving | ✅ MVP |
| **Confirmation Modal** | `/log/confirm` | Verify low-confidence matches | - Parsed food items<br>- Calculated calories<br>- Confidence score | ✅ MVP |
| **Today Dashboard** | `/today` | View daily progress and logs | - Today's total calories<br>- Daily goal<br>- Meal breakdown (Breakfast, Lunch, Dinner, Snacks)<br>- Individual log entries | ✅ MVP |
| **Meal Detail** | `/today/meal/[id]` | View/edit specific meal | - Meal type<br>- Food entries in meal<br>- Total calories for meal | ✅ MVP |
| **History (Daily)** | `/history` | View past logs by date | - Date list with totals<br>- Individual entries per date<br>- Search/filter options | ✅ MVP |
| **History Entry Edit** | `/history/entry/[id]` | Edit or delete past entry | - Entry details (food, quantity, calories)<br>- Timestamp<br>- Meal type<br>- Validation rules | ✅ MVP |
| **Settings Home** | `/settings` | Settings navigation hub | - Current settings summary<br>- Links to sub-settings | ✅ MVP |
| **Profile Settings** | `/settings/profile` | Manage name, email, avatar | - Name<br>- Email<br>- Avatar (optional)<br>- Change password | ✅ MVP |
| **Goals Settings** | `/settings/goals` | Update calorie targets | - Daily calorie goal<br>- Macro targets (v1.1+)<br>- Goal history | ✅ MVP |
| **Preferences** | `/settings/preferences` | Units, theme, language | - Units (metric/imperial)<br>- Theme (light/dark/system)<br>- Language | ✅ MVP |
| **Notifications** | `/settings/notifications` | Manage reminder preferences | - Push notifications (enabled/disabled)<br>- Reminder times<br>- Email reminders (opt-in) | ✅ MVP |
| **Privacy & Consents** | `/settings/privacy` | Manage consent preferences | - Analytics consent (toggle)<br>- Marketing consent (toggle)<br>- Consent history | ✅ MVP |
| **GDPR Rights** | `/settings/gdpr` | Export/delete account | - Export button<br>- Delete account button<br>- GDPR rights documentation | ✅ MVP |
| **Export Data** | `/settings/gdpr/export` | Request data export | - Format selection (JSON/CSV)<br>- Include options<br>- Download links | ✅ MVP |
| **Delete Account** | `/settings/gdpr/delete` | Initiate account deletion | - Confirmation checkbox<br>- "Type DELETE" input<br>- Warning text | ✅ MVP |
| **Help & Support** | `/settings/help` | FAQ, contact support | - FAQ content<br>- Contact support form/email | ⏸️ v1.1 |
| **About** | `/settings/about` | App version, legal links | - App version<br>- Legal links<br>- Credits | ⏸️ v1.1 |

---

### 3.4 Modal/Overlay Screens

| Screen | Type | Purpose | Required Data | MVP Priority |
|--------|------|---------|---------------|--------------|
| **Session Expired Modal** | Modal | Alert when auth expires | - Message text<br>- "Login" / "Cancel" buttons | ✅ MVP |
| **Network Error Modal** | Modal | Alert for network failures | - Error type (timeout, server down)<br>- Retry button | ✅ MVP |
| **Offline Banner** | Banner | Show when offline | - "You're offline" message<br>- Pending sync count | ✅ MVP |
| **Welcome Back Modal** | Modal | Re-engagement for inactive users | - Days inactive count<br>- "Update goals?" question | ⏸️ v1.1 |
| **Confirmation Modal** | Modal | Verify destructive actions | - Action description<br>- "Confirm" / "Cancel" buttons | ✅ MVP |
| **Success Toast** | Toast | Brief success feedback | - Message text<br>- Auto-dismiss (3-5s) | ✅ MVP |
| **Error Toast** | Toast | Brief error feedback | - Error message<br>- Auto-dismiss (3-5s) | ✅ MVP |

---

## 4. Navigation Graph with Transitions & Guards

### 4.1 Top-Level Navigation Structure

```
┌─────────────────────────────────────────────────────────┐
│                    APP SHELL                             │
│  ├─ Header (dynamic per route)                         │
│  ├─ Main Content Area                                   │
│  │   └─ Route-specific content                          │
│  ├─ Bottom Navigation (mobile) / Sidebar (desktop)     │
│  └─ Global Modals & Overlays                           │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Primary Navigation Routes

```
/                                    (Landing - public)
├─ /signup                           (Auth flow - public)
│   └─ /signup/verify-email          (Email verification)
│
├─ /login                            (Auth flow - public)
│   └─ /login/forgot-password        (Password reset request)
│
├─ /reset-password                   (Public)
│   └─ /reset-password/[token]       (Reset with token)
│
├─ /onboarding                      (Protected - incomplete users only)
│   ├─ /onboarding/welcome
│   ├─ /onboarding/goals
│   ├─ /onboarding/preferences
│   ├─ /onboarding/consents          (Essential)
│   ├─ /onboarding/consents-optional (Optional)
│   └─ /onboarding/complete
│
├─ /log                             (Protected - main tab)
│   ├─ /log                          (Main logging interface)
│   ├─ /log/search                   (Food search/results)
│   └─ /log/confirm                  (Confirmation for low-confidence matches)
│
├─ /today                           (Protected - main tab)
│   ├─ /today                        (Daily dashboard)
│   └─ /today/meal/[id]             (Meal detail view)
│
├─ /history                         (Protected - main tab)
│   ├─ /history                      (Date-based history)
│   ├─ /history/weekly              (Weekly view - v1.1)
│   ├─ /history/monthly             (Monthly view - v1.1)
│   └─ /history/entry/[id]          (Single entry edit)
│
├─ /settings                        (Protected - main tab)
│   ├─ /settings                    (Settings home)
│   ├─ /settings/profile            (Name, email, avatar)
│   ├─ /settings/goals              (Calorie goals, macros - v1.1)
│   ├─ /settings/preferences        (Units, theme, language)
│   ├─ /settings/notifications      (Push/email reminders)
│   ├─ /settings/privacy            (Consent management)
│   ├─ /settings/gdpr               (Export, delete, rights)
│   │   ├─ /settings/gdpr/export
│   │   └─ /settings/gdpr/delete
│   ├─ /settings/help               (FAQ, support - v1.1)
│   └─ /settings/about              (App version, legal links - v1.1)
│
├─ /privacy                         (Public - legal)
├─ /terms                           (Public - legal)
└─ /legal/*                         (Public - legal docs)
```

---

### 4.3 Navigation Transitions

#### Transition Type 1: Tab Navigation (Primary)

**Use Cases:**
- Switching between Log, Today, History, Settings tabs

**Behavior:**
- Mobile: Bottom tab bar tap
- Desktop: Sidebar click
- Instant, preserves scroll position
- No animation (instant switch)

**Guardrails:**
- Requires: Authenticated + onboarded
- Redirect: If not authenticated → `/login?redirect=/target`
- Redirect: If not onboarded → `/onboarding`

---

#### Transition Type 2: Push Navigation (Drill-Down)

**Use Cases:**
- `/today` → `/today/meal/[id]`
- `/history` → `/history/entry/[id]`
- Any detail view from list

**Behavior:**
- Mobile: Slide in from right (iOS-style)
- Desktop: Same-page content update or modal
- Animated transition
- Adds to history stack (back button returns to previous)

**Guardrails:**
- Requires: Authenticated
- Data: Must have valid ID parameter
- 404: If entry not found → Show "Entry not found" error state

---

#### Transition Type 3: Modal Navigation (Overlays)

**Use Cases:**
- Quick settings, confirmations, alerts
- Food confirmation (`/log/confirm`)
- Session expired, network errors

**Behavior:**
- Mobile: Bottom sheet or centered modal
- Desktop: Centered modal
- Dismissible with backdrop tap (unless critical action)
- Backdrop dims background content

**Guardrails:**
- Critical actions (delete account): Cannot dismiss with backdrop tap
- Requires explicit confirmation

---

#### Transition Type 4: Replace Navigation (Auth Flows)

**Use Cases:**
- `/signup` → `/onboarding`
- `/reset-password/[token]` → `/login` (after success)
- `/settings/gdpr/delete` → `/` (after account deleted)

**Behavior:**
- Replaces history entry (no back to signup)
- User cannot navigate back to previous sensitive flow

**Guardrails:**
- Only used for state transitions that shouldn't be reversed

---

#### Transition Type 5: Redirect Navigation (State-Based)

**Use Cases:**
- Protected route accessed while unauthenticated
- Onboarded user accesses `/onboarding`
- Unonboarded user accesses protected routes

**Behavior:**
- Automatic redirect to appropriate route
- Original target saved as `redirect` query param

**Examples:**
```
User (unauthenticated) tries to access /log
→ Redirect to /login?redirect=/log

User (onboarded) tries to access /onboarding
→ Redirect to /log

User (not onboarded) tries to access /log
→ Redirect to /onboarding
```

---

### 4.4 Navigation Guards

| Guard | Condition | Action | Redirect To |
|-------|-----------|--------|-------------|
| **Auth Guard** | `!isAuthenticated` | Block access to protected routes | `/login?redirect=/target` |
| **Onboarding Guard** | `!onboardingComplete` | Block access to main app | `/onboarding` |
| **Reverse Onboarding Guard** | `onboardingComplete` | Block access to onboarding | `/log` |
| **Deleted Account Guard** | `accountDeleted` | Block all access | `/` (logged out) |
| **Session Expiry Guard** | `tokenExpired` | Show session expired modal | Modal with login option |
| **Rate Limit Guard** | `apiRateLimited` | Show rate limit message | Toast with retry option |
| **Feature Flag Guard** | `!featureEnabled` | Hide/disable feature | N/A (component conditional) |

---

### 4.5 Navigation State Machine

```typescript
// State machine for user navigation states

type UserState =
  | "first_time_visitor"      // State 1
  | "signed_up_not_onboarded" // State 2
  | "active_user"             // State 3
  | "returning_inactive";     // State 4

type NavigationAction =
  | "signup"
  | "login"
  | "logout"
  | "complete_onboarding"
  | "become_inactive"        // 30+ days without logs
  | "become_active"          // Log food after inactivity
  | "delete_account";

// State transitions
const transitions: Record<UserState, Record<NavigationAction, UserState>> = {
  "first_time_visitor": {
    "signup": "signed_up_not_onboarded",
    "login": "active_user",
  },
  "signed_up_not_onboarded": {
    "complete_onboarding": "active_user",
    "logout": "first_time_visitor",
    "delete_account": "first_time_visitor",
  },
  "active_user": {
    "logout": "first_time_visitor",
    "become_inactive": "returning_inactive",
    "delete_account": "first_time_visitor",
  },
  "returning_inactive": {
    "become_active": "active_user",
    "logout": "first_time_visitor",
    "delete_account": "first_time_visitor",
  },
};
```

---

## 5. Information Architecture (Entity CRUD by Screen)

### 5.1 Core Data Entities

| Entity | Description | Stored Where |
|--------|-------------|--------------|
| **User** | User profile, auth, preferences | Supabase `users` table |
| **FoodLog** | Individual food log entry | Supabase `food_logs` table |
| **Meal** | Grouping of food logs (Breakfast, Lunch, etc.) | Virtual (derived from food_logs) |
| **Goal** | User's calorie/macro targets | Supabase `goals` table |
| **Consent** | Consent records (GDPR compliance) | Supabase `consent_history` table |
| **FoodCache** | Cached nutrition data for offline | IndexedDB (local) |
| **DraftLog** | In-progress offline log entry | IndexedDB (local) |
| **AppPreferences** | Theme, language, notification settings | LocalStorage (local) |

---

### 5.2 Entity CRUD by Screen

#### Auth & Onboarding Screens

| Screen | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| `/signup` | ✅ User | - | - | - |
| `/login` | - | ✅ User (auth) | - | - |
| `/onboarding/goals` | ✅ Goal | - | - | - |
| `/onboarding/preferences` | - | - | ✅ User (preferences) | - |
| `/onboarding/consents` | ✅ Consent | - | - | - |
| `/onboarding/complete` | - | - | ✅ User (onboarding_complete=true) | - |

---

#### Primary App Screens

| Screen | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| `/log` | ✅ FoodLog | ✅ FoodCache<br>✅ DraftLog | ✅ DraftLog | ✅ DraftLog |
| `/log/search` | - | ✅ FoodCache<br>🌐 Nutrition API | ✅ FoodCache (write-through) | - |
| `/log/confirm` | - | ✅ FoodLog (draft) | ✅ FoodLog (confirm) | - |
| `/today` | - | ✅ FoodLog (today)<br>✅ Goal (current) | - | - |
| `/today/meal/[id]` | - | ✅ FoodLog (meal) | ✅ FoodLog (edit) | ✅ FoodLog |
| `/history` | - | ✅ FoodLog (past)<br>✅ Goal (history) | - | - |
| `/history/entry/[id]` | - | ✅ FoodLog (single) | ✅ FoodLog (edit) | ✅ FoodLog |
| `/settings/profile` | - | ✅ User (profile) | ✅ User (profile) | - |
| `/settings/goals` | - | ✅ Goal (current) | ✅ Goal (current) | - |
| `/settings/preferences` | - | ✅ AppPreferences | ✅ AppPreferences | - |
| `/settings/notifications` | - | ✅ User (notifications) | ✅ User (notifications) | - |
| `/settings/privacy` | - | ✅ Consent (current) | ✅ Consent (withdraw) | - |
| `/settings/gdpr/export` | - | ✅ User (all)<br>✅ FoodLog (all)<br>✅ Goal (all)<br>✅ Consent (all) | - | - |
| `/settings/gdpr/delete` | - | - | ✅ User (deleted_at) | 🗑️ User (soft delete)<br>🗑️ FoodLog (cascade)<br>🗑️ Goal (cascade)<br>🗑️ Consent (cascade) |

---

### 5.3 Data Flow Diagrams

#### Flow 1: Log Food (Happy Path)

```
User Input: "chicken breast 150g with rice"
    ↓
[CLIENT] Local LLM Parsing
    ↓ Extract food items, quantities
Parsed: [{name: "chicken breast", qty: 150, unit: "g"}, ...]
    ↓
[CLIENT] IndexedDB Cache Lookup
    ↓ Check if nutrition data cached locally
Cache Miss (or stale)
    ↓
[CLIENT] Nutrition API Call (FatSecret/USDA/etc.)
    ↓ Request nutrition data for parsed items
API Response: {chicken_breast: {calories_per_100g: 165}, ...}
    ↓
[CLIENT] Calculation (Deterministic Code)
    ↓ Calculate total calories
Total: 248 kcal
    ↓
[CLIENT] User Confirmation (If Low Confidence)
    ↓ Show: "chicken breast 150g (248 kcal) + ... = 378 kcal?"
User: Confirm
    ↓
[CLIENT] IndexedDB Write (Offline Cache)
    ↓ Cache nutrition data for future
Cached: {chicken_breast: {...}, rice: {...}}
    ↓
[CLIENT] Supabase Insert
    ↓ Persist food log entry
INSERT INTO food_logs (user_id, food_name, quantity, calories, ...)
    ↓
[CLIENT] LocalStorage Update
    ↓ Update app preferences, last logged meal
{"last_active_date": "2026-02-15", "last_logged_meal": "lunch"}
    ↓
Success: "Logged: 378 kcal" toast
```

---

#### Flow 2: User Registration

```
User: Submits signup form
    ↓
[CLIENT] Supabase Auth Signup
    ↓ Create user account with email/password
supabase.auth.signUp({email, password})
    ↓
[CLIENT] Send Email Verification (if required)
    ↓ Send verification email
Email sent to user
    ↓
[CLIENT] Redirect to /signup/verify-email
    ↓ Show: "Check your email to verify"
User: Clicks verification link
    ↓
[CLIENT] Supabase Verify Email
    ↓ Verify email token
supabase.auth.verifyOtp(...)
    ↓
[CLIENT] Create User Record in Database
    ↓ Insert into users table
INSERT INTO users (id, email, onboarding_complete=false, ...)
    ↓
[CLIENT] Set Session
    ↓ Store auth token in session
localStorage.setItem("auth_token", token)
    ↓
[CLIENT] Redirect to /onboarding/welcome
Onboarding flow begins
```

---

#### Flow 3: Account Deletion (GDPR Right to Erasure)

```
User: Navigates to /settings/gdpr/delete
    ↓
[CLIENT] Show Warning & Confirmation
    ↓ Checkbox: "I understand my data will be permanently deleted"
    ↓ Input: "Type DELETE to confirm"
User: Completes confirmation → Clicks "Delete My Account"
    ↓
[CLIENT] Supabase Update (Soft Delete)
    ↓ Mark user as deleted (30-day recovery window)
UPDATE users SET deleted_at = NOW(), status = 'deleted' WHERE id = ?
    ↓
[CLIENT] Log to gdpr_requests
    ↓ Record deletion request
INSERT INTO gdpr_requests (user_id, request_type='delete', ...)
    ↓
[CLIENT] Log to security_events
    ↓ Record account deletion event
INSERT INTO security_events (user_id, event_type='account_deleted', ...)
    ↓
[CLIENT] Clear Session
    ↓ Remove auth token
localStorage.removeItem("auth_token")
    ↓
[CLIENT] Clear LocalStorage & IndexedDB
    ↓ Remove all local user data
localStorage.clear()
indexedDB.deleteDatabase("calorietracker")
    ↓
[CLIENT] Redirect to / (Landing Page)
    ↓ Show: "Your account has been deleted"
[BACKEND] Cron Job (30 days later)
    ↓ Permanently delete user data
DELETE FROM food_logs WHERE user_id = ?
DELETE FROM goals WHERE user_id = ?
DELETE FROM consent_history WHERE user_id = ?
DELETE FROM users WHERE id = ?
```

---

## 6. Empty/Error/Offline States & UX Copy Intent

### 6.1 Empty States

#### Empty State 1: No Food Logs Today (`/today`)

**Conditions:**
- User is authenticated & onboarded
- Today's date has no food_logs entries

**UI Components:**
- Illustration: Empty plate or calendar icon
- Headline: "You haven't logged any food today"
- Subtext: "Start tracking to see your daily progress"
- CTA: "Log your first meal" (primary button) → Redirects to `/log`

**UX Copy Intent:**
- Tone: Encouraging, not blaming
- Actionable: Clear next step
- Consistent: Same illustration style across empty states

---

#### Empty State 2: No History (`/history`)

**Conditions:**
- User is authenticated & onboarded
- No food_logs entries in history

**UI Components:**
- Illustration: Empty list or timeline
- Headline: "No food logs yet"
- Subtext: "Start tracking to see your history and trends"
- CTA: "Log food now" (primary button) → Redirects to `/log`

---

#### Empty State 3: No Search Results (`/log/search`)

**Conditions:**
- User searches for food
- API returns no matches or no local cache

**UI Components:**
- Illustration: Magnifying glass with question mark
- Headline: "We couldn't find a match for '[query]'"
- Subtext: "Try a different search term or log manually"
- CTAs:
  - "Try different search" (secondary) → Clear input, refocus
  - "Log manually" (tertiary) → Open manual entry form (v1.1)

---

#### Empty State 4: No Goals Set (`/settings/goals`)

**Conditions:**
- User navigates to goals settings
- No goal record exists in database

**UI Components:**
- Icon: Target icon (no illustration)
- Headline: "No calorie goals set"
- Subtext: "Set a daily calorie goal to track your progress"
- CTA: "Set a goal" (primary button) → Open goal setting modal

---

#### Empty State 5: Offline with No Cache

**Conditions:**
- User is offline (navigator.onLine = false)
- No IndexedDB cache available
- User tries to access data requiring server

**UI Components:**
- Illustration: Cloud with offline icon
- Headline: "You're offline"
- Subtext: "No cached data available. Connect to the internet to continue."
- CTA: "Retry" (disabled until online) → Reload page

---

### 6.2 Error States

#### Error State 1: Network Timeout

**Trigger:**
- API request times out (>30 seconds)

**UI Components:**
- Toast (non-blocking): "Request timed out. Please try again."
- Action: "Retry" (button in toast or separate button)

**UX Copy Intent:**
- Clear: What went wrong (timeout)
- Helpful: What to do (retry)
- Non-disruptive: Toast doesn't block user flow

---

#### Error State 2: Server Down (500 Error)

**Trigger:**
- API returns 500 Internal Server Error

**UI Components:**
- Modal (blocking): "Server unavailable"
- Message: "We're having trouble connecting to our servers. Please try again in a few minutes."
- Actions:
  - "Retry" (primary) → Retry failed request
  - "Refresh Page" (secondary) → Reload current page
  - "Contact Support" (tertiary) → Open help page

---

#### Error State 3: Session Expired

**Trigger:**
- Auth token expired or invalidated

**UI Components:**
- Modal (blocking): "Session Expired"
- Message: "Your session has expired for security. Please login again to continue."
- Actions:
  - "Login" (primary) → Redirect to `/login?redirect=/current-route`
  - "Cancel" (secondary) → Redirect to `/` (landing page)

---

#### Error State 4: Validation Error (Form Field)

**Trigger:**
- User enters invalid data in form field

**UI Components:**
- Inline error below input field (red text)
- Example: "Please enter a valid calorie value (1000-6000)"
- Disappears when user corrects input

**UX Copy Intent:**
- Specific: What field is invalid
- Actionable: What valid values are
- Immediate feedback: User can fix immediately

---

#### Error State 5: Rate Limit Exceeded

**Trigger:**
- API rate limit hit (too many requests)

**UI Components:**
- Toast: "Too many requests. Please wait a moment."
- Action: None (auto-dismiss after 3-5 seconds)

**UX Copy Intent:**
- Transparent: Why request failed (rate limit)
- Brief: Non-intrusive, auto-dismisses

---

#### Error State 6: Food Not Found (API)

**Trigger:**
- Nutrition API returns no match for food

**UI Components:**
- Inline message in search results: "We couldn't find nutrition data for '[food]'"
- Actions:
  - "Try different search" → Clear input, refocus
  - "Log manually" (v1.1) → Open manual entry form

---

### 6.3 Offline States

#### Offline State 1: Offline Banner

**Trigger:**
- `navigator.onLine = false`

**UI Components:**
- Banner at top of screen (persistent)
- Icon: Cloud with offline indicator
- Text: "You're offline. Changes will sync when you reconnect."
- Dismissible: "X" button (but reappears if action fails)

**Behavior:**
- Visible on all screens when offline
- Dismissible but returns if user tries online-only action
- Updates to "You're back online!" when connection restored

---

#### Offline State 2: Draft Saving

**Trigger:**
- User tries to log food while offline

**UI Components:**
- Modal: "You're offline"
- Message: "Your food log will be saved locally and synced when you're back online."
- Actions:
  - "Save Draft" (primary) → Save to IndexedDB draft_logs
  - "Cancel" (secondary) → Discard draft

**Behavior:**
- Draft saved to IndexedDB `draft_logs` table
- Synced to server when connection restored
- Conflict resolution: If same entry edited on multiple devices

---

#### Offline State 3: Queue Indicator

**Trigger:**
- User has pending sync actions (drafts, edits) while offline

**UI Components:**
- Badge in bottom-right corner
- Number: Count of pending sync actions
- Tap to view queue (modal with list of pending actions)

**Behavior:**
- Shows count of unsynced actions
- Tap to view details
- Auto-updates when sync completes

---

#### Offline State 4: Action Blocking

**Trigger:**
- User tries action that requires server (export, delete) while offline

**UI Components:**
- Button disabled (grayed out)
- Tooltip on hover/tap: "Requires internet connection"
- Example: "Export Data" button disabled

**Behavior:**
- Disable all server-dependent actions
- Show clear reason why disabled
- Re-enable when connection restored

---

### 6.4 Loading States

#### Loading State 1: Initial Page Load

**Trigger:**
- Page first loads, data fetching

**UI Components:**
- Skeleton screens for content areas
- Spinner in header or center of screen
- Text: "Loading..." (optional)

**Behavior:**
- Show skeleton until data loaded
- Smooth fade-in when data arrives
- Timeout after 5 seconds: Show error message

---

#### Loading State 2: Form Submission

**Trigger:**
- User submits form (signup, save settings, etc.)

**UI Components:**
- Submit button shows spinner
- Button text: "Saving..." (disabled)
- Toast on success: "Saved successfully"

**Behavior:**
- Disable submit button to prevent double-submission
- Show spinner until response received
- Re-enable button on error (with error message)

---

#### Loading State 3: Food Search

**Trigger:**
- User types in food search input

**UI Components:**
- Debounced (300ms) - wait until user stops typing
- Show spinner below input while searching
- Show results when API responds

**Behavior:**
- Don't show results for every keystroke (debounce)
- Cancel previous request if user continues typing
- Show cached results if available

---

## 7. Priority Matrix: MVP vs v1.1 vs Later

### 7.1 MVP (Must-Have - Launch in 30 Days)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| **Core Auth Flow** | ✅ Critical | Signup, login, email verification required |
| **Onboarding Flow** | ✅ Critical | Essential consents (GDPR), basic goals/preferences |
| **Food Logging (Text)** | ✅ Critical | Core value prop: fast food logging |
| **Nutrition API Integration** | ✅ Critical | Deterministic nutrition lookup (not LLM-only) |
| **Today Dashboard** | ✅ Critical | View daily progress, meal breakdown |
| **Daily History** | ✅ Critical | View past logs, edit/delete entries |
| **Basic Settings** | ✅ Critical | Profile, goals, preferences, notifications |
| **GDPR Export** | ✅ Critical | Legal requirement (Right to Access) |
| **GDPR Delete** | ✅ Critical | Legal requirement (Right to Erasure) |
| **Consent Management** | ✅ Critical | Legal requirement (GDPR Article 7) |
| **Partial Offline Support** | ✅ Critical | View cached data, draft logging for sync |
| **Error/Empty States** | ✅ Critical | Basic UX polish for all screens |
| **Mobile-First PWA** | ✅ Critical | Web-first, mobile-responsive, installable |

**MVP Exclusions (Deliberately Out of Scope):**
- Voice input (deferred to v1.1)
- Macro tracking (deferred to v1.1)
- Weekly/monthly analytics (deferred to v1.1)
- Photo logging (deferred to later)
- Social features (deferred to later)
- Gamification/streaks (deferred to later)
- Advanced export formats (CSV only, JSON v1.1)

---

### 7.2 v1.1 (High Priority - Post-Launch)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| **Voice Input** | 🔶 High | Faster logging, requested by users |
| **Macro Tracking** | 🔶 High | Protein, carbs, fats (fitness users) |
| **Weekly Analytics** | 🔶 High | View trends, average calories |
| **Monthly Analytics** | 🔶 High | Longer-term progress tracking |
| **Quick Actions (Swipe)** | 🔶 High | Edit/delete entries with swipe gesture |
| **Search Filters** | 🔶 High | Filter history by meal type, food |
| **JSON Export Format** | 🔶 High | Better data portability |
| **Help & FAQ Section** | 🔶 High | Reduce support burden |
| **Re-engagement Modals** | 🔶 High | "Welcome back" for inactive users |
| **Push Notification Reminders** | 🔶 High | Encourage daily logging habit |

**v1.1 Decision Criteria:**
- Launch MVP → Gather user feedback (2-4 weeks)
- Prioritize based on:
  - Most requested features
  - Impact on retention/engagement
  - Technical complexity vs. value

---

### 7.3 Later Features (Lower Priority)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| **Photo Logging** | 🔹 Low | High complexity, moderate value |
| **Recipe Builder** | 🔹 Low | Niche use case, complex |
| **Meal Suggestions** | 🔹 Low | Requires ML/recommendation engine |
| **Social Features** | 🔹 Low | Privacy-first product, social complicates |
| **Gamification (Streaks, Badges)** | 🔹 Low | Nice-to-have, not core |
| **Advanced Analytics (Charts, Insights)** | 🔹 Low | Power user feature |
| **Integrations (HealthKit, Google Fit)** | 🔹 Low | Platform-specific, complex |
| **Barcode Scanning** | 🔹 Low | Hardware-specific, low accuracy |
| **Meal Planning** | 🔹 Low | Complex, unclear demand |
| **Community/Recipes** | 🔹 Low | Out of scope for simple tracker |

**Later Decision Criteria:**
- Evaluate after v1.1 based on:
  - User demand (feature requests)
  - Retention impact (A/B test)
  - Business model (monetization opportunity)

---

### 7.4 Feature Decision Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Food Logging (Text) | High | Low | MVP |
| Today Dashboard | High | Low | MVP |
| Daily History | High | Low | MVP |
| GDPR Export/Delete | High | Medium | MVP (Legal) |
| Offline Support | Medium | Medium | MVP |
| Voice Input | High | Medium | v1.1 |
| Macro Tracking | Medium | High | v1.1 |
| Weekly Analytics | Medium | Medium | v1.1 |
| Photo Logging | Medium | High | Later |
| Social Features | Low | High | Later |
| Gamification | Low | Medium | Later |

**Legend:**
- **Impact:** High (core value prop), Medium (nice-to-have), Low (nice-to-have)
- **Effort:** Low (1-3 days), Medium (1-2 weeks), High (2-4 weeks)

---

## 8. Open Decisions List for Luis (Strictly Actionable)

### 8.1 Technical Decisions (Required Before MVP)

#### Decision T1: Nutrition Provider Selection

**Question:** Which nutrition database/API provider to use for MVP?

**Options:**
- **A: FatSecret API**
  - Pros: Comprehensive database, good accuracy
  - Cons: Expensive ($1,500/month minimum for commercial), requires branding
- **B: USDA FoodData Central**
  - Pros: Free, US-based, official data
  - Cons: US-centric, limited restaurant data, no real-time search
- **C: Edamam API**
  - Pros: Good free tier (10,000 calls/month), decent accuracy
  - Cons: Rate limits, search limitations
- **D: Perplexity Sonar**
  - Pros: Excellent accuracy, returns sources
  - Cons: Expensive (~$5/1,000 searches), unpredictable costs

**Default Recommendation:** **C (Edamam API)** for MVP (free tier sufficient for early users), switch to **A (FatSecret)** or hybrid model at scale.

**Action Required:**
- [ ] Test Edamam API with 100+ common foods for accuracy
- [ ] Calculate per-user cost at 100, 500, 1000 users
- [ ] Validate free tier sufficiency for first 3 months
- [ ] Plan fallback to FatSecret if Edamam limits hit

---

#### Decision T2: Authentication Method

**Question:** Which auth providers to support in MVP?

**Options:**
- **A: Email/Password Only**
  - Pros: Simple, no external dependencies
  - Cons: Higher friction, more abandonment
- **B: Email + Social Login (Google, Apple)**
  - Pros: Lower friction, better UX
  - Cons: More complex setup, additional provider costs
- **C: Magic Links Only**
  - Pros: No passwords, secure, simple
  - Cons: Email dependency, slower signup

**Default Recommendation:** **B (Email + Social Login)** - Supabase Auth supports Google/Apple OAuth out of the box. Reduces signup friction.

**Action Required:**
- [ ] Configure Google OAuth in Supabase
- [ ] Configure Apple OAuth in Supabase (iOS users)
- [ ] Test signup flows with both email and social login
- [ ] Set up email templates for magic links (if used)

---

#### Decision T3: Offline Support Depth

**Question:** How deep should offline support be in MVP?

**Options:**
- **A: Minimal**
  - Show offline message, block all actions until online
  - Simplest implementation
- **B: Partial (Recommended)**
  - View cached data (today, history)
  - Draft logging for sync when online
  - Block API-dependent features (search, export)
- **C: Full**
  - Full offline logging with local nutrition database
  - Complex, requires local DB

**Default Recommendation:** **B (Partial)** - Good balance of UX vs. complexity.

**Action Required:**
- [ ] Implement IndexedDB schema for food_logs cache
- [ ] Implement IndexedDB schema for draft_logs
- [ ] Add offline detection (navigator.onLine events)
- [ ] Implement sync queue for offline actions
- [ ] Test offline → online sync flow

---

#### Decision T4: Voice Input Timing

**Question:** When to implement voice input?

**Options:**
- **A: MVP**
  - Pros: Faster logging, differentiator
  - Cons: Speech recognition API costs, complexity
- **B: v1.1 (Recommended)**
  - Pros: Launch faster, validate text input first
  - Cons: Delayed feature users may want
- **C: Never**
  - Pros: Simpler, lower costs
  - Cons: Missed UX improvement

**Default Recommendation:** **B (v1.1)** - Validate core text input flow first, add voice as enhancement.

**Action Required:**
- [ ] Research speech recognition APIs (Web Speech API, OpenAI Whisper)
- [ ] Estimate per-user cost for voice input
- [ ] Create mockup of voice input UI
- [ ] Plan v1.1 implementation if user demand high

---

#### Decision T5: Session Timeout Duration

**Question:** How long before auth session expires?

**Options:**
- **A: 1 Hour**
  - Pros: Security-focused
  - Cons: Frequent re-login annoyance
- **B: 24 Hours (Recommended)**
  - Pros: Balanced security/UX
  - Cons: Moderate security risk
- **C: 7 Days**
  - Pros: Best UX (rare re-login)
  - Cons: Higher security risk

**Default Recommendation:** **B (24 Hours)** with silent refresh mechanism (refresh tokens).

**Action Required:**
- [ ] Configure Supabase Auth session duration
- [ ] Implement silent refresh before expiry
- [ ] Add inactivity timeout (e.g., 7 days of no activity)
- [ ] Test session expired flow

---

### 8.2 Product Decisions (Required Before MVP)

#### Decision P1: Onboarding Depth

**Question:** How much data to collect during onboarding?

**Options:**
- **A: Minimal**
  - Only essential consents (privacy, terms)
  - Goals skip to defaults (2000 kcal)
- **B: Balanced (Recommended)**
  - Welcome → Goals (optional) → Preferences (auto-detected) → Consents → Optional consents
  - ~2-3 minutes, can skip goals
- **C: Comprehensive**
  - All above plus weight, height, activity level, macro breakdown
  - Richer data, but higher abandonment

**Default Recommendation:** **B (Balanced)** - Captures key preferences without friction.

**Action Required:**
- [ ] Finalize onboarding step order
- [ ] Write onboarding copy (welcome, goals, preferences)
- [ ] Design onboarding UI (wireframes or mockups)
- [ ] Test onboarding flow with 3-5 potential users

---

#### Decision P2: Calorie Goal Defaults

**Question:** What default calorie goal if user skips onboarding?

**Options:**
- **A: Fixed (2000 kcal)**
  - Pros: Simple, common default
  - Cons: Not personalized, may be too high/low
- **B: Based on Gender/Age (Estimated)**
  - Pros: More personalized
  - Cons: Requires gender/age data (more friction)
- **C: Ask Later**
  - Pros: Delay decision to first log
  - Cons: Adds friction to first log

**Default Recommendation:** **A (Fixed 2000 kcal)** - Simple, user can change later in settings.

**Action Required:**
- [ ] Confirm default calorie goal (2000 kcal)
- [ ] Add onboarding prompt: "You can change this anytime in settings"

---

#### Decision P3: Notification Frequency

**Question:** When to send push notification reminders?

**Options:**
- **A: Once Daily (Morning)**
  - Pros: Not annoying
  - Cons: Misses evening loggers
- **B: Twice Daily (Morning + Evening)**
  - Pros: Covers most users
  - Cons: More intrusive
- **C: User-Configurable (Recommended)**
  - Pros: User control, higher opt-in
  - Cons: More complex UI

**Default Recommendation:** **C (User-Configurable)** with default: 9:00 AM daily.

**Action Required:**
- [ ] Design notification settings UI
- [ ] Implement push notification scheduling (Supabase or external service)
- [ ] Set up email reminders (optional, opt-in)
- [ ] Test notification delivery on iOS/Android

---

#### Decision P4: Meal Type Categories

**Question:** What meal types to support?

**Options:**
- **A: Basic (Breakfast, Lunch, Dinner)**
  - Pros: Simple, covers most
- **B: Extended (Breakfast, Lunch, Dinner, Snack)**
  - Pros: More common use cases
- **C: Customizable (Basic + User-Defined)**
  - Pros: Flexible, power users
  - Cons: More complex UI

**Default Recommendation:** **B (Extended)** - Breakfast, Lunch, Dinner, Snack.

**Action Required:**
- [ ] Confirm meal type list
- [ ] Design meal type selector in log flow
- [ ] Implement meal type grouping in today/history views

---

#### Decision P5: Delete Account Recovery Window

**Question:** How long to keep deleted account data for recovery?

**Options:**
- **A: 7 Days**
  - Pros: Quick cleanup
  - Cons: Short recovery window
- **B: 30 Days (Recommended)**
  - Pros: Standard, reasonable
  - Cons: Longer data retention
- **C: Immediate (No Recovery)**
  - Pros: Complete privacy
  - Cons: User regret, support burden

**Default Recommendation:** **B (30 Days)** - Standard practice (PdfExtractorAi uses 30 days).

**Action Required:**
- [ ] Implement soft delete pattern (deleted_at timestamp)
- [ ] Set up cron job for permanent deletion after 30 days
- [ ] Document recovery process for support team
- [ ] Update privacy policy with retention period

---

### 8.3 Legal/GDPR Decisions (Required Before MVP)

#### Decision L1: Lawful Basis for Processing

**Question:** What GDPR lawful basis to declare for core data processing?

**Options:**
- **A: Contract (Service Performance)**
  - Rationale: User agrees to terms, food logging is core service
  - Most appropriate for core functionality
- **B: Legitimate Interests**
  - Rationale: Improve service, analytics
  - Appropriate for non-essential features
- **C: Consent**
  - Rationale: Explicit user opt-in
  - Required for marketing, analytics

**Default Recommendation:**
- Core data processing (food logs, profile): **A (Contract)**
- Analytics: **B (Legitimate Interests)** with opt-out
- Marketing: **C (Consent)** with opt-in

**Action Required:**
- [ ] Consult with legal expert to confirm lawful basis selection
- [ ] Document lawful basis matrix in privacy policy
- [ ] Update consent management to reflect lawful basis

---

#### Decision L2: DPIA (Data Protection Impact Assessment) Required?

**Question:** Is a DPIA required under GDPR Article 35?

**Criteria:**
- Systematic monitoring of users on a large scale? **No** (personal app, no public monitoring)
- Special category data (health, biometric)? **Unclear** (food logging may reveal health context)
- Large-scale processing of sensitive data? **No** (personal data only)

**Default Recommendation:** **Consult legal expert** - Food logging is health-adjacent and may require DPIA or legal confirmation.

**Action Required:**
- [ ] Schedule legal consultation on DPIA requirement
- [ ] If required: Prepare DPIA document (purpose, necessity, proportionality, risks, safeguards)
- [ ] If not required: Document rationale for exemption

---

#### Decision L3: Data Retention Periods

**Question:** How long to retain different data types?

**Options:**
- **Core User Data (Profile, Food Logs):**
  - Until account deleted (30-day recovery window)
- **Consent History:**
  - Indefinitely (legal requirement for compliance)
- **Audit Logs (Security Events):**
  - 1 year (security best practice)
- **Analytics Data:**
  - 2 years (standard for analytics)

**Default Recommendation:** Adopt above retention periods.

**Action Required:**
- [ ] Document retention periods in privacy policy
- [ ] Implement data deletion jobs for expired data
- [ ] Update GDPR export documentation

---

#### Decision L4: Third-Party Data Transfers

**Question:** Which third parties receive user data? (GDPR Article 28: Processors)

**Potential Processors:**
- **Supabase (Hosting, Auth, Database)**
  - Location: EU region (if configured)
  - Data: User profile, food logs, consent records
- **Vercel (Hosting)**
  - Location: Functions may run in US (requires configuration)
  - Data: Minimal (no user data stored)
- **Nutrition API (Edamam/FatSecret/etc.)**
  - Location: Depends on provider
  - Data: Food search queries (no PII typically)
- **Email Service (if sending reminders)**
  - Location: Depends on provider
  - Data: Email addresses

**Default Recommendation:** 
- Use EU-hosted Supabase region
- Configure Vercel functions for EU deployment
- Select EU-based nutrition provider or ensure GDPR-compliant transfer
- Document all processors in privacy policy

**Action Required:**
- [ ] Confirm Supabase EU region deployment
- [ ] Configure Vercel EU routing
- [ ] Research nutrition provider location and data transfer agreement
- [ ] Create processor register (Article 30 documentation)

---

### 8.4 Design/UX Decisions (Required Before MVP)

#### Decision D1: Design System Approach

**Question:** Use custom design or component library?

**Options:**
- **A: Custom Design**
  - Pros: Unique branding, full control
  - Cons: More development time
- **B: Component Library (shadcn/ui, Radix, etc.)**
  - Pros: Faster development, accessible out of box
  - Cons: Less unique, requires customization
- **C: Hybrid (Library + Custom)**
  - Pros: Balance of speed and uniqueness
  - Cons: More complex maintenance

**Default Recommendation:** **C (Hybrid)** - Use shadcn/ui or Radix for base components, customize for branding.

**Action Required:**
- [ ] Select component library (shadcn/ui recommended for Next.js)
- [ ] Define brand colors, typography, spacing tokens
- [ ] Customize components to match brand
- [ ] Create design system documentation

---

#### Decision D2: Color Scheme & Theme

**Question:** Primary brand color and theme support?

**Options:**
- **A: Single Theme (Light Only)**
  - Pros: Simpler
  - Cons: Poor for low-light use
- **B: Light + Dark Mode (Recommended)**
  - Pros: Modern, accessible, user preference
  - Cons: More design work
- **C: System Theme (Follows OS)**
  - Pros: No toggle, seamless
  - Cons: Less user control

**Default Recommendation:** **B (Light + Dark Mode)** with system default and manual toggle.

**Action Required:**
- [ ] Define primary brand color (e.g., green for health, blue for trust)
- [ ] Design light mode color palette
- [ ] Design dark mode color palette
- [ ] Test WCAG contrast ratios for both themes

---

#### Decision D3: Animation & Motion

**Question:** How much animation to include?

**Options:**
- **A: Minimal (No Animations)**
  - Pros: Fastest performance
  - Cons: Less polished
- **B: Purposeful (Recommended)**
  - Pros: Enhanced UX, delightful moments
  - Cons: More development time
- **C: Extensive**
  - Pros: Very polished
  - Cons: Overkill for simple app, performance impact

**Default Recommendation:** **B (Purposeful)** - Animate:
- Screen transitions (push, modal)
- Success states (checkmark animation)
- Loading states (skeleton, spinner)
- Respect "reduce motion" preference

**Action Required:**
- [ ] Define animation library (Framer Motion recommended)
- [ ] Create animation style guide (duration, easing)
- [ ] Implement "reduce motion" media query respect
- [ ] Test animations with screen readers (accessibility)

---

#### Decision D4: Typography Scale

**Question:** Font family and scale?

**Options:**
- **A: System Fonts (San Francisco, Inter)**
  - Pros: Native feel, fast load
  - Cons: Less unique
- **B: Google Fonts (Inter, Poppins, etc.)**
  - Pros: More control, modern look
  - Cons: Additional network request
- **C: Custom Font (Purchase/License)**
  - Pros: Unique branding
  - Cons: Cost, performance impact

**Default Recommendation:** **A (System Fonts)** - Inter or system-ui (San Francisco on iOS, Segoe on Windows).

**Action Required:**
- [ ] Confirm font selection (Inter recommended)
- [ ] Define typography scale (h1-h6, body, caption)
- [ ] Set up CSS variables for font sizes, weights, line heights
- [ ] Test readability across devices

---

### 8.5 Business Decisions (Required Before MVP)

#### Decision B1: Pricing Model

**Question:** How to monetize?

**Options:**
- **A: Freemium (Free Tier + Paid)**
  - Free: Basic logging (e.g., 10 logs/day)
  - Paid: Unlimited logs, analytics, macros
- **B: Free Trial → Subscription**
  - 7-day free trial, then monthly subscription
- **C: One-Time Purchase**
  - Pay once, own forever
  - Harder to sustain ongoing costs

**Default Recommendation:** **A (Freemium)** or **B (Free Trial)** - Need to validate with user interviews (what Amy learned from pricing uncertainty).

**Action Required:**
- [ ] Interview 10-20 potential users on willingness to pay
- [ ] Test pricing hypothesis with landing page pre-signups
- [ ] Define free vs. paid feature split
- [ ] Set pricing tiers ($4.99/month, $29.99/year suggested)

---

#### Decision B2: App Name & Branding

**Question:** What to name the app?

**Current Options:**
- **CalorieTracker** (Current working title)
- **Calory** (Short, memorable)
- **FoodLog** (Simple, descriptive)
- **Custom** (Brandable, memorable)

**Default Recommendation:** **Decide on name before public launch** - Domain availability, trademark check, App Store availability.

**Action Required:**
- [ ] Brainstorm 10+ name options
- [ ] Check domain availability (Namecheap, GoDaddy)
- [ ] Check App Store name availability
- [ ] Check trademark conflicts (USPTO, EUIPO)
- [ ] Select final name and register domain

---

## Appendix A: Fact vs. Assumption Summary

### Facts (Confirmed from Research)
- ✅ Web-first PWA (Next.js) is viable for MVP
- ✅ Mobile-first responsive design is required
- ✅ 4-tab navigation (Log, Today, History, Settings) works well
- ✅ Deterministic nutrition pipeline (parse → DB match → code math) is recommended over LLM-only
- ✅ GDPR compliance requires export/delete flows, consent management
- ✅ Partial offline support is feasible (IndexedDB, draft logging)
- ✅ Amy app reached $1000/month but had margin/API cost issues
- ✅ Users want fast food logging (<10 seconds)
- ✅ Simplicity beats feature bloat (Amy's differentiation)

### Assumptions (Need Validation)
- ⚠️ Users will pay $5-10/month for AI food logging
- ⚠️ Edamam API free tier is sufficient for first 3 months
- ⚠️ 2-3 minute onboarding doesn't cause high abandonment
- ⚠️ Social login (Google, Apple) reduces signup friction significantly
- ⚠️ Email/password authentication is still expected by users
- ⚠️ Partial offline support (view cached, draft sync) is good enough UX
- ⚠️ Voice input is v1.1, not MVP critical path
- ⚠️ Macro tracking is requested but not MVP-critical

### Inferences (Based on Research)
- 🔸 Food logging is health-adjacent → May require DPIA
- 🔸 Amy's margin problem likely due to API costs → Need cost monitoring
- 🔸 Simplicity is key differentiation vs. MyFitnessPal → Keep MVP narrow
- 🔸 iPhone users pay more than Android users → Consider iOS-first later

---

## Appendix B: References & Source Documents

### Source Documents Read (February 15, 2026)
1. `/Users/luis/Repos/CalorieTracker_Plan/README.md`
2. `/Users/luis/Repos/CalorieTracker_Plan/02_architecture_gdpr/15_frontend_navigation_flows.md`
3. `/Users/luis/Repos/CalorieTracker_Plan/02_architecture_gdpr/14_final_planning_brief_for_execution.md`
4. `/Users/luis/Repos/CalorieTracker_Plan/01_research_foundation/02_learnings_synthesis.md`
5. `/Users/luis/Repos/CalorieTracker_Plan/01_research_foundation/03_product_decisions_checklist.md`
6. `/Users/luis/Repos/CalorieTracker_Plan/01_research_foundation/04_risks_and_unknowns.md`
7. `/Users/luis/Repos/CalorieTracker_Plan/03_video_research/learnings/16_video_cpF_EtwB8tc_learnings.md`
8. `/Users/luis/Repos/CalorieTracker_Plan/03_video_research/learnings/26_video_6YFT7CwHvLk_learnings.md`
9. `/Users/luis/Repos/CalorieTracker_Plan/03_video_research/learnings/32_video_h6ffyfabfa8_learnings.md`

### Key Takeaways from Amy App Research
- Built and launched in 1 week (fast iteration)
- Reached $1000/month in 2 months (market exists)
- Margin problem likely due to API costs (need cost monitoring)
- Simplicity is key differentiation (vs. MyFitnessPal)
- Liquid glass UI was unique choice (design risk)

---

## Document Metadata

**Created:** 2026-02-15
**Author:** Subagent (agent:main:subagent:3821997e-2441-497a-b429-d5ad386efbe4)
**Purpose:** Implementation-ready product/navigation blueprint
**Status:** Planning Document - No Code
**Next Steps:** Luis to review and make decisions in Section 8 (Open Decisions List)
**Version:** 1.0

---

**End of Navigation Master Blueprint**
