import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import AnalyticsEngin from '@/components/daydream/AnalyticsEngin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analytics Daydream – Dreamengin', description: 'Collect and review your social media analytics for branding.' };

const WIDGETS: DaydreamWidget[] = [
  { id: 'connect',   emoji: '🔌', label: 'Connect Platforms', desc: 'Link Instagram, TikTok, X, YouTube', color: '#6366f1', href: '/connectors' },
  { id: 'brand',     emoji: '🎨', label: 'Brand Daydream',    desc: 'Apply insights to your brand',      color: '#ec4899', href: '/daydream/brand' },
  { id: 'post',      emoji: '📢', label: 'New Post',          desc: 'Create and share content',          color: '#0ea5e9', href: '/create' },
  { id: 'audience',  emoji: '👥', label: 'Audience',          desc: 'Understand who follows you',        color: '#22c55e', href: '/daydream/brand' },
  { id: 'algorithm', emoji: '⚡', label: 'Signals',           desc: 'Tune reach and visibility',         color: '#f59e0b', href: '/settings/algorithm' },
  { id: 'profile',   emoji: '🌐', label: 'View Profile',      desc: 'See what your audience sees',       color: '#8b5cf6', href: '/view-profile' },
];

export default async function AnalyticsDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Analytics"
      enginName="AnalyticsEngin"
      accentColor="#6366f1"
      daydreamType="analytics"
      widgets={WIDGETS}
      sideBComponent={AnalyticsEngin}
    >
      <div className="de-sky-bg min-h-screen">
        <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/homedream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1 }}>DREAMengin</div>
              <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                <BarChart2 className="w-4 h-4" style={{ color: '#6366f1' }} />
                <h1 className="text-base font-bold" style={{ color: 'var(--de-heading)' }}>Analytics</h1>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>Daydream</span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

          {/* Cross-platform summary */}
          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">Social Media Overview</span></div>
            <div className="de-widget-body">
              <div className="grid grid-cols-3 gap-3">
                {[['—', 'Reach'], ['—', 'Engagement'], ['—', 'Growth']].map(([val, lbl]) => (
                  <div key={lbl} className="de-metric de-surface">
                    <span className="de-metric-value">{val}</span>
                    <span className="de-metric-label">{lbl}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--de-text-dim)' }}>
                Open <strong>AnalyticsEngin</strong> (corner tab) to sync live data from your connected platforms.
              </p>
            </div>
          </div>

          {/* Connected platforms */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Connected Platforms</span>
              <Link href="/connectors" className="text-xs font-semibold" style={{ color: '#6366f1' }}>Manage →</Link>
            </div>
            <div className="de-widget-body">
              <div className="grid grid-cols-2 gap-3">
                {[['📸', 'Instagram'], ['🎵', 'TikTok'], ['🐦', 'X'], ['▶️', 'YouTube']].map(([emoji, name]) => (
                  <div key={name} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{emoji}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{name}</div>
                      <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>Not connected</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="de-widget-actions">
              <Link href="/connectors" className="de-btn de-btn-primary text-xs">Connect a Platform</Link>
            </div>
          </div>

          {/* Brand link */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Feeds Into</span>
            </div>
            <div className="de-widget-body flex items-center gap-4">
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(236,72,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(236,72,153,0.2)', flexShrink: 0 }}>
                <span style={{ fontSize: 20 }}>🎨</span>
              </div>
              <div>
                <div className="font-bold" style={{ color: 'var(--de-heading)' }}>Brand Daydream</div>
                <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Analytics data powers your branding decisions</div>
              </div>
            </div>
            <div className="de-widget-actions">
              <Link href="/daydream/brand" className="de-btn de-btn-ghost text-xs">Open Brand →</Link>
            </div>
          </div>

        </div>
      </div>
    </DaydreamShell>
  );
}
