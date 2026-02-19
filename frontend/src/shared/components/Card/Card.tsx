import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  isHoverable?: boolean;
  onClick?: () => void;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const baseCardStyles = 'rounded-lg border border-neutral-200 bg-white shadow-sm';

const hoverStyles = 'transition-shadow duration-200 hover:shadow-md cursor-pointer';

// ============================================================================
// Components
// ============================================================================

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  isHoverable = false,
  onClick,
}) => {
  const cardStyles = `${baseCardStyles} ${isHoverable ? hoverStyles : ''} ${className}`;

  if (onClick) {
    return (
      <div className={cardStyles} onClick={onClick} role="button" tabIndex={0}>
        {children}
      </div>
    );
  }

  return <div className={cardStyles}>{children}</div>;
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`border-b border-neutral-100 bg-neutral-50 px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
}) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`border-t border-neutral-100 bg-neutral-50 px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
