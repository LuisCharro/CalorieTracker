/**
 * Tests for Offline Queue Service
 */

import {
  isOnline,
  getQueue,
  addToQueue,
  updateOperationStatus,
  removeFromQueue,
  clearQueue,
  clearSuccessOperations,
  hasPendingOperations,
  getOperationCounts,
  shouldRetry,
  getRetryableOperations,
  markForRetry,
  discardOperation,
} from '../offline-queue.service';
import type { OfflineOperation } from '../offline-queue.service';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator
const navigatorMock = {
  onLine: true,
};
Object.defineProperty(window, 'navigator', {
  value: navigatorMock,
  configurable: true,
});

describe('OfflineQueueService', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('isOnline', () => {
    it('should return true when navigator.onLine is true', () => {
      Object.defineProperty(window.navigator, 'onLine', { value: true });
      expect(isOnline()).toBe(true);
    });

    it('should return false when navigator.onLine is false', () => {
      Object.defineProperty(window.navigator, 'onLine', { value: false });
      expect(isOnline()).toBe(false);
    });
  });

  describe('getQueue', () => {
    it('should return empty array when no operations in storage', () => {
      const queue = getQueue();
      expect(queue).toEqual([]);
    });

    it('should return sorted operations by timestamp', () => {
      const op1: OfflineOperation = {
        id: '1',
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-02T00:00:00Z',
        status: 'pending',
        retryCount: 0,
      };
      const op2: OfflineOperation = {
        id: '2',
        type: 'update_log',
        data: { quantity: 2 },
        timestamp: '2024-01-01T00:00:00Z',
        status: 'pending',
        retryCount: 0,
      };

      localStorageMock.setItem('calorietracker_offline_queue', JSON.stringify([op1, op2]));

      const queue = getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].id).toBe('2'); // Earlier timestamp
      expect(queue[1].id).toBe('1');
    });

    it('should handle invalid JSON in storage', () => {
      localStorageMock.setItem('calorietracker_offline_queue', 'invalid json');
      const queue = getQueue();
      expect(queue).toEqual([]);
    });
  });

  describe('addToQueue', () => {
    it('should add operation with generated id and status', () => {
      const operation = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      expect(operation.id).toMatch(/^create_log_\d+_[a-z0-9]+$/);
      expect(operation.status).toBe('pending');
      expect(operation.retryCount).toBe(0);
    });

    it('should save to localStorage', () => {
      const operation = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      const stored = localStorageMock.getItem('calorietracker_offline_queue');
      expect(stored).toBeTruthy();

      const queue = JSON.parse(stored!) as OfflineOperation[];
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe(operation.id);
    });
  });

  describe('updateOperationStatus', () => {
    it('should update operation status', () => {
      const operation = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      updateOperationStatus(operation.id, 'success');

      const queue = getQueue();
      expect(queue[0].status).toBe('success');
    });

    it('should update error message when provided', () => {
      const operation = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      updateOperationStatus(operation.id, 'error', 'Network error');

      const queue = getQueue();
      expect(queue[0].status).toBe('error');
      expect(queue[0].error).toBe('Network error');
    });

    it('should increment retry count when status is error', () => {
      const operation = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      updateOperationStatus(operation.id, 'error');
      updateOperationStatus(operation.id, 'error');

      const queue = getQueue();
      expect(queue[0].retryCount).toBe(2);
    });

    it('should not increment retry count for non-error status', () => {
      const operation = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      updateOperationStatus(operation.id, 'syncing');

      const queue = getQueue();
      expect(queue[0].retryCount).toBe(0);
    });
  });

  describe('removeFromQueue', () => {
    it('should remove operation by id', () => {
      const op1 = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      const op2 = addToQueue({
        type: 'update_log',
        data: { quantity: 2 },
        timestamp: '2024-01-02T00:00:00Z',
      });

      removeFromQueue(op1.id);

      const queue = getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe(op2.id);
    });
  });

  describe('clearSuccessOperations', () => {
    it('should remove only successful operations', () => {
      const op1 = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });
      updateOperationStatus(op1.id, 'success');

      const op2 = addToQueue({
        type: 'update_log',
        data: { quantity: 2 },
        timestamp: '2024-01-02T00:00:00Z',
      });
      updateOperationStatus(op2.id, 'error');

      clearSuccessOperations();

      const queue = getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe(op2.id);
      expect(queue[0].status).toBe('error');
    });
  });

  describe('clearQueue', () => {
    it('should remove all operations from localStorage', () => {
      addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      clearQueue();

      const stored = localStorageMock.getItem('calorietracker_offline_queue');
      expect(stored).toBeNull();
    });
  });

  describe('hasPendingOperations', () => {
    it('should return true when there are pending operations', () => {
      const op = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      expect(hasPendingOperations()).toBe(true);

      updateOperationStatus(op.id, 'success');
      expect(hasPendingOperations()).toBe(false);
    });

    it('should return true when there are syncing operations', () => {
      const op = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      updateOperationStatus(op.id, 'syncing');
      expect(hasPendingOperations()).toBe(true);
    });

    it('should return false when there are no pending operations', () => {
      expect(hasPendingOperations()).toBe(false);
    });
  });

  describe('getOperationCounts', () => {
    it('should return correct counts for all statuses', () => {
      addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });
      const op2 = addToQueue({
        type: 'update_log',
        data: { quantity: 2 },
        timestamp: '2024-01-02T00:00:00Z',
      });
      const op3 = addToQueue({
        type: 'delete_log',
        data: { logId: '123' },
        timestamp: '2024-01-03T00:00:00Z',
      });
      const op4 = addToQueue({
        type: 'create_log',
        data: { foodName: 'Banana' },
        timestamp: '2024-01-04T00:00:00Z',
      });

      updateOperationStatus(op2.id, 'syncing');
      updateOperationStatus(op3.id, 'success');
      updateOperationStatus(op4.id, 'error');

      const counts = getOperationCounts();
      expect(counts.pending).toBe(1);
      expect(counts.syncing).toBe(1);
      expect(counts.success).toBe(1);
      expect(counts.error).toBe(1);
      expect(counts.total).toBe(4);
    });
  });

  describe('shouldRetry', () => {
    it('should return true for error operations under max retries', () => {
      const op = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      updateOperationStatus(op.id, 'error');
      const queue = getQueue();
      const updatedOp = queue.find(o => o.id === op.id);
      expect(shouldRetry(updatedOp!)).toBe(true);

      updateOperationStatus(op.id, 'error');
      const queue2 = getQueue();
      const updatedOp2 = queue2.find(o => o.id === op.id);
      expect(shouldRetry(updatedOp2!)).toBe(true);

      updateOperationStatus(op.id, 'error');
      const queue3 = getQueue();
      const updatedOp3 = queue3.find(o => o.id === op.id);
      expect(shouldRetry(updatedOp3!)).toBe(false); // 3 retries max
    });

    it('should return false for non-error operations', () => {
      const op = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      expect(shouldRetry(op)).toBe(false);

      updateOperationStatus(op.id, 'success');
      expect(shouldRetry(op)).toBe(false);
    });
  });

  describe('getRetryableOperations', () => {
    it('should return only retryable operations', () => {
      const op1 = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });
      const op2 = addToQueue({
        type: 'update_log',
        data: { quantity: 2 },
        timestamp: '2024-01-02T00:00:00Z',
      });

      updateOperationStatus(op1.id, 'error');
      updateOperationStatus(op2.id, 'error');
      updateOperationStatus(op2.id, 'error');
      updateOperationStatus(op2.id, 'error'); // Max retries

      const retryable = getRetryableOperations();
      expect(retryable).toHaveLength(1);
      expect(retryable[0].id).toBe(op1.id);
    });
  });

  describe('markForRetry', () => {
    it('should mark operation for retry', () => {
      const op = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      updateOperationStatus(op.id, 'error', 'Network error');
      markForRetry(op.id);

      const queue = getQueue();
      expect(queue[0].status).toBe('pending');
    });
  });

  describe('discardOperation', () => {
    it('should remove operation from queue', () => {
      const op = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      discardOperation(op.id);

      const queue = getQueue();
      expect(queue).toHaveLength(0);
    });
  });
});
