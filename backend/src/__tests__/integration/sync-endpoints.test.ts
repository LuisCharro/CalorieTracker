/**
 * Unit tests for offline queue / sync endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';
import request from 'supertest';
import app from '../../api/server.js';

describe('Offline Queue / Sync Endpoints', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create a test user
    testUserId = uuidv4();
    await query(
      `INSERT INTO users (id, email, display_name, preferences, onboarding_complete, is_deleted)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [testUserId, 'test@example.com', 'Test User', '{}', true, false]
    );
  });

  afterEach(async () => {
    // Clean up test data
    await query(`DELETE FROM food_logs WHERE user_id = $1`, [testUserId]);
    await query(`DELETE FROM users WHERE id = $1`, [testUserId]);
  });

  describe('POST /api/sync/offline-queue', () => {
    it('should handle invalid userId', async () => {
      const response = await request(app)
        .post('/api/sync/offline-queue')
        .send({
          userId: 'invalid-uuid',
          operations: [],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should handle missing operations array', async () => {
      const response = await request(app)
        .post('/api/sync/offline-queue')
        .send({
          userId: testUserId,
          operations: null,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should handle empty operations array', async () => {
      const response = await request(app)
        .post('/api/sync/offline-queue')
        .send({
          userId: testUserId,
          operations: [],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should create food log', async () => {
      const operations = [
        {
          type: 'create_log',
          data: {
            food_name: 'Apple',
            brand_name: 'Generic',
            quantity: 150,
            unit: 'g',
            meal_type: 'snack',
            nutrition: {
              calories: 78,
              protein: 0.3,
              carbohydrates: 21,
              fat: 0.3,
            },
            logged_at: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        },
      ];

      const response = await request(app)
        .post('/api/sync/offline-queue')
        .send({
          userId: testUserId,
          operations,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toEqual({
        total: 1,
        success: 1,
        conflicts: 0,
        errors: 0,
      });
      expect(response.body.data.results[0].status).toBe('success');

      // Verify log was created
      const result = await query(
        `SELECT * FROM food_logs WHERE user_id = $1 AND is_deleted = FALSE`,
        [testUserId]
      );
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].food_name).toBe('Apple');
    });

    it('should update food log', async () => {
      // Create a food log first
      const logId = uuidv4();
      await query(
        `INSERT INTO food_logs (id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, is_deleted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [logId, testUserId, 'Apple', 'Generic', 150, 'g', 'snack', '{"calories": 78}', new Date(), false]
      );

      const operations = [
        {
          type: 'update_log',
          data: {
            id: logId,
            food_name: 'Green Apple',
            quantity: 200,
          },
          timestamp: new Date(Date.now() + 1000).toISOString(), // Future timestamp
        },
      ];

      const response = await request(app)
        .post('/api/sync/offline-queue')
        .send({
          userId: testUserId,
          operations,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.success).toBe(1);

      // Verify log was updated
      const result = await query(
        `SELECT * FROM food_logs WHERE id = $1`,
        [logId]
      );
      expect(result.rows[0].food_name).toBe('Green Apple');
      expect(parseFloat(result.rows[0].quantity)).toBe(200);
    });

    it('should detect conflict on update (server version newer)', async () => {
      // Create a food log first
      const logId = uuidv4();
      const oldDate = new Date(Date.now() - 10000);
      await query(
        `INSERT INTO food_logs (id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, updated_at, is_deleted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [logId, testUserId, 'Apple', 'Generic', 150, 'g', 'snack', '{"calories": 78}', new Date(), new Date(), false]
      );

      // Manually update the server version to be newer
      await query(
        `UPDATE food_logs SET updated_at = NOW() WHERE id = $1`,
        [logId]
      );

      const operations = [
        {
          type: 'update_log',
          data: {
            id: logId,
            food_name: 'Green Apple',
          },
          timestamp: oldDate.toISOString(), // Old timestamp
        },
      ];

      const response = await request(app)
        .post('/api/sync/offline-queue')
        .send({
          userId: testUserId,
          operations,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.conflicts).toBe(1);
      expect(response.body.data.results[0].status).toBe('conflict');
      expect(response.body.data.results[0].error).toBe('Server version is newer');
    });

    it('should delete food log', async () => {
      // Create a food log first
      const logId = uuidv4();
      await query(
        `INSERT INTO food_logs (id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, is_deleted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [logId, testUserId, 'Apple', 'Generic', 150, 'g', 'snack', '{"calories": 78}', new Date(), false]
      );

      const operations = [
        {
          type: 'delete_log',
          data: {
            id: logId,
          },
          timestamp: new Date().toISOString(),
        },
      ];

      const response = await request(app)
        .post('/api/sync/offline-queue')
        .send({
          userId: testUserId,
          operations,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.success).toBe(1);

      // Verify log was soft deleted
      const result = await query(
        `SELECT is_deleted FROM food_logs WHERE id = $1`,
        [logId]
      );
      expect(result.rows[0].is_deleted).toBe(true);
    });

    it('should handle conflict on delete (log not found)', async () => {
      const logId = uuidv4();

      const operations = [
        {
          type: 'delete_log',
          data: {
            id: logId,
          },
          timestamp: new Date().toISOString(),
        },
      ];

      const response = await request(app)
        .post('/api/sync/offline-queue')
        .send({
          userId: testUserId,
          operations,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.conflicts).toBe(1);
      expect(response.body.data.results[0].status).toBe('conflict');
    });

    it('should process operations in timestamp order', async () => {
      const logId1 = uuidv4();
      const logId2 = uuidv4();

      const operations = [
        {
          type: 'create_log',
          data: {
            food_name: 'Apple',
            quantity: 100,
            unit: 'g',
            meal_type: 'snack',
            nutrition: { calories: 52 },
          },
          timestamp: new Date(Date.now() - 2000).toISOString(),
        },
        {
          type: 'create_log',
          data: {
            food_name: 'Banana',
            quantity: 120,
            unit: 'g',
            meal_type: 'snack',
            nutrition: { calories: 105 },
          },
          timestamp: new Date(Date.now() - 1000).toISOString(),
        },
      ];

      const response = await request(app)
        .post('/api/sync/offline-queue')
        .send({
          userId: testUserId,
          operations,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.success).toBe(2);

      // Verify both logs were created
      const result = await query(
        `SELECT food_name FROM food_logs WHERE user_id = $1 AND is_deleted = FALSE ORDER BY created_at`,
        [testUserId]
      );
      expect(result.rows.length).toBe(2);
      expect(result.rows[0].food_name).toBe('Apple');
      expect(result.rows[1].food_name).toBe('Banana');
    });

    it('should handle unknown operation type', async () => {
      const operations = [
        {
          type: 'unknown_operation',
          data: {},
          timestamp: new Date().toISOString(),
        },
      ];

      const response = await request(app)
        .post('/api/sync/offline-queue')
        .send({
          userId: testUserId,
          operations,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.errors).toBe(1);
      expect(response.body.data.results[0].status).toBe('error');
    });
  });

  describe('GET /api/sync/user/:userId/snapshot', () => {
    it('should get user snapshot', async () => {
      // Create some food logs
      await query(
        `INSERT INTO food_logs (id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, is_deleted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [uuidv4(), testUserId, 'Apple', 'Generic', 150, 'g', 'snack', '{"calories": 78}', new Date(), false]
      );

      const response = await request(app)
        .get(`/api/sync/user/${testUserId}/snapshot`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(testUserId);
      expect(response.body.data.foodLogs).toBeInstanceOf(Array);
      expect(response.body.data.foodLogs.length).toBe(1);
      expect(response.body.data.foodLogs[0].foodName).toBe('Apple');
      expect(response.body.data.lastSyncedAt).toBeDefined();
    });

    it('should handle invalid userId', async () => {
      const response = await request(app)
        .get('/api/sync/user/invalid-uuid/snapshot')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation_error');
    });
  });
});
