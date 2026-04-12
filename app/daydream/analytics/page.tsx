import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BarChart2, TrendingUp, Bell, Target, Users, Calendar, DollarSign, Download } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import AnalyticsEngin from '@/engins/analytics/AnalyticsEngin';
import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader';
import { connection } from 'next/server';

export const metadata = { title: 'Analytics Daydream – Dreamengin', description: 'Collect and review your social media analytics for branding.' };

const WIDGETS: DaydreamWidget[] = [
  { id: 'connect',   emoji: '🔌', label: 'Connect Platforms', desc: 'Link Instagram, TikTok, X, YouTube', color: '#6366f1', href: '/connectors' },
  { id: 'brand',     emoji: '🎨', label: 'Brand Daydream',    desc: 'Apply insights to your brand',      color: '#ec4899', href: '/daydream/brand' },
  { id: 'post',      emoji: '📢', label: 'New Post',          desc: 'Create and share content',          color: '#0ea5e9', href: '/daydream/create' },
  { id: 'audience',  emoji: '👥', label: 'Audience',          desc: 'Understand who follows you',        color: '#22c55e', href: '/daydream/brand' },
  { id: 'algorithm', emoji: '⚡', label: 'Signals',           desc: 'Tune reach and visibility',         color: '#f59e0b', href: '/settings/algorithm' },
  { id: 'profile',   emoji: '🌐', label: 'View Profile',      desc: 'See what your audience sees',       color: '#8b5cf6', href: '/view-profile' },
];

const ACCENT = '#6366f1';

export default async function AnalyticsDaydreamPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Analytics"
      enginName="AnalyticsEngin"
      accentColor={ACCENT}
      daydreamType="analytics"
      widgets={WIDGETS}
      sideBComponent={AnalyticsEngin}
    >
      <div className="de-sky-bg min-h-screen">
        <AuthenticatedPageHeader
          backHref="/homedream"
          title="Analytics"
          subtitle="Reach, growth, and signal tracking framed like a premium control board."
          icon={<BarChart2 className="w-4 h-4" />}
          accentColor="#6366f1"
          badge="Daydream"
        />

        <div className="de-auth-content space-y-4">

          {/* ── Feature 1: Social Media Overview ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <BarChart2 className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
              <span className="de-widget-title">Social Media Overview</span>
            </div>
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

          {/* ── Feature 2: Connected Platforms ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Connected Platforms</span>
              <Link href="/connectors" className="text-xs font-semibold" style={{ color: ACCENT }}>Manage →</Link>
            </div>
            <div className="de-widget-body">
              <div className="grid grid-cols-2 gap-3">
                {[['📸', 'Instagram'], ['🎵', 'TikTok'], ['🐦', 'X / Twitter'], ['▶️', 'YouTube']].map(([emoji, name]) => (
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

          {/* ── Feature 3: 7-Day Trend ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <TrendingUp className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
              <span className="de-widget-title">7-Day Engagement Trend</span>
            </div>
            <div className="de-widget-body">
              <div style={{ fontFamily: 'monospace', fontSize: 28, letterSpacing: 6, color: ACCENT, textAlign: 'center', padding: '8px 0' }}>
                ▁▃▂▄▅▄▇
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--de-text-dim)', marginTop: 4 }}>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
              </div>
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 8 }}>
                Connect platforms and hit Refresh in AnalyticsEngin to populate live data.
              </p>
            </div>
          </div>

          {/* ── Feature 4: Anomaly Alerts ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <Bell className="w-4 h-4 mr-1" style={{ color: '#f59e0b' }} />
              <span className="de-widget-title">Anomaly Alerts</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#f59e0b', fontWeight: 700, background: 'rgba(245,158,11,0.1)', padding: '2px 7px', borderRadius: 5 }}>
                Live
              </span>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
                Get instantly notified when your engagement spikes, drops, or hits milestones. Alerts fire in real-time via AnalyticsEngin.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginTop: 10 }}>
                {[
                  { label: 'Spike alerts',     emoji: '📈', color: '#22c55e' },
                  { label: 'Drop alerts',      emoji: '📉', color: '#ef4444' },
                  { label: 'Milestones',       emoji: '🎯', color: '#6366f1' },
                ].map(a => (
                  <div key={a.label} style={{ padding: '8px 8px', borderRadius: 9, background: `${a.color}0e`, border: `1px solid ${a.color}20`, textAlign: 'center' }}>
                    <div style={{ fontSize: 20 }}>{a.emoji}</div>
                    <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 4 }}>{a.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 5: Engagement Funnel ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <Target className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
              <span className="de-widget-title">Engagement Funnel</span>
            </div>
            <div className="de-widget-body">
              {[
                { label: 'Impressions',    width: 100, color: '#6366f1' },
                { label: 'Profile Visits', width: 28,  color: '#0ea5e9' },
                { label: 'New Followers',  width: 8,   color: '#22c55e' },
              ].map(s => (
                <div key={s.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: 'var(--de-text-dim)', fontWeight: 600 }}>{s.label}</span>
                    <span style={{ color: 'var(--de-text-dim)', fontSize: 10 }}>—</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: 'rgba(99,102,241,0.1)' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: s.color, width: `${s.width}%` }} />
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 4 }}>Sync platforms to see live funnel data.</p>
            </div>
          </div>

          {/* ── Feature 6: Format Performance Split ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <BarChart2 className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
              <span className="de-widget-title">Format Performance Split</span>
            </div>
            <div className="de-widget-body">
              {[
                { fmt: 'Reels',  pct: 52, color: '#ec4899' },
                { fmt: 'Feed',   pct: 28, color: '#6366f1' },
                { fmt: 'Story',  pct: 14, color: '#f59e0b' },
                { fmt: 'Short',  pct: 6,  color: '#22c55e' },
              ].map(f => (
                <div key={f.fmt} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: 'var(--de-text-dim)', fontWeight: 600 }}>{f.fmt}</span>
                    <span style={{ color: 'var(--de-heading)', fontWeight: 700 }}>{f.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: f.color, width: `${f.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 7: Hashtag Performance ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Top Hashtags</span>
              <Link href="/daydream/analytics" style={{ fontSize: 11, fontWeight: 600, color: ACCENT, textDecoration: 'none' }}>See all →</Link>
            </div>
            <div className="de-widget-body">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { tag: '#dreamlife',     reach: '42K', growth: '+18%' },
                  { tag: '#creator',       reach: '31K', growth: '+9%'  },
                  { tag: '#buildinpublic', reach: '18K', growth: '+22%' },
                  { tag: '#contentgame',   reach: '15K', growth: '+7%'  },
                ].map(h => (
                  <div key={h.tag} style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}15` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{h.tag}</div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 2 }}>{h.reach} reach</div>
                    <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>{h.growth}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 8: Audience Demographics ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <Users className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
              <span className="de-widget-title">Audience Demographics</span>
            </div>
            <div className="de-widget-body">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Age 18–24', pct: 38, color: '#6366f1' },
                  { label: 'Age 25–34', pct: 31, color: '#0ea5e9' },
                  { label: 'Age 35–44', pct: 18, color: '#ec4899' },
                  { label: 'Age 45+',   pct: 13, color: '#f59e0b' },
                ].map(seg => (
                  <div key={seg.label} style={{ padding: '10px 10px', borderRadius: 10, background: `${seg.color}0e`, border: `1px solid ${seg.color}20` }}>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 4 }}>{seg.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: seg.color }}>{seg.pct}%</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 9, background: `${ACCENT}08`, border: `1px solid ${ACCENT}15` }}>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>📍 Top: US 44% · UK 18% · CA 12%</div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 2 }}>📱 Mobile 78% · Desktop 16%</div>
              </div>
            </div>
          </div>

          {/* ── Feature 9: Brand Sentiment ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Brand Sentiment Monitor</span>
            </div>
            <div className="de-widget-body">
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Positive', pct: 72, color: '#22c55e', emoji: '😍' },
                  { label: 'Neutral',  pct: 20, color: '#6366f1', emoji: '😐' },
                  { label: 'Negative', pct: 8,  color: '#ef4444', emoji: '😠' },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, padding: '10px 8px', borderRadius: 10, background: `${s.color}10`, border: `1px solid ${s.color}25`, textAlign: 'center' }}>
                    <div style={{ fontSize: 18 }}>{s.emoji}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.pct}%</div>
                    <div style={{ fontSize: 9, color: 'var(--de-text-dim)', fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 10: Best Time to Post ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <Calendar className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
              <span className="de-widget-title">Best Time to Post</span>
            </div>
            <div className="de-widget-body">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { platform: '📸 Instagram',   time: 'Wed & Fri · 6–8 PM' },
                  { platform: '🎵 TikTok',      time: 'Fri · 7–9 PM' },
                  { platform: '🐦 X',           time: 'Tue & Thu · 9 AM' },
                  { platform: '▶️ YouTube',     time: 'Sat · 2–4 PM' },
                ].map(t => (
                  <div key={t.platform} style={{ padding: '10px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}12` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 3 }}>{t.platform}</div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{t.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 11: Content Calendar ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <Calendar className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
              <span className="de-widget-title">Upcoming Posts</span>
              <Link href="/daydream/create" style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: ACCENT, textDecoration: 'none' }}>+ Schedule</Link>
            </div>
            <div className="de-widget-body">
              {[
                { title: 'Behind the build 🎬', platform: '📸', when: 'Wed 6 PM' },
                { title: 'Q&A Thread',           platform: '🐦', when: 'Thu 9 AM' },
                { title: 'Product reveal reel',  platform: '🎵', when: 'Fri 7 PM' },
              ].map(p => (
                <div key={p.title} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 6, borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}12` }}>
                  <span style={{ fontSize: 18 }}>{p.platform}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{p.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{p.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 12: Viral Content Predictor ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🔥 Viral Content Predictor</span>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
                Enter any post idea in <strong>AnalyticsEngin</strong> to get an AI virality score based on your historic engagement patterns.
              </p>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                {[
                  { label: 'High', score: '>80%', color: '#22c55e' },
                  { label: 'Medium', score: '60–80%', color: '#f59e0b' },
                  { label: 'Low', score: '<60%', color: '#ef4444' },
                ].map(tier => (
                  <div key={tier.label} style={{ flex: 1, padding: '8px 6px', borderRadius: 9, background: `${tier.color}0e`, border: `1px solid ${tier.color}20`, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: tier.color }}>{tier.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{tier.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 13: Revenue from Content ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <DollarSign className="w-4 h-4 mr-1" style={{ color: '#22c55e' }} />
              <span className="de-widget-title">Revenue from Content</span>
            </div>
            <div className="de-widget-body">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Affiliate', val: '$340', color: '#6366f1' },
                  { label: 'Brand Deals', val: '$1,200', color: '#ec4899' },
                  { label: 'Total', val: '$1,540', color: '#22c55e' },
                ].map(r => (
                  <div key={r.label} style={{ padding: '10px 8px', borderRadius: 9, background: `${r.color}0e`, border: `1px solid ${r.color}20`, textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: r.color }}>{r.val}</div>
                    <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2 }}>{r.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 14: Competitor Benchmark ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Competitor Benchmark</span>
            </div>
            <div className="de-widget-body">
              {[
                { metric: 'Engagement Rate', you: '5.2%', industry: '3.1%', better: true },
                { metric: 'Post Frequency', you: '5/wk', industry: '6/wk', better: false },
                { metric: 'Follower Growth', you: '+2.1%', industry: '+1.4%', better: true },
              ].map(row => (
                <div key={row.metric} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: 5, borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}12` }}>
                  <span style={{ fontSize: 11, color: 'var(--de-text-dim)', fontWeight: 600 }}>{row.metric}</span>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 700 }}>
                    <span style={{ color: row.better ? '#22c55e' : '#ef4444' }}>You: {row.you}</span>
                    <span style={{ color: 'var(--de-text-dim)' }}>Avg: {row.industry}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 15: A/B Post Comparison ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">A/B Post Comparison</span>
            </div>
            <div className="de-widget-body" style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'Variant A', impressions: '12.1K', eng: '4.2%', winner: false },
                { label: 'Variant B', impressions: '19.4K', eng: '7.8%', winner: true },
              ].map(p => (
                <div key={p.label} style={{ flex: 1, padding: '10px 10px', borderRadius: 10, background: p.winner ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.5)', border: `1.5px solid ${p.winner ? '#22c55e' : ACCENT + '18'}` }}>
                  {p.winner && <div style={{ fontSize: 9, fontWeight: 800, color: '#22c55e', marginBottom: 4 }}>🏆 WINNER</div>}
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 6 }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>👁 {p.impressions}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>⚡ {p.eng}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 16: Content Gap Analysis ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Content Gap Analysis</span>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 8 }}>Topics trending in your niche that you haven&apos;t covered yet:</p>
              {['Behind-the-scenes production', 'Tool reviews & comparisons', 'Community Q&A sessions'].map(gap => (
                <div key={gap} style={{ padding: '7px 10px', marginBottom: 5, borderRadius: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', display: 'flex', gap: 8 }}>
                  <span>💡</span>
                  <span style={{ fontSize: 11, color: 'var(--de-heading)', fontWeight: 600 }}>{gap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 17: 30-Day Growth Projection ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <TrendingUp className="w-4 h-4 mr-1" style={{ color: '#22c55e' }} />
              <span className="de-widget-title">30-Day Growth Projection</span>
            </div>
            <div className="de-widget-body">
              {[
                { platform: '📸 Instagram', current: '14.2K', projected: '16.8K', growth: '+18%' },
                { platform: '🎵 TikTok', current: '9.8K', projected: '12.1K', growth: '+23%' },
              ].map(p => (
                <div key={p.platform} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', marginBottom: 6, borderRadius: 9, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <span style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>{p.platform}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>{p.current} → {p.projected} ({p.growth})</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 18: Audience Segmentation ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <Users className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
              <span className="de-widget-title">Audience Personas</span>
            </div>
            <div className="de-widget-body">
              {[
                { name: 'The Hustler',  pct: 38, desc: '22–28 · Tech, Startups' },
                { name: 'The Creative', pct: 29, desc: '18–24 · Art, Music, Content' },
                { name: 'The Builder',  pct: 21, desc: '28–36 · Dev, Open-source' },
              ].map(p => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: 5, borderRadius: 9, background: `${ACCENT}08`, border: `1px solid ${ACCENT}15` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{p.desc}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: ACCENT }}>{p.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 19: Game Engine Telemetry ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">⚡ Game Engine Telemetry</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>FREE</span>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
                EliteGameEngine real-time telemetry — surfaces GPU tier, FPS, and ECS entity counts while games run in GameEngin.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Live FPS', val: '60', color: '#8b5cf6' },
                  { label: 'GPU Tier', val: 'High', color: '#0ea5e9' },
                  { label: 'ECS World', val: 'Active', color: '#22c55e' },
                ].map(t => (
                  <div key={t.label} style={{ padding: '8px 6px', borderRadius: 9, background: `${t.color}0e`, border: `1px solid ${t.color}25`, textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: t.color }}>{t.val}</div>
                    <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2 }}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 20: Data Export ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <Download className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
              <span className="de-widget-title">Export Analytics Data</span>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
                Download all your analytics as CSV or JSON from <strong>AnalyticsEngin</strong> (flip to Side B).
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: `${ACCENT}10`, border: `1px solid ${ACCENT}25`, textAlign: 'center', fontSize: 12, fontWeight: 700, color: ACCENT }}>⬇ CSV Export</div>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#22c55e' }}>⬇ JSON Export</div>
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
