import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Alert } from '../../shared/components/Alert';

describe('Alert Component', () => {
  it('renders alert with content', () => {
    render(<Alert type="success">Success message</Alert>);
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('renders different types', () => {
    const { rerender } = render(<Alert type="success">Success</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('bg-success-50');

    rerender(<Alert type="danger">Error</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('bg-danger-50');

    rerender(<Alert type="warning">Warning</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('bg-warning-50');

    rerender(<Alert type="info">Info</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('bg-neutral-50');
  });

  it('renders title when provided', () => {
    render(
      <Alert type="success" title="Success Title">
        Message
      </Alert>
    );
    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('renders dismiss button when dismissible', () => {
    const handleDismiss = jest.fn();
    render(
      <Alert type="success" dismissible onDismiss={handleDismiss}>
        Message
      </Alert>
    );
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const handleDismiss = jest.fn();
    render(
      <Alert type="success" dismissible onDismiss={handleDismiss}>
        Message
      </Alert>
    );
    
    screen.getByRole('button', { name: /dismiss/i }).click();
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('has correct ARIA role', () => {
    render(<Alert type="success">Message</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
