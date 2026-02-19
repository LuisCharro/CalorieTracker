/**
 * Reminder Job
 * Sends reminder notifications to users based on their settings
 */

import { query } from '../../db/pool.js';
import { sendNotification } from '../services/notification-delivery.js';

/**
 * Get reminder job interval from environment or default to 30 minutes
 */
const getReminderJobInterval = (): number => {
  const interval = parseInt(process.env.NOTIFICATION_JOB_RUN_INTERVAL_MINUTES || '30', 10);
  return Math.max(1, interval); // Minimum 1 minute
};

/**
 * Check if it's time to send a reminder based on user's timezone and reminder times
 */
function shouldSendReminder(
  userTimezone: string,
  reminderTimes: string[],
  lastReminderSentAt: Date | null
): boolean {
  // For MVP simplicity, we'll use a basic implementation
  // In production, this would properly handle timezones and reminder schedules

  const now = new Date();
  const userHour = parseInt(now.getHours().toString(), 10);

  // If no reminder times set, don't send
  if (reminderTimes.length === 0) {
    return false;
  }

  // Check if current hour matches any reminder time
  const reminderHours = reminderTimes.map(time => {
    const [hour] = time.split(':');
    return parseInt(hour, 10);
  });

  if (!reminderHours.includes(userHour)) {
    return false;
  }

  // Check if we already sent a reminder today
  if (lastReminderSentAt) {
    const lastReminderDate = new Date(lastReminderSentAt);
    const daysSinceLastReminder = Math.floor(
      (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastReminder < 1) {
      return false;
    }
  }

  return true;
}

/**
 * Send reminder to a user
 */
async function sendUserReminder(userId: string): Promise<void> {
  try {
    // Get user's notification settings
    const settingsResult = await query(
      `SELECT channels, reminder_times, timezone, updated_at
       FROM notification_settings
       WHERE user_id = $1`,
      [userId]
    );

    if (settingsResult.rows.length === 0) {
      return;
    }

    const settings = settingsResult.rows[0];

    // Check if we should send a reminder
    if (!shouldSendReminder(settings.timezone, settings.reminder_times, settings.updated_at)) {
      return;
    }

    // Check if user has logged any food today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logsResult = await query(
      `SELECT COUNT(*) as count
       FROM food_logs
       WHERE user_id = $1
         AND logged_at >= $2
         AND logged_at < $3
         AND is_deleted = FALSE`,
      [userId, today, tomorrow]
    );

    const logCount = parseInt(logsResult.rows[0].count, 10);

    // If user has already logged food today, don't send reminder
    if (logCount > 0) {
      console.log(`[Reminder Job] User ${userId} has already logged ${logCount} food entries today. Skipping reminder.`);
      return;
    }

    // Send reminder notification
    await sendNotification(
      userId,
      'food_log_reminder',
      'Time to log your meals!',
      "Don't forget to log your food for today. Tracking your meals helps you reach your health goals.",
      {
        logCount: 0,
        date: today.toISOString(),
      }
    );

    // Update the notification_settings timestamp to track when we sent the reminder
    await query(
      `UPDATE notification_settings
       SET updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );

    console.log(`[Reminder Job] Sent food log reminder to user ${userId}`);
  } catch (error) {
    console.error(`[Reminder Job] Error sending reminder to user ${userId}:`, error);
  }
}

/**
 * Process all user reminders
 */
export async function processReminders(): Promise<number> {
  try {
    console.log('[Reminder Job] Processing user reminders...');

    // Get all users who have reminder times configured
    const result = await query(
      `SELECT DISTINCT ns.user_id
       FROM notification_settings ns
       JOIN users u ON u.id = ns.user_id
       WHERE u.is_deleted = FALSE
         AND ns.reminder_times IS NOT NULL
         AND jsonb_array_length(ns.reminder_times) > 0`,
      []
    );

    const userIds = result.rows.map(row => row.user_id);
    console.log(`[Reminder Job] Found ${userIds.length} users with reminder times configured`);

    let sentCount = 0;

    for (const userId of userIds) {
      try {
        await sendUserReminder(userId);
        sentCount++;
      } catch (error) {
        console.error(`[Reminder Job] Failed to process reminders for user ${userId}:`, error);
      }
    }

    console.log(`[Reminder Job] Processed reminders for ${sentCount} users`);
    return sentCount;
  } catch (error) {
    console.error('[Reminder Job] Error processing reminders:', error);
    return 0;
  }
}
