/**
 * Job Scheduler
 * Runs periodic background jobs (GDPR erasure, notifications, etc.)
 */

let schedulerIntervals: NodeJS.Timeout[] = [];

/**
 * Start the job scheduler
 */
export function startJobScheduler(): void {
  console.log('[Job Scheduler] Starting job scheduler...');

  // Schedule GDPR erasure job
  const erasureInterval = getErasureJobInterval();
  scheduleErasureJob(erasureInterval);

  // Schedule reminder job
  const reminderInterval = getReminderJobInterval();
  scheduleReminderJob(reminderInterval);

  console.log('[Job Scheduler] Job scheduler started');
}

/**
 * Stop the job scheduler (for graceful shutdown)
 */
export function stopJobScheduler(): void {
  console.log('[Job Scheduler] Stopping job scheduler...');

  for (const interval of schedulerIntervals) {
    clearInterval(interval);
  }

  schedulerIntervals = [];
  console.log('[Job Scheduler] Job scheduler stopped');
}

/**
 * Schedule the GDPR erasure job
 */
function scheduleErasureJob(intervalMinutes: number): void {
  const intervalMs = intervalMinutes * 60 * 1000;

  const intervalId = setInterval(async () => {
    try {
      // Dynamically import the job to avoid circular dependencies
      const { processPendingErasureRequests } = await import('./gdpr-erasure-job.js');
      const processedCount = await processPendingErasureRequests();
      console.log(`[Job Scheduler] GDPR erasure job completed. Processed ${processedCount} requests.`);
    } catch (error) {
      console.error('[Job Scheduler] Error running GDPR erasure job:', error);
    }
  }, intervalMs);

  schedulerIntervals.push(intervalId);
  console.log(`[Job Scheduler] Scheduled GDPR erasure job to run every ${intervalMinutes} minutes`);
}

/**
 * Schedule the reminder job
 */
function scheduleReminderJob(intervalMinutes: number): void {
  const intervalMs = intervalMinutes * 60 * 1000;

  const intervalId = setInterval(async () => {
    try {
      // Dynamically import the job to avoid circular dependencies
      const { processReminders } = await import('./reminder-job.js');
      const processedCount = await processReminders();
      console.log(`[Job Scheduler] Reminder job completed. Sent ${processedCount} reminders.`);
    } catch (error) {
      console.error('[Job Scheduler] Error running reminder job:', error);
    }
  }, intervalMs);

  schedulerIntervals.push(intervalId);
  console.log(`[Job Scheduler] Scheduled reminder job to run every ${intervalMinutes} minutes`);
}

/**
 * Get the erasure job interval from environment or default to 60 minutes
 */
function getErasureJobInterval(): number {
  const interval = parseInt(process.env.GDPR_JOB_RUN_INTERVAL_MINUTES || '60', 10);
  return Math.max(1, interval); // Minimum 1 minute
}

/**
 * Get the reminder job interval from environment or default to 30 minutes
 */
function getReminderJobInterval(): number {
  const interval = parseInt(process.env.NOTIFICATION_JOB_RUN_INTERVAL_MINUTES || '30', 10);
  return Math.max(1, interval); // Minimum 1 minute
}
