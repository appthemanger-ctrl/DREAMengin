'use client';

/**
 * CodeDreamIDE — Live IDE split view for the Code Daydream (Side A).
 *
 * Layout:
 *   [ Engine strip ]
 *   [ Language / mode bar ]
 *   [ Code editor (left) | Live preview / output (right) ]
 *   [ Dr. Eams quick assist bar ]
 *
 * Follows the existing DREAMengin coding patterns (no eval, simulation only).
 * All engine outputs are simulated; the Dr. Eams call uses /api/ai/eams
 * with code_context so that the backend AI can respond in code-assist mode.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, StopCircle, Loader2, CheckCircle, Bot, Monitor, Database, Gamepad2, FlaskConical, Box, BarChart2, RefreshCw, ArrowLeftRight, Zap, MousePointerClick } from 'lucide-react';
import { getSwap, toggleSwap } from '@/lib/runtime/swapManager';
import { bridge as dualRuntimeBridge } from '@/lib/runtime/dualRuntimeBridge';
import { dreamOSBus } from '@/lib/runtime/dreamOSBus';

// ─── Types ────────────────────────────────────────────────────────────────────

type Language = 'python' | 'javascript' | 'typescript' | 'bash';
type EngineId = 'game' | 'lab' | 'sim' | 'asset' | 'none';
type PreviewMode = 'terminal' | 'data' | 'game' | 'canvas';
type RunStatus = 'idle' | 'running' | 'done' | 'error';

interface EngineConn {
  id:          EngineId;
  label:       string;
  color:       string;
  accent:      string;
  description: string;
  icon:        React.ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT      = '#6366f1';
const CODE_BG     = '#0d1117';
const CODE_FG     = '#e2e8f0';
const OUT_OK      = '#4ade80';
const OUT_ERR     = '#f87171';

const LANGUAGES: { id: Language; label: string; emoji: string }[] = [
  { id: 'python',     label: 'Python',     emoji: '🐍' },
  { id: 'javascript', label: 'JavaScript', emoji: '📜' },
  { id: 'typescript', label: 'TypeScript', emoji: '🔷' },
  { id: 'bash',       label: 'Bash',       emoji: '🖥️'  },
];

const ENGINE_CONNECTIONS: EngineConn[] = [
  {
    id: 'none',  label: 'Standalone',   color: 'rgba(160,195,240,0.15)', accent: '#94a3b8',
    description: 'No engine connected — plain output',
    icon: <Monitor className="w-3.5 h-3.5" />,
  },
  {
    id: 'game',  label: 'GameEngin',    color: 'rgba(139,92,246,0.12)',  accent: '#8b5cf6',
    description: 'Babylon.js · ECS · physics · render pipeline',
    icon: <Gamepad2 className="w-3.5 h-3.5" />,
  },
  {
    id: 'lab',   label: 'LabEngin',     color: 'rgba(34,197,94,0.12)',   accent: '#22c55e',
    description: 'Particle · fluid · quantum · neural simulations',
    icon: <FlaskConical className="w-3.5 h-3.5" />,
  },
  {
    id: 'sim',   label: 'SimEngin',     color: 'rgba(14,165,233,0.12)',  accent: '#0ea5e9',
    description: 'Physics engine · density maps · parameter sweeps',
    icon: <Box className="w-3.5 h-3.5" />,
  },
  {
    id: 'asset', label: 'AssetEngin',   color: 'rgba(245,158,11,0.12)',  accent: '#f59e0b',
    description: 'Meshes · textures · sprites · audio assets',
    icon: <Database className="w-3.5 h-3.5" />,
  },
];

const PREVIEW_MODES: { id: PreviewMode; label: string }[] = [
  { id: 'terminal', label: '⬛ Terminal' },
  { id: 'data',     label: '📊 Data'    },
  { id: 'game',     label: '🎮 Game'    },
  { id: 'canvas',   label: '🎨 Canvas'  },
];

const DEMO_CODE: Record<Language, string> = {
  python: `# DREAMengin Code Dream
# Connect to any Engine below, then Run ▶

import dream_engine as de

# Load a scene
scene = de.Scene(engine='game')
player = scene.add_entity('player', mesh='humanoid')
player.set_position(0, 1.5, 0)

# Run physics
scene.gravity = -9.8
scene.step(frames=60)

print(f"Player position: {player.position}")
print(f"FPS: {scene.fps}")`,

  javascript: `// DREAMengin Code Dream — JavaScript
// Connect to an Engine below, then Run ▶

const engine = await DreamEngine.connect('game');
const scene  = engine.createScene();

const box = scene.createMesh('box', { size: 1 });
box.position = { x: 0, y: 2, z: 0 };

scene.enablePhysics({ gravity: -9.8 });
box.addPhysicsImpostor('box', { mass: 1 });

console.log('Scene ready:', scene.id);
console.log('Entities:', scene.entityCount);`,

  typescript: `// DREAMengin Code Dream — TypeScript
// Connect to an Engine below, then Run ▶

import { DreamEngine, Scene, Mesh } from '@dreamengin/sdk';

const engine: DreamEngine = await DreamEngine.connect('game');
const scene:  Scene       = engine.createScene();

const player: Mesh = scene.createMesh('sphere', { diameter: 1.2 });
player.position = { x: 0, y: 1.5, z: 0 };

scene.onBeforeRender(() => {
  player.rotate({ y: 0.01 });
});

console.log('TypeScript scene active:', scene.id);`,

  bash: `#!/usr/bin/env bash
# DREAMengin Code Dream — Bash
# Connect to an Engine below, then Run ▶

set -e

echo "== DREAMengin Build Pipeline =="
echo "Installing dependencies…"
pnpm install --frozen-lockfile

echo "Type-checking…"
pnpm typecheck

echo "Running tests…"
pnpm exec vitest run --reporter=verbose

echo "✅ All systems go!"`,
};

// ─── Simulated engine outputs ─────────────────────────────────────────────────

function getMockOutput(language: Language, engine: EngineId, code: string): string[] {
  const ts = () => new Date().toISOString().slice(11, 19);

  // Scan code for sim keywords to enrich output
  const hasParticle = /particle/i.test(code);
  const hasFluid    = /fluid/i.test(code);
  const hasNeural   = /neural|train/i.test(code);
  const hasQuantum  = /quantum/i.test(code);

  if (engine === 'game') {
    return [
      `[${ts()}] GameEngin ● Connected  Babylon.js v8.4`,
      `[${ts()}] Scene created — id: scene_${Math.random().toString(36).slice(2, 8)}`,
      `[${ts()}] Physics engine: Havok  gravity: -9.8 m/s²`,
      `[${ts()}] ECS world: 124 entities registered`,
      `[${ts()}] Mesh "player" loaded  verts: 2048  tris: 4096`,
      `[${ts()}] PBR material applied  roughness: 0.4  metalness: 0.6`,
      `[${ts()}] SSAO2 enabled  kernel: 16  radius: 0.3`,
      `[${ts()}] Render pipeline: ✓ ACES tone mapping  ✓ TAA  ✓ Bloom`,
      `[${ts()}] Frame budget: 16.6ms  FPS: 60  draw calls: 24`,
      `[${ts()}] ✅ Scene ready — runtime active`,
    ];
  }

  if (engine === 'lab') {
    const simResult = hasParticle ? '1024 particles, avg v=12.4m/s, energy=0.83J'
      : hasFluid ? 'Flow stable Re=4200, viscosity=0.001Pa·s'
      : hasNeural ? 'Convergence: 0.003, epochs=100, accuracy=97.2%'
      : hasQuantum ? 'Fidelity: 0.94, depth=12, gates=24'
      : '42 data points processed, σ=2.31';
    return [
      `[${ts()}] LabEngin ● Connected`,
      `[${ts()}] Experiment: code_dream_${Date.now()}`,
      `[${ts()}] Simulation engine: WebGPU tier HIGH`,
      `[${ts()}] Running analysis…`,
      `[${ts()}] Result: ${simResult}`,
      `[${ts()}] Memory: 128MB  VRAM: 64MB`,
      `[${ts()}] ✅ Experiment complete`,
    ];
  }

  if (engine === 'sim') {
    return [
      `[${ts()}] SimEngin ● Connected`,
      `[${ts()}] Particle count: 65536  timestep: 0.016s`,
      `[${ts()}] Spatial hash grid: 256×256 cells`,
      `[${ts()}] Density field computed  max: 1.84 kg/m³`,
      `[${ts()}] Pressure solve: 12 iterations  residual: 1.2e-6`,
      `[${ts()}] Velocity: avg=4.7m/s  max=18.2m/s`,
      `[${ts()}] ✅ Simulation step complete`,
    ];
  }

  if (engine === 'asset') {
    return [
      `[${ts()}] AssetEngin ● Connected`,
      `[${ts()}] Asset registry: 847 assets`,
      `[${ts()}] Loaded: player_humanoid.glb (24.1 KB)`,
      `[${ts()}] Loaded: ground_plane.glb (2.3 KB)`,
      `[${ts()}] Loaded: sky_hdri.exr (1.2 MB)`,
      `[${ts()}] Texture atlas: 4096×4096  8 channels`,
      `[${ts()}] ✅ Assets ready`,
    ];
  }

  // Standalone
  switch (language) {
    case 'python':     return [`Python 3.12.0 [DREAMengin runtime]`, `>>> Executing…`, `BPM: 128`, `Game score: 9999`, `>>> Done.`];
    case 'javascript': return [`Node.js v22 [DREAMengin runtime]`, `> Executing…`, `[{"game":"platformer","score":9999}]`, `> Done.`];
    case 'typescript': return [`TypeScript 5.7.2 [DREAMengin runtime]`, `> Compiling…`, `✓ Compiled in 120ms`, `{ result: "success" }`, `> Done.`];
    case 'bash':       return [`bash 5.2 [DREAMengin runtime]`, `$ Executing…`, `✓ 291 tests passed in 1.24s`, `$ Exit 0`];
  }
}

// ─── ASCII visualizations ─────────────────────────────────────────────────────

function AsciiHeatmap({ cols = 32, rows = 6, seed = 42 }: { cols?: number; rows?: number; seed?: number }) {
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
  return (
    <pre style={{ margin: 0, fontFamily: '"Fira Code", monospace', fontSize: 11, lineHeight: 1.4, color: '#4ade80', letterSpacing: 1 }}>
      {lines.join('\n')}
    </pre>
  );
}

function AsciiBarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 60 }}>
      {values.map((v, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
          <div style={{ fontSize: 9, color: '#4ade80', fontWeight: 700 }}>{v}</div>
          <div style={{ width: '100%', background: '#4ade80', borderRadius: '2px 2px 0 0', height: `${(v / max) * 44}px` }} />
          <div style={{ fontSize: 8, color: 'var(--de-text-dim)', textAlign: 'center', lineHeight: 1.2 }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CodeDreamIDE() {
  const [language,     setLanguage]    = useState<Language>('python');
  const [code,         setCode]        = useState(DEMO_CODE.python);
  const [engine,       setEngine]      = useState<EngineId>('none');
  const [previewMode,  setPreviewMode] = useState<PreviewMode>('terminal');
  const [status,       setStatus]      = useState<RunStatus>('idle');
  const [outputLines,  setOutputLines] = useState<string[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  // Swap & live-mode state
  const [swapped,   setSwapped]   = useState(false);
  const [liveMode,  setLiveMode]  = useState(false);
  const liveTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load swap preference from localStorage on mount (client-only)
  useEffect(() => {
    setSwapped(getSwap('code'));
  }, []);

  // Dr. Eams quick assist
  const [eamsPrompt,   setEamsPrompt]  = useState('');
  const [eamsReply,    setEamsReply]   = useState('');
  const [eamsLoading,  setEamsLoading] = useState(false);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputLines]);

  // Reset code when language changes
  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    setCode(DEMO_CODE[lang]);
    setOutputLines([]);
    setStatus('idle');
  }, []);

  // Simulate run — streams output lines with a stagger
  const handleRun = useCallback(() => {
    if (status === 'running') return;
    setStatus('running');
    setOutputLines([]);

    // Emit code:run so CodeEngin / any other subscriber can react
    dualRuntimeBridge.emit('code', 'code:run', { language, code, engine });
    dreamOSBus.upsertArtifact({
      id: 'artifact:code:active-run',
      kind: 'code-run',
      title: 'Code runtime mirror',
      sourceSubsystem: 'CodeEngin',
      relatedSubsystems: ['LabEngin', 'Dr. Eams'],
      payload: { language, code, engine, liveMode },
    });

    const lines = getMockOutput(language, engine, code);
    lines.forEach((line, i) => {
      setTimeout(() => {
        setOutputLines(prev => {
          const next = [...prev, line];
          if (i === lines.length - 1) {
            setStatus('done');
            // Emit completed output
            dualRuntimeBridge.emit('code', 'code:output', { lines: next, status: 'done' });
            dreamOSBus.upsertArtifact({
              id: 'artifact:code:output',
              kind: 'code-output',
              title: 'Code output',
              sourceSubsystem: 'CodeEngin',
              relatedSubsystems: ['LabEngin', 'Dr. Eams'],
              payload: { language, engine, lines: next, status: 'done' },
            });
          }
          return next;
        });
      }, 120 * (i + 1));
    });
  }, [status, language, engine, code, liveMode]);

  // Ref to always call the latest version of handleRun from the live-mode effect
  const handleRunRef = useRef(handleRun);

  const handleStop = useCallback(() => {
    setStatus('error');
    setOutputLines(prev => {
      const next = [...prev, `[${new Date().toISOString().slice(11, 19)}] ⛔ Interrupted by user`];
      dualRuntimeBridge.emit('code', 'code:output', { lines: next, status: 'error' });
      dreamOSBus.upsertArtifact({
        id: 'artifact:code:output',
        kind: 'code-output',
        title: 'Code output',
        sourceSubsystem: 'CodeEngin',
        relatedSubsystems: ['LabEngin', 'Dr. Eams'],
        payload: { language, engine, lines: next, status: 'error' },
      });
      return next;
    });
  }, [engine, language]);

  // Toggle swap — persists to localStorage
  const handleSwap = useCallback(() => {
    const next = toggleSwap('code');
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

  // Dr. Eams quick assist — calls /api/ai/eams with code_context
  const handleEamsAssist = useCallback(async () => {
    if (!eamsPrompt.trim() || eamsLoading) return;
    setEamsLoading(true);
    setEamsReply('');
    try {
      const res = await fetch('/api/ai/eams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: eamsPrompt,
          ui: { route: '/daydream/code' },
          code_context: {
            language,
            selected_code: code.slice(0, 2000),
          },
        }),
      });
      const data = await res.json() as { response_text?: string };
      setEamsReply(data.response_text ?? 'Dr. Eams is thinking…');
    } catch {
      setEamsReply('⚠️ Dr. Eams is unavailable right now. Check your connection.');
    } finally {
      setEamsLoading(false);
    }
  }, [eamsPrompt, eamsLoading, language, code]);

  const activeEngine = ENGINE_CONNECTIONS.find(e => e.id === engine) ?? ENGINE_CONNECTIONS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Engine Connection Strip ───────────────────────────── */}
      <div className="de-widget" style={{ marginBottom: 12 }}>
        <div className="de-widget-header">
          <span className="de-widget-title">🔌 Engine Connection</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: activeEngine.accent, fontWeight: 700,
            background: `${activeEngine.accent}15`, padding: '2px 8px', borderRadius: 5 }}>
            {activeEngine.label}
          </span>
        </div>
        <div className="de-widget-body" style={{ paddingBottom: 6 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ENGINE_CONNECTIONS.map(eng => (
              <button
                key={eng.id}
                type="button"
                onClick={() => { setEngine(eng.id); setOutputLines([]); setStatus('idle'); }}
                title={eng.description}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                  border: `1.5px solid ${engine === eng.id ? eng.accent : 'rgba(160,195,240,0.22)'}`,
                  background: engine === eng.id ? eng.color : 'rgba(255,255,255,0.55)',
                  color: engine === eng.id ? eng.accent : 'var(--de-text)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                aria-label={`Connect to ${eng.label}`}
              >
                <span style={{ color: engine === eng.id ? eng.accent : 'var(--de-text-dim)' }}>{eng.icon}</span>
                {eng.label}
              </button>
            ))}
          </div>
          {engine !== 'none' && (
            <p style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 6, marginBottom: 0 }}>
              {activeEngine.description}
            </p>
          )}
        </div>
      </div>

      {/* ── IDE Split: code left + preview right ─────────────── */}
      <div
        className="de-widget"
        style={{ marginBottom: 12 }}
      >
        {/* Split header */}
        <div className="de-widget-header" style={{ gap: 8, flexWrap: 'wrap' }}>
          {/* Language selector */}
          <span className="de-widget-title">Live IDE</span>
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
            title={swapped ? 'Preview left · Editor right — click to swap back' : 'Editor left · Preview right — click to swap'}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              border: `1.5px solid ${swapped ? ACCENT : 'rgba(160,195,240,0.22)'}`,
              background: swapped ? `${ACCENT}12` : 'rgba(255,255,255,0.55)',
              color: swapped ? ACCENT : 'var(--de-text-dim)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
            aria-label="Swap editor and preview panels"
          >
            <ArrowLeftRight className="w-3 h-3" /> Swap
          </button>

          {/* Preview mode */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {PREVIEW_MODES.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPreviewMode(m.id)}
                style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                  border: `1px solid ${previewMode === m.id ? ACCENT : 'rgba(160,195,240,0.2)'}`,
                  background: previewMode === m.id ? `${ACCENT}12` : 'rgba(255,255,255,0.4)',
                  color: previewMode === m.id ? ACCENT : 'var(--de-text-dim)',
                  cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Split body — order controlled by `swapped` flag */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 0,
            minHeight: 320,
          }}
        >
          {/* Editor panel — rendered first when not swapped, second when swapped */}
          {swapped && (
            /* ── SWAPPED LEFT: Preview ── */
            <div style={{ borderRight: '1px solid rgba(160,195,240,0.15)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(160,195,240,0.1)',
                fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 6 }}>
                PREVIEW
                <span style={{ marginLeft: 'auto' }}>
                  {status === 'running' && (
                    <span style={{ fontSize: 10, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', animation: 'de-pulse 1s infinite' }} />
                      Live
                    </span>
                  )}
                  {status === 'done' && <span style={{ fontSize: 10, color: OUT_OK }}>✓ Complete</span>}
                </span>
              </div>
              <div ref={outputRef} style={{ flex: 1, minHeight: 260, overflowY: 'auto', background: CODE_BG, padding: '12px 14px' }}>
                {previewMode === 'terminal' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {outputLines.length === 0 && status === 'idle' && (
                      <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.45)', fontFamily: 'monospace' }}>Press Run ▶ to execute…</p>
                    )}
                    {outputLines.map((line, i) => (
                      <pre key={i} style={{ margin: 0, fontSize: 11, fontFamily: '"Fira Code",ui-monospace,monospace',
                        color: line.startsWith('[') ? OUT_OK : line.startsWith('>>>') ? '#93c5fd' : line.startsWith('$') ? '#fbbf24' : (line.startsWith('⛔') || line.startsWith('Error')) ? OUT_ERR : CODE_FG,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55 }}>
                        {line}
                      </pre>
                    ))}
                    {status === 'running' && <span style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'monospace' }}>▋</span>}
                  </div>
                )}
                {previewMode === 'data' && (
                  <div style={{ padding: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.6)', marginBottom: 10, letterSpacing: '0.06em' }}>DATA VISUALIZATION</div>
                    <AsciiHeatmap cols={30} rows={5} seed={42 + outputLines.length} />
                    <div style={{ marginTop: 14, fontSize: 10, color: 'rgba(148,163,184,0.45)' }}>High-density map · {outputLines.length} frames</div>
                    {outputLines.length > 0 && <div style={{ marginTop: 12 }}><AsciiBarChart values={[38, 61, 54, 82, 47, 73]} labels={['CPU', 'GPU', 'MEM', 'VRAM', 'NET', 'I/O']} /></div>}
                  </div>
                )}
                {previewMode === 'game' && (
                  <div style={{ padding: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.6)', marginBottom: 10, letterSpacing: '0.06em' }}>GAME ENGINE VIEW</div>
                    <div style={{ border: '1px solid rgba(139,92,246,0.3)', borderRadius: 6, padding: 10, background: 'rgba(139,92,246,0.04)', fontFamily: 'monospace', fontSize: 10, color: '#c084fc', lineHeight: 1.8 }}>
                      Scene: {outputLines.length > 0 ? 'scene_active' : 'waiting…'}<br />
                      Entities: {outputLines.length > 0 ? '124' : '0'}<br />
                      FPS: {outputLines.length > 0 ? '60' : '—'}<br />
                      Draw calls: {outputLines.length > 0 ? '24' : '—'}<br />
                      Physics: {engine === 'game' && outputLines.length > 0 ? 'Havok ●' : 'idle'}<br /><br />
                      {outputLines.length > 0 ? (
                        <>┌──────────────────────┐<br />│  ░░░░░░░░░░░░░░░░░░  │<br />│  ░░░░░ 👾 ░░░░░░░░  │<br />│  ░░░░░░░░░░░░░░░░░░  │<br />│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │<br />└──────────────────────┘</>
                      ) : '   [waiting for run…]'}
                    </div>
                  </div>
                )}
                {previewMode === 'canvas' && (
                  <div style={{ padding: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.6)', marginBottom: 10, letterSpacing: '0.06em' }}>CANVAS OUTPUT</div>
                    <AsciiHeatmap cols={28} rows={8} seed={17 + outputLines.length * 3} />
                    <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(148,163,184,0.45)' }}>
                      Render output · {language} · {engine !== 'none' ? activeEngine.label : 'standalone'}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(160,195,240,0.1)', background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--de-text-dim)' }}>
                <span style={{ color: activeEngine.accent }}>{activeEngine.icon}</span>
                {activeEngine.label} · {language} · {previewMode} mode
              </div>
            </div>
          )}

          {/* ── Editor panel (left when not swapped) ── */}
          {!swapped && (
          <div style={{ borderRight: '1px solid rgba(160,195,240,0.15)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(160,195,240,0.1)',
              fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: 6 }}>
              EDITOR
              <span style={{ marginLeft: 'auto', fontSize: 10, color: ACCENT, fontWeight: 600 }}>
                {language.toUpperCase()}
              </span>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              aria-label="Code editor"
              style={{
                flex: 1, minHeight: 260,
                background: CODE_BG, color: CODE_FG,
                fontFamily: '"Fira Code","JetBrains Mono","Cascadia Code",ui-monospace,monospace',
                fontSize: 12, lineHeight: 1.65, padding: '12px 14px',
                border: 'none', outline: 'none', resize: 'none',
                whiteSpace: 'pre', overflowX: 'auto',
              }}
            />
            {/* Run / Stop bar */}
            <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(160,195,240,0.1)',
              display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.4)' }}>
              {liveMode ? (
                <span style={{ fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap className="w-3.5 h-3.5" /> Live — auto-runs on change
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={status === 'running'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                    border: 'none', cursor: status === 'running' ? 'not-allowed' : 'pointer',
                    background: status === 'running' ? 'rgba(99,102,241,0.15)' : ACCENT,
                    color: status === 'running' ? ACCENT : '#fff',
                    transition: 'all 0.15s', opacity: status === 'running' ? 0.7 : 1,
                  }}
                  aria-label="Run code"
                >
                  {status === 'running'
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…</>
                    : <><Play className="w-3.5 h-3.5" /> Run ▶</>}
                </button>
              )}

              {status === 'running' && !liveMode && (
                <button
                  type="button"
                  onClick={handleStop}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '6px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                    border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.08)',
                    color: OUT_ERR, cursor: 'pointer',
                  }}
                  aria-label="Stop execution"
                >
                  <StopCircle className="w-3.5 h-3.5" /> Stop
                </button>
              )}

              {status === 'done' && (
                <span style={{ fontSize: 11, color: OUT_OK, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle className="w-3.5 h-3.5" /> Done
                </span>
              )}

              <button
                type="button"
                onClick={() => { setCode(DEMO_CODE[language]); setOutputLines([]); setStatus('idle'); }}
                title="Reset to demo"
                style={{
                  marginLeft: 'auto', padding: '4px 8px', borderRadius: 6, fontSize: 10,
                  border: '1px solid rgba(160,195,240,0.22)', background: 'rgba(0,0,0,0.03)',
                  color: 'var(--de-text-dim)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}
                aria-label="Reset code to demo"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>
          )}

          {/* ── Preview panel — rendered second when not swapped, first when swapped ── */}
          {!swapped && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(160,195,240,0.1)',
                fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 6 }}>
                PREVIEW
                <span style={{ marginLeft: 'auto' }}>
                  {status === 'running' && (
                    <span style={{ fontSize: 10, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', animation: 'de-pulse 1s infinite' }} />
                      Live
                    </span>
                  )}
                  {status === 'done' && (
                    <span style={{ fontSize: 10, color: OUT_OK }}>✓ Complete</span>
                  )}
                </span>
              </div>

              <div
                ref={outputRef}
                style={{
                  flex: 1, minHeight: 260, overflowY: 'auto',
                  background: CODE_BG, padding: '12px 14px',
                }}
              >
                {/* Mode: terminal */}
                {previewMode === 'terminal' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {outputLines.length === 0 && status === 'idle' && (
                      <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.45)', fontFamily: 'monospace' }}>
                        Press Run ▶ to execute…
                      </p>
                    )}
                    {outputLines.map((line, i) => (
                      <pre key={i} style={{
                        margin: 0, fontSize: 11, fontFamily: '"Fira Code",ui-monospace,monospace',
                        color: line.startsWith('[') ? OUT_OK
                          : line.startsWith('>>>') ? '#93c5fd'
                          : line.startsWith('$') ? '#fbbf24'
                          : line.startsWith('⛔') || line.startsWith('Error') ? OUT_ERR
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
                )}

                {/* Mode: data */}
                {previewMode === 'data' && (
                  <div style={{ padding: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.6)', marginBottom: 10, letterSpacing: '0.06em' }}>
                      DATA VISUALIZATION
                    </div>
                    <AsciiHeatmap cols={30} rows={5} seed={42 + outputLines.length} />
                    <div style={{ marginTop: 14, fontSize: 10, color: 'rgba(148,163,184,0.45)' }}>
                      High-density map  ·  {outputLines.length} frames
                    </div>
                    {outputLines.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <AsciiBarChart
                          values={[38, 61, 54, 82, 47, 73]}
                          labels={['CPU', 'GPU', 'MEM', 'VRAM', 'NET', 'I/O']}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Mode: game */}
                {previewMode === 'game' && (
                  <div style={{ padding: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.6)', marginBottom: 10, letterSpacing: '0.06em' }}>
                      GAME ENGINE VIEW
                    </div>
                    <div style={{
                      border: '1px solid rgba(139,92,246,0.3)', borderRadius: 6, padding: 10,
                      background: 'rgba(139,92,246,0.04)', fontFamily: 'monospace',
                      fontSize: 10, color: '#c084fc', lineHeight: 1.8,
                    }}>
                      Scene: {outputLines.length > 0 ? `scene_active` : 'waiting…'}<br />
                      Entities: {outputLines.length > 0 ? '124' : '0'}<br />
                      FPS: {outputLines.length > 0 ? '60' : '—'}<br />
                      Draw calls: {outputLines.length > 0 ? '24' : '—'}<br />
                      Physics: {engine === 'game' && outputLines.length > 0 ? 'Havok ●' : 'idle'}<br />
                      <br />
                      {outputLines.length > 0 ? (
                        <>
                          ┌──────────────────────┐<br />
                          │  ░░░░░░░░░░░░░░░░░░  │<br />
                          │  ░░░░░ 👾 ░░░░░░░░  │<br />
                          │  ░░░░░░░░░░░░░░░░░░  │<br />
                          │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │<br />
                          └──────────────────────┘
                        </>
                      ) : (
                        '   [waiting for run…]'
                      )}
                    </div>
                  </div>
                )}

                {/* Mode: canvas */}
                {previewMode === 'canvas' && (
                  <div style={{ padding: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.6)', marginBottom: 10, letterSpacing: '0.06em' }}>
                      CANVAS OUTPUT
                    </div>
                    <AsciiHeatmap cols={28} rows={8} seed={17 + outputLines.length * 3} />
                    <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(148,163,184,0.45)' }}>
                      Render output  ·  {language}  ·  {engine !== 'none' ? activeEngine.label : 'standalone'}
                    </div>
                  </div>
                )}
              </div>

              {/* Output engine label footer */}
              <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(160,195,240,0.1)',
                background: 'rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--de-text-dim)' }}>
                <span style={{ color: activeEngine.accent }}>{activeEngine.icon}</span>
                {activeEngine.label} · {language} · {previewMode} mode
              </div>
            </div>
          )}

          {/* When swapped, render editor on the right side */}
          {swapped && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(160,195,240,0.1)',
                fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 6 }}>
                EDITOR
                <span style={{ marginLeft: 'auto', fontSize: 10, color: ACCENT, fontWeight: 600 }}>
                  {language.toUpperCase()}
                </span>
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                aria-label="Code editor"
                style={{
                  flex: 1, minHeight: 260,
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
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={status === 'running'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                      border: 'none', cursor: status === 'running' ? 'not-allowed' : 'pointer',
                      background: status === 'running' ? 'rgba(99,102,241,0.15)' : ACCENT,
                      color: status === 'running' ? ACCENT : '#fff',
                      transition: 'all 0.15s', opacity: status === 'running' ? 0.7 : 1,
                    }}
                    aria-label="Run code"
                  >
                    {status === 'running'
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…</>
                      : <><Play className="w-3.5 h-3.5" /> Run ▶</>}
                  </button>
                )}
                {status === 'running' && !liveMode && (
                  <button type="button" onClick={handleStop}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                      border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.08)', color: OUT_ERR, cursor: 'pointer' }}
                    aria-label="Stop execution">
                    <StopCircle className="w-3.5 h-3.5" /> Stop
                  </button>
                )}
                {status === 'done' && (
                  <span style={{ fontSize: 11, color: OUT_OK, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Done
                  </span>
                )}
                <button type="button"
                  onClick={() => { setCode(DEMO_CODE[language]); setOutputLines([]); setStatus('idle'); }}
                  title="Reset to demo"
                  style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: 6, fontSize: 10,
                    border: '1px solid rgba(160,195,240,0.22)', background: 'rgba(0,0,0,0.03)',
                    color: 'var(--de-text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                  aria-label="Reset code to demo">
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Dr. Eams Quick Assist ─────────────────────────────── */}
      <div className="de-widget" style={{ marginBottom: 12 }}>
        <div className="de-widget-header">
          <Bot className="w-4 h-4" style={{ color: '#a78bfa' }} />
          <span className="de-widget-title ml-2">Dr. Eams Code Assist</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>
            AI · Code mode
          </span>
        </div>
        <div className="de-widget-body">
          <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
            Ask Dr. Eams to explain, refactor, or generate code. Vocabulary is always recognised — try{' '}
            <em>"explain closure"</em>, <em>"write a class called Player"</em>, or <em>"add try-except"</em>.
          </p>

          {/* Input row */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={eamsPrompt}
              onChange={e => setEamsPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleEamsAssist(); }}
              placeholder="Ask Dr. Eams… e.g. explain closure / write a function that sorts a list"
              aria-label="Dr. Eams prompt"
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 9, fontSize: 12,
                border: '1px solid rgba(167,139,250,0.3)', background: 'rgba(255,255,255,0.7)',
                color: 'var(--de-heading)', outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => void handleEamsAssist()}
              disabled={eamsLoading || !eamsPrompt.trim()}
              aria-label="Send to Dr. Eams"
              style={{
                padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                background: eamsLoading ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.85)',
                color: '#fff', border: 'none', cursor: eamsLoading || !eamsPrompt.trim() ? 'not-allowed' : 'pointer',
                opacity: !eamsPrompt.trim() ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s',
              }}
            >
              {eamsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
              {eamsLoading ? 'Thinking…' : 'Ask'}
            </button>
          </div>

          {/* Reply */}
          {eamsReply && (
            <div style={{
              marginTop: 10, padding: '10px 12px', borderRadius: 10,
              background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)',
              fontSize: 12, color: 'var(--de-heading)', whiteSpace: 'pre-wrap', lineHeight: 1.6,
              fontFamily: /```/.test(eamsReply) ? '"Fira Code",monospace' : 'inherit',
            }}>
              {eamsReply}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
