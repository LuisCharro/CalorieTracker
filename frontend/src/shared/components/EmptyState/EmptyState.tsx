'use client';

import Link from 'next/link';
import { Button } from '../Button';

interface EmptyStateProps {
  /** Emoji or icon to display */
  icon?: string;
  /** Title of the empty state */
  title: string;
  /** Description text */
  description?: string;
  /** CTA button text */
  actionLabel?: string;
  /** CTA button click handler */
  onAction?: () => void;
  /** Optional href for button when using Link - renders as anchor */
  href?: string;
  /** Optional secondary action */
  secondaryActionLabel?: string;
  /** Secondary action click handler */
  onSecondaryAction?: () => void;
}

/**
 * Reusable empty state component for when lists have no data
 */
export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  href,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div className="py-8 px-4 text-center">
      {/* Icon */}
      <div className="text-5xl mb-4" role="img" aria-label={title}>
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-neutral-600 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {actionLabel && (
            href ? (
              <Link href={href}>
                <Button size="lg">
                  {actionLabel}
                </Button>
              </Link>
            ) : (
              <Button onClick={onAction} size="lg">
                {actionLabel}
              </Button>
            )
          )}
          {secondaryActionLabel && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              size="lg"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
