# E2E-002: User Registration

## Test ID
E2E-002

## Description
Verify that a new user can successfully register, receive a JWT token, and access the Today view.

## Prerequisites
- Backend running: `http://localhost:4000`
- Frontend running: `http://localhost:3000` or `http://192.168.1.208:3000`

## Setup

### Database: No Pre-existing Data
```sql
-- Verify no test user exists
SELECT * FROM users WHERE email = 'e2e-newuser@calorietracker.test';
-- Should return 0 rows
```

## Steps

### Step 1: Navigate to Frontend
1. Open browser to `http://localhost:3000` (or `http://192.168.1.208:3000`)
2. Verify login page is visible
3. Click "Create account" or "Sign up" link

### Step 2: Fill Registration Form
1. Enter email: `e2e-newuser@calorietracker.test`
2. Enter password: `test456` (minimum 8 characters)
3. Enter full name: `E2E New User`
4. Click "Sign Up" or "Create Account" button

### Step 3: Verify Registration
**Expected:**
- Success message appears
- Redirected to onboarding flow (if implemented) or `/today` page
- JWT token stored in localStorage

### Step 4: Access Today View
1. If not on `/today`, navigate there
2. **Expected:** Today page loads without errors
3. Verify user name displayed (if shown in UI): `E2E New User`

### Step 5: Verify Token
1. Open browser DevTools (F12)
2. Go to Application > Local Storage
3. **Expected:** `auth_token` key exists with JWT value

## Assertions

### Frontend Assertions
- [ ] Registration form visible
- [ ] Form validates required fields (email, password, full name)
- [ ] Clicking submit with valid data succeeds
- [ ] Success message or redirect occurs
- [ ] User can access protected routes (today, log, history)
- [ ] JWT token stored in localStorage

### Database Assertions
```sql
-- Verify user created
SELECT id, email, full_name, created_at FROM users
WHERE email = 'e2e-newuser@calorietracker.test';

-- Expected: 1 row with correct data
```

### API Assertions
1. Check registration API response:
   - Status: 201 Created
   - Response contains `token` field
   - Response contains `user` object with `id`, `email`, `fullName`

## Cleanup

### Database: Remove Test User
```sql
-- Soft delete any food logs (if created during test)
UPDATE food_logs SET is_deleted = TRUE
WHERE user_id = (SELECT id FROM users WHERE email = 'e2e-newuser@calorietracker.test');

-- Delete test user
DELETE FROM users WHERE email = 'e2e-newuser@calorietracker.test';

-- Verify cleanup
SELECT COUNT(*) FROM users WHERE email = 'e2e-newuser@calorietracker.test';
```

## Variations to Test

### Variation A: Invalid Email Format
- Enter: `not-an-email`
- **Expected:** Validation error, form doesn't submit

### Variation B: Weak Password
- Enter: `123` (too short)
- **Expected:** Validation error, "Password must be at least 8 characters"

### Variation C: Duplicate Email
- Register once with `e2e-duplicate@calorietracker.test`
- Try to register again with same email
- **Expected:** Error message "Email already registered"

### Variation D: Missing Fields
- Submit form with only password filled
- **Expected:** Validation error for missing email/full name

## Notes
- Test creates a fresh user each time
- JWT token expiration should be tested separately
- Password hashing should use bcrypt (verify in DB - hash should be different from plain text)
