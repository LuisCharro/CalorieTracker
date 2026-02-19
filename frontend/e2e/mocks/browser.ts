/**
 * MSW Setup for E2E Tests
 * This file sets up the mock server for E2E tests
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
