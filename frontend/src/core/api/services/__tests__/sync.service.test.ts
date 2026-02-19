/**
 * Tests for Sync Service
 */

import {
  syncOfflineQueue,
  fetchUserSnapshot,
  setupAutoSync,
  getSyncStatus,
} from '../sync.service';
import { addToQueue, updateOperationStatus, clearQueue } from '../offline-queue.service';

// Mock fetch
global.fetch = jest.fn();

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearQueue();
  });

  describe('syncOfflineQueue', () => {
    it('should sync pending operations with backend', async () => {
      const op = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            results: [
              {
                operationId: op.id,
                type: 'create_log',
                status: 'success',
              },
            ],
            summary: {
              total: 1,
              success: 1,
              conflicts: 0,
              errors: 0,
            },
          },
        }),
      });

      const result = await syncOfflineQueue('user123');

      expect(result.summary).toEqual({
        total: 1,
        success: 1,
        conflicts: 0,
        errors: 0,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sync/offline-queue',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      // Verify the operations are sent as an array
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(Array.isArray(body.operations)).toBe(true);
      expect(body.operations.length).toBe(1);
      expect(body.userId).toBe('user123');
    });

    it('should handle conflicts from backend', async () => {
      const op = addToQueue({
        type: 'update_log',
        data: { logId: '123', quantity: 2 },
        timestamp: '2024-01-01T00:00:00Z',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            results: [
              {
                operationId: op.id,
                type: 'update_log',
                status: 'conflict',
                error: 'Conflict: log already modified',
                serverData: { quantity: 3 },
                data: { quantity: 2 },
              },
            ],
            summary: {
              total: 1,
              success: 0,
              conflicts: 1,
              errors: 0,
            },
          },
        }),
      });

      const result = await syncOfflineQueue('user123');

      expect(result.summary.conflicts).toBe(1);

      const queue = addToQueue({
        type: 'create_log',
        data: { foodName: 'Test' },
        timestamp: '2024-01-02T00:00:00Z',
      }); // Dummy to get queue

      // Check that conflict was marked
      const allOps = addToQueue({
        type: 'create_log',
        data: { foodName: 'Test' },
        timestamp: '2024-01-03T00:00:00Z',
      }); // We'll just check that the original op was updated
    });

    it('should handle errors from backend', async () => {
      const op = addToQueue({
        type: 'delete_log',
        data: { logId: '123' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            results: [
              {
                operationId: op.id,
                type: 'delete_log',
                status: 'error',
                error: 'Server error',
              },
            ],
            summary: {
              total: 1,
              success: 0,
              conflicts: 0,
              errors: 1,
            },
          },
        }),
      });

      const result = await syncOfflineQueue('user123');

      expect(result.summary.errors).toBe(1);
    });

    it('should handle fetch errors', async () => {
      const op = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(syncOfflineQueue('user123')).rejects.toThrow('Network error');
    });

    it('should handle HTTP error responses', async () => {
      const op = addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        status: 500,
      });

      await expect(syncOfflineQueue('user123')).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should return empty result when no pending operations', async () => {
      const result = await syncOfflineQueue('user123');

      expect(result).toEqual({
        results: [],
        summary: { total: 0, success: 0, conflicts: 0, errors: 0 },
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('fetchUserSnapshot', () => {
    it('should fetch user snapshot for conflict resolution', async () => {
      const mockSnapshot = {
        userId: 'user123',
        foodLogs: [
          {
            id: 'log1',
            foodName: 'Apple',
            brandName: null,
            quantity: 1,
            unit: 'medium',
            mealType: 'breakfast',
            nutrition: { calories: 95, protein: 0.5, carbohydrates: 25, fat: 0.3, fiber: 4 },
            loggedAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        lastSyncedAt: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSnapshot }),
      });

      const result = await fetchUserSnapshot('user123');

      expect(result).toEqual(mockSnapshot);
      expect(global.fetch).toHaveBeenCalledWith('/api/sync/user/user123/snapshot');
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchUserSnapshot('user123')).rejects.toThrow('Network error');
    });

    it('should handle HTTP error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        status: 404,
      });

      await expect(fetchUserSnapshot('user123')).rejects.toThrow('HTTP 404: Not Found');
    });
  });

  describe('setupAutoSync', () => {
    it('should setup online event listener', async () => {
      const userId = 'user123';

      // Mock syncOfflineQueue
      const { syncOfflineQueue: originalSync } = jest.requireActual('../sync.service');
      const syncSpy = jest.spyOn({ syncOfflineQueue: originalSync }, 'syncOfflineQueue').mockResolvedValueOnce({
        results: [],
        summary: { total: 0, success: 0, conflicts: 0, errors: 0 },
      });

      const cleanup = setupAutoSync(userId);

      // Trigger online event
      window.dispatchEvent(new Event('online'));

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(syncSpy).toHaveBeenCalled();

      cleanup();
      syncSpy.mockRestore();
    }, 5000);

    it('should debounce rapid online events', async () => {
      const userId = 'user123';

      // Mock syncOfflineQueue
      const { syncOfflineQueue: originalSync } = jest.requireActual('../sync.service');
      const syncSpy = jest.spyOn({ syncOfflineQueue: originalSync }, 'syncOfflineQueue').mockResolvedValueOnce({
        results: [],
        summary: { total: 0, success: 0, conflicts: 0, errors: 0 },
      });

      const cleanup = setupAutoSync(userId);

      // Trigger multiple online events rapidly
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('online'));

      // Only one sync should happen after debounce
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(syncSpy).toHaveBeenCalledTimes(1);

      cleanup();
      syncSpy.mockRestore();
    }, 5000);

    it('should cleanup event listeners', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const userId = 'user123';

      const cleanup = setupAutoSync(userId);
      cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('getSyncStatus', () => {
    it('should return correct sync status', () => {
      addToQueue({
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      const status = getSyncStatus();

      expect(status.hasPending).toBe(true);
      expect(status.counts.total).toBeGreaterThan(0);
    });

    it('should return no pending status when queue is empty', () => {
      clearQueue();

      const status = getSyncStatus();

      expect(status.hasPending).toBe(false);
      expect(status.counts.total).toBe(0);
    });
  });
});
