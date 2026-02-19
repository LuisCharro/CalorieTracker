import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Input } from '../../shared/components/Input';

describe('Input Component', () => {
  it('renders input correctly', () => {
    render(<Input label="Email" type="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows helper text', () => {
    render(<Input label="Password" helperText="Must be 8+ characters" />);
    expect(screen.getByText('Must be 8+ characters')).toBeInTheDocument();
  });

  it('does not show helper text when error is present', () => {
    render(
      <Input
        label="Password"
        error="Too short"
        helperText="Must be 8+ characters"
      />
    );
    expect(screen.getByText('Too short')).toBeInTheDocument();
    expect(screen.queryByText('Must be 8+ characters')).not.toBeInTheDocument();
  });

  it('calls onChange handler', () => {
    const handleChange = jest.fn();
    render(<Input label="Name" onChange={handleChange} />);
    
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input label="Email" disabled />);
    expect(screen.getByLabelText('Email')).toBeDisabled();
  });

  it('renders left and right icons', () => {
    render(
      <Input
        label="Search"
        leftIcon={<span>🔍</span>}
        rightIcon={<span>✓</span>}
      />
    );
    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
});
