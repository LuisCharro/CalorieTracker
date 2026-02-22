# E2E-001: Log a Meal with Food Items

## Test ID
E2E-001

## Description
Verify that a logged-in user can successfully log a meal with multiple food items and see them appear in the Today view.

## Prerequisites
- Backend running: `http://localhost:4000`
- Frontend running: `http://localhost:3000` or `http://192.168.1.208:3000`
- Test user exists in database (created in setup)

## Setup

### Database: Create Test User
```sql
-- Delete existing test user if exists
DELETE FROM users WHERE email = 'e2e-test@calorietracker.test';

-- Insert test user
INSERT INTO users (id, email, password_hash, display_name, preferences, onboarding_complete, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'e2e-test@calorietracker.test',
  '$2b$12$EixZaYVK1fsbw1ZfbX3Oe$JYqWqNwXwOq7qL5G5j5j5j5j5j5j5j5j5j5j5j', -- hashed 'test123'
  'E2E Test User',
  '{"daily_calorie_goal": 2000}'::jsonb,
  TRUE,
  NOW()
);

-- Verify user created
SELECT id, email, display_name FROM users WHERE email = 'e2e-test@calorietracker.test';
```

## Steps

### Step 1: Navigate to Frontend
1. Open browser to `http://localhost:3000` (or `http://192.168.1.208:3000`)
2. Verify login page is visible

### Step 2: Login
1. Enter email: `e2e-test@calorietracker.test`
2. Enter password: `test123`
3. Click "Sign In" button
4. **Expected:** Redirected to `/today` page (or onboarding flow if user is new), no error message
5. If onboarding appears, complete all steps (goals, preferences, required consents, optional consents skip/continue) until dashboard (`/today`) is shown.

### Step 3: Navigate to Log Page
1. Click "Log" button in navigation (bottom)
2. **Expected:** On `/log` page, see "Log Meal" header

### Step 4: Add Food Items
1. In first food item row:
   - Enter: `100g chicken breast`
   - **Expected:** Nutrition shows: `165 cal`, `31g protein`, `0g carbs`, `3.6g fat`
2. Click "+ Add Another Item" button
3. In second food item row:
   - Enter: `200g rice`
   - **Expected:** Nutrition shows: `260 cal`, `5.4g protein`, `56g carbs`, `0.6g fat`
4. Click "+ Add Another Item" button
5. In third food item row:
   - Enter: `100g apple`
   - **Expected:** Nutrition shows: `52 cal`, `0.3g protein`, `14g carbs`, `0.2g fat`

### Step 5: Configure Meal
1. Meal Type: Click "Lunch" button (should be selected by default)
2. Meal Name (optional): Enter `Test Lunch`

### Step 6: Log the Meal
1. Click "Log 3 Items (477 cal)" button
2. **Expected:**
   - Success alert appears: "Logged 3 items successfully!"
   - Redirected to `/today` page after ~1 second

### Step 7: Verify in Today View
1. On `/today` page:
   - Verify "Lunch" section exists
   - Verify 3 items are listed:
     - 100g Chicken Breast
     - 200g Rice
     - 1 Apple
   - Verify total calories: `477 cal` (165 + 260 + 52)

## Assertions

### Frontend Assertions
- [ ] Login successful (no error, redirect to /today)
- [ ] Food nutrition parses automatically for each valid food name
- [ ] "Log 3 Items" button shows correct total calories (477)
- [ ] Success message appears after logging
- [ ] Redirected to /today page
- [ ] All 3 items visible in Today view under Lunch
- [ ] Total calories match (477 cal)

### Database Assertions
```sql
-- Verify 3 food logs created
SELECT COUNT(*) FROM food_logs WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Verify meal type
SELECT meal_type, COUNT(*) FROM food_logs
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
AND DATE(logged_at) = CURRENT_DATE
GROUP BY meal_type;

-- Verify nutrition totals
SELECT SUM((nutrition->>'calories')::numeric) as total_calories
FROM food_logs
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
AND DATE(logged_at) = CURRENT_DATE;
```

## Cleanup

### Database: Remove Test Data
```sql
-- Soft delete test food logs
UPDATE food_logs SET is_deleted = TRUE
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Delete test user
DELETE FROM users WHERE email = 'e2e-test@calorietracker.test';

-- Verify cleanup
SELECT COUNT(*) FROM users WHERE email = 'e2e-test@calorietracker.test';
SELECT COUNT(*) FROM food_logs WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
```

## Variations to Test

### Variation A: Single Item
- Add only 1 food item
- Verify meal logs with single item

### Variation B: Unknown Food
- Try adding: `500g unknownfood`
- Verify nutrition shows null/default
- Verify error message when trying to log

### Variation C: Empty Food Name
- Leave food name blank
- Verify button disabled or error appears

## Notes
- Test uses hardcoded test user credentials
- Food nutrition parsing uses local database (chicken, rice, apple are known foods)
- Meal logs use soft delete, so cleanup should use UPDATE not DELETE
