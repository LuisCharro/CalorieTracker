import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'neutral' | 'white';
  text?: string;
}

// ============================================================================
// Styles
// ============================================================================

const sizeStyles: Record<NonNullable<LoadingProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const colorStyles: Record<NonNullable<LoadingProps['color']>, string> = {
  primary: 'text-primary-500',
  neutral: 'text-neutral-400',
  white: 'text-white',
};

// ============================================================================
// Component
// ============================================================================

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  color = 'primary',
  text,
}) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <svg
        className={`animate-spin ${sizeStyles[size]} ${colorStyles[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && <span className="text-sm font-medium text-neutral-600">{text}</span>}
    </div>
  );
};

export default Loading;
