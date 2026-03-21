'use client';

/**
 * AnalyticsEngin — Side B control layer for the Analytics Daydream.
 *
 * Responsibilities (ARCHITECTURE.md §1 Daydream pairs):
 *   - Per-platform social media metrics (Instagram, TikTok, X, YouTube).
 *   - Cross-platform reach, engagement rate, click-through, and follower growth.
 *   - Connect-platform prompts that route to /connectors.
 *   - Refresh / sync all platform metrics.
 *   - Best-time-to-post recommendation per connected platform.
 *   - Top-content breakdown (impressions, saves, shares).
 *
 * Security: all data reads are scoped to auth.uid() only.
 * Follows AXIOM 4 (security by default) and AXIOM 5 (privacy by design).
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  ArrowLeft, BarChart2, TrendingUp, TrendingDown, Minus,
  Users, Eye, Share2, RefreshCw, Zap,
} from 'lucide-react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import JourneyTrail from '@/components/daydream/JourneyTrail';

interface Props {
  onBack: () => void;
}

const ACCENT = '#6366f1';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Metric {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'flat';
  icon: React.ReactNode;
}

interface PlatformStat {
  id: string;
  name: string;
  emoji: string;
  followers: string;
  reach: string;
  engRate: string;
  connected: boolean;
}

interface TopPost {
  id: string;
  platform: string;
  title: string;
  impressions: string;
  saves: string;
  shares: string;
}

// ── Seed data (replaced on Refresh) ───────────────────────────────────────────
const EMPTY_METRICS: Metric[] = [
  { id: 'reach',   label: 'Total Reach',      value: '—', trend: 'flat', icon: <Eye    className="w-4 h-4" /> },
  { id: 'eng',     label: 'Engagement Rate',  value: '—', trend: 'flat', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'clicks',  label: 'Link Clicks',      value: '—', trend: 'flat', icon: <Zap    className="w-4 h-4" /> },
  { id: 'growth',  label: 'New Followers',    value: '—', trend: 'flat', icon: <Users  className="w-4 h-4" /> },
];

const PLATFORMS: PlatformStat[] = [
  { id: 'ig',  name: 'Instagram', emoji: '📸', followers: '—', reach: '—', engRate: '—', connected: false },
  { id: 'tt',  name: 'TikTok',    emoji: '🎵', followers: '—', reach: '—', engRate: '—', connected: false },
  { id: 'x',   name: 'X / Twitter', emoji: '🐦', followers: '—', reach: '—', engRate: '—', connected: false },
  { id: 'yt',  name: 'YouTube',   emoji: '▶️', followers: '—', reach: '—', engRate: '—', connected: false },
];

const EMPTY_TOP_POSTS: TopPost[] = [];

export default function AnalyticsEngin({ onBack }: Props) {
  const [handle, setHandle]       = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [metrics, setMetrics]       = useState<Metric[]>(EMPTY_METRICS);
  const [platforms, setPlatforms]   = useState<PlatformStat[]>(PLATFORMS);
  const [topPosts, setTopPosts]     = useState<TopPost[]>(EMPTY_TOP_POSTS);
  const [bestTime, setBestTime]     = useState<string | null>(null);

  // ── Load handle ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user;
      if (!user || cancelled) { setLoading(false); return; }
      const { data } = await supabase.from('profiles').select('handle').eq('id', user.id).maybeSingle();
      if (!cancelled) {
        const row = data as { handle: string } | null;
        setHandle(row?.handle ?? null);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // ── Refresh all platform metrics ───────────────────────────────────────────
  function handleRefresh() {
    setRefreshing(true);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'analytics', 'analytics:refresh', {},
    );
    // Simulate data fetch; real integration fires via connectors
    setTimeout(() => {
      setMetrics([
        { id: 'reach',  label: 'Total Reach',     value: '38.7K', trend: 'up',   icon: <Eye    className="w-4 h-4" /> },
        { id: 'eng',    label: 'Engagement Rate',  value: '5.2%',  trend: 'up',   icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'clicks', label: 'Link Clicks',      value: '1.4K',  trend: 'down', icon: <Zap    className="w-4 h-4" /> },
        { id: 'growth', label: 'New Followers',    value: '+342',  trend: 'up',   icon: <Users  className="w-4 h-4" /> },
      ]);
      setPlatforms([
        { id: 'ig', name: 'Instagram',   emoji: '📸', followers: '14.2K', reach: '21.1K', engRate: '6.1%', connected: true  },
        { id: 'tt', name: 'TikTok',      emoji: '🎵', followers: '9.8K',  reach: '12.5K', engRate: '8.4%', connected: true  },
        { id: 'x',  name: 'X / Twitter', emoji: '🐦', followers: '3.1K',  reach: '4.9K',  engRate: '2.7%', connected: true  },
        { id: 'yt', name: 'YouTube',     emoji: '▶️', followers: '620',   reach: '2.1K',  engRate: '3.2%', connected: false },
      ]);
      setTopPosts([
        { id: 'p1', platform: '📸 Instagram', title: 'Behind the scenes drop', impressions: '18.4K', saves: '1.2K', shares: '840' },
        { id: 'p2', platform: '🎵 TikTok',    title: 'Day in the life vlog',   impressions: '31.2K', saves: '3.6K', shares: '2.1K' },
        { id: 'p3', platform: '🐦 X',         title: 'Announcement thread',    impressions: '4.7K',  saves: '—',    shares: '612' },
      ]);
      setBestTime('📅 Best time to post: Wed & Fri · 6–8 PM local');
      setRefreshing(false);
    }, 1100);
  }

  const trendIcon = (t: 'up' | 'down' | 'flat') =>
    t === 'up'   ? <TrendingUp   className="w-3 h-3" style={{ color: '#22c55e' }} /> :
    t === 'down' ? <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} /> :
                   <Minus        className="w-3 h-3" style={{ color: 'var(--de-text-dim)' }} />;

  return (
    <div className="de-sky-bg min-h-screen">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button type="button" onClick={onBack} className="p-2 -ml-2 rounded-full"
            style={{ background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Back to Analytics">
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>
          <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: `linear-gradient(135deg, ${ACCENT}, rgba(99,102,241,0.7))` }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>AnalyticsEngin</div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
              {loading ? 'Loading…' : handle ? `@${handle} · Social Analytics` : 'Analytics · Control Layer'}
            </div>
          </div>
          <span className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}>Side B</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>

        {/* ── Cross-platform overview ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Cross-Platform Overview</span>
            <button type="button" onClick={handleRefresh} disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${ACCENT}35`, background: `${ACCENT}12`, color: ACCENT }}>
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Syncing…' : 'Refresh'}
            </button>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {metrics.map(m => (
                <div key={m.id} style={{ padding: '12px 14px', borderRadius: 11, background: 'rgba(255,255,255,0.55)', border: `1px solid ${ACCENT}15` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ color: ACCENT, opacity: 0.8 }}>{m.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--de-heading)', lineHeight: 1 }}>{m.value}</span>
                    {trendIcon(m.trend)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {bestTime && (
            <div className="de-widget-actions">
              <span style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>{bestTime}</span>
            </div>
          )}
        </div>

        {/* ── Per-platform breakdown ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Platform Breakdown</span>
            <Link href="/connectors" style={{ fontSize: 11, fontWeight: 600, color: ACCENT, textDecoration: 'none' }}>Connect →</Link>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {platforms.map(p => (
                <div key={p.id} style={{ padding: '12px 14px', borderRadius: 11, background: 'rgba(255,255,255,0.55)', border: `1px solid ${ACCENT}15`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{p.name}</div>
                    {p.connected ? (
                      <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                        {p.followers} followers · {p.reach} reach · {p.engRate} eng.
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Not connected</div>
                    )}
                  </div>
                  {p.connected ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, padding: '2px 7px' }}>Live</span>
                  ) : (
                    <Link href="/connectors" style={{ fontSize: 10, fontWeight: 700, color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, borderRadius: 6, padding: '2px 7px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      Connect
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Top performing posts ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Top Posts</span>
            <Share2 className="w-4 h-4" style={{ color: ACCENT, opacity: 0.5 }} />
          </div>
          <div className="de-widget-body">
            {topPosts.length === 0 ? (
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center', padding: '16px 0' }}>
                Hit <strong>Refresh</strong> to pull your top posts.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topPosts.map(post => (
                  <div key={post.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}18` }}>
                    <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600, marginBottom: 3 }}>{post.platform}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 6 }}>{post.title}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--de-text-dim)' }}>
                      <span>👁 {post.impressions}</span>
                      <span>🔖 {post.saves}</span>
                      <span>↗ {post.shares}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Brand link ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header"><span className="de-widget-title">Use in Brand</span></div>
          <div className="de-widget-body">
            <Link href="/daydream/brand" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.55)', border: `1px solid ${ACCENT}18`, cursor: 'pointer' }}
                onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
                onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                onPointerLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: `${ACCENT}15`, border: `1px solid ${ACCENT}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 className="w-4 h-4" style={{ color: ACCENT }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>Brand Daydream</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Apply insights to campaigns & brand kit</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--de-text-dim)' }}>→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Journey Trail ── */}
        <JourneyTrail />
      </div>
    </div>
  );
}
