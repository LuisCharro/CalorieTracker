#!/usr/bin/env node
/**
 * Seed data CLI runner
 * Usage: node scripts/seed.ts
 */

import dotenv from 'dotenv';
import { query } from '../src/db/pool.js';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('Starting seed data insertion...');

  try {
    const seedPath = path.join(process.cwd(), 'src', 'db', 'seeds', 'seed_dev.sql');
    const seedContent = await fs.readFile(seedPath, 'utf-8');
    
    // Split into individual statements
    const statements = seedContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await query(statement);
      } catch (error) {
        // Ignore constraint violations (ON CONFLICT DO NOTHING)
        if ((error as any).code !== '23505') {
          console.error('Error executing statement:', error);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('Seed data insertion complete');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

main();
