'use client';

/**
 * LabDreamIDE — Split input/output IDE for the Lab Daydream (Side A).
 *
 * Layout:
 *   [ Sim selector strip ]
 *   [ Language bar ]
 *   [ Script editor (left) | Results output + visualizations (right) ]
 *   [ Visualization panel: heatmap · density · neural activation ]
 *
 * Python/JS/Bash input on the left; real-time streaming results
 * + 3 high-density visualizations on the right.
 *
 * No eval — all execution is simulated on the client.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play, StopCircle, Loader2, CheckCircle,
  FlaskConical, Activity, RefreshCw, BarChart2, ArrowLeftRight, Zap, MousePointerClick,
} from 'lucide-react';
import { getSwap, toggleSwap } from '@/lib/runtime/swapManager';
import { bridge as dualRuntimeBridge } from '@/lib/runtime/dualRuntimeBridge';

// ─── Types ────────────────────────────────────────────────────────────────────

type Language    = 'python' | 'javascript' | 'bash';
type SimId       = 'particle' | 'fluid' | 'quantum' | 'neural' | 'none';
type VizType     = 'heatmap' | 'density' | 'activation';
type RunStatus   = 'idle' | 'running' | 'done' | 'error';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT   = '#22c55e';
const CODE_BG  = '#0d1117';
const CODE_FG  = '#e2e8f0';
const OUT_OK   = '#4ade80';
const OUT_ERR  = '#f87171';

const SIMS: Array<{ id: SimId; name: string; emoji: string; color: string; result: string }> = [
  { id: 'none',     name: 'Standalone', emoji: '🖥️',  color: '#94a3b8', result: '' },
  { id: 'particle', name: 'Particle',   emoji: '⚛️',  color: '#22c55e', result: '1 024 particles, avg v = 12.4 m/s, KE = 0.83 J' },
  { id: 'fluid',    name: 'Fluid',      emoji: '🌊',  color: '#0ea5e9', result: 'Flow stable Re = 4 200, viscosity = 0.001 Pa·s' },
  { id: 'quantum',  name: 'Quantum',    emoji: '🔬',  color: '#8b5cf6', result: 'Fidelity: 0.94 · depth: 12 · gates: 24 · qubits: 8' },
  { id: 'neural',   name: 'Neural',     emoji: '🧠',  color: '#ec4899', result: 'Convergence: 0.003 · epochs: 100 · accuracy: 97.2%' },
];

const LANGUAGES: Array<{ id: Language; label: string; emoji: string }> = [
  { id: 'python',     label: 'Python',     emoji: '🐍' },
  { id: 'javascript', label: 'JavaScript', emoji: '📜' },
  { id: 'bash',       label: 'Bash',       emoji: '🖥️'  },
];

const DEMO_CODE: Record<Language, string> = {
  python: `# Lab Dream — Python IDE
# Select a simulation above, then Run ▶

import numpy as np

# Sample data
data = np.array([1, 4, 9, 16, 25, 36, 49])
print("Data:", data)
print("Mean:", data.mean())
print("Std:", data.std().round(2))

# Simulate experiment
for i in range(3):
    result = np.random.normal(loc=0, scale=1)
    print(f"Trial {i+1}: {result:.4f}")

print("\\n✅ Experiment complete")`,

  javascript: `// Lab Dream — JavaScript
// Select a simulation above, then Run ▶

const data = [1, 4, 9, 16, 25, 36, 49];
const mean = data.reduce((a, b) => a + b, 0) / data.length;
const std  = Math.sqrt(data.map(x => (x - mean) ** 2).reduce((a, b) => a + b) / data.length);

console.log('Data:', data);
console.log('Mean:', mean.toFixed(2));
console.log('Std: ', std.toFixed(2));

for (let i = 0; i < 3; i++) {
  const result = (Math.random() - 0.5) * 2;
  console.log(\`Trial \${i+1}: \${result.toFixed(4)}\`);
}
console.log('\\n✅ Experiment complete');`,

  bash: `#!/usr/bin/env bash
# Lab Dream — Bash
# Select a simulation above, then Run ▶

set -e
echo "== Lab Dream Pipeline =="

echo "Installing dependencies…"
pip install numpy scipy --quiet

echo "Running experiment…"
python3 -c "
import numpy as np
data = np.random.normal(0, 1, 1000)
print(f'n=1000  mean={data.mean():.3f}  std={data.std():.3f}')
"

echo "✅ All done!"`,
};

const VIZ_TYPES: Array<{ id: VizType; label: string; desc: string }> = [
  { id: 'heatmap',    label: '🌡️ Heatmap',              desc: 'High-density data distribution' },
  { id: 'density',    label: '💧 Simulation Density',   desc: 'Particle / fluid density field'  },
  { id: 'activation', label: '🧠 Neural Activation',    desc: 'Per-layer activation strength'   },
];

// ─── ASCII helpers ────────────────────────────────────────────────────────────

function asciiHeatmap(cols: number, rows: number, seed: number): string {
  const chars = ['░', '▒', '▓', '█'];
  let s = seed;
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      line += chars[Math.abs(s) % chars.length];
    }
    lines.push(line);
  }
  return lines.join('\n');
}

function asciiDensity(cols: number, rows: number, seed: number): string {
  const chars = [' ', '.', ':', '+', 'o', 'O', '#', '@'];
  let s = seed;
  const cx = cols / 2;
  const cy = rows / 2;
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
      const norm = Math.max(0, 1 - dist / (cols / 2));
      s = (s * 1103515245 + 12345) & 0xffffffff;
      const noise = (Math.abs(s) & 0xff) / 512;
      const idx = Math.min(chars.length - 1, Math.floor((norm + noise) * chars.length));
      line += chars[idx];
    }
    lines.push(line);
  }
  return lines.join('\n');
}

function asciiActivation(layers: number[], seed: number): string {
  const chars = ['·', '▫', '▪', '◾', '◼', '■'];
  let s = seed;
  const lines: string[] = [];
  const maxW = Math.max(...layers);
  layers.forEach((width, i) => {
    const pad = Math.floor((maxW - width) / 2);
    let row = ' '.repeat(pad);
    for (let n = 0; n < width; n++) {
      s = (s * 22695477 + 1) & 0xffffffff;
      row += chars[Math.abs(s) % chars.length] + ' ';
    }
    const activation = ((Math.abs(s) & 0xff) / 255).toFixed(2);
    lines.push(`L${i + 1} ${row.trimEnd().padEnd(maxW * 2 + 2)}  σ=${activation}`);
  });
  return lines.join('\n');
}

// ─── Simulated output generation ──────────────────────────────────────────────

function getMockOutput(language: Language, simId: SimId): string[] {
  const ts = () => new Date().toISOString().slice(11, 19);
  const sim = SIMS.find(s => s.id === simId);

  if (simId !== 'none' && sim) {
    return [
      `[${ts()}] Lab Dream ● ${sim.emoji} ${sim.name} simulation`,
      `[${ts()}] Connecting to LabEngin…`,
      `[${ts()}] Initialising ${language} runtime`,
      `[${ts()}] Running computation…`,
      `[${ts()}] Result: ${sim.result}`,
      `[${ts()}] Memory allocated: 128 MB`,
      `[${ts()}] Wall time: ${(Math.random() * 900 + 200).toFixed(0)} ms`,
      `[${ts()}] ✅ Simulation complete`,
    ];
  }

  switch (language) {
    case 'python': return [
      `Python 3.12.0 [DREAMengin LabEngin runtime]`,
      `>>> Executing script…`,
      `Data: [ 1  4  9 16 25 36 49]`,
      `Mean: 20.0`,
      `Std: 16.04`,
      `Trial 1:  0.3812`,
      `Trial 2: -0.7193`,
      `Trial 3:  1.1047`,
      ``,
      `✅ Experiment complete`,
    ];
    case 'javascript': return [
      `Node.js v22 [DREAMengin LabEngin runtime]`,
      `> Executing…`,
      `Data: [1, 4, 9, 16, 25, 36, 49]`,
      `Mean: 20.00`,
      `Std:  16.04`,
      `Trial 1: 0.3812`,
      `Trial 2: -0.7193`,
      `Trial 3: 1.1047`,
      ``,
      `✅ Experiment complete`,
    ];
    case 'bash': return [
      `bash 5.2 [DREAMengin LabEngin runtime]`,
      `$ Executing…`,
      `== Lab Dream Pipeline ==`,
      `Installing dependencies…`,
      `Running experiment…`,
      `n=1000  mean=-0.012  std=0.998`,
      `✅ All done!`,
    ];
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LabDreamIDE() {
  const [language,  setLanguage]  = useState<Language>('python');
  const [code,      setCode]      = useState(DEMO_CODE.python);
  const [simId,     setSimId]     = useState<SimId>('none');
  const [status,    setStatus]    = useState<RunStatus>('idle');
  const [lines,     setLines]     = useState<string[]>([]);
  const [vizType,   setVizType]   = useState<VizType>('heatmap');
  const [vizSeed,   setVizSeed]   = useState(42);
  const outputRef = useRef<HTMLDivElement>(null);

  // Swap & live-mode state
  const [swapped,  setSwapped]  = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const liveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load swap preference from localStorage on mount (client-only)
  useEffect(() => {
    setSwapped(getSwap('lab'));
  }, []);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    setCode(DEMO_CODE[lang]);
    setLines([]);
    setStatus('idle');
  }, []);

  const handleRun = useCallback(() => {
    if (status === 'running') return;
    setStatus('running');
    setLines([]);

    // Emit lab:run so LabEngin / any other subscriber can react
    dualRuntimeBridge.emit('lab', 'lab:run', { language, code, simId });

    const mockLines = getMockOutput(language, simId);
    mockLines.forEach((line, i) => {
      setTimeout(() => {
        setLines(prev => {
          const next = [...prev, line];
          if (i === mockLines.length - 1) {
            setStatus('done');
            setVizSeed(s => s + 7);
            // Emit completed result
            dualRuntimeBridge.emit('lab', 'lab:result', { lines: next, status: 'done' });
          }
          return next;
        });
      }, 130 * (i + 1));
    });
  }, [status, language, simId, code]);

  // Ref to always call the latest version of handleRun from the live-mode effect
  const handleRunRef = useRef(handleRun);

  const handleStop = useCallback(() => {
    setStatus('error');
    setLines(prev => {
      const next = [...prev, `[${new Date().toISOString().slice(11, 19)}] ⛔ Stopped`];
      dualRuntimeBridge.emit('lab', 'lab:result', { lines: next, status: 'error' });
      return next;
    });
  }, []);

  // Toggle swap — persists to localStorage
  const handleSwap = useCallback(() => {
    const next = toggleSwap('lab');
    setSwapped(next);
  }, []);

  // Live mode — debounce code changes and auto-run (300 ms)
  // Use a ref so the effect always calls the latest handleRun without
  // needing to list all of its own dependencies (avoids stale closures).
  useEffect(() => { handleRunRef.current = handleRun; }, [handleRun]);
  useEffect(() => {
    if (!liveMode) return;
    if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
    liveTimerRef.current = setTimeout(() => {
      handleRunRef.current();
    }, 300);
    return () => {
      if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
    };
  }, [code, liveMode]);

  const activeSim = SIMS.find(s => s.id === simId) ?? SIMS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Simulation Selector ───────────────────────────────── */}
      <div className="de-widget" style={{ marginBottom: 12 }}>
        <div className="de-widget-header">
          <FlaskConical className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="de-widget-title ml-2">Simulation Target</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: activeSim.color, fontWeight: 700,
            background: `${activeSim.color}15`, padding: '2px 8px', borderRadius: 5 }}>
            {activeSim.emoji} {activeSim.name}
          </span>
        </div>
        <div className="de-widget-body" style={{ paddingBottom: 6 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SIMS.map(sim => (
              <button
                key={sim.id}
                type="button"
                onClick={() => { setSimId(sim.id); setLines([]); setStatus('idle'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                  border: `1.5px solid ${simId === sim.id ? sim.color : 'rgba(160,195,240,0.22)'}`,
                  background: simId === sim.id ? `${sim.color}12` : 'rgba(255,255,255,0.55)',
                  color: simId === sim.id ? sim.color : 'var(--de-text)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                aria-label={`Select ${sim.name} simulation`}
              >
                {sim.emoji} {sim.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── IDE Split: input left + output right ──────────────── */}
      <div className="de-widget" style={{ marginBottom: 12 }}>
        <div className="de-widget-header" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Activity className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="de-widget-title ml-1">Lab IDE</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleLanguageChange(lang.id)}
                style={{
                  padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  border: `1.5px solid ${language === lang.id ? ACCENT : 'rgba(160,195,240,0.22)'}`,
                  background: language === lang.id ? `${ACCENT}15` : 'rgba(255,255,255,0.55)',
                  color: language === lang.id ? ACCENT : 'var(--de-text)',
                  cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                {lang.emoji} {lang.label}
              </button>
            ))}
          </div>

          {/* Live / Manual mode toggle */}
          <button
            type="button"
            onClick={() => setLiveMode(m => !m)}
            title={liveMode ? 'Switch to Manual mode' : 'Switch to Live mode (auto-run on change)'}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              border: `1.5px solid ${liveMode ? '#f59e0b' : 'rgba(160,195,240,0.22)'}`,
              background: liveMode ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.55)',
              color: liveMode ? '#f59e0b' : 'var(--de-text-dim)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
            aria-label={liveMode ? 'Live mode active' : 'Manual mode active'}
          >
            {liveMode
              ? <><Zap className="w-3 h-3" /> Live</>
              : <><MousePointerClick className="w-3 h-3" /> Manual</>}
          </button>

          {/* Swap button */}
          <button
            type="button"
            onClick={handleSwap}
            title={swapped ? 'Output left · Editor right — click to swap back' : 'Editor left · Output right — click to swap'}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              border: `1.5px solid ${swapped ? ACCENT : 'rgba(160,195,240,0.22)'}`,
              background: swapped ? `${ACCENT}12` : 'rgba(255,255,255,0.55)',
              color: swapped ? ACCENT : 'var(--de-text-dim)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
            aria-label="Swap editor and output panels"
          >
            <ArrowLeftRight className="w-3 h-3" /> Swap
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, minHeight: 320 }}>

          {/* ── OUTPUT panel — left when swapped ── */}
          {swapped && (
            <div style={{ borderRight: '1px solid rgba(160,195,240,0.15)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid rgba(160,195,240,0.1)',
                fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 6 }}>
                OUTPUT
                <span style={{ marginLeft: 'auto' }}>
                  {status === 'running' && <span style={{ fontSize: 10, color: '#f59e0b' }}>● Live</span>}
                  {status === 'done'    && <span style={{ fontSize: 10, color: OUT_OK   }}>✓ Complete</span>}
                </span>
              </div>
              <div ref={outputRef} style={{ flex: 1, minHeight: 256, overflowY: 'auto', background: CODE_BG, padding: '12px 14px' }}>
                {lines.length === 0 && status === 'idle' && (
                  <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', fontFamily: 'monospace' }}>Results appear here after Run ▶…</p>
                )}
                {lines.map((line, i) => (
                  <pre key={i} style={{ margin: 0, fontSize: 11, fontFamily: '"Fira Code",ui-monospace,monospace',
                    color: line.startsWith('[') ? OUT_OK : (line.startsWith('$') || line.startsWith('>>>')) ? '#93c5fd' : line.startsWith('⛔') ? OUT_ERR : line.startsWith('✅') ? OUT_OK : CODE_FG,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55 }}>
                    {line}
                  </pre>
                ))}
                {status === 'running' && <span style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'monospace' }}>▋</span>}
              </div>
              <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(160,195,240,0.1)',
                background: 'rgba(255,255,255,0.4)', fontSize: 10, color: 'var(--de-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FlaskConical className="w-3 h-3" style={{ color: activeSim.color }} />
                {activeSim.emoji} {activeSim.name} · {language}
              </div>
            </div>
          )}

          {/* ── INPUT panel (editor) — left when not swapped, right when swapped ── */}
          {!swapped && (
            <div style={{ borderRight: '1px solid rgba(160,195,240,0.15)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid rgba(160,195,240,0.1)',
                fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 6 }}>
                INPUT
                <span style={{ marginLeft: 'auto', fontSize: 10, color: ACCENT }}>{language.toUpperCase()}</span>
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                aria-label="Lab script input"
                style={{
                  flex: 1, minHeight: 256,
                  background: CODE_BG, color: CODE_FG,
                  fontFamily: '"Fira Code","JetBrains Mono","Cascadia Code",ui-monospace,monospace',
                  fontSize: 12, lineHeight: 1.65, padding: '12px 14px',
                  border: 'none', outline: 'none', resize: 'none',
                  whiteSpace: 'pre', overflowX: 'auto',
                }}
              />
              <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(160,195,240,0.1)',
                display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.4)' }}>
                {liveMode ? (
                  <span style={{ fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap className="w-3.5 h-3.5" /> Live — auto-runs on change
                  </span>
                ) : (
                  <button type="button" onClick={handleRun} disabled={status === 'running'} aria-label="Run lab script"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                      border: 'none', cursor: status === 'running' ? 'not-allowed' : 'pointer',
                      background: status === 'running' ? `${ACCENT}20` : ACCENT,
                      color: status === 'running' ? ACCENT : '#fff',
                      transition: 'all 0.15s', opacity: status === 'running' ? 0.7 : 1 }}>
                    {status === 'running' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…</> : <><Play className="w-3.5 h-3.5" /> Run ▶</>}
                  </button>
                )}
                {status === 'running' && !liveMode && (
                  <button type="button" onClick={handleStop}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                      border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.08)', color: OUT_ERR, cursor: 'pointer' }}>
                    <StopCircle className="w-3.5 h-3.5" /> Stop
                  </button>
                )}
                {status === 'done' && (
                  <span style={{ fontSize: 11, color: OUT_OK, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Done
                  </span>
                )}
                <button type="button" onClick={() => { setCode(DEMO_CODE[language]); setLines([]); setStatus('idle'); }}
                  title="Reset" style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: 6, fontSize: 10,
                    border: '1px solid rgba(160,195,240,0.22)', background: 'rgba(0,0,0,0.03)',
                    color: 'var(--de-text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              </div>
            </div>
          )}

          {/* ── OUTPUT panel — right when not swapped ── */}
          {!swapped && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid rgba(160,195,240,0.1)',
                fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 6 }}>
                OUTPUT
                <span style={{ marginLeft: 'auto' }}>
                  {status === 'running' && <span style={{ fontSize: 10, color: '#f59e0b' }}>● Live</span>}
                  {status === 'done'    && <span style={{ fontSize: 10, color: OUT_OK   }}>✓ Complete</span>}
                </span>
              </div>
              <div ref={outputRef} style={{ flex: 1, minHeight: 256, overflowY: 'auto', background: CODE_BG, padding: '12px 14px' }}>
                {lines.length === 0 && status === 'idle' && (
                  <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', fontFamily: 'monospace' }}>
                    Results appear here after Run ▶…
                  </p>
                )}
                {lines.map((line, i) => (
                  <pre key={i} style={{
                    margin: 0, fontSize: 11, fontFamily: '"Fira Code",ui-monospace,monospace',
                    color: line.startsWith('[') ? OUT_OK
                      : line.startsWith('$') || line.startsWith('>>>') ? '#93c5fd'
                      : line.startsWith('⛔') ? OUT_ERR
                      : line.startsWith('✅') ? OUT_OK
                      : CODE_FG,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55,
                  }}>
                    {line}
                  </pre>
                ))}
                {status === 'running' && (
                  <span style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'monospace' }}>▋</span>
                )}
              </div>
              <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(160,195,240,0.1)',
                background: 'rgba(255,255,255,0.4)', fontSize: 10, color: 'var(--de-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FlaskConical className="w-3 h-3" style={{ color: activeSim.color }} />
                {activeSim.emoji} {activeSim.name} · {language}
              </div>
            </div>
          )}

          {/* ── INPUT panel (editor) — right when swapped ── */}
          {swapped && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid rgba(160,195,240,0.1)',
                fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 6 }}>
                INPUT
                <span style={{ marginLeft: 'auto', fontSize: 10, color: ACCENT }}>{language.toUpperCase()}</span>
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                aria-label="Lab script input"
                style={{
                  flex: 1, minHeight: 256,
                  background: CODE_BG, color: CODE_FG,
                  fontFamily: '"Fira Code","JetBrains Mono","Cascadia Code",ui-monospace,monospace',
                  fontSize: 12, lineHeight: 1.65, padding: '12px 14px',
                  border: 'none', outline: 'none', resize: 'none',
                  whiteSpace: 'pre', overflowX: 'auto',
                }}
              />
              <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(160,195,240,0.1)',
                display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.4)' }}>
                {liveMode ? (
                  <span style={{ fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap className="w-3.5 h-3.5" /> Live — auto-runs on change
                  </span>
                ) : (
                  <button type="button" onClick={handleRun} disabled={status === 'running'} aria-label="Run lab script"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                      border: 'none', cursor: status === 'running' ? 'not-allowed' : 'pointer',
                      background: status === 'running' ? `${ACCENT}20` : ACCENT,
                      color: status === 'running' ? ACCENT : '#fff',
                      transition: 'all 0.15s', opacity: status === 'running' ? 0.7 : 1 }}>
                    {status === 'running' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…</> : <><Play className="w-3.5 h-3.5" /> Run ▶</>}
                  </button>
                )}
                {status === 'running' && !liveMode && (
                  <button type="button" onClick={handleStop}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                      border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.08)', color: OUT_ERR, cursor: 'pointer' }}>
                    <StopCircle className="w-3.5 h-3.5" /> Stop
                  </button>
                )}
                {status === 'done' && (
                  <span style={{ fontSize: 11, color: OUT_OK, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Done
                  </span>
                )}
                <button type="button" onClick={() => { setCode(DEMO_CODE[language]); setLines([]); setStatus('idle'); }}
                  title="Reset" style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: 6, fontSize: 10,
                    border: '1px solid rgba(160,195,240,0.22)', background: 'rgba(0,0,0,0.03)',
                    color: 'var(--de-text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Visualization Panel: 3 high-density maps ─────────── */}
      <div className="de-widget" style={{ marginBottom: 12 }}>
        <div className="de-widget-header">
          <BarChart2 className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="de-widget-title ml-2">Visualizations</span>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {VIZ_TYPES.map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVizType(v.id)}
                title={v.desc}
                style={{
                  padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                  border: `1px solid ${vizType === v.id ? ACCENT : 'rgba(160,195,240,0.2)'}`,
                  background: vizType === v.id ? `${ACCENT}12` : 'rgba(255,255,255,0.4)',
                  color: vizType === v.id ? ACCENT : 'var(--de-text-dim)', cursor: 'pointer',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="de-widget-body">
          {/* Three side-by-side visualizations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>

            {/* Viz 1 — always show full heatmap */}
            <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: ACCENT, letterSpacing: '0.07em', marginBottom: 4 }}>
                HEATMAP
              </div>
              <pre style={{ margin: 0, fontFamily: '"Fira Code",monospace', fontSize: 10, lineHeight: 1.3,
                color: '#4ade80', letterSpacing: 1, overflowX: 'auto', whiteSpace: 'pre' }}>
                {asciiHeatmap(14, 6, vizSeed)}
              </pre>
              <div style={{ fontSize: 8, color: 'var(--de-text-dim)', marginTop: 4 }}>
                Data distribution · {lines.length} pts
              </div>
            </div>

            {/* Viz 2 — density field */}
            <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.15)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.07em', marginBottom: 4 }}>
                DENSITY FIELD
              </div>
              <pre style={{ margin: 0, fontFamily: '"Fira Code",monospace', fontSize: 10, lineHeight: 1.3,
                color: '#38bdf8', letterSpacing: 1, overflowX: 'auto', whiteSpace: 'pre' }}>
                {asciiDensity(14, 6, vizSeed + 11)}
              </pre>
              <div style={{ fontSize: 8, color: 'var(--de-text-dim)', marginTop: 4 }}>
                Particle density · {activeSim.emoji} {activeSim.name}
              </div>
            </div>

            {/* Viz 3 — neural activation */}
            <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.07em', marginBottom: 4 }}>
                ACTIVATION MAP
              </div>
              <pre style={{ margin: 0, fontFamily: '"Fira Code",monospace', fontSize: 9, lineHeight: 1.4,
                color: '#c084fc', letterSpacing: 1, overflowX: 'auto', whiteSpace: 'pre' }}>
                {asciiActivation([4, 8, 6, 4, 2], vizSeed + 31)}
              </pre>
              <div style={{ fontSize: 8, color: 'var(--de-text-dim)', marginTop: 4 }}>
                Neural layer activations
              </div>
            </div>
          </div>

          {/* Refresh viz button */}
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setVizSeed(s => s + Math.ceil(Math.random() * 100))}
              style={{ padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                border: `1px solid ${ACCENT}30`, background: `${ACCENT}0a`, color: ACCENT,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              aria-label="Refresh visualizations"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
