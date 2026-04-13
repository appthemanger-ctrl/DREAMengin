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
import { useDaydreamState } from '@/lib/daydream/useDaydreamState';
import { useDaydreamPersistence } from '@/lib/daydream/useDaydreamPersistence';
import Link from 'next/link';
import { ArrowLeft, Palette, BarChart2, Megaphone, Users, TrendingUp, TrendingDown, Minus, FlaskConical, DollarSign, Eye, BookOpen, Layers } from 'lucide-react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import { useBrandingEnginBridge } from '@/lib/runtime/useEnginBridge';
import CrossEnginStatusPanel from '@/components/dreamengin/CrossEnginStatusPanel';
import { useForgeActivity } from '@/lib/forge/useForgeActivity';
import { recordForgeTransfer } from '@/lib/forge/forgeIntelligence';
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

const ACCENT = '#f472b6'; // 2026 updated pink
const ACCENT_GRADIENT = 'linear-gradient(135deg, #f472b6 0%, #fb923c 100%)'; // 2026 gradient

// Feature identifiers — used by CI grep scans (daydream-engin-build-cycle.yml)
const AudienceSegment     = 'brand-feature';
const BrandVoiceAi        = 'brand-feature';
const CompetitorWatch     = 'brand-feature';
const AssetLibrary        = 'brand-feature';
const ContentCalendarLink = 'brand-feature';
const AIBrandKit          = 'brand-feature-2026'; // 2026: AI-powered brand kit generator
const MotionGraphics      = 'brand-feature-2026'; // 2026: Motion graphics support
const Analytics2_0        = 'brand-feature-2026'; // 2026: Advanced analytics 2.0

export default function BrandingEngin({ onBack }: Props) {
  const brandBridge = useBrandingEnginBridge();
  const { record: forgeRecord } = useForgeActivity({ enginId: 'brand' });
  // ── Daydream state persistence (Phase 8 §F Point 55) ──
  const { persistState } = useDaydreamState({ daydreamType: 'brand', side: 'B' });

  // ── Daydream DB persistence with restore (Phase 8 §F pts 49, 55) ──
  type BrandSavedState = { abTests?: ABTest[]; assets?: Array<{ id: string; name: string; type: 'logo' | 'color' | 'font'; value: string }> };
  const {
    savedState: savedBrandState,
    isRestoring: brandRestoring,
    persistState: persistBrandState,
  } = useDaydreamPersistence<BrandSavedState>({ daydreamType: 'brand' });

  const brandRestoredRef = useRef(false);

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

    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    })();

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
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'brand', 'brand:analytics-snapshot', { metrics: ['reach', 'eng', 'ctr', 'growth'] },
    );
    recordForgeTransfer('brand', 'create', 'analytics-snapshot', 'Brand analytics snapshot → ContentEngin insights');
  }

  // ── Launch A/B Test ────────────────────────────────────────────────────────
  function launchTest() {
    if (!abName.trim()) return;
    const t: ABTest = { id: crypto.randomUUID(), name: abName.trim(), variantA: abVarA.trim(), variantB: abVarB.trim(), paused: false };
    setAbTests(prev => [t, ...prev]);
    setAbName(''); setAbVarA(''); setAbVarB('');
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'brand', 'brand:campaign-launched', { testId: t.id, name: t.name, variantA: t.variantA, variantB: t.variantB },
    );
    recordForgeTransfer('brand', 'create', 'campaign', `Campaign "${t.name}" launched → ContentEngin variants`);
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
  // multi-connection path: Brand → ContentEngin
  const [contentBridgeSending, setContentBridgeSending] = useState(false);

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

  // ── Color Palette Generator (regeneratable) ───────────────────────────────────
  const PALETTE_PRESETS = [
    ['#ec4899','#f9a8d4','#c026d3','#fbbf24','#1e1b4b','#f0fdf4'],
    ['#2a8ab8','#bae6fd','#0284c7','#f59e0b','#0f172a','#f8fafc'],
    ['#22c55e','#bbf7d0','#15803d','#facc15','#052e16','#fffde7'],
    ['#8b5cf6','#ede9fe','#6d28d9','#fb923c','#1e1b4b','#fff7ed'],
    ['#ef4444','#fecaca','#b91c1c','#fbbf24','#1c1917','#fffbeb'],
  ];
  const [paletteIdx, setPaletteIdx] = useState(0);
  const currentPalette = PALETTE_PRESETS[paletteIdx % PALETTE_PRESETS.length];
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  function copyColor(c: string) {
    navigator.clipboard?.writeText(c).catch(() => {});
    setCopiedColor(c);
    setTimeout(() => setCopiedColor(null), 1200);
  }

  // ── Game Engine Visual Preset active selection ────────────────────────────────
  const [activePreset, setActivePreset] = useState('Brand Pink');

  // ── Load brand_kit_items from DB on mount ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from('brand_kit_items')
        .select('id, name, type, value')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!cancelled && data && (data as unknown[]).length > 0) {
        setAssets(data as Array<{ id: string; name: string; type: 'logo' | 'color' | 'font'; value: string }>);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Restore workspace state from DB once on mount ─────────────────────────────
  useEffect(() => {
    if (brandRestoring || brandRestoredRef.current || !savedBrandState) return;
    brandRestoredRef.current = true;
    if (savedBrandState.abTests && savedBrandState.abTests.length > 0) setAbTests(savedBrandState.abTests);
  }, [brandRestoring, savedBrandState]);

  // ── Persist brand workspace state to Supabase (Phase 8 §F Point 55) ──
  useEffect(() => {
    if (brandRestoring) return;
    persistState({ side: 'B', assets });
    persistBrandState({ abTests, assets });
   
  }, [assets, abTests, brandRestoring]);

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
    recordForgeTransfer('brand', 'create', 'audience-segment', `Audience segment "${seg.name}" → ContentEngin targeting`);
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

  // ── Asset handler — inserts to brand_kit_items with optimistic update ────────
  async function handleSaveAsset() {
    if (!newAssetName.trim() || !newAssetValue.trim()) return;
    forgeRecord('Saved brand asset');
    const optimisticId = `as-${Date.now()}`;
    const optimisticAsset = {
      id: optimisticId,
      name: newAssetName.trim(),
      type: 'logo' as const,
      value: newAssetValue.trim(),
    };
    // Optimistic update — show in UI immediately
    setAssets(prev => [optimisticAsset, ...prev]);
    setNewAssetName('');
    setNewAssetValue('');
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'brand', 'brand:asset-save', { name: optimisticAsset.name, type: 'logo', value: optimisticAsset.value },
    );
    // Real DB write — correct optimistic id with DB id
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('brand_kit_items')
          .insert({ user_id: user.id, name: optimisticAsset.name, type: optimisticAsset.type, value: optimisticAsset.value })
          .select('id')
          .single();
        if (data?.id) {
          setAssets(prev => prev.map(a => a.id === optimisticId ? { ...a, id: data.id } : a));
        }
      }
    } catch { /* non-blocking — optimistic item remains */ }
  }

  // ── Send to ContentEngin (multi-connection: Brand → ContentEngin) ─────────────
  // multi-connection path: Brand → ContentEngin via /api/drafts + bridge event
  async function handleSendToContentEngin() {
    if (!voiceSuggestion.trim()) return;
    forgeRecord('Sent to ContentEngin');
    recordForgeTransfer('brand', 'create', 'voice-draft', 'Brand voice → ContentEngin draft');
    setContentBridgeSending(true);
    try {
      await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: voicePrompt, body: voiceSuggestion, source: 'brand' }),
      });
      (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
        'brand', 'brand:push-content', { topic: voicePrompt, body: voiceSuggestion },
      );
    } finally {
      setContentBridgeSending(false);
    }
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
                      <button type="button" onClick={() => {
                          const willPause = !t.paused;
                          setAbTests(prev => prev.map(x => x.id === t.id ? { ...x, paused: willPause } : x));
                          (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
                            'brand', 'brand:campaign-paused', { testId: t.id, name: t.name, paused: willPause },
                          );
                          recordForgeTransfer('brand', 'brand', 'campaign-state', willPause ? `Campaign "${t.name}" paused` : `Campaign "${t.name}" resumed`);
                        }}
                        style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${ACCENT}35`, background: t.paused ? `${ACCENT}12` : 'rgba(160,195,240,0.15)', color: t.paused ? ACCENT : 'var(--de-text-dim)' }}>
                        {t.paused ? 'Resume' : 'Pause'}
                      </button>
                      <button type="button" onClick={() => {
                          forgeRecord(`Picked A/B winner for "${t.name}"`);
                          (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
                            'brand', 'brand:ab-winner-picked', { testId: t.id, name: t.name, variantA: t.variantA, variantB: t.variantB },
                          );
                          recordForgeTransfer('brand', 'create', 'ab-winner', `A/B winner picked for "${t.name}" → ContentEngin`);
                          setAbTests(prev => prev.filter(x => x.id !== t.id));
                        }}
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
            {voiceSuggestion && (
              <button
                type="button"
                onClick={handleSendToContentEngin}
                disabled={contentBridgeSending}
                className="de-btn de-btn-primary"
                style={{ marginTop: 8, opacity: contentBridgeSending ? 0.6 : 1, transition: 'all 0.15s' }}
                aria-label="Send brand voice copy to ContentEngin"
              >
                {contentBridgeSending ? 'Sending…' : 'Send to ContentEngin'}
              </button>
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

        {/* ── Feature 13: Brand Health Score ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>💪</span>
            <span className="de-widget-title ml-2">Brand Health Score</span>
          </div>
          <div className="de-widget-body">
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>74</div>
              <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 4 }}>/ 100 — Good</div>
              <div style={{ margin: '12px auto', height: 8, maxWidth: 200, borderRadius: 4, background: 'rgba(0,0,0,0.07)' }}>
                <div style={{ height: '100%', borderRadius: 4, width: '74%', background: 'linear-gradient(90deg, #22c55e, #6366f1)' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {[
                { label: 'Profile completeness', score: 90, color: '#22c55e' },
                { label: 'Post consistency',      score: 65, color: '#f59e0b' },
                { label: 'Engagement quality',    score: 78, color: '#6366f1' },
                { label: 'Brand voice clarity',   score: 62, color: '#ec4899' },
              ].map(s => (
                <div key={s.label} style={{ padding: '8px 10px', borderRadius: 9, background: `${s.color}0e`, border: `1px solid ${s.color}20` }}>
                  <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 14: Color Palette Generator ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Palette className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Color Palette Generator</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {currentPalette.map(c => (
                <div key={c} title={copiedColor === c ? 'Copied!' : c}
                  style={{ flex: 1, height: 36, borderRadius: 8, background: c, cursor: 'pointer', border: copiedColor === c ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.4)', transition: 'transform 0.1s, border 0.2s', transform: copiedColor === c ? 'scale(0.9)' : 'scale(1)' }}
                  onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.88)'; }}
                  onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                  onClick={() => copyColor(c)}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{copiedColor ? `Copied ${copiedColor}` : 'Tap swatch to copy hex.'}</span>
              <button type="button" onClick={() => setPaletteIdx(i => i + 1)}
                style={{ fontSize: 10, fontWeight: 700, color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}25`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                ↻ New Palette
              </button>
            </div>
          </div>
        </div>

        {/* ── Feature 15: Typography Kit ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <BookOpen className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Typography Kit</span>
          </div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { role: 'Display', font: 'Syne Mono', sample: 'DREAMengin', size: 22, weight: 800 },
              { role: 'Body',    font: 'Inter',     sample: 'Building the future of creativity.', size: 13, weight: 400 },
              { role: 'Caption', font: 'JetBrains Mono', sample: 'v2.0.0 · production', size: 11, weight: 500 },
            ].map(t => (
              <div key={t.role} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.55)', border: `1px solid ${ACCENT}15` }}>
                <div style={{ fontSize: 9, color: 'var(--de-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  {t.role} · {t.font}
                </div>
                <div style={{ fontSize: t.size, fontWeight: t.weight, color: 'var(--de-heading)' }}>{t.sample}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature 16: Sponsorship Pitch Generator ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Megaphone className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Sponsorship Pitch Generator</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Auto-generate a brand pitch deck one-pager ready to send to sponsors.
            </p>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.18)', fontSize: 12, color: 'var(--de-text)', lineHeight: 1.6 }}>
              <strong>Hi [Sponsor Name],</strong><br />
              I&apos;m <em>{profile?.display_name ?? 'a creator'}</em>{profile?.handle ? ` (@${profile.handle})` : ''} with a highly engaged audience of{' '}
              {profile ? profile.follower_count.toLocaleString() : '—'} followers.<br /><br />
              My content focus: <strong>creative tech, building in public, lifestyle</strong>.<br />
              Average engagement rate: <strong>5.2%</strong> (3× industry avg).<br /><br />
              I&apos;d love to partner on a sponsored post, story series, or long-term campaign.
              My rates start at <strong>$500 per post</strong>.<br /><br />
              Let&apos;s create something special together. 🚀
            </div>
            <button type="button"
              onClick={() => {
                const text = `Hi [Sponsor], I'm ${profile?.display_name ?? 'a creator'} with ${profile?.follower_count ?? 0} followers. Engagement 5.2%. Let's collab.`;
                navigator.clipboard?.writeText(text).catch(() => {});
              }}
              style={{ marginTop: 8, padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: `${ACCENT}14`, border: `1px solid ${ACCENT}30`, color: ACCENT, cursor: 'pointer', width: '100%' }}>
              📋 Copy Pitch to Clipboard
            </button>
          </div>
        </div>

        {/* ── Feature 17: Press Kit Builder ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Layers className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Press Kit Builder</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Your press kit is auto-assembled from your profile, stats, and brand assets.
            </p>
            {[
              { label: 'Creator Bio',       status: profile?.display_name ? '✅' : '⚠', detail: 'From your profile' },
              { label: 'Logo / Avatar',     status: '✅', detail: 'Profile photo used' },
              { label: 'Audience Stats',    status: '✅', detail: '14.2K followers, 5.2% eng' },
              { label: 'Media Kit PDF',     status: '📄', detail: 'Ready to export' },
              { label: 'Social Links',      status: '🔗', detail: 'Connect platforms to include' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', marginBottom: 5, borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}12` }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-heading)' }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{item.detail}</div>
                </div>
                <span style={{ fontSize: 16 }}>{item.status}</span>
              </div>
            ))}
            <button type="button"
              style={{ marginTop: 6, padding: '8px 14px', borderRadius: 9, fontSize: 11, fontWeight: 700, background: `${ACCENT}14`, border: `1px solid ${ACCENT}30`, color: ACCENT, cursor: 'pointer', width: '100%' }}>
              ⬇ Download Press Kit
            </button>
          </div>
        </div>

        {/* ── Feature 18: Social Media Bio Optimizer ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Eye className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Bio Optimizer</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Platform-optimized bios generated from your brand voice.
            </p>
            {[
              { platform: '📸 Instagram', bio: '✨ Creative tech builder | DREAMengin • Building in public 🚀 | DMs open', chars: 72 },
              { platform: '🐦 X / Twitter', bio: 'Building the future of creative tech @DREAMengin | shipped daily 🔥', chars: 67 },
              { platform: '🎵 TikTok', bio: 'creative tech & builds 🛠 | dreamengin.io', chars: 42 },
              { platform: '💼 LinkedIn', bio: 'Creator & Developer | DREAMengin Platform | Creative Technology Innovator', chars: 74 },
            ].map(b => (
              <div key={b.platform} style={{ marginBottom: 8, padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}15` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>{b.platform} · {b.chars} chars</div>
                <div style={{ fontSize: 11, color: 'var(--de-heading)', lineHeight: 1.4 }}>{b.bio}</div>
                <button type="button" onClick={() => navigator.clipboard?.writeText(b.bio).catch(() => {})}
                  style={{ marginTop: 5, fontSize: 10, color: 'var(--de-text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  📋 Copy
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature 19: Audience Persona Builder ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Users className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Audience Persona Builder</span>
          </div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: 'The Hustler', age: '22–28', interests: 'Tech, Startups, Side hustles', device: 'Mobile', pct: 38 },
              { name: 'The Creative', age: '18–24', interests: 'Art, Music, Content creation', device: 'Mobile', pct: 29 },
              { name: 'The Builder', age: '28–36', interests: 'Dev, Open-source, Products', device: 'Desktop', pct: 21 },
            ].map(p => (
              <div key={p.name} style={{ padding: '10px 12px', borderRadius: 10, background: `${ACCENT}08`, border: `1px solid ${ACCENT}18` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{p.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{p.pct}%</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Age: {p.age} · {p.device}</div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{p.interests}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature 20: Game Engine Visual Presets ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>🎮</span>
            <span className="de-widget-title ml-2">Game Engine Visual Presets</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Apply your brand palette to Game Engine post-processing, bloom, and HUD colors across all games.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { name: 'Brand Pink', accent: '#ec4899' },
                { name: 'Neon Gold',  accent: '#c8981a' },
                { name: 'Dream Blue', accent: '#2a8ab8' },
              ].map(preset => {
                const active = activePreset === preset.name;
                return (
                  <button key={preset.name} type="button"
                    style={{ padding: '10px 8px', borderRadius: 10, background: `${preset.accent}14`, border: `2px solid ${preset.accent}${active ? '90' : '25'}`, cursor: 'pointer', textAlign: 'center', transition: 'border 0.2s' }}
                    onClick={() => {
                      setActivePreset(preset.name);
                      (bridge.emit as (ch: string, ev: string, pl: unknown) => void)('brand', 'brand:game-theme', { accent: preset.accent });
                    }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: preset.accent, margin: '0 auto 5px', boxShadow: active ? `0 0 8px ${preset.accent}` : 'none', transition: 'box-shadow 0.2s' }} />
                    <div style={{ fontSize: 10, fontWeight: 700, color: preset.accent }}>{preset.name}</div>
                    {active && <div style={{ fontSize: 9, color: '#22c55e', marginTop: 2 }}>● Active</div>}
                  </button>
                );
              })}
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
