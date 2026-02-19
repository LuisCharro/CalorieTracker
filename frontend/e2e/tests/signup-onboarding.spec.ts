/**
 * E2E Tests: Signup and Onboarding Flow
 * Tier A: Frontend-only checks (fast, no backend needed)
 * Tier B: Full-stack critical flow tests (require backend)
 */

import { test, expect } from '@playwright/test';

test.describe('Tier A: Frontend UI Validation', () => {
  test('should show signup form with all fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#displayName')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();
  });

  test('should show password mismatch error', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#displayName', 'Test User');
    await page.fill('input#password', 'TestPassword123!');
    await page.fill('input#confirmPassword', 'DifferentPassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should show password min length error', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#displayName', 'Test User');
    await page.fill('input#password', 'short');
    await page.fill('input#confirmPassword', 'short');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/signup');
    await page.click('a:has-text("Sign in")');
    await expect(page).toHaveURL('/login');
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });

  test('should show onboarding goals page structure', async ({ page }) => {
    await page.goto('/onboarding/goals');
    await expect(page.locator('text=Set Your Goals')).toBeVisible();
  });

  test('should show onboarding preferences page structure', async ({ page }) => {
    await page.goto('/onboarding/preferences');
    await expect(page.locator('text=Your Preferences')).toBeVisible();
  });

  test('should show onboarding consents page structure', async ({ page }) => {
    await page.goto('/onboarding/consents');
    await expect(page.locator('text=Your Privacy')).toBeVisible();
  });

  test('should show onboarding consents-optional page structure', async ({ page }) => {
    await page.goto('/onboarding/consents-optional');
    await expect(page.getByRole('heading', { name: 'Optional: Help Us Improve' })).toBeVisible();
  });
});

test.describe('Tier B: Full-Stack Critical Flow', () => {
  test('should complete signup and reach onboarding', async ({ page }) => {
    const timestamp = Date.now();
    const email = `flow-test-${timestamp}@example.com`;
    const password = 'TestPass123!';

    await page.goto('/signup');
    await page.fill('input#email', email);
    await page.fill('input#displayName', 'Flow Test');
    await page.fill('input#password', password);
    await page.fill('input#confirmPassword', password);
    await page.click('button[type="submit"]');

    // Should redirect to onboarding goals
    await expect(page).toHaveURL(/\/onboarding\/goals/, { timeout: 15000 });
    await expect(page.locator('text=Set Your Goals')).toBeVisible();
  });

  test('should show conflict error for duplicate signup', async ({ page }) => {
    const timestamp = Date.now();
    const email = `dup-test-${timestamp}@example.com`;
    const password = 'TestPass123!';

    // First signup
    await page.goto('/signup');
    await page.fill('input#email', email);
    await page.fill('input#displayName', 'Test');
    await page.fill('input#password', password);
    await page.fill('input#confirmPassword', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/onboarding\/goals/, { timeout: 15000 });

    // Go back and try same email
    await page.goto('/signup');
    await page.fill('input#email', email);
    await page.fill('input#displayName', 'Test2');
    await page.fill('input#password', password);
    await page.fill('input#confirmPassword', password);
    await page.click('button[type="submit"]');

    // Should show specific error message
    await expect(page.locator('text=User with this email already exists')).toBeVisible();
    await expect(page.locator('text=Unable to connect')).not.toBeVisible();
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'nonexistent@example.com');
    await page.fill('input#password', 'SomePass123!');
    await page.click('button[type="submit"]');

    // Should show specific error message
    await expect(page.getByText(/user not found|invalid credentials|no account/i)).toBeVisible();
    await expect(page.locator('text=Unable to connect')).not.toBeVisible();
  });
});
