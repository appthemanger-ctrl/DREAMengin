import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Code2, FileCode, Eye, GitBranch, Terminal, Layers } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Code · Preview – DREAMengin',
  description: 'Code snippet manager, syntax viewer, and live preview zone.',
};

const WIDGETS: DaydreamWidget[] = [
  { id: 'preview',   emoji: '👁️', label: 'Preview Side →',  desc: 'Live output + GitHub push',      color: '#6366f1', href: '/daydream/code' },
  { id: 'snippets',  emoji: '📋', label: 'Snippets',         desc: 'Your saved code snippets',       color: '#6366f1', href: '/daydream/code' },
  { id: 'terminal',  emoji: '💻', label: 'Terminal',         desc: 'Quick command reference',        color: '#0ea5e9', href: '/daydream/code' },
  { id: 'github',    emoji: '🐙', label: 'GitHub',           desc: 'Push & pull (OAuth coming soon)', color: '#c8981a', href: '/connectors' },
  { id: 'layers',    emoji: '🗂️', label: 'Projects',         desc: 'Your code projects',             color: '#10b981', href: '/daydream/code' },
  { id: 'share',     emoji: '🔗', label: 'Share Snippet',    desc: 'Post a snippet to feed',         color: '#ec4899', href: '/create' },
];

export default async function CodeDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell title="Code" accentColor="#6366f1" widgets={WIDGETS}>
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
            <Code2 className="w-5 h-5" style={{ color: '#6366f1' }} />
            <div>
              <h1 className="text-base font-bold leading-none" style={{ color: 'var(--de-heading)' }}>Code</h1>
              <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Snippets · Notes · Dev Tools</p>
            </div>
            <span
              className="ml-auto text-xs px-2 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)', minHeight: 28, display: 'flex', alignItems: 'center' }}
            >
              Side A
            </span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-5 pb-28 space-y-4">

          {/* Snippet manager */}
          <div className="de-widget">
            <div className="de-widget-header">
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCode className="w-4 h-4" style={{ color: '#6366f1' }} />
                </div>
                <span className="de-widget-title">Snippet Manager</span>
              </div>
            </div>
            <div className="de-widget-body space-y-3">
              {[
                { label: 'Supabase RLS Policy', lang: 'SQL', lines: 8,  color: '#0ea5e9', code: 'CREATE POLICY "users_own_rows" ON profiles\n  USING (auth.uid() = id);' },
                { label: 'τ Nav Dispatch',       lang: 'TS',  lines: 5,  color: '#6366f1', code: 'const path = findTauPath(node, target);\nawait dispatchTauPath(dispatch, path);' },
                { label: 'Render on Demand',     lang: 'TS',  lines: 6,  color: '#10b981', code: 'engine.runRenderLoop(() => {\n  if (isDirty) scene.render();\n});' },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: 'rgba(10,18,36,0.92)',
                    border: `1px solid ${s.color}30`,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${s.color}20` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</span>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: `${s.color}18`, color: s.color, fontWeight: 700 }}>{s.lang}</span>
                  </div>
                  <pre style={{ padding: '10px 12px', margin: 0, fontSize: 12, color: '#7dd3fc', fontFamily: 'monospace', lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre' }}>
                    {s.code}
                  </pre>
                </div>
              ))}
            </div>
            <div className="de-widget-actions">
              <button type="button" className="de-btn de-btn-primary text-xs" style={{ minHeight: 44 }}>+ New Snippet</button>
              <button type="button" className="de-btn de-btn-ghost text-xs" style={{ minHeight: 44 }}>Browse All</button>
            </div>
          </div>

          {/* Quick notes for devs */}
          <div className="de-widget">
            <div className="de-widget-header">
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(14,165,233,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Terminal className="w-4 h-4" style={{ color: '#0ea5e9' }} />
                </div>
                <span className="de-widget-title">Dev Notes</span>
              </div>
            </div>
            <div className="de-widget-body">
              <textarea
                placeholder="Write a dev note, command, or reminder…"
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(10,18,36,0.88)',
                  border: '1.5px solid rgba(99,102,241,0.25)',
                  borderRadius: 12,
                  padding: '14px 14px',
                  fontSize: 14,
                  color: '#a5b4fc',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.6,
                  fontFamily: 'monospace',
                }}
              />
            </div>
            <div className="de-widget-actions">
              <button type="button" className="de-btn de-btn-ghost text-xs" style={{ minHeight: 44 }}>Save Note</button>
            </div>
          </div>

          {/* Projects list */}
          <div className="de-widget">
            <div className="de-widget-header">
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers className="w-4 h-4" style={{ color: '#10b981' }} />
                </div>
                <span className="de-widget-title">Projects</span>
              </div>
            </div>
            <div className="de-widget-body flex flex-col items-center py-5 gap-3">
              <GitBranch className="w-7 h-7 opacity-20" style={{ color: '#6366f1' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>No projects yet</p>
              <p className="text-xs text-center" style={{ color: 'var(--de-text-dim)' }}>Add a project to track your repos, tasks, and code files here.</p>
            </div>
            <div className="de-widget-actions">
              <button type="button" className="de-btn de-btn-ghost text-xs" style={{ minHeight: 44 }}>+ New Project</button>
            </div>
          </div>

          {/* Preview banner — points to Side B */}
          <div
            className="de-widget"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(14,165,233,0.06))', borderColor: 'rgba(99,102,241,0.25)' }}
          >
            <div className="de-widget-header" style={{ borderBottomColor: 'rgba(99,102,241,0.2)' }}>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" style={{ color: '#6366f1' }} />
                <span className="de-widget-title">Preview Zone</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' }}>Side B</span>
            </div>
            <div className="de-widget-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👁️</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 4 }}>Live Preview · Output Display</div>
                  <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>Render your snippets, view output, and push to GitHub on Side B. Tap the corner tab to flip.</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {['Live Render', 'Output Log', 'GitHub Push*'].map((t) => (
                      <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>{t}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 6 }}>* GitHub OAuth coming soon</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DaydreamShell>
  );
}
