'use client';

import React, { useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  variant?: 'underline' | 'pills' | 'bordered';
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const variantStyles: Record<NonNullable<TabsProps['variant']>, string> = {
  underline: 'border-b border-neutral-200',
  pills: 'space-x-2 bg-neutral-100 p-1 rounded-lg inline-flex',
  bordered: 'flex flex-wrap gap-2',
};

const tabButtonStyles: Record<NonNullable<TabsProps['variant']>, string> = {
  underline: 'relative px-4 py-2 text-sm font-medium transition-colors',
  pills: 'px-4 py-2 text-sm font-medium transition-colors rounded-md',
  bordered: 'px-4 py-2 text-sm font-medium transition-colors border rounded-lg',
};

const activeTabStyles: Record<NonNullable<TabsProps['variant']>, string> = {
  underline: 'text-primary-600',
  pills: 'bg-white text-primary-600 shadow-sm',
  bordered: 'border-primary-500 text-primary-600 bg-primary-50',
};

const inactiveTabStyles: Record<NonNullable<TabsProps['variant']>, string> = {
  underline: 'text-neutral-500 hover:text-neutral-700',
  pills: 'text-neutral-600 hover:text-neutral-900',
  bordered: 'border-neutral-300 text-neutral-600 hover:border-neutral-400',
};

// ============================================================================
// Component
// ============================================================================

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  variant = 'underline',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  if (!tabs.length) return null;

  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className={variantStyles[variant]}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.disabled}
            className={`${tabButtonStyles[variant]} ${
              activeTab === tab.id ? activeTabStyles[variant] : inactiveTabStyles[variant]
            } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={activeTab === tab.id ? 'block' : 'hidden'}
            role="tabpanel"
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
