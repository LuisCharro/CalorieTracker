# CalorieTracker Development Plan
**Branch:** development  
**Created:** 2026-03-01  
**Updated:** 2026-03-01 (added features from research)

---

## Problem Statement

The current CalorieTracker feels like a **toy app** and has critical gaps:

### Onboarding Issues
1. **Wrong order** - asks for goals before collecting user profile
2. **Missing data** - no birthday, gender, height, weight
3. **No units** - doesn't ask kg/lbs, cm/ft preference
4. **Missing activity level** - critical for calorie calculations
5. **Missing diet preferences** - no special considerations

### Food Entry Issues
1. **No food cache** - doesn't show previously used foods per meal type
2. **No recent foods** - user has to search every time
3. **Poor UX** - not like professional apps

---

## Reference: Amy App Onboarding (Research)

From `03_video_research/onboarding_reference/`:

### Complete Onboarding Flow (from research):
1. Welcome (Get Started)
2. Apple Health sync (optional) - **FUTURE**
3. **Birthday** ← We miss this
4. **Gender** ← We miss this
5. **Height** ← We miss this
6. **Weight** (current + goal + optional target date) ← We miss this
7. **Activity level** ← We miss this
8. Special considerations (diet) ← PARTIAL
9. Calorie uncertainty preference ← **PLACEHOLDER**
10. Location permission ← **PLACEHOLDER**
11. Notification permission ← **PLACEHOLDER**
12. Goals summary (with trajectory) ← **PLACEHOLDER**
13. Widget setup ← **FUTURE**
14. Paywall ← **FUTURE**
15. Account creation ← We have this

---

## All Features from Research (Categorized)

### 🔴 Must Have Now (Onboarding Rebuild)
| Feature | Status | Notes |
|---------|--------|-------|
| Birthday | ❌ MISSING | For age calculation |
| Gender | ❌ MISSING | For BMR calculation |
| Height | ❌ MISSING | For BMR calculation |
| Current Weight | ❌ MISSING | For BMR + goal |
| Goal Weight | ❌ MISSING | For progress tracking |
| Target Date | ⚠️ PARTIAL | Optional, existing |
| Activity Level | ❌ MISSING | For TDEE calculation |
| Unit System | ❌ MISSING | kg/lbs, cm/ft |

### 🟡 Placeholders (Add UI, Store Data)
| Feature | Status | Notes |
|---------|--------|-------|
| Calorie Uncertainty | ❌ MISSING | Store preference, show in UI |
| Weight History | ❌ MISSING | Track weight over time |
| Calories Burned | ❌ MISSING | From activity + manual entry |
| Water Intake | ❌ MISSING | Common feature |
| Exercise/Workouts | ❌ MISSING | Log workouts |
| Macro Goals | ⚠️ PARTIAL | Protein, carbs, fat targets |

###Nice 🔵 Future ( to Have)
| Feature | Status | Notes |
|---------|--------|-------|
| Apple Health Sync | 🔵 FUTURE | Integration |
| Widget Setup | 🔵 FUTURE | Home screen widget |
| Paywall | 🔵 FUTURE | Monetization |
| Progress Photos | 🔵 FUTURE | Body progress |
| Meal Reminders | 🔵 FUTURE | Push notifications |

---

## Proposed Onboarding Flow (8 Steps)

### Step 1: Welcome
- App name + value prop
- "Get Started" / "Already have account?"

### Step 2: Profile - Birthday
- "What's your birthday?"
- Date picker with age preview
- Privacy note

### Step 3: Profile - Gender
- Options: Male, Female, Other, Prefer not to say

### Step 4: Profile - Height
- Unit toggle: cm / ft+in
- Large, easy input

### Step 5: Profile - Weight
- Current weight input
- Goal weight input (optional)
- Target date (optional)
- Unit toggle: kg / lbs

### Step 6: Activity Level
- Sedentary, Lightly active, Moderately active, Very active, Extra active

### Step 7: Goals
- Auto-calculate TDEE from profile
- Show daily calorie target
- Allow manual adjustment
- Show macro targets (protein, carbs, fat)

### Step 8: Preferences
- Diet preferences (High protein, Low carb, etc.)
- Calorie uncertainty slider (store only for now)

---

## Data Model Changes

### User Profile Fields (new)
```typescript
{
  // Identity
  birthday: Date,
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say',
  
  // Body metrics
  height_cm: number,
  weight_kg: number,
  goal_weight_kg: number | null,
  target_date: Date | null,
  
  // Preferences
  unit_system: 'metric' | 'imperial',
  activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active',
  diet_preferences: string[],
  calorie_bias: 'under' | 'over' | 'accurate' | null,
}
```

### New Tables (for placeholders)
```sql
-- Weight history tracking
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  weight_kg DECIMAL(5,1),
  logged_at TIMESTAMP DEFAULT NOW()
);

-- Exercise/workouts (placeholder)
CREATE TABLE exercises (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  calories_burned INTEGER,
  duration_minutes INTEGER,
  logged_at TIMESTAMP DEFAULT NOW()
);

-- Water intake (placeholder)
CREATE TABLE water_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount_ml INTEGER,
  logged_at TIMESTAMP DEFAULT NOW()
);

-- Food cache (for recent foods)
CREATE TABLE food_cache (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  food_name VARCHAR(255),
  brand VARCHAR(255),
  calories_per_100g DECIMAL(6,1),
  protein_per_100g DECIMAL(5,1),
  carbs_per_100g DECIMAL(5,1),
  fat_per_100g DECIMAL(5,1),
  serving_size_grams DECIMAL(5,1),
  meal_type VARCHAR(20),
  last_used_at TIMESTAMP DEFAULT NOW(),
  use_count INTEGER DEFAULT 1
);
```

---

## Implementation Priority

### Phase 1: Onboarding Rebuild (Week 1)
- [ ] Add profile fields to user model
- [ ] Rebuild onboarding (8 steps)
- [ ] Add unit conversion utilities
- [ ] Add TDEE/BMR calculation

### Phase 2: Food Cache (Week 2)
- [ ] Create food_cache table
- [ ] Track foods per meal type
- [ ] Show "Recent foods" in meal entry

### Phase 3: Placeholders (Week 3)
- [ ] Add weight_logs table + UI
- [ ] Add exercises table + UI
- [ ] Add water_logs table + UI
- [ ] Add macro tracking UI

### Phase 4: Polish (Week 4)
- [ ] Empty states
- [ ] Loading states
- [ ] Error handling

---

## References

- Onboarding research: `03_video_research/onboarding_reference/`
- Screen observations: `02_screen_by_screen_observations.md`
- Current data model: `02_architecture_gdpr/26_FINAL_data_model...`
