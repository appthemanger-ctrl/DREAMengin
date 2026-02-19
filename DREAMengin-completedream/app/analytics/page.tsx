import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import { TrendingUp, Users, Eye, Heart, DollarSign, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // In production, fetch real analytics data from your database
  const analyticsData = {
    totalViews: 45231,
    totalLikes: 8921,
    totalComments: 2341,
    totalFollowers: 3456,
    totalRevenue: 5890,
    viewsChange: 15.3,
    likesChange: 12.7,
    commentsChange: -3.2,
    followersChange: 22.4,
    revenueChange: 34.6
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your performance and engagement across DREAMengin
          </p>
        </div>

        {/* Main Analytics Panel */}
        <div className="mb-8">
          <AnalyticsPanel data={analyticsData} />
        </div>

        {/* Additional Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Top Posts */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Top Posts</h3>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Quantum Computing Breakthrough', views: 12543, engagement: 89 },
                { title: 'AI Ethics Discussion', views: 8921, engagement: 76 },
                { title: 'New Music Release', views: 6734, engagement: 91 }
              ].map((post, idx) => (
                <div key={idx} className="pb-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {post.engagement}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Followers */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Recent Followers</h3>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Dr. Sarah Chen', handle: '@sarahchen', time: '2h ago' },
                { name: 'Alex Rivera', handle: '@alexr', time: '5h ago' },
                { name: 'Jordan Kim', handle: '@jordank', time: '1d ago' }
              ].map((follower, idx) => (
                <div key={idx} className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {follower.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {follower.handle}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    {follower.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Revenue Sources</h3>
            </div>
            <div className="space-y-3">
              {[
                { source: 'Ad Placements', amount: 3240, percentage: 55 },
                { source: 'Shop Sales', amount: 1850, percentage: 31 },
                { source: 'Tips & Donations', amount: 800, percentage: 14 }
              ].map((source, idx) => (
                <div key={idx} className="pb-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {source.source}
                    </p>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ${source.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Growth Trends */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Growth Trends</h3>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Export Data
              </button>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[65, 78, 82, 91, 88, 95, 100].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-gradient-to-t from-slate-700 to-slate-500 dark:from-slate-600 dark:to-slate-400 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Need more detailed analytics? Export your data or schedule automated reports to be sent to your email.
          </p>
        </div>
      </div>
    </div>
  );
}
