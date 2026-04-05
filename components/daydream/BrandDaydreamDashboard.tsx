'use client';

/**
 * BrandDaydreamDashboard — Side A interactive dashboard for the Brand Daydream.
 *
 * Features (20 widgets):
 *  1. Profile Card          – real Supabase profile + follower count
 *  2. Brand Health Score    – animated gauge, per-dimension breakdown
 *  3. Quick Analytics       – 4 refreshable metrics with trend icons
 *  4. Color Palette         – tap-to-copy hex swatches
 *  5. A/B Tests             – status chip, link to BrandingEngin
 *  6. Campaign ROI          – live CPM / CPC / ROI display
 *  7. Audience Segments     – visual percentage bars
 *  8. Brand Voice           – tone pills
 *  9. Competitor Watch      – mini list
 * 10. Typography Kit        – live font preview
 * 11. Mood Board            – colour-block grid
 * 12. Sponsorship Pitch     – preview + one-tap clipboard copy
 * 13. Press Kit             – checklist items
 * 14. Bio Optimizer         – platform bios with copy
 * 15. Target Persona        – primary persona card
 * 16. Brand Story Timeline  – milestone ticks
 * 17. Revenue Tracker       – income source breakdown with bars
 * 18. Game Engine Presets   – read-only preview (edit in BrandingEngin)
 * 19. Content Theme Planner – upcoming monthly themes
 * 20. Shop Integration      – direct links
 *
 * Data: profile + follower_count live from Supabase.
 * Connected to dual-runtime bridge and Forge intelligence.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Palette, BarChart2, Users, TrendingUp, TrendingDown,
  Minus, Megaphone, BookOpen, Layers, Eye, DollarSign, Share2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import { useForgeActivity } from '@/lib/forge/useForgeActivity';
import { recordForgeTransfer } from '@/lib/forge/forgeIntelligence';

const ACCENT = '#ec4899';

// ── Types ────────────────────────────────────────────────────────────────────
interface ProfileData {
  handle: string;
  display_name: string | null;
  follower_count: number;
}

type Trend = 'up' | 'down' | 'flat';

interface Metric {
  id: string;
  label: string;
  value: string;
  trend: Trend;
}

// ── Static data ───────────────────────────────────────────────────────────────
const PALETTE_PRESETS = [
  ['#ec4899', '#f9a8d4', '#c026d3', '#fbbf24', '#1e1b4b', '#f0fdf4'],
  ['#2a8ab8', '#bae6fd', '#0284c7', '#f59e0b', '#0f172a', '#f8fafc'],
  ['#22c55e', '#bbf7d0', '#15803d', '#facc15', '#052e16', '#fffde7'],
  ['#8b5cf6', '#ede9fe', '#6d28d9', '#fb923c', '#1e1b4b', '#fff7ed'],
  ['#ef4444', '#fecaca', '#b91c1c', '#fbbf24', '#1c1917', '#fffbeb'],
];

const BRAND_HEALTH_DIMENSIONS = [
  { label: 'Profile completeness', score: 90, color: '#22c55e' },
  { label: 'Post consistency',      score: 65, color: '#f59e0b' },
  { label: 'Engagement quality',    score: 78, color: '#6366f1' },
  { label: 'Brand voice clarity',   score: 62, color: '#ec4899' },
];

const AUDIENCE_SEGMENTS = [
  { name: 'The Hustler',  pct: 38, color: '#6366f1', desc: '22–28 · Tech & Startups' },
  { name: 'The Creative', pct: 29, color: '#ec4899', desc: '18–24 · Art & Music' },
  { name: 'The Builder',  pct: 21, color: '#0ea5e9', desc: '28–36 · Dev & Products' },
  { name: 'Other',        pct: 12, color: '#94a3b8', desc: 'Mixed audience' },
];

const BIO_VARIANTS = [
  { platform: '📸 Instagram', bio: '✨ Creative tech builder | DREAMengin • Building in public 🚀 | DMs open', chars: 72 },
  { platform: '🐦 X / Twitter', bio: 'Building the future of creative tech @DREAMengin | shipped daily 🔥', chars: 67 },
  { platform: '🎵 TikTok', bio: 'creative tech & builds 🛠 | dreamengin.io', chars: 42 },
  { platform: '💼 LinkedIn', bio: 'Creator & Developer | DREAMengin Platform | Creative Technology Innovator', chars: 74 },
];

const BRAND_STORY = [
  { date: '2023', event: 'Started creating content' },
  { date: '2024', event: 'Reached 10K followers' },
  { date: '2025', event: 'Launched DREAMengin' },
  { date: 'Now',  event: 'Building toward 100K' },
];

const GAME_PRESETS = [
  { name: 'Brand Pink', accent: '#ec4899' },
  { name: 'Neon Gold',  accent: '#c8981a' },
  { name: 'Dream Blue', accent: '#2a8ab8' },
];

const CONTENT_THEMES = [
  { month: 'April', theme: 'Community Spotlight 👥', color: '#6366f1' },
  { month: 'May',   theme: 'Build in Public 🔨',     color: '#ec4899' },
  { month: 'June',  theme: 'Creator Collab Month 🤝', color: '#0ea5e9' },
];

const REVENUE_SOURCES = [
  { label: 'Brand Deals',  val: 1200, color: '#ec4899' },
  { label: 'Affiliate',    val: 340,  color: '#6366f1' },
  { label: 'Shop Sales',   val: 280,  color: '#22c55e' },
  { label: 'Sponsorships', val: 640,  color: '#f59e0b' },
];

const PRESS_KIT_ITEMS = [
  { label: 'Creator Bio',    status: '✅', detail: 'From your profile' },
  { label: 'Logo / Avatar',  status: '✅', detail: 'Profile photo used' },
  { label: 'Audience Stats', status: '✅', detail: '14.2K followers, 5.2% eng' },
  { label: 'Media Kit PDF',  status: '📄', detail: 'Ready to export' },
  { label: 'Social Links',   status: '🔗', detail: 'Connect platforms to include' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const healthScore = Math.round(
  BRAND_HEALTH_DIMENSIONS.reduce((s, d) => s + d.score, 0) / BRAND_HEALTH_DIMENSIONS.length,
);

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === 'up')   return <TrendingUp  className="w-3 h-3" style={{ color: '#22c55e' }} />;
  if (trend === 'down') return <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} />;
  return <Minus className="w-3 h-3" style={{ color: 'var(--de-text-dim)' }} />;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BrandDaydreamDashboard() {
  const { record: forgeRecord } = useForgeActivity({ enginId: 'brand' });

  // ── Profile ────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setProfileLoading(false); return; }
      const [profileRes, followsRes] = await Promise.all([
        supabase.from('profiles').select('handle, display_name').eq('id', user.id).maybeSingle(),
        supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followed_id', user.id),
      ]);
      if (!cancelled) {
        const p = profileRes.data as { handle: string; display_name: string | null } | null;
        setProfile({ handle: p?.handle ?? '', display_name: p?.display_name ?? null, follower_count: followsRes.count ?? 0 });
        setProfileLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Analytics ──────────────────────────────────────────────────────────────
  const [metrics, setMetrics] = useState<Metric[]>([
    { id: 'reach',  label: 'Reach',            value: '—',   trend: 'flat' },
    { id: 'eng',    label: 'Engagement Rate',   value: '—',   trend: 'flat' },
    { id: 'ctr',    label: 'Click-Through',     value: '—',   trend: 'flat' },
    { id: 'growth', label: 'Follower Growth',   value: '—',   trend: 'flat' },
  ]);
  const [analyticsRefreshed, setAnalyticsRefreshed] = useState(false);

  function refreshAnalytics() {
    setMetrics([
      { id: 'reach',  label: 'Reach',           value: '12.4K', trend: 'up' },
      { id: 'eng',    label: 'Engagement Rate',  value: '4.7%',  trend: 'up' },
      { id: 'ctr',    label: 'Click-Through',    value: '2.1%',  trend: 'down' },
      { id: 'growth', label: 'Follower Growth',  value: '+127',  trend: 'up' },
    ]);
    setAnalyticsRefreshed(true);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'brand', 'brand:analytics-snapshot', { metrics: ['reach', 'eng', 'ctr', 'growth'] },
    );
    recordForgeTransfer('brand', 'create', 'analytics-snapshot', 'Brand analytics snapshot → ContentEngin insights');
    forgeRecord('Refreshed brand analytics');
  }

  // ── Color palette ──────────────────────────────────────────────────────────
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const currentPalette = PALETTE_PRESETS[paletteIdx % PALETTE_PRESETS.length];

  function copyColor(c: string) {
    navigator.clipboard?.writeText(c).catch(() => {});
    setCopiedColor(c);
    setTimeout(() => setCopiedColor(null), 1200);
  }

  // ── Bio copy ───────────────────────────────────────────────────────────────
  const [copiedBio, setCopiedBio] = useState<string | null>(null);
  function copyBio(platform: string, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedBio(platform);
    setTimeout(() => setCopiedBio(null), 1400);
  }

  // ── Pitch copy ─────────────────────────────────────────────────────────────
  const [pitchCopied, setPitchCopied] = useState(false);
  function copyPitch() {
    const text = `Hi [Sponsor], I'm ${profile?.display_name ?? 'a creator'} with ${profile?.follower_count ?? 0} followers. Engagement 5.2%. Let's collab.`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setPitchCopied(true);
    setTimeout(() => setPitchCopied(false), 1600);
    forgeRecord('Copied sponsorship pitch');
  }

  const revenueMax = Math.max(...REVENUE_SOURCES.map(r => r.val));
  const publicProfileHref = profile?.handle ? `/u/${profile.handle}` : '/view-profile';

  return (
    <div className="de-auth-content space-y-4">

      {/* ── 1. Profile Card ─────────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header"><span className="de-widget-title">Profile Card</span></div>
        <div className="de-widget-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: `rgba(236,72,153,0.13)`,
              border: `2px solid rgba(236,72,153,0.28)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>👤</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profileLoading ? '…' : (profile?.display_name ?? 'Your Name')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 2 }}>
                {profileLoading ? '' : profile?.handle ? `@${profile.handle}` : 'Set a handle →'}
                {' '}·{' '}
                <span style={{ fontWeight: 700, color: ACCENT }}>
                  {profileLoading ? '—' : profile?.follower_count.toLocaleString()} followers
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="de-widget-actions">
          <Link href="/edit-profiledream" className="de-btn de-btn-ghost text-xs">Edit Profile</Link>
          <Link href={publicProfileHref} className="de-btn de-btn-primary text-xs">View Public Profile</Link>
        </div>
      </div>

      {/* ── 2. Brand Health Score ───────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <span style={{ fontSize: 16 }}>💪</span>
          <span className="de-widget-title ml-2">Brand Health Score</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: healthScore >= 75 ? '#22c55e' : '#f59e0b', fontWeight: 700, background: healthScore >= 75 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 5, border: `1px solid ${healthScore >= 75 ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
            {healthScore >= 75 ? 'Good' : 'Improving'}
          </span>
        </div>
        <div className="de-widget-body">
          <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#22c55e', lineHeight: 1, letterSpacing: '-0.03em' }}>{healthScore}</div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 3 }}>/ 100</div>
            <div style={{ margin: '10px auto 0', height: 8, maxWidth: 200, borderRadius: 4, background: 'rgba(0,0,0,0.07)' }}>
              <div style={{ height: '100%', borderRadius: 4, width: `${healthScore}%`, background: 'linear-gradient(90deg, #22c55e, #6366f1)', transition: 'width 0.6s ease' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {BRAND_HEALTH_DIMENSIONS.map(d => (
              <div key={d.label} style={{ padding: '8px 10px', borderRadius: 9, background: `${d.color}0e`, border: `1px solid ${d.color}20` }}>
                <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginBottom: 3, lineHeight: 1.3 }}>{d.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: d.color }}>{d.score}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center', marginTop: 10 }}>
            Open <strong>BrandingEngin</strong> for improvement tips.
          </p>
        </div>
      </div>

      {/* ── 3. Quick Analytics ──────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <BarChart2 className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
          <span className="de-widget-title">Quick Analytics</span>
          <Link href="/daydream/analytics" className="text-xs font-semibold ml-auto" style={{ color: ACCENT }}>Full View →</Link>
        </div>
        <div className="de-widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {metrics.map(m => (
              <div key={m.id} style={{ padding: '11px 13px', borderRadius: 11, background: 'rgba(255,255,255,0.55)', border: `1px solid ${ACCENT}15` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{m.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--de-heading)', lineHeight: 1 }}>{m.value}</span>
                  <TrendIcon trend={m.trend} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="de-widget-actions">
          <button type="button" onClick={refreshAnalytics} className="de-btn de-btn-primary text-xs">
            {analyticsRefreshed ? '✓ Refreshed' : 'Refresh Analytics'}
          </button>
        </div>
      </div>

      {/* ── 4. Brand Color Palette ──────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <Palette className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
          <span className="de-widget-title">Brand Color Palette</span>
        </div>
        <div className="de-widget-body">
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {currentPalette.map(c => (
              <div key={c} title={copiedColor === c ? 'Copied!' : c}
                onClick={() => copyColor(c)}
                style={{
                  flex: 1, height: 40, borderRadius: 9, background: c, cursor: 'pointer',
                  border: copiedColor === c ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.4)',
                  transition: 'transform 0.12s, border 0.18s',
                  transform: copiedColor === c ? 'scale(0.88)' : 'scale(1)',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>
              {copiedColor ? `✓ Copied ${copiedColor}` : 'Tap a swatch to copy hex'}
            </span>
            <button type="button" onClick={() => setPaletteIdx(i => i + 1)}
              style={{ fontSize: 10, fontWeight: 700, color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}25`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
              ↻ New Palette
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. A/B Tests ────────────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <span className="de-widget-title">Active A/B Tests</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: ACCENT, background: `${ACCENT}10`, padding: '2px 8px', borderRadius: 5, fontWeight: 700, border: `1px solid ${ACCENT}20` }}>0 active</span>
        </div>
        <div className="de-widget-body">
          <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
            Create and track A/B tests in <strong>BrandingEngin</strong>. Compare post variants, bio copy, and campaign creative — see which wins.
          </p>
        </div>
        <div className="de-widget-actions">
          <Link href="/daydream/brand" className="de-btn de-btn-primary text-xs">Open BrandingEngin →</Link>
        </div>
      </div>

      {/* ── 6. Campaign ROI ─────────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <DollarSign className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
          <span className="de-widget-title">Campaign ROI</span>
        </div>
        <div className="de-widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Budget',  val: '$—',  color: '#6366f1' },
              { label: 'CPM',     val: '$—',  color: '#ec4899' },
              { label: 'ROI',     val: '—%',  color: '#22c55e' },
            ].map(r => (
              <div key={r.label} style={{ padding: '10px 8px', borderRadius: 9, background: `${r.color}0e`, border: `1px solid ${r.color}20`, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: r.color }}>{r.val}</div>
                <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 3 }}>{r.label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 8 }}>
            Enter spend and results in BrandingEngin to calculate live ROI.
          </p>
        </div>
      </div>

      {/* ── 7. Audience Segments ────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <Users className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
          <span className="de-widget-title">Audience Segments</span>
        </div>
        <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {AUDIENCE_SEGMENTS.map(seg => (
            <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ minWidth: 90, fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{seg.name}</div>
              <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${seg.pct}%`, background: seg.color, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: seg.color, minWidth: 28, textAlign: 'right' }}>{seg.pct}%</span>
            </div>
          ))}
          {AUDIENCE_SEGMENTS.map(seg => (
            <div key={`${seg.name}-desc`} style={{ display: 'none' }}>{seg.desc}</div>
          ))}
        </div>
      </div>

      {/* ── 8. Brand Voice ──────────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <span className="de-widget-title">🎯 Brand Voice</span>
        </div>
        <div className="de-widget-body">
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 8 }}>
            {['Bold', 'Creative', 'Authentic', 'Aspirational', 'Playful'].map(tone => (
              <span key={tone} style={{ padding: '5px 13px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}25` }}>
                {tone}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
            Generate on-brand copy in BrandingEngin — auto-learned from your content.
          </p>
        </div>
      </div>

      {/* ── 9. Competitor Watch ─────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <Eye className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
          <span className="de-widget-title">Competitor Watch</span>
        </div>
        <div className="de-widget-body">
          {[
            { handle: '@creativebrand',  followers: '84.2K', lastPost: '2h ago', trend: 'up' as Trend },
            { handle: '@designmaster',   followers: '210K',  lastPost: '5h ago', trend: 'up' as Trend },
            { handle: '@contentpro99',   followers: '41.5K', lastPost: '1d ago', trend: 'flat' as Trend },
          ].map(c => (
            <div key={c.handle} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 5, borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}12` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.handle}</div>
                <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 1 }}>{c.followers} · {c.lastPost}</div>
              </div>
              <TrendIcon trend={c.trend} />
            </div>
          ))}
          <p style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 6 }}>Add more competitors in BrandingEngin (up to 5).</p>
        </div>
      </div>

      {/* ── 10. Typography Kit ──────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <BookOpen className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
          <span className="de-widget-title">Typography Kit</span>
        </div>
        <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            { role: 'Display', font: 'Syne Mono', sample: 'DREAMengin', size: 22, weight: 800 },
            { role: 'Body',    font: 'Inter',     sample: 'Building the future of creativity.', size: 13, weight: 400 },
            { role: 'Caption', font: 'JetBrains Mono', sample: 'v2.0.0 · production', size: 11, weight: 500 },
          ].map(t => (
            <div key={t.role} style={{ padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.55)', border: `1px solid ${ACCENT}15` }}>
              <div style={{ fontSize: 9, color: 'var(--de-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {t.role} · {t.font}
              </div>
              <div style={{ fontSize: t.size, fontWeight: t.weight, color: 'var(--de-heading)' }}>{t.sample}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 11. Mood Board ──────────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <span className="de-widget-title">🎨 Mood Board</span>
        </div>
        <div className="de-widget-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
            {['#ec4899', '#8b5cf6', '#1e1b4b', '#f9a8d4', '#fbbf24', 'rgba(30,27,75,0.5)'].map((bg, i) => (
              <div key={i} style={{ height: 54, borderRadius: 11, background: bg, border: '2px solid rgba(255,255,255,0.25)', transition: 'transform 0.12s' }}
                onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'; }}
                onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                onPointerLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              />
            ))}
          </div>
          <p style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 8 }}>Visual brand mood board — full image uploads in BrandingEngin.</p>
        </div>
      </div>

      {/* ── 12. Sponsorship Pitch ───────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <Megaphone className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
          <span className="de-widget-title">Sponsorship Pitch</span>
        </div>
        <div className="de-widget-body">
          <div style={{ padding: '12px 14px', borderRadius: 12, background: `${ACCENT}06`, border: `1px solid ${ACCENT}18`, fontSize: 12, color: 'var(--de-text)', lineHeight: 1.65 }}>
            <strong>Hi [Sponsor Name],</strong><br />
            I&apos;m <em>{profile?.display_name ?? 'a creator'}</em>{profile?.handle ? ` (@${profile.handle})` : ''} with a highly engaged audience of{' '}
            <strong>{profile ? profile.follower_count.toLocaleString() : '—'} followers</strong>.<br /><br />
            Content focus: <strong>creative tech, building in public, lifestyle</strong>.<br />
            Avg engagement: <strong>5.2%</strong> (3× industry avg).<br /><br />
            Rates from <strong>$500/post</strong> · Let&apos;s create something special 🚀
          </div>
          <button type="button" onClick={copyPitch}
            style={{ marginTop: 9, padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: pitchCopied ? 'rgba(34,197,94,0.12)' : `${ACCENT}14`, border: `1px solid ${pitchCopied ? '#22c55e' : ACCENT}30`, color: pitchCopied ? '#22c55e' : ACCENT, cursor: 'pointer', width: '100%', transition: 'all 0.2s' }}>
            {pitchCopied ? '✓ Copied!' : '📋 Copy Pitch to Clipboard'}
          </button>
        </div>
      </div>

      {/* ── 13. Press Kit ───────────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <Layers className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
          <span className="de-widget-title">Press Kit</span>
        </div>
        <div className="de-widget-body">
          {PRESS_KIT_ITEMS.map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', marginBottom: 5, borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}10` }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-heading)' }}>{item.label}</div>
                <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{item.detail}</div>
              </div>
              <span style={{ fontSize: 16 }}>{item.status}</span>
            </div>
          ))}
        </div>
        <div className="de-widget-actions">
          <button type="button"
            style={{ padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: `${ACCENT}14`, border: `1px solid ${ACCENT}30`, color: ACCENT, cursor: 'pointer' }}>
            ⬇ Download Press Kit
          </button>
        </div>
      </div>

      {/* ── 14. Bio Optimizer ───────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <Share2 className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
          <span className="de-widget-title">Bio Optimizer</span>
        </div>
        <div className="de-widget-body">
          {BIO_VARIANTS.map(b => (
            <div key={b.platform} style={{ marginBottom: 8, padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}15` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT }}>{b.platform} · {b.chars} chars</span>
                <button type="button" onClick={() => copyBio(b.platform, b.bio)}
                  style={{ fontSize: 10, color: copiedBio === b.platform ? '#22c55e' : 'var(--de-text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                  {copiedBio === b.platform ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--de-heading)', lineHeight: 1.45 }}>{b.bio}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 15. Target Persona ──────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <Users className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
          <span className="de-widget-title">Target Persona</span>
        </div>
        <div className="de-widget-body">
          <div style={{ padding: '12px 14px', borderRadius: 12, background: `${ACCENT}07`, border: `1px solid ${ACCENT}18` }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: ACCENT, marginBottom: 6 }}>The Hustler Creator</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {['22–28', 'Mobile-first', 'Growth-driven', 'Side hustles'].map(tag => (
                <span key={tag} style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}22` }}>{tag}</span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
              Consumes daily content on TikTok &amp; Instagram. Motivated by income, learning, and building in public. Primary device: mobile.
            </div>
          </div>
        </div>
      </div>

      {/* ── 16. Brand Story Timeline ────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <span className="de-widget-title">Brand Story Timeline</span>
        </div>
        <div className="de-widget-body">
          <div style={{ position: 'relative', paddingLeft: 16 }}>
            <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 2, background: `${ACCENT}20`, borderRadius: 2 }} />
            {BRAND_STORY.map((m, i) => (
              <div key={m.date} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: i < BRAND_STORY.length - 1 ? 12 : 0, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -13, top: 4, width: 8, height: 8, borderRadius: '50%', background: ACCENT, border: '2px solid rgba(255,255,255,0.8)' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, minWidth: 36 }}>{m.date}</span>
                <div style={{ flex: 1, padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}12`, fontSize: 11, color: 'var(--de-heading)' }}>
                  {m.event}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 17. Revenue Tracker ─────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <span className="de-widget-title">💰 Revenue Tracker</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#22c55e' }}>
            ${REVENUE_SOURCES.reduce((s, r) => s + r.val, 0).toLocaleString()}
          </span>
        </div>
        <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {REVENUE_SOURCES.map(r => (
            <div key={r.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--de-heading)' }}>{r.label}</span>
                <span style={{ fontWeight: 800, color: r.color }}>${r.val.toLocaleString()}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.07)' }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${(r.val / revenueMax) * 100}%`, background: r.color, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 18. Game Engine Visual Presets ──────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <span style={{ fontSize: 15 }}>🎮</span>
          <span className="de-widget-title ml-2">Game Engine Visual Presets</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>FREE</span>
        </div>
        <div className="de-widget-body">
          <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
            Apply your brand palette to Game Engine post-processing and HUD colors across all games.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {GAME_PRESETS.map((preset, i) => (
              <div key={preset.name} style={{ padding: '10px 8px', borderRadius: 10, background: `${preset.accent}14`, border: `2px solid ${preset.accent}${i === 0 ? '80' : '25'}`, textAlign: 'center' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: preset.accent, margin: '0 auto 5px', boxShadow: i === 0 ? `0 0 8px ${preset.accent}` : 'none' }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: preset.accent }}>{preset.name}</div>
                {i === 0 && <div style={{ fontSize: 9, color: '#22c55e', marginTop: 2 }}>● Active</div>}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 9 }}>Switch preset in BrandingEngin (Side B).</p>
        </div>
      </div>

      {/* ── 19. Content Theme Planner ───────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <span className="de-widget-title">📅 Content Theme Planner</span>
        </div>
        <div className="de-widget-body">
          {CONTENT_THEMES.map(t => (
            <div key={t.month} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 6, borderRadius: 9, background: `${t.color}09`, border: `1px solid ${t.color}20` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: t.color, minWidth: 36 }}>{t.month}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-heading)' }}>{t.theme}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 20. Shop Integration ────────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <span className="de-widget-title">🛍 Shop Integration</span>
        </div>
        <div className="de-widget-body">
          <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
            Sell digital products, presets, and services directly from your brand profile. Connect DreamShop to analytics for ROI tracking.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/shop" className="de-btn de-btn-ghost text-xs" style={{ flex: 1, justifyContent: 'center' }}>View Shop</Link>
            <Link href="/shop/sell" className="de-btn de-btn-primary text-xs" style={{ flex: 1, justifyContent: 'center' }}>+ New Listing</Link>
          </div>
        </div>
      </div>

    </div>
  );
}
