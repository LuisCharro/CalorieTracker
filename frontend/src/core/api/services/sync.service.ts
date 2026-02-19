/**
 * Sync Service
 * Syncs offline operations with the backend
 */

import { getQueue, updateOperationStatus, removeFromQueue, getOperationCounts } from './offline-queue.service';

export interface SyncResult {
  operationId: string;
  type: string;
  status: 'success' | 'conflict' | 'error';
  error?: string;
  serverData?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface SyncResponse {
  results: SyncResult[];
  summary: {
    total: number;
    success: number;
    conflicts: number;
    errors: number;
  };
}

/**
 * Sync all queued operations with the backend
 */
export async function syncOfflineQueue(userId: string): Promise<SyncResponse> {
  const queue = getQueue();
  const pendingOperations = queue.filter(op => op.status === 'pending' || op.status === 'error');

  if (pendingOperations.length === 0) {
    return {
      results: [],
      summary: { total: 0, success: 0, conflicts: 0, errors: 0 },
    };
  }

  console.log(`[Sync] Syncing ${pendingOperations.length} operations...`);

  try {
    const response = await fetch('/api/sync/offline-queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operations: pendingOperations,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as { data: SyncResponse };
    const syncResponse = data.data;

    // Process results
    for (const result of syncResponse.results) {
      const operation = pendingOperations.find(op =>
        op.type === result.type &&
        (result.data ? compareOperationData(op.data, result.data) : true)
      );

      if (operation) {
        if (result.status === 'success') {
          updateOperationStatus(operation.id, 'success');
        } else if (result.status === 'conflict') {
          updateOperationStatus(operation.id, 'error', result.error || 'Conflict detected');
        } else {
          updateOperationStatus(operation.id, 'error', result.error || 'Sync failed');
        }
      }
    }

    console.log(`[Sync] Sync completed:`, syncResponse.summary);
    return syncResponse;
  } catch (error) {
    console.error('[Sync] Error syncing queue:', error);

    // Mark all operations as error
    for (const operation of pendingOperations) {
      updateOperationStatus(operation.id, 'error', error instanceof Error ? error.message : 'Unknown error');
    }

    throw error;
  }
}

/**
 * Compare operation data for matching
 */
function compareOperationData(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Fetch user snapshot for conflict resolution
 */
export async function fetchUserSnapshot(userId: string): Promise<{
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
}> {
  const response = await fetch(`/api/sync/user/${userId}/snapshot`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as { data: unknown };
  return data.data as {
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
  };
}

/**
 * Auto-sync when coming back online
 */
let syncTimer: NodeJS.Timeout | null = null;

export function setupAutoSync(userId: string): () => void {
  const handleOnline = () => {
    console.log('[Sync] Network online, triggering auto-sync...');

    // Debounce sync to avoid rapid consecutive syncs
    if (syncTimer) {
      clearTimeout(syncTimer);
    }

    syncTimer = setTimeout(async () => {
      try {
        await syncOfflineQueue(userId);
      } catch (error) {
        console.error('[Sync] Auto-sync failed:', error);
      }
    }, 1000);
  };

  window.addEventListener('online', handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    if (syncTimer) {
      clearTimeout(syncTimer);
    }
  };
}

/**
 * Get sync status
 */
export function getSyncStatus(): {
  hasPending: boolean;
  counts: ReturnType<typeof getOperationCounts>;
} {
  const counts = getOperationCounts();
  return {
    hasPending: counts.pending + counts.syncing > 0,
    counts,
  };
}
