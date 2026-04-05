import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FlaskConical } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import LabEngin from '@/components/daydream/LabEngin';
import LabDreamIDE from '@/components/daydream/LabDreamIDE';
import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader';
import { connection } from 'next/server';

export const metadata = { title: 'Lab Daydream – Dreamengin', description: 'Experiments, prototypes, simulations, and models.' };

const WIDGETS: DaydreamWidget[] = [
  { id: 'new-experiment', emoji: '🧪', label: 'New Experiment', desc: 'Start a new lab experiment',     color: '#22c55e', href: '/lab/new'       },
  { id: 'projects',       emoji: '🔬', label: 'My Projects',    desc: 'Browse your lab projects',       color: '#6366f1', href: '/lab'           },
  { id: 'prototype',      emoji: '⚗️', label: 'Prototype',       desc: 'Build and test a prototype',    color: '#2a8ab8', href: '/lab/new'       },
  { id: 'simulation',     emoji: '🌊', label: 'Simulations',     desc: 'Run and view simulations',      color: '#0ea5e9', href: '/lab'           },
  { id: 'physics',        emoji: '⚛️', label: 'Physics Lab',     desc: '3D physics environment',        color: '#f59e0b', href: '/physics-lab'   },
  { id: 'codespace',      emoji: '💻', label: 'Codespace',       desc: 'Open the code editor',          color: '#8b5cf6', href: '/codespace'     },
  { id: 'notes',          emoji: '📝', label: 'Lab Notes',       desc: 'Document your findings',        color: '#ec4899', href: '/notes'         },
  { id: 'share',          emoji: '🔗', label: 'Share Results',   desc: 'Post an experiment update',     color: '#c8981a', href: '/daydream/create'        },
];

export default async function LabDaydreamPage() {
  await connection();
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
        <AuthenticatedPageHeader
          backHref="/homedream"
          title="Lab"
          subtitle="Experiments, prototypes, simulations, and model flow with less friction."
          icon={<FlaskConical className="w-4 h-4" />}
          accentColor="#22c55e"
          badge="Daydream"
        />

        <div className="de-auth-content space-y-4">
          {/* Intro */}
          <div className="de-auth-hero">
            <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 6 }}>Lab Dream</h2>
            <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
              Your scientific IDE. Write Python, JavaScript, or Bash on the left — see results stream on the right. Route code into any simulation engine (Particle, Fluid, Quantum, Neural) and watch three live visualizations update in real time.
              Flip to LabEngin (Side B) for the full research and engineering control layer.
            </p>
            </div>
          </div>

          {/* ── Lab Dream Split IDE ── */}
          <LabDreamIDE />

          {/* ── Feature 1: Quick Action Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { emoji: '🧪', label: 'New Experiment', href: '/lab/new',      color: '#22c55e' },
              { emoji: '⚗️', label: 'My Projects',    href: '/lab',          color: '#6366f1' },
              { emoji: '⚛️', label: 'Physics Lab',    href: '/physics-lab',  color: '#f59e0b' },
              { emoji: '💻', label: 'Codespace',      href: '/codespace',    color: '#8b5cf6' },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 16, padding: '18px 16px', border: `1px solid ${item.color}20`, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <span style={{ fontSize: 24 }}>{item.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Feature 2: Simulation Status ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span style={{ fontSize: 16 }}>⚡</span>
              <span className="de-widget-title ml-2">Simulation Status</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#22c55e', fontWeight: 700, background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 5 }}>Ready</span>
            </div>
            <div className="de-widget-body">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: 'Particle', emoji: '⚛️', color: '#22c55e' },
                  { name: 'Fluid',    emoji: '🌊', color: '#0ea5e9' },
                  { name: 'Quantum',  emoji: '🔬', color: '#8b5cf6' },
                  { name: 'Neural',   emoji: '🧠', color: '#ec4899' },
                ].map(s => (
                  <div key={s.name} style={{ padding: '8px 6px', borderRadius: 9, background: `${s.color}0e`, border: `1px solid ${s.color}25`, textAlign: 'center' }}>
                    <div style={{ fontSize: 18 }}>{s.emoji}</div>
                    <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 3 }}>{s.name}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="de-widget-actions">
              <Link href="/daydream/lab" className="de-btn de-btn-primary text-xs">Open LabEngin</Link>
            </div>
          </div>

          {/* ── Feature 3: Active Experiments ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🧪 Active Experiments</span>
              <Link href="/lab/new" className="de-btn de-btn-ghost text-xs ml-auto">+ New</Link>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center', padding: '12px 0' }}>
                No active experiments. Start one via <strong>New Experiment</strong> above.
              </p>
            </div>
          </div>

          {/* ── Feature 4: Resource Monitor ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Resource Monitor</span>
            </div>
            <div className="de-widget-body">
              {[
                { label: 'CPU', pct: 38, color: '#6366f1' },
                { label: 'GPU', pct: 62, color: '#8b5cf6' },
                { label: 'Memory', pct: 54, color: '#0ea5e9' },
              ].map(r => (
                <div key={r.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: 'var(--de-text-dim)', fontWeight: 600 }}>{r.label}</span>
                    <span style={{ color: 'var(--de-heading)', fontWeight: 700 }}>{r.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: r.color, width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 5: WebGPU Monitor ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">⚡ WebGPU Compute</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>FREE</span>
            </div>
            <div className="de-widget-body">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Shaders', val: '12', color: '#8b5cf6' },
                  { label: 'Passes',  val: '4',  color: '#0ea5e9' },
                  { label: 'FPS',     val: '60', color: '#22c55e' },
                ].map(m => (
                  <div key={m.label} style={{ padding: '8px 6px', borderRadius: 9, background: `${m.color}0e`, border: `1px solid ${m.color}25`, textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                    <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 6: Benchmark Suite ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Benchmark Suite</span>
            </div>
            <div className="de-widget-body">
              {[
                { name: 'Fibonacci 40',        score: '12ms', tier: 'Excellent' },
                { name: 'Matrix Multiply 512', score: '84ms', tier: 'Good' },
                { name: 'WebGL Render 1K',     score: '16ms', tier: 'Excellent' },
              ].map(b => (
                <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', marginBottom: 5, borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(34,197,94,0.12)' }}>
                  <span style={{ fontSize: 11, color: 'var(--de-heading)', fontWeight: 600 }}>{b.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{b.score}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: b.tier === 'Excellent' ? '#22c55e' : '#f59e0b', background: b.tier === 'Excellent' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4 }}>{b.tier}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 7: Feature Flags ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🏁 Feature Flags</span>
            </div>
            <div className="de-widget-body">
              {[
                { label: 'WebGPU Dynamic Shadows', on: true },
                { label: 'TF.js Telemetry',        on: true },
                { label: 'Multiplayer Beta',        on: false },
                { label: 'Quantum Simulator',       on: true },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', marginBottom: 4, borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: `1px solid ${f.on ? 'rgba(34,197,94,0.18)' : 'rgba(0,0,0,0.06)'}` }}>
                  <span style={{ fontSize: 11, color: 'var(--de-heading)', fontWeight: 600 }}>{f.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: f.on ? '#22c55e' : 'var(--de-text-dim)', background: f.on ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 5 }}>{f.on ? 'ON' : 'OFF'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 8: Hypothesis Tracker ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🔬 Hypothesis Tracker</span>
            </div>
            <div className="de-widget-body">
              {[
                { h: 'WebGPU outperforms JS by 10×', outcome: 'Confirmed', color: '#22c55e' },
                { h: 'Batch size 64 improves convergence', outcome: 'In Progress', color: '#f59e0b' },
                { h: 'Fluid viscosity >0.8 causes instability', outcome: 'Refuted', color: '#ef4444' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '7px 10px', marginBottom: 5, borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: `1px solid ${r.color}18` }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: r.color, marginBottom: 3 }}>{r.outcome}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-heading)' }}>{r.h}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 9: Neural Network Visualizer ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🧠 Neural Network</span>
            </div>
            <div className="de-widget-body">
              <div style={{ fontFamily: 'monospace', fontSize: 10, lineHeight: 1.8, color: 'var(--de-heading)', background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                <span style={{ color: '#8b5cf6' }}>Input</span>     [784] ──▶<br />
                <span style={{ color: '#6366f1' }}>Dense</span>    [128] ReLU ──▶<br />
                <span style={{ color: '#0ea5e9' }}>Dense</span>     [64] ReLU ──▶<br />
                <span style={{ color: '#22c55e' }}>Output</span>    [10] Softmax ──▶ 🎯
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[{ l: 'Params', v: '109K' }, { l: 'Accuracy', v: '97%' }, { l: 'Loss', v: '0.04' }].map(m => (
                  <div key={m.l} style={{ textAlign: 'center', padding: '5px', borderRadius: 8, background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#8b5cf6' }}>{m.v}</div>
                    <div style={{ fontSize: 9, color: 'var(--de-text-dim)' }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 10: Dataset Browser ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">📂 Dataset Browser</span>
            </div>
            <div className="de-widget-body">
              {[
                { name: 'user_engagement.csv', rows: '14,203', size: '2.1 MB' },
                { name: 'game_scores.json',    rows: '28,190', size: '5.2 MB' },
                { name: 'physics_results.csv', rows: '4,820',  size: '0.8 MB' },
              ].map(d => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', marginBottom: 4, borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(34,197,94,0.12)' }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#22c55e' }}>{d.name}</span>
                  <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--de-text-dim)' }}>
                    <span>{d.rows}</span><span>{d.size}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 11: Parameter Sweep ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🔢 Parameter Sweep</span>
            </div>
            <div className="de-widget-body">
              {[
                { param: 'Gravity (m/s²)',  range: '1.6–24.8', best: '9.8', pct: 40 },
                { param: 'Learning rate',   range: '0.001–0.1', best: '0.01', pct: 9  },
              ].map(p => (
                <div key={p.param} style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(34,197,94,0.12)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-heading)' }}>{p.param}</span>
                    <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>Best: {p.best}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(34,197,94,0.1)' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: '#22c55e', width: `${p.pct}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 3 }}>Range: {p.range}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 12: Version Control ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Experiment Versions</span>
            </div>
            <div className="de-widget-body">
              {[
                { v: 'v0.4.0', label: 'Neural pattern sim added', current: true },
                { v: 'v0.3.2', label: 'Fluid boundary fix', current: false },
                { v: 'v0.3.0', label: 'Quantum gates', current: false },
              ].map(ver => (
                <div key={ver.v} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', marginBottom: 4, borderRadius: 8, background: ver.current ? 'rgba(42,138,184,0.07)' : 'rgba(255,255,255,0.5)', border: `1px solid ${ver.current ? 'rgba(42,138,184,0.25)' : 'rgba(0,0,0,0.05)'}` }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#2a8ab8', flexShrink: 0 }}>{ver.v}</span>
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--de-heading)' }}>{ver.label}</span>
                  {ver.current && <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 700 }}>● current</span>}
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 13: Collab Lab ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">👥 Collab Lab</span>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
                Invite collaborators to your lab workspace. Share experiments, datasets, and simulation results in real-time.
              </p>
              <Link href="/daydream/lab" className="de-btn de-btn-primary text-xs w-full" style={{ display: 'block', textAlign: 'center' }}>
                Manage Collaborators →
              </Link>
            </div>
          </div>

          {/* ── Feature 14: Quantum Circuit ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">⚛️ Quantum Circuit</span>
            </div>
            <div className="de-widget-body">
              <div style={{ fontFamily: 'monospace', fontSize: 11, background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: '10px 12px', lineHeight: 2 }}>
                <span style={{ color: '#8b5cf6' }}>q[0]</span>: ─H──●────── |+⟩<br />
                <span style={{ color: '#6366f1' }}>q[1]</span>: ────X──●──── |00⟩<br />
                <span style={{ color: '#22c55e' }}>q[2]</span>: ──────X──M── |?⟩
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[{ l: 'Fidelity', v: '0.94' }, { l: 'Depth', v: '12' }, { l: 'Qubits', v: '8' }, { l: 'Gates', v: '6' }].map(m => (
                  <div key={m.l} style={{ textAlign: 'center', padding: '5px', borderRadius: 8, background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#8b5cf6' }}>{m.v}</div>
                    <div style={{ fontSize: 8, color: 'var(--de-text-dim)' }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature 15: CI/CD Status ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">CI/CD Status</span>
            </div>
            <div className="de-widget-body">
              {[
                { name: 'run-sims.yml',        status: 'passing' },
                { name: 'benchmark-suite.yml', status: 'passing' },
                { name: 'neural-train.yml',    status: 'running' },
              ].map(w => (
                <div key={w.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', marginBottom: 4, borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6366f1' }}>{w.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: w.status === 'passing' ? '#22c55e' : '#f59e0b', background: w.status === 'passing' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4 }}>{w.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature 16: Physics Lab Direct Link ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🌊 Physics Lab</span>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
                Full 3D physics environment with Babylon.js and Havok physics. Gravity, friction, collisions, and fluid dynamics — all configurable.
              </p>
            </div>
            <div className="de-widget-actions">
              <Link href="/physics-lab" className="de-btn de-btn-primary text-xs">Open Physics Lab</Link>
            </div>
          </div>

          {/* ── Feature 17: Published Results ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">📊 Published Results</span>
              <Link href="/daydream/create" style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#22c55e', textDecoration: 'none' }}>Share →</Link>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center', padding: '12px 0' }}>
                No results published yet. Publish from LabEngin after running simulations.
              </p>
            </div>
          </div>

          {/* ── Feature 18: AI Hypothesis Generator ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🤖 AI Hypothesis Generator</span>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
                Describe your experiment and get AI-generated hypotheses, control variables, and success metrics.
              </p>
              <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)', fontSize: 11, color: 'var(--de-heading)', lineHeight: 1.6 }}>
                Example: &ldquo;Testing whether WebGPU compute shaders reduce particle simulation time by more than 8×.&rdquo;
              </div>
            </div>
          </div>

          {/* ── Feature 19: Molecule Viewer ── */}
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">🔬 Molecule Viewer</span>
            </div>
            <div className="de-widget-body">
              <div style={{ fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: '12px 0', color: '#22c55e', lineHeight: 1.8 }}>
                {'    O   '}<br />
                {'   / \\  '}<br />
                {'  H   H  '}<br />
                {'H₂O — Water'}
              </div>
              <p style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 6, textAlign: 'center' }}>
                3D molecular visualization available in LabEngin with PDB file import.
              </p>
            </div>
          </div>

          {/* ── Feature 20: LabEngin Info ── */}
          <div style={{ background: 'rgba(34,197,94,0.06)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>LabEngin — 20 Features on Side B</div>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5, margin: 0 }}>
              Simulation runner · Data viz · WebGPU monitor · Benchmark suite · Hypothesis tracker · Feature flags ·
              Neural visualizer · Resource monitor · CI/CD · Quantum circuit · Version control · Dataset browser ·
              Parameter sweep · Collab Lab · AI hypothesis gen · Molecule viewer · Cross-engin sync · Published results + more.
            </p>
          </div>
        </div>
      </div>
    </DaydreamShell>
  );
}
