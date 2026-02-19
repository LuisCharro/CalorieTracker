/**
 * Jest configuration for CalorieTracker backend tests
 */

export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ES2022',
          moduleResolution: 'node',
        },
      },
    ],
    '^.+\\.js$': ['babel-jest'],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(pg)/)',
  ],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  // Only run unit tests and api-health by default
  // Note: auth-endpoints and logs-endpoints can be enabled when error handling is stable
  testPathIgnorePatterns: [
    '/node_modules/',
    'src/__tests__/integration/logs-endpoints.test.ts',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
};
