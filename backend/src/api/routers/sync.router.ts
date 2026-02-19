/**
 * Sync router
 * Handles offline write queue and sync operations
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';
import { validateBody, validateParams, NotFoundError, userIdSchema } from '../validation/schemas.js';

const router = Router();

interface OfflineOperation {
  operationId?: string;
  type: 'create_log' | 'update_log' | 'delete_log';
  data: Record<string, unknown>;
  timestamp: string;
}

interface OfflineQueueRequest {
  operations: OfflineOperation[];
  userId: string;
}

interface SyncSnapshot {
  userId: string;
  foodLogs: Array<{
    id: string;
    foodName: string;
    brandName: string | null;
    quantity: number;
    unit: string;
    mealType: string;
    nutrition: Record<string, number>;
    loggedAt: string;
    updatedAt: string;
  }>;
  lastSyncedAt: string;
}

/**
 * POST /api/sync/offline-queue
 * Process offline operations from client queue
 */
router.post('/offline-queue', async (req, res) => {
  const { operations, userId } = req.body;

  if (!userId || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Valid userId is required',
      },
    });
  }

  if (!Array.isArray(operations) || operations.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'operations must be a non-empty array',
      },
    });
  }

  // Sort operations by timestamp
  const sortedOperations = [...operations].sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  const results: Array<{
    operationId?: string;
    type: string;
    data: Record<string, unknown>;
    status: 'success' | 'conflict' | 'error';
    error?: string;
    serverData?: Record<string, unknown>;
  }> = [];

  for (const operation of sortedOperations) {
    try {
      switch (operation.type) {
        case 'create_log': {
          const { food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at } = operation.data;

          // Validate required fields
          if (!food_name || !quantity || !unit || !meal_type || !nutrition) {
            results.push({
              operationId: operation.operationId,
              type: operation.type,
              data: operation.data,
              status: 'error',
              error: 'Missing required fields',
            });
            continue;
          }

          const logId = uuidv4();
          const loggedAt = logged_at ? new Date(logged_at) : new Date();

          const result = await query(
            `INSERT INTO food_logs (id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at, is_deleted)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), FALSE)
             RETURNING *`,
            [logId, userId, food_name, brand_name || null, quantity, unit, meal_type, JSON.stringify(nutrition), loggedAt]
          );

          results.push({
            operationId: operation.operationId,
            type: operation.type,
            data: operation.data,
            status: 'success',
            serverData: result.rows[0],
          });
          break;
        }

        case 'update_log': {
          const { id, ...updateData } = operation.data;

          if (!id) {
            results.push({
              operationId: operation.operationId,
              type: operation.type,
              data: operation.data,
              status: 'error',
              error: 'Missing log id',
            });
            continue;
          }

          // Check if log exists and belongs to user
          const existing = await query(
            `SELECT * FROM food_logs WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE`,
            [id, userId]
          );

          if (existing.rows.length === 0) {
            results.push({
              operationId: operation.operationId,
              type: operation.type,
              data: operation.data,
              status: 'conflict',
              error: 'Log not found or already deleted',
            });
            continue;
          }

          // Check for conflicts: if server version updated after client version
          const clientTimestamp = new Date(operation.timestamp);
          const serverUpdatedAt = new Date(existing.rows[0].updated_at);

          if (serverUpdatedAt > clientTimestamp) {
            results.push({
              operationId: operation.operationId,
              type: operation.type,
              data: operation.data,
              status: 'conflict',
              error: 'Server version is newer',
              serverData: existing.rows[0],
            });
            continue;
          }

          // Build update query
          const updates: string[] = [];
          const values: unknown[] = [];
          let paramIndex = 1;

          if (updateData.food_name) {
            updates.push(`food_name = $${paramIndex++}`);
            values.push(updateData.food_name);
          }
          if (updateData.brand_name !== undefined) {
            updates.push(`brand_name = $${paramIndex++}`);
            values.push(updateData.brand_name || null);
          }
          if (updateData.quantity) {
            updates.push(`quantity = $${paramIndex++}`);
            values.push(updateData.quantity);
          }
          if (updateData.unit) {
            updates.push(`unit = $${paramIndex++}`);
            values.push(updateData.unit);
          }
          if (updateData.meal_type) {
            updates.push(`meal_type = $${paramIndex++}`);
            values.push(updateData.meal_type);
          }
          if (updateData.nutrition) {
            updates.push(`nutrition = $${paramIndex++}`);
            values.push(JSON.stringify(updateData.nutrition));
          }
          if (updateData.logged_at) {
            updates.push(`logged_at = $${paramIndex++}`);
            values.push(updateData.logged_at);
          }

          updates.push(`updated_at = NOW()`);
          values.push(id, userId);

          const result = await query(
            `UPDATE food_logs
             SET ${updates.join(', ')}
             WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} AND is_deleted = FALSE
             RETURNING *`,
            values
          );

          results.push({
            operationId: operation.operationId,
            type: operation.type,
            data: operation.data,
            status: 'success',
            serverData: result.rows[0],
          });
          break;
        }

        case 'delete_log': {
          const { id } = operation.data;

          if (!id) {
            results.push({
              operationId: operation.operationId,
              type: operation.type,
              data: operation.data,
              status: 'error',
              error: 'Missing log id',
            });
            continue;
          }

          // Check if log exists and belongs to user
          const existing = await query(
            `SELECT * FROM food_logs WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE`,
            [id, userId]
          );

          if (existing.rows.length === 0) {
            results.push({
              operationId: operation.operationId,
              type: operation.type,
              data: operation.data,
              status: 'conflict',
              error: 'Log not found or already deleted',
            });
            continue;
          }

          // Soft delete
          await query(
            `UPDATE food_logs
             SET is_deleted = TRUE, updated_at = NOW()
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
          );

          results.push({
            operationId: operation.operationId,
            type: operation.type,
            data: operation.data,
            status: 'success',
          });
          break;
        }

        default:
          results.push({
            operationId: operation.operationId,
            type: operation.type,
            data: operation.data,
            status: 'error',
            error: `Unknown operation type: ${operation.type}`,
          });
      }
    } catch (error) {
      console.error(`[Sync] Error processing operation:`, error);
      results.push({
        operationId: operation.operationId,
        type: operation.type,
        data: operation.data,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const successCount = results.filter(r => r.status === 'success').length;
  const conflictCount = results.filter(r => r.status === 'conflict').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  res.json({
    success: true,
    data: {
      results,
      summary: {
        total: results.length,
        success: successCount,
        conflicts: conflictCount,
        errors: errorCount,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/sync/user/:userId/snapshot
 * Get current user data snapshot for conflict resolution
 */
router.get('/user/:userId/snapshot', async (req, res) => {
  const { userId } = validateParams(userIdSchema, req.params);

  // Get all food logs for the user
  const logsResult = await query(
    `SELECT id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, updated_at
     FROM food_logs
     WHERE user_id = $1 AND is_deleted = FALSE
     ORDER BY logged_at DESC`,
    [userId]
  );

  const snapshot: SyncSnapshot = {
    userId,
    foodLogs: logsResult.rows.map(row => ({
      id: row.id,
      foodName: row.food_name,
      brandName: row.brand_name,
      quantity: parseFloat(row.quantity),
      unit: row.unit,
      mealType: row.meal_type,
      nutrition: row.nutrition,
      loggedAt: row.logged_at,
      updatedAt: row.updated_at,
    })),
    lastSyncedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: snapshot,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
