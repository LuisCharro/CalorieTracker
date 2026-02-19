/**
 * Unit tests for notification delivery service
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';
import { sendNotification } from '../../api/services/notification-delivery.js';

describe('Notification Delivery Service', () => {
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
    await query(`DELETE FROM notifications WHERE user_id = $1`, [testUserId]);
    await query(`DELETE FROM notification_settings WHERE user_id = $1`, [testUserId]);
    await query(`DELETE FROM users WHERE id = $1`, [testUserId]);
  });

  describe('sendNotification', () => {
    it('should handle user with no notification settings', async () => {
      const results = await sendNotification(
        testUserId,
        'test',
        'Test Title',
        'Test Body'
      );

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
    });

    it('should send in-app notification', async () => {
      // Create notification settings with in-app channel
      const settingsId = uuidv4();
      await query(
        `INSERT INTO notification_settings (id, user_id, channels, reminder_times, timezone)
         VALUES ($1, $2, $3, $4, $5)`,
        [settingsId, testUserId, '["in-app"]', '["08:00"]', 'UTC']
      );

      const results = await sendNotification(
        testUserId,
        'test',
        'Test Title',
        'Test Body',
        { key: 'value' }
      );

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(1);
      expect(results[0].channel).toBe('in-app');
      expect(results[0].success).toBe(true);

      // Check that notification was stored in database
      const notificationResult = await query(
        `SELECT * FROM notifications WHERE user_id = $1`,
        [testUserId]
      );

      expect(notificationResult.rows.length).toBe(1);
      expect(notificationResult.rows[0].type).toBe('test');
      expect(notificationResult.rows[0].title).toBe('Test Title');
      expect(notificationResult.rows[0].body).toBe('Test Body');
      expect(notificationResult.rows[0].read).toBe(false);
      expect(notificationResult.rows[0].data).toEqual({ key: 'value' });
    });

    it('should handle email notification without SMTP config', async () => {
      // Create notification settings with email channel
      const settingsId = uuidv4();
      await query(
        `INSERT INTO notification_settings (id, user_id, channels, reminder_times, timezone)
         VALUES ($1, $2, $3, $4, $5)`,
        [settingsId, testUserId, '["email"]', '["08:00"]', 'UTC']
      );

      // Ensure SMTP is not configured
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASSWORD;
      delete process.env.SMTP_FROM;

      const results = await sendNotification(
        testUserId,
        'test',
        'Test Title',
        'Test Body'
      );

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(1);
      expect(results[0].channel).toBe('email');
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Email not configured');
    });

    it('should handle push notification', async () => {
      // Create notification settings with push channel
      const settingsId = uuidv4();
      await query(
        `INSERT INTO notification_settings (id, user_id, channels, reminder_times, timezone)
         VALUES ($1, $2, $3, $4, $5)`,
        [settingsId, testUserId, '["push"]', '["08:00"]', 'UTC']
      );

      const results = await sendNotification(
        testUserId,
        'test',
        'Test Title',
        'Test Body'
      );

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(1);
      expect(results[0].channel).toBe('push');
      // Push notifications are placeholders, so they return success
      expect(results[0].success).toBe(true);
    });

    it('should handle multiple channels', async () => {
      // Create notification settings with multiple channels
      const settingsId = uuidv4();
      await query(
        `INSERT INTO notification_settings (id, user_id, channels, reminder_times, timezone)
         VALUES ($1, $2, $3, $4, $5)`,
        [settingsId, testUserId, '["in-app", "push"]', '["08:00"]', 'UTC']
      );

      const results = await sendNotification(
        testUserId,
        'test',
        'Test Title',
        'Test Body'
      );

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(2);
      expect(results[0].channel).toBe('in-app');
      expect(results[0].success).toBe(true);
      expect(results[1].channel).toBe('push');
      expect(results[1].success).toBe(true);

      // Check that in-app notification was stored
      const notificationResult = await query(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1`,
        [testUserId]
      );

      expect(parseInt(notificationResult.rows[0].count, 10)).toBe(1);
    });

    it('should handle unknown channel', async () => {
      // Create notification settings with unknown channel
      const settingsId = uuidv4();
      await query(
        `INSERT INTO notification_settings (id, user_id, channels, reminder_times, timezone)
         VALUES ($1, $2, $3, $4, $5)`,
        [settingsId, testUserId, '["unknown"]', '["08:00"]', 'UTC']
      );

      const results = await sendNotification(
        testUserId,
        'test',
        'Test Title',
        'Test Body'
      );

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(1);
      expect(results[0].channel).toBe('unknown');
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Unknown channel: unknown');
    });
  });
});
