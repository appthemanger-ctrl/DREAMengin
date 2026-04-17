// components/idari/PlatformHealth.tsx
// Phase 9 — IDARi Platform Health Dashboard
//
// Displays platform health metrics and targets.
// Per ACTIVITY_FIRST_PROTOCOL.md §IV (Platform Health Metrics) & §IX (Success Conditions)

'use client';

import { useEffect, useState } from 'react';
import type { GetPlatformMetricsResponse } from '@/lib/activity/types';
import { PLATFORM_HEALTH_TARGETS } from '@/lib/activity/types';

export function PlatformHealth() {
  const [metrics, setMetrics] = useState<GetPlatformMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch('/api/metrics/platform');
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error('[PlatformHealth] Error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();

    // Refresh every 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-gray-500 dark:text-gray-400">
        Failed to load platform metrics
      </div>
    );
  }

  const healthCards = [
    {
      name: 'Real Shit Rate',
      value: metrics.real_shit_rate,
      target: PLATFORM_HEALTH_TARGETS.real_shit_rate,
      unit: '%',
      description: 'Verified Posts ÷ Total Posts',
      comparator: 'greater' as const,
    },
    {
      name: 'Creation-to-Consumption Ratio',
      value: metrics.creation_to_consumption_ratio,
      target: PLATFORM_HEALTH_TARGETS.creation_to_consumption_ratio,
      unit: '',
      description: 'Time Creating ÷ Time Watching',
      comparator: 'greater' as const,
    },
    {
      name: 'Outside Activity Rate',
      value: metrics.outside_activity_rate,
      target: PLATFORM_HEALTH_TARGETS.outside_activity_rate,
      unit: '%',
      description: 'Physical Activity Posts ÷ Total Posts',
      comparator: 'greater' as const,
    },
    {
      name: 'Ad View Rate',
      value: metrics.ad_view_rate,
      target: PLATFORM_HEALTH_TARGETS.ad_view_rate,
      unit: '%',
      description: 'Ads Watched ÷ Total Ad Impressions',
      comparator: 'greater' as const,
    },
    {
      name: 'Harmful Content Rate',
      value: metrics.harmful_content_rate,
      target: PLATFORM_HEALTH_TARGETS.harmful_content_rate,
      unit: '%',
      description: 'Flagged Content ÷ Total Posts',
      comparator: 'less' as const,
    },
    {
      name: 'Average AQS',
      value: metrics.average_aqs,
      target: PLATFORM_HEALTH_TARGETS.average_aqs,
      unit: '',
      description: 'Sum AQS ÷ Active Users',
      comparator: 'greater' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Platform Health (IDARi Dashboard)
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Updated: {new Date(metrics.calculated_at).toLocaleString()}
        </div>
      </div>

      {/* Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthCards.map((card) => {
          const isHealthy =
            card.comparator === 'greater'
              ? card.value >= card.target
              : card.value <= card.target;

          const percentage =
            card.comparator === 'greater'
              ? (card.value / card.target) * 100
              : card.value === 0
                ? 100
                : Math.max(0, 100 - (card.value / card.target) * 100);

          return (
            <div
              key={card.name}
              className={`rounded-lg p-6 border-2 ${
                isHealthy
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {card.name}
                </h3>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    isHealthy
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {isHealthy ? '✓ HEALTHY' : '✗ NEEDS WORK'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {card.value.toFixed(card.unit === '%' ? 1 : 0)}
                  {card.unit}
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Target: {card.comparator === 'greater' ? '>' : '<'}{' '}
                  {card.target}
                  {card.unit}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isHealthy ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {card.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform Stats */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Platform Statistics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total Active Users:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {metrics.total_active_users.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total Verified Views:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {metrics.total_verified_views.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Success Conditions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Success Conditions (per ACTIVITY_FIRST_PROTOCOL.md §IX)
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          The Activity-First Protocol succeeds when users are doing things worth watching,
          and people are watching. All metrics must meet targets for full protocol success.
        </p>
      </div>
    </div>
  );
}
