import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  isFullWidth?: boolean;
  containerClassName?: string;
}

// ============================================================================
// Styles
// ============================================================================

const baseInputStyles =
  'block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:border-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-500';

const sizeStyles: Record<Exclude<InputProps['size'], undefined>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
};

// ============================================================================
// Component
// ============================================================================

export const Input: React.FC<InputProps> = (props) => {
  const {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    size = 'md',
    isFullWidth = true,
    containerClassName = '',
    className = '',
    id,
    ...inputProps
  } = props;

  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  const hasError = !!error;
  const hasIcons = leftIcon || rightIcon;

  const containerClasses = `${isFullWidth ? 'w-full' : ''} ${containerClassName}`;
  const paddingClass = hasIcons ? (leftIcon ? 'pl-10' : '') + (rightIcon ? 'pr-10' : '') : '';
  const errorClass = hasError ? 'border-danger-500 text-danger-900 focus:border-danger-500 focus:ring-danger-500/20' : '';
  const inputClasses = `${baseInputStyles} ${sizeStyles[size]} ${errorClass} ${paddingClass} ${className}`;

  return (
    <div className={containerClasses}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={`${baseInputStyles} ${sizeStyles[size]} ${hasError ? 'border-danger-500 text-danger-900 focus:border-danger-500 focus:ring-danger-500/20' : ''} ${paddingClass} ${className}`}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...inputProps}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-danger-600">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-neutral-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
