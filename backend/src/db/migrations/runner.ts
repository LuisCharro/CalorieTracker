/**
 * Migration runner with version tracking
 * Supports rollback with documented policy
 */

import fs from 'fs/promises';
import path from 'path';
import { query, transaction } from '../pool.js';

// Migration metadata table name
const MIGRATIONS_TABLE = '_migrations';

/**
 * Initialize migrations table
 */
async function initMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checksum TEXT NOT NULL,
      rollback_available BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);
}

/**
 * Get all applied migrations
 */
async function getAppliedMigrations(): Promise<Map<string, { name: string; appliedAt: Date; checksum: string; rollbackAvailable: boolean }>> {
  const result = await query(`
    SELECT version, name, applied_at, checksum, rollback_available
    FROM ${MIGRATIONS_TABLE}
    ORDER BY id ASC
  `);

  const migrations = new Map();
  for (const row of result.rows) {
    migrations.set(row.version, {
      name: row.name,
      appliedAt: new Date(row.applied_at),
      checksum: row.checksum,
      rollbackAvailable: row.rollback_available,
    });
  }
  return migrations;
}

/**
 * Calculate checksum for a migration file
 */
async function calculateChecksum(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  // Simple checksum: character count and length (for MVP)
  // In production, use crypto.createHash('sha256')
  return Buffer.from(content).toString('base64').substring(0, 16);
}

/**
 * Get all migration files
 */
async function getMigrationFiles(): Promise<{ version: string; name: string; path: string }[]> {
  const migrationsDir = path.join(process.cwd(), 'src', 'db', 'migrations');
  const files = await fs.readdir(migrationsDir);
  
  return files
    .filter(f => f.endsWith('.sql') && f !== 'README.md')
    .sort()
    .map(f => {
      const parts = f.replace('.sql', '').split('_');
      const version = parts[0];
      const name = parts.slice(1).join('_');
      return { version, name, path: path.join(migrationsDir, f) };
    });
}

/**
 * Rollback policy documentation
 *
 * MVP ROLLBACK POLICY:
 *
 * 1. Schema changes (ALTER TABLE): Generally safe to rollback if no data migration occurred
 * 2. Data migrations: NOT reversible in MVP without explicit rollback script
 * 3. New tables: Safe to DROP in development, CAUTION in production
 * 4. Index changes: Safe to rollback (DROP INDEX / CREATE INDEX)
 *
 * PRODUCTION ROLLBACK RULES:
 * - Never rollback data migrations without explicit approval
 * - Use feature flags instead of destructive rollbacks
 * - Document rollback procedures for each migration
 * - Test rollback scripts in non-production first
 *
 * For this MVP, rollbacks are primarily for development convenience.
 * In production, prefer forward migrations over rollbacks.
 */

/**
 * Apply a single migration
 */
async function applyMigration(migration: { version: string; name: string; path: string }): Promise<void> {
  const content = await fs.readFile(migration.path, 'utf-8');
  const checksum = await calculateChecksum(migration.path);

  console.log(`Applying migration: ${migration.version}_${migration.name}`);

  await transaction(async (client) => {
    // Execute migration SQL
    await client.query(content);

    // Record migration
    await client.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (version, name, checksum, rollback_available)
       VALUES ($1, $2, $3, $4)`,
      [migration.version, migration.name, checksum, false] // Default to no rollback available
    );
  });

  console.log(`Migration applied: ${migration.version}_${migration.name}`);
}

/**
 * Run pending migrations
 */
export async function runMigrations(options: { dryRun?: boolean } = {}): Promise<void> {
  console.log('Starting migration runner...');
  
  await initMigrationsTable();
  
  const appliedMigrations = await getAppliedMigrations();
  const migrationFiles = await getMigrationFiles();
  
  let appliedCount = 0;
  
  for (const migration of migrationFiles) {
    if (!appliedMigrations.has(migration.version)) {
      if (options.dryRun) {
        console.log(`[DRY RUN] Would apply: ${migration.version}_${migration.name}`);
      } else {
        await applyMigration(migration);
        appliedCount++;
      }
    } else {
      console.log(`Skipping (already applied): ${migration.version}_${migration.name}`);
    }
  }

  if (options.dryRun) {
    console.log(`[DRY RUN] Would apply ${appliedCount} migration(s)`);
  } else {
    console.log(`Migration complete: ${appliedCount} migration(s) applied`);
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<void> {
  console.log('Migration status:');
  console.log('================');
  
  await initMigrationsTable();
  
  const appliedMigrations = await getAppliedMigrations();
  const migrationFiles = await getMigrationFiles();
  
  console.log(`\nApplied migrations: ${appliedMigrations.size}`);
  console.log(`Pending migrations: ${migrationFiles.length - appliedMigrations.size}\n`);
  
  console.log('Migration history:');
  for (const migration of migrationFiles) {
    const applied = appliedMigrations.get(migration.version);
    const status = applied ? `[APPLIED ${applied.appliedAt.toISOString()}]` : '[PENDING]';
    console.log(`  ${status} ${migration.version}_${migration.name}`);
  }
}

/**
 * Rollback policy: Not implemented in MVP
 * Use forward migrations instead
 */
export async function rollbackMigration(_version: string): Promise<void> {
  throw new Error('Rollback not supported in MVP. Use forward migrations instead. See rollback policy in runner.ts');
}
