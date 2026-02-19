import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface LayoutProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const maxWidthStyles: Record<NonNullable<LayoutProps['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-7xl',
};

// ============================================================================
// Component
// ============================================================================

export const Layout: React.FC<LayoutProps> = ({
  children,
  maxWidth = 'full',
  className = '',
}) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${maxWidthStyles[maxWidth]} ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
