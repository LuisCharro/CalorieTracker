'use client';

/**
 * Conflict Resolution Dialog
 * Shows user both versions (client and server) and allows them to choose
 */

import React from 'react';

export interface ConflictData {
  operationId: string;
  operationType: string;
  clientData: Record<string, unknown>;
  serverData: Record<string, unknown>;
}

interface ConflictResolutionDialogProps {
  isOpen: boolean;
  conflict: ConflictData | null;
  onResolve: (choice: 'client' | 'server') => void;
  onDismiss: () => void;
}

export function ConflictResolutionDialog({
  isOpen,
  conflict,
  onResolve,
  onDismiss,
}: ConflictResolutionDialogProps) {
  if (!isOpen || !conflict) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Resolve Conflict</h2>
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          <p className="text-gray-600 mb-4">
            This {conflict.operationType.replace('_', ' ')} has conflicts between your local version
            and the server version. Please choose which version to keep.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Client Version */}
            <div className="border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Your Version
                </span>
              </div>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(conflict.clientData, null, 2)}
              </pre>
            </div>

            {/* Server Version */}
            <div className="border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Server Version
                </span>
              </div>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(conflict.serverData, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onResolve('server')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Use Server Version
            </button>
            <button
              onClick={() => onResolve('client')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Use My Version
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
