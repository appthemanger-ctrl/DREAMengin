'use client';

import { TrendingUp, Users, Eye, Heart, MessageSquare, DollarSign } from 'lucide-react';
import { useState } from 'react';

interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  totalRevenue: number;
  viewsChange: number;
  likesChange: number;
  commentsChange: number;
  followersChange: number;
  revenueChange: number;
}

interface AnalyticsPanelProps {
  data?: AnalyticsData;
}

export default function AnalyticsPanel({ data }: AnalyticsPanelProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock data - in production, this would come from your database
  const defaultData: AnalyticsData = {
    totalViews: 12543,
    totalLikes: 3421,
    totalComments: 892,
    totalFollowers: 1567,
    totalRevenue: 2450,
    viewsChange: 12.5,
    likesChange: 8.3,
    commentsChange: -2.1,
    followersChange: 15.7,
    revenueChange: 23.4
  };

  const analyticsData = data || defaultData;

  const metrics = [
    {
      label: 'Total Views',
      value: analyticsData.totalViews.toLocaleString(),
      change: analyticsData.viewsChange,
      icon: Eye,
      color: 'blue'
    },
    {
      label: 'Total Likes',
      value: analyticsData.totalLikes.toLocaleString(),
      change: analyticsData.likesChange,
      icon: Heart,
      color: 'red'
    },
    {
      label: 'Total Comments',
      value: analyticsData.totalComments.toLocaleString(),
      change: analyticsData.commentsChange,
      icon: MessageSquare,
      color: 'green'
    },
    {
      label: 'Followers',
      value: analyticsData.totalFollowers.toLocaleString(),
      change: analyticsData.followersChange,
      icon: Users,
      color: 'purple'
    },
    {
      label: 'Revenue',
      value: `$${analyticsData.totalRevenue.toLocaleString()}`,
      change: analyticsData.revenueChange,
      icon: DollarSign,
      color: 'emerald'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
      red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
      green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: 'text-green-500' },
      purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-500' },
      emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Analytics Overview</h2>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {range === '7d' && 'Last 7 Days'}
              {range === '30d' && 'Last 30 Days'}
              {range === '90d' && 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metrics.map((metric) => {
          const colors = getColorClasses(metric.color);
          const Icon = metric.icon;
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
                {metric.value}
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
          Analytics are updated in real-time and reflect activity across all your content on Dreamengin.
        </p>
      </div>
    </div>
  );
}
