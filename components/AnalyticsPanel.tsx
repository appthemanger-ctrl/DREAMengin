'use client';

/**
 * AnalyticsPanel — wired to the real /api/analytics backend.
 *
 * Architecture justification:
 *   docs/AXIOMS.md §3 — every visible action must do something real.
 *   The previous version used hardcoded mock data with a comment
 *   "// Mock data - in production, this would come from your database".
 *   This component now fetches live counts from the database.
 *
 *   docs/ARCHITECTURE.md §8: Gold = save/confirm/action; Light Blue = live
 *   state/connected state. Real analytics are exactly "live state".
 *
 * Performance: single fetch per time-range change; no render loops.
 * Graceful degradation: shows zero values when fetch fails.
 */

import { TrendingUp, Users, Eye, Heart, MessageSquare, DollarSign, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalyticsData {
  total_views:      number;
  total_likes:      number;
  total_comments:   number;
  total_followers:  number;
  total_revenue:    number;
  views_change:     number;
  likes_change:     number;
  comments_change:  number;
  followers_change: number;
  revenue_change:   number;
  period_days?:     number;
}

type TimeRange = '7d' | '30d' | '90d';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AnalyticsPanel() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [data, setData]           = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Fetch analytics ───────────────────────────────────────────────────────

  useEffect(() => {
    setIsLoading(true);
    setFetchError(null);

    fetch(`/api/analytics?range=${timeRange}`)
      .then((r) => {
        if (r.status === 401) return null;   // not logged in — show zeros
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<AnalyticsData>;
      })
      .then((d) => { if (d) setData(d); })
      .catch((err) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load analytics.');
      })
      .finally(() => setIsLoading(false));
  }, [timeRange]);

  // ── Derived display data ──────────────────────────────────────────────────

  const d = data ?? {
    total_views: 0, total_likes: 0, total_comments: 0,
    total_followers: 0, total_revenue: 0,
    views_change: 0, likes_change: 0, comments_change: 0,
    followers_change: 0, revenue_change: 0,
  };

  const metrics = [
    { label: 'Total Views',    value: d.total_views.toLocaleString(),   change: d.views_change,     icon: Eye,          color: 'blue' },
    { label: 'Total Likes',    value: d.total_likes.toLocaleString(),   change: d.likes_change,     icon: Heart,        color: 'red' },
    { label: 'Total Comments', value: d.total_comments.toLocaleString(), change: d.comments_change, icon: MessageSquare, color: 'green' },
    { label: 'Followers',      value: d.total_followers.toLocaleString(), change: d.followers_change, icon: Users,       color: 'purple' },
    { label: 'Revenue',        value: `$${d.total_revenue.toLocaleString()}`, change: d.revenue_change, icon: DollarSign, color: 'emerald' },
  ];

  // ── Color helpers ─────────────────────────────────────────────────────────

  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-600 dark:text-blue-400',    icon: 'text-blue-500' },
    red:     { bg: 'bg-red-50 dark:bg-red-900/20',      text: 'text-red-600 dark:text-red-400',      icon: 'text-red-500' },
    green:   { bg: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-600 dark:text-green-400',  icon: 'text-green-500' },
    purple:  { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-500' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Analytics Overview</h2>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-1" />}
        </div>

        {/* Time range selector */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {fetchError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
          Could not load analytics: {fetchError}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metrics.map((metric) => {
          const colors    = colorClasses[metric.color] ?? colorClasses.blue;
          const Icon      = metric.icon;
          const isPositive = metric.change >= 0;

          return (
            <div
              key={metric.label}
              className={`${colors.bg} rounded-lg p-4 border border-slate-200 dark:border-slate-700 transition-transform hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${colors.icon}`} />
                <span className={`text-xs font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isPositive ? '+' : ''}{metric.change.toFixed(1)}%
                </span>
              </div>
              <div className={`text-2xl font-bold ${colors.text} mb-1`}>
                {isLoading ? '—' : metric.value}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {metric.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          {fetchError
            ? 'Analytics could not be loaded. Check your connection and try again.'
            : 'Analytics reflect your activity across all DREAMengin surfaces for the selected period.'}
        </p>
      </div>
    </div>
  );
}

