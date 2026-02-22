# End-to-End Test Plan for CalorieTracker

## Objective
Simulate a real user flow to identify usability issues and bugs in the current app implementation.

## Test Scenario
- User already exists in database
- User logs foods for the day (multiple meals)
- User navigates to history to view past entries
- User uses search and filters

## Test Data

### User
- Email: `test@example.com`
- Password: `test123`
- Name: `Test User`
- Goal: `maintain` (2000 calories/day)

### Foods to Log
1. **Breakfast**: Greek yogurt with berries (~250 calories)
2. **Lunch**: Grilled chicken breast with brown rice (~450 calories)
3. **Snack**: Apple (~95 calories)
4. **Dinner**: Salmon with vegetables (~500 calories)

### Expected Issues to Verify
1. ✅ Food logging difficulty - no suggestions from database
2. ✅ History page exception
3. ✅ Recent foods section uses static data (not from DB)
4. ✅ Nutrition values are mocked (random values)

## Test Script

```bash
# 1. Start backend
cd /Users/luis/Repos/CalorieTracker_BackEnd
npm run dev

# 2. In another terminal, start frontend
cd /Users/luis/Repos/CalorieTracker_FrontEnd
npm run dev

# 3. Run test
cd /Users/luis/Repos/CalorieTracker
node test-e2e.js
```

## Test Steps (Manual)

### 1. Sign Up/Login
- Navigate to http://localhost:3000/login
- Log in with test credentials
- Complete onboarding (if needed)

### 2. Log Foods
- Navigate to http://localhost:3000/log
- Try to log:
  - "Greek yogurt with berries" (Breakfast)
  - "Grilled chicken breast with brown rice" (Lunch)
  - "Apple" (Snack)
  - "Salmon with vegetables" (Dinner)

### 3. Check Today's View
- Navigate to http://localhost:3000/today
- Verify all logged foods appear
- Check calorie totals

### 4. Check History
- Navigate to http://localhost:3000/history
- Look for exception/error
- Try filtering by date
- Try searching for "chicken"

## Issues Found

### Issue 1: No Food Suggestions from Database
**Severity**: High
**Description**: The "Recent Foods" section on the log page shows static hardcoded values instead of pulling from the database.
**Impact**: Users cannot quickly re-log foods they've eaten before.
**Fix**: 
1. Add an API endpoint to get recent foods for a user: `GET /api/logs/recent`
2. Fetch and display real recent foods in the Log page

### Issue 2: Random Nutrition Values
**Severity**: Medium
**Description**: Nutrition values (calories, protein, carbs, fat) are generated randomly using `Math.random()`.
**Impact**: Inaccurate tracking, defeats the purpose of the app.
**Fix**: 
1. Integrate with a nutrition API (e.g., Nutritionix, Edamam, or USDA database)
2. Or create a local database of common foods with their nutritional values

### Issue 3: History Page Exception
**Severity**: High
**Description**: User reported an exception when navigating to history.
**Possible causes**:
- Backend not running
- API endpoint returning wrong format
- Frontend expecting different response structure
**Need to investigate**: Check browser console and backend logs

## Improvements Needed

### 1. Food Suggestions / Autocomplete
- Implement fuzzy search for foods
- Show nutrition info while typing
- Allow creating custom foods

### 2. Better Food Logging UX
- Add common foods database (quick add)
- Show portion size suggestions
- Add visual portion guides

### 3. History Enhancements
- Add calorie totals per day
- Show weekly/monthly trends
- Export to CSV
