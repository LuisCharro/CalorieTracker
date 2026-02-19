# Frontend Navigation Flows - CalorieTracker

**Date:** 2026-02-15
**Context:** Web-first PWA (Next.js), mobile-first responsive design
**Purpose:** Define client-side navigation architecture for MVP (planning-only mode, no implementation)

---

## Executive Summary

This document defines the client-side navigation architecture for CalorieTracker's v1 MVP. The design prioritizes **speed to log** (<10 seconds core flow), **GDPR compliance**, and **mobile-first PWA experience**. Navigation is deliberately simple with 4 primary sections, clear user state management, and comprehensive edge case handling.

**Core Navigation Principle:** Minimize taps between "I want to log food" and "Done."

---

## 1. User States

### 1.1 First-Time Visitor (Unauthenticated)

**Characteristics:**
- No session, no local storage data
- May have arrived via direct link, search, or referral
- Zero knowledge of app features

**Entry Points:**
- Landing page (`/`)
- Auth pages (`/signup`, `/login`)
- Any public marketing page

**Allowed Navigation:**
- Landing page content
- Auth flows (signup, login, password reset)
- Public legal pages (privacy policy, terms of service)
- Cannot access protected routes (redirected to login with redirect param)

**Storage:**
- Session: None
- Local: May store `referral_source` for analytics attribution
- Cookies: Essential only (auth session after signup)

---

### 1.2 Signed-Up, Not Onboarded

**Characteristics:**
- Has valid auth session
- Account exists in database
- Has not completed onboarding (onboarding_complete flag = false)
- No goals, preferences, or consents set

**Entry Points:**
- After successful signup (automatic redirect)
- Returning user who abandoned onboarding

**Allowed Navigation:**
- Onboarding flow only
- Cannot access main app (redirected to onboarding)
- Can logout and return to landing page

**Storage:**
- Session: Auth token, user profile
- Local: Onboarding progress (step index, draft answers)

**Termination:**
- Completes onboarding → transitions to Active User
- Logout → returns to First-Time Visitor
- Account delete → terminates session

---

### 1.3 Active User (Fully Onboarded)

**Characteristics:**
- Has valid auth session
- Completed onboarding (onboarding_complete flag = true)
- Has goals, preferences set
- Consent records exist

**Entry Points:**
- After onboarding completion
- Returning login with existing session

**Allowed Navigation:**
- All protected routes (tabs, settings, profile)
- Cannot access onboarding (skipped unless explicitly reset)
- Account settings (GDPR rights, preferences, consents)

**Storage:**
- Session: Auth token, user profile
- Local: App preferences (theme, notifications, last logged meal)
- IndexedDB: Offline food log cache (for PWA offline support)

**Sub-States:**
- **Daily Active User:** Logged food today, engaged
- **Occasional User:** Has account but logs infrequently (>7 days inactive)
- **Power User:** Logs 3+ times daily, uses advanced features

---

### 1.4 Returning Inactive User

**Characteristics:**
- Has valid auth session (or can restore via login)
- Completed onboarding in the past
- No food logs in last X days (default: 30 days)
- May have outdated goals or preferences

**Entry Points:**
- Login after extended absence
- Returning via deep link or notification

**Allowed Navigation:**
- Full access to app
- Optional re-engagement prompts (not blocking)
- May show "welcome back" state with options to update goals

**Storage:**
- Session: Auth token, user profile
- Local: Previous app state (may be stale)

**Re-Engagement Triggers:**
- First log after 30+ days: Show "Welcome back! Update your goals?" modal (non-blocking)
- First log after 90+ days: Show "Let's set fresh goals" (optional re-onboarding)

---

## 2. Navigation Map

### 2.1 Top-Level Structure

**Primary Navigation (Bottom Tab Bar - Mobile / Sidebar - Desktop):**

```
┌─────────────────────────────────────────────────────────┐
│  App Shell                                               │
│  ├─ Header (dynamic per route)                         │
│  ├─ Main Content Area                                   │
│  │   └─ Route-specific content                          │
│  ├─ Bottom Navigation (mobile) / Sidebar (desktop)     │
│  └─ Global Modals & Overlays                           │
└─────────────────────────────────────────────────────────┘
```

**4 Primary Tabs:**

| Tab | Route | Icon | Purpose | Mobile | Desktop |
|-----|-------|------|---------|--------|---------|
| **Log** | `/log` | Plus/Camera | Primary food input action | Bottom nav, prominent | Sidebar, prominent |
| **Today** | `/today` | Calendar/Dashboard | Daily totals, progress | Bottom nav | Sidebar |
| **History** | `/history` | List/Clock | Past logs, trends | Bottom nav | Sidebar |
| **Settings** | `/settings` | Gear/Profile | Account, preferences, GDPR | Bottom nav | Sidebar |

**Secondary Navigation (Accessible from Settings):**

- Profile & Account (`/settings/profile`)
- Goals & Targets (`/settings/goals`)
- Notifications (`/settings/notifications`)
- Consents & Privacy (`/settings/privacy`)
- GDPR Rights (`/settings/gdpr`)
- Help & Support (`/settings/help`)
- About (`/settings/about`)

**Public Routes (No Auth Required):**

- Landing page (`/`)
- Signup (`/signup`)
- Login (`/login`)
- Password reset (`/reset-password`, `/reset-password/[token]`)
- Privacy policy (`/privacy`)
- Terms of service (`/terms`)
- Legal docs (`/legal/*`)

---

### 2.2 Route Hierarchy

```
/                           (Landing - public)
│
├─ /signup                   (Auth flow - public)
│   └─ /signup/verify-email   (Email verification step)
│
├─ /login                     (Auth flow - public)
│   └─ /login/forgot-password (Password reset request)
│
├─ /reset-password            (Public)
│   └─ /reset-password/[token] (Reset with token)
│
├─ /onboarding               (Protected - incomplete users only)
│   ├─ /onboarding/welcome
│   ├─ /onboarding/goals
│   ├─ /onboarding/preferences
│   ├─ /onboarding/consents
│   └─ /onboarding/complete
│
├─ /log                      (Protected - main tab)
│   ├─ /log                   (Main logging interface)
│   ├─ /log/search            (Food search/results)
│   └─ /log/confirm           (Confirmation for low-confidence matches)
│
├─ /today                    (Protected - main tab)
│   ├─ /today                 (Daily dashboard)
│   └─ /today/meal/[id]       (Meal detail view)
│
├─ /history                  (Protected - main tab)
│   ├─ /history               (Date-based history)
│   ├─ /history/weekly       (Weekly view)
│   ├─ /history/monthly      (Monthly view)
│   └─ /history/entry/[id]   (Single entry edit)
│
├─ /settings                 (Protected - main tab)
│   ├─ /settings             (Settings home)
│   ├─ /settings/profile     (Name, email, avatar)
│   ├─ /settings/goals       (Calorie goals, macros)
│   ├─ /settings/preferences (Units, theme, language)
│   ├─ /settings/notifications (Push/email reminders)
│   ├─ /settings/privacy     (Consent management)
│   ├─ /settings/gdpr        (Export, delete, rights)
│   ├─ /settings/help        (FAQ, support)
│   └─ /settings/about       (App version, legal links)
│
├─ /privacy                  (Public - legal)
├─ /terms                    (Public - legal)
└─ /legal/*                  (Public - legal docs)
```

---

### 2.3 Navigation Transitions

**Transition Types:**

1. **Tab Navigation** (Primary):
   - Mobile: Bottom tab bar tap
   - Desktop: Sidebar click
   - Behavior: Instant, preserves scroll position, no animation

2. **Push Navigation** (Drill-down):
   - Example: `/today` → `/today/meal/[id]`
   - Mobile: Slide in from right (iOS-style)
   - Desktop: Same-page content update or modal
   - Behavior: Animated, adds to history stack

3. **Modal Navigation** (Overlays):
   - Example: Quick settings, confirmations, alerts
   - Mobile: Bottom sheet or centered modal
   - Desktop: Centered modal
   - Behavior: Dismissible with backdrop tap (unless critical action)

4. **Replace Navigation** (Auth flows):
   - Example: `/signup` → `/onboarding`
   - Behavior: Replaces history entry (no back to signup)

5. **Redirect Navigation** (State-based):
   - Example: Protected route accessed while unauthenticated
   - Behavior: Automatic redirect to `/login?redirect=/target`

---

### 2.4 Navigation State Management

**Client-Side State (Next.js App Router):**

- `usePathname()`: Current route
- `useSearchParams()`: Query parameters (redirect, filters, etc.)
- `useRouter()`: Programmatic navigation
- Context APIs: User state, app preferences

**Persistent State (LocalStorage/IndexedDB):**

```typescript
// LocalStorage (key-value pairs)
{
  "app_theme": "light|dark|system",
  "app_language": "en|de|fr",
  "notification_preferences": {...},
  "onboarding_step": 3,  // Only during onboarding
  "last_active_date": "2026-02-15",
  "meal_suggestions_cache": [...]
}

// IndexedDB (structured data, offline support)
{
  "food_logs_offline": [...],        // Cached for PWA offline
  "food_database_cache": [...],      // Recent searches, nutrition data
  "draft_logs": [...]                // In-progress entries
}
```

**Server-Side State (Supabase Auth + RLS):**

```typescript
// User profile (database)
{
  id: string,
  email: string,
  onboarding_complete: boolean,
  daily_calorie_goal: number,
  last_login_at: timestamp
}

// Consent records (database)
{
  user_id: string,
  consent_type: string,
  consent_given: boolean,
  timestamp: timestamp
}
```

---

## 3. Onboarding Flow

### 3.1 Onboarding Entry Points

**Triggers:**
1. After successful signup (automatic)
2. Returning user with `onboarding_complete = false`
3. Explicit restart from settings (optional feature)

**Guardrails:**
- Only accessible when `onboarding_complete = false`
- Cannot access protected routes (redirected back to onboarding)
- Can logout at any step (returns to landing page)

---

### 3.2 Onboarding Steps Overview

**Total Steps:** 5-6 steps (can be skipped or revisited later)
**Estimated Time:** 2-3 minutes (fast, optional)

```
┌─────────────────────────────────────────────────────────┐
│  ONBOARDING FLOW                                         │
├─────────────────────────────────────────────────────────┤
│  1. Welcome          (What the app does, value prop)    │
│  2. Goals            (Daily calorie target, optional)   │
│  3. Preferences      (Units, timezone, language)        │
│  4. Consent Checkpoint (GDPR: privacy policy, terms)    │
│  5. Optional Consent (Analytics, marketing - opt-in)    │
│  6. Complete         (Success state, redirect to /log)  │
└─────────────────────────────────────────────────────────┘
```

---

### 3.3 Step 1: Welcome (`/onboarding/welcome`)

**Purpose:** Set expectations, explain value proposition

**Content:**
- Hero illustration or animation
- "Track your food in seconds, not minutes"
- 3 key benefits (bullet points):
  - ✅ AI-powered food lookup
  - ✅ Daily totals & progress
  - ✅ Your data stays yours (GDPR-compliant)

**Actions:**
- Primary: "Get Started" → Next step
- Secondary: "Skip onboarding" → Direct to `/log` with defaults

**Data Captured:** None

**Skip Behavior:**
- Sets default values for goals/preferences
- Still requires consent checkpoint (cannot skip legal acceptance)
- User can return to onboarding later via settings

---

### 3.4 Step 2: Goals (`/onboarding/goals`)

**Purpose:** Set initial calorie goals (can be edited later)

**Content:**
- Question: "What's your daily calorie goal?"
- Input: Number input with preset options
- Presets (buttons): 1500, 2000, 2500, 3000 kcal
- Custom option: Free-form input
- Helper text: "You can change this anytime in settings"

**Actions:**
- Primary: "Next" → Save goals, move to preferences
- Secondary: "Skip" → Use default (2000 kcal), move to preferences
- "Back" → Return to welcome

**Data Captured:**
```typescript
{
  daily_calorie_goal: number,  // Default: 2000
  macros_enabled: boolean      // Default: false (MVP)
}
```

**Validation:**
- Range: 1000-6000 kcal (prevent extreme values)
- Optional field (can skip)

---

### 3.5 Step 3: Preferences (`/onboarding/preferences`)

**Purpose:** Capture basic preferences for better UX

**Content:**
- **Units:** Metric (kcal, kg) vs Imperial (kcal, lbs)
- **Timezone:** Auto-detected, can override
- **Language:** Auto-detected from browser, dropdown to change
- **Notifications:** Ask permission for push (defer if denied)

**Actions:**
- Primary: "Next" → Save preferences, move to consent checkpoint
- Secondary: "Skip" → Use auto-detected values, move to consent checkpoint
- "Back" → Return to goals

**Data Captured:**
```typescript
{
  units: "metric" | "imperial",  // Default: metric (EU-first)
  timezone: string,              // Default: auto-detect
  language: string,              // Default: browser language
  push_notifications_enabled: boolean  // Default: false (ask later)
}
```

**Validation:**
- All fields optional (auto-detected defaults)

---

### 3.6 Step 4: Consent Checkpoint (`/onboarding/consents`)

**Purpose:** GDPR compliance - essential legal acceptance

**Critical Step:** Cannot skip. Must explicitly accept to proceed.

**Content:**
- Privacy policy summary (card with expandable details)
- Terms of service summary (card with expandable details)
- Checkbox: "I have read and agree to the Privacy Policy"
- Checkbox: "I have read and agree to the Terms of Service"
- Links: Full documents in modal or new tab

**Actions:**
- Primary: "I Agree" → (Only enabled when both checkboxes checked) → Move to optional consent
- "Back" → Return to preferences
- "Cancel/Logout" → Logout, return to landing page

**Data Captured:**
```typescript
{
  privacy_policy_accepted: boolean,  // Required: true
  terms_accepted: boolean,          // Required: true
  consent_timestamp: timestamp
}
```

**Validation:**
- Both checkboxes must be checked to enable "I Agree"
- Both are required (GDPR requirement)

**Consent Logging:**
```typescript
// Stored in consent_history table
{
  user_id: string,
  consent_type: "privacy_policy" | "terms_of_service",
  consent_given: true,
  timestamp: timestamp,
  metadata: {
    source: "onboarding",
    version: "1.0"
  }
}
```

---

### 3.7 Step 5: Optional Consents (`/onboarding/consents-optional`)

**Purpose:** Collect non-essential consents (opt-in, can be skipped)

**Content:**
- **Analytics:** "Help us improve by sharing anonymous usage data"
  - Checkbox: Opt-in (not pre-checked)
  - Explain: What's collected, how it's used, data retention
- **Marketing:** "Receive tips, updates, and product news"
  - Checkbox: Opt-in (not pre-checked)
  - Explain: Email frequency, unsubscribe anytime
- **Note:** Both optional, can be toggled later in settings

**Actions:**
- Primary: "Complete Onboarding" → Save consents, mark onboarding complete
- "Back" → Return to essential consents (can't skip that step)

**Data Captured:**
```typescript
{
  analytics_consent: boolean,    // Default: false
  marketing_consent: boolean     // Default: false
}
```

**Consent Logging:**
```typescript
// Stored in consent_history table
{
  user_id: string,
  consent_type: "analytics" | "marketing",
  consent_given: boolean,  // Based on user choice
  timestamp: timestamp,
  metadata: {
    source: "onboarding",
    version: "1.0"
  }
}
```

**Skip Behavior:**
- User can leave both unchecked (defaults to false)
- No blocking required

---

### 3.8 Step 6: Complete (`/onboarding/complete`)

**Purpose:** Success state, transition to main app

**Content:**
- Success animation or illustration
- Message: "You're all set!"
- CTA: "Start Logging" → Redirect to `/log`
- Helper text: "Your goals and preferences are saved. Change them anytime in Settings."

**Actions:**
- Primary: "Start Logging" → Redirect to `/log`

**Data Updates:**
```typescript
// Update user record
{
  onboarding_complete: true,
  onboarding_completed_at: timestamp
}
```

**Transition:**
- Sets `onboarding_complete = true` in database
- Redirects to `/log` (primary tab)
- Shows brief welcome toast on first main app load

---

### 3.9 Onboarding Progress Tracking

**State Management:**

```typescript
// LocalStorage (during onboarding only)
{
  "onboarding_step": number,        // Current step index (0-5)
  "onboarding_data": {              // Draft responses
    goals: { daily_calorie_goal: 2000 },
    preferences: { units: "metric", language: "en" },
    consents_essential: { privacy: true, terms: true },
    consents_optional: { analytics: false, marketing: false }
  }
}
```

**Abandonment Recovery:**
- If user closes app mid-onboarding:
  - State persists in localStorage
  - On return, resume from last step
  - If abandoned >7 days: Show "Continue where you left off?" modal

**Reset Option:**
- Settings → "Re-run Onboarding"
- Clears `onboarding_complete` flag
- Resets to step 1 (preserves existing data as defaults)

---

### 3.10 GDPR Considerations in Onboarding

**Essential vs Optional Consents:**

| Consent Type | Essential | Can Skip | GDPR Basis |
|--------------|-----------|----------|------------|
| Privacy Policy | ✅ Yes | ❌ No | Contract (service requires) |
| Terms of Service | ✅ Yes | ❌ No | Contract (service requires) |
| Analytics | ❌ No | ✅ Yes | Legitimate Interests (opt-out) |
| Marketing | ❌ No | ✅ Yes | Consent (opt-in) |
| Core data processing (food logs) | ✅ Yes | ❌ No | Contract (service requires) |

**Consent UI Requirements:**
- ✅ Not pre-checked (all optional checkboxes)
- ✅ Clear, plain language (no legalese)
- ✅ Separate for each purpose (granular)
- ✅ Easy to withdraw (settings page)
- ✅ Consent history tracked (immutable audit trail)

**Withdrawal Flow:**
- Settings → Privacy & Consents
- Toggle any consent on/off
- Immediate effect
- Logged to `consent_history` table

---

## 4. Daily Flow

### 4.1 Core Daily Use Case

**Primary Flow:** Log Food → See Progress → Done

**Target Time:** <10 seconds from app open to "Done"

```
┌─────────────────────────────────────────────────────────┐
│  DAILY FLOW                                              │
├─────────────────────────────────────────────────────────┤
│  1. Open app (or tap notification)                       │
│  2. Log food (text/voice)                                │
│  3. Confirm/calibrate (if low confidence)               │
│  4. See today's totals                                   │
│  5. Done (return to previous context)                   │
└─────────────────────────────────────────────────────────┘
```

---

### 4.2 Log Flow (`/log`)

**Purpose:** Primary food entry interface

**Entry Points:**
- Bottom tab "Log" (primary)
- Deep link from notification
- Quick action on home screen (if PWA installed)

**UI Components:**

1. **Food Input Area (Top):**
   - Text input field (prominent, auto-focus)
   - Voice input button (microphone icon)
   - Placeholder: "e.g., chicken breast 200g with rice"

2. **Quick Suggestions (Below Input):**
   - Recent foods (last 5 logged)
   - Common foods (breakfast, lunch, dinner)
   - Swipe horizontally for more

3. **Search Results (Dynamic):**
   - Appears as user types (debounced, 300ms)
   - Shows food name, calories per serving
   - Tap to select, shows serving size selector

4. **Confirmation (If Low Confidence):**
   - Modal/sheet: "Did you mean X?"
   - User confirms or corrects

5. **Success Feedback:**
   - Brief checkmark animation
   - "Logged: [food] - [calories] kcal" toast
   - Returns to input ready for next entry

**Actions:**
- Primary: Type food → Search → Select → Confirm → Log
- Secondary: Voice input → Transcribe → Same flow
- Tertiary: Scan barcode (future feature, not MVP)

**Data Flow:**
```typescript
// Step 1: User input
Input: "chicken breast 150g with rice"

// Step 2: Local parsing (LLM)
Parsed: {
  food_items: [
    { name: "chicken breast", quantity: 150, unit: "g" },
    { name: "rice", quantity: null, unit: null }  // Ambiguous
  ]
}

// Step 3: Database/API lookup
Matched: [
  { name: "chicken breast, cooked", calories_per_100g: 165 },
  { name: "white rice, cooked", calories_per_100g: 130 }
]

// Step 4: Calculation
Totals: {
  chicken: 150g × 1.65 = 248 kcal,
  rice: 100g × 1.30 = 130 kcal  // Default portion if unspecified
}

// Step 5: User confirmation (if low confidence)
Show: "chicken breast 150g (248 kcal) + rice 100g (130 kcal) = 378 kcal?"
User: Confirm

// Step 6: Persist
Log entry saved to food_logs table
```

---

### 4.3 Today Dashboard (`/today`)

**Purpose:** View daily progress, totals, and recent logs

**Entry Points:**
- Bottom tab "Today"
- Redirect from `/log` after successful entry
- Deep link from notification

**UI Components:**

1. **Daily Total Card (Top):**
   - Large calorie count: "1,250 / 2,000 kcal"
   - Progress bar: Visual indicator (62.5%)
   - Remaining: "750 kcal left today"
   - Color-coded: Green (on track), Yellow (close), Red (over)

2. **Meal Sections (Scrollable):**
   - Breakfast, Lunch, Dinner, Snacks
   - Each section: Expand/collapse
   - Show total per meal
   - Tap meal to view/edit entries

3. **Quick Actions (Floating or Bottom):**
   - "Add Food" button (redirects to `/log`)
   - "View History" (redirects to `/history`)

4. **Streak/Gamification (Optional, Post-MVP):**
   - "5-day streak! Keep it up!"
   - Badge or visual indicator

**Actions:**
- Tap meal → View meal detail (`/today/meal/[id]`)
- Tap "Add Food" → Go to `/log`
- Swipe entry → Edit/Delete
- Pull to refresh → Reload data

---

### 4.4 History & Trends (`/history`)

**Purpose:** View past logs, identify patterns

**Entry Points:**
- Bottom tab "History"

**UI Components:**

1. **View Toggle (Top):**
   - Tabs: Daily, Weekly, Monthly
   - Default: Daily view

2. **Date Picker (Top-right):**
   - Calendar icon → Open date picker modal
   - Jump to specific date

3. **Daily View:**
   - List of dates with totals
   - Tap date → Show entries for that day
   - Empty states: "No logs on [date]"

4. **Weekly/Monthly View (Future, Post-MVP):**
   - Bar chart showing daily totals
   - Average calories
   - Trend line

5. **Search/Filter (Optional):**
   - Search specific food
   - Filter by meal type

**Actions:**
- Tap date → View entries
- Tap entry → Edit entry (`/history/entry/[id]`)
- Swipe date → Quick delete (with confirmation)

---

### 4.5 Edit Entry Flow (`/history/entry/[id]`)

**Purpose:** Correct or delete past food log entries

**Entry Points:**
- From history detail
- From today dashboard (same-day entries)

**UI Components:**

1. **Entry Display:**
   - Food name (editable)
   - Quantity (editable number input)
   - Calories (auto-calculated or editable)
   - Timestamp (editable: date/time picker)
   - Meal type (dropdown: Breakfast, Lunch, Dinner, Snack)

2. **Actions:**
   - Primary: "Save Changes"
   - Secondary: "Delete Entry" (red, destructive)
   - Tertiary: "Cancel"

**Validation:**
- Quantity > 0
- Calories > 0 (if manual override)
- Valid date (not in future)

**Audit Logging:**
```typescript
// When editing/deleting entries, log to processing_activities
{
  user_id: string,
  action: "edit_entry" | "delete_entry",
  entry_id: string,
  old_values: {...},  // Before edit
  new_values: {...},  // After edit
  timestamp: timestamp
}
```

---

### 4.6 Correction Flow

**Purpose:** Fix mistakes (wrong food selected, typo, duplicate entry)

**Scenarios:**

1. **Wrong Food Selected:**
   - User: "Oops, I meant 'chicken thigh' not 'chicken breast'"
   - Flow: History → Tap entry → Edit → Change food → Save

2. **Wrong Quantity:**
   - User: "I logged 200g but actually ate 150g"
   - Flow: History → Tap entry → Edit → Change quantity → Save

3. **Duplicate Entry:**
   - User: "Accidentally logged twice"
   - Flow: History → Swipe entry → Delete → Confirm

4. **Logged Wrong Date:**
   - User: "Logged yesterday's lunch under today"
   - Flow: History → Tap entry → Edit → Change date → Save

**UX Considerations:**
- Make edit flow quick (<30 seconds)
- Preserving context (user returns to where they were)
- Clear confirmation for destructive actions (delete)

---

### 4.7 Reminders & Notifications

**Purpose:** Encourage daily logging habit

**Trigger Types:**

1. **Push Notifications (Requires Permission):**
   - Morning reminder: "Log your breakfast"
   - Evening reminder: "Log your dinner"
   - Missed day: "Haven't logged today yet. How are you doing?"

2. **In-App Reminders (No Permission Required):**
   - Badge on "Today" tab showing incomplete day
   - Banner on dashboard: "You're 500 kcal under goal. Log more?"

3. **Email Reminders (Opt-in):**
   - Weekly summary: "Here's your week at a glance"
   - Streak notifications: "7-day streak! Keep going!"

**Notification Flow:**
```
┌─────────────────────────────────────────────────────────┐
│  NOTIFICATION FLOW                                       │
├─────────────────────────────────────────────────────────┤
│  1. Schedule: 9:00 AM daily (configurable)              │
│  2. Check: Has user logged food today?                  │
│  3. If no: Send push notification                        │
│  4. User taps: Open app to `/log` tab                    │
│  5. User logs: Mark reminder as delivered                │
└─────────────────────────────────────────────────────────┘
```

**Settings:**
- Settings → Notifications → Toggle on/off
- Choose reminder times
- Choose delivery method (push, email, in-app)

**GDPR Compliance:**
- Push notifications: Requires explicit consent
- Email reminders: Requires explicit consent
- In-app reminders: Can be default (legitimate interests for core functionality)

---

## 5. Edge Flows

### 5.1 Empty States

**Scenario:** User visits page with no data yet

**Empty State Types:**

1. **No Food Logs Today (`/today`):**
   - Illustration: Empty plate or calendar
   - Message: "You haven't logged any food today"
   - CTA: "Log your first meal" → Redirect to `/log`

2. **No History (`/history`):**
   - Illustration: Empty list or timeline
   - Message: "No food logs yet. Start tracking to see your history"
   - CTA: "Log food now" → Redirect to `/log`

3. **No Search Results (`/log/search`):**
   - Illustration: Magnifying glass with question mark
   - Message: "We couldn't find a match for '[query]'"
   - CTAs:
     - "Try a different search term"
     - "Log manually" → Open manual entry form
     - "Add to custom foods" (future feature)

4. **No Goals Set (`/settings/goals`):**
   - Message: "No calorie goals set"
   - CTA: "Set a goal" → Open goal setting modal

5. **Offline with No Cache:**
   - Illustration: Cloud with offline icon
   - Message: "You're offline. No cached data available."
   - CTA: "Connect to internet to continue" (disabled until online)

**Empty State UX Principles:**
- ✅ Clear messaging (why empty?)
- ✅ Helpful CTAs (what to do next?)
- ✅ Visual consistency (same illustration style)
- ✅ Encouraging tone (not scolding)

---

### 5.2 Offline / Poor Network

**Scenario:** User has no internet connection or very slow network

**Detection:**
```typescript
// Network state detection
navigator.onLine  // Boolean: online/offline status
window.addEventListener('online', ...)
window.addEventListener('offline', ...)
```

**Offline Behavior by Feature:**

| Feature | Offline Behavior |
|---------|------------------|
| **Auth** | ❌ Cannot login/signup (redirect to landing with offline message) |
| **View Today** | ✅ Can view cached today's data (IndexedDB) |
| **View History** | ✅ Can view cached history (last 7-30 days) |
| **Log Food** | 🟡 Limited: Can type, save to draft, sync when online |
| **Search Food** | ❌ Requires API lookup (show offline message) |
| **Edit Entry** | ✅ Can edit cached entries, sync when online |
| **Settings** | ✅ Can view, changes saved locally, sync when online |
| **Export/Delete** | ❌ Requires server action (show offline message) |

**Offline UI Patterns:**

1. **Offline Banner (Top of screen):**
   - "You're offline. Changes will sync when you reconnect."
   - Dismissible but reappears if action fails

2. **Queue Indicator (Bottom-right):**
   - Badge showing number of pending sync actions
   - Tap to view queue

3. **Action Blocking:**
   - Disable buttons that require network
   - Show tooltip: "Requires internet connection"
   - Example: "Export Data" button disabled offline

4. **Draft Saving:**
   - When user tries to log food offline:
     - Save to `draft_logs` in IndexedDB
     - Show "Saved to drafts. Will sync when online."
     - Sync on next connection

5. **Conflict Resolution (If Multiple Devices):**
   - If same entry edited offline on 2 devices:
     - Show conflict modal: "Which version to keep?"
     - Options: "Keep local changes", "Keep server version", "Merge"

**Sync Flow:**
```
┌─────────────────────────────────────────────────────────┐
│  OFFLINE SYNC FLOW                                       │
├─────────────────────────────────────────────────────────┤
│  1. User goes offline                                   │
│  2. Actions saved locally (IndexedDB)                  │
│  3. User goes online                                   │
│  4. Auto-detect and sync queued actions                │
│  5. Show progress: "Syncing 3 changes..."              │
│  6. On success: Show "All changes synced" toast        │
│  7. On error: Show "Sync failed. Tap to retry"         │
└─────────────────────────────────────────────────────────┘
```

---

### 5.3 Error States

**Error Categories:**

1. **Network Errors:**
   - Timeout: "Request timed out. Please try again."
   - Server down: "Server unavailable. We're working on it."
   - Connection lost: "Connection lost. Check your internet."

2. **Validation Errors:**
   - Invalid input: "Please enter a valid calorie value (1000-6000)"
   - Missing required: "This field is required"
   - Format error: "Email address is invalid"

3. **Auth Errors:**
   - Invalid credentials: "Incorrect email or password"
   - Session expired: "Your session expired. Please login again."
   - Email not verified: "Please verify your email before continuing"

4. **API Errors:**
   - Rate limit: "Too many requests. Please wait a moment."
   - Food not found: "We couldn't find a match. Try logging manually."
   - API quota exceeded: "Service temporarily unavailable"

5. **Database Errors:**
   - Save failed: "Failed to save. Please try again."
   - Delete failed: "Failed to delete. Please try again."

**Error UI Patterns:**

1. **Toast Notifications (Transient):**
   - For non-critical errors (network timeout, validation)
   - Auto-dismiss after 3-5 seconds
   - Can tap to dismiss manually

2. **Modal/Sheet (Blocking):**
   - For critical errors (auth required, server down)
   - Requires user action to dismiss
   - May offer retry button

3. **Inline Errors (Form Fields):**
   - For validation errors
   - Red text below input field
   - Disappears when user corrects input

4. **Full-Screen Error Page (Fatal):**
   - For app crashes, critical failures
   - Shows error code (for support)
   - "Refresh" button to reload
   - "Contact Support" link

**Error Recovery Actions:**

```typescript
// Common error recovery patterns
{
  "retry": "Try Again",              // Retry the failed action
  "refresh": "Refresh Page",         // Reload current page
  "login": "Login Again",            // Re-authenticate
  "contact": "Contact Support",      // Open support/help
  "cancel": "Cancel",                // Dismiss and return
  "manual": "Log Manually",          // Alternative action (e.g., if API fails)
  "offline": "Save for Later"        // Save draft for later sync
}
```

**Logging Errors:**

```typescript
// Client-side error logging (Vercel Analytics + custom)
{
  error_code: string,              // e.g., "NETWORK_TIMEOUT"
  error_message: string,           // Human-readable
  route: string,                   // Where error occurred
  timestamp: timestamp,
  user_id: string,                 // If authenticated
  metadata: {
    browser: string,
    device: string,
    network_type: string
  }
}
```

---

### 5.4 Account Export (Right to Access / Portability)

**Purpose:** GDPR Article 15 (Right to Access) and Article 20 (Right to Portability)

**Entry Points:**
- Settings → GDPR Rights → Export Data
- Deep link (if support provides)

**UI Flow:**

1. **Export Request Page (`/settings/gdpr/export`):**

   **Content:**
   - Description: "Download all your data in JSON or CSV format"
   - Format options: Radio buttons (JSON, CSV, Both)
   - Include options: Checkboxes
     - Profile data (email, name, preferences)
     - Food logs (all entries)
     - Goals and targets
     - Consent history
   - Warning: "This may take a few moments to prepare"

   **Actions:**
   - Primary: "Generate Export"
   - Secondary: "Cancel"

2. **Processing State (While Generating):**
   - Show loading spinner
   - Message: "Preparing your data export..."
   - Estimated time: "This usually takes less than 30 seconds"

3. **Download Ready (Success):**
   - Success animation
   - Message: "Your data export is ready"
   - Download buttons:
     - "Download JSON"
     - "Download CSV"
     - "Download Both (ZIP)"
   - Note: "This link expires in 7 days"

   **Security:**
   - Download via signed URL (Supabase Storage)
   - Token-based access (expires after 7 days)
   - One-time use (link invalidates after download)

4. **Error State:**
   - Message: "Failed to generate export"
   - Action: "Try Again"

**Data Structure (JSON Export):**
```json
{
  "export_date": "2026-02-15T16:46:00Z",
  "user_id": "uuid-here",
  "format_version": "1.0",
  "user_profile": {
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2026-01-01T00:00:00Z",
    "preferences": {...}
  },
  "food_logs": [
    {
      "id": "log-uuid",
      "food_name": "chicken breast",
      "quantity": 150,
      "unit": "g",
      "calories": 248,
      "logged_at": "2026-02-15T12:00:00Z"
    }
  ],
  "goals": {
    "daily_calorie_goal": 2000,
    "last_updated": "2026-01-01T00:00:00Z"
  },
  "consent_history": [
    {
      "consent_type": "analytics",
      "consent_given": true,
      "timestamp": "2026-01-01T00:00:00Z"
    }
  ]
}
```

**Audit Logging:**
```typescript
// Log export request to gdpr_requests table
{
  user_id: string,
  request_type: "export",
  format: "json" | "csv" | "both",
  requested_at: timestamp,
  completed_at: timestamp,
  file_url: string,  // Signed storage URL
  expires_at: timestamp
}
```

---

### 5.5 Account Delete (Right to Erasure)

**Purpose:** GDPR Article 17 (Right to Erasure / Right to be Forgotten)

**Entry Points:**
- Settings → GDPR Rights → Delete Account

**UI Flow:**

1. **Delete Request Page (`/settings/gdpr/delete`):**

   **Content:**
   - ⚠️ Warning banner (red/orange): "This action cannot be undone"
   - Explanation: "All your data will be permanently deleted, including:"
     - Food logs and history
     - Goals and preferences
     - Consent records
     - Account information
   - Exclusions: "We will keep anonymized audit logs for security purposes (non-recoverable)"
   - Recovery option: "You can recover your account within 30 days by contacting support" (optional, check legal)

   **Confirmation:**
   - Checkbox: "I understand that my data will be permanently deleted"
   - Text input: "Type DELETE to confirm" (prevent accidental deletion)

   **Actions:**
   - Primary: "Delete My Account" (disabled until checkbox + text input)
   - Secondary: "Cancel"

2. **Processing State:**
   - Show loading spinner
   - Message: "Deleting your account and data..."
   - Note: "This may take a few moments"

3. **Deletion Complete:**
   - Success animation
   - Message: "Your account has been deleted"
   - Redirect to `/` (landing page) after 3 seconds
   - Show: "Thank you for using CalorieTracker"

4. **Error State:**
   - Message: "Failed to delete account"
   - Action: "Try Again" or "Contact Support"

**Deletion Process (Backend):**
```typescript
// 30-day soft delete pattern (like PdfExtractorAi)
// Step 1: Mark user as deleted (immediate)
UPDATE users SET deleted_at = NOW(), status = 'deleted' WHERE id = ?

// Step 2: Log deletion request
INSERT INTO gdpr_requests (user_id, request_type, requested_at) VALUES (?, 'delete', NOW())

// Step 3: Schedule hard delete (cron job, 30 days later)
// When cron runs:
// - Permanently delete food_logs, goals, consents
// - Keep anonymized security_events (no user_id)
// - Keep gdpr_requests record (for audit)
```

**Immediate Effects (Soft Delete):**
- User cannot login (account marked deleted)
- User cannot access any protected routes
- Data preserved for 30-day recovery window

**Permanent Effects (After 30 Days):**
- All user data permanently deleted from production database
- User account cannot be recovered

**Audit Logging:**
```typescript
// Log to gdpr_requests table
{
  user_id: string,
  request_type: "delete",
  requested_at: timestamp,
  completed_at: timestamp,  // Immediate (soft delete) or 30 days (hard delete)
  method: "user_initiated",
  metadata: {
    confirmation_method: "checkbox_and_text",
    user_agent: string,
    ip_address: string  // Hashed for privacy
  }
}

// Log to security_events table
{
  user_id: string,
  event_type: "account_deleted",
  timestamp: timestamp,
  metadata: {...}
}
```

---

### 5.6 Consent Withdrawal

**Purpose:** GDPR Article 7 (Right to Withdraw Consent)

**Entry Points:**
- Settings → Privacy & Consents

**UI Flow:**

1. **Consent Management Page (`/settings/privacy`):**

   **Content:**
   - List of all consent types with current status (on/off)
   - Each consent type shows:
     - Name (e.g., "Analytics")
     - Description (what it's used for)
     - Current status (toggle: on/off)
     - "View details" link (expandable)

   **Consent Types:**
   - Analytics (toggleable)
   - Marketing (toggleable)
   - Privacy Policy & Terms (cannot withdraw - required for service)

2. **Toggle Action:**
   - User toggles consent on/off
   - Show confirmation: "Analytics consent withdrawn"
   - Immediate effect (analytics tracking stops)
   - Log to `consent_history` table

3. **Essential Consents (Non-Withdrawable):**
   - Privacy Policy acceptance
   - Terms of Service acceptance
   - Core data processing (food logging)
   - Show: "Required for service. To withdraw, delete your account."

**Audit Logging:**
```typescript
// Log to consent_history table
{
  user_id: string,
  consent_type: string,  // "analytics" | "marketing"
  consent_given: boolean,  // New state
  timestamp: timestamp,
  metadata: {
    previous_state: boolean,  // Old state
    source: "settings",
    version: "1.0"
  }
}
```

---

### 5.7 Session Timeout

**Purpose:** Security - expire inactive sessions

**Detection:**
- Session token expiry (default: 1 hour, refreshable)
- Inactivity timeout (configurable, e.g., 24 hours)

**Timeout Flow:**

1. **Token Expiry (Silent Refresh):**
   - Before expiry: Attempt to refresh token
   - If refresh succeeds: User continues seamlessly
   - If refresh fails: Show "Session expired" modal

2. **Inactivity Timeout:**
   - User inactive for X hours (e.g., 24)
   - On next action: Show "Session expired, please login again" modal

**UI Pattern:**

```
┌─────────────────────────────────────────┐
│  ⚠️ Session Expired                     │
│                                         │
│  Your session has expired for security. │
│  Please login again to continue.       │
│                                         │
│  [ Login ]  [ Cancel ]                  │
└─────────────────────────────────────────┘
```

**Actions:**
- "Login" → Redirect to `/login?redirect=/current-route`
- "Cancel" → Redirect to `/` (landing page)

**State Management:**
```typescript
// Track last activity in localStorage
{
  "last_activity": timestamp  // Updated on any user action
}

// Check on page load / route change
if (Date.now() - last_activity > INACTIVITY_TIMEOUT) {
  // Show session expired modal
}
```

---

## 6. UX Principles for Mobile-First Web / PWA

### 6.1 Mobile-First Design Principles

**Core Principles:**

1. **Touch-First Interaction:**
   - Minimum tap target size: 44x44px (iOS HIG)
   - Adequate spacing between interactive elements
   - No hover-dependent interactions (use tap instead)
   - Large, tappable buttons for primary actions

2. **Thumb-Friendly Layout:**
   - Primary navigation at bottom (within thumb reach)
   - Important actions in lower-third of screen
   - Avoid top-only navigation (hard to reach on large phones)

3. **Progressive Disclosure:**
   - Show minimal info initially
   - Expand/collapse for details
   - Avoid overwhelming screens

4. **Large Typography:**
   - Minimum font size: 16px body, 24px headings
   - High contrast for readability
   - Line height: 1.5-1.6 for body text

5. **Simplified Input:**
   - Auto-focus relevant fields
   - Use number pads for numeric inputs
   - Provide quick-select options (presets)
   - Support voice input (reduce typing)

---

### 6.2 Performance Principles

**Target Metrics:**
- First Contentful Paint (FCP): <1.8s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3.8s
- Cumulative Layout Shift (CLS): <0.1

**Optimization Strategies:**

1. **Code Splitting:**
   - Route-based splitting (Next.js App Router default)
   - Lazy load non-critical components
   - Dynamic imports for heavy features

2. **Image Optimization:**
   - Use Next.js Image component
   - Serve WebP format
   - Lazy load images below fold
   - Responsive images (srcset)

3. **Caching Strategy:**
   - Static assets: CDN + long cache headers
   - API responses: Short cache (1-5 min)
   - User data: LocalStorage/IndexedDB
   - Service Worker: Cache first, network fallback

4. **Bundle Size:**
   - Minify JavaScript
   - Tree-shake unused code
   - Avoid large dependencies
   - Analyze bundle size regularly

---

### 6.3 PWA-Specific UX

**Installability:**

1. **Install Prompt:**
   - Detect PWA installability
   - Show custom install banner (not default browser prompt)
   - Show at optimal moment (after user logs food successfully)

2. **App Shell:**
   - Persistent layout (header, nav)
   - Fast navigation between routes
   - Smooth transitions

3. **Offline Experience:**
   - Cache app shell (HTML, CSS, JS)
   - Graceful degradation for online features
   - Clear offline indicators

**Home Screen Integration:**

1. **Launch Screen:**
   - Splash screen with app logo
   - Fade into main app (jank-free)

2. **Theme Color:**
   - Consistent brand color
   - Matches UI theme

3. **Display Mode:**
   - `standalone` mode (no browser chrome)
   - Fullscreen option for immersive logging

---

### 6.4 Accessibility Principles

**WCAG 2.1 AA Compliance (Minimum):**

1. **Semantic HTML:**
   - Proper heading hierarchy (h1 → h2 → h3)
   - ARIA labels for interactive elements
   - Landmark regions (header, main, nav, footer)

2. **Keyboard Navigation:**
   - All interactive elements keyboard-accessible
   - Visible focus indicators
   - Logical tab order

3. **Screen Reader Support:**
   - Alt text for images
   - Descriptive link text (not "click here")
   - Live regions for dynamic content updates

4. **Color & Contrast:**
   - Minimum contrast ratio: 4.5:1 (normal text), 3:1 (large text)
   - Don't rely on color alone (use icons + text)
   - Support high contrast mode (OS setting)

5. **Resizing & Scaling:**
   - Support 200% zoom without breaking
   - Reflow on rotation (portrait ↔ landscape)

---

### 6.5 Error & Feedback UX

**Feedback Patterns:**

1. **Immediate Feedback:**
   - Button tap: Show loading state (spinner or progress)
   - Form submit: Disable submit button, show loading
   - Action success: Brief animation + toast

2. **Loading States:**
   - Skeleton screens for content loading
   - Progress bars for long operations
   - Cancel option for multi-second operations

3. **Empty States:**
   - Helpful, not blaming
   - Clear next steps (CTAs)
   - Consistent visual style

4. **Error States:**
   - Human-readable messages (no technical jargon)
   - Recovery actions (retry, contact support)
   - Context-specific (what went wrong, where, why)

**Progressive Enhancement:**
- Core features work without JavaScript
- Enhanced experience with JavaScript enabled
- Graceful degradation for older browsers

---

### 6.6 Consistency & Visual Design

**Design System:**

1. **Component Library:**
   - Reusable UI components (buttons, inputs, cards)
   - Consistent spacing, typography, colors
   - Documented design tokens

2. **Motion & Animation:**
   - Purposeful animations (not decorative)
   - Fast transitions (200-300ms)
   - Smooth easing curves
   - Respect "reduce motion" preference

3. **Color System:**
   - Primary brand color
   - Semantic colors (success, warning, error)
   - Dark mode support (automatic or manual toggle)
   - WCAG-compliant contrast ratios

4. **Typography Scale:**
   - Consistent font sizes, weights, line heights
   - Readable body text (16px minimum)
   - Clear hierarchy (headings, subheadings, body)

---

### 6.7 Trust & Privacy UX

**Transparency:**

1. **Privacy-First Design:**
   - Clear data collection notices
   - Consent checkboxes not pre-checked
   - Easy consent withdrawal

2. **Security Indicators:**
   - HTTPS badge (visible, not intrusive)
   - Data storage location (EU region)
   - GDPR compliance badge (footer)

3. **User Control:**
   - Export data button (prominent in settings)
   - Delete account button (prominent, but with safeguards)
   - Privacy settings (accessible from main settings)

4. **Clear Communication:**
   - Plain language privacy policy (no legalese)
   - Explained features (what we collect, why, how used)
   - Update notifications for policy changes

---

## 7. Open Questions & Decisions Needed from Luis

### 7.1 Assumptions (Stated Upfront)

**Technical Assumptions:**
- ✅ Web-first PWA built with Next.js 16 (confirmed in 14_final_planning_brief_for_execution.md)
- ✅ Mobile-first responsive design (confirmed in product research)
- ✅ Supabase EU region for data storage (GDPR requirement)
- ✅ Vercel for hosting with EU-first routing
- ✅ Authentication via Supabase Auth (email + optional OAuth)

**Product Assumptions:**
- ✅ Core flow: Log food → See progress → Done (<10 seconds)
- ✅ MVP scope: Food logging, daily totals, history, export/delete
- ✅ No social features in MVP (deferred)
- ✅ No photo logging in MVP (deferred)
- ✅ Deterministic nutrition pipeline (not LLM-only)

**UX Assumptions:**
- ✅ 4 primary tabs (Log, Today, History, Settings)
- ✅ Bottom navigation for mobile, sidebar for desktop
- ✅ Minimal onboarding (2-3 minutes, can skip parts)
- ✅ GDPR-first consent management (essential + optional)

---

### 7.2 Open Questions Requiring Decisions

#### Q1: Onboarding Depth

**Question:** How much data should we collect during onboarding?

**Options:**
- **A (Minimal):** Just essential consents (privacy, terms), goals skip to defaults
- **B (Balanced - Recommended):** Welcome → Goals (optional) → Preferences (auto-detected) → Consents → Optional consents
- **C (Comprehensive):** All above plus weight, height, activity level, macro breakdown

**Trade-offs:**
- A: Fastest onboarding, but may need to ask for data later
- B: Good balance, captures key preferences without friction
- C: Richer data for personalization, but higher abandonment risk

**Default Recommendation:** B (Balanced)

---

#### Q2: Voice Input Priority

**Question:** Should voice input be a primary or secondary feature in MVP?

**Options:**
- **A (Primary):** Prominent microphone button, default input method
- **B (Secondary - Recommended):** Text input primary, voice input as secondary option
- **C (Deferred):** Text input only, defer voice to post-MVP

**Trade-offs:**
- A: Fastest logging, but technical complexity (speech recognition API costs)
- B: Good balance, voice available for power users
- C: Simplest MVP, but higher friction

**Default Recommendation:** B (Secondary)

---

#### Q3: Offline Strategy

**Question:** How deep should offline support be in MVP?

**Options:**
- **A (Minimal):** Show offline message, block all actions until online
- **B (Partial - Recommended):** View cached data, draft logging for sync, block API-dependent features
- **C (Full):** Full offline logging with local nutrition database, sync when online

**Trade-offs:**
- A: Simplest, but poor UX for intermittent connections
- B: Good balance, supports most use cases
- C: Best UX, but significant technical complexity (local DB)

**Default Recommendation:** B (Partial)

---

#### Q4: Macro Tracking in MVP

**Question:** Should we include macro tracking (protein, carbs, fat) in MVP?

**Options:**
- **A (No - Recommended):** Calories only in MVP, defer macros to v1.1
- **B (Yes):** Include macros if data available from nutrition API

**Trade-offs:**
- A: Narrower scope, faster to launch, aligns with Amy app's initial approach
- B: More comprehensive, but adds complexity to UI and data model

**Default Recommendation:** A (No - Defer to v1.1)

---

#### Q5: Notification Strategy

**Question:** What notification types should we support in MVP?

**Options:**
- **A (None):** No notifications, defer to post-MVP
- **B (In-App Only - Recommended):** In-app reminders, badges, no push/email
- **C (Full):** In-app + push + email notifications

**Trade-offs:**
- A: Simplest, but lower engagement
- B: Good balance, no permission friction, no external dependencies
- C: Highest engagement potential, but adds complexity (push service, email templates)

**Default Recommendation:** B (In-App Only)

---

#### Q6: History View Depth

**Question:** How much historical data should we show and analyze?

**Options:**
- **A (Minimal - Recommended):** Simple list of daily logs, no analytics/trends
- **B (Balanced):** Daily list + simple weekly bar chart
- **C (Advanced):** Daily/weekly/monthly views, averages, trends, patterns

**Trade-offs:**
- A: Narrowest scope, fastest to build
- B: Good balance, users can see patterns
- C: Most valuable for retention, but significant dev effort

**Default Recommendation:** A (Minimal - Defer analytics to v1.1)

---

#### Q7: Account Recovery Window

**Question:** After account deletion, how long should we preserve data for recovery?

**Options:**
- **A (None):** Immediate hard delete (no recovery)
- **B (7 Days):** 7-day soft delete window
- **C (30 Days - Recommended):** 30-day soft delete window (matches PdfExtractorAi pattern)

**Trade-offs:**
- A: Best privacy, but poor UX for accidental deletions
- B: Good balance, shorter GDPR exposure
- C: Best UX for recovery, standard industry practice

**Default Recommendation:** C (30 Days)

---

#### Q8: PWA Installation Prompt Timing

**Question:** When should we prompt users to install the PWA?

**Options:**
- **A (First Visit):** Show prompt on first visit (may be annoying)
- **B (After First Success - Recommended):** Show prompt after user logs first food successfully
- **C (Deferred):** Never prompt, let users discover "Add to Home Screen" manually

**Trade-offs:**
- A: Maximum installs, but high annoyance rate
- B: Good balance, users see value before prompt
- C: Lowest annoyance, but fewer installs

**Default Recommendation:** B (After First Success)

---

#### Q9: Dark Mode Strategy

**Question:** Should we support dark mode in MVP?

**Options:**
- **A (Light Only):** Light theme only, defer dark mode
- **B (System-Auto - Recommended):** Auto-detect OS preference, support both
- **C (Manual Toggle):** Light/Dark toggle in settings, plus auto-detect option

**Trade-offs:**
- A: Simplest, but poor UX for dark mode users
- B: Good balance, respects user preferences
- C: Best UX, but adds UI complexity

**Default Recommendation:** B (System-Auto)

---

#### Q10: Search Behavior

**Question:** How should food search work for ambiguous queries?

**Options:**
- **A (Best Guess - Recommended):** Show top 3 matches, user selects
- **B (Confirmation Required):** For low-confidence matches, require explicit confirmation
- **C (Hybrid):** Best guess for high-confidence, confirmation for low-confidence

**Trade-offs:**
- A: Fastest, but may log wrong food
- B: Safer, but more friction
- C: Best balance, but requires confidence scoring

**Default Recommendation:** C (Hybrid)

---

### 7.3 Technical Implementation Questions

**Q11: Nutrition API Provider**

**Question:** Which nutrition API should we integrate with?

**Options:**
- **A (USDA):** Free, US-focused, limited foods
- **B (Edamam):** Good free tier, rate limits
- **C (FatSecret):** Comprehensive, usage limits
- **D (Custom Cache):** Build our own DB from multiple sources

**Default Recommendation:** Needs benchmarking (per Phase 1 in 14_final_planning_brief_for_execution.md)

---

**Q12: Local LLM vs. Cloud LLM**

**Question:** For food parsing, should we use local or cloud LLM?

**Options:**
- **A (Local Only):** Fast, private, limited knowledge
- **B (Cloud Only):** Accurate, costly, latency
- **C (Hybrid - Recommended):** Local for parsing, cloud for nutrition lookup

**Default Recommendation:** C (Hybrid)

---

**Q13: Voice Recognition Provider**

**Question:** If voice input is included, which provider should we use?

**Options:**
- **A (Web Speech API):** Free, browser-native, variable quality
- **B (OpenAI Whisper):** High quality, costly
- **C (Google Speech-to-Text):** Good quality, moderate cost

**Default Recommendation:** A (Web Speech API) for MVP, evaluate B/C if quality insufficient

---

### 7.4 GDPR/Legal Questions

**Q14: Data Classification**

**Question:** Is food/calorie logging classified as "health data" under GDPR Article 9?

**Impact:**
- If yes: Requires explicit consent, DPIA, stricter security
- If no: General personal data classification applies

**Default Recommendation:** Treat as general personal data unless legal review confirms otherwise

---

**Q15: Age Requirement**

**Question:** What minimum age should we set?

**Options:**
- **A (13):** Standard for general data
- **B (16):** Standard for health data (if classified)
- **C (18):** Conservative, avoids most restrictions

**Default Recommendation:** A (13), but re-evaluate if classified as health data

---

### 7.5 Design & Branding Questions

**Q16: Design Language**

**Question:** Should we follow Amy app's "liquid glass" design or create our own?

**Options:**
- **A (Liquid Glass):** Modern, premium, but iOS-specific aesthetic
- **B (Clean Minimal):** Simple, timeless, cross-platform
- **C (Custom):** Unique branding, but more design work

**Default Recommendation:** B (Clean Minimal) - Better for web-first PWA, cross-platform consistency

---

**Q17: Color Scheme**

**Question:** What primary color should define the brand?

**Options:**
- **A (Green):** Health, fitness, positive (common for calorie apps)
- **B (Blue):** Trust, technology, data-driven
- **C (Orange/Yellow):** Energy, warmth, food-related

**Default Recommendation:** A (Green) - Aligns with health/fitness category expectations

---

### 7.6 Decisions Summary Table

| Question | Default Recommendation | Priority | When Needed |
|----------|------------------------|----------|-------------|
| Q1: Onboarding Depth | B (Balanced) | 🟡 High | Before implementation |
| Q2: Voice Input Priority | B (Secondary) | 🟡 High | Before implementation |
| Q3: Offline Strategy | B (Partial) | 🟡 High | Before implementation |
| Q4: Macro Tracking | A (No - Defer) | 🟡 High | Before implementation |
| Q5: Notifications | B (In-App Only) | 🟢 Medium | Before implementation |
| Q6: History View Depth | A (Minimal) | 🟢 Medium | Before implementation |
| Q7: Account Recovery | C (30 Days) | 🔴 Critical | Before implementation |
| Q8: PWA Install Prompt | B (After First Success) | 🟢 Medium | Before implementation |
| Q9: Dark Mode | B (System-Auto) | 🟢 Medium | Before implementation |
| Q10: Search Behavior | C (Hybrid) | 🟡 High | Before implementation |
| Q11: Nutrition API | TBD (benchmark) | 🔴 Critical | Phase 1 validation |
| Q12: LLM Strategy | C (Hybrid) | 🔴 Critical | Before implementation |
| Q13: Voice Provider | A (Web Speech API) | 🟢 Medium | Before implementation |
| Q14: Data Classification | General (pending legal) | 🔴 Critical | Legal consultation |
| Q15: Age Requirement | A (13) | 🔴 Critical | Legal consultation |
| Q16: Design Language | B (Clean Minimal) | 🟢 Medium | Design phase |
| Q17: Color Scheme | A (Green) | 🟢 Medium | Design phase |

**Legend:**
- 🔴 Critical: Must decide before coding starts
- 🟡 High: Should decide before coding, can defer minor details
- 🟢 Medium: Can decide during implementation or defer to v1.1

---

## Appendix: Navigation State Diagrams

### A.1 User State Transitions

```
┌─────────────────────────────────────────────────────────┐
│  User State Machine                                     │
└─────────────────────────────────────────────────────────┘

First-Time Visitor
    │
    ├─→ Signup → Signed-Up, Not Onboarded
    │                    │
    │                    ├─→ Complete Onboarding → Active User
    │                    │                             │
    │                    │                             ├─→ Logout → First-Time Visitor
    │                    │                             │
    │                    │                             ├─→ 30+ Days Inactive → Returning Inactive User
    │                    │                             │
    │                    │                             └─→ Delete Account → Terminated
    │                    │
    │                    └─→ Logout → First-Time Visitor
    │
    └─→ Login → Active User (if already onboarded)
                    │
                    └─→ 30+ Days Inactive → Returning Inactive User
                                                      │
                                                      └─→ Log Food → Active User
```

---

### A.2 Primary Navigation Flow

```
┌─────────────────────────────────────────────────────────┐
│  Primary Navigation (Mobile - Bottom Tabs)            │
└─────────────────────────────────────────────────────────┘

┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│   LOG   │  │  TODAY  │  │ HISTORY │  │SETTINGS │
│         │  │         │  │         │  │         │
│  /log   │  │ /today  │  │/history │  │/settings│
└─────────┘  └─────────┘  └─────────┘  └─────────┘

Sub-flows:

/log
  ├─→ /log/search          (Food search)
  ├─→ /log/confirm         (Confirmation modal)
  └─→ /history/entry/[id]  (Edit entry)

/today
  └─→ /today/meal/[id]     (Meal detail)

/history
  ├─→ /history/weekly      (Weekly view - future)
  ├─→ /history/monthly     (Monthly view - future)
  └─→ /history/entry/[id]  (Edit entry)

/settings
  ├─→ /settings/profile
  ├─→ /settings/goals
  ├─→ /settings/preferences
  ├─→ /settings/notifications
  ├─→ /settings/privacy
  ├─→ /settings/gdpr
  │   ├─→ /settings/gdpr/export
  │   └─→ /settings/gdpr/delete
  ├─→ /settings/help
  └─→ /settings/about
```

---

### A.3 Onboarding Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Onboarding Flow                                        │
└─────────────────────────────────────────────────────────┘

/signup (Success)
    │
    ↓
Welcome ───────┐
(/onboarding/welcome)
    │
    ├─→ "Skip" → Consents Checkpoint (with defaults)
    │
    └─→ "Get Started"
          │
          ↓
Goals ────────┐
(/onboarding/goals)
    │
    ├─→ "Skip" → Consents Checkpoint (with default: 2000 kcal)
    │
    └─→ "Next" (with goal)
          │
          ↓
Preferences ──┐
(/onboarding/preferences)
    │
    ├─→ "Skip" → Consents Checkpoint (with auto-detected values)
    │
    └─→ "Next" (with preferences)
          │
          ↓
Consents Checkpoint ──┐
(/onboarding/consents)
    │
    ├─→ Cannot skip (required)
    │
    └─→ "I Agree" (both checkboxes)
          │
          ↓
Optional Consents ─────┐
(/onboarding/consents-optional)
    │
    ├─→ Can leave blank (defaults: false)
    │
    └─→ "Complete Onboarding"
          │
          ↓
Complete ────────┐
(/onboarding/complete)
    │
    └─→ "Start Logging" → /log (Active User)
```

---

### A.4 Daily Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Daily Logging Flow                                      │
└─────────────────────────────────────────────────────────┘

User opens app
    │
    ↓
/log tab (focus input)
    │
    ├─→ Type food "chicken 150g"
    │       │
    │       ↓
    │   Parse (local LLM)
    │       │
    │       ↓
    │   Lookup nutrition API
    │       │
    │       ├─→ Found match → Show results
    │       │       │
    │       │       ├─→ High confidence → Auto-select
    │       │       │       │
    │       │       │       └─→ Log to DB → Show success toast
    │       │       │
    │       │       └─→ Low confidence → Show confirmation modal
    │       │               │
    │       │               ├─→ Confirm → Log to DB → Success toast
    │       │               └─→ Edit → Correct → Log → Success toast
    │       │
    │       └─→ Not found → Show "not found" message
    │               │
    │               ├─→ Try different search
    │               ├─→ Log manually (future)
    │               └─→ Cancel
    │
    ├─→ Tap voice button
    │       │
    │       ├─→ Speech-to-text → Same flow as type
    │       └─→ Cancel
    │
    └─→ Tap today tab → View progress
            │
            ├─→ See daily total
            ├─→ See meal breakdown
            └─→ Tap "Add Food" → /log
```

---

### A.5 Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│  Error Handling Flow                                    │
└─────────────────────────────────────────────────────────┘

User action → Error detected
    │
    ↓
Error type?
    │
    ├─→ Validation error
    │       └─→ Show inline error below field (red text)
    │
    ├─→ Network timeout / server error
    │       └─→ Show toast notification: "Request timed out. Try again."
    │               │
    │               ├─→ "Retry" button
    │               └─→ Auto-dismiss after 5s
    │
    ├─→ Auth error (session expired)
    │       └─→ Show modal: "Session expired. Login again."
    │               │
    │               ├─→ "Login" → /login?redirect=/current
    │               └─→ "Cancel" → / (landing)
    │
    ├─→ API rate limit
    │       └─→ Show toast: "Too many requests. Wait a moment."
    │
    ├─→ Critical error (app crash)
    │       └─→ Show full-screen error page
    │               │
    │               ├─→ "Refresh" button
    │               └─→ "Contact Support" link
    │
    └─→ Offline error
            └─→ Show offline banner: "You're offline. Changes will sync when online."
                    │
                    ├─→ Show queue indicator (pending actions)
                    └─→ Auto-hide when online
```

---

### A.6 GDPR Rights Flow

```
┌─────────────────────────────────────────────────────────┐
│  GDPR Rights Flows                                       │
└─────────────────────────────────────────────────────────┘

Export Data (Article 15, 20)
    │
    ↓
/settings/gdpr/export
    │
    ├─→ Select format (JSON/CSV/Both)
    │       │
    │       └─→ "Generate Export"
    │               │
    │               ├─→ Processing state: "Preparing export..."
    │               │
    │               ├─→ Success: Show download buttons
    │               │       │
    │               │       ├─→ Download JSON
    │               │       ├─→ Download CSV
    │               │       └─→ Download Both (ZIP)
    │               │
    │               └─→ Error: "Failed to generate. Try again."
    │
    └─→ Cancel

Delete Account (Article 17)
    │
    ↓
/settings/gdpr/delete
    │
    ├─→ Show warning banner (cannot be undone)
    │
    ├─→ Checkbox: "I understand my data will be permanently deleted"
    │
    ├─→ Text input: "Type DELETE to confirm"
    │
    ├─→ "Delete My Account" (disabled until checkbox + input)
    │       │
    │       ├─→ Processing: "Deleting account..."
    │       │
    │       ├─→ Success: "Account deleted" → Redirect to / (landing)
    │       │
    │       └─→ Error: "Failed to delete. Try again or contact support."
    │
    └─→ Cancel

Consent Withdrawal (Article 7)
    │
    ↓
/settings/privacy
    │
    ├─→ List of consents (Analytics, Marketing)
    │
    ├─→ Toggle on/off for each consent type
    │       │
    │       ├─→ Toggle Analytics: Show "Analytics withdrawn" toast
    │       ├─→ Toggle Marketing: Show "Marketing withdrawn" toast
    │       └─→ Essential consents (Privacy, Terms): Cannot withdraw
    │               │
    │               └─→ Show: "Required for service. To withdraw, delete account."
    │
    └─→ All changes logged to consent_history table
```

---

## Document Summary

**What This Document Defines:**

1. ✅ **User States:** 4 distinct user states with transitions
2. ✅ **Navigation Map:** 4 primary tabs, public/protected routes, transitions
3. ✅ **Onboarding Flow:** 6-step flow with GDPR consent checkpoints
4. ✅ **Daily Flow:** Core logging flow, progress review, history, corrections, reminders
5. ✅ **Edge Flows:** Empty states, offline, errors, export, delete, consent withdrawal
6. ✅ **UX Principles:** Mobile-first, performance, PWA, accessibility, trust
7. ✅ **Open Questions:** 17 questions requiring decisions from Luis

**Key Decisions Made (Defaults):**
- Onboarding: Balanced depth (2-3 min, skip options)
- Voice input: Secondary (not primary)
- Offline: Partial support (view cached, draft logging)
- Macros: Deferred to v1.1
- Notifications: In-app only (no push/email in MVP)
- Account recovery: 30-day soft delete window
- Dark mode: System-auto
- Search: Hybrid (best guess + confirmation for low confidence)

**Next Steps for Luis:**

1. Review open questions (Section 7)
2. Confirm or override default recommendations
3. Provide design preferences (color scheme, design language)
4. Get legal consultation on data classification (Q14)
5. Validate nutrition API provider (Q11)
6. Proceed to implementation once decisions are locked

---

**Document Status:** Complete (Planning Phase)
**Version:** 1.0
**Created:** 2026-02-15
**Next Review:** After Luis confirms decisions

---

## Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-15 | Initial document creation | Subagent |
