/**
 * Idempotency middleware
 * Ensures safe retry of requests using idempotency keys
 */

import { Request, Response, NextFunction } from 'express';
import { query } from '../../db/pool.js';
import { IdempotencyConflictError } from '../validation/schemas.js';

// Idempotency record table (created on first use)
const IDEMPOTENCY_TABLE = '_idempotency';

/**
 * Initialize idempotency table
 */
async function initIdempotencyTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS ${IDEMPOTENCY_TABLE} (
      idempotency_key TEXT PRIMARY KEY,
      response_status INTEGER NOT NULL,
      response_body JSONB NOT NULL,
      response_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Index for cleanup of old records
  await query(`
    CREATE INDEX IF NOT EXISTS idx_${IDEMPOTENCY_TABLE}_created_at
    ON ${IDEMPOTENCY_TABLE}(created_at)
  `);
}

/**
 * Extract idempotency key from request headers
 */
function extractIdempotencyKey(req: Request): string | null {
  const headerName = process.env.IDEMPOTENCY_KEY_HEADER || 'X-Idempotency-Key';
  const key = req.headers[headerName.toLowerCase()] as string;
  return key?.trim() || null;
}

/**
 * Check if idempotency key was already used
 */
async function checkIdempotency(key: string): Promise<{ status: number; body: unknown; headers: Record<string, string> } | null> {
  try {
    const result = await query(
      `SELECT response_status, response_body, response_headers
       FROM ${IDEMPOTENCY_TABLE}
       WHERE idempotency_key = $1`,
      [key]
    );

    if ((result as any).rows.length > 0) {
      const row = (result as any).rows[0];
      return {
        status: row.response_status,
        body: row.response_body,
        headers: row.response_headers,
      };
    }

    return null;
  } catch (error) {
    // If table doesn't exist yet, initialize it
    if ((error as any).code === '42P01') { // relation does not exist
      await initIdempotencyTable();
      return null;
    }
    throw error;
  }
}

/**
 * Store idempotency record
 */
async function storeIdempotency(
  key: string,
  status: number,
  body: unknown,
  headers: Record<string, string>
): Promise<void> {
  await initIdempotencyTable();

  await query(
    `INSERT INTO ${IDEMPOTENCY_TABLE} (idempotency_key, response_status, response_body, response_headers)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [key, status, JSON.stringify(body), JSON.stringify(headers)]
  );
}

/**
 * Middleware to handle idempotency for POST/PUT/PATCH requests
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only apply to non-GET, non-DELETE requests
  if (['GET', 'DELETE', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const key = extractIdempotencyKey(req);

  // If no idempotency key, proceed normally
  if (!key) {
    return next();
  }

  // Check if key was already used
  checkIdempotency(key)
    .then((cached) => {
      if (cached) {
        // Return cached response
        res.status(cached.status);
        if (cached.headers) {
          Object.entries(cached.headers).forEach(([name, value]) => {
            res.setHeader(name, value as string);
          });
        }
        res.json(cached.body);
      } else {
        // Attach idempotency handling to response
        attachIdempotencyHandler(res, key);
        next();
      }
    })
    .catch(next);
}

/**
 * Attach idempotency handler to response object
 */
function attachIdempotencyHandler(res: Response, key: string): void {
  const originalJson = res.json.bind(res);
  const originalStatus = res.status.bind(res);

  let capturedStatus = 200;
  let capturedBody: unknown = null;

  // Override status to capture status code
  res.status = function status(code: number) {
    capturedStatus = code;
    return originalStatus(code);
  };

  // Override json to capture body
  res.json = function json(body: unknown) {
    capturedBody = body;

    // Store idempotency record asynchronously
    const headers = res.getHeaders();
    const filteredHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        filteredHeaders[key] = value as string;
      }
    }
    storeIdempotency(key, capturedStatus, capturedBody, filteredHeaders)
      .catch((error) => {
        console.error('Failed to store idempotency record:', error);
      });

    // Send response
    return originalJson(body);
  };
}

/**
 * Cleanup old idempotency records (run periodically)
 * Retains records for 24 hours
 */
export async function cleanupOldIdempotencyRecords(): Promise<number> {
  const result = await query(
    `DELETE FROM ${IDEMPOTENCY_TABLE}
     WHERE created_at < NOW() - INTERVAL '24 hours'`
  );
  
  return (result as any).rowCount || 0;
}
