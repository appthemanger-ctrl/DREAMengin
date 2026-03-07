'use client';

/**
 * LabEngin — Side B control layer for the Lab Daydream.
 *
 * Responsibilities (README spec §9.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - Surface active experiments from the `physics_experiments` table.
 *   - Provide a direct entry point to start a new experiment.
 *   - Show a Simulation Status placeholder ready for future runtime data.
 *
 * Security: filters by creator_id = auth.uid() as defence-in-depth on top of
 * server-side RLS. Follows AXIOM 4 (security by default).
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, Activity } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface Experiment {
  id: string;
  title: string;
  status: string;
}

const ACCENT = '#22c55e';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  draft:     { bg: 'rgba(160,195,240,0.18)', text: 'var(--de-text-dim)',   border: 'rgba(160,195,240,0.25)' },
  running:   { bg: 'rgba(42,138,184,0.12)',  text: '#2a8ab8',               border: 'rgba(42,138,184,0.25)' },
  completed: { bg: 'rgba(34,197,94,0.12)',   text: '#22c55e',               border: 'rgba(34,197,94,0.25)' },
  archived:  { bg: 'rgba(100,116,139,0.12)', text: 'var(--de-text-dim)',    border: 'rgba(100,116,139,0.2)' },
};

export default function LabEngin({ onBack }: Props) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user;
      if (!user || cancelled) { setLoading(false); return; }
      const { data } = await supabase
        .from('physics_experiments')
        .select('id, title, status')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!cancelled) {
        setExperiments((data as Experiment[] | null) ?? []);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const active = experiments.filter(e => e.status === 'running' || e.status === 'draft');

  return (
    <div className="de-sky-bg min-h-screen">

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full"
            style={{
              background: 'rgba(160,195,240,0.15)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Back to Lab"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>

          <div
            style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg, ${ACCENT}, rgba(200,152,26,0.8))`,
            }}
          />

          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>
              LabEngin
            </div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Lab · Control Layer</div>
          </div>

          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
          >
            Side B
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>

        {/* Active Experiments */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Active Experiments</span>
            {active.length > 0 && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${ACCENT}18`, color: ACCENT }}
              >
                {active.length}
              </span>
            )}
          </div>

          <div className="de-widget-body">
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                Loading experiments…
              </p>
            ) : experiments.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                <FlaskConical className="w-6 h-6 flex-shrink-0" style={{ color: ACCENT, opacity: 0.3 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                    No experiments yet
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                    Start your first experiment in the Lab.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {experiments.map(exp => {
                  const c = STATUS_COLORS[exp.status] ?? STATUS_COLORS.draft;
                  return (
                    <div
                      key={exp.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(160,195,240,0.18)',
                      }}
                    >
                      <FlaskConical
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: ACCENT, opacity: 0.7 }}
                      />
                      <span
                        style={{
                          flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                        }}
                      >
                        {exp.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
                          padding: '2px 8px', borderRadius: 999,
                          background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                        }}
                      >
                        {exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="de-widget-actions">
            <Link href="/lab" className="de-btn de-btn-primary text-xs">
              + New Experiment
            </Link>
          </div>
        </div>

        {/* Simulation Status */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Simulation Status</span>
          </div>

          <div className="de-widget-body">
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0',
              }}
            >
              <div
                style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: `${ACCENT}12`,
                  border: `1px solid ${ACCENT}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Activity className="w-5 h-5" style={{ color: ACCENT, opacity: 0.7 }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                  No simulation running
                </div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.4 }}>
                  Start an experiment and run a simulation to see live status here.
                </div>
              </div>
            </div>

            {/* Placeholder stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
              {[['—', 'Running'], ['—', 'Queued'], ['—', 'Done']].map(([val, lbl]) => (
                <div
                  key={lbl}
                  className="de-metric de-surface"
                  style={{ borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}
                >
                  <span className="de-metric-value" style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)', display: 'block' }}>
                    {val}
                  </span>
                  <span className="de-metric-label" style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>
                    {lbl}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
