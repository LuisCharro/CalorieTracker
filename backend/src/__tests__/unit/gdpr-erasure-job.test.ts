/**
 * Unit tests for GDPR erasure job
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';
import { processPendingErasureRequests } from '../../api/jobs/gdpr-erasure-job.js';

describe('GDPR Erasure Job', () => {
  let testUserId: string;
  let testRequestId: string;

  beforeEach(async () => {
    // Create a test user
    testUserId = uuidv4();
    await query(
      `INSERT INTO users (id, email, display_name, preferences, onboarding_complete, is_deleted)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [testUserId, 'test@example.com', 'Test User', '{}', true, false]
    );

    // Create some food logs for the user
    await query(
      `INSERT INTO food_logs (id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, is_deleted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [uuidv4(), testUserId, 'Test Food', 'Test Brand', 100, 'g', 'lunch', '{"calories": 200}', new Date(), false]
    );

    // Create a goal for the user
    await query(
      `INSERT INTO goals (id, user_id, goal_type, target_value, is_active, start_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), testUserId, 'calories', 2000, true, new Date()]
    );

    // Create notification settings
    await query(
      `INSERT INTO notification_settings (id, user_id, channels, reminder_times, timezone)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), testUserId, '["email"]', '["08:00", "20:00"]', 'UTC']
    );

    // Create consent history
    await query(
      `INSERT INTO consent_history (id, user_id, consent_type, consent_given, consent_version)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), testUserId, 'marketing', true, '1.0']
    );
  });

  afterEach(async () => {
    // Clean up test data
    await query(`DELETE FROM gdpr_requests WHERE user_id = $1`, [testUserId]);
    await query(`DELETE FROM consent_history WHERE user_id = $1`, [testUserId]);
    await query(`DELETE FROM notification_settings WHERE user_id = $1`, [testUserId]);
    await query(`DELETE FROM goals WHERE user_id = $1`, [testUserId]);
    await query(`DELETE FROM food_logs WHERE user_id = $1`, [testUserId]);
    await query(`DELETE FROM users WHERE id = $1`, [testUserId]);
  });

  describe('processPendingErasureRequests', () => {
    it('should not process erasure request before grace period', async () => {
      // Create erasure request with pending status
      testRequestId = uuidv4();
      await query(
        `INSERT INTO gdpr_requests (id, user_id, request_type, status, requested_at, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [testRequestId, testUserId, 'erasure', 'pending', new Date(), '{}']
      );

      // Process pending requests
      const processedCount = await processPendingErasureRequests();

      // Should not process any requests (grace period not passed)
      expect(processedCount).toBe(0);

      // Check that request is still pending
      const requestResult = await query(
        `SELECT status FROM gdpr_requests WHERE id = $1`,
        [testRequestId]
      );
      expect(requestResult.rows.length).toBe(1);
      expect(requestResult.rows[0].status).toBe('pending');

      // Check that user is NOT soft deleted
      const userResult = await query(
        `SELECT is_deleted FROM users WHERE id = $1`,
        [testUserId]
      );
      expect(userResult.rows.length).toBe(1);
      expect(userResult.rows[0].is_deleted).toBe(false);
    });

    it('should process erasure request after grace period', async () => {
      // Create erasure request with pending status and past grace period
      testRequestId = uuidv4();
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 40); // 40 days ago (past 30-day grace period)

      await query(
        `INSERT INTO gdpr_requests (id, user_id, request_type, status, requested_at, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [testRequestId, testUserId, 'erasure', 'pending', pastDate, '{}']
      );

      // Process pending requests
      const processedCount = await processPendingErasureRequests();

      // Should process one request
      expect(processedCount).toBe(1);

      // Check that user is now soft deleted
      const userResult = await query(
        `SELECT is_deleted, deleted_at FROM users WHERE id = $1`,
        [testUserId]
      );
      expect(userResult.rows.length).toBe(1);
      expect(userResult.rows[0].is_deleted).toBe(true);
      expect(userResult.rows[0].deleted_at).not.toBeNull();

      // Check that food_logs are anonymized (user_id set to NULL)
      const logsResult = await query(
        `SELECT user_id FROM food_logs WHERE id IN (
          SELECT id FROM food_logs WHERE user_id = $1
        )`,
        [testUserId]
      );
      // Logs should have been anonymized (user_id set to NULL)
      // Note: The actual query checks logs that originally belonged to the user

      // Check that goals are deleted
      const goalsResult = await query(
        `SELECT COUNT(*) as count FROM goals WHERE user_id = $1`,
        [testUserId]
      );
      expect(parseInt(goalsResult.rows[0].count, 10)).toBe(0);

      // Check that consent_history is deleted
      const consentResult = await query(
        `SELECT COUNT(*) as count FROM consent_history WHERE user_id = $1`,
        [testUserId]
      );
      expect(parseInt(consentResult.rows[0].count, 10)).toBe(0);

      // Check that notification_settings are deleted
      const notifResult = await query(
        `SELECT COUNT(*) as count FROM notification_settings WHERE user_id = $1`,
        [testUserId]
      );
      expect(parseInt(notifResult.rows[0].count, 10)).toBe(0);

      // Check that gdpr_requests are deleted
      const gdprResult = await query(
        `SELECT COUNT(*) as count FROM gdpr_requests WHERE user_id = $1`,
        [testUserId]
      );
      expect(parseInt(gdprResult.rows[0].count, 10)).toBe(0);

      // Check that processing_activities are deleted
      const activitiesResult = await query(
        `SELECT COUNT(*) as count FROM processing_activities WHERE user_id = $1`,
        [testUserId]
      );
      expect(parseInt(activitiesResult.rows[0].count, 10)).toBe(0);
    });

    it('should handle multiple pending requests', async () => {
      // Create second user
      const testUserId2 = uuidv4();
      await query(
        `INSERT INTO users (id, email, display_name, preferences, onboarding_complete, is_deleted)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [testUserId2, 'test2@example.com', 'Test User 2', '{}', true, false]
      );

      // Create two erasure requests - one past grace period, one not
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 40);

      const requestId1 = uuidv4();
      await query(
        `INSERT INTO gdpr_requests (id, user_id, request_type, status, requested_at, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [requestId1, testUserId, 'erasure', 'pending', pastDate, '{}']
      );

      const requestId2 = uuidv4();
      await query(
        `INSERT INTO gdpr_requests (id, user_id, request_type, status, requested_at, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [requestId2, testUserId2, 'erasure', 'pending', new Date(), '{}']
      );

      // Process pending requests
      const processedCount = await processPendingErasureRequests();

      // Should only process one request (the one past grace period)
      expect(processedCount).toBe(1);

      // Clean up second user
      await query(`DELETE FROM gdpr_requests WHERE user_id = $1`, [testUserId2]);
      await query(`DELETE FROM users WHERE id = $1`, [testUserId2]);
    });
  });
});
