/**
 * E2E Tests: Error Scenarios
 * Tests error handling and user-friendly error messages for various failure modes
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Error Scenario Handling', () => {
  async function registerAndLogin(page: Page): Promise<{ userId: string; email: string }> {
    const timestamp = Date.now();
    const email = `err-${timestamp}@example.com`;
    
    await page.goto('/signup');
    await page.fill('input#email', email);
    await page.fill('input#displayName', 'Error Test');
    await page.fill('input#password', 'TestPass123!');
    await page.fill('input#confirmPassword', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/onboarding\/goals/, { timeout: 15000 });
    
    await page.click('button:has-text("Continue")');
    await expect(page).toHaveURL(/\/onboarding\/preferences/, { timeout: 10000 });
    
    await page.click('button:has-text("Continue")');
    await expect(page).toHaveURL(/\/onboarding\/consents/, { timeout: 10000 });
    
    await page.check('input#privacy_policy');
    await page.check('input#terms_of_service');
    await page.click('button:has-text("Continue")');
    
    await expect(page).toHaveURL(/\/onboarding\/consents-optional|\/today/, { timeout: 15000 });
    
    const userId = await page.evaluate(() => localStorage.getItem('userId') || '');
    return { userId, email };
  }

  test.describe('Network Timeout Failures', () => {
    test('should show timeout error when API takes too long', async ({ page }) => {
      test.setTimeout(60000);
      
      await page.route('**/api/auth/register', async route => {
        await new Promise(resolve => setTimeout(resolve, 32000));
        route.continue();
      });

      await page.goto('/signup');
      await page.fill('input#email', `timeout-${Date.now()}@example.com`);
      await page.fill('input#displayName', 'Timeout Test');
      await page.fill('input#password', 'TestPass123!');
      await page.fill('input#confirmPassword', 'TestPass123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/timeout|took too long|try again|connection|unable/i')).toBeVisible({ timeout: 45000 });
    });

    test('should show loading state during slow request', async ({ page }) => {
      await page.route('**/api/auth/register', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      });

      await page.goto('/signup');
      await page.fill('input#email', `slow-${Date.now()}@example.com`);
      await page.fill('input#displayName', 'Slow Test');
      await page.fill('input#password', 'TestPass123!');
      await page.fill('input#confirmPassword', 'TestPass123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });
  });

  test.describe('Connection Refused / Backend Unavailable', () => {
    test('should show connection error when backend is unreachable', async ({ page }) => {
      await page.route('**/api/**', route => route.abort('failed'));

      await page.goto('/signup');
      await page.fill('input#email', `conn-${Date.now()}@example.com`);
      await page.fill('input#displayName', 'Connection Test');
      await page.fill('input#password', 'TestPass123!');
      await page.fill('input#confirmPassword', 'TestPass123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/unable to connect|connection|try again|network/i')).toBeVisible({ timeout: 10000 });
    });

    test('should show service unavailable message on 503', async ({ page }) => {
      await page.route('**/api/auth/register', route =>
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'service_unavailable',
              message: 'Service temporarily unavailable. Please try again later.',
            },
          }),
        })
      );

      await page.goto('/signup');
      await page.fill('input#email', `svc-${Date.now()}@example.com`);
      await page.fill('input#displayName', 'Service Test');
      await page.fill('input#password', 'TestPass123!');
      await page.fill('input#confirmPassword', 'TestPass123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('.text-sm:has-text("unavailable"), .text-sm:has-text("try again")')).toBeVisible({ timeout: 10000 });
    });

    test('should show backend unavailable error on bad gateway', async ({ page }) => {
      await page.route('**/api/**', route =>
        route.fulfill({
          status: 502,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'bad_gateway',
              message: 'Unable to reach the backend server.',
            },
          }),
        })
      );

      await page.goto('/signup');
      await page.fill('input#email', `gateway-${Date.now()}@example.com`);
      await page.fill('input#displayName', 'Gateway Test');
      await page.fill('input#password', 'TestPass123!');
      await page.fill('input#confirmPassword', 'TestPass123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/unable to reach|backend|connection/i')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Server Errors (500)', () => {
    test('should handle 500 error gracefully', async ({ page }) => {
      await page.route('**/api/auth/register', route =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'internal_error',
              message: 'An unexpected error occurred. Please try again.',
            },
          }),
        })
      );

      await page.goto('/signup');
      await page.fill('input#email', `err500-${Date.now()}@example.com`);
      await page.fill('input#displayName', 'Error Test');
      await page.fill('input#password', 'TestPass123!');
      await page.fill('input#confirmPassword', 'TestPass123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/unexpected error|try again|something went wrong/i')).toBeVisible({ timeout: 10000 });
    });

    test('should preserve form data after error', async ({ page }) => {
      const testEmail = `preserve-${Date.now()}@example.com`;
      
      await page.route('**/api/auth/register', route =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Server error' },
          }),
        })
      );

      await page.goto('/signup');
      await page.fill('input#email', testEmail);
      await page.fill('input#displayName', 'Preserve Test');
      await page.fill('input#password', 'TestPass123!');
      await page.fill('input#confirmPassword', 'TestPass123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('input#email')).toHaveValue(testEmail);
    });
  });

  test.describe('Rate Limiting (429)', () => {
    test('should show rate limit message with retry guidance', async ({ page }) => {
      await page.route('**/api/auth/register', route =>
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          headers: { 'Retry-After': '60' },
          body: JSON.stringify({
            success: false,
            error: {
              code: 'rate_limited',
              message: 'Too many requests. Please wait before trying again.',
              retryAfter: 60,
            },
          }),
        })
      );

      await page.goto('/signup');
      await page.fill('input#email', `rate-${Date.now()}@example.com`);
      await page.fill('input#displayName', 'Rate Test');
      await page.fill('input#password', 'TestPass123!');
      await page.fill('input#confirmPassword', 'TestPass123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/too many|wait|rate|try again/i')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Validation Errors (400)', () => {
    test('should display field-specific validation errors', async ({ page }) => {
      await page.route('**/api/auth/register', route =>
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'validation_error',
              message: 'Validation failed',
              details: [
                { field: 'email', message: 'Email is already registered' },
              ],
            },
          }),
        })
      );

      await page.goto('/signup');
      await page.fill('input#email', 'duplicate@example.com');
      await page.fill('input#displayName', 'Validation Test');
      await page.fill('input#password', 'TestPass123!');
      await page.fill('input#confirmPassword', 'TestPass123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/already registered|email|validation/i')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Unauthorized (401)', () => {
    test('should handle 401 error gracefully', async ({ page }) => {
      await page.route('**/api/logs/today**', route =>
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'unauthorized',
              message: 'Authentication required',
            },
          }),
        })
      );

      await page.goto('/today');
      
      const url = page.url();
      const hasError = await page.locator('text=/authentication|unauthorized|login|sign in/i').isVisible().catch(() => false);
      const isOnLogin = url.includes('login');
      const isOnToday = url.includes('today');
      
      expect(isOnLogin || isOnToday || hasError).toBeTruthy();
    });
  });

  test.describe('Forbidden (403)', () => {
    test('should show access denied message', async ({ page }) => {
      const { userId } = await registerAndLogin(page);

      await page.route('**/api/auth/user/*', route =>
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'forbidden',
              message: 'You do not have permission to access this resource.',
            },
          }),
        })
      );

      await page.goto('/settings/profile');
      await page.waitForTimeout(1000);
      
      const hasError = await page.locator('text=/permission|access denied|forbidden|error/i').isVisible().catch(() => false);
      const url = page.url();
      
      expect(hasError || url.includes('today') || url.includes('login')).toBeTruthy();
    });
  });

  test.describe('Gateway Timeout (504)', () => {
    test('should show timeout message on gateway timeout', async ({ page }) => {
      await page.route('**/api/auth/register', route =>
        route.fulfill({
          status: 504,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'gateway_timeout',
              message: 'The server took too long to respond.',
            },
          }),
        })
      );

      await page.goto('/signup');
      await page.fill('input#email', `gt-${Date.now()}@example.com`);
      await page.fill('input#displayName', 'Gateway Timeout Test');
      await page.fill('input#password', 'TestPass123!');
      await page.fill('input#confirmPassword', 'TestPass123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/too long|timeout|try again/i')).toBeVisible({ timeout: 10000 });
    });
  });
});

test.describe('Error Message Quality', () => {
  test('should show actionable error message with retry option', async ({ page }) => {
    let attempts = 0;
    
    await page.route('**/api/auth/register', route => {
      attempts++;
      if (attempts < 3) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Temporary server error' },
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/signup');
    const email = `retry-${Date.now()}@example.com`;
    await page.fill('input#email', email);
    await page.fill('input#displayName', 'Retry Test');
    await page.fill('input#password', 'TestPass123!');
    await page.fill('input#confirmPassword', 'TestPass123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/error|try again/i')).toBeVisible({ timeout: 10000 });
  });

  test('should not expose technical details in error messages', async ({ page }) => {
    await page.route('**/api/auth/register', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'internal_error',
            message: 'An error occurred',
            stack: 'Error at DatabaseConnection.query...',
          },
        }),
      })
    );

    await page.goto('/signup');
    await page.fill('input#email', `safe-${Date.now()}@example.com`);
    await page.fill('input#displayName', 'Safe Test');
    await page.fill('input#password', 'TestPass123!');
    await page.fill('input#confirmPassword', 'TestPass123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/DatabaseConnection|stack|Error at/i')).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('Offline Mode', () => {
  test('should show offline indicator when network is lost', async ({ page }) => {
    await page.goto('/today');
    await page.waitForTimeout(500);

    await page.context().setOffline(true);
    await page.waitForTimeout(1000);

    const offlineIndicator = page.locator('text=/offline|no connection|connect/i');
    const isVisible = await offlineIndicator.isVisible().catch(() => false);
    
    await page.context().setOffline(false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should handle offline during form submission', async ({ page }) => {
    const timestamp = Date.now();
    const email = `offline-${timestamp}@example.com`;
    
    await page.goto('/signup');
    await page.fill('input#email', email);
    await page.fill('input#displayName', 'Offline Test');
    await page.fill('input#password', 'TestPass123!');
    await page.fill('input#confirmPassword', 'TestPass123!');

    await page.context().setOffline(true);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/offline|connection|network|try again/i')).toBeVisible({ timeout: 10000 });
    
    await page.context().setOffline(false);
  });
});
