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
 * Get current time in user's timezone
 */
function getUserTime(userTimezone: string): Date {
  const now = new Date();

  // If timezone is provided, convert to that timezone
  if (userTimezone && userTimezone !== 'UTC') {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: userTimezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      };

      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(now);

      const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
      const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10) - 1;
      const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
      const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);

      return new Date(year, month, day, hour, minute);
    } catch (error) {
      console.error(`[Reminder Job] Error converting timezone ${userTimezone}:`, error);
      return now;
    }
  }

  return now;
}

/**
 * Check if it's time to send a reminder based on user's timezone and reminder times
 */
function shouldSendReminder(
  userTimezone: string,
  reminderTimes: string[],
  lastReminderSentAt: Date | null
): boolean {
  // If no reminder times set, don't send
  if (reminderTimes.length === 0) {
    return false;
  }

  const userTime = getUserTime(userTimezone);
  const currentHour = userTime.getHours();
  const currentMinute = userTime.getMinutes();

  // Check if current time matches any reminder time (within the same hour)
  const reminderHours = reminderTimes.map(time => {
    const [hour] = time.split(':');
    return parseInt(hour, 10);
  });

  if (!reminderHours.includes(currentHour)) {
    return false;
  }

  // Check if we already sent a reminder today (in user's timezone)
  if (lastReminderSentAt) {
    const lastReminderDate = new Date(lastReminderSentAt);
    const lastReminderTime = getUserTime(userTimezone);
    lastReminderDate.setHours(lastReminderTime.getHours());
    lastReminderDate.setMinutes(lastReminderTime.getMinutes());

    // Compare days
    const nowDate = new Date(userTime);
    nowDate.setHours(0, 0, 0, 0);

    const lastReminderDateMidnight = new Date(userTime);
    lastReminderDateMidnight.setHours(0, 0, 0, 0);
    lastReminderDateMidnight.setDate(lastReminderDateMidnight.getDate() - 1);

    if (lastReminderDateMidnight.getTime() === nowDate.getTime()) {
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
