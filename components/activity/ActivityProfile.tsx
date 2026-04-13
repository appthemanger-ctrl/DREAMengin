// components/activity/ActivityProfile.tsx
// Phase 9 — Activity Profile Display
//
// Displays user activity metrics: Views, AQS, Real Shit Rate, Activity Points.
// Per ACTIVITY_FIRST_PROTOCOL.md §IV (User Metrics)

'use client';

import { useEffect, useState } from 'react';
import { getUserMetrics, formatAQS, formatRealShitRate, getAQSTier, getAQSTierColor } from '@/lib/activity/aqs';
import type { UserMetrics } from '@/lib/activity/types';
import { TierBadge } from './TierBadge';

interface ActivityProfileProps {
  userId: string;
  showFullStats?: boolean;
}

export function ActivityProfile({ userId, showFullStats = true }: ActivityProfileProps) {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);
      const data = await getUserMetrics(userId);
      setMetrics(data);
      setLoading(false);
    }

    loadMetrics();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm">
        No activity metrics yet. Start posting!
      </div>
    );
  }

  const aqsTier = getAQSTier(metrics.aqs);
  const aqsColor = getAQSTierColor(metrics.aqs);

  return (
    <div className="space-y-4">
      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Views */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            👁️ {metrics.total_views.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total Views
          </div>
        </div>

        {/* Activity Points */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ⭐ {metrics.activity_points_30d.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Activity Points (30d)
          </div>
        </div>

        {/* Activity Quality Score */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className={`text-2xl font-bold ${aqsColor}`}>
            📈 {formatAQS(metrics.aqs)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            AQS - {aqsTier}
          </div>
        </div>

        {/* Real Shit Rate */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            🔥 {formatRealShitRate(metrics.real_shit_rate)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real Shit Rate
          </div>
        </div>
      </div>

      {/* Full Stats (optional) */}
      {showFullStats && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Activity Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Views per Post:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {metrics.views_per_post.toFixed(1)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Days Active (30d):</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {metrics.days_active_30d}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Posts:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {metrics.total_posts}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Verified Posts:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {metrics.verified_posts} of {metrics.total_posts}
              </span>
            </div>

            {metrics.most_viewed_post_id && (
              <div className="col-span-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Most Viewed:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    🏆 {metrics.most_viewed_count.toLocaleString()} views
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            Last updated: {new Date(metrics.calculated_at).toLocaleString()}
          </div>
        </div>
      )}

      {/* AQS Explanation */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <strong>AQS</strong> = (Activity Points × Views per Post) ÷ Days Active
        <br />
        Higher AQS = you do things, people watch, you&apos;re contributing.
      </div>
    </div>
  );
}
