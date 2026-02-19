'use client';

/**
 * Offline Queue Indicator
 * Floating indicator showing pending operations count
 */

import { useState, useEffect } from 'react';
import { getSyncStatus, getOperationCounts } from '@/core/api/services/sync.service';
import { OfflineQueueStatus } from './OfflineQueueStatus';

export function OfflineQueueIndicator() {
  const [counts, setCounts] = useState<ReturnType<typeof getOperationCounts>>({
    pending: 0,
    syncing: 0,
    success: 0,
    error: 0,
    total: 0,
  });
  const [hasPending, setHasPending] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const status = getSyncStatus();
      setCounts(status.counts);
      setHasPending(status.hasPending);
    };

    updateStatus();

    // Update status every 2 seconds
    const interval = setInterval(updateStatus, 2000);

    // Also update on storage events (for cross-tab sync)
    const handleStorageChange = () => {
      updateStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleClick = () => {
    setShowModal(true);
  };

  const getStatusColor = () => {
    if (counts.error > 0) return 'bg-red-500';
    if (counts.syncing > 0) return 'bg-blue-500';
    if (counts.pending > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (counts.error > 0) return 'Sync error';
    if (counts.syncing > 0) return 'Syncing...';
    if (counts.pending > 0) return `${counts.pending} pending`;
    return 'All synced';
  };

  // Don't show if no operations at all
  if (counts.total === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`fixed bottom-4 right-4 ${getStatusColor()} text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 flex items-center gap-2`}
        title="Click to view sync status"
      >
        <span className="font-semibold text-sm">{getStatusText()}</span>
      </button>

      {showModal && (
        <OfflineQueueStatus
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
