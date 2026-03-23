import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Code2 } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import CodeEngin from '@/components/daydream/CodeEngin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Code Daydream – Dreamengin', description: 'Code projects, snippets, files, and deployments.' };

const WIDGETS: DaydreamWidget[] = [
  { id: 'codespace',   emoji: '💻', label: 'Codespace',      desc: 'Open the code editor',          color: '#6366f1', href: '/codespace'   },
  { id: 'projects',    emoji: '📁', label: 'Projects',        desc: 'Browse your code projects',     color: '#2a8ab8', href: '/lab'         },
  { id: 'snippets',    emoji: '✂️', label: 'Snippets',        desc: 'Quick code snippets',           color: '#22c55e', href: '/codespace'   },
  { id: 'lab',         emoji: '🔬', label: 'Lab',             desc: 'Experiments and prototypes',    color: '#f59e0b', href: '/daydream/lab' },
  { id: 'notes',       emoji: '📝', label: 'Code Notes',      desc: 'Document and annotate',         color: '#ec4899', href: '/notes'       },
  { id: 'physics-lab', emoji: '⚛️', label: 'Physics Lab',     desc: '3D runtime environment',        color: '#0ea5e9', href: '/physics-lab' },
  { id: 'share',       emoji: '🔗', label: 'Share Project',   desc: 'Post a project update',         color: '#c8981a', href: '/daydream/create'      },
  { id: 'connectors',  emoji: '🔌', label: 'Connectors',      desc: 'Link GitHub, GitLab, and more', color: '#8b5cf6', href: '/connectors'  },
];

export default async function CodeDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Code"
      enginName="CodeEngin"
      accentColor="#6366f1"
      daydreamType="code"
      widgets={WIDGETS}
      sideBComponent={CodeEngin}
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
                <Code2 className="w-4 h-4" style={{ color: '#6366f1' }} />
                <h1 className="text-base font-bold" style={{ color: 'var(--de-heading)' }}>Code</h1>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>Daydream</span>
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
            border: '1px solid rgba(99,102,241,0.15)',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 6 }}>Code</h2>
            <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
              Your coding workspace. Access projects, write snippets, group files, and develop code.
              Flip to CodeEngin for project engine behavior, deployment pathways, build and execution workflows.
            </p>
          </div>

          {/* Quick action cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { emoji: '💻', label: 'Open Codespace', href: '/codespace',  color: '#6366f1' },
              { emoji: '📁', label: 'Projects',        href: '/lab',        color: '#2a8ab8' },
              { emoji: '⚛️', label: 'Physics Lab',     href: '/physics-lab', color: '#f59e0b' },
              { emoji: '📝', label: 'Notes',           href: '/notes',      color: '#ec4899' },
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

          {/* Info about CodeEngin */}
          <div style={{
            background: `rgba(99,102,241,0.06)`,
            borderRadius: 14,
            padding: '14px 16px',
            border: '1px solid rgba(99,102,241,0.15)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 4 }}>CodeEngin — Side B</div>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5, margin: 0 }}>
              Tap the ENGIN tab (bottom-right corner) to access CodeEngin — the control layer for code organization,
              runtime logic, deployment pathways, build and execution workflows, and engineering tools.
            </p>
          </div>
        </div>
      </div>
    </DaydreamShell>
  );
}
