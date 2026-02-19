#!/usr/bin/env node
/**
 * Migration CLI runner
 * Usage: node scripts/migrate.ts [status|apply|dry-run]
 */

import dotenv from 'dotenv';
import { runMigrations, getMigrationStatus } from '../src/db/migrations/runner.js';

// Load environment variables
dotenv.config();

// Get command from arguments
const command = process.argv[2] || 'apply';

async function main() {
  try {
    switch (command) {
      case 'status':
        await getMigrationStatus();
        break;
      case 'apply':
        await runMigrations();
        break;
      case 'dry-run':
        await runMigrations({ dryRun: true });
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Usage: node scripts/migrate.ts [status|apply|dry-run]');
        process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
