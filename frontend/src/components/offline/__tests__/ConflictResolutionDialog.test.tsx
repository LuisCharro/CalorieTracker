/**
 * Tests for ConflictResolutionDialog Component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConflictResolutionDialog } from '../ConflictResolutionDialog';
import type { ConflictData } from '../ConflictResolutionDialog';

describe('ConflictResolutionDialog', () => {
  const mockConflict: ConflictData = {
    operationId: 'op1',
    operationType: 'update_log',
    clientData: {
      foodName: 'Apple',
      quantity: 2,
    },
    serverData: {
      foodName: 'Apple',
      quantity: 3,
    },
  };

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <ConflictResolutionDialog
        isOpen={false}
        conflict={mockConflict}
        onResolve={() => {}}
        onDismiss={() => {}}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render when isOpen is true but conflict is null', () => {
    const { container } = render(
      <ConflictResolutionDialog
        isOpen={true}
        conflict={null}
        onResolve={() => {}}
        onDismiss={() => {}}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render dialog when isOpen is true and conflict is provided', () => {
    render(
      <ConflictResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={() => {}}
        onDismiss={() => {}}
      />
    );

    expect(screen.getByText('Resolve Conflict')).toBeInTheDocument();
    expect(screen.getByText(/This update log has conflicts/)).toBeInTheDocument();
  });

  it('should display client version', () => {
    render(
      <ConflictResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={() => {}}
        onDismiss={() => {}}
      />
    );

    expect(screen.getByText('Your Version')).toBeInTheDocument();

    // Find the client version section (first occurrence of the foodName)
    const clientSections = screen.getAllByText(/"foodName": "Apple"/);
    expect(clientSections.length).toBeGreaterThan(0);

    // Find the Your Version section's parent to verify the quantity
    const yourVersionLabel = screen.getByText('Your Version');
    const yourVersionSection = yourVersionLabel.closest('.border-2');
    expect(yourVersionSection).toHaveTextContent(/"quantity": 2/);
  });

  it('should display server version', () => {
    render(
      <ConflictResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={() => {}}
        onDismiss={() => {}}
      />
    );

    expect(screen.getByText('Server Version')).toBeInTheDocument();
    expect(screen.getByText(/"quantity": 3/)).toBeInTheDocument();
  });

  it('should call onResolve with client when Use My Version is clicked', () => {
    const onResolve = jest.fn();

    render(
      <ConflictResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={onResolve}
        onDismiss={() => {}}
      />
    );

    const clientButton = screen.getByText('Use My Version');
    fireEvent.click(clientButton);

    expect(onResolve).toHaveBeenCalledWith('client');
  });

  it('should call onResolve with server when Use Server Version is clicked', () => {
    const onResolve = jest.fn();

    render(
      <ConflictResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={onResolve}
        onDismiss={() => {}}
      />
    );

    const serverButton = screen.getByText('Use Server Version');
    fireEvent.click(serverButton);

    expect(onResolve).toHaveBeenCalledWith('server');
  });

  it('should call onDismiss when Cancel is clicked', () => {
    const onDismiss = jest.fn();

    render(
      <ConflictResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={() => {}}
        onDismiss={onDismiss}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('should call onDismiss when close button is clicked', () => {
    const onDismiss = jest.fn();

    render(
      <ConflictResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={() => {}}
        onDismiss={onDismiss}
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('should display operation type correctly', () => {
    render(
      <ConflictResolutionDialog
        isOpen={true}
        conflict={mockConflict}
        onResolve={() => {}}
        onDismiss={() => {}}
      />
    );

    expect(screen.getByText(/update log has conflicts/)).toBeInTheDocument();
  });
});
