import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, Users, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analytics Daydream – DREAMengin', description: 'Overview of your reach, revenue, and growth.' };

export default async function AnalyticsDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const metrics = [
    { value: '—', label: 'Total Reach', delta: '+0%', icon: Users,      color: '#0ea5e9' },
    { value: '—', label: 'Revenue',     delta: '+0%', icon: DollarSign, color: '#22c55e' },
    { value: '—', label: 'Growth',      delta: '+0%', icon: TrendingUp, color: '#6366f1' },
    { value: '—', label: 'Engagement',  delta: '+0%', icon: Zap,        color: '#f59e0b' },
  ];

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <BarChart3 className="w-5 h-5" style={{ color: '#6366f1' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Analytics</h1>
          <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>Daydream</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Overview metrics */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Overview</span></div>
          <div className="de-widget-body">
            <div className="grid grid-cols-2 gap-3">
              {metrics.map(({ value, label, delta, icon: Icon, color }) => (
                <div key={label} className="de-surface p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4" style={{ color }} />
                    <span className="de-metric-delta text-xs">{delta}</span>
                  </div>
                  <div className="de-metric-value">{value}</div>
                  <div className="de-metric-label mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Traffic widget */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Traffic</span></div>
          <div className="de-widget-body">
            <div style={{ height: 120, background: 'rgba(99,102,241,0.05)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Connect data sources to see traffic chart</p>
            </div>
          </div>
        </div>

        {/* Revenue widget */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Revenue</span></div>
          <div className="de-widget-body">
            <div style={{ height: 100, background: 'rgba(34,197,94,0.05)', borderRadius: 12, border: '1px solid rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>No revenue data yet</p>
            </div>
          </div>
        </div>

        {/* Quick action tiles */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Quick Actions</span></div>
          <div className="de-widget-body">
            <div className="grid grid-cols-2 gap-2">
              {['Export Report', 'Set Goals', 'Share Dashboard', 'Schedule Review'].map((action) => (
                <button key={action} type="button" className="de-btn de-btn-ghost text-xs" style={{ justifyContent: 'flex-start' }}>
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
