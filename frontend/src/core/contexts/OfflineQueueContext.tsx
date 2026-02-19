'use client';

/**
 * Offline Queue Context
 * Provides offline queue state and operations to the app
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  getQueue,
  getOperationCounts,
  syncOfflineQueue,
  setupAutoSync,
  getSyncStatus,
  type OfflineOperation,
} from '@/core/api/services/sync.service';
import { tokenManager } from '../api/client';

interface OfflineQueueContextValue {
  operations: OfflineOperation[];
  counts: ReturnType<typeof getOperationCounts>;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  sync: () => Promise<void>;
  refresh: () => void;
  hasPendingOperations: boolean;
}

const OfflineQueueContext = createContext<OfflineQueueContextValue | undefined>(undefined);

export function OfflineQueueProvider({ children }: { children: ReactNode }) {
  const [operations, setOperations] = useState<OfflineOperation[]>([]);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setOperations(getQueue());
  }, []);

  const sync = useCallback(async () => {
    const userId = tokenManager.getUserId();
    if (!userId) {
      console.warn('[Offline Queue] No user ID, skipping sync');
      return;
    }

    setIsSyncing(true);
    try {
      await syncOfflineQueue(userId);
      refresh();
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      console.error('[Offline Queue] Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();

    // Setup auto-sync when coming back online
    const userId = tokenManager.getUserId();
    let cleanup: (() => void) | undefined;

    if (userId) {
      cleanup = setupAutoSync(userId);
    }

    // Listen for network status changes
    const handleOnline = () => {
      setIsOnline(true);
      refresh();
      setLastSyncedAt(new Date().toISOString());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (cleanup) {
        cleanup();
      }
    };
  }, [refresh]);

  const counts = getOperationCounts();
  const hasPendingOperations = counts.pending > 0 || counts.error > 0;

  return (
    <OfflineQueueContext.Provider
      value={{
        operations,
        counts,
        isOnline,
        isSyncing,
        lastSyncedAt,
        sync,
        refresh,
        hasPendingOperations,
      }}
    >
      {children}
    </OfflineQueueContext.Provider>
  );
}

export function useOfflineQueue(): OfflineQueueContextValue {
  const context = useContext(OfflineQueueContext);
  if (context === undefined) {
    throw new Error('useOfflineQueue must be used within an OfflineQueueProvider');
  }
  return context;
}
