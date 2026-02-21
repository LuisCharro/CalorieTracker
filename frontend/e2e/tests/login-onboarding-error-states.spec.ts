import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Login and Onboarding Error States
 *
 * These tests verify that the frontend correctly renders
 * and handles various error scenarios during authentication and onboarding.
 */

test.describe('Login Error States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('should show invalid credentials error', async ({ page }) => {
    await page.getByTestId('email-input').fill('invalid@example.com');
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByTestId('login-button').click();

    // Navigate to error-state mock endpoint
    await page.goto('http://localhost:3000/login?error=invalid-credentials');

    // Verify error message is displayed
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Invalid email or password');

    // Verify retry option is available
    const retryButton = page.getByTestId('retry-button');
    await expect(retryButton).toBeVisible();
  });

  test('should show expired account error', async ({ page }) => {
    await page.getByTestId('email-input').fill('expired@example.com');
    await page.getByTestId('password-input').fill('password');
    await page.getByTestId('login-button').click();

    // Navigate to error-state mock endpoint
    await page.goto('http://localhost:3000/login?error=expired-account');

    // Verify error message is displayed
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Your account has expired');

    // Verify support contact is shown
    const supportContact = page.getByTestId('support-contact');
    await expect(supportContact).toBeVisible();
    await expect(supportContact).toContainText('support@example.com');
  });
});

test.describe('Onboarding Error States', () => {
  test.beforeEach(async ({ page, request }) => {
    // Start from onboarding preferences page
    await page.goto('http://localhost:3000/onboarding/preferences');
  });

  test('should show server error during preferences save', async ({ page }) => {
    // Fill preferences
    await page.getByTestId('timezone-select').selectOption('Europe/Zurich');
    await page.getByTestId('save-preferences-button').click();

    // Simulate server error (in real flow, this would come from API)
    await page.waitForURL('**/onboarding/preferences', { timeout: 5000 });

    // Verify error message is displayed
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Failed to save onboarding preferences');

    // Verify retry option is available
    const retryButton = page.getByTestId('retry-button');
    await expect(retryButton).toBeVisible();

    // Verify form data is preserved after error
    const timezoneSelect = page.getByTestId('timezone-select');
    await expect(timezoneSelect).toHaveValue('Europe/Zurich');
  });

  test('should show timeout error during consents submit', async ({ page }) => {
    // Navigate to consents page
    await page.goto('http://localhost:3000/onboarding/consents');

    // Accept consents
    await page.getByTestId('consent-privacy-policy').check();
    await page.getByTestId('consent-terms-of-service').check();
    await page.getByTestId('submit-consents-button').click();

    // Verify timeout message is shown
    await page.waitForTimeout(6000); // Wait for timeout

    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Request timed out');

    // Verify retry option is available
    const retryButton = page.getByTestId('retry-button');
    await expect(retryButton).toBeVisible();
  });

  test('should show network unavailable error during onboarding', async ({ page }) => {
    // Start from preferences page
    await page.goto('http://localhost:3000/onboarding/preferences');

    // Fill preferences
    await page.getByTestId('timezone-select').selectOption('Europe/Zurich');
    await page.getByTestId('save-preferences-button').click();

    // Simulate network error
    await page.waitForURL('**/onboarding/preferences', { timeout: 3000 });

    // Verify error message is displayed
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Unable to connect to the server');

    // Verify retryable indication
    const retryableBadge = page.getByTestId('retryable-badge');
    await expect(retryableBadge).toBeVisible();
  });
});

test.describe('Error Message Quality', () => {
  test('should show actionable error messages', async ({ page }) => {
    await page.goto('http://localhost:3000/login?error=invalid-credentials');

    const errorMessage = page.getByTestId('error-message');

    // Verify message is user-friendly (not technical)
    await expect(errorMessage).not.toContainText('SQL');
    await expect(errorMessage).not.toContainText('Exception');
    await expect(errorMessage).not.toContainText('Stack trace');

    // Verify message includes actionable guidance
    await expect(errorMessage).toContainText('try again');
  });

  test('should not expose internal error details in production', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding/preferences?error=internal');

    const errorMessage = page.getByTestId('error-message');

    // Verify sensitive details are not exposed
    await expect(errorMessage).not.toContainText('database');
    await expect(errorMessage).not.toContainText('file path');
    await expect(errorMessage).not.toContainText('internal server stack');
  });
});
