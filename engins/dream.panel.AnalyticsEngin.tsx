'use client';

/**
 * AnalyticsEngin — Side B control layer for the Analytics Daydream.
 *
 * Responsibilities (README spec / ARCHITECTURE.md §1 Daydream pairs):
 *   - Deep metrics panel: platform health (admin), AQS trend, revenue split.
 *   - Skip credit balance: live credit count with earn/spend history.
 *   - Verified view report: bot detection summary and CPV tier breakdown.
 *   - Cross-Engin Sync Panel: live status for sibling engins.
 *
 * Security: all metric fetches are auth-gated by RLS on the server.
 * Admin-only panel reads /api/metrics/platform — returns 403 for non-admins.
 * Follows AXIOM 4 (security by default) and AXIOM 3 (real actions only).
 */

import { ActivityProfile } from '@/components/activity/dream.ActivityProfile';
import JourneyTrail from '@/components/daydream/dream.JourneyTrail';
import CrossEnginStatusPanel from '@/components/dreamengin/dream.panel.CrossEnginStatusPanel';
import type { GetPlatformMetricsResponse, SkipCredit } from '@/lib/activity/types';
import { PLATFORM_HEALTH_TARGETS } from '@/lib/activity/types';
import { useDaydreamPersistence } from '@/lib/daydream/useDaydreamPersistence';
import { useForgeActivity } from '@/lib/forge/useForgeActivity';
import { useEnginCoopSync } from '@/lib/runtime/useEnginCoopSync';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
    Activity,
    ArrowLeft, BarChart2,
    DollarSign,
    Eye,
    RefreshCw,
    Shield,
    TrendingUp,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Props {
  onBack: () => void;
  instanceId?: string;
}

const ACCENT = '#6366f1';

// Revenue split constants per ACTIVITY_FIRST_PROTOCOL.md §V
const REVENUE_SPLIT = [
  { label: 'Platform',     pct: 30, color: '#6366f1', desc: 'Infrastructure, safety, AI moderation' },
  { label: 'Creator',      pct: 50, color: '#22c55e', desc: 'Direct payout to content creator' },
  { label: 'Reward Pool',  pct: 20, color: '#f59e0b', desc: 'Monthly distribution to active users' },
];

export default function AnalyticsEngin({ onBack, instanceId: instanceIdProp }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [platformMetrics, setPlatformMetrics] = useState<GetPlatformMetricsResponse | null>(null);
  const [skipCredit, setSkipCredit] = useState<SkipCredit | null>(null);
  const [platformLoading, setPlatformLoading] = useState(false);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [instanceId] = useState(
    () => instanceIdProp ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
  );

  useEnginCoopSync({
    enginName: 'AnalyticsEngin',
    instanceId,
    region: 'engin:analytics',
    active: false,
    stateSnapshot: () => ({ type: 'analytics:state' }),
    onPeerState: (_evt) => {},
  });
  useDaydreamPersistence<Record<string, unknown>>({ daydreamType: 'analytics' });
  const { record: _forgeRecord } = useForgeActivity({ enginId: 'analytics' });

  // Load authenticated user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string; email?: string } | null } }) => {
      if (data.user) {
        setUserId(data.user.id);
        // Check admin role
        Promise.resolve((supabase as SupabaseClient)
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .single())
          .then(({ data: roleData }: { data: { role?: string } | null }) => {
            setIsAdmin(roleData?.role === 'admin');
          })
          .catch(() => {});
      }
    });
  }, []);

  // Load platform metrics (admin only)
  useEffect(() => {
    if (!isAdmin) return;
    setPlatformLoading(true);
    fetch('/api/metrics/platform')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPlatformMetrics(data))
      .catch(() => {})
      .finally(() => setPlatformLoading(false));
  }, [isAdmin]);

  // Load skip credit balance
  useEffect(() => {
    if (!userId) return;
    setCreditsLoading(true);
    fetch('/api/skip-credits/balance')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSkipCredit(data?.skip_credit ?? null))
      .catch(() => {})
      .finally(() => setCreditsLoading(false));
  }, [userId]);

  const refreshPlatformMetrics = () => {
    if (!isAdmin) return;
    setPlatformLoading(true);
    fetch('/api/metrics/platform')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPlatformMetrics(data))
      .catch(() => {})
      .finally(() => setPlatformLoading(false));
  };

  return (
    <div className="min-h-screen pb-16" style={{ background: 'linear-gradient(155deg, #0a0e1a 0%, #0d1830 50%, #0a1228 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'rgba(99,102,241,0.18)', background: 'rgba(10,14,26,0.90)', backdropFilter: 'blur(16px)' }}>
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full transition-colors hover:bg-white/10"
          aria-label="Back to Analytics Daydream"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <BarChart2 className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-sm font-bold text-white truncate">AnalyticsEngin</span>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, color: ACCENT, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 9999, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Side B
        </span>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── Deep Activity Metrics ─────────────────────────────────────────── */}
        {userId && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Activity className="w-4 h-4" style={{ color: ACCENT }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Full Activity Report</span>
            </div>
            <ActivityProfile userId={userId} showFullStats />
          </div>
        )}

        {/* ── Skip Credit Balance ───────────────────────────────────────────── */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Zap className="w-4 h-4" style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Skip Credit Balance</span>
          </div>
          {creditsLoading ? (
            <div style={{ height: 40, background: 'rgba(255,255,255,0.06)', borderRadius: 8, animation: 'pulse 2s infinite' }} />
          ) : skipCredit ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Balance',  value: skipCredit.credits_balance, color: '#f59e0b' },
                { label: 'Earned',   value: skipCredit.earned_total,    color: '#22c55e' },
                { label: 'Spent',    value: skipCredit.spent_total,     color: '#f87171' },
              ].map((m) => (
                <div key={m.label} style={{ textAlign: 'center', padding: '8px 4px', background: `rgba(${m.color === '#f59e0b' ? '245,158,11' : m.color === '#22c55e' ? '34,197,94' : '248,113,113'},0.08)`, borderRadius: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 11, color: '#64748b' }}>Watch rewarded ads to earn skip credits. Balance loads after your first ad view.</p>
          )}
          <p style={{ fontSize: 10, color: '#64748b', marginTop: 10 }}>
            Earn 1 credit per pre/post-roll ad · 3 credits per rewarded ad · Auto-applied on your next ad.
          </p>
        </div>

        {/* ── Revenue Split ─────────────────────────────────────────────────── */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <DollarSign className="w-4 h-4" style={{ color: '#22c55e' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Ad Revenue Split</span>
          </div>
          <div className="space-y-3">
            {REVENUE_SPLIT.map((row) => (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: row.color }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: row.color }}>{row.pct}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: 9999 }} />
                </div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{row.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: '#64748b', marginTop: 12 }}>
            CPV: Standard $0.08 · Premium $0.12 · Super Premium $0.15
          </p>
        </div>

        {/* ── Verified View Summary ─────────────────────────────────────────── */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', border: '1px solid rgba(56,189,248,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Eye className="w-4 h-4" style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>View Verification</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Standard',      tier: 'AQS ≤ 499',    cpv: '$0.08', color: '#64748b' },
              { label: 'Premium',       tier: 'AQS 500–999',  cpv: '$0.12', color: '#38bdf8' },
              { label: 'Super Premium', tier: 'AQS 1000+',    cpv: '$0.15', color: '#a78bfa' },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: row.color }}>{row.label}</div>
                  <div style={{ fontSize: 9, color: '#64748b' }}>{row.tier}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.cpv}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: '#64748b', marginTop: 10 }}>
            TheBoogieMan.Ai filters bots and duplicates before counting any view.
          </p>
        </div>

        {/* ── Platform Health (Admin only) ──────────────────────────────────── */}
        {isAdmin && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Shield className="w-4 h-4" style={{ color: '#ef4444' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Platform Health</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.12)', padding: '2px 6px', borderRadius: 4 }}>ADMIN</span>
              <button
                type="button"
                onClick={refreshPlatformMetrics}
                disabled={platformLoading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                aria-label="Refresh platform metrics"
              >
                <RefreshCw className="w-3 h-3" style={{ color: '#64748b', animation: platformLoading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </div>
            {platformLoading ? (
              <div style={{ height: 80, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }} />
            ) : platformMetrics ? (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Real Shit Rate',    value: `${platformMetrics.real_shit_rate.toFixed(1)}%`,     target: `>${PLATFORM_HEALTH_TARGETS.real_shit_rate}%`,    ok: platformMetrics.real_shit_rate >= PLATFORM_HEALTH_TARGETS.real_shit_rate },
                  { label: 'Avg AQS',           value: platformMetrics.average_aqs.toFixed(0),               target: `>${PLATFORM_HEALTH_TARGETS.average_aqs}`,        ok: platformMetrics.average_aqs >= PLATFORM_HEALTH_TARGETS.average_aqs },
                  { label: 'Harmful Content',   value: `${platformMetrics.harmful_content_rate.toFixed(3)}%`, target: `<${PLATFORM_HEALTH_TARGETS.harmful_content_rate}%`, ok: platformMetrics.harmful_content_rate <= PLATFORM_HEALTH_TARGETS.harmful_content_rate },
                  { label: 'Ad View Rate',      value: `${platformMetrics.ad_view_rate.toFixed(1)}%`,         target: `>${PLATFORM_HEALTH_TARGETS.ad_view_rate}%`,       ok: platformMetrics.ad_view_rate >= PLATFORM_HEALTH_TARGETS.ad_view_rate },
                ].map((m) => (
                  <div key={m.label} style={{ padding: '8px 10px', borderRadius: 8, background: `rgba(${m.ok ? '34,197,94' : '239,68,68'},0.06)`, border: `1px solid rgba(${m.ok ? '34,197,94' : '239,68,68'},0.18)` }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: m.ok ? '#22c55e' : '#ef4444' }}>{m.value}</div>
                    <div style={{ fontSize: 9, color: '#64748b' }}>{m.label}</div>
                    <div style={{ fontSize: 8, color: m.ok ? '#22c55e' : '#f87171', marginTop: 1 }}>Target: {m.target}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 11, color: '#64748b' }}>Platform metrics unavailable.</p>
            )}
            <div style={{ marginTop: 12 }}>
              <Link href="/idari-console/platform-health" style={{ fontSize: 10, fontWeight: 600, color: '#ef4444', textDecoration: 'none' }}>
                Open IDARi Platform Health Console →
              </Link>
            </div>
          </div>
        )}

        {/* ── Cross-Engin Sync ──────────────────────────────────────────────── */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrendingUp className="w-4 h-4" style={{ color: ACCENT }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Cross-Engin Activity</span>
          </div>
          <CrossEnginStatusPanel excludeChannel="analytics" />
        </div>

        {/* ── Journey Trail ─────────────────────────────────────────────────── */}
        <JourneyTrail compact />

      </div>
    </div>
  );
}
