import { test, expect } from '@playwright/test';

test.describe('Full Onboarding Journey', () => {
  test('should complete the entire onboarding flow', async ({ page }) => {
    const timestamp = Date.now();
    const email = `full-journey-${timestamp}@example.com`;
    const password = 'TestPass123!';

    // 1. Signup
    await page.goto('/signup');
    await page.fill('input#email', email);
    await page.fill('input#displayName', 'Journey User');
    await page.fill('input#password', password);
    await page.fill('input#confirmPassword', password);
    await page.click('button[type="submit"]');

    // 2. Onboarding Goals
    await expect(page).toHaveURL(/\/onboarding\/goals/, { timeout: 15000 });
    await expect(page.locator('text=Set Your Goals')).toBeVisible();
    
    // Select a goal
    await page.click('button:has-text("Lose weight")');
    // Adjust slider (optional, just check if it works)
    await page.fill('input[type="range"]', '1700');
    await page.click('button:has-text("Continue")');

    // 3. Onboarding Preferences
    await expect(page).toHaveURL(/\/onboarding\/preferences/);
    await expect(page.locator('text=Your Preferences')).toBeVisible();
    
    // Select diet
    await page.click('button:has-text("Vegetarian")');
    // Toggle a meal
    await page.click('button:has-text("Snacks")');
    await page.click('button:has-text("Continue")');

    // 4. Onboarding Consents
    await expect(page).toHaveURL(/\/onboarding\/consents/);
    await expect(page.locator('text=Your Privacy')).toBeVisible();
    
    // Check required consents
    await page.check('input#privacy_policy');
    await page.check('input#terms_of_service');
    await page.click('button:has-text("Continue")');

    // 5. Optional Consents
    await expect(page).toHaveURL(/\/onboarding\/consents-optional/);
    await expect(page.locator('text=Optional: Help Us Improve')).toBeVisible();
    
    // Skip optional consents
    await page.click('button:has-text("Skip for now")');

    // 6. Complete
    await expect(page).toHaveURL(/\/onboarding\/complete/);
    await expect(page.locator('text=Welcome to CalorieTracker!')).toBeVisible();
    
    // Wait for auto-redirect or click button
    await page.click('button:has-text("Go to Dashboard")');

    // 7. Dashboard (Today)
    await expect(page).toHaveURL(/\/today/);
    await expect(page.locator('text=Calories today')).toBeVisible();
  });
});
