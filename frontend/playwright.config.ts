import { defineConfig, devices } from '@playwright/test';
import os from 'os';

const useMock = process.env.E2E_USE_MOCK === 'true';

const getLocalIp = (): string => {
  const interfaces = os.networkInterfaces();
  for (const [name, iface] of Object.entries(interfaces)) {
    if (!iface) continue;
    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal && (name === 'en0' || name === 'en1')) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

const localIp = getLocalIp();
const defaultBaseUrl = `http://${localIp}:3000`;
const defaultApiUrl = `http://${localIp}:4000`;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: useMock ? 'list' : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || defaultBaseUrl,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Only run firefox/webkit when not in mock mode (they're slower)
    ...(useMock ? [] : [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ]),
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `NEXT_PUBLIC_API_URL=${defaultApiUrl} npm run dev -- --hostname 0.0.0.0 --port 3000`,
    url: defaultBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_API_URL: defaultApiUrl,
    },
  },
});
