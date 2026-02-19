/**
 * GDPR Erasure Job
 * Background job to process pending erasure requests after grace period
 */

import { query } from '../../db/pool.js';

/**
 * Get grace period from environment or default to 30 days
 */
const getGracePeriodDays = (): number => {
  return parseInt(process.env.GDPR_ERASURE_GRACE_PERIOD_DAYS || '30', 10);
};

/**
 * Process a single erasure request
 * @param requestId - The GDPR request ID
 */
export async function processErasureRequest(requestId: string): Promise<void> {
  try {
    // Get the request details
    const requestResult = await query(
      `SELECT user_id, requested_at FROM gdpr_requests WHERE id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      console.error(`[GDPR Erasure] Request not found: ${requestId}`);
      return;
    }

    const { user_id: userId, requested_at: requestedAt } = requestResult.rows[0];

    // Check if grace period has passed
    const gracePeriodDays = getGracePeriodDays();
    const gracePeriodEnd = new Date(requestedAt);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

    const now = new Date();

    if (now < gracePeriodEnd) {
      console.log(`[GDPR Erasure] Grace period not yet passed for request ${requestId}. Grace ends: ${gracePeriodEnd.toISOString()}`);
      return;
    }

    // Start erasure process
    console.log(`[GDPR Erasure] Starting erasure for user ${userId}, request ${requestId}`);

    // Step 1: Anonymize food_logs (set user_id to null)
    await query(
      `UPDATE food_logs
       SET user_id = NULL, updated_at = NOW()
       WHERE user_id = $1 AND is_deleted = FALSE`,
      [userId]
    );
    console.log(`[GDPR Erasure] Anonymized food_logs for user ${userId}`);

    // Step 2: Hard delete goals
    await query(
      `DELETE FROM goals WHERE user_id = $1`,
      [userId]
    );
    console.log(`[GDPR Erasure] Deleted goals for user ${userId}`);

    // Step 3: Hard delete consent_history
    await query(
      `DELETE FROM consent_history WHERE user_id = $1`,
      [userId]
    );
    console.log(`[GDPR Erasure] Deleted consent_history for user ${userId}`);

    // Step 4: Hard delete notification_settings
    await query(
      `DELETE FROM notification_settings WHERE user_id = $1`,
      [userId]
    );
    console.log(`[GDPR Erasure] Deleted notification_settings for user ${userId}`);

    // Step 5: Hard delete gdpr_requests (including this one)
    await query(
      `DELETE FROM gdpr_requests WHERE user_id = $1`,
      [userId]
    );
    console.log(`[GDPR Erasure] Deleted gdpr_requests for user ${userId}`);

    // Step 6: Hard delete security_events (but keep the events as audit)
    // For GDPR compliance, we should keep security events for audit purposes
    // but anonymize user_id if needed
    await query(
      `UPDATE security_events
       SET user_id = NULL
       WHERE user_id = $1`,
      [userId]
    );
    console.log(`[GDPR Erasure] Anonymized security_events for user ${userId}`);

    // Step 7: Hard delete processing_activities
    await query(
      `DELETE FROM processing_activities WHERE user_id = $1`,
      [userId]
    );
    console.log(`[GDPR Erasure] Deleted processing_activities for user ${userId}`);

    // Step 8: Hard delete the user record
    await query(
      `DELETE FROM users WHERE id = $1`,
      [userId]
    );
    console.log(`[GDPR Erasure] Deleted user ${userId}`);

    console.log(`[GDPR Erasure] Completed erasure for user ${userId}, request ${requestId}`);
  } catch (error) {
    console.error(`[GDPR Erasure] Error processing request ${requestId}:`, error);

    // Mark request as failed
    await query(
      `UPDATE gdpr_requests
       SET status = 'failed',
           metadata = metadata || jsonb_build_object('error', $2)
       WHERE id = $1`,
      [requestId, error instanceof Error ? error.message : 'Unknown error']
    );

    throw error;
  }
}

/**
 * Process all pending erasure requests that have passed grace period
 */
export async function processPendingErasureRequests(): Promise<number> {
  try {
    // Get all pending erasure requests
    const result = await query(
      `SELECT id, user_id, requested_at
       FROM gdpr_requests
       WHERE request_type = 'erasure'
         AND status = 'pending'
       ORDER BY requested_at ASC`,
      []
    );

    const pendingRequests = result.rows;
    console.log(`[GDPR Erasure] Found ${pendingRequests.length} pending erasure requests`);

    if (pendingRequests.length === 0) {
      return 0;
    }

    const now = new Date();
    const gracePeriodDays = getGracePeriodDays();
    let processedCount = 0;

    for (const request of pendingRequests) {
      const { id: requestId, user_id: userId, requested_at: requestedAt } = request;

      // Check if grace period has passed
      const gracePeriodEnd = new Date(requestedAt);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

      if (now >= gracePeriodEnd) {
        // Mark request as processing
        await query(
          `UPDATE gdpr_requests
           SET status = 'processing'
           WHERE id = $1`,
          [requestId]
        );

        // Process the erasure
        try {
          await processErasureRequest(requestId);

          // Note: request record is deleted during erasure, so no need to mark as completed
          processedCount++;
        } catch (error) {
          // Error handling is already done in processErasureRequest
          console.error(`[GDPR Erasure] Failed to process request ${requestId}:`, error);
        }
      } else {
        console.log(`[GDPR Erasure] Request ${requestId} grace period not yet passed. Grace ends: ${gracePeriodEnd.toISOString()}`);
      }
    }

    console.log(`[GDPR Erasure] Processed ${processedCount} erasure requests`);
    return processedCount;
  } catch (error) {
    console.error('[GDPR Erasure] Error processing pending requests:', error);
    return 0;
  }
}
