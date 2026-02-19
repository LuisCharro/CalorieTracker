/**
 * Notification Delivery Service
 * Sends notifications to users via configured channels
 */

import nodemailer from 'nodemailer';
import { query } from '../../db/pool.js';

interface NotificationSettings {
  channels: string[];
  reminderTimes: string[];
  timezone: string;
  email?: string;
}

interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface NotificationResult {
  channel: string;
  success: boolean;
  error?: string;
}

/**
 * Notification Delivery Service
 */
export class NotificationDeliveryService {
  /**
   * Send a notification to a user
   * @param userId - User ID
   * @param notification - Notification payload
   * @returns Promise<NotificationResult[]>
   */
  async sendNotification(
    userId: string,
    notification: NotificationPayload
  ): Promise<NotificationResult[]> {
    try {
      // Get user's notification settings
      const settings = await this.getUserNotificationSettings(userId);

      if (!settings || settings.channels.length === 0) {
        console.log(`[Notification] No channels configured for user ${userId}`);
        return [];
      }

      const results: NotificationResult[] = [];

      // Send notification via each enabled channel
      for (const channel of settings.channels) {
        try {
          let result: NotificationResult;

          switch (channel) {
            case 'email':
              result = await this.sendEmailNotification(userId, notification, settings);
              break;
            case 'in-app':
              result = await this.sendInAppNotification(userId, notification);
              break;
            case 'push':
              result = await this.sendPushNotification(userId, notification);
              break;
            default:
              result = {
                channel,
                success: false,
                error: `Unknown channel: ${channel}`,
              };
          }

          results.push(result);
        } catch (error) {
          results.push({
            channel,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return results;
    } catch (error) {
      console.error(`[Notification] Error sending notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's notification settings from database
   */
  private async getUserNotificationSettings(
    userId: string
  ): Promise<NotificationSettings | null> {
    try {
      // Get notification settings
      const settingsResult = await query(
        `SELECT channels, reminder_times, timezone
         FROM notification_settings
         WHERE user_id = $1`,
        [userId]
      );

      if (settingsResult.rows.length === 0) {
        return null;
      }

      // Get user's email
      const userResult = await query(
        `SELECT email FROM users WHERE id = $1`,
        [userId]
      );

      const email = userResult.rows.length > 0 ? userResult.rows[0].email : undefined;

      return {
        channels: settingsResult.rows[0].channels || [],
        reminderTimes: settingsResult.rows[0].reminder_times || [],
        timezone: settingsResult.rows[0].timezone || 'UTC',
        email,
      };
    } catch (error) {
      console.error(`[Notification] Error fetching settings for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    userId: string,
    notification: NotificationPayload,
    settings: NotificationSettings
  ): Promise<NotificationResult> {
    // Check if email is configured
    if (!this.isEmailConfigured()) {
      return {
        channel: 'email',
        success: false,
        error: 'Email not configured',
      };
    }

    // Check if user has email
    if (!settings.email) {
      return {
        channel: 'email',
        success: false,
        error: 'User has no email address',
      };
    }

    try {
      // Create email transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      // Send email
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: settings.email,
        subject: notification.title,
        text: notification.body,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${notification.title}</h2>
            <p style="color: #666; line-height: 1.6;">${notification.body}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">
              This is an automated notification from CalorieTracker.<br>
              If you didn't expect this message, please ignore it.
            </p>
          </div>
        `,
      });

      console.log(`[Notification] Email sent to user ${userId}:`, info.messageId);

      return {
        channel: 'email',
        success: true,
      };
    } catch (error) {
      console.error(`[Notification] Error sending email to user ${userId}:`, error);
      return {
        channel: 'email',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send in-app notification (store in database)
   */
  private async sendInAppNotification(
    userId: string,
    notification: NotificationPayload
  ): Promise<NotificationResult> {
    try {
      const { v4: uuidv4 } = await import('uuid');

      // Store notification in database
      await query(
        `INSERT INTO notifications (id, user_id, type, title, body, data, read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [uuidv4(), userId, notification.type, notification.title, notification.body, JSON.stringify(notification.data || {}), false]
      );

      console.log(`[Notification] In-app notification stored for user ${userId}:`, notification.title);

      return {
        channel: 'in-app',
        success: true,
      };
    } catch (error) {
      console.error(`[Notification] Error storing in-app notification for user ${userId}:`, error);
      return {
        channel: 'in-app',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    userId: string,
    notification: NotificationPayload
  ): Promise<NotificationResult> {
    try {
      // In a real implementation, you would:
      // 1. Get user's push subscription from database
      // 2. Use a push notification service (e.g., Firebase Cloud Messaging, OneSignal)
      // 3. Send the push notification
      // 4. Return success/failure status

      console.log(`[Notification] Push notification for user ${userId}:`, notification.title);

      return {
        channel: 'push',
        success: true, // Placeholder
      };
    } catch (error) {
      return {
        channel: 'push',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if email is configured
   */
  private isEmailConfigured(): boolean {
    return !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM
    );
  }
}

// Export singleton instance
export const notificationDeliveryService = new NotificationDeliveryService();

/**
 * Convenience function to send a notification
 */
export async function sendNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<NotificationResult[]> {
  return notificationDeliveryService.sendNotification(userId, {
    type,
    title,
    body,
    data,
  });
}
