/**
 * Test Mode Helper
 * Conditionally enables error-simulation endpoints for testing
 */

export const isTestMode = (): boolean => {
  const env = process.env.NODE_ENV;
  return (
    env === 'test' ||
    env === 'development' ||
    process.env.ENABLE_TEST_ENDPOINTS === 'true'
  );
};

export const shouldEnableErrorSimulation = (): boolean => {
  return isTestMode() && process.env.DISABLE_ERROR_SIMULATION !== 'true';
};

export const getTestModeConfig = () => ({
  isTestMode: isTestMode(),
  enableErrorSimulation: shouldEnableErrorSimulation(),
  enableSlowResponses: process.env.ENABLE_SLOW_RESPONSES === 'true',
  defaultTimeout: parseInt(process.env.TEST_TIMEOUT_MS || '5000', 10),
});

export const testModeConfig = getTestModeConfig();
