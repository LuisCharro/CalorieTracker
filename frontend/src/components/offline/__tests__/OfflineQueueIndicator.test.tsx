/**
 * Tests for OfflineQueueIndicator Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OfflineQueueIndicator } from '../OfflineQueueIndicator';

// Mock the sync service and offline queue service
jest.mock('@/core/api/services/sync.service', () => ({
  getSyncStatus: jest.fn(),
}));

jest.mock('@/core/api/services/offline-queue.service', () => ({
  getOperationCounts: jest.fn(),
}));

import { getSyncStatus } from '@/core/api/services/sync.service';
import { getOperationCounts } from '@/core/api/services/offline-queue.service';

const mockGetSyncStatus = getSyncStatus as jest.MockedFunction<typeof getSyncStatus>;
const mockGetOperationCounts = getOperationCounts as jest.MockedFunction<typeof getOperationCounts>;

describe('OfflineQueueIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when there are no operations', () => {
    mockGetSyncStatus.mockReturnValue({
      hasPending: false,
      counts: {
        pending: 0,
        syncing: 0,
        success: 0,
        error: 0,
        total: 0,
      },
    });

    mockGetOperationCounts.mockReturnValue({
      pending: 0,
      syncing: 0,
      success: 0,
      error: 0,
      total: 0,
    });

    const { container } = render(<OfflineQueueIndicator />);

    expect(container.firstChild).toBeNull();
  });

  it('should render green indicator when all synced', () => {
    mockGetSyncStatus.mockReturnValue({
      hasPending: false,
      counts: {
        pending: 0,
        syncing: 0,
        success: 1,
        error: 0,
        total: 1,
      },
    });

    mockGetOperationCounts.mockReturnValue({
      pending: 0,
      syncing: 0,
      success: 1,
      error: 0,
      total: 1,
    });

    render(<OfflineQueueIndicator />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-green-500');
    expect(screen.getByText('All synced')).toBeInTheDocument();
  });

  it('should render yellow indicator when there are pending operations', () => {
    mockGetSyncStatus.mockReturnValue({
      hasPending: true,
      counts: {
        pending: 2,
        syncing: 0,
        success: 0,
        error: 0,
        total: 2,
      },
    });

    mockGetOperationCounts.mockReturnValue({
      pending: 2,
      syncing: 0,
      success: 0,
      error: 0,
      total: 2,
    });

    render(<OfflineQueueIndicator />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-yellow-500');
    expect(screen.getByText('2 pending')).toBeInTheDocument();
  });

  it('should render blue indicator when syncing', () => {
    mockGetSyncStatus.mockReturnValue({
      hasPending: true,
      counts: {
        pending: 0,
        syncing: 1,
        success: 0,
        error: 0,
        total: 1,
      },
    });

    mockGetOperationCounts.mockReturnValue({
      pending: 0,
      syncing: 1,
      success: 0,
      error: 0,
      total: 1,
    });

    render(<OfflineQueueIndicator />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-500');
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  it('should render red indicator when there are errors', () => {
    mockGetSyncStatus.mockReturnValue({
      hasPending: true,
      counts: {
        pending: 0,
        syncing: 0,
        success: 0,
        error: 1,
        total: 1,
      },
    });

    mockGetOperationCounts.mockReturnValue({
      pending: 0,
      syncing: 0,
      success: 0,
      error: 1,
      total: 1,
    });

    render(<OfflineQueueIndicator />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-500');
    expect(screen.getByText('Sync error')).toBeInTheDocument();
  });

  it('should open modal when clicked', async () => {
    mockGetSyncStatus.mockReturnValue({
      hasPending: true,
      counts: {
        pending: 1,
        syncing: 0,
        success: 0,
        error: 0,
        total: 1,
      },
    });

    mockGetOperationCounts.mockReturnValue({
      pending: 1,
      syncing: 0,
      success: 0,
      error: 0,
      total: 1,
    });

    render(<OfflineQueueIndicator />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText('Offline Queue Status')).toBeInTheDocument();
    });
  });

  it('should update status periodically', async () => {
    let callCount = 0;
    mockGetSyncStatus.mockImplementation(() => {
      callCount++;
      return {
        hasPending: true,
        counts: {
          pending: callCount,
          syncing: 0,
          success: 0,
          error: 0,
          total: callCount,
        },
      };
    });

    mockGetOperationCounts.mockImplementation(() => {
      return {
        pending: callCount,
        syncing: 0,
        success: 0,
        error: 0,
        total: callCount,
      };
    });

    render(<OfflineQueueIndicator />);

    // Wait for periodic update
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(1);
    }, { timeout: 3000 });
  });

  it('should cleanup interval on unmount', () => {
    jest.useFakeTimers();

    mockGetSyncStatus.mockReturnValue({
      hasPending: true,
      counts: {
        pending: 1,
        syncing: 0,
        success: 0,
        error: 0,
        total: 1,
      },
    });

    mockGetOperationCounts.mockReturnValue({
      pending: 1,
      syncing: 0,
      success: 0,
      error: 0,
      total: 1,
    });

    const { unmount } = render(<OfflineQueueIndicator />);

    unmount();

    // Advance timers and check that no errors occur
    jest.advanceTimersByTime(3000);

    jest.useRealTimers();
  });
});
