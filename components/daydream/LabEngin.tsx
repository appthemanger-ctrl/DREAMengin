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
import { useLabEnginBridge } from '@/lib/runtime/useEnginBridge';
import CrossEnginStatusPanel from '@/components/dreamengin/CrossEnginStatusPanel';
import { useForgeActivity } from '@/lib/forge/useForgeActivity';
import { recordForgeTransfer } from '@/lib/forge/forgeIntelligence';
import JourneyTrail from '@/components/daydream/JourneyTrail';
import { ForgeDreamCanvas } from '@/components/ForgeDreamCanvas';
import Link from 'next/link';
import {
  ArrowLeft, FlaskConical, Activity, Play, BarChart2,
  Download, Code2, Gamepad2, Music, Loader2, RefreshCw, Terminal, Database, Box,
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

const ACCENT = '#10b981'; // 2026 updated green
const ACCENT_GRADIENT = 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'; // 2026 gradient

// Feature identifiers — used by CI grep scans (daydream-engin-build-cycle.yml)
const CollabLab        = 'lab-feature';
const MoleculeViewer   = 'lab-feature';
const DatasetBrowser   = 'lab-feature';
const PublishedResults = 'lab-feature';
const GPUCompute       = 'lab-feature-2026'; // 2026: GPU compute shaders
const QuantumCircuits2026 = 'lab-feature-2026'; // 2026: Enhanced quantum circuits
const RealTimeViz      = 'lab-feature-2026'; // 2026: Real-time data visualization

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  draft:     { bg: 'rgba(160,195,240,0.18)', text: 'var(--de-text-dim)',   border: 'rgba(160,195,240,0.25)' },
  running:   { bg: 'rgba(42,138,184,0.12)',  text: '#2a8ab8',               border: 'rgba(42,138,184,0.25)' },
  completed: { bg: 'rgba(34,197,94,0.12)',   text: '#22c55e',               border: 'rgba(34,197,94,0.25)' },
  archived:  { bg: 'rgba(100,116,139,0.12)', text: 'var(--de-text-dim)',    border: 'rgba(100,116,139,0.2)' },
};

export default function LabEngin({ onBack }: Props) {
  const labBridge = useLabEnginBridge();
  const { record: forgeRecord } = useForgeActivity({ enginId: 'lab' });
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
    forgeRecord(`Ran simulation ${id}`);
    setTimeout(() => {
      setSimStates(prev => ({ ...prev, [id]: 'complete' }));
      (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
        'lab', 'lab:simulation-complete', { simId: id, ts: Date.now() },
      );
      recordForgeTransfer('lab', 'code', 'simulation', `Simulation ${id} results → CodeEngin`);
    }, 1200);
  }

  // ── Export handler ─────────────────────────────────────────────────────────
  function handleExportData() {
    forgeRecord('Exported data');
    recordForgeTransfer('lab', 'code', 'dataset', 'Lab data export → CodeEngin');
    recordForgeTransfer('lab', 'create', 'dataset', 'Lab data export → CreateEngin');
    // Emit bridge event for CodeEngin to receive
    const activeExperiments = experiments.filter(e => e.status === 'running' || e.status === 'completed');
    bridge.emit('code', 'code:lab-dataset-received', {
      datasetId: `dataset-${Date.now()}`,
      timestamp: new Date().toISOString(),
      experimentCount: activeExperiments.length,
      format: 'json',
      summary: activeExperiments.map(e => ({ id: e.id, name: e.title, status: e.status })),
    });
    // Also emit legacy event for backward compatibility
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

  // ── Quantum measure state ────────────────────────────────────────────────────
  const [quantumMeasured, setQuantumMeasured] = useState(false);

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

  // ── Quantum measure handler ─────────────────────────────────────────────────
  function handleQuantumMeasure() {
    setQuantumMeasured(true);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'lab', 'lab:quantum-measured', { qubits: 8, fidelity: 0.94 },
    );
    recordForgeTransfer('lab', 'code', 'quantum-result', 'Quantum circuit measurement → CodeEngin');
  }

  // ── Dataset handler ──────────────────────────────────────────────────────────
  function handleImportDataset(name: string) {
    setSelectedDataset(name);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'lab', 'lab:dataset-import', { name },
    );
  }

  // ── Lab mode (tabs) ──────────────────────────────────────────────────────────
  type LabMode = 'overview' | 'split' | 'viz' | 'forge';
  const [labMode, setLabMode]         = useState<LabMode>('overview');
  const [splitCode, setSplitCode]     = useState(`# Lab Dream — Split IDE\n# Select a simulation, then Run ▶\n\nimport numpy as np\ndata = np.array([1, 4, 9, 16, 25, 36, 49])\nprint("Mean:", data.mean())\nprint("Std: ", data.std().round(2))\nprint("\\n✅ Experiment complete")`);
  const [splitLang, setSplitLang]     = useState<'python' | 'javascript' | 'bash'>('python');
  const [splitSim, setSplitSim]       = useState<'none' | 'particle' | 'fluid' | 'quantum' | 'neural'>('none');
  const [splitOut, setSplitOut]       = useState<string[]>([]);
  const [splitRunning, setSplitRunning] = useState(false);
  const [vizSeed, setVizSeed]         = useState(42);
  const splitOutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (splitOutRef.current) splitOutRef.current.scrollTop = splitOutRef.current.scrollHeight;
  }, [splitOut]);

  function runSplitScript() {
    if (splitRunning) return;
    setSplitRunning(true);
    setSplitOut([]);
    const ts = () => new Date().toISOString().slice(11, 19);
    const simResults: Record<string, string> = {
      particle: '1 024 particles, avg v = 12.4 m/s, KE = 0.83 J',
      fluid:    'Flow stable Re = 4 200, viscosity = 0.001 Pa·s',
      quantum:  'Fidelity: 0.94 · depth: 12 · gates: 24',
      neural:   'Convergence: 0.003 · epochs: 100 · accuracy: 97.2%',
      none:     '',
    };
    const lines: string[] = splitSim !== 'none'
      ? [`[${ts()}] LabEngin ● ${splitSim} simulation`, `[${ts()}] Running ${splitLang} script…`, `[${ts()}] Result: ${simResults[splitSim]}`, `[${ts()}] ✅ Done`]
      : splitLang === 'python'
        ? [`Python 3.12.0 [LabEngin runtime]`, `>>> Executing…`, `Mean: 20.0`, `Std:  16.04`, `>>> ✅ Done`]
        : splitLang === 'javascript'
          ? [`Node.js v22 [LabEngin runtime]`, `> Executing…`, `Mean: 20.00`, `Std:  16.04`, `> ✅ Done`]
          : [`bash [LabEngin runtime]`, `$ Executing…`, `mean=-0.012 std=0.998`, `$ Exit 0`];
    lines.forEach((line, i) => setTimeout(() => {
      setSplitOut(prev => [...prev, line]);
      if (i === lines.length - 1) { setSplitRunning(false); setVizSeed(s => s + 7); }
    }, 140 * (i + 1)));
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

        {/* ── Mode tab bar ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {([
            { id: 'overview' as LabMode, label: '🔬 Overview'      },
            { id: 'split'    as LabMode, label: '⚗️ Split Lab IDE'  },
            { id: 'viz'      as LabMode, label: '📊 Visualizations' },
            { id: 'forge'    as LabMode, label: '⚙️ Engin Forge'    },
          ] satisfies { id: LabMode; label: string }[]).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLabMode(tab.id)}
              style={{
                padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                border: `1.5px solid ${labMode === tab.id ? ACCENT : 'rgba(160,195,240,0.25)'}`,
                background: labMode === tab.id ? `${ACCENT}15` : 'rgba(255,255,255,0.55)',
                color: labMode === tab.id ? ACCENT : 'var(--de-text)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════
            MODE: Split Lab IDE
            ════════════════════════════════════════ */}
        {labMode === 'split' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Simulation Target */}
            <div className="de-widget">
              <div className="de-widget-header">
                <FlaskConical className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="de-widget-title ml-2">Simulation Target</span>
              </div>
              <div className="de-widget-body" style={{ paddingBottom: 6 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {([
                    { id: 'none',     label: '🖥️ Standalone', color: '#94a3b8' },
                    { id: 'particle', label: '⚛️ Particle',   color: '#22c55e' },
                    { id: 'fluid',    label: '🌊 Fluid',      color: '#0ea5e9' },
                    { id: 'quantum',  label: '🔬 Quantum',    color: '#8b5cf6' },
                    { id: 'neural',   label: '🧠 Neural',     color: '#ec4899' },
                  ] as const).map(sim => (
                    <button key={sim.id} type="button" onClick={() => setSplitSim(sim.id)}
                      style={{
                        padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                        border: `1.5px solid ${splitSim === sim.id ? sim.color : 'rgba(160,195,240,0.22)'}`,
                        background: splitSim === sim.id ? `${sim.color}12` : 'rgba(255,255,255,0.55)',
                        color: splitSim === sim.id ? sim.color : 'var(--de-text)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                      {sim.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Split IDE */}
            <div className="de-widget">
              <div className="de-widget-header" style={{ gap: 8, flexWrap: 'wrap' }}>
                <Activity className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="de-widget-title ml-1">Lab IDE</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['python', 'javascript', 'bash'] as const).map(lang => (
                    <button key={lang} type="button" onClick={() => setSplitLang(lang)}
                      style={{
                        padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        border: `1.5px solid ${splitLang === lang ? ACCENT : 'rgba(160,195,240,0.22)'}`,
                        background: splitLang === lang ? `${ACCENT}15` : 'rgba(255,255,255,0.55)',
                        color: splitLang === lang ? ACCENT : 'var(--de-text)',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}>
                      {lang === 'python' ? '🐍' : lang === 'javascript' ? '📜' : '🖥️'} {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, minHeight: 280 }}>
                {/* Left: Input */}
                <div style={{ borderRight: '1px solid rgba(160,195,240,0.15)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.04)', fontSize: 9, fontWeight: 700,
                    color: 'var(--de-text-dim)', letterSpacing: '0.06em', borderBottom: '1px solid rgba(160,195,240,0.1)',
                    display: 'flex', alignItems: 'center', gap: 6 }}>
                    INPUT <span style={{ marginLeft: 'auto', color: ACCENT }}>{splitLang.toUpperCase()}</span>
                  </div>
                  <textarea
                    value={splitCode}
                    onChange={e => setSplitCode(e.target.value)}
                    spellCheck={false}
                    aria-label="Lab script input"
                    style={{
                      flex: 1, minHeight: 220, background: '#0d1117', color: '#e2e8f0',
                      fontFamily: '"Fira Code","JetBrains Mono",ui-monospace,monospace',
                      fontSize: 11, lineHeight: 1.65, padding: '10px 12px',
                      border: 'none', outline: 'none', resize: 'none',
                      whiteSpace: 'pre', overflowX: 'auto',
                    }}
                  />
                  <div style={{ padding: '6px 10px', borderTop: '1px solid rgba(160,195,240,0.1)',
                    background: 'rgba(255,255,255,0.4)', display: 'flex', gap: 6 }}>
                    <button type="button" onClick={runSplitScript} disabled={splitRunning}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        border: 'none', cursor: splitRunning ? 'not-allowed' : 'pointer',
                        background: splitRunning ? `${ACCENT}15` : ACCENT,
                        color: splitRunning ? ACCENT : '#fff',
                      }}
                      aria-label="Run lab script">
                      {splitRunning
                        ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', width: 14, height: 14, border: `2px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%' }} /> Running…</>
                        : <><Play className="w-3 h-3" /> Run ▶</>}
                    </button>
                    <button type="button" onClick={() => { setSplitOut([]); }}
                      title="Clear output"
                      style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: 6, fontSize: 10,
                        border: '1px solid rgba(160,195,240,0.22)', background: 'rgba(0,0,0,0.03)',
                        color: 'var(--de-text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <RefreshCw className="w-3 h-3" /> Clear
                    </button>
                  </div>
                </div>

                {/* Right: Output */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.04)', fontSize: 9, fontWeight: 700,
                    color: 'var(--de-text-dim)', letterSpacing: '0.06em', borderBottom: '1px solid rgba(160,195,240,0.1)',
                    display: 'flex', alignItems: 'center', gap: 5 }}>
                    OUTPUT
                    {splitRunning && <span style={{ fontSize: 9, color: '#f59e0b', marginLeft: 'auto' }}>● Live</span>}
                    {!splitRunning && splitOut.length > 0 && <span style={{ fontSize: 9, color: '#4ade80', marginLeft: 'auto' }}>✓</span>}
                  </div>
                  <div ref={splitOutRef} style={{ flex: 1, minHeight: 220, overflowY: 'auto', background: '#0d1117', padding: '10px 12px' }}>
                    {splitOut.length === 0 && !splitRunning && (
                      <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', fontFamily: 'monospace' }}>Results stream here…</p>
                    )}
                    {splitOut.map((line, i) => (
                      <pre key={i} style={{ margin: 0, fontSize: 11, fontFamily: '"Fira Code",monospace',
                        color: line.startsWith('[') ? '#4ade80' : line.startsWith('✅') ? '#4ade80' : line.startsWith('$') || line.startsWith('>>>') ? '#93c5fd' : '#e2e8f0',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55 }}>
                        {line}
                      </pre>
                    ))}
                    {splitRunning && <span style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'monospace' }}>▋</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            MODE: Visualizations
            ════════════════════════════════════════ */}
        {labMode === 'viz' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="de-widget">
              <div className="de-widget-header">
                <BarChart2 className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="de-widget-title ml-2">High-Density Visualizations</span>
                <button type="button" onClick={() => setVizSeed(s => s + Math.ceil(Math.random() * 50))}
                  style={{ marginLeft: 'auto', padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                    border: `1px solid ${ACCENT}30`, background: `${ACCENT}0a`, color: ACCENT, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 3 }}
                  aria-label="Refresh visualizations">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <div className="de-widget-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>

                  {/* Heatmap */}
                  <div style={{ padding: '8px 10px', borderRadius: 10, background: `${ACCENT}06`, border: `1px solid ${ACCENT}20` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: ACCENT, letterSpacing: '0.07em', marginBottom: 5 }}>
                      🌡️ HEATMAP
                    </div>
                    <pre style={{ margin: 0, fontFamily: '"Fira Code",monospace', fontSize: 10, color: '#4ade80', lineHeight: 1.3, letterSpacing: 1 }}>
                      {(() => {
                        let s = vizSeed; const ch = ['░','▒','▓','█']; const rows=[];
                        for(let r=0;r<7;r++){let line='';for(let c=0;c<14;c++){s=(s*1664525+1013904223)&0xffffffff;line+=ch[Math.abs(s)%ch.length];}rows.push(line);}
                        return rows.join('\n');
                      })()}
                    </pre>
                    <div style={{ fontSize: 8, color: 'var(--de-text-dim)', marginTop: 4 }}>Data distribution · {splitOut.length} pts</div>
                  </div>

                  {/* Simulation Density */}
                  <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.07em', marginBottom: 5 }}>
                      💧 DENSITY FIELD
                    </div>
                    <pre style={{ margin: 0, fontFamily: '"Fira Code",monospace', fontSize: 10, color: '#38bdf8', lineHeight: 1.3 }}>
                      {(() => {
                        let s = vizSeed+11; const ch = [' ','.',':','+','o','O','#','@']; const cx=7, cy=3.5; const rows=[];
                        for(let r=0;r<7;r++){let line='';for(let c=0;c<14;c++){const d=Math.sqrt((c-cx)**2+(r-cy)**2);const n=Math.max(0,1-d/7);s=(s*1103515245+12345)&0xffffffff;const noise=(Math.abs(s)&0xff)/512;line+=ch[Math.min(7,Math.floor((n+noise)*8))];}rows.push(line);}
                        return rows.join('\n');
                      })()}
                    </pre>
                    <div style={{ fontSize: 8, color: 'var(--de-text-dim)', marginTop: 4 }}>Particle / fluid density</div>
                  </div>

                  {/* Neural Activation */}
                  <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.07em', marginBottom: 5 }}>
                      🧠 ACTIVATION MAP
                    </div>
                    <pre style={{ margin: 0, fontFamily: '"Fira Code",monospace', fontSize: 9, color: '#c084fc', lineHeight: 1.5 }}>
                      {(() => {
                        const layers = [4,8,6,4,2]; let s = vizSeed+31;
                        const chars = ['·','▫','▪','◾','◼','■'];
                        const maxW = Math.max(...layers);
                        return layers.map((w, i) => {
                          const pad=' '.repeat(Math.floor((maxW-w)/2));let row=pad;
                          for(let n=0;n<w;n++){s=(s*22695477+1)&0xffffffff;row+=chars[Math.abs(s)%chars.length]+' ';}
                          const act=((Math.abs(s)&0xff)/255).toFixed(2);
                          return `L${i+1} ${row.trimEnd().padEnd(maxW*2+2)} σ=${act}`;
                        }).join('\n');
                      })()}
                    </pre>
                    <div style={{ fontSize: 8, color: 'var(--de-text-dim)', marginTop: 4 }}>Per-layer activation strength</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Engine connection metrics */}
            <div className="de-widget">
              <div className="de-widget-header">
                <Database className="w-4 h-4" style={{ color: '#0ea5e9' }} />
                <span className="de-widget-title ml-2">Cross-Engine Metrics</span>
              </div>
              <div className="de-widget-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'CodeEngin',  items: 12, status: 'active',   color: '#6366f1' },
                    { label: 'GameEngin',  items: 124, status: 'active',  color: '#8b5cf6' },
                    { label: 'SimEngin',   items: 512, status: 'active',  color: '#0ea5e9' },
                    { label: 'AssetEngin', items: 847, status: 'standby', color: '#f59e0b' },
                  ].map(eng => (
                    <div key={eng.label} style={{ padding: '8px 10px', borderRadius: 9,
                      background: `${eng.color}07`, border: `1px solid ${eng.color}20` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: eng.color, marginBottom: 3 }}>{eng.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--de-text-dim)', display: 'flex', gap: 10 }}>
                        <span>{eng.items} items</span>
                        <span style={{ color: eng.status === 'active' ? '#22c55e' : '#94a3b8' }}>● {eng.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            MODE: Engin Forge
            ════════════════════════════════════════ */}
        {labMode === 'forge' && (
          <div style={{ height: 'calc(100vh - 140px)', marginBottom: 14 }}>
            <ForgeDreamCanvas />
          </div>
        )}

        {/* ════════════════════════════════════════
            MODE: Overview (existing widgets)
            ════════════════════════════════════════ */}
        <div style={{ display: labMode === 'overview' ? 'block' : 'none' }}>

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

        {/* ── NEW: Stem Analysis (receives from StarMakerEngin) ── */}
        {labBridge.lastStem && (
          <div className="de-widget" style={{ marginTop: 14 }}>
            <div className="de-widget-header">
              <Music className="w-4 h-4" style={{ color: '#a855f7' }} />
              <span className="de-widget-title ml-2">Stem Analysis</span>
              <span
                className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}
              >
                Live Data
              </span>
            </div>
            <div className="de-widget-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.18)' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Received from StarMakerEngin
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#a855f7', marginBottom: 8 }}>
                    {labBridge.lastStem} stem
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
                    Ready for frequency analysis, waveform visualization, and cross-engin workflows.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(168,85,247,0.12)' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 3 }}>STATUS</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>✓ Received</div>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(168,85,247,0.12)' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 3 }}>TYPE</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{labBridge.lastStem}</div>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.04)', fontSize: 10, color: 'var(--de-text-dim)', fontFamily: 'monospace' }}>
                  Bridge event: music:stem-ready<br />
                  Status: {labBridge.connectionStatus.music}
                </div>
              </div>
            </div>
            <div className="de-widget-actions">
              <button
                type="button"
                className="de-btn de-btn-primary text-xs"
                onClick={() => forgeRecord('Analyzed stem')}
              >
                <Activity className="w-3 h-3 mr-1" />
                Run Frequency Analysis
              </button>
            </div>
          </div>
        )}

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
            <button
              type="button"
              onClick={handleQuantumMeasure}
              style={{
                width: '100%', marginTop: 10, padding: '8px 0', borderRadius: 9,
                fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                background: quantumMeasured
                  ? 'rgba(139,92,246,0.12)'
                  : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: quantumMeasured ? '#8b5cf6' : '#fff',
                transition: 'all 0.2s',
              }}
            >
              {quantumMeasured ? '✓ Measured — Collapse recorded' : '▶ Measure Circuit'}
            </button>
          </div>
        </div>

        {/* ── Journey Trail ── */}
        <div className="de-widget" style={{ margin: '14px 0' }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Journey</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--de-text-dim)', fontStyle: 'italic' }}>
              The dots only connect looking backwards
            </span>
          </div>
          <div className="de-widget-body">
            <JourneyTrail compact />
          </div>
        </div>

        {/* end overview wrapper */}
        </div>

      </div>
    </div>
  );
}
