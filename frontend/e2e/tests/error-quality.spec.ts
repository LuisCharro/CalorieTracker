import { test, expect } from '@playwright/test';

test.describe('Frontend Error Quality', () => {
  test('should show actionable error message when preferences save fails', async ({ page }) => {
    const timestamp = Date.now();
    const email = `err-test-${timestamp}@example.com`;
    const password = 'TestPass123!';

    // 1. Signup to reach onboarding
    await page.goto('/signup');
    await page.fill('input#email', email);
    await page.fill('input#displayName', 'Error Test');
    await page.fill('input#password', password);
    await page.fill('input#confirmPassword', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/onboarding\/goals/, { timeout: 15000 });
    await page.click('button:has-text("Continue")');

    await expect(page).toHaveURL(/\/onboarding\/preferences/);

    // Mock failure for the user update (which includes preferences)
    await page.route('**/api/auth/user/*', route => {
        if (route.request().method() === 'PATCH') {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    error: {
                        code: 'internal_error',
                        message: 'Database connection lost while saving preferences'
                    }
                })
            });
        } else {
            route.continue();
        }
    });

    // Try to continue
    await page.click('button:has-text("Continue")');

    // Should show the specific error message, not generic "Unable to connect"
    await expect(page.locator('text=Database connection lost while saving preferences')).toBeVisible();
    await expect(page.locator('text=Unable to connect')).not.toBeVisible();
  });
});
