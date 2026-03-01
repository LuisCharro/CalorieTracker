# CalorieTracker Development Plan
**Branch:** development  
**Created:** 2026-03-01  
**Status:** 🚧 PLANNING

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

### General Issues
1. Needs professional polish
2. Missing key features from research

---

## Reference: Amy App Onboarding (Research)

From `03_video_research/onboarding_reference/`:

### Correct Order:
1. Welcome (Get Started)
2. Apple Health sync (optional)
3. **Birthday** ← We miss this
4. **Gender** ← We miss this
5. **Height** ← We miss this
6. **Weight** (current + goal) ← We miss this
7. **Activity level** ← We miss this
8. Special considerations (diet)
9. Calorie uncertainty preference
10. Location permission
11. Notification permission
12. Goals summary
13. Account creation

### Key Insight:
**Goals come AFTER profile data** - you can't calculate goals without knowing:
- Age (from birthday)
- Gender
- Height
- Current weight
- Activity level

---

## Proposed Onboarding Flow

### Step 1: Welcome
- App name + value prop
- "Get Started" / "Already have account? Sign in"
- Optional: Apple Health sync (future)

### Step 2: Profile - Birthday
- "What's your birthday?"
- Date picker with age preview
- Privacy note

### Step 3: Profile - Gender
- "What's your gender?" 
- Options: Male, Female, Other, Prefer not to say
- Needed for BMR calculation

### Step 4: Profile - Height
- "What's your height?"
- Unit toggle: cm / ft+in
- Large, easy input

### Step 5: Profile - Weight (Current + Goal)
- "What's your weight?"
- Current weight input
- Goal weight input
- Target date (optional)
- Unit toggle: kg / lbs

### Step 6: Profile - Activity Level
- "What's your activity level?"
- Sedentary, Lightly active, Moderately active, Very active, Extra active
- Impacts TDEE calculation

### Step 7: Goals - Calorie Target
- Auto-calculate from profile data (TDEE)
- Allow manual adjustment
- Show calculated vs manual

### Step 8: Preferences
- Diet preferences (High protein, Low carb, etc.)
- Calorie uncertainty slider

### Step 9: Complete
- Summary of goals
- Welcome to app

---

## Data Model Changes Needed

### User Profile (new table/fields)
```
- birthday: Date
- gender: Enum (male, female, other, prefer_not_to_say)
- height_cm: Decimal
- height_ft: Integer (feet)
- height_in: Integer (inches)
- weight_kg: Decimal
- weight_lbs: Decimal  
- goal_weight_kg: Decimal
- goal_weight_lbs: Decimal
- target_date: Date (optional)
- activity_level: Enum (sedentary, light, moderate, very_active, extra_active)
- unit_system: Enum (metric, imperial)
- diet_preferences: JSON (array of preferences)
- calorie_bias: Enum (under, over, accurate)
```

### Food Cache (new table)
```
- id: UUID
- user_id: UUID
- food_name: String
- brand: String (optional)
- calories_per_100g: Decimal
- protein_per_100g: Decimal
- carbs_per_100g: Decimal
- fat_per_100g: Decimal
- serving_size_grams: Decimal
- meal_type: Enum (breakfast, lunch, dinner, snack)
- last_used_at: DateTime
- use_count: Integer
```

---

## Features to Add

### Priority 1: Complete Onboarding (Must Fix)
- [ ] Rebuild onboarding flow (8-9 steps)
- [ ] Add profile data collection
- [ ] Add unit system preference
- [ ] Calculate TDEE from profile
- [ ] Auto-suggest calorie goal

### Priority 2: Food Cache (UX Improvement)
- [ ] Create food_cache table
- [ ] Track foods per meal type
- [ ] Show "Recent foods" for each meal
- [ ] "Frequently used" sorting

### Priority 3: Professional Polish
- [ ] Better empty states
- [ ] Progress indicators
- [ ] Better error handling
- [ ] Loading states

---

## Technical Tasks

### Backend
1. Add profile endpoints (GET/PUT user profile)
2. Add unit conversion utilities
3. Add TDEE/BMR calculation service
4. Create food_cache table and API
5. Update user model with new fields

### Frontend
1. Create new onboarding flow (8-9 pages)
2. Add unit toggle components
3. Add profile settings page
4. Create food search with cache
5. Add "Recent foods" to meal entry

---

## References

- Onboarding research: `03_video_research/onboarding_reference/`
- Current data model: `02_architecture_gdpr/26_FINAL_data_model...`
- Current onboarding: `frontend/src/app/onboarding/`

---

## Next Steps

1. Review this plan
2. Approve priorities
3. Start implementing onboarding
4. Test with real user flow
