/**
 * Notifications router
 * Handles in-app notifications listing and read status
 */

import { Router } from 'express';
import { query } from '../../db/pool.js';
import { validateParams, userIdSchema } from '../validation/schemas.js';

const router = Router();

/**
 * GET /api/notifications
 * List notifications for a user with pagination and filtering
 */
router.get('/', async (req, res) => {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
  const read = req.query.read;

  const offset = (page - 1) * pageSize;

  let whereClauses = ['user_id = $1'];
  let queryParams: unknown[] = [userId];
  let paramIndex = 2;

  if (read !== undefined) {
    whereClauses.push(`read = $${paramIndex++}`);
    queryParams.push(read === 'true');
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM notifications
     WHERE ${whereClauses.join(' AND ')}`,
    queryParams
  );

  const total = parseInt(countResult.rows[0].total, 10);

  // Get paginated results
  const result = await query(
    `SELECT id, user_id, type, title, body, data, read, read_at, created_at
     FROM notifications
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...queryParams, pageSize, offset]
  );

  const totalPages = Math.ceil(total / pageSize);

  res.json({
    success: true,
    data: result.rows,
    meta: {
      timestamp: new Date().toISOString(),
      page,
      pageSize,
      total,
      totalPages,
    },
  });
});

/**
 * PUT /api/notifications/:notificationId/read
 * Mark a notification as read
 */
router.put('/:notificationId/read', async (req, res) => {
  const { notificationId } = req.params;

  if (!notificationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Invalid notificationId format',
      },
    });
  }

  const result = await query(
    `UPDATE notifications
     SET read = TRUE, read_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, type, title, body, data, read, read_at, created_at`,
    [notificationId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'not_found',
        message: 'Notification not found',
      },
    });
  }

  res.json({
    success: true,
    data: result.rows[0],
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications for a user as read
 */
router.put('/mark-all-read', async (req, res) => {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'userId is required',
      },
    });
  }

  const result = await query(
    `UPDATE notifications
     SET read = TRUE, read_at = NOW()
     WHERE user_id = $1 AND read = FALSE
     RETURNING id`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      count: result.rows.length,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * DELETE /api/notifications/:notificationId
 * Delete a notification
 */
router.delete('/:notificationId', async (req, res) => {
  const { notificationId } = req.params;

  if (!notificationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Invalid notificationId format',
      },
    });
  }

  const result = await query(
    `DELETE FROM notifications
     WHERE id = $1
     RETURNING id`,
    [notificationId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'not_found',
        message: 'Notification not found',
      },
    });
  }

  res.json({
    success: true,
    data: {
      id: notificationId,
      deleted: true,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
