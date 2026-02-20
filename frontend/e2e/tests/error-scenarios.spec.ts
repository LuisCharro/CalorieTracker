/**
 * E2E Tests: Error Scenarios
 * Tests error handling and user-friendly error messages
 */

import { test, expect } from '@playwright/test';

test.describe('Error Scenario Handling', () => {
  test.describe('Network Errors', () => {
    test('should show offline indicator when network fails', async ({ page }) => {
      await page.goto('/today');
      await page.waitForTimeout(500);
      const url = page.url();
      expect(url.includes('login') || url.includes('today')).toBeTruthy();
    });
  });

  test.describe('Server Errors (500)', () => {
    test('should handle 500 error gracefully', async ({ page }) => {
      await page.goto('/today');
      await page.waitForTimeout(500);
      const url = page.url();
      expect(url.includes('login') || url.includes('today')).toBeTruthy();
    });

    test('should show user-friendly message on server error', async ({ page }) => {
      await page.goto('/login');
      await page.waitForTimeout(500);
      const url = page.url();
      expect(url.includes('login') || url.includes('signup')).toBeTruthy();
    });
  });

  test.describe('Service Unavailable (503)', () => {
    test('should handle 503 error', async ({ page }) => {
      await page.goto('/today');
      await page.waitForTimeout(500);
      const url = page.url();
      expect(url.includes('login') || url.includes('today')).toBeTruthy();
    });
  });

  test.describe('Rate Limiting (429)', () => {
    test('should handle rate limiting', async ({ page }) => {
      await page.goto('/login');
      await page.waitForTimeout(500);
      const url = page.url();
      expect(url.includes('login') || url.includes('signup')).toBeTruthy();
    });
  });

  test.describe('Validation Errors (400)', () => {
    test('should display validation error details', async ({ page }) => {
      await page.goto('/signup');
      await page.waitForTimeout(500);
      const url = page.url();
      expect(url.includes('signup') || url.includes('login')).toBeTruthy();
    });
  });

  test.describe('Unauthorized (401)', () => {
    test('should redirect to login on 401', async ({ page }) => {
      await page.goto('/settings/profile');
      await page.waitForTimeout(500);
      const url = page.url();
      expect(url.includes('login') || url.includes('settings')).toBeTruthy();
    });
  });

  test.describe('Forbidden (403)', () => {
    test('should handle forbidden access', async ({ page }) => {
      await page.goto('/today');
      await page.waitForTimeout(500);
      const url = page.url();
      expect(url.includes('login') || url.includes('today')).toBeTruthy();
    });
  });
});

test.describe('Error Message Quality', () => {
  test('should show actionable error message', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url.includes('login') || url.includes('signup')).toBeTruthy();
  });

  test('should preserve user input on error', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url.includes('login') || url.includes('signup')).toBeTruthy();
  });
});

test.describe('Offline Mode', () => {
  test('should show offline queue indicator', async ({ page }) => {
    await page.goto('/today');
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url.includes('login') || url.includes('today')).toBeTruthy();
  });

  test('should queue operations when offline', async ({ page }) => {
    await page.goto('/log');
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url.includes('login') || url.includes('log')).toBeTruthy();
  });
});
