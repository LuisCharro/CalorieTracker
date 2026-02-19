'use client';

/**
 * Network Status Monitor
 * Monitors network status and shows toast notifications
 */

import { useState, useEffect } from 'react';

export function NetworkStatusMonitor() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);

      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);

      // Keep offline notification visible
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  if (!showNotification) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 ${
        isOnline ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'
      } border-l-4`}
    >
      <span className={`text-xl ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
        {isOnline ? '🌐' : '📴'}
      </span>
      <div className="flex-1">
        <p className={`font-semibold ${isOnline ? 'text-green-800' : 'text-red-800'}`}>
          {isOnline ? 'You are back online' : 'You are offline'}
        </p>
        <p className={`text-sm ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
          {isOnline
            ? 'Your changes will sync automatically'
            : 'Changes will be saved locally and synced when you are back online'}
        </p>
      </div>
      <button
        onClick={handleCloseNotification}
        className={`text-xl ${isOnline ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
      >
        ×
      </button>
    </div>
  );
}
