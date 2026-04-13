// components/activity/TierBadge.tsx
// Phase 9 — Activity Tier Badge
//
// Displays activity tier classification (0-6) as a badge.
// Per ACTIVITY_FIRST_PROTOCOL.md §II (Activity Types and Tiers)

'use client';

import { ActivityTier } from '@/lib/activity/types';
import { getTierDisplayName, getTierDescription } from '@/lib/activity/scoring';

interface TierBadgeProps {
  tier: ActivityTier;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TierBadge({ tier, showDescription = false, size = 'md' }: TierBadgeProps) {
  const name = getTierDisplayName(tier);
  const description = getTierDescription(tier);

  // Tier colors
  const colorClasses = {
    [ActivityTier.PASSIVE]: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    [ActivityTier.REFLECTION]: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    [ActivityTier.SKILL_DEVELOPMENT]: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    [ActivityTier.ON_PLATFORM_CREATION]: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    [ActivityTier.REAL_WORLD_ACTION]: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    [ActivityTier.ON_PLATFORM_INNOVATION]: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    [ActivityTier.NEVER_DONE_BEFORE]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  const colorClass = colorClasses[tier];
  const sizeClass = sizeClasses[size];

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}
        title={description}
      >
        Tier {tier}: {name}
      </span>

      {showDescription && (
        <span className="text-xs text-gray-600 dark:text-gray-400 max-w-xs">
          {description}
        </span>
      )}
    </div>
  );
}
