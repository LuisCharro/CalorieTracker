import React from 'react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: number;
}

export interface NavigationProps {
  items: NavItem[];
  activePath?: string;
  position?: 'top' | 'bottom' | 'left';
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const Navigation: React.FC<NavigationProps> = ({
  items,
  activePath,
  position = 'bottom',
  className = '',
}) => {
  const getNavStyles = () => {
    switch (position) {
      case 'top':
        return 'top-0 border-b border-neutral-200 bg-white';
      case 'bottom':
        return 'bottom-0 border-t border-neutral-200 bg-white';
      case 'left':
        return 'left-0 w-64 border-r border-neutral-200 bg-white h-screen fixed';
      default:
        return 'bottom-0 border-t border-neutral-200 bg-white';
    }
  };

  const getItemStyles = (isActive: boolean) => {
    return `
      flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
      ${isActive
        ? 'text-primary-600 bg-primary-50'
        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
      }
    `;
  };

  return (
    <nav className={`fixed ${position === 'left' ? 'left-0 top-0 h-full' : 'left-0 right-0'} z-40 ${getNavStyles()} ${className}`}>
      <ul className={`flex ${position === 'left' ? 'flex-col' : 'flex-row justify-around'}`}>
        {items.map((item) => {
          const isActive = activePath === item.href || (activePath?.startsWith(item.href) ?? false);

          return (
            <li key={item.href}>
              <Link href={item.href} className={getItemStyles(isActive)}>
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-danger-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;
