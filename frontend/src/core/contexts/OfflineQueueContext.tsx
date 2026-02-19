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
  sync: () => Promise<void>;
  refresh: () => void;
}

const OfflineQueueContext = createContext<OfflineQueueContextValue | undefined>(undefined);

export function OfflineQueueProvider({ children }: { children: ReactNode }) {
  const [operations, setOperations] = useState<OfflineOperation[]>([]);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

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

  return (
    <OfflineQueueContext.Provider
      value={{
        operations,
        counts,
        isOnline,
        isSyncing,
        sync,
        refresh,
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
