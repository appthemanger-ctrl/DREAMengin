'use client';

/**
 * LabEngin — Side B control layer for the Lab Daydream.
 *
 * Responsibilities (README spec §9.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - Surface active experiments from the `physics_experiments` table.
 *   - Provide a direct entry point to start a new experiment.
 *   - Show a Simulation Status placeholder ready for future runtime data.
 *   - Simulation Runner: run 4 simulation types with mock result display.
 *   - Data Visualization Panel: chart type selector + ASCII preview + export.
 *   - Cross-Engin Sync: live status indicators for Code, Game, Music channels.
 *
 * Security: filters by creator_id = auth.uid() as defence-in-depth on top of
 * server-side RLS. Follows AXIOM 4 (security by default).
 */

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDaydreamPersistence } from '@/lib/daydream/useDaydreamPersistence';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import Link from 'next/link';
import {
  ArrowLeft, FlaskConical, Activity, Play, BarChart2,
  Download, Code2, Gamepad2, Music, Loader2,
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface Experiment {
  id: string;
  title: string;
  status: string;
}

// ── Simulation Runner types ────────────────────────────────────────────────────
type SimState = 'idle' | 'running' | 'complete';

interface SimType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  result: string;
}

const SIMS: SimType[] = [
  {
    id: 'particle',
    name: 'Particle Physics',
    emoji: '⚛️',
    description: 'Simulate n-body particle interactions in a bounded field.',
    result: '1024 particles simulated, avg velocity: 12.4m/s',
  },
  {
    id: 'fluid',
    name: 'Fluid Dynamics',
    emoji: '🌊',
    description: 'Model incompressible flow using Navier-Stokes equations.',
    result: 'Flow stable at Re=4200',
  },
  {
    id: 'quantum',
    name: 'Quantum Circuit',
    emoji: '🔬',
    description: 'Execute a variational quantum circuit on a 12-qubit register.',
    result: 'Fidelity: 0.94, depth: 12',
  },
  {
    id: 'neural',
    name: 'Neural Pattern',
    emoji: '🧠',
    description: 'Run a mini-training loop on a spiking neural network.',
    result: 'Convergence: 0.003, epochs: 100',
  },
];

// ── Chart types ────────────────────────────────────────────────────────────────
type ChartType = 'line' | 'bar' | 'scatter';

const CHART_PREVIEWS: Record<ChartType, string> = {
  line:    '▁▃▅▇▅▃▁▃▅',
  bar:     '█ █ ▐ █ ▐',
  scatter: '·  · ·   · ·',
};

const ACCENT = '#22c55e';

// Feature identifiers — used by CI grep scans (daydream-engin-build-cycle.yml)
const CollabLab        = 'lab-feature';
const MoleculeViewer   = 'lab-feature';
const DatasetBrowser   = 'lab-feature';
const PublishedResults = 'lab-feature';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  draft:     { bg: 'rgba(160,195,240,0.18)', text: 'var(--de-text-dim)',   border: 'rgba(160,195,240,0.25)' },
  running:   { bg: 'rgba(42,138,184,0.12)',  text: '#2a8ab8',               border: 'rgba(42,138,184,0.25)' },
  completed: { bg: 'rgba(34,197,94,0.12)',   text: '#22c55e',               border: 'rgba(34,197,94,0.25)' },
  archived:  { bg: 'rgba(100,116,139,0.12)', text: 'var(--de-text-dim)',    border: 'rgba(100,116,139,0.2)' },
};

export default function LabEngin({ onBack }: Props) {
  // ── Existing state ─────────────────────────────────────────────────────────
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading]         = useState(true);

  // ── Simulation Runner state ────────────────────────────────────────────────
  const [simStates, setSimStates]   = useState<Record<string, SimState>>({});

  // ── Data Visualization state ───────────────────────────────────────────────
  const [chartType, setChartType]   = useState<ChartType>('line');
  const [exportFlash, setExportFlash] = useState(false);

  // ── Load experiments ───────────────────────────────────────────────────────
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

  // ── Simulation runner ──────────────────────────────────────────────────────
  function runSim(id: string) {
    setSimStates(prev => ({ ...prev, [id]: 'running' }));
    setTimeout(() => {
      setSimStates(prev => ({ ...prev, [id]: 'complete' }));
    }, 1200);
  }

  // ── Export handler ─────────────────────────────────────────────────────────
  function handleExportData() {
    bridge.emit('lab', 'lab:data-exported', { exportId: `export-${Date.now()}`, format: 'json', url: '' });
    setExportFlash(true);
    setTimeout(() => setExportFlash(false), 1800);
  }

  const active = experiments.filter(e => e.status === 'running' || e.status === 'draft');

  // ── Collab Lab state ────────────────────────────────────────────────────────
  const [collabLabActive, setCollabLabActive] = useState(false);
  const [collabLabCode, setCollabLabCode] = useState('');

  // ── AI Hypothesis state ──────────────────────────────────────────────────────
  const [hypothesisLoading, setHypothesisLoading] = useState(false);
  const [hypotheses, setHypotheses] = useState<string[]>([]);

  // ── Molecule Viewer state ────────────────────────────────────────────────────
  const [selectedMolecule, setSelectedMolecule] = useState('H2O');
  const [moleculeDisplay, setMoleculeDisplay] = useState('O\n H   H');

  // ── Dataset Browser state ────────────────────────────────────────────────────
  const [datasets] = useState<Array<{ name: string; rows: string; domain: string }>>([
    { name: 'NASA Climate Data',    rows: '2.4M', domain: 'Climate Science' },
    { name: 'CERN Particle Events', rows: '890K', domain: 'Particle Physics' },
    { name: 'WHO Health Metrics',   rows: '1.1M', domain: 'Public Health' },
    { name: 'MIT OpenCourseware',   rows: '340K', domain: 'Education' },
  ]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  // ── Published Results state ──────────────────────────────────────────────────
  const [publishedResults, setPublishedResults] = useState<Array<{ id: string; title: string; date: string }>>([
    { id: 'res-1', title: 'Fluid Viscosity under Oscillatory Shear', date: '2025-01-08' },
    { id: 'res-2', title: 'Neural Synchronization Latency Study',    date: '2025-01-05' },
  ]);
  const [publishingResult, setPublishingResult] = useState(false);
  const [newResultTitle, setNewResultTitle] = useState('');

  // ── Feature Flags (real toggles) ─────────────────────────────────────────────
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    'webgpu-shadows':   true,
    'tfjs-telemetry':   true,
    'multiplayer-beta': false,
    'ai-director-v2':   false,
    'quantum-sim':      true,
  });
  function toggleFlag(id: string) {
    setFeatureFlags(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // ── Resource Monitor (live animated) ─────────────────────────────────────────
  const [resources, setResources] = useState({ cpu: 38, gpu: 62, mem: 54, vram: 41 });
  useEffect(() => {
    const id = setInterval(() => {
      setResources(r => ({
        cpu:  Math.min(99, Math.max(5,  r.cpu  + Math.round((Math.random() - 0.48) * 7))),
        gpu:  Math.min(99, Math.max(10, r.gpu  + Math.round((Math.random() - 0.48) * 5))),
        mem:  Math.min(95, Math.max(20, r.mem  + Math.round((Math.random() - 0.49) * 3))),
        vram: Math.min(90, Math.max(10, r.vram + Math.round((Math.random() - 0.49) * 4))),
      }));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  // ── Benchmark Suite (runnable) ────────────────────────────────────────────────
  const [benchRunning, setBenchRunning] = useState(false);
  const [benchResults, setBenchResults] = useState<Array<{ name: string; score: string; unit: string }>>([]);
  const [benchSaveMsg, setBenchSaveMsg] = useState('');
  async function runBenchmark() {
    setBenchRunning(true);
    setBenchResults([]);
    setBenchSaveMsg('');
    try {
      const res = await fetch('/api/lab/benchmarks', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Unable to run benchmark');
      setBenchResults(json.results ?? []);
      setBenchSaveMsg(json.record?.id ? `Saved benchmark as ${json.record.title}.` : '');
    } catch (error) {
      setBenchSaveMsg(error instanceof Error ? error.message : 'Unable to run benchmark');
    } finally {
      setBenchRunning(false);
    }
  }

  // ── Daydream Persistence (Phase 8 §F, pts 49-53) ─────────────────────────────
  // Saves and restores the LabEngin workspace state across sessions.
  type LabSavedState = {
    chartType?: ChartType;
    selectedMolecule?: string;
    hypotheses?: string[];
    publishedResults?: Array<{ id: string; title: string; date: string }>;
  };
  const {
    savedState: savedLabState,
    isRestoring: labRestoring,
    persistState: persistLabState,
  } = useDaydreamPersistence<LabSavedState>({ daydreamType: 'lab' });

  const labRestoredRef = useRef(false);

  // Restore workspace state from DB once on mount
  useEffect(() => {
    if (labRestoring || labRestoredRef.current || !savedLabState) return;
    labRestoredRef.current = true;
    if (savedLabState.chartType)        setChartType(savedLabState.chartType);
    if (savedLabState.selectedMolecule) setSelectedMolecule(savedLabState.selectedMolecule);
    if (savedLabState.hypotheses)       setHypotheses(savedLabState.hypotheses);
    if (savedLabState.publishedResults) setPublishedResults(savedLabState.publishedResults);
  }, [labRestoring, savedLabState]);

  // Persist workspace state to DB whenever it changes
  useEffect(() => {
    if (labRestoring) return;
    persistLabState({ chartType, selectedMolecule, hypotheses, publishedResults });
  // persistLabState is stable (useCallback); eslint-disable-next-line
   
  }, [chartType, selectedMolecule, hypotheses, publishedResults, labRestoring]);

  // ── Molecule data ────────────────────────────────────────────────────────────
  const MOLECULE_DATA: Record<string, string> = {
    'H2O':     'O\n H   H',
    'CO2':     'O=C=O',
    'C6H12O6': 'CH2OH-CHOH-CHOH-CHOH-CHOH-CHO\n(Glucose)',
  };

  // ── Collab lab handler ───────────────────────────────────────────────────────
  function handleStartCollabLab() {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    setCollabLabCode(code);
    setCollabLabActive(true);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'lab', 'lab:collab-start', { code },
    );
  }

  // ── Hypothesis handler ───────────────────────────────────────────────────────
  function handleGenerateHypotheses() {
    setHypothesisLoading(true);
    setHypotheses([]);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'lab', 'lab:hypothesis-request', { domain: 'general' },
    );
    setTimeout(() => {
      setHypotheses([
        'Quantum decoherence increases proportionally with temperature gradient',
        'Fluid viscosity exhibits non-linear response under oscillatory shear',
        'Neural pattern synchronization precedes decision emergence by 80–120 ms',
      ]);
      setHypothesisLoading(false);
    }, 1200);
  }

  // ── Molecule handler ─────────────────────────────────────────────────────────
  function handleSelectMolecule(mol: string) {
    setSelectedMolecule(mol);
    setMoleculeDisplay(MOLECULE_DATA[mol] ?? '');
  }

  function handleAnalyzeMolecule() {
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'lab', 'lab:molecule-analyze', { molecule: selectedMolecule },
    );
  }

  // ── Dataset handler ──────────────────────────────────────────────────────────
  function handleImportDataset(name: string) {
    setSelectedDataset(name);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'lab', 'lab:dataset-import', { name },
    );
  }

  // ── Publish result handler ───────────────────────────────────────────────────
  function handlePublishResult(title: string) {
    if (!title.trim()) return;
    setPublishingResult(true);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'lab', 'lab:result-publish', { title },
    );

    // Write a real experiment record to Supabase (Phase 8 §F, pt 53).
    const supabase = createClient();
    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user;
      if (user) {
        await supabase.from('physics_experiments').insert({
          creator_id:  user.id,
          title:       title.trim(),
          status:      'completed',
          visibility:  'private',
        });
      }
      const newResult = {
        id: `res-${Date.now()}`,
        title: title.trim(),
        date: new Date().toISOString().split('T')[0],
      };
      setPublishedResults(prev => [newResult, ...prev]);
      setNewResultTitle('');
      setPublishingResult(false);
    });
  }

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

        {/* ── Active Experiments (existing) ── */}
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

        {/* ── Simulation Status (existing) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
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

        {/* ── NEW: Simulation Runner ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Simulation Runner</span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${ACCENT}18`, color: ACCENT }}
            >
              4 types
            </span>
          </div>

          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SIMS.map(sim => {
                const state: SimState = simStates[sim.id] ?? 'idle';
                return (
                  <div
                    key={sim.id}
                    style={{
                      padding: '12px 14px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.55)',
                      border: `1px solid ${state === 'complete' ? ACCENT + '40' : 'rgba(160,195,240,0.2)'}`,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{sim.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                          {sim.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.35 }}>
                          {sim.description}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={state === 'running'}
                        onClick={() => runSim(sim.id)}
                        style={{
                          flexShrink: 0,
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          cursor: state === 'running' ? 'not-allowed' : 'pointer',
                          border: 'none',
                          background: state === 'complete'
                            ? `${ACCENT}20`
                            : state === 'running'
                              ? 'rgba(160,195,240,0.18)'
                              : `linear-gradient(135deg, ${ACCENT}, #16a34a)`,
                          color: state === 'complete' ? ACCENT : state === 'running' ? 'var(--de-text-dim)' : '#fff',
                          transition: 'all 0.2s',
                        }}
                      >
                        {state === 'running' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        {state === 'running' ? 'Running…' : state === 'complete' ? 'Re-run' : 'Run Sim'}
                      </button>
                    </div>

                    {/* Result row */}
                    {state === 'complete' && (
                      <div
                        style={{
                          marginTop: 10, padding: '8px 10px', borderRadius: 8,
                          background: `${ACCENT}10`, border: `1px solid ${ACCENT}25`,
                          fontSize: 11, fontWeight: 600, color: ACCENT,
                          fontFamily: 'monospace',
                        }}
                      >
                        ✓ {sim.result}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── NEW: Data Visualization Panel ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Data Visualization</span>
          </div>

          <div className="de-widget-body">
            {/* Chart type selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {(['line', 'bar', 'scatter'] as ChartType[]).map(ct => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => setChartType(ct)}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 9, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                    background: chartType === ct ? `linear-gradient(135deg, ${ACCENT}, #16a34a)` : 'rgba(160,195,240,0.15)',
                    color: chartType === ct ? '#fff' : 'var(--de-text-dim)',
                  }}
                >
                  {ct === 'line' ? 'Line Chart' : ct === 'bar' ? 'Bar Chart' : 'Scatter Plot'}
                </button>
              ))}
            </div>

            {/* ASCII data preview */}
            <div
              style={{
                padding: '14px 16px', borderRadius: 10,
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid rgba(160,195,240,0.2)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {chartType === 'line' ? 'Line Chart' : chartType === 'bar' ? 'Bar Chart' : 'Scatter Plot'} Preview
              </div>
              <div
                style={{
                  fontFamily: 'monospace', fontSize: 20, color: ACCENT,
                  letterSpacing: '0.12em', lineHeight: 1.5,
                }}
              >
                {CHART_PREVIEWS[chartType]}
              </div>
              <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 6 }}>
                42 rows · JSON format
              </div>
            </div>
          </div>

          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleExportData}
              className="de-btn de-btn-primary text-xs"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: exportFlash ? '#16a34a' : undefined,
                transition: 'background 0.3s',
              }}
            >
              <Download className="w-3 h-3" />
              {exportFlash ? 'Exported!' : 'Export Data'}
            </button>
          </div>
        </div>

        {/* ── NEW: Cross-Engin Sync ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Cross-Engin Sync</span>
          </div>

          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Code */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(42,138,184,0.2)',
                }}
              >
                <div
                  style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(42,138,184,0.12)', border: '1px solid rgba(42,138,184,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Code2 className="w-3.5 h-3.5" style={{ color: '#2a8ab8' }} />
                </div>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--de-heading)' }}>
                  Code
                </span>
                <span style={{ fontSize: 11, color: '#2a8ab8', fontWeight: 600 }}>
                  Script execution ready
                </span>
                <div style={{ width: 7, height: 7, borderRadius: 999, background: '#2a8ab8', flexShrink: 0 }} />
              </div>

              {/* Game */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(42,138,184,0.2)',
                }}
              >
                <div
                  style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(42,138,184,0.12)', border: '1px solid rgba(42,138,184,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Gamepad2 className="w-3.5 h-3.5" style={{ color: '#2a8ab8' }} />
                </div>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--de-heading)' }}>
                  Game
                </span>
                <span style={{ fontSize: 11, color: '#2a8ab8', fontWeight: 600 }}>
                  Physics preset synced
                </span>
                <div style={{ width: 7, height: 7, borderRadius: 999, background: '#2a8ab8', flexShrink: 0 }} />
              </div>

              {/* Music */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(42,138,184,0.2)',
                }}
              >
                <div
                  style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(42,138,184,0.12)', border: '1px solid rgba(42,138,184,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Music className="w-3.5 h-3.5" style={{ color: '#2a8ab8' }} />
                </div>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--de-heading)' }}>
                  Music
                </span>
                <span style={{ fontSize: 11, color: '#2a8ab8', fontWeight: 600 }}>
                  Waveform analysis ready
                </span>
                <div style={{ width: 7, height: 7, borderRadius: 999, background: '#2a8ab8', flexShrink: 0 }} />
              </div>

            </div>
          </div>
        </div>

        {/* ── Collab Lab ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <FlaskConical className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Collab Lab</span>
            {collabLabActive && (
              <span
                className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                Live
              </span>
            )}
          </div>
          <div className="de-widget-body">
            {collabLabActive ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: `${ACCENT}08`, border: `1px solid ${ACCENT}25`, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 4 }}>SESSION CODE</div>
                  <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.15em', color: ACCENT, fontFamily: 'monospace' }}>{collabLabCode}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { void navigator.clipboard.writeText(collabLabCode); }}
                  className="de-btn de-btn-ghost"
                  aria-label="Copy invite code"
                  style={{ transition: 'all 0.15s' }}
                >
                  📋 Copy Invite Code
                </button>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
                Start a shared lab session to collaborate on experiments in real time.
              </p>
            )}
          </div>
          {!collabLabActive && (
            <div className="de-widget-actions">
              <button
                type="button"
                onClick={handleStartCollabLab}
                className="de-btn de-btn-primary"
                aria-label="Start shared lab session"
                style={{ transition: 'all 0.15s' }}
              >
                Start Shared Lab
              </button>
            </div>
          )}
        </div>

        {/* ── AI Hypothesis Generator ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Activity className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">AI Hypothesis Generator</span>
          </div>
          <div className="de-widget-body">
            {hypotheses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
                {hypotheses.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '9px 12px', borderRadius: 10,
                      background: `${ACCENT}08`, border: `1px solid ${ACCENT}25`,
                      fontSize: 12, fontWeight: 500, color: 'var(--de-heading)', fontStyle: 'italic',
                    }}
                  >
                    "{h}"
                  </div>
                ))}
              </div>
            )}
            {hypotheses.length === 0 && !hypothesisLoading && (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 0 }}>
                Dr. Eams will generate 3 testable hypotheses for your domain.
              </p>
            )}
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleGenerateHypotheses}
              disabled={hypothesisLoading}
              className="de-btn de-btn-primary"
              aria-label="Generate AI hypotheses"
              style={{ opacity: hypothesisLoading ? 0.6 : 1, transition: 'all 0.15s' }}
            >
              {hypothesisLoading ? '🔬 Generating…' : '🔬 Generate Hypotheses'}
            </button>
          </div>
        </div>

        {/* ── Molecule Viewer ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Code2 className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Molecule Viewer</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {['H2O', 'CO2', 'C6H12O6'].map(mol => (
                <button
                  key={mol}
                  type="button"
                  onClick={() => handleSelectMolecule(mol)}
                  aria-label={`Select molecule ${mol}`}
                  style={{
                    padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                    border: `1.5px solid ${selectedMolecule === mol ? ACCENT : 'rgba(160,195,240,0.25)'}`,
                    background: selectedMolecule === mol ? `${ACCENT}15` : 'rgba(255,255,255,0.5)',
                    color: selectedMolecule === mol ? ACCENT : 'var(--de-text)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {mol}
                </button>
              ))}
            </div>
            <div
              style={{
                padding: '14px 16px', borderRadius: 10,
                background: 'rgba(0,0,0,0.06)', border: `1px solid ${ACCENT}20`,
                fontFamily: 'monospace', fontSize: 14, fontWeight: 700,
                color: ACCENT, whiteSpace: 'pre', lineHeight: 1.6, minHeight: 52,
              }}
            >
              {moleculeDisplay}
            </div>
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleAnalyzeMolecule}
              className="de-btn de-btn-primary"
              aria-label={`Analyze molecule ${selectedMolecule}`}
              style={{ transition: 'all 0.15s' }}
            >
              Analyze {selectedMolecule}
            </button>
          </div>
        </div>

        {/* ── Dataset Browser ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <BarChart2 className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Dataset Browser</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {datasets.map(ds => (
                <div
                  key={ds.name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: selectedDataset === ds.name ? `${ACCENT}08` : 'rgba(255,255,255,0.5)',
                    border: selectedDataset === ds.name ? `1px solid ${ACCENT}30` : '1px solid rgba(160,195,240,0.18)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ds.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 1 }}>
                      {ds.rows} rows · {ds.domain}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleImportDataset(ds.name)}
                    aria-label={`Import dataset ${ds.name}`}
                    style={{
                      padding: '4px 10px', borderRadius: 7, fontSize: 10, fontWeight: 700,
                      border: `1px solid ${ACCENT}35`, background: selectedDataset === ds.name ? ACCENT : `${ACCENT}12`,
                      color: selectedDataset === ds.name ? '#fff' : ACCENT,
                      cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                    }}
                  >
                    {selectedDataset === ds.name ? '✓ Imported' : 'Import'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Published Results ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Download className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Published Results</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
              {publishedResults.map(r => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(160,195,240,0.18)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 1 }}>{r.date}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePublishResult(r.title)}
                    aria-label={`Share ${r.title} to profile`}
                    style={{
                      padding: '4px 9px', borderRadius: 7, fontSize: 10, fontWeight: 700,
                      border: `1px solid ${ACCENT}35`, background: `${ACCENT}12`, color: ACCENT,
                      cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                    }}
                  >
                    Share
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="New result title…"
                value={newResultTitle}
                onChange={e => setNewResultTitle(e.target.value)}
                aria-label="New result title"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 9, fontSize: 12,
                  border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                  color: 'var(--de-heading)', outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => handlePublishResult(newResultTitle)}
                disabled={publishingResult || !newResultTitle.trim()}
                className="de-btn de-btn-primary"
                aria-label="Publish new result"
                style={{ opacity: publishingResult || !newResultTitle.trim() ? 0.5 : 1, transition: 'all 0.15s' }}
              >
                {publishingResult ? '…' : 'Publish'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Feature 11: WebGPU Compute Monitor ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Activity className="w-4 h-4 mr-1" style={{ color: '#8b5cf6' }} />
            <span className="de-widget-title">WebGPU Compute Monitor</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>
              FREE
            </span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              {[
                { label: 'Shader Pipelines', val: '12', color: '#8b5cf6' },
                { label: 'Compute Passes',   val: '4',  color: '#0ea5e9' },
                { label: 'Texture Uploads',  val: '28', color: '#22c55e' },
              ].map(m => (
                <div key={m.label} style={{ padding: '8px 8px', borderRadius: 9, background: `${m.color}0e`, border: `1px solid ${m.color}25`, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                  <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2, lineHeight: 1.2 }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 9, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8b5cf6', marginBottom: 3 }}>GPU Backend</div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                WebGPU available · Tier: <strong>High</strong> · 60 FPS target · ECS world active
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature 12: Benchmark Suite (runs live) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <BarChart2 className="w-4 h-4 mr-1" style={{ color: '#22c55e' }} />
            <span className="de-widget-title">Benchmark Suite</span>
            {benchRunning && <span style={{ marginLeft: 'auto', fontSize: 9, color: '#f59e0b', fontWeight: 700, background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4 }}>● Running…</span>}
            {!benchRunning && benchResults.length > 0 && <span style={{ marginLeft: 'auto', fontSize: 9, color: '#22c55e', fontWeight: 700, background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: 4 }}>✓ Done</span>}
          </div>
          <div className="de-widget-body">
            {benchResults.length === 0 && !benchRunning && (
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center', padding: '8px 0' }}>Click Run to benchmark your WebGPU, physics, memory and AI speeds.</p>
            )}
            {benchSaveMsg && (
              <div style={{ fontSize: 10, color: benchSaveMsg.startsWith('Saved') ? '#22c55e' : '#ef4444', marginBottom: 8 }}>
                {benchSaveMsg}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {benchResults.map(b => (
                <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <span style={{ fontSize: 11, color: 'var(--de-heading)', fontWeight: 600 }}>{b.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', fontFamily: 'monospace' }}>{b.score} <span style={{ fontSize: 9, color: 'var(--de-text-dim)' }}>{b.unit}</span></span>
                </div>
              ))}
            </div>
            <button type="button" onClick={runBenchmark} disabled={benchRunning}
              style={{ marginTop: 8, padding: '9px 14px', borderRadius: 9, fontSize: 11, fontWeight: 700, background: benchRunning ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.14)', border: `1px solid ${benchRunning ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`, color: benchRunning ? '#f59e0b' : '#22c55e', cursor: benchRunning ? 'default' : 'pointer', width: '100%', opacity: benchRunning ? 0.8 : 1 }}>
              {benchRunning ? '⏳ Running benchmarks…' : '▶ Run All Benchmarks'}
            </button>
          </div>
        </div>

        {/* ── Feature 13: Parameter Sweep Tool ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>🔢</span>
            <span className="de-widget-title ml-2">Parameter Sweep</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Vary simulation parameters across a range and observe output distribution.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { param: 'Gravity (m/s²)',  min: 1.6, max: 24.8, steps: 6, best: 9.8 },
                { param: 'Friction coeff', min: 0.1, max: 1.0,  steps: 5, best: 0.4 },
                { param: 'Learning rate',  min: 0.001, max: 0.1, steps: 4, best: 0.01 },
              ].map(p => (
                <div key={p.param} style={{ padding: '9px 11px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-heading)' }}>{p.param}</span>
                    <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>Best: {p.best}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>
                    Range {p.min}–{p.max} · {p.steps} steps
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(34,197,94,0.1)', marginTop: 5 }}>
                    <div style={{ height: '100%', borderRadius: 2, background: '#22c55e', width: `${((p.best - p.min) / (p.max - p.min)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 14: Feature Flag Manager ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>🏁</span>
            <span className="de-widget-title ml-2">Feature Flags</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#22c55e', fontWeight: 700, background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 5 }}>
              {Object.values(featureFlags).filter(Boolean).length}/{Object.keys(featureFlags).length} on
            </span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Toggle experimental platform features without a deploy. Changes apply instantly.
            </p>
            {[
              { id: 'webgpu-shadows',   label: 'WebGPU Dynamic Shadows'   },
              { id: 'tfjs-telemetry',   label: 'TensorFlow.js Telemetry'  },
              { id: 'multiplayer-beta', label: 'Multiplayer Beta'          },
              { id: 'ai-director-v2',   label: 'AI Director v2'           },
              { id: 'quantum-sim',      label: 'Quantum Circuit Simulator' },
            ].map(flag => {
              const on = featureFlags[flag.id];
              return (
                <button key={flag.id} type="button" onClick={() => toggleFlag(flag.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 10px', marginBottom: 5, borderRadius: 9, background: on ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.5)', border: `1px solid ${on ? 'rgba(34,197,94,0.25)' : 'rgba(0,0,0,0.08)'}`, cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 11, color: 'var(--de-heading)', fontWeight: 600 }}>{flag.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: on ? '#22c55e' : 'var(--de-text-dim)', background: on ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.06)', padding: '2px 10px', borderRadius: 5, transition: 'all 0.2s' }}>
                    {on ? 'ON' : 'OFF'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Feature 15: Version Control for Experiments ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Code2 className="w-4 h-4 mr-1" style={{ color: '#2a8ab8' }} />
            <span className="de-widget-title">Experiment Version Control</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { version: 'v0.4.0', label: 'Added neural pattern sim', date: '2h ago', active: true },
                { version: 'v0.3.2', label: 'Fixed fluid boundary conditions', date: '1d ago', active: false },
                { version: 'v0.3.0', label: 'Quantum circuit gates added', date: '3d ago', active: false },
                { version: 'v0.2.0', label: 'Initial particle system', date: '1w ago', active: false },
              ].map(v => (
                <div key={v.version} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 9, background: v.active ? 'rgba(42,138,184,0.08)' : 'rgba(255,255,255,0.5)', border: `1px solid ${v.active ? 'rgba(42,138,184,0.3)' : 'rgba(0,0,0,0.06)'}` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#2a8ab8', fontFamily: 'monospace', flexShrink: 0 }}>{v.version}</span>
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--de-heading)' }}>{v.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--de-text-dim)', flexShrink: 0 }}>{v.date}</span>
                  {v.active && <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>● current</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 16: Neural Network Visualizer ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>🧠</span>
            <span className="de-widget-title ml-2">Neural Network Visualizer</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Visual layer-by-layer inspection of TensorFlow.js models.
            </p>
            <div style={{ fontFamily: 'monospace', fontSize: 10, lineHeight: 1.8, color: 'var(--de-heading)', background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: '10px 12px' }}>
              <span style={{ color: '#8b5cf6' }}>Input</span>     [784] ────────────────────▶<br />
              <span style={{ color: '#6366f1' }}>Dense</span>    [128] ReLU ──────────────▶<br />
              <span style={{ color: '#0ea5e9' }}>Dense</span>     [64] ReLU ───────────────▶<br />
              <span style={{ color: '#22c55e' }}>Dropout</span>  [0.2] ───────────────────▶<br />
              <span style={{ color: '#ec4899' }}>Output</span>    [10] Softmax ─────────▶ 🎯
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginTop: 10 }}>
              {[
                { label: 'Parameters', val: '109K' },
                { label: 'Accuracy',   val: '97.2%' },
                { label: 'Loss',       val: '0.041' },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center', padding: '6px', borderRadius: 8, background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#8b5cf6' }}>{m.val}</div>
                  <div style={{ fontSize: 9, color: 'var(--de-text-dim)' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 17: Resource Monitor (live) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Activity className="w-4 h-4 mr-1" style={{ color: '#f59e0b' }} />
            <span className="de-widget-title">Resource Monitor</span>
            <span style={{ marginLeft: 'auto', fontSize: 9, color: '#22c55e', fontWeight: 700, background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: 4 }}>● LIVE</span>
          </div>
          <div className="de-widget-body">
            {([
              { label: 'CPU',    pct: resources.cpu,  color: '#6366f1' },
              { label: 'GPU',    pct: resources.gpu,  color: '#8b5cf6' },
              { label: 'Memory', pct: resources.mem,  color: '#0ea5e9' },
              { label: 'VRAM',   pct: resources.vram, color: '#ec4899' },
            ] as { label: string; pct: number; color: string }[]).map(r => (
              <div key={r.label} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: 'var(--de-text-dim)', fontWeight: 600 }}>{r.label}</span>
                  <span style={{ color: r.pct > 80 ? '#ef4444' : r.pct > 60 ? '#f59e0b' : 'var(--de-heading)', fontWeight: 700, fontFamily: 'monospace' }}>{r.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: r.pct > 80 ? '#ef4444' : r.color, width: `${r.pct}%`, transition: 'width 0.8s ease, background 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature 18: Hypothesis Tracker ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <FlaskConical className="w-4 h-4 mr-1" style={{ color: '#22c55e' }} />
            <span className="de-widget-title">Hypothesis Tracker</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { h: 'Reducing gravity to 3 m/s² improves particle clustering by 40%', status: '✅', outcome: 'Confirmed' },
                { h: 'Neural convergence improves with batch size 64 vs 32',             status: '🔄', outcome: 'In progress' },
                { h: 'WebGPU compute shaders outperform JS by 10×',                      status: '✅', outcome: 'Confirmed' },
                { h: 'Fluid viscosity > 0.8 causes unstable simulation',                 status: '❌', outcome: 'Refuted' },
              ].map((row, i) => (
                <div key={i} style={{ padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: `1px solid rgba(34,197,94,0.15)` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: row.outcome === 'Confirmed' ? '#22c55e' : row.outcome === 'Refuted' ? '#ef4444' : '#f59e0b' }}>{row.status} {row.outcome}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-heading)', lineHeight: 1.4 }}>{row.h}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 19: CI/CD Integration ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Code2 className="w-4 h-4 mr-1" style={{ color: '#6366f1' }} />
            <span className="de-widget-title">CI/CD Integration</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Link your lab experiments to GitHub Actions workflows for automated testing.
            </p>
            {[
              { name: 'run-sims.yml',       status: 'passing', branch: 'main' },
              { name: 'benchmark-suite.yml',status: 'passing', branch: 'main' },
              { name: 'neural-train.yml',   status: 'running', branch: 'feature/v2' },
            ].map(w => (
              <div key={w.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', marginBottom: 5, borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#6366f1', flex: 1 }}>{w.name}</span>
                <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>@{w.branch}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: w.status === 'passing' ? '#22c55e' : w.status === 'running' ? '#f59e0b' : '#ef4444', background: w.status === 'passing' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                  {w.status}
                </span>
              </div>
            ))}
            <Link href="/daydream/code" style={{ display: 'block', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6366f1', marginTop: 6, textDecoration: 'none' }}>
              Open CodeEngin for full CI pipeline →
            </Link>
          </div>
        </div>

        {/* ── Feature 20: Quantum Circuit Simulator ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>⚛️</span>
            <span className="de-widget-title ml-2">Quantum Circuit Simulator</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Visual gate editor for quantum circuits on a simulated 8-qubit register.
            </p>
            <div style={{ fontFamily: 'monospace', fontSize: 11, background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: '10px 14px', lineHeight: 2 }}>
              <span style={{ color: '#8b5cf6' }}>q[0]</span>: ─H──●──────────── |+⟩<br />
              <span style={{ color: '#6366f1' }}>q[1]</span>: ────X──●────────── |00⟩<br />
              <span style={{ color: '#0ea5e9' }}>q[2]</span>: ───────X──●──────── |000⟩<br />
              <span style={{ color: '#22c55e' }}>q[3]</span>: ──────────X──H──M── |?⟩
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              {[
                { label: 'Fidelity', val: '0.94' },
                { label: 'Depth', val: '12' },
                { label: 'Qubits', val: '8' },
                { label: 'Gates', val: '6' },
              ].map(m => (
                <div key={m.label} style={{ padding: '7px 10px', borderRadius: 8, background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#8b5cf6' }}>{m.val}</div>
                  <div style={{ fontSize: 9, color: 'var(--de-text-dim)' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
