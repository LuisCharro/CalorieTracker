/**
 * Offline Queue Service
 * Manages offline operations that need to be synced when connection is restored
 */

export interface OfflineOperation {
  id: string;
  type: 'create_log' | 'update_log' | 'delete_log';
  data: Record<string, unknown>;
  timestamp: string;
  status: 'pending' | 'syncing' | 'success' | 'error';
  error?: string;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = 'calorietracker_offline_queue';
const MAX_RETRIES = 3;

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Get all queued operations
 */
export function getQueue(): OfflineOperation[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!stored) {
      return [];
    }

    const queue: OfflineOperation[] = JSON.parse(stored);
    return queue.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    console.error('[Offline Queue] Error getting queue:', error);
    return [];
  }
}

/**
 * Save the queue to localStorage
 */
function saveQueue(queue: OfflineOperation[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[Offline Queue] Error saving queue:', error);
  }
}

/**
 * Add an operation to the queue
 */
export function addToQueue(operation: Omit<OfflineOperation, 'id' | 'status' | 'retryCount'>): OfflineOperation {
  const queue = getQueue();

  const newOperation: OfflineOperation = {
    id: `${operation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    retryCount: 0,
    ...operation,
  };

  queue.push(newOperation);
  saveQueue(queue);

  console.log('[Offline Queue] Added operation:', newOperation);
  return newOperation;
}

/**
 * Update operation status
 */
export function updateOperationStatus(operationId: string, status: OfflineOperation['status'], error?: string): void {
  const queue = getQueue();
  const index = queue.findIndex(op => op.id === operationId);

  if (index !== -1) {
    queue[index].status = status;

    if (error) {
      queue[index].error = error;
    }

    if (status === 'error') {
      queue[index].retryCount += 1;
    }

    saveQueue(queue);
  }
}

/**
 * Remove an operation from the queue
 */
export function removeFromQueue(operationId: string): void {
  const queue = getQueue();
  const filtered = queue.filter(op => op.id !== operationId);
  saveQueue(filtered);
}

/**
 * Clear all successful operations from the queue
 */
export function clearSuccessOperations(): void {
  const queue = getQueue();
  const filtered = queue.filter(op => op.status !== 'success');
  saveQueue(filtered);
}

/**
 * Clear all operations from the queue
 */
export function clearQueue(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

/**
 * Check if there are pending operations
 */
export function hasPendingOperations(): boolean {
  const queue = getQueue();
  return queue.some(op => op.status === 'pending' || op.status === 'syncing');
}

/**
 * Get count of operations by status
 */
export function getOperationCounts(): {
  pending: number;
  syncing: number;
  success: number;
  error: number;
  total: number;
} {
  const queue = getQueue();

  return {
    pending: queue.filter(op => op.status === 'pending').length,
    syncing: queue.filter(op => op.status === 'syncing').length,
    success: queue.filter(op => op.status === 'success').length,
    error: queue.filter(op => op.status === 'error').length,
    total: queue.length,
  };
}

/**
 * Check if an operation should be retried
 */
export function shouldRetry(operation: OfflineOperation): boolean {
  return operation.status === 'error' && operation.retryCount < MAX_RETRIES;
}

/**
 * Get failed operations that can be retried
 */
export function getRetryableOperations(): OfflineOperation[] {
  const queue = getQueue();
  return queue.filter(shouldRetry);
}

/**
 * Mark an operation for retry
 */
export function markForRetry(operationId: string): void {
  updateOperationStatus(operationId, 'pending');
}

/**
 * Remove a specific operation (e.g., user discards it)
 */
export function discardOperation(operationId: string): void {
  removeFromQueue(operationId);
}
