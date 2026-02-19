/**
 * Database query result type helpers
 */

import { QueryResult } from 'pg';

/**
 * Helper to get typed rows from QueryResult
 */
export function getRows<T>(result: QueryResult<any>): T[] {
  return result.rows as T[];
}

/**
 * Helper to get a single typed row from QueryResult
 */
export function getRow<T>(result: QueryResult<any>): T | null {
  return (result.rows[0] as T) || null;
}

/**
 * Helper to get a single typed row or throw NotFoundError
 */
export function getRowOrThrow<T>(result: QueryResult<any>, resource: string, identifier: string): T {
  const row = getRow<T>(result);
  if (!row) {
    const error = new Error(`${resource} not found: ${identifier}`) as any;
    error.code = 'NOT_FOUND';
    throw error;
  }
  return row;
}

/**
 * Helper to get count from a COUNT(*) query
 */
export function getCount(result: QueryResult<any>): number {
  return parseInt(result.rows[0].total as string, 10);
}
