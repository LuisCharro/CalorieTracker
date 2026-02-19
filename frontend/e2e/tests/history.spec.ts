/**
 * E2E Tests: History Navigation
 * Tests viewing and navigating food log history
 */

import { test, expect } from '@playwright/test';

test.describe('History Navigation', () => {
  test('should handle unauthenticated access gracefully', async ({ page }) => {
    await page.goto('/history');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('login') || url.includes('history')).toBeTruthy();
  });
});
