import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import LabEngin from '@/components/daydream/LabEngin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Lab Daydream – Dreamengin', description: 'Experiments, prototypes, simulations, and models.' };

const WIDGETS: DaydreamWidget[] = [
  { id: 'new-experiment', emoji: '🧪', label: 'New Experiment', desc: 'Start a new lab experiment',     color: '#22c55e', href: '/lab/new'       },
  { id: 'projects',       emoji: '🔬', label: 'My Projects',    desc: 'Browse your lab projects',       color: '#6366f1', href: '/lab'           },
  { id: 'prototype',      emoji: '⚗️', label: 'Prototype',       desc: 'Build and test a prototype',    color: '#2a8ab8', href: '/lab/new'       },
  { id: 'simulation',     emoji: '🌊', label: 'Simulations',     desc: 'Run and view simulations',      color: '#0ea5e9', href: '/lab'           },
  { id: 'physics',        emoji: '⚛️', label: 'Physics Lab',     desc: '3D physics environment',        color: '#f59e0b', href: '/physics-lab'   },
  { id: 'codespace',      emoji: '💻', label: 'Codespace',       desc: 'Open the code editor',          color: '#8b5cf6', href: '/codespace'     },
  { id: 'notes',          emoji: '📝', label: 'Lab Notes',       desc: 'Document your findings',        color: '#ec4899', href: '/notes'         },
  { id: 'share',          emoji: '🔗', label: 'Share Results',   desc: 'Post an experiment update',     color: '#c8981a', href: '/create'        },
];

export default async function LabDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Lab"
      enginName="LabEngin"
      accentColor="#22c55e"
      daydreamType="lab"
      widgets={WIDGETS}
      sideBComponent={LabEngin}
    >
      <div className="de-sky-bg min-h-screen">
        <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/homedream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1 }}>DREAMengin</div>
              <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                <FlaskConical className="w-4 h-4" style={{ color: '#22c55e' }} />
                <h1 className="text-base font-bold" style={{ color: 'var(--de-heading)' }}>Lab</h1>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>Daydream</span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
          {/* Intro */}
          <div style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 18,
            padding: '20px 20px 18px',
            border: '1px solid rgba(34,197,94,0.15)',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 6 }}>Lab</h2>
            <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
              Your experimental workspace. Run experiments, build prototypes, test models, and explore simulations.
              Flip to LabEngin for state modeling, simulation control, and test orchestration.
            </p>
          </div>

          {/* Quick action cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { emoji: '🧪', label: 'New Experiment',      href: '/lab/new',                        color: '#22c55e' },
              { emoji: '⚗️', label: 'My Projects',        href: '/lab',                            color: '#6366f1' },
              { emoji: '⚛️', label: 'Physics Lab',         href: '/physics-lab',                    color: '#f59e0b' },
              { emoji: '💻', label: 'Codespace',           href: '/codespace',                      color: '#8b5cf6' },
              { emoji: '📈', label: 'Optimizero',           href: '/daydream/lab/portfolio',         color: '#2a8ab8' },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.82)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: 16,
                  padding: '18px 16px',
                  border: `1px solid ${item.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                }}
                  onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                  onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                  onPointerLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  <span style={{ fontSize: 24 }}>{item.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Info about LabEngin */}
          <div style={{
            background: `rgba(34,197,94,0.06)`,
            borderRadius: 14,
            padding: '14px 16px',
            border: '1px solid rgba(34,197,94,0.15)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>LabEngin — Side B</div>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5, margin: 0 }}>
              Tap the ENGIN tab (bottom-right corner) to access LabEngin — the control layer for state modeling,
              system rules, simulation control, test orchestration, and iteration environments.
            </p>
          </div>
        </div>
      </div>
    </DaydreamShell>
  );
}
