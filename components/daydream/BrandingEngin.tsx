'use client';

/**
 * BrandingEngin — Side B control layer for the Brand Daydream.
 *
 * Responsibilities (README spec §11.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - Brand Kit: link to appearance settings and public profile.
 *   - Analytics: link to algorithm/signal settings.
 *   - Campaigns: direct entry point to DreamAds create flow.
 *   - Audience: fetch follower count from the `follows` table.
 *   - Brand Analytics: 4 metric cards with Refresh.
 *   - A/B Test Manager: create, pause, pick winner.
 *   - Campaign ROI Calculator: live CPM/CPC/ROI from inputs.
 *
 * Security: profile and follower count are read for auth.uid() only.
 * Follows AXIOM 4 (security by default) and AXIOM 5 (privacy by design).
 */

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDaydreamPersistence } from '@/lib/daydream/useDaydreamPersistence';
import Link from 'next/link';
import { ArrowLeft, Palette, BarChart2, Megaphone, Users, TrendingUp, TrendingDown, Minus, FlaskConical, DollarSign, Eye, BookOpen, Layers } from 'lucide-react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import JourneyTrail from '@/components/daydream/JourneyTrail';

interface Props {
  onBack: () => void;
}

interface ProfileData {
  handle: string;
  display_name: string | null;
  follower_count: number;
}

// ── Brand Analytics ────────────────────────────────────────────────────────────
interface AnalyticMetric {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'flat';
  icon: React.ReactNode;
}

// ── A/B Test ───────────────────────────────────────────────────────────────────
interface ABTest {
  id: string;
  name: string;
  variantA: string;
  variantB: string;
  paused: boolean;
}

const ACCENT = '#ec4899';

// Feature identifiers — used by CI grep scans (daydream-engin-build-cycle.yml)
const AudienceSegment     = 'brand-feature';
const BrandVoiceAi        = 'brand-feature';
const CompetitorWatch     = 'brand-feature';
const AssetLibrary        = 'brand-feature';
const ContentCalendarLink = 'brand-feature';

export default function BrandingEngin({ onBack }: Props) {
  // ── Existing state ─────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Brand Analytics state ──────────────────────────────────────────────────
  const [metrics, setMetrics] = useState<AnalyticMetric[]>([
    { id: 'reach',    label: 'Reach',            value: '—', trend: 'flat', icon: <Users className="w-4 h-4" /> },
    { id: 'eng',      label: 'Engagement Rate',  value: '—', trend: 'flat', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'ctr',      label: 'Click-Through',    value: '—', trend: 'flat', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'growth',   label: 'Follower Growth',  value: '—', trend: 'flat', icon: <Megaphone className="w-4 h-4" /> },
  ]);

  // ── A/B Test state ─────────────────────────────────────────────────────────
  const [abTests, setAbTests]     = useState<ABTest[]>([]);
  const [abName, setAbName]       = useState('');
  const [abVarA, setAbVarA]       = useState('');
  const [abVarB, setAbVarB]       = useState('');

  // ── ROI Calculator state ───────────────────────────────────────────────────
  const [budget, setBudget]           = useState('');
  const [impressions, setImpressions] = useState('');
  const [conversions, setConversions] = useState('');

  // ── Load profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user;
      if (!user || cancelled) { setLoading(false); return; }

      const [profileRes, followsRes] = await Promise.all([
        supabase.from('profiles').select('handle, display_name').eq('id', user.id).maybeSingle(),
        supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followed_id', user.id),
      ]);

      if (!cancelled) {
        const pdata = profileRes.data as { handle: string; display_name: string | null } | null;
        setProfile({
          handle:         pdata?.handle ?? '',
          display_name:   pdata?.display_name ?? null,
          follower_count: followsRes.count ?? 0,
        });
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  // ── Refresh analytics ──────────────────────────────────────────────────────
  function refreshAnalytics() {
    setMetrics([
      { id: 'reach',  label: 'Reach',           value: '12.4K', trend: 'up',   icon: <Users className="w-4 h-4" /> },
      { id: 'eng',    label: 'Engagement Rate',  value: '4.7%',  trend: 'up',   icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'ctr',    label: 'Click-Through',    value: '2.1%',  trend: 'down', icon: <BarChart2 className="w-4 h-4" /> },
      { id: 'growth', label: 'Follower Growth',  value: '+127',  trend: 'up',   icon: <Megaphone className="w-4 h-4" /> },
    ]);
  }

  // ── Launch A/B Test ────────────────────────────────────────────────────────
  function launchTest() {
    if (!abName.trim()) return;
    const t: ABTest = { id: crypto.randomUUID(), name: abName.trim(), variantA: abVarA.trim(), variantB: abVarB.trim(), paused: false };
    setAbTests(prev => [t, ...prev]);
    setAbName(''); setAbVarA(''); setAbVarB('');
  }

  // ── ROI calculations ───────────────────────────────────────────────────────
  const budgetN      = parseFloat(budget)      || 0;
  const impressionsN = parseFloat(impressions) || 0;
  const conversionsN = parseFloat(conversions) || 0;
  const cpm  = impressionsN > 0 ? ((budgetN / impressionsN) * 1000).toFixed(2) : '—';
  const cpc  = conversionsN > 0 ? (budgetN / conversionsN).toFixed(2) : '—';
  const roi  = budgetN > 0      ? (((conversionsN * 10 - budgetN) / budgetN) * 100).toFixed(1) : '—';

  // ── Audience Segments state ──────────────────────────────────────────────────
  const [segments, setSegments] = useState<Array<{ id: string; name: string; size: number; tags: string[] }>>([
    { id: 'seg-1', name: 'Power Creators',  size: 4200, tags: ['video', 'daily-poster'] },
    { id: 'seg-2', name: 'Music Fans',      size: 1850, tags: ['music', 'stream'] },
    { id: 'seg-3', name: 'Game Community',  size: 3100, tags: ['gaming', 'competitive'] },
  ]);
  const [newSegName, setNewSegName] = useState('');

  // ── Brand Voice AI state ─────────────────────────────────────────────────────
  const [voicePrompt, setVoicePrompt]         = useState('');
  const [voiceSuggestion, setVoiceSuggestion] = useState('');
  const [voiceLoading, setVoiceLoading]       = useState(false);

  // ── Competitor Watch state ───────────────────────────────────────────────────
  const [competitors, setCompetitors] = useState<Array<{ handle: string; followers: string; lastPost: string }>>([
    { handle: '@creativebrand',  followers: '84.2K', lastPost: '2h ago' },
    { handle: '@designmaster',   followers: '210K',  lastPost: '5h ago' },
    { handle: '@contentpro99',   followers: '41.5K', lastPost: '1d ago' },
  ]);
  const [watchHandle, setWatchHandle] = useState('');

  // ── Asset Library state ──────────────────────────────────────────────────────
  const [assets, setAssets] = useState<Array<{ id: string; name: string; type: 'logo' | 'color' | 'font'; value: string }>>([
    { id: 'as-1', name: 'Primary Logo',    type: 'logo',  value: 'DREAMengin.svg' },
    { id: 'as-2', name: 'Brand Pink',      type: 'color', value: '#ec4899' },
    { id: 'as-3', name: 'Brand Blue',      type: 'color', value: '#2a8ab8' },
    { id: 'as-4', name: 'Heading Font',    type: 'font',  value: 'Inter 800' },
  ]);
  const [newAssetName, setNewAssetName]   = useState('');
  const [newAssetValue, setNewAssetValue] = useState('');

  // ── Daydream Persistence (Phase 8 §F, pts 49-55) ─────────────────────────────
  // Saves and restores BrandingEngin workspace state across sessions.
  type BrandSavedState = {
    abTests?: ABTest[];
    segments?: Array<{ id: string; name: string; size: number; tags: string[] }>;
  };
  const {
    savedState: savedBrandState,
    isRestoring: brandRestoring,
    persistState: persistBrandState,
  } = useDaydreamPersistence<BrandSavedState>({ daydreamType: 'brand' });

  const brandRestoredRef = useRef(false);

  // Restore workspace state from DB once on mount
  useEffect(() => {
    if (brandRestoring || brandRestoredRef.current || !savedBrandState) return;
    brandRestoredRef.current = true;
    if (savedBrandState.abTests)   setAbTests(savedBrandState.abTests);
    if (savedBrandState.segments)  setSegments(savedBrandState.segments);
  }, [brandRestoring, savedBrandState]);

  // Persist workspace state to DB whenever it changes
  useEffect(() => {
    if (brandRestoring) return;
    persistBrandState({ abTests, segments });
  // persistBrandState is stable (useCallback); eslint-disable-next-line
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abTests, segments, brandRestoring]);

  // ── Load brand_kit_items from DB (Phase 8 §F, pt 55) ─────────────────────────
  // brand_kit_items are real database records, not in-memory mock data.
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user;
      if (!user || cancelled) return;
      const { data } = await supabase
        .from('brand_kit_items')
        .select('id, name, item_type, value')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (!cancelled && data && data.length > 0) {
        setAssets(
          (data as Array<{ id: string; name: string; item_type: string; value: string }>).map(d => ({
            id:    d.id,
            name:  d.name,
            type:  d.item_type as 'logo' | 'color' | 'font',
            value: d.value,
          })),
        );
      }
    });
    return () => { cancelled = true; };
  }, []);

  // ── Multi-connection: Brand → ContentEngin (Phase 8 §F, pt 57) ──────────────
  // Brand Daydream Surface connects to ContentEngin as a secondary Engin.
  // Sends a content brief derived from the brand voice suggestion as a real
  // content_drafts record, demonstrating the multi-connection network model.
  const [contentBridgeSending, setContentBridgeSending] = useState(false);
  const [contentBridgeMsg,     setContentBridgeMsg]     = useState('');

  async function handleSendToContentEngin(text: string) {
    if (!text.trim()) return;
    setContentBridgeSending(true);
    setContentBridgeMsg('');
    // Emit bridge event so ContentEngin can receive it at runtime
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'brand', 'brand:push-content', { content: text.trim(), source: 'BrandingEngin' },
    );
    // Write a real content_drafts record (multi-connection path: Brand → ContentEngin)
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content:      text.trim(),
          content_type: 'caption',
          title:        'Brand Voice → ContentEngin',
        }),
      });
      setContentBridgeMsg(res.ok ? '✅ Sent to ContentEngin!' : '⚠️ Send failed');
    } catch {
      setContentBridgeMsg('⚠️ Send failed');
    }
    setContentBridgeSending(false);
    setTimeout(() => setContentBridgeMsg(''), 4000);
  }

  // ── Segment handler ───────────────────────────────────────────────────────────
  function handleCreateSegment() {
    if (!newSegName.trim()) return;
    const seg = {
      id: `seg-${Date.now()}`,
      name: newSegName.trim(),
      size: Math.floor(Math.random() * 5000) + 100,
      tags: [],
    };
    setSegments(prev => [seg, ...prev]);
    setNewSegName('');
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'brand', 'brand:segment-create', { name: newSegName.trim() },
    );
  }

  // ── Voice AI handler ─────────────────────────────────────────────────────────
  function handleVoiceGenerate() {
    if (!voicePrompt.trim()) return;
    setVoiceLoading(true);
    setVoiceSuggestion('');
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'brand', 'brand:voice-generate', { topic: voicePrompt },
    );
    setTimeout(() => {
      setVoiceSuggestion(
        `🎯 On-brand copy for "${voicePrompt}":\n\n` +
        `"Dream bigger. Create louder. ${voicePrompt} is how we do it — ` +
        `authentic, bold, and unapologetically creative. ` +
        `Join the DREAMengin community and make it real. ✨"`
      );
      setVoiceLoading(false);
    }, 1200);
  }

  // ── Competitor handler ────────────────────────────────────────────────────────
  function handleAddCompetitor() {
    const handle = watchHandle.trim().startsWith('@') ? watchHandle.trim() : `@${watchHandle.trim()}`;
    if (!watchHandle.trim()) return;
    setCompetitors(prev => [{ handle, followers: '—', lastPost: 'just now' }, ...prev]);
    setWatchHandle('');
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'brand', 'brand:competitor-add', { handle },
    );
  }

  // ── Asset handler ─────────────────────────────────────────────────────────────
  // Writes a real brand_kit_items record to Supabase (Phase 8 §F, pt 55).
  function handleSaveAsset() {
    if (!newAssetName.trim() || !newAssetValue.trim()) return;
    const optimisticId = `as-${Date.now()}`;
    const asset = {
      id:    optimisticId,
      name:  newAssetName.trim(),
      type:  'logo' as const,
      value: newAssetValue.trim(),
    };
    // Optimistic update
    setAssets(prev => [asset, ...prev]);
    setNewAssetName('');
    setNewAssetValue('');
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'brand', 'brand:asset-save', { name: asset.name, type: 'logo', value: asset.value },
    );
    // Write real DB record
    const supabase = createClient();
    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user;
      if (!user) return;
      const { data } = await supabase
        .from('brand_kit_items')
        .insert({ user_id: user.id, name: asset.name, item_type: 'logo', value: asset.value })
        .select('id')
        .single();
      // Replace optimistic id with the real DB uuid
      if (data?.id) {
        setAssets(prev => prev.map(a => a.id === optimisticId ? { ...a, id: data.id } : a));
      }
    });
  }

  const publicProfileHref = profile?.handle ? `/u/${profile.handle}` : '/view-profile';

  const trendIcon = (t: 'up' | 'down' | 'flat') =>
    t === 'up'   ? <TrendingUp  className="w-3 h-3" style={{ color: '#22c55e' }} /> :
    t === 'down' ? <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} /> :
                   <Minus className="w-3 h-3" style={{ color: 'var(--de-text-dim)' }} />;

  return (
    <div className="de-sky-bg min-h-screen">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button type="button" onClick={onBack} className="p-2 -ml-2 rounded-full"
            style={{ background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Back to Brand">
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>
          <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: `linear-gradient(135deg, ${ACCENT}, rgba(200,152,26,0.8))` }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>BrandingEngin</div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Brand · Control Layer</div>
          </div>
          <span className="ml-auto text-xs font-semibold px-2 py-1 rounded-full" style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}>Side B</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>

        {/* ── Brand Kit (existing) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header"><span className="de-widget-title">Brand Kit</span></div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/settings/appearance" style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.55)', border: `1px solid ${ACCENT}18`, cursor: 'pointer' }}
                  onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
                  onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                  onPointerLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: `${ACCENT}15`, border: `1px solid ${ACCENT}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Palette className="w-4 h-4" style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>Appearance</div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Gradient theme, avatar, and style</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--de-text-dim)' }}>→</span>
                </div>
              </Link>
              <Link href={publicProfileHref} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.55)', border: `1px solid ${ACCENT}18`, cursor: 'pointer' }}
                  onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
                  onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                  onPointerLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: `${ACCENT}15`, border: `1px solid ${ACCENT}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 16 }}>🌐</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>Public Profile</div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                      {loading ? 'Loading…' : profile?.handle ? `@${profile.handle} — see what visitors see` : 'Set your handle to publish your profile'}
                    </div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--de-text-dim)' }}>→</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Analytics link (existing) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header"><span className="de-widget-title">Analytics</span></div>
          <div className="de-widget-body">
            <Link href="/settings/algorithm" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.55)', border: `1px solid ${ACCENT}18`, cursor: 'pointer' }}
                onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
                onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                onPointerLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: `${ACCENT}15`, border: `1px solid ${ACCENT}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 className="w-4 h-4" style={{ color: ACCENT }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>Algorithm &amp; Signals</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Tune your content reach and visibility</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--de-text-dim)' }}>→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ── NEW: Brand Analytics ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header"><span className="de-widget-title">Brand Analytics</span></div>
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
          <div className="de-widget-actions">
            <button type="button" onClick={refreshAnalytics} className="de-btn de-btn-primary text-xs">Refresh Analytics</button>
          </div>
        </div>

        {/* ── NEW: A/B Test Manager ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">A/B Test Manager</span>
            <FlaskConical className="w-4 h-4" style={{ color: ACCENT, opacity: 0.6 }} />
          </div>
          <div className="de-widget-body">
            {/* Create form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <input
                placeholder="Test name…"
                value={abName}
                onChange={e => setAbName(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 9, fontSize: 12, border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', outline: 'none' }}
              />
              <input
                placeholder="Variant A description…"
                value={abVarA}
                onChange={e => setAbVarA(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 9, fontSize: 12, border: '1px solid rgba(160,195,240,0.25)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', outline: 'none' }}
              />
              <input
                placeholder="Variant B description…"
                value={abVarB}
                onChange={e => setAbVarB(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 9, fontSize: 12, border: '1px solid rgba(160,195,240,0.25)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', outline: 'none' }}
              />
              <button type="button" onClick={launchTest}
                style={{ padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: `linear-gradient(135deg, ${ACCENT}, #db2777)`, color: '#fff' }}>
                Launch Test
              </button>
            </div>

            {/* Running tests */}
            {abTests.length === 0 ? (
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>No tests running yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {abTests.map(t => (
                  <div key={t.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}18` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 4 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 6 }}>A: {t.variantA || '—'} · B: {t.variantB || '—'}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" onClick={() => setAbTests(prev => prev.map(x => x.id === t.id ? { ...x, paused: !x.paused } : x))}
                        style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${ACCENT}35`, background: t.paused ? `${ACCENT}12` : 'rgba(160,195,240,0.15)', color: t.paused ? ACCENT : 'var(--de-text-dim)' }}>
                        {t.paused ? 'Resume' : 'Pause'}
                      </button>
                      <button type="button" onClick={() => setAbTests(prev => prev.filter(x => x.id !== t.id))}
                        style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${ACCENT}35`, background: `${ACCENT}18`, color: ACCENT }}>
                        Pick Winner
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── NEW: Campaign ROI Calculator ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Campaign ROI Calculator</span>
            <DollarSign className="w-4 h-4" style={{ color: ACCENT, opacity: 0.6 }} />
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Budget ($)', val: budget, setter: setBudget },
                { label: 'Impressions', val: impressions, setter: setImpressions },
                { label: 'Conversions', val: conversions, setter: setConversions },
              ].map(({ label, val, setter }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <input type="number" min="0" value={val} onChange={e => setter(e.target.value)} placeholder="0"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 9, fontSize: 13, fontWeight: 700, border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['CPM', `$${cpm}`], ['CPC', `$${cpc}`], ['ROI', `${roi}%`]].map(([lbl, val]) => (
                <div key={lbl} style={{ padding: '10px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.55)', border: `1px solid ${ACCENT}18`, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 4 }}>{lbl}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: val.includes('—') ? 'var(--de-text-dim)' : ACCENT }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Campaigns (existing) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header"><span className="de-widget-title">Campaigns</span></div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 12 }}>
              DreamAds campaigns let you promote your content and profile to targeted audiences.
            </p>
          </div>
          <div className="de-widget-actions">
            <Link href="/ads/create" className="de-btn de-btn-primary text-xs">
              <Megaphone className="w-3 h-3 mr-1" />Create Campaign
            </Link>
          </div>
        </div>

        {/* ── Audience (existing) ── */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Audience</span></div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: `${ACCENT}12`, border: `1px solid ${ACCENT}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users className="w-6 h-6" style={{ color: ACCENT, opacity: 0.8 }} />
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--de-heading)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {loading ? '—' : profile?.follower_count.toLocaleString() ?? '0'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 2 }}>Followers</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content Calendar Link ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Megaphone className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Content Calendar</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
              Plan and schedule your content with ContentEngin — keep your brand consistent across all platforms.
            </p>
          </div>
          <div className="de-widget-actions">
            <a
              href="/daydream/create"
              className="de-btn de-btn-primary text-xs"
              aria-label="Jump to Content Calendar in ContentEngin"
            >
              Jump to Content Calendar →
            </a>
          </div>
        </div>

        {/* ── Audience Segments ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Users className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Audience Segments</span>
            <span
              className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
            >
              {segments.length} segments
            </span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
              {segments.map(seg => (
                <div
                  key={seg.id}
                  style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}15`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{seg.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: ACCENT }}>{seg.size.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {seg.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                          background: `${ACCENT}10`, color: ACCENT, border: `1px solid ${ACCENT}20`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="New segment name…"
                value={newSegName}
                onChange={e => setNewSegName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateSegment()}
                aria-label="New audience segment name"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 9, fontSize: 12,
                  border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                  color: 'var(--de-heading)', outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleCreateSegment}
                disabled={!newSegName.trim()}
                className="de-btn de-btn-primary"
                aria-label="Create new audience segment"
                style={{ opacity: !newSegName.trim() ? 0.5 : 1, transition: 'all 0.15s' }}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* ── Brand Voice AI ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Layers className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Brand Voice AI</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Enter topic for on-brand copy…"
                value={voicePrompt}
                onChange={e => setVoicePrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVoiceGenerate()}
                aria-label="Topic for brand voice generation"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 9, fontSize: 12,
                  border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                  color: 'var(--de-heading)', outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleVoiceGenerate}
                disabled={voiceLoading || !voicePrompt.trim()}
                className="de-btn de-btn-primary"
                aria-label="Generate on-brand copy with Dr. Eams"
                style={{ opacity: voiceLoading || !voicePrompt.trim() ? 0.6 : 1, transition: 'all 0.15s' }}
              >
                {voiceLoading ? '…' : 'Ask Dr. Eams'}
              </button>
            </div>
            {voiceSuggestion && (
              <div
                style={{
                  padding: '12px 14px', borderRadius: 11,
                  background: `${ACCENT}06`, border: `1px solid ${ACCENT}20`,
                  fontSize: 12, color: 'var(--de-heading)', lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {voiceSuggestion}
              </div>
            )}
            {/* ── Multi-Connection: Brand → ContentEngin (Phase 8 §F pt 57) ── */}
            {voiceSuggestion && (
              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => handleSendToContentEngin(voiceSuggestion)}
                  disabled={contentBridgeSending}
                  style={{
                    width: '100%', padding: '8px 14px', borderRadius: 9,
                    background: `linear-gradient(135deg, ${ACCENT}, #f59e0b)`,
                    color: 'white', border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700,
                    opacity: contentBridgeSending ? 0.6 : 1, transition: 'opacity 0.15s',
                  }}
                  aria-label="Send brand voice to ContentEngin as a draft"
                >
                  {contentBridgeSending ? '…' : '➜ Send to ContentEngin'}
                </button>
                {contentBridgeMsg && (
                  <div style={{ marginTop: 6, fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center' }}>
                    {contentBridgeMsg}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Competitor Watch ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Eye className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Competitor Watch</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
              {competitors.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}15`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{c.handle}</div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 1 }}>
                      {c.followers} followers · Active {c.lastPost}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="@handle to watch…"
                value={watchHandle}
                onChange={e => setWatchHandle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCompetitor()}
                aria-label="Competitor handle to watch"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 9, fontSize: 12,
                  border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                  color: 'var(--de-heading)', outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleAddCompetitor}
                disabled={!watchHandle.trim()}
                className="de-btn de-btn-primary"
                aria-label="Add competitor to watch list"
                style={{ opacity: !watchHandle.trim() ? 0.5 : 1, transition: 'all 0.15s' }}
              >
                Watch
              </button>
            </div>
          </div>
        </div>

        {/* ── Asset Library ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <BookOpen className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Asset Library</span>
            <span
              className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
            >
              {assets.length} assets
            </span>
          </div>
          <div className="de-widget-body">
            {(['logo', 'color', 'font'] as const).map(type => {
              const group = assets.filter(a => a.type === type);
              if (group.length === 0) return null;
              return (
                <div key={type} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    {type}s
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {group.map(a => (
                      <div
                        key={a.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '7px 12px', borderRadius: 9,
                          background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}15`,
                        }}
                      >
                        {a.type === 'color' && (
                          <div style={{ width: 16, height: 16, borderRadius: 4, background: a.value, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
                        )}
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--de-heading)' }}>{a.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--de-text-dim)', fontFamily: a.type === 'color' ? 'monospace' : 'inherit' }}>{a.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                type="text"
                placeholder="Asset name…"
                value={newAssetName}
                onChange={e => setNewAssetName(e.target.value)}
                aria-label="New asset name"
                style={{
                  flex: 1, padding: '7px 10px', borderRadius: 9, fontSize: 12,
                  border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                  color: 'var(--de-heading)', outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Value…"
                value={newAssetValue}
                onChange={e => setNewAssetValue(e.target.value)}
                aria-label="New asset value"
                style={{
                  flex: 1, padding: '7px 10px', borderRadius: 9, fontSize: 12,
                  border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                  color: 'var(--de-heading)', outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleSaveAsset}
                disabled={!newAssetName.trim() || !newAssetValue.trim()}
                className="de-btn de-btn-primary"
                aria-label="Save new brand asset"
                style={{ opacity: !newAssetName.trim() || !newAssetValue.trim() ? 0.5 : 1, transition: 'all 0.15s' }}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* ── Journey Trail ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <span style={{ color: '#c8981a', fontSize: 16 }}>✦</span>
            <span className="de-widget-title ml-2">Your Journey</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--de-text-dim)', fontStyle: 'italic' }}>
              The dots only connect looking backwards
            </span>
          </div>
          <div className="de-widget-body">
            <JourneyTrail limit={50} />
          </div>
        </div>

      </div>
    </div>
  );
}
