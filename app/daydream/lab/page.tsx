import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, StickyNote, Pin, Beaker, Atom, BookOpen } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Lab · Simulation – DREAMengin',
  description: 'Note-taking, quick capture, pinboard, and simulation playground.',
};

const WIDGETS: DaydreamWidget[] = [
  { id: 'simulation', emoji: '🧪', label: 'Simulation Side →', desc: 'Run ideas, formulas, hypotheses', color: '#10b981', href: '/daydream/lab' },
  { id: 'pinboard',   emoji: '📌', label: 'Pinboard',          desc: 'Pin your most important notes',  color: '#f59e0b', href: '/daydream/lab' },
  { id: 'capture',    emoji: '⚡', label: 'Quick Capture',     desc: 'Grab a thought before it fades', color: '#10b981', href: '/daydream/lab' },
  { id: 'formulas',   emoji: '∑',  label: 'Formula Lab',       desc: 'Math, science, code formulas',   color: '#0ea5e9', href: '/daydream/lab' },
  { id: 'hypothesis', emoji: '💡', label: 'Hypothesis Board',  desc: 'Organise your experiments',      color: '#6366f1', href: '/daydream/lab' },
  { id: 'export',     emoji: '📤', label: 'Export Notes',      desc: 'Download your lab notebook',     color: '#c8981a', href: '/daydream/lab' },
];

export default async function LabDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell title="Lab" accentColor="#10b981" widgets={WIDGETS}>
      <div className="de-sky-bg min-h-screen">
        {/* Sticky header — mobile first */}
        <header
          className="sticky top-0 z-30 backdrop-blur-xl"
          style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
        >
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link
              href="/home"
              className="p-2 -ml-2 rounded-full"
              style={{ background: 'rgba(160,195,240,0.15)', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
            </Link>
            <FlaskConical className="w-5 h-5" style={{ color: '#10b981' }} />
            <div>
              <h1 className="text-base font-bold leading-none" style={{ color: 'var(--de-heading)' }}>Lab</h1>
              <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Notes · Capture · Pinboard</p>
            </div>
            <span
              className="ml-auto text-xs px-2 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', minHeight: 28, display: 'flex', alignItems: 'center' }}
            >
              Side A
            </span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-5 pb-28 space-y-4">

          {/* Quick capture — sticky-note style, large tap target */}
          <div className="de-widget">
            <div className="de-widget-header">
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StickyNote className="w-4 h-4" style={{ color: '#10b981' }} />
                </div>
                <span className="de-widget-title">Quick Capture</span>
              </div>
            </div>
            <div className="de-widget-body">
              <textarea
                placeholder="Drop a thought, formula, or observation…"
                rows={4}
                style={{
                  width: '100%',
                  background: 'rgba(16,185,129,0.04)',
                  border: '1.5px solid rgba(16,185,129,0.2)',
                  borderRadius: 12,
                  padding: '14px 14px',
                  fontSize: 15,
                  color: 'var(--de-text)',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.6,
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div className="de-widget-actions">
              <button type="button" className="de-btn de-btn-primary text-sm" style={{ minHeight: 44 }}>
                + Pin to Board
              </button>
              <button type="button" className="de-btn de-btn-ghost text-sm" style={{ minHeight: 44 }}>
                Save Note
              </button>
            </div>
          </div>

          {/* Pinboard */}
          <div className="de-widget">
            <div className="de-widget-header">
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pin className="w-4 h-4" style={{ color: '#f59e0b' }} />
                </div>
                <span className="de-widget-title">Pinboard</span>
              </div>
            </div>
            <div className="de-widget-body">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Experiment #1', text: 'Measure baseline response at 37°C', color: '#10b981' },
                  { label: 'Formula',       text: 'E = mc² → energy-mass equivalence', color: '#0ea5e9' },
                  { label: 'Hypothesis',    text: 'Reducing latency by 40% possible with render-on-demand', color: '#f59e0b' },
                  { label: 'Quick Ref',     text: 'API rate limit: 60 rpm per user', color: '#6366f1' },
                ].map((pin) => (
                  <div
                    key={pin.label}
                    style={{
                      background: `${pin.color}08`,
                      border: `1.5px solid ${pin.color}22`,
                      borderRadius: 14,
                      padding: '12px 12px',
                      minHeight: 88,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: pin.color }}>{pin.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--de-text)', lineHeight: 1.5, flex: 1 }}>{pin.text}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="de-widget-actions">
              <button type="button" className="de-btn de-btn-ghost text-xs" style={{ minHeight: 44 }}>+ Add Pin</button>
            </div>
          </div>

          {/* Note-taking space */}
          <div className="de-widget">
            <div className="de-widget-header">
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(14,165,233,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen className="w-4 h-4" style={{ color: '#0ea5e9' }} />
                </div>
                <span className="de-widget-title">Lab Notebook</span>
              </div>
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>Side A</span>
            </div>
            <div className="de-widget-body flex flex-col items-center py-6 gap-3">
              <BookOpen className="w-8 h-8 opacity-20" style={{ color: '#0ea5e9' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>No notes yet</p>
              <p className="text-xs text-center" style={{ color: 'var(--de-text-dim)' }}>Use Quick Capture above to save your first note. Flip to Side B to run simulations.</p>
            </div>
            <div className="de-widget-actions">
              <button type="button" className="de-btn de-btn-ghost text-xs" style={{ minHeight: 44 }}>+ New Page</button>
            </div>
          </div>

          {/* Simulation preview banner — points to Side B */}
          <div
            className="de-widget"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(14,165,233,0.08))', borderColor: 'rgba(16,185,129,0.25)' }}
          >
            <div className="de-widget-header" style={{ borderBottomColor: 'rgba(16,185,129,0.2)' }}>
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4" style={{ color: '#10b981' }} />
                <span className="de-widget-title">Simulation</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>Side B</span>
            </div>
            <div className="de-widget-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🧪</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 4 }}>Run Ideas · Test Hypotheses</div>
                  <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>Formula playground, hypothesis board, and simulation runner live on Side B. Tap the corner tab to flip.</div>
                </div>
              </div>
            </div>
            <div className="de-widget-actions">
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--de-text-dim)' }}>
                <Beaker className="w-3 h-3" style={{ color: '#10b981' }} />
                Flip using the corner tab (Alt+F on desktop)
              </div>
            </div>
          </div>

        </div>
      </div>
    </DaydreamShell>
  );
}
