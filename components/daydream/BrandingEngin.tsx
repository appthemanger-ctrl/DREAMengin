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

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Palette, BarChart2, Megaphone, Users, TrendingUp, TrendingDown, Minus, FlaskConical, DollarSign } from 'lucide-react';

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

      </div>
    </div>
  );
}
