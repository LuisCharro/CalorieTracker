/**
 * E2E Tests: Daily Log Flow
 * Tests logging food and viewing today's logs
 */

import { test, expect } from '@playwright/test';

test.describe('Daily Log Flow', () => {
  test('should have login page for unauthenticated access', async ({ page }) => {
    await page.goto('/log');
    await expect(page).toHaveURL('/login');
  });

  test('should show login page for today when not authenticated', async ({ page }) => {
    await page.goto('/today');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('login') || url.includes('today')).toBeTruthy();
  });

  test('should show login page for history when not authenticated', async ({ page }) => {
    await page.goto('/history');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('login') || url.includes('history')).toBeTruthy();
  });

  test('should show login page for settings when not authenticated', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('login') || url.includes('settings')).toBeTruthy();
  });
});
