'use client';

/**
 * Offline Queue Status Modal
 * Shows list of queued operations and allows manual control
 */

import { useState, useEffect } from 'react';
import { getQueue, discardOperation, markForRetry, clearSuccessOperations, clearQueue } from '@/core/api/services/offline-queue.service';
import type { OfflineOperation } from '@/core/api/services/offline-queue.service';

interface OfflineQueueStatusProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfflineQueueStatus({ isOpen, onClose }: OfflineQueueStatusProps) {
  const [operations, setOperations] = useState<OfflineOperation[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadOperations();
    }
  }, [isOpen]);

  const loadOperations = () => {
    const queue = getQueue();
    setOperations(queue);
  };

  const handleRetry = (operationId: string) => {
    markForRetry(operationId);
    loadOperations();
  };

  const handleDiscard = (operationId: string) => {
    if (confirm('Are you sure you want to discard this operation?')) {
      discardOperation(operationId);
      loadOperations();
    }
  };

  const handleClearSuccess = () => {
    clearSuccessOperations();
    loadOperations();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all operations? This cannot be undone.')) {
      clearQueue();
      loadOperations();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Offline Queue Status</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div className="flex gap-4 text-sm">
            <span className="text-gray-600">Pending: <strong>{operations.filter(o => o.status === 'pending').length}</strong></span>
            <span className="text-gray-600">Syncing: <strong>{operations.filter(o => o.status === 'syncing').length}</strong></span>
            <span className="text-gray-600">Success: <strong>{operations.filter(o => o.status === 'success').length}</strong></span>
            <span className="text-gray-600">Error: <strong>{operations.filter(o => o.status === 'error').length}</strong></span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClearSuccess}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
              disabled={operations.filter(o => o.status === 'success').length === 0}
            >
              Clear Success
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {operations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No queued operations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {operations.map((operation) => (
                <OperationCard
                  key={operation.id}
                  operation={operation}
                  onRetry={() => handleRetry(operation.id)}
                  onDiscard={() => handleDiscard(operation.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface OperationCardProps {
  operation: OfflineOperation;
  onRetry: () => void;
  onDiscard: () => void;
}

function OperationCard({ operation, onRetry, onDiscard }: OperationCardProps) {
  const getStatusIcon = () => {
    switch (operation.status) {
      case 'pending':
        return <span className="text-yellow-500">⏳</span>;
      case 'syncing':
        return <span className="text-blue-500">🔄</span>;
      case 'success':
        return <span className="text-green-500">✅</span>;
      case 'error':
        return <span className="text-red-500">❌</span>;
    }
  };

  const getOperationTypeLabel = () => {
    switch (operation.type) {
      case 'create_log':
        return 'Create Log';
      case 'update_log':
        return 'Update Log';
      case 'delete_log':
        return 'Delete Log';
    }
  };

  const canRetry = operation.status === 'error' && operation.retryCount < 3;

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-semibold">{getOperationTypeLabel()}</span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(operation.timestamp).toLocaleString()}
        </span>
      </div>

      <div className="text-sm text-gray-600 mb-2">
        <pre className="bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(operation.data, null, 2)}
        </pre>
      </div>

      {operation.error && (
        <div className="text-sm text-red-600 mb-2">
          Error: {operation.error}
        </div>
      )}

      {operation.status !== 'success' && (
        <div className="flex gap-2 mt-2">
          {canRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
            >
              Retry
            </button>
          )}
          <button
            onClick={onDiscard}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
}
