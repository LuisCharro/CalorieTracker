/**
 * Tests for OfflineQueueStatus Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OfflineQueueStatus } from '../OfflineQueueStatus';

// Mock the offline queue service
jest.mock('@/core/api/services/offline-queue.service', () => ({
  getQueue: jest.fn(),
  discardOperation: jest.fn(),
  markForRetry: jest.fn(),
  clearSuccessOperations: jest.fn(),
  clearQueue: jest.fn(),
}));

import {
  getQueue,
  discardOperation,
  markForRetry,
  clearSuccessOperations,
  clearQueue,
} from '@/core/api/services/offline-queue.service';
import type { OfflineOperation } from '@/core/api/services/offline-queue.service';

const mockGetQueue = getQueue as jest.MockedFunction<typeof getQueue>;
const mockDiscardOperation = discardOperation as jest.MockedFunction<typeof discardOperation>;
const mockMarkForRetry = markForRetry as jest.MockedFunction<typeof markForRetry>;
const mockClearSuccessOperations = clearSuccessOperations as jest.MockedFunction<typeof clearSuccessOperations>;
const mockClearQueue = clearQueue as jest.MockedFunction<typeof clearQueue>;

describe('OfflineQueueStatus', () => {
  const mockOperations: OfflineOperation[] = [
    {
      id: 'op1',
      type: 'create_log',
      data: { foodName: 'Apple' },
      timestamp: '2024-01-01T00:00:00Z',
      status: 'pending',
      retryCount: 0,
    },
    {
      id: 'op2',
      type: 'update_log',
      data: { quantity: 2 },
      timestamp: '2024-01-02T00:00:00Z',
      status: 'success',
      retryCount: 0,
    },
    {
      id: 'op3',
      type: 'delete_log',
      data: { logId: '123' },
      timestamp: '2024-01-03T00:00:00Z',
      status: 'error',
      retryCount: 1,
      error: 'Network error',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetQueue.mockReturnValue(mockOperations);
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(<OfflineQueueStatus isOpen={false} onClose={() => {}} />);

    expect(container.firstChild).toBeNull();
  });

  it('should render modal when isOpen is true', () => {
    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Offline Queue Status')).toBeInTheDocument();
    expect(screen.getByText('Pending: 1')).toBeInTheDocument();
    expect(screen.getByText('Syncing: 0')).toBeInTheDocument();
    expect(screen.getByText('Success: 1')).toBeInTheDocument();
    expect(screen.getByText('Error: 1')).toBeInTheDocument();
  });

  it('should render empty state when no operations', () => {
    mockGetQueue.mockReturnValue([]);

    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('No queued operations')).toBeInTheDocument();
  });

  it('should render operation cards', () => {
    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Create Log')).toBeInTheDocument();
    expect(screen.getByText('Update Log')).toBeInTheDocument();
    expect(screen.getByText('Delete Log')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    const onClose = jest.fn();
    render(<OfflineQueueStatus isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should close modal when Close button is clicked', () => {
    const onClose = jest.fn();
    render(<OfflineQueueStatus isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should handle retry for error operation', () => {
    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    const retryButtons = screen.getAllByText('Retry');
    expect(retryButtons).toHaveLength(1); // Only error operation

    fireEvent.click(retryButtons[0]);

    expect(mockMarkForRetry).toHaveBeenCalledWith('op3');
    expect(mockGetQueue).toHaveBeenCalled();
  });

  it('should handle discard operation', () => {
    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    const discardButtons = screen.getAllByText('Discard');
    expect(discardButtons.length).toBeGreaterThan(0);

    fireEvent.click(discardButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to discard this operation?');
    expect(mockDiscardOperation).toHaveBeenCalled();
    expect(mockGetQueue).toHaveBeenCalled();
  });

  it('should not discard if user cancels confirm', () => {
    // Mock window.confirm
    window.confirm = jest.fn(() => false);

    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    const discardButtons = screen.getAllByText('Discard');
    fireEvent.click(discardButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDiscardOperation).not.toHaveBeenCalled();
  });

  it('should clear success operations', () => {
    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    const clearSuccessButton = screen.getByText('Clear Success');
    fireEvent.click(clearSuccessButton);

    expect(mockClearSuccessOperations).toHaveBeenCalled();
    expect(mockGetQueue).toHaveBeenCalled();
  });

  it('should clear all operations with confirmation', () => {
    window.confirm = jest.fn(() => true);

    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    const clearAllButton = screen.getByText('Clear All');
    fireEvent.click(clearAllButton);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear all operations? This cannot be undone.');
    expect(mockClearQueue).toHaveBeenCalled();
    expect(mockGetQueue).toHaveBeenCalled();
  });

  it('should not clear all if user cancels confirm', () => {
    window.confirm = jest.fn(() => false);

    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    const clearAllButton = screen.getByText('Clear All');
    fireEvent.click(clearAllButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockClearQueue).not.toHaveBeenCalled();
  });

  it('should disable Clear Success button when no successful operations', () => {
    mockGetQueue.mockReturnValue([
      {
        id: 'op1',
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
        status: 'pending',
        retryCount: 0,
      },
    ]);

    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    const clearSuccessButton = screen.getByText('Clear Success');
    expect(clearSuccessButton).toBeDisabled();
  });

  it('should show error message for failed operations', () => {
    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Error: Network error')).toBeInTheDocument();
  });

  it('should show operation data as JSON', () => {
    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    expect(screen.getByText(/"foodName":/)).toBeInTheDocument();
  });

  it('should load operations when modal opens', () => {
    const { rerender } = render(<OfflineQueueStatus isOpen={false} onClose={() => {}} />);

    expect(mockGetQueue).not.toHaveBeenCalled();

    rerender(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    expect(mockGetQueue).toHaveBeenCalled();
  });

  it('should show retry button only for operations under max retries', () => {
    const operationsWithMaxRetries: OfflineOperation[] = [
      {
        id: 'op1',
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
        status: 'error',
        retryCount: 3, // Max retries
        error: 'Failed',
      },
    ];

    mockGetQueue.mockReturnValue(operationsWithMaxRetries);

    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    // No retry button should be shown for max retries
    const retryButtons = screen.queryAllByText('Retry');
    expect(retryButtons).toHaveLength(0);
  });

  it('should not show action buttons for successful operations', () => {
    const successOps: OfflineOperation[] = [
      {
        id: 'op1',
        type: 'create_log',
        data: { foodName: 'Apple' },
        timestamp: '2024-01-01T00:00:00Z',
        status: 'success',
        retryCount: 0,
      },
    ];

    mockGetQueue.mockReturnValue(successOps);

    render(<OfflineQueueStatus isOpen={true} onClose={() => {}} />);

    // No retry/discard buttons for successful ops
    const retryButtons = screen.queryAllByText('Retry');
    const discardButtons = screen.queryAllByText('Discard');
    expect(retryButtons).toHaveLength(0);
    expect(discardButtons).toHaveLength(0);
  });
});
