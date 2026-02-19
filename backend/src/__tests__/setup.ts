/**
 * Test setup and utilities
 */

import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import { closePool } from '../db/pool.js';

// Load environment variables for tests (favor .env.local)
const envBase = path.resolve(__dirname, '../..');
const envLocalPath = path.join(envBase, '.env.local');
dotenv.config({ path: envLocalPath });

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(envBase, '.env') });
}

// Test database pool
let testPool: Pool | null = null;

export function getTestPool(): Pool {
  if (!testPool) {
    const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('TEST_DATABASE_URL or DATABASE_URL environment variable is not set');
    }
    testPool = new Pool({
      connectionString,
      max: 5,
    });
  }
  return testPool;
}

export async function cleanupTestDatabase(): Promise<void> {
  const pool = getTestPool();
  
  // Clean up tables in correct order (respecting foreign keys)
  const tables = [
    'security_events',
    'processing_activities',
    'gdpr_requests',
    'consent_history',
    'notification_settings',
    'food_logs',
    'goals',
    'users',
    '_migrations',
    '_idempotency',
  ];

  for (const table of tables) {
    try {
      await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
    } catch (error) {
      // Ignore errors if table doesn't exist
      if ((error as any).code !== '42P01') {
        console.warn(`Warning: Failed to truncate ${table}:`, error);
      }
    }
  }
}

export async function closeTestPool(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

// Global test setup
beforeAll(async () => {
  // Initialize test database
  console.log('Setting up test database...');
});

afterAll(async () => {
  await closeTestPool();
  await closePool();
});

beforeEach(async () => {
  // Only cleanup if database URL is configured (skip for pure unit tests)
  const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (connectionString) {
    await cleanupTestDatabase();
  }
});
