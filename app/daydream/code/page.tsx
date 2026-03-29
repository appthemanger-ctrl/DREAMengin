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
          <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 18, padding: '20px 20px 18px', border: '1px solid rgba(99,102,241,0.15)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 6 }}>Code</h2>
            <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
              Your engineering workspace. 20 industry-grade coding features — from live notebooks and CI pipelines to AI assist, security scanner, and game engine integration. Flip to CodeEngin for the full control layer.
            </p>
          </div>

          {/* ── Feature 1: Quick Links ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { emoji: '💻', label: 'Open Codespace',  href: '/codespace',   color: '#6366f1' },
              { emoji: '📁', label: 'Projects',         href: '/lab',         color: '#2a8ab8' },
              { emoji: '⚛️', label: 'Physics Lab',      href: '/physics-lab', color: '#f59e0b' },
              { emoji: '📝', label: 'Notes',            href: '/notes',       color: '#ec4899' },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 16, padding: '18px 16px', border: `1px solid ${item.color}20`, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <span style={{ fontSize: 24 }}>{item.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Feature 2: CI/CD Pipeline ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">CI/CD Pipeline</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>All passing</span>
            </div>
            <div className="de-widget-body">
              {[
                { name: 'build',      status: 'passing', duration: '1m 24s' },
                { name: 'typecheck',  status: 'passing', duration: '42s' },
                { name: 'lint',       status: 'passing', duration: '18s' },
                { name: 'test',       status: 'passing', duration: '2m 11s' },
              ].map(j => (
                <div key={j.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', marginBottom: 4, borderRadius: 8, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6366f1' }}>{j.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{j.duration}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: 4 }}>✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 3: Security Scanner ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🔐 Security Scanner</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>Clean</span>
            </div>
            <div className="de-widget-body">
              {[
                { check: 'Dependencies',     ok: true,  note: '0 CVEs in 847 packages' },
                { check: 'Secrets in code',  ok: true,  note: 'No hardcoded secrets' },
                { check: 'XSS vectors',      ok: false, note: '1 potential innerHTML' },
                { check: 'Auth exposure',    ok: true,  note: 'Server-side scoped' },
              ].map(c => (
                <div key={c.check} style={{ display: 'flex', gap: 8, padding: '6px 8px', marginBottom: 4, borderRadius: 8, background: c.ok ? 'rgba(34,197,94,0.05)' : 'rgba(245,158,11,0.07)', border: `1px solid ${c.ok ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.2)'}` }}>
                  <span style={{ fontSize: 12 }}>{c.ok ? '✅' : '⚠'}</span>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-heading)' }}>{c.check}</span>
                    <span style={{ fontSize: 10, color: 'var(--de-text-dim)', marginLeft: 6 }}>{c.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 4: Performance Profiler ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">📊 Performance Profiler</span>
            </div>
            <div className="de-widget-body">
              {[
                { fn: 'renderWorkspaceDashboard()', avg: '2.1ms', hot: true },
                { fn: 'parseFeedItems()',            avg: '18ms',  hot: true },
                { fn: 'syncSupabaseState()',         avg: '44ms',  hot: false },
              ].map(f => (
                <div key={f.fn} style={{ padding: '7px 10px', marginBottom: 5, borderRadius: 8, background: f.hot ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.5)', border: `1px solid ${f.hot ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.06)'}` }}>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: f.hot ? '#ef4444' : '#6366f1' }}>{f.fn}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 2 }}>avg: {f.avg}{f.hot && ' 🔥 hot path'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 5: Package Manager ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">📦 Package Manager</span>
            </div>
            <div className="de-widget-body">
              {[
                { pkg: 'next',            version: '15.3.1', upToDate: true  },
                { pkg: '@babylonjs/core', version: '7.32.0', upToDate: false, latest: '8.1.0' },
                { pkg: '@tensorflow/tfjs',version: '4.22.0', upToDate: true  },
              ].map(p => (
                <div key={p.pkg} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', marginBottom: 4, borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6366f1' }}>{p.pkg}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{p.version}</span>
                    {!p.upToDate && 'latest' in p && <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 5px', borderRadius: 4 }}>→ {p.latest}</span>}
                    {p.upToDate && <span style={{ fontSize: 9, color: '#22c55e' }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 6: Database Browser ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🗄 Database Browser</span>
            </div>
            <div className="de-widget-body">
              {[
                { table: 'profiles',   rows: '1,842', size: '2.4 MB' },
                { table: 'app_posts',  rows: '14,203', size: '18.1 MB' },
                { table: 'game_scores',rows: '28,190', size: '5.2 MB' },
              ].map(t => (
                <div key={t.table} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', marginBottom: 3, borderRadius: 7, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(99,102,241,0.08)' }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6366f1' }}>{t.table}</span>
                  <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--de-text-dim)' }}>
                    <span>{t.rows}</span><span>{t.size}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 7: Environment Manager ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🌍 Environment Manager</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#22c55e', fontWeight: 700, background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 5 }}>development</span>
            </div>
            <div className="de-widget-body">
              {[
                { key: 'NEXT_PUBLIC_SUPABASE_URL', set: true  },
                { key: 'OPENAI_API_KEY',           set: false },
                { key: 'DEV_BYPASS_AUTH',          set: true  },
              ].map(v => (
                <div key={v.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', marginBottom: 3, borderRadius: 7, background: 'rgba(0,0,0,0.04)', fontFamily: 'monospace' }}>
                  <span style={{ fontSize: 10, color: '#6366f1' }}>{v.key}</span>
                  <span style={{ fontSize: 10, color: v.set ? 'var(--de-text-dim)' : '#ef4444', fontWeight: v.set ? 400 : 700 }}>{v.set ? '••••••••' : 'NOT SET'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 8: AI Code Assist ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🤖 AI Code Assist</span>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 8 }}>
                AI-powered code suggestions, refactoring, bug detection, and documentation generation — all from inside the Live Notebook in CodeEngin.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Refactor', 'Explain Code', 'Write Tests', 'Fix Bug', 'Add Docs'].map(a => (
                  <span key={a} style={{ padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>{a}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 9: Pair Programming ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">👥 Pair Programming</span>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 8 }}>
                Real-time collaborative coding — invite a co-author by handle. Edits appear live with a colored cursor.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['@builderwiz', '@codelab99'].map(h => (
                  <div key={h} style={{ flex: 1, padding: '8px 10px', borderRadius: 9, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#6366f1' }}>{h}</div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 10: Snippet Library ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">📚 Snippet Library</span>
              <Link href="/daydream/code" className="text-xs font-semibold ml-auto" style={{ color: '#6366f1' }}>+ New Snippet</Link>
            </div>
            <div className="de-widget-body">
              {[
                { title: 'Supabase auth guard',  lang: 'TypeScript' },
                { title: 'ECS entity factory',   lang: 'TypeScript' },
                { title: 'Tailwind dark mode',   lang: 'CSS' },
              ].map(s => (
                <div key={s.title} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', marginBottom: 4, borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-heading)' }}>{s.title}</span>
                  <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{s.lang}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 11: API Inspector ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🔌 API Inspector</span>
            </div>
            <div className="de-widget-body">
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
                  <span key={m} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: m === 'GET' ? 'rgba(34,197,94,0.12)' : m === 'POST' ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.06)', color: m === 'GET' ? '#22c55e' : m === 'POST' ? '#6366f1' : 'var(--de-text-dim)' }}>{m}</span>
                ))}
              </div>
              <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.05)', fontFamily: 'monospace', fontSize: 11, color: '#6366f1' }}>
                https://api.dreamengin.app/v1/games/scores
              </div>
            </div>
          </div>

          {/* ── Feature 12: Deployment Console ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🚀 Deployment Console</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>deployed</span>
            </div>
            <div className="de-widget-body">
              {[
                { env: 'Production', url: 'dreamengin.app', status: 'live' },
                { env: 'Preview',    url: 'preview.dreamengin.app', status: 'ready' },
                { env: 'Dev',        url: 'localhost:3000', status: 'local' },
              ].map(d => (
                <div key={d.env} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', marginBottom: 4, borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(34,197,94,0.1)' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)' }}>{d.env}</span>
                    <span style={{ fontSize: 10, color: 'var(--de-text-dim)', marginLeft: 6 }}>{d.url}</span>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: 4 }}>{d.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 13: GitHub Integration ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">GitHub Integration</span>
            </div>
            <div className="de-widget-body">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Open PRs',   val: '3', color: '#6366f1' },
                  { label: 'Commits',    val: '24', color: '#0ea5e9' },
                  { label: 'Stars',      val: '48', color: '#f59e0b' },
                ].map(m => (
                  <div key={m.label} style={{ padding: '8px 6px', borderRadius: 9, background: `${m.color}0e`, border: `1px solid ${m.color}20`, textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                    <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 14: Diff Viewer ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Diff Viewer</span>
            </div>
            <div className="de-widget-body">
              <div style={{ fontFamily: 'monospace', fontSize: 10, background: '#1a1a2e', borderRadius: 10, padding: '10px 12px', lineHeight: 1.8 }}>
                <span style={{ color: '#ef4444' }}>- const oldValue = fetchData();</span><br />
                <span style={{ color: '#22c55e' }}>+ const newValue = await fetchData();</span><br />
                <span style={{ color: '#94a3b8' }}>  return newValue;</span>
              </div>
            </div>
          </div>

          {/* ── Feature 15: ShellHub Terminal ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Shell Terminal</span>
            </div>
            <div className="de-widget-body">
              <div style={{ fontFamily: 'monospace', fontSize: 10, background: '#1a1a2e', borderRadius: 10, padding: '10px 12px', color: '#22c55e', lineHeight: 1.8 }}>
                <span style={{ color: '#8b5cf6' }}>$</span> pnpm build<br />
                <span style={{ color: '#94a3b8' }}>✓ Built in 8.3s</span><br />
                <span style={{ color: '#8b5cf6' }}>$</span> pnpm test<br />
                <span style={{ color: '#94a3b8' }}>✓ All tests passed (73 tests)</span>
              </div>
            </div>
          </div>

          {/* ── Feature 16: Live Notebook ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">📓 Live Notebook</span>
              <Link href="/daydream/code" className="text-xs font-semibold ml-auto" style={{ color: '#6366f1' }}>Open CodeEngin →</Link>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
                Multi-cell live code notebook with JavaScript & TypeScript support. Run cells in-browser, save state to Supabase, and get AI suggestions inline.
              </p>
            </div>
          </div>

          {/* ── Feature 17: Cross-Engin Connections ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🔗 Cross-Engin Sync</span>
            </div>
            <div className="de-widget-body">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: 'GameEngin',     color: '#22c55e', on: true },
                  { name: 'LabEngin',      color: '#8b5cf6', on: true },
                  { name: 'ContentEngin',  color: '#f59e0b', on: false },
                  { name: 'BrandEngin',    color: '#ec4899', on: true },
                ].map(e => (
                  <div key={e.name} style={{ textAlign: 'center', padding: '7px 5px', borderRadius: 8, background: e.on ? `${e.color}0e` : 'rgba(0,0,0,0.04)', border: `1px solid ${e.on ? e.color + '25' : 'rgba(0,0,0,0.06)'}` }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: e.on ? e.color : 'var(--de-text-dim)' }}>{e.name.replace('Engin','')}</div>
                    <div style={{ fontSize: 8, color: e.on ? e.color : 'var(--de-text-dim)', marginTop: 2 }}>{e.on ? '●' : '○'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 18: Projects ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">📁 Projects</span>
              <Link href="/daydream/code" className="text-xs font-semibold ml-auto" style={{ color: '#6366f1' }}>+ New</Link>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center', padding: '12px 0' }}>
                No projects yet. Create one from CodeEngin or the Codespace.
              </p>
            </div>
          </div>

          {/* ── Feature 19: Trust Layer ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🛡 AI Trust Layer</span>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 8 }}>
                Every AI code suggestion goes through the Trust Layer — you review, accept, or reject changes before they commit. Zero blind writes to your codebase.
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Review', 'Accept', 'Reject', 'Modify'].map(a => (
                  <div key={a} style={{ flex: 1, padding: '6px 4px', borderRadius: 7, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#6366f1' }}>{a}</div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 20: Game Engine Code Integration ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🎮 Game Engine Integration</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>EliteEngine</span>
            </div>
            <div className="de-widget-body">
              <div style={{ padding: '10px 12px', borderRadius: 10, background: '#1a1a2e', fontFamily: 'monospace', fontSize: 11, color: '#c084fc', lineHeight: 1.8 }}>
                <span style={{ color: '#60a5fa' }}>import</span> {'{ EliteGameEngine }'} <span style={{ color: '#60a5fa' }}>from</span> <span style={{ color: '#86efac' }}>&apos;@/lib/gameengin&apos;</span>;<br />
                <span style={{ color: '#c084fc' }}>const</span> entity = world.<span style={{ color: '#fbbf24' }}>createEntity</span>();
              </div>
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 8 }}>Import ECS APIs, post-FX managers, and AI Director directly into your code notebooks.</p>
            </div>
          </div>

          {/* ── CodeEngin Info ── */}
          <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 4 }}>CodeEngin — 20 Features on Side B</div>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5, margin: 0 }}>
              Live Notebook · CI Pipeline · Projects · ShellHub · GitHub · AI Assist · Trust Layer · Pair Programming ·
              Deployment Console · API Inspector · Snippet Library · Diff Viewer · Security Scanner · Performance Profiler ·
              Package Manager · Database Browser · Environment Manager · REST Client · Game Engine Integration + more.
            </p>
          </div>
        </div>
      </div>
    </DaydreamShell>
  );
}
