import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import PortfolioEngin from '@/components/daydream/PortfolioEngin';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Portfolio Optimizer – DREAMengin',
  description: 'Markowitz portfolio optimization powered by quantum algorithms (VQE / QAOA).',
};

const WIDGETS: DaydreamWidget[] = [
  { id: 'run',       emoji: '⚛️',  label: 'Run Optimization',  desc: 'Start a new quantum portfolio run',    color: '#2a8ab8', href: '/daydream/lab/portfolio' },
  { id: 'history',   emoji: '📈',  label: 'Run History',       desc: 'Review past optimization runs',        color: '#c8981a', href: '/daydream/lab/portfolio' },
  { id: 'esg',       emoji: '🌱',  label: 'ESG Filters',       desc: 'Apply ESG constraint profiles',        color: '#22c55e', href: '/daydream/lab/portfolio' },
  { id: 'config',    emoji: '⚙️',  label: 'Config',            desc: 'Edit config.yaml settings',            color: '#8b5cf6', href: '/daydream/lab/portfolio' },
  { id: 'lab',       emoji: '🔬',  label: 'Back to Lab',       desc: 'Return to your experiments',           color: '#6366f1', href: '/daydream/lab'           },
  { id: 'share',     emoji: '🔗',  label: 'Share Results',     desc: 'Post an optimization insight',         color: '#ec4899', href: '/create'                 },
];

// ── accent colour for this Daydream ────────────────────────────
const ACCENT = '#2a8ab8';

export default async function PortfolioOptimizerPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Portfolio Optimizer"
      enginName="PortfolioEngin"
      accentColor={ACCENT}
      widgets={WIDGETS}
      sideBComponent={PortfolioEngin}
    >
      <div className="de-sky-bg min-h-screen">

        {/* ── Sticky header ──────────────────────────────── */}
        <header
          className="sticky top-0 z-30 backdrop-blur-xl"
          style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
        >
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link
              href="/daydream/lab"
              className="p-2 -ml-2 rounded-full"
              style={{ background: 'rgba(160,195,240,0.15)' }}
            >
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1 }}>
                DREAMengin · Lab
              </div>
              <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                <TrendingUp className="w-4 h-4" style={{ color: ACCENT }} />
                <h1 className="text-base font-bold" style={{ color: 'var(--de-heading)' }}>Portfolio Optimizer</h1>
              </div>
            </div>
            <span
              className="text-xs px-2 py-1 rounded-full font-semibold"
              style={{ background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}25` }}
            >
              Daydream
            </span>
          </div>
        </header>

        {/* ── Main content ───────────────────────────────── */}
        <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

          {/* Hero intro card */}
          <div style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 18,
            padding: '20px 20px 18px',
            border: `1px solid ${ACCENT}20`,
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 6 }}>
              Quantum Portfolio Optimizer
            </h2>
            <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.6, margin: 0 }}>
              Markowitz mean-variance optimization formulated as a QUBO problem and solved
              with VQE or QAOA on a local simulator or IBM Quantum hardware.
              Flip to <strong style={{ color: 'var(--de-heading)' }}>PortfolioEngin</strong> to configure and run an optimization.
            </p>
          </div>

          {/* Capabilities grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { emoji: '⚛️', label: 'VQE',           sub: 'Variational Quantum\nEigensolver',           color: ACCENT        },
              { emoji: '🌊', label: 'QAOA',          sub: 'Quantum Approximate\nOptimisation Algorithm', color: '#8b5cf6'     },
              { emoji: '🌱', label: 'ESG',           sub: 'Environmental, Social\n& Governance filters', color: '#22c55e'     },
              { emoji: '📐', label: 'MIP Baseline',  sub: 'Classical Mixed-Integer\ncomparison',         color: '#f59e0b'     },
            ].map(item => (
              <div
                key={item.label}
                style={{
                  background: 'rgba(255,255,255,0.82)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: 16,
                  padding: '16px 14px',
                  border: `1px solid ${item.color}20`,
                }}
              >
                <span style={{ fontSize: 22, display: 'block', marginBottom: 8 }}>{item.emoji}</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 3 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Spec strip */}
          <div style={{
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 14,
            padding: '14px 16px',
            border: '1px solid rgba(160,195,240,0.2)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
              Supported Features
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { label: 'CVaR QAOA',      color: '#8b5cf6' },
                { label: 'XY Mixer',       color: '#0ea5e9' },
                { label: 'ESG',            color: '#22c55e' },
                { label: 'MIP Baseline',   color: '#f59e0b' },
                { label: 'ZNE Local',      color: '#ec4899' },
                { label: 'Max 25 Assets',  color: ACCENT    },
              ].map(f => (
                <span
                  key={f.label}
                  style={{
                    fontSize: 11, fontWeight: 600,
                    padding: '4px 10px', borderRadius: 999,
                    background: `${f.color}12`,
                    border: `1px solid ${f.color}28`,
                    color: f.color,
                  }}
                >
                  {f.label}
                </span>
              ))}
            </div>
          </div>

          {/* PortfolioEngin hint */}
          <div style={{
            background: `${ACCENT}08`,
            borderRadius: 14,
            padding: '14px 16px',
            border: `1px solid ${ACCENT}20`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>
              PortfolioEngin — Side B
            </div>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5, margin: 0 }}>
              Tap the <strong style={{ color: 'var(--de-heading)' }}>ENGIN</strong> tab (bottom-right corner) to open
              PortfolioEngin — choose your algorithm, backend, and ansatz, then trigger a live optimization run.
            </p>
          </div>

        </div>
      </div>
    </DaydreamShell>
  );
}
