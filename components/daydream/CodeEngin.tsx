'use client';

/**
 * CodeEngin — Enhanced Side B control layer for the Code Daydream.
 *
 * Features:
 *   - Live Notebook  : Python-notebook-rival with simulated per-cell execution.
 *   - Live CI Dashboard : Five-stage pipeline with staggered simulation.
 *   - Enhanced Project Manager : Supabase list + quick-create form.
 *   - Dual-Runtime Connections : Cross-Engin connectivity status badges.
 *   - GitHub entry-point preserved.
 *
 * Architecture justification: docs/ARCHITECTURE.md §1 (Daydream pair system),
 *   §3 (CodeEngin is the canonical Code Daydream Side-B), §5 (privacy boundaries).
 * Security: filters projects by owner_id = auth.uid() on top of server-side RLS.
 * No eval() — all cell execution is simulated only.
 * Follows AXIOM 3 (every element enables real action) and AXIOM 4 (security by default).
 * Bridge emits follow the typed CodeChannelEvents interface — no phantom event keys.
 */

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  ArrowLeft, Code2, FolderOpen, Github,
  Plus, X, CheckCircle, XCircle, Loader2,
  Gamepad2, Music2, FlaskConical,
} from 'lucide-react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';

// ─── Prop types ───────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

// ─── Domain interfaces ────────────────────────────────────────────────────────

type CellLanguage = 'python' | 'javascript' | 'typescript' | 'bash';
type CellStatus   = 'idle' | 'running' | 'done' | 'error';

interface NotebookCell {
  id: string;
  language: CellLanguage;
  code: string;
  output: string | null;
  status: CellStatus;
}

type CIStageStatus = 'idle' | 'running' | 'done' | 'error';

interface CIPipelineStage {
  name: string;
  status: CIStageStatus;
  duration: string;
}

type CIOverallStatus = 'idle' | 'running' | 'passing' | 'failed';

interface Project {
  id: string;
  title: string;
  visibility: string;
}

type ActiveTab = 'notebook' | 'ci' | 'projects' | 'connections';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT   = '#3b7dd8';
const CELL_BG  = '#1a1a2e';
const CODE_FG  = '#e2e8f0';
const OUT_OK   = '#4ade80';
const OUT_ERR  = '#f87171';

const LANGUAGE_OPTIONS: CellLanguage[] = ['python', 'javascript', 'typescript', 'bash'];
const LANGUAGE_LABEL: Record<CellLanguage, string> = {
  python:     'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  bash:       'Bash',
};

/** Initial demo cells — pure data; never mutated directly. */
const DEMO_CELLS: NotebookCell[] = [
  {
    id: 'demo-1',
    language: 'python',
    code: '# Hello from DREAMengin Code\nprint("BPM:", 128)\nprint("Game score:", 9999)',
    output: null,
    status: 'idle',
  },
  {
    id: 'demo-2',
    language: 'javascript',
    code: "// Access GameEngin scores\nconst scores = await fetch('/api/game-scores');\nconsole.log(await scores.json());",
    output: null,
    status: 'idle',
  },
  {
    id: 'demo-3',
    language: 'bash',
    code: '# Run CI check\npnpm exec vitest run --reporter=verbose',
    output: null,
    status: 'idle',
  },
];

const INITIAL_CI_STAGES: CIPipelineStage[] = [
  { name: 'Lint',       status: 'idle', duration: '1.2s'  },
  { name: 'Typecheck',  status: 'idle', duration: '3.4s'  },
  { name: 'Unit Tests', status: 'idle', duration: '12.1s' },
  { name: 'Build',      status: 'idle', duration: '28.7s' },
  { name: 'Deploy',     status: 'idle', duration: '8.3s'  },
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Deterministic simulated output per language — no eval(), no execution. */
function getMockOutput(language: CellLanguage): string {
  switch (language) {
    case 'python':     return 'BPM: 128\nGame score: 9999';
    case 'javascript': return '[{"game":"platformer","score":9999}]';
    case 'typescript': return '{ result: "TypeScript compiled successfully" }';
    case 'bash':       return '✓ 291 tests passed in 1.24s';
    default:           return 'Done.';
  }
}

/** Collision-safe cell ID for new notebook cells. */
function newCellId(): string {
  return `cell-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Tiny sub-components (defined outside main to avoid re-creation) ──────────

function CIStageIcon({ status }: { status: CIStageStatus }) {
  if (status === 'done')    return <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />;
  if (status === 'error')   return <XCircle     className="w-4 h-4 flex-shrink-0" style={{ color: OUT_ERR }} />;
  if (status === 'running') return <Loader2     className="w-4 h-4 flex-shrink-0 animate-spin" style={{ color: '#f59e0b' }} />;
  return <span style={{ display: 'inline-block', width: 16, textAlign: 'center', color: 'var(--de-text-dim)', fontSize: 13 }}>—</span>;
}

function CIOverallBadge({ status }: { status: CIOverallStatus }) {
  const map: Record<CIOverallStatus, { label: string; color: string; bg: string }> = {
    idle:    { label: 'Ready',       color: 'var(--de-text-dim)', bg: 'rgba(160,195,240,0.12)' },
    running: { label: 'Running…',    color: '#f59e0b',            bg: 'rgba(245,158,11,0.12)' },
    passing: { label: 'All Passing', color: '#22c55e',            bg: 'rgba(34,197,94,0.12)'  },
    failed:  { label: 'Failed',      color: OUT_ERR,              bg: 'rgba(248,113,113,0.12)' },
  };
  const { label, color, bg } = map[status];
  return (
    <span
      style={{
        fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999,
        background: bg, color, border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CodeEngin({ onBack }: Props) {

  // ── Notebook state ──────────────────────────────────────────────────────────
  const [cells, setCells] = useState<NotebookCell[]>(() =>
    DEMO_CELLS.map(c => ({ ...c }))
  );

  // ── CI state ────────────────────────────────────────────────────────────────
  const [ciStages,        setCiStages]        = useState<CIPipelineStage[]>(() =>
    INITIAL_CI_STAGES.map(s => ({ ...s }))
  );
  const [ciRunning,       setCiRunning]       = useState(false);
  const [ciOverallStatus, setCiOverallStatus] = useState<CIOverallStatus>('idle');

  // ── Project Manager state ───────────────────────────────────────────────────
  const [projects,        setProjects]        = useState<Project[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [newProjectName,  setNewProjectName]  = useState('');
  const [newProjectLang,  setNewProjectLang]  = useState<CellLanguage>('python');
  const [creating,        setCreating]        = useState(false);
  const [user,            setUser]            = useState<{ id: string } | null>(null);

  // ── Navigation state ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('notebook');

  // ── Load user + projects ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(async (res) => {
      const u = res.data.user;
      if (!u || cancelled) { setLoading(false); return; }
      if (!cancelled) setUser(u);

      const { data } = await supabase
        .from('projects')
        .select('id, title, visibility')
        .eq('owner_id', u.id)
        .order('created_at', { ascending: false })
        .limit(15);

      if (!cancelled) {
        setProjects((data as Project[] | null) ?? []);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  // ── Notebook actions ────────────────────────────────────────────────────────

  /** Simulate running a single cell (800 ms). No eval — simulation only. */
  const runCell = useCallback((cellId: string, language: CellLanguage) => {
    setCells(prev =>
      prev.map(c => c.id === cellId ? { ...c, status: 'running', output: null } : c)
    );
    setTimeout(() => {
      const output = getMockOutput(language);
      setCells(prev =>
        prev.map(c => c.id === cellId ? { ...c, status: 'done', output } : c)
      );
      // Emit to the cross-Engin bus so LabEngin / GameEngin can react.
      bridge.emit('code', 'code:cell-executed', {
        cellId,
        language,
        outputType: 'text',
      });
    }, 800);
  }, []);

  const addCell = useCallback(() => {
    setCells(prev => [
      ...prev,
      { id: newCellId(), language: 'python', code: '', output: null, status: 'idle' },
    ]);
  }, []);

  const deleteCell = useCallback((cellId: string) => {
    setCells(prev => prev.filter(c => c.id !== cellId));
  }, []);

  const updateCellCode = useCallback((cellId: string, code: string) => {
    setCells(prev => prev.map(c => c.id === cellId ? { ...c, code } : c));
  }, []);

  const updateCellLanguage = useCallback((cellId: string, language: CellLanguage) => {
    setCells(prev =>
      prev.map(c =>
        c.id === cellId ? { ...c, language, output: null, status: 'idle' } : c
      )
    );
  }, []);

  // ── CI actions ──────────────────────────────────────────────────────────────

  /**
   * Simulate a full CI run: all stages → running, then sequentially → done
   * with 600 ms stagger. Emits code:build-success on completion.
   * No actual build is executed — simulation only.
   */
  const runCI = useCallback(() => {
    if (ciRunning) return;
    setCiRunning(true);
    setCiOverallStatus('running');
    setCiStages(prev => prev.map(s => ({ ...s, status: 'running' as const })));

    const total = INITIAL_CI_STAGES.length;
    for (let i = 0; i < total; i++) {
      const idx = i;
      setTimeout(() => {
        setCiStages(prev =>
          prev.map((s, j) => j === idx ? { ...s, status: 'done' as const } : s)
        );
        if (idx === total - 1) {
          setCiRunning(false);
          setCiOverallStatus('passing');
          // Emit build-success — the closest typed CodeChannelEvent for "CI passed".
          bridge.emit('code', 'code:build-success', {
            projectId: 'ci-pipeline',
            buildId:   `build-${Date.now()}`,
            durationMs: 600 * total,
          });
        }
      }, 600 * (idx + 1));
    }
  }, [ciRunning]);

  // ── Project Manager actions ─────────────────────────────────────────────────

  const createProject = useCallback(async () => {
    if (!newProjectName.trim() || !user || creating) return;
    setCreating(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title:      newProjectName.trim(),
          visibility: 'private',
          owner_id:   user.id,
        })
        .select('id, title, visibility')
        .single();
      if (!error && data) {
        // Show in local state immediately — no page reload required.
        setProjects(prev => [data as Project, ...prev]);
        setNewProjectName('');
      }
    } finally {
      setCreating(false);
    }
  }, [newProjectName, user, creating]);

  // ── Shared style helpers ────────────────────────────────────────────────────

  const tabStyle = useCallback((id: ActiveTab): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 999,
    border: activeTab === id
      ? `1.5px solid ${ACCENT}`
      : '1px solid rgba(160,195,240,0.30)',
    background: activeTab === id
      ? `${ACCENT}18`
      : 'rgba(255,255,255,0.45)',
    color:  activeTab === id ? ACCENT : 'var(--de-text)',
    fontSize: 12,
    fontWeight: activeTab === id ? 700 : 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  }), [activeTab]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="de-sky-bg min-h-screen">

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{
          background: 'rgba(220,232,248,0.88)',
          borderBottom: '1px solid rgba(160,195,240,0.3)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full"
            style={{
              background: 'rgba(160,195,240,0.15)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
            aria-label="Back to Code"
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
              CodeEngin
            </div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
              Code · Control Layer
            </div>
          </div>

          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              background: `${ACCENT}18`, color: ACCENT,
              border: `1px solid ${ACCENT}35`,
            }}
          >
            Side B
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>

        {/* ── Tab bar ── */}
        <div
          style={{
            display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap',
          }}
        >
          {(
            [
              { id: 'notebook',    label: '📔 Notebook'    },
              { id: 'ci',          label: '🔧 CI Pipeline'  },
              { id: 'projects',    label: '📁 Projects'     },
              { id: 'connections', label: '🔗 Connections'  },
            ] as { id: ActiveTab; label: string }[]
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={tabStyle(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════
            TAB: Live Notebook
            ════════════════════════════════════════ */}
        {activeTab === 'notebook' && (
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Live Notebook</span>
              <span
                style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}30`,
                }}
              >
                {cells.length} {cells.length === 1 ? 'cell' : 'cells'}
              </span>
            </div>

            <div className="de-widget-body" style={{ padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {cells.map((cell, cellIndex) => (
                  <div
                    key={cell.id}
                    style={{
                      borderBottom: cellIndex < cells.length - 1
                        ? '1px solid rgba(160,195,240,0.15)'
                        : 'none',
                      padding: '12px 16px',
                    }}
                  >
                    {/* Cell header row */}
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      {/* Language selector */}
                      <select
                        value={cell.language}
                        onChange={e =>
                          updateCellLanguage(cell.id, e.target.value as CellLanguage)
                        }
                        style={{
                          fontSize: 11, fontWeight: 600,
                          padding: '3px 8px', borderRadius: 6,
                          background: 'rgba(255,255,255,0.6)',
                          border: '1px solid rgba(160,195,240,0.35)',
                          color: 'var(--de-text)', cursor: 'pointer',
                        }}
                        aria-label={`Cell ${cellIndex + 1} language`}
                      >
                        {LANGUAGE_OPTIONS.map(lang => (
                          <option key={lang} value={lang}>
                            {LANGUAGE_LABEL[lang]}
                          </option>
                        ))}
                      </select>

                      {/* Status indicator */}
                      {cell.status === 'running' && (
                        <Loader2
                          className="w-3.5 h-3.5 animate-spin flex-shrink-0"
                          style={{ color: '#f59e0b' }}
                        />
                      )}
                      {cell.status === 'done' && (
                        <CheckCircle
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: '#22c55e' }}
                        />
                      )}
                      {cell.status === 'error' && (
                        <XCircle
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: OUT_ERR }}
                        />
                      )}

                      <span style={{ flex: 1 }} />

                      {/* Run button */}
                      <button
                        type="button"
                        disabled={cell.status === 'running'}
                        onClick={() => runCell(cell.id, cell.language)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 6, fontSize: 12,
                          fontWeight: 700, cursor: cell.status === 'running' ? 'not-allowed' : 'pointer',
                          background: cell.status === 'running'
                            ? 'rgba(59,125,216,0.08)'
                            : `${ACCENT}18`,
                          color: cell.status === 'running'
                            ? 'var(--de-text-dim)'
                            : ACCENT,
                          border: `1px solid ${cell.status === 'running' ? 'rgba(160,195,240,0.2)' : `${ACCENT}35`}`,
                          opacity: cell.status === 'running' ? 0.6 : 1,
                          transition: 'all 0.15s',
                        }}
                        aria-label={`Run cell ${cellIndex + 1}`}
                      >
                        {cell.status === 'running' ? (
                          <>⟳ Running</>
                        ) : (
                          <>▶ Run</>
                        )}
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => deleteCell(cell.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 26, height: 26, borderRadius: 6, border: 'none',
                          background: 'rgba(248,113,113,0.08)',
                          color: OUT_ERR, cursor: 'pointer',
                          fontSize: 14, fontWeight: 700,
                          transition: 'background 0.15s',
                        }}
                        aria-label={`Delete cell ${cellIndex + 1}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Code area — monospace dark bg, no eval */}
                    <textarea
                      value={cell.code}
                      onChange={e => updateCellCode(cell.id, e.target.value)}
                      rows={Math.max(3, cell.code.split('\n').length + 1)}
                      spellCheck={false}
                      aria-label={`Cell ${cellIndex + 1} code`}
                      style={{
                        width: '100%',
                        background: CELL_BG,
                        color: CODE_FG,
                        fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", ui-monospace, monospace',
                        fontSize: 13,
                        lineHeight: 1.6,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.06)',
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                        whiteSpace: 'pre',
                        overflowWrap: 'normal',
                        overflowX: 'auto',
                      }}
                    />

                    {/* Output area — only rendered when output exists */}
                    {cell.output !== null && (
                      <div
                        style={{
                          marginTop: 6,
                          background: '#0f0f1a',
                          border: `1px solid ${cell.status === 'error'
                            ? 'rgba(248,113,113,0.25)'
                            : 'rgba(74,222,128,0.18)'}`,
                          borderRadius: 8,
                          padding: '8px 12px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10, fontWeight: 700,
                            marginBottom: 4, letterSpacing: '0.06em',
                            color: cell.status === 'error' ? OUT_ERR : OUT_OK,
                            opacity: 0.7,
                          }}
                        >
                          {cell.status === 'error' ? 'ERROR' : 'OUTPUT'}
                        </div>
                        <pre
                          style={{
                            margin: 0,
                            fontFamily: '"Fira Code", "Cascadia Code", ui-monospace, monospace',
                            fontSize: 12,
                            color: cell.status === 'error' ? OUT_ERR : OUT_OK,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {cell.output}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add Cell footer */}
            <div className="de-widget-actions">
              <button
                type="button"
                onClick={addCell}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, fontSize: 12,
                  fontWeight: 700, cursor: 'pointer',
                  background: `${ACCENT}12`,
                  color: ACCENT,
                  border: `1px dashed ${ACCENT}45`,
                  transition: 'background 0.15s',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Cell
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: Live CI Dashboard
            ════════════════════════════════════════ */}
        {activeTab === 'ci' && (
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">CI Pipeline</span>
              <CIOverallBadge status={ciOverallStatus} />
            </div>

            <div className="de-widget-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ciStages.map((stage, idx) => (
                  <div
                    key={stage.name}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 10,
                      background: stage.status === 'done'
                        ? 'rgba(34,197,94,0.06)'
                        : stage.status === 'running'
                        ? 'rgba(245,158,11,0.06)'
                        : stage.status === 'error'
                        ? 'rgba(248,113,113,0.06)'
                        : 'rgba(255,255,255,0.45)',
                      border: stage.status === 'done'
                        ? '1px solid rgba(34,197,94,0.18)'
                        : stage.status === 'running'
                        ? '1px solid rgba(245,158,11,0.22)'
                        : stage.status === 'error'
                        ? '1px solid rgba(248,113,113,0.22)'
                        : '1px solid rgba(160,195,240,0.18)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Stage number */}
                    <span
                      style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: stage.status === 'done'
                          ? 'rgba(34,197,94,0.15)'
                          : `${ACCENT}15`,
                        color: stage.status === 'done' ? '#22c55e' : ACCENT,
                        fontSize: 10, fontWeight: 800, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {idx + 1}
                    </span>

                    {/* Stage name */}
                    <span
                      style={{
                        flex: 1, fontSize: 13, fontWeight: 600,
                        color: stage.status === 'idle'
                          ? 'var(--de-text-dim)'
                          : 'var(--de-heading)',
                      }}
                    >
                      {stage.name}
                    </span>

                    {/* Duration (static display) */}
                    {stage.status !== 'idle' && (
                      <span
                        style={{
                          fontSize: 11, color: 'var(--de-text-dim)',
                          fontFamily: 'ui-monospace, monospace',
                        }}
                      >
                        {stage.duration}
                      </span>
                    )}

                    {/* Status icon */}
                    <CIStageIcon status={stage.status} />
                  </div>
                ))}
              </div>
            </div>

            <div className="de-widget-actions" style={{ gap: 10 }}>
              <button
                type="button"
                disabled={ciRunning}
                onClick={runCI}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, fontSize: 13,
                  fontWeight: 700,
                  cursor: ciRunning ? 'not-allowed' : 'pointer',
                  background: ciRunning ? 'rgba(59,125,216,0.08)' : ACCENT,
                  color: ciRunning ? 'var(--de-text-dim)' : '#fff',
                  border: 'none', opacity: ciRunning ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {ciRunning
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Running CI…</>
                  : <>▶ Run CI</>
                }
              </button>

              {ciOverallStatus === 'passing' && (
                <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                  ✓ Deployed via build-success event
                </span>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: Project Manager
            ════════════════════════════════════════ */}
        {activeTab === 'projects' && (
          <>
            {/* Quick-create form */}
            <div className="de-widget" style={{ marginBottom: 14 }}>
              <div className="de-widget-header">
                <span className="de-widget-title">New Project</span>
              </div>

              <div className="de-widget-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Name input */}
                  <div>
                    <label
                      htmlFor="new-project-name"
                      style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}
                    >
                      Project name
                    </label>
                    <input
                      id="new-project-name"
                      type="text"
                      placeholder="my-awesome-project"
                      value={newProjectName}
                      onChange={e => setNewProjectName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') createProject(); }}
                      maxLength={80}
                      style={{
                        width: '100%', padding: '8px 12px',
                        borderRadius: 8, fontSize: 13,
                        background: 'rgba(255,255,255,0.65)',
                        border: '1px solid rgba(160,195,240,0.4)',
                        color: 'var(--de-heading)', outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Language selector */}
                  <div>
                    <label
                      htmlFor="new-project-lang"
                      style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}
                    >
                      Primary language
                    </label>
                    <select
                      id="new-project-lang"
                      value={newProjectLang}
                      onChange={e => setNewProjectLang(e.target.value as CellLanguage)}
                      style={{
                        padding: '7px 12px', borderRadius: 8, fontSize: 13,
                        background: 'rgba(255,255,255,0.65)',
                        border: '1px solid rgba(160,195,240,0.4)',
                        color: 'var(--de-heading)', cursor: 'pointer',
                      }}
                    >
                      {LANGUAGE_OPTIONS.map(lang => (
                        <option key={lang} value={lang}>{LANGUAGE_LABEL[lang]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="de-widget-actions">
                <button
                  type="button"
                  disabled={!newProjectName.trim() || creating || !user}
                  onClick={createProject}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, fontSize: 13,
                    fontWeight: 700,
                    cursor: (!newProjectName.trim() || creating || !user) ? 'not-allowed' : 'pointer',
                    background: (!newProjectName.trim() || creating || !user)
                      ? 'rgba(59,125,216,0.08)'
                      : ACCENT,
                    color: (!newProjectName.trim() || creating || !user) ? 'var(--de-text-dim)' : '#fff',
                    border: 'none',
                    opacity: (!newProjectName.trim() || creating) ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {creating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                    : <><Plus className="w-4 h-4" /> Create Project</>
                  }
                </button>

                <Link href="/codespace" className="de-btn de-btn-ghost text-xs">
                  Open Codespace →
                </Link>
              </div>
            </div>

            {/* Existing projects list (Supabase — preserved from original) */}
            <div className="de-widget">
              <div className="de-widget-header">
                <span className="de-widget-title">Your Projects</span>
                {projects.length > 0 && (
                  <span
                    style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}30`,
                    }}
                  >
                    {projects.length}
                  </span>
                )}
              </div>

              <div className="de-widget-body">
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: ACCENT, opacity: 0.5 }} />
                    <span style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
                      Loading projects…
                    </span>
                  </div>
                ) : projects.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                    <FolderOpen className="w-6 h-6 flex-shrink-0" style={{ color: ACCENT, opacity: 0.3 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                        No projects yet
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                        Create your first project above.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {projects.map(p => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.5)',
                          border: '1px solid rgba(160,195,240,0.18)',
                        }}
                      >
                        <Code2
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: ACCENT, opacity: 0.7 }}
                        />
                        <span
                          style={{
                            flex: 1, fontSize: 13, fontWeight: 600,
                            color: 'var(--de-heading)',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', minWidth: 0,
                          }}
                        >
                          {p.title}
                        </span>
                        <span
                          style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                            flexShrink: 0, padding: '2px 8px', borderRadius: 999,
                            background: p.visibility === 'public'
                              ? 'rgba(34,197,94,0.12)'
                              : 'rgba(160,195,240,0.18)',
                            color: p.visibility === 'public' ? '#22c55e' : 'var(--de-text-dim)',
                            border: p.visibility === 'public'
                              ? '1px solid rgba(34,197,94,0.25)'
                              : '1px solid rgba(160,195,240,0.25)',
                          }}
                        >
                          {p.visibility === 'public' ? 'Public' : 'Private'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════
            TAB: Dual-Runtime Connections
            ════════════════════════════════════════ */}
        {activeTab === 'connections' && (
          <>
            {/* Cross-Engin status badges */}
            <div className="de-widget" style={{ marginBottom: 14 }}>
              <div className="de-widget-header">
                <span className="de-widget-title">Cross-Engin Connections</span>
              </div>

              <div className="de-widget-body">
                <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
                  CodeEngin is connected to the Dual Runtime Bridge. Other Engins can
                  consume notebook outputs and CI events in real time.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* GameEngin */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 14px', borderRadius: 12,
                      background: 'rgba(34,197,94,0.06)',
                      border: '1px solid rgba(34,197,94,0.2)',
                    }}
                  >
                    <div
                      style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: 'rgba(34,197,94,0.12)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Gamepad2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                        GameEngin
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                        Game scripts ready
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px',
                        borderRadius: 999, background: 'rgba(34,197,94,0.15)',
                        color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)',
                      }}
                    >
                      ● Live
                    </span>
                  </div>

                  {/* StarMakerEngin */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 14px', borderRadius: 12,
                      background: `${ACCENT}08`,
                      border: `1px solid ${ACCENT}25`,
                    }}
                  >
                    <div
                      style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: `${ACCENT}15`,
                        border: `1px solid ${ACCENT}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Music2 className="w-4 h-4" style={{ color: ACCENT }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                        StarMakerEngin
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                        BPM available
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px',
                        borderRadius: 999, background: `${ACCENT}15`,
                        color: ACCENT, border: `1px solid ${ACCENT}35`,
                      }}
                    >
                      ● Live
                    </span>
                  </div>

                  {/* LabEngin */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 14px', borderRadius: 12,
                      background: 'rgba(168,85,247,0.06)',
                      border: '1px solid rgba(168,85,247,0.2)',
                    }}
                  >
                    <div
                      style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: 'rgba(168,85,247,0.12)',
                        border: '1px solid rgba(168,85,247,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <FlaskConical className="w-4 h-4" style={{ color: '#a855f7' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                        LabEngin
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                        Experiment data ready
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px',
                        borderRadius: 999, background: 'rgba(168,85,247,0.15)',
                        color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)',
                      }}
                    >
                      ● Live
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* GitHub Connector (preserved from original) */}
            <div className="de-widget">
              <div className="de-widget-header">
                <span className="de-widget-title">GitHub</span>
              </div>

              <div className="de-widget-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(100,116,139,0.12)',
                      border: '1px solid rgba(100,116,139,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Github className="w-5 h-5" style={{ color: 'var(--de-heading)', opacity: 0.6 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                      Not connected
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                      Link GitHub to sync repositories and trigger real builds.
                    </div>
                  </div>
                </div>
              </div>

              <div className="de-widget-actions">
                <Link href="/connectors" className="de-btn de-btn-ghost text-xs">
                  Connect GitHub →
                </Link>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
