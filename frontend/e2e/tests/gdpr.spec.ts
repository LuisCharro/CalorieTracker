/**
 * E2E Tests: GDPR Features
 * Tests GDPR export request and account deletion flow
 */

import { test, expect } from '@playwright/test';

test.describe('GDPR Features', () => {
  test('should redirect to login for GDPR export when not authenticated', async ({ page }) => {
    await page.goto('/settings/gdpr/export');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login for GDPR delete when not authenticated', async ({ page }) => {
    await page.goto('/settings/gdpr/delete');
    await expect(page).toHaveURL('/login');
  });
});
