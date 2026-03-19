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

import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  ArrowLeft, Code2, FolderOpen, Github,
  Plus, X, CheckCircle, XCircle, Loader2,
  Gamepad2, Music2, FlaskConical,
  ZoomIn, ZoomOut, MousePointer2, Scissors, Copy, Clipboard, Trash2, Bot,
  ShieldCheck, Undo2, AlertTriangle,
} from 'lucide-react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import DiffViewer from '@/components/daydream/DiffViewer';
import {
  parseAiInstruction,
  buildEditPreview,
  applyEdit,
  undoEdit,
  SCOPE_ORDER,
  SCOPE_LABEL,
  SCOPE_DESCRIPTION,
  SCOPE_RISK,
  CONFIRMATION_REQUIRED,
  CODEENGIN_PRODUCTION_MODE,
  type EditScope,
  type AiSuggestion,
  type EditPreview,
  type UndoSnapshot,
  type EditableCell,
} from '@/lib/diff/aiEditEngine';

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

type ActiveTab = 'notebook' | 'ci' | 'projects' | 'connections' | 'diff';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT   = '#3b7dd8';
const CELL_BG  = '#1a1a2e';
const CODE_FG  = '#e2e8f0';
const OUT_OK   = '#4ade80';
const OUT_ERR  = '#f87171';

const ZOOM_MIN  = 0.6;
const ZOOM_MAX  = 2.0;
const ZOOM_STEP = 0.1;
const ZOOM_BASE_FONT = 13;  // px — baseline cell font-size

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

/** Notebook cells localStorage key — unique per surface so different daydreams are isolated */
const NOTEBOOK_STORAGE_KEY = 'de-codegen-cells';

// ─── Main component ───────────────────────────────────────────────────────────

export default function CodeEngin({ onBack }: Props) {

  // ── Notebook state ──────────────────────────────────────────────────────────
  // Load from localStorage on first render; fall back to DEMO_CELLS only when
  // there are no previously saved cells (i.e. first visit).
  const [cells, setCells] = useState<NotebookCell[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(NOTEBOOK_STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as NotebookCell[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore parse errors — use defaults */ }
    return DEMO_CELLS.map(c => ({ ...c }));
  });

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

  // ── Code zoom state ──────────────────────────────────────────────────────────
  const [codeZoom, setCodeZoom] = useState(1.0);
  const zoomIn  = useCallback(() => setCodeZoom((z: number) => Math.min(ZOOM_MAX, parseFloat((z + ZOOM_STEP).toFixed(1)))), []);
  const zoomOut = useCallback(() => setCodeZoom((z: number) => Math.max(ZOOM_MIN, parseFloat((z - ZOOM_STEP).toFixed(1)))), []);
  const zoomReset = useCallback(() => setCodeZoom(1.0), []);

  // ── Selection mode state ─────────────────────────────────────────────────────
  const [selectMode, setSelectMode] = useState(false);
  const [selectionBar, setSelectionBar] = useState<{
    visible: boolean; x: number; y: number; text: string;
  }>({ visible: false, x: 0, y: 0, text: '' });
  const [drEamsCheckResult, setDrEamsCheckResult] = useState('');
  const codeAreaRef = useRef<HTMLDivElement>(null);

  // Persist cells to localStorage whenever they change so the notebook survives
  // navigation and browser refresh. DEMO_CELLS are written on first visit so
  // subsequent visits start from the user's last edit, not the demo content.
  useEffect(() => {
    try {
      localStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(cells));
    } catch { /* ignore — storage may be unavailable (private mode, full) */ }
  }, [cells]);

  // When select mode becomes active, listen for mouseup to capture selections
  useEffect(() => {
    if (!selectMode) {
      setSelectionBar(prev => ({ ...prev, visible: false }));
      setDrEamsCheckResult('');
      return;
    }
    function handleMouseUp(e: MouseEvent) {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? '';
      if (!text) {
        setSelectionBar(prev => ({ ...prev, visible: false }));
        return;
      }
      // Position bar above the cursor
      setSelectionBar({ visible: true, x: e.clientX, y: e.clientY - 60, text });
    }
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [selectMode]);

  const closeSelectionBar = useCallback(() => {
    setSelectionBar(prev => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
  }, []);

  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev: boolean) => {
      if (prev) window.getSelection()?.removeAllRanges();
      return !prev;
    });
  }, []);

  // ── Smart Select state ───────────────────────────────────────────────────────
  const lastFocusedRef = useRef<HTMLTextAreaElement | null>(null);
  const [findTarget,   setFindTarget]   = useState('');
  const [replaceWith,  setReplaceWith]  = useState('');
  const [findResults,  setFindResults]  = useState<{
    scope: 'cell' | 'codebase'; total: number;
  } | null>(null);

  /** Escape a string for safe use inside a RegExp. */
  function escapeRx(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  const handleSelectAll = useCallback(() => {
    const ta = lastFocusedRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(0, ta.value.length);
    setSelectionBar({ visible: false, x: 0, y: 0, text: ta.value });
  }, []);

  const handleSelectLine = useCallback(() => {
    const ta = lastFocusedRef.current;
    if (!ta) return;
    ta.focus();
    const val = ta.value;
    const cursor = ta.selectionStart;
    let lineStart = cursor;
    while (lineStart > 0 && val[lineStart - 1] !== '\n') lineStart--;
    let lineEnd = cursor;
    while (lineEnd < val.length && val[lineEnd] !== '\n') lineEnd++;
    ta.setSelectionRange(lineStart, lineEnd);
    setSelectionBar({ visible: false, x: 0, y: 0, text: val.slice(lineStart, lineEnd) });
  }, []);

  const handleSelectBlock = useCallback(() => {
    const ta = lastFocusedRef.current;
    if (!ta) return;
    ta.focus();
    const val = ta.value;
    const cursor = ta.selectionStart;
    let blockStart = -1;
    let blockEnd   = -1;
    let depth = 0;
    for (let i = cursor; i >= 0; i--) {
      if (val[i] === '}') depth++;
      else if (val[i] === '{') {
        if (depth === 0) { blockStart = i; break; }
        depth--;
      }
    }
    depth = 0;
    for (let i = cursor; i < val.length; i++) {
      if (val[i] === '{') depth++;
      else if (val[i] === '}') {
        if (depth === 0) { blockEnd = i + 1; break; }
        depth--;
      }
    }
    if (blockStart !== -1 && blockEnd !== -1) {
      ta.setSelectionRange(blockStart, blockEnd);
      setSelectionBar({ visible: false, x: 0, y: 0, text: val.slice(blockStart, blockEnd) });
    }
  }, []);

  const handleSelectVariable = useCallback((scope: 'cell' | 'codebase') => {
    const ta = lastFocusedRef.current;
    const rawTarget = selectionBar.text
      || (() => {
        if (!ta) return '';
        const val = ta.value;
        const c = ta.selectionStart;
        let s = c; while (s > 0 && /\w/.test(val[s - 1])) s--;
        let e = c; while (e < val.length && /\w/.test(val[e])) e++;
        return val.slice(s, e);
      })();
    if (!rawTarget.trim()) return;
    setFindTarget(rawTarget.trim());
    setReplaceWith('');
    if (scope === 'cell') {
      if (!ta) return;
      const rx = new RegExp(`\\b${escapeRx(rawTarget.trim())}\\b`, 'g');
      const total = (ta.value.match(rx) ?? []).length;
      setFindResults({ scope: 'cell', total });
    } else {
      const rx = new RegExp(`\\b${escapeRx(rawTarget.trim())}\\b`, 'g');
      const total = cells.reduce((acc: number, cell: NotebookCell) =>
        acc + (cell.code.match(rx) ?? []).length, 0);
      setFindResults({ scope: 'codebase', total });
    }
    closeSelectionBar();
  }, [selectionBar.text, cells, closeSelectionBar]);

  const handleReplaceAll = useCallback((scope: 'cell' | 'codebase') => {
    if (!findTarget || replaceWith === undefined) return;
    const rx = new RegExp(`\\b${escapeRx(findTarget)}\\b`, 'g');
    if (scope === 'cell') {
      const ta = lastFocusedRef.current;
      const targetId = ta?.getAttribute('data-cell-id') ?? '';
      setCells((prev: NotebookCell[]) => prev.map((c: NotebookCell) =>
        c.id === targetId ? { ...c, code: c.code.replace(rx, replaceWith) } : c));
    } else {
      setCells((prev: NotebookCell[]) => prev.map((c: NotebookCell) =>
        ({ ...c, code: c.code.replace(rx, replaceWith) })));
    }
    setFindResults(null);
    setFindTarget('');
    setReplaceWith('');
  }, [findTarget, replaceWith]);

  // Selection actions
  const handleSelCopy = useCallback(() => {
    if (selectionBar.text) navigator.clipboard?.writeText(selectionBar.text);
    closeSelectionBar();
  }, [selectionBar.text, closeSelectionBar]);

  const handleSelCut = useCallback(() => {
    if (selectionBar.text) {
      navigator.clipboard?.writeText(selectionBar.text);
      // Remove selected text via direct textarea manipulation (execCommand is deprecated)
      const ta = lastFocusedRef.current;
      if (ta) {
        const { selectionStart: s, selectionEnd: e, value } = ta;
        const newVal = value.slice(0, s) + value.slice(e);
        // Synthetic React onChange by updating value + dispatching event
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
          ?.set?.call(ta, newVal);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.setSelectionRange(s, s);
      }
    }
    closeSelectionBar();
  }, [selectionBar.text, closeSelectionBar]);

  const handleSelPaste = useCallback(async () => {
    const text = await navigator.clipboard?.readText().catch(() => '');
    if (text) {
      const ta = lastFocusedRef.current;
      if (ta) {
        const { selectionStart: s, selectionEnd: e, value } = ta;
        const newVal = value.slice(0, s) + text + value.slice(e);
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
          ?.set?.call(ta, newVal);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.setSelectionRange(s + text.length, s + text.length);
      }
    }
    closeSelectionBar();
  }, [closeSelectionBar]);

  const handleSelDelete = useCallback(() => {
    const ta = lastFocusedRef.current;
    if (ta) {
      const { selectionStart: s, selectionEnd: e, value } = ta;
      const newVal = value.slice(0, s) + value.slice(e);
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
        ?.set?.call(ta, newVal);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.setSelectionRange(s, s);
    }
    closeSelectionBar();
  }, [closeSelectionBar]);

  const handleSelDrEams = useCallback(() => {
    const code = selectionBar.text;
    setDrEamsCheckResult('');
    closeSelectionBar();
    // Simulate Dr. Eams correctness check (no eval, simulation only)
    setTimeout(() => {
      const issues = [];
      if (/console\.log/.test(code)) issues.push('Consider removing debug console.log statements before committing.');
      if (/var /.test(code)) issues.push('Prefer `const` or `let` over `var`.');
      if (/==(?!=)/.test(code)) issues.push('Use strict equality `===` instead of `==`.');
      setDrEamsCheckResult(
        issues.length === 0
          ? '✅ Dr. Eams: Looks good! No obvious issues found.'
          : `⚠️ Dr. Eams found ${issues.length} suggestion${issues.length > 1 ? 's' : ''}:\n${issues.map(i => `• ${i}`).join('\n')}`,
      );
    }, 400);
  }, [selectionBar.text, closeSelectionBar]);


  // ── Load user + projects ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
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

  const tabStyle = useCallback((id: ActiveTab): CSSProperties => ({
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

  // ── AI Code Assist state ────────────────────────────────────────────────────
  const [assistPrompt, setAssistPrompt]       = useState('');
  const [assistResponse, setAssistResponse]   = useState('');
  const [assistLoading, setAssistLoading]     = useState(false);

  // ── Trust Layer state ─────────────────────────────────────────────────────────
  // Step 1 — AI suggestion (parsed instruction)
  const [trustSuggestion, setTrustSuggestion] = useState<AiSuggestion | null>(null);
  // Step 2 — Scope the user has chosen (may differ from suggested)
  const [trustScope, setTrustScope]           = useState<EditScope>('word');
  // Step 2.5 — live replace-with text
  const [trustReplacement, setTrustReplacement] = useState('');
  // Step 3 — Preview (computed on demand)
  const [trustPreview, setTrustPreview]       = useState<EditPreview | null>(null);
  // Step 4 — Confirmation dialog visible?
  const [trustConfirming, setTrustConfirming] = useState(false);
  // Undo stack (most recent first)
  const [undoStack, setUndoStack]             = useState<UndoSnapshot[]>([]);

  // When a suggestion arrives, set the scope to Dr. Eams' recommendation
  useEffect(() => {
    if (trustSuggestion) {
      setTrustScope(trustSuggestion.suggestedScope);
      setTrustReplacement(trustSuggestion.replacement);
      setTrustPreview(null);
      setTrustConfirming(false);
    }
  }, [trustSuggestion]);

  /** Compute or refresh the preview for the current scope/replacement. */
  const handleTrustPreview = useCallback(() => {
    if (!trustSuggestion) return;
    const activeCellId = lastFocusedRef.current?.getAttribute('data-cell-id')
      ?? cells[0]?.id ?? '';
    const cursorOffset = lastFocusedRef.current?.selectionStart ?? 0;
    const preview = buildEditPreview({
      cells: cells as EditableCell[],
      activeCellId,
      cursorOffset,
      scope: trustScope,
      target: trustSuggestion.target || selectionBar.text,
      replacement: trustReplacement,
    });
    setTrustPreview(preview);
    if (preview.requiresConfirmation) setTrustConfirming(true);
  }, [trustSuggestion, cells, trustScope, trustReplacement, selectionBar.text]);

  /** Apply the previewed edit to cells + push to undo stack. */
  const handleTrustApply = useCallback(() => {
    if (!trustPreview) return;
    const { cells: updated, undo } = applyEdit(cells as EditableCell[], trustPreview);
    setCells(updated as NotebookCell[]);
    setUndoStack(prev => [undo, ...prev].slice(0, 20));
    setTrustPreview(null);
    setTrustSuggestion(null);
    setTrustConfirming(false);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'code', 'code:cell-executed',
      { cellId: 'trust-apply', language: 'typescript', outputType: 'text' }
    );
  }, [cells, trustPreview]);

  /** Undo the last applied edit. */
  const handleTrustUndo = useCallback(() => {
    const [snapshot, ...rest] = undoStack;
    if (!snapshot) return;
    setCells(undoEdit(cells as EditableCell[], snapshot) as NotebookCell[]);
    setUndoStack(rest);
  }, [cells, undoStack]);

  /** Reject / dismiss the current suggestion. */
  const handleTrustReject = useCallback(() => {
    setTrustPreview(null);
    setTrustSuggestion(null);
    setTrustConfirming(false);
  }, []);

  // ── Pair Programming state ───────────────────────────────────────────────────
  const [pairActive, setPairActive]   = useState(false);
  const [pairCode, setPairCode]       = useState('');
  const [pairCursor, setPairCursor]   = useState('Line 42, Col 8');

  // ── Deployment Console state ─────────────────────────────────────────────────
  const [deployTarget, setDeployTarget]   = useState<'vercel' | 'supabase'>('vercel');
  const [deployStatus, setDeployStatus]   = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [deployLog, setDeployLog]         = useState<string[]>([]);

  // ── API Inspector state ──────────────────────────────────────────────────────
  const [apiMethod, setApiMethod]     = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [apiUrl, setApiUrl]           = useState('/api/posts');
  const [apiBody, setApiBody]         = useState('');
  const [apiResponse, setApiResponse] = useState('');

  // ── Snippet Library state ────────────────────────────────────────────────────
  const [snippets, setSnippets] = useState<Array<{ id: string; name: string; language: string; code: string }>>([
    { id: 'sn-1', name: 'Fetch Posts',     language: 'TypeScript', code: "const res = await fetch('/api/posts');\nconst data = await res.json();" },
    { id: 'sn-2', name: 'Supabase Query',  language: 'TypeScript', code: "const { data } = await supabase.from('posts').select('*').limit(10);" },
    { id: 'sn-3', name: 'Bridge Emit',     language: 'TypeScript', code: "bridge.emit('code', 'code:cell-executed', { cellId, language, outputType: 'text' });" },
  ]);
  const [newSnippetName, setNewSnippetName] = useState('');
  const [newSnippetCode, setNewSnippetCode] = useState('');

  // ── AI Assist handler (now produces a trust-layer suggestion) ────────────────
  function handleAiAssist() {
    if (!assistPrompt.trim()) return;
    setAssistLoading(true);
    setAssistResponse('');
    setTrustSuggestion(null);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)('code', 'code:cell-executed', { cellId: 'ai-assist', language: 'typescript', outputType: 'text' });
    setTimeout(() => {
      const suggestion = parseAiInstruction(assistPrompt);
      setTrustSuggestion(suggestion);
      setAssistLoading(false);
      // Legacy response text for non-scoped queries
      if (!suggestion.target) {
        setAssistResponse(
          `// Dr. Eams suggests:\n// For "${assistPrompt.slice(0, 40)}…"\n\n` +
          `function solution() {\n  // 1. Break the problem into smaller steps\n` +
          `  // 2. Use TypeScript generics for type safety\n` +
          `  // 3. Handle errors with try/catch\n  return result;\n}`
        );
      }
    }, 800);
  }

  // ── Pair Programming handler ─────────────────────────────────────────────────
  function handlePairToggle() {
    if (!pairActive) {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      setPairCode(code);
      (bridge.emit as (ch: string, ev: string, pl: unknown) => void)('code', 'code:build-success', { projectId: 'pair-' + code, buildId: `pair-${Date.now()}`, durationMs: 0 });
    }
    setPairActive(prev => !prev);
  }

  // ── Deployment handler ───────────────────────────────────────────────────────
  function handleDeploy() {
    if (deployStatus === 'deploying') return;
    setDeployStatus('deploying');
    setDeployLog([]);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)('code', 'code:build-success', { projectId: deployTarget, buildId: `deploy-${Date.now()}`, durationMs: 0 });
    const steps = deployTarget === 'vercel'
      ? ['Preparing build…', 'Running pnpm build…', 'Uploading assets…', 'Deploying to edge…', '✅ Deployed to vercel.app']
      : ['Connecting to Supabase…', 'Running migrations…', 'Updating edge functions…', 'Refreshing schema cache…', '✅ Deployed to Supabase'];
    steps.forEach((step, i) => {
      setTimeout(() => {
        setDeployLog(prev => [...prev, step]);
        if (i === steps.length - 1) setDeployStatus('success');
      }, (i + 1) * 700);
    });
  }

  // ── API Inspector handler ────────────────────────────────────────────────────
  function handleApiSend() {
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)('code', 'code:cell-executed', { cellId: 'api-inspector', language: 'typescript', outputType: 'text' });
    setTimeout(() => {
      setApiResponse(
        JSON.stringify(
          apiMethod === 'GET'
            ? { ok: true, data: [{ id: 1, title: 'Sample post', created_at: new Date().toISOString() }] }
            : { ok: true, id: crypto.randomUUID(), created_at: new Date().toISOString() },
          null, 2
        )
      );
    }, 600);
  }

  // ── Snippet Library handler ──────────────────────────────────────────────────
  function handleSaveSnippet() {
    if (!newSnippetName.trim() || !newSnippetCode.trim()) return;
    const snippet = { id: `sn-${Date.now()}`, name: newSnippetName.trim(), language: 'TypeScript', code: newSnippetCode.trim() };
    setSnippets(prev => [snippet, ...prev]);
    setNewSnippetName('');
    setNewSnippetCode('');
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)('code', 'code:build-success', { projectId: 'snippet-' + snippet.id, buildId: `snip-${Date.now()}`, durationMs: 0 });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="de-sky-bg min-h-screen">

      {/* ── Floating selection action bar ── */}
      {selectMode && selectionBar.visible && (
        <div
          role="toolbar"
          aria-label="Selection actions"
          style={{
            position: 'fixed',
            left: Math.min(selectionBar.x, typeof window !== 'undefined' ? window.innerWidth - 320 : selectionBar.x),
            top: Math.max(8, selectionBar.y),
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 8px',
            borderRadius: 12,
            background: 'rgba(15,15,30,0.96)',
            border: '1px solid rgba(59,125,216,0.4)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(12px)',
            flexWrap: 'nowrap',
          }}
        >
          {/* Copy */}
          <button
            type="button"
            onClick={handleSelCopy}
            title="Copy selection"
            style={selBtnStyle}
            aria-label="Copy selected text"
          >
            <Copy size={13} />
            <span>Copy</span>
          </button>

          {/* Cut */}
          <button
            type="button"
            onClick={handleSelCut}
            title="Cut selection"
            style={selBtnStyle}
            aria-label="Cut selected text"
          >
            <Scissors size={13} />
            <span>Cut</span>
          </button>

          {/* Paste */}
          <button
            type="button"
            onClick={handleSelPaste}
            title="Paste from clipboard"
            style={selBtnStyle}
            aria-label="Paste from clipboard"
          >
            <Clipboard size={13} />
            <span>Paste</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleSelDelete}
            title="Delete selection"
            style={{ ...selBtnStyle, color: '#f87171' }}
            aria-label="Delete selected text"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>

          {/* Divider */}
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />

          {/* Dr. Eams correctness check */}
          <button
            type="button"
            onClick={handleSelDrEams}
            title="Ask Dr. Eams to check correctness of the selected code"
            style={{ ...selBtnStyle, color: '#a78bfa', paddingRight: 10 }}
            aria-label="Dr. Eams checks correctness"
          >
            <Bot size={13} />
            <span>Dr. Eams checks</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={closeSelectionBar}
            style={{
              ...selBtnStyle, marginLeft: 4,
              color: 'rgba(255,255,255,0.35)',
              padding: '4px 6px',
            }}
            aria-label="Dismiss action bar"
          >
            <X size={12} />
          </button>
        </div>
      )}

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
              { id: 'diff',        label: '⟦⟧ Diff Viewer'  },
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

        {/* ── Code toolbar: zoom + select-mode ── */}
        <div
          ref={codeAreaRef}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 14, flexWrap: 'wrap',
            padding: '6px 10px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.55)',
            border: '1px solid rgba(160,195,240,0.22)',
          }}
        >
          {/* Zoom controls */}
          <button
            type="button"
            onClick={zoomOut}
            disabled={codeZoom <= ZOOM_MIN}
            aria-label="Zoom out code"
            title="Zoom out (code)"
            style={codeToolBtnStyle(codeZoom <= ZOOM_MIN)}
          >
            <ZoomOut size={13} />
          </button>

          <button
            type="button"
            onClick={zoomReset}
            aria-label="Reset zoom"
            title="Reset zoom to 100%"
            style={{
              ...codeToolBtnStyle(false),
              minWidth: 42, justifyContent: 'center',
              fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
              color: codeZoom !== 1.0 ? ACCENT : 'var(--de-text-dim)',
            }}
          >
            {Math.round(codeZoom * 100)}%
          </button>

          <button
            type="button"
            onClick={zoomIn}
            disabled={codeZoom >= ZOOM_MAX}
            aria-label="Zoom in code"
            title="Zoom in (code)"
            style={codeToolBtnStyle(codeZoom >= ZOOM_MAX)}
          >
            <ZoomIn size={13} />
          </button>

          {/* Divider */}
          <span style={{ width: 1, height: 18, background: 'rgba(160,195,240,0.3)', margin: '0 4px' }} />

          {/* Select mode toggle */}
          <button
            type="button"
            onClick={toggleSelectMode}
            aria-label={selectMode ? 'Exit selection mode' : 'Enter selection mode'}
            title={selectMode ? 'Exit selection mode (click again to dismiss)' : 'Select text mode — highlight code then act on it'}
            style={{
              ...codeToolBtnStyle(false),
              gap: 6,
              background: selectMode ? `${ACCENT}18` : 'rgba(0,0,0,0.03)',
              borderColor: selectMode ? ACCENT : 'rgba(160,195,240,0.35)',
              color: selectMode ? ACCENT : 'var(--de-text)',
              fontWeight: selectMode ? 700 : 500,
              paddingRight: 10,
            }}
          >
            <MousePointer2 size={13} />
            <span style={{ fontSize: 11 }}>
              {selectMode ? 'Selecting…' : 'Select'}
            </span>
            {selectMode && (
              <span
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: ACCENT, flexShrink: 0,
                  animation: 'de-pulse 1.2s ease-in-out infinite',
                }}
              />
            )}
          </button>

          {/* Dr. Eams correctness result — inline hint */}
          {drEamsCheckResult && (
            <div
              style={{
                flex: 1, minWidth: 0,
                padding: '4px 10px', borderRadius: 8,
                background: drEamsCheckResult.startsWith('✅')
                  ? 'rgba(34,197,94,0.08)'
                  : 'rgba(245,158,11,0.08)',
                border: drEamsCheckResult.startsWith('✅')
                  ? '1px solid rgba(34,197,94,0.25)'
                  : '1px solid rgba(245,158,11,0.25)',
                fontSize: 11, color: 'var(--de-text)',
                whiteSpace: 'pre-wrap', lineHeight: 1.5,
                display: 'flex', alignItems: 'flex-start', gap: 6,
              }}
            >
              <span style={{ flex: 1 }}>{drEamsCheckResult}</span>
              <button
                type="button"
                onClick={() => setDrEamsCheckResult('')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--de-text-dim)', padding: 0, fontSize: 12, lineHeight: 1,
                  flexShrink: 0,
                }}
                aria-label="Dismiss Dr. Eams result"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ── Smart Select bar (shown when select mode is ON) ── */}
        {selectMode && (
          <div
            style={{
              display: 'flex', flexWrap: 'wrap', gap: 5,
              marginBottom: 8, padding: '7px 10px',
              borderRadius: 10,
              background: `${ACCENT}0a`,
              border: `1px dashed ${ACCENT}40`,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, marginRight: 2, whiteSpace: 'nowrap' }}>
              Smart Select:
            </span>

            {/* Select All */}
            <button
              type="button"
              onClick={handleSelectAll}
              title="Select all text in the active code cell"
              aria-label="Select all"
              style={smartSelBtnStyle}
            >
              ⬛ All
            </button>

            {/* Select Line */}
            <button
              type="button"
              onClick={handleSelectLine}
              title="Select the full line at the current cursor"
              aria-label="Select line"
              style={smartSelBtnStyle}
            >
              ☰ Line
            </button>

            {/* Select Block */}
            <button
              type="button"
              onClick={handleSelectBlock}
              title="Select the nearest enclosing { } block"
              aria-label="Select block"
              style={smartSelBtnStyle}
            >
              {'{ }'} Block
            </button>

            {/* Divider */}
            <span style={{ width: 1, height: 16, background: `${ACCENT}30`, margin: '0 2px' }} />

            {/* Select Variable in Cell */}
            <button
              type="button"
              onClick={() => handleSelectVariable('cell')}
              title="Find all occurrences of the selected word in this cell"
              aria-label="Select variable in cell"
              style={{ ...smartSelBtnStyle, color: ACCENT, borderColor: `${ACCENT}45` }}
            >
              $var in cell
            </button>

            {/* Select Variable in Codebase */}
            <button
              type="button"
              onClick={() => handleSelectVariable('codebase')}
              title="Find all occurrences of the selected word across all cells"
              aria-label="Select variable across codebase"
              style={{ ...smartSelBtnStyle, color: '#a78bfa', borderColor: 'rgba(167,139,250,0.4)' }}
            >
              $var in codebase
            </button>

            {/* Hint when no cell focused */}
            {!lastFocusedRef.current && (
              <span style={{ fontSize: 10, color: 'var(--de-text-dim)', marginLeft: 4 }}>
                click inside a cell first
              </span>
            )}
          </div>
        )}

        {/* ── Find & Replace panel (appears after Select Variable) ── */}
        {findResults && findTarget && (
          <div
            style={{
              marginBottom: 10, padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(59,125,216,0.06)',
              border: `1px solid ${ACCENT}30`,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT }}>
                Find &amp; Replace
              </span>
              <span
                style={{
                  fontSize: 10, padding: '1px 7px', borderRadius: 999,
                  background: findResults.total > 0 ? `${ACCENT}15` : 'rgba(248,113,113,0.12)',
                  color: findResults.total > 0 ? ACCENT : '#f87171',
                  border: `1px solid ${findResults.total > 0 ? `${ACCENT}30` : 'rgba(248,113,113,0.3)'}`,
                  fontWeight: 700,
                }}
              >
                {findResults.total} occurrence{findResults.total !== 1 ? 's' : ''} of &ldquo;{findTarget}&rdquo;
                {' '}{findResults.scope === 'codebase' ? 'across all cells' : 'in this cell'}
              </span>
              <button
                type="button"
                onClick={() => { setFindResults(null); setFindTarget(''); setReplaceWith(''); }}
                aria-label="Close Find & Replace"
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--de-text-dim)', fontSize: 13, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Replace input row */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  borderRadius: 8, border: `1px solid ${ACCENT}25`,
                  background: 'rgba(255,255,255,0.7)', overflow: 'hidden', flex: 1, minWidth: 180,
                }}
              >
                <span style={{ padding: '0 8px', fontSize: 11, color: 'var(--de-text-dim)', whiteSpace: 'nowrap', borderRight: `1px solid ${ACCENT}20` }}>
                  Replace with
                </span>
                <input
                  type="text"
                  value={replaceWith}
                  onChange={e => setReplaceWith(e.target.value)}
                  placeholder="new name…"
                  aria-label="Replace with"
                  style={{
                    flex: 1, padding: '6px 10px', border: 'none', outline: 'none',
                    background: 'transparent', fontSize: 12,
                    fontFamily: '"Fira Code","JetBrains Mono",monospace',
                    color: 'var(--de-heading)',
                  }}
                />
              </div>

              {findResults.scope === 'cell' && (
                <button
                  type="button"
                  onClick={() => handleReplaceAll('cell')}
                  disabled={!replaceWith}
                  aria-label="Replace in this cell"
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    background: replaceWith ? `${ACCENT}18` : 'rgba(160,195,240,0.1)',
                    color: replaceWith ? ACCENT : 'var(--de-text-dim)',
                    border: `1px solid ${replaceWith ? `${ACCENT}35` : 'rgba(160,195,240,0.2)'}`,
                    cursor: replaceWith ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                >
                  Replace in cell
                </button>
              )}

              <button
                type="button"
                onClick={() => handleReplaceAll('codebase')}
                disabled={!replaceWith}
                aria-label="Replace in all cells"
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: replaceWith ? 'rgba(167,139,250,0.15)' : 'rgba(160,195,240,0.1)',
                  color: replaceWith ? '#a78bfa' : 'var(--de-text-dim)',
                  border: `1px solid ${replaceWith ? 'rgba(167,139,250,0.35)' : 'rgba(160,195,240,0.2)'}`,
                  cursor: replaceWith ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                Replace in codebase
              </button>
            </div>
          </div>
        )}

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
                      onFocus={e => { lastFocusedRef.current = e.currentTarget; }}
                      data-cell-id={cell.id}
                      rows={Math.max(3, cell.code.split('\n').length + 1)}
                      spellCheck={false}
                      aria-label={`Cell ${cellIndex + 1} code`}
                      style={{
                        width: '100%',
                        background: CELL_BG,
                        color: CODE_FG,
                        fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", ui-monospace, monospace',
                        fontSize: ZOOM_BASE_FONT * codeZoom,
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
                        userSelect: selectMode ? 'text' : undefined,
                        cursor: selectMode ? 'text' : undefined,
                        transition: 'font-size 0.12s',
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
                            fontSize: Math.round(12 * codeZoom),
                            color: cell.status === 'error' ? OUT_ERR : OUT_OK,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            transition: 'font-size 0.12s',
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

        {/* ══════════════════════════════════════════════════════════════
            AI Code Assist — Trust Layer (PRODUCTION MODE — all 7 scopes active)
            Problem: AI says "rename X" but mobile users can't reliably
            select the right code.  Solution: scope picker → preview → apply.
            ══════════════════════════════════════════════════════════════ */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <ShieldCheck className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">
              AI Code Assist{CODEENGIN_PRODUCTION_MODE && <span style={{ fontSize: 9, fontWeight: 800, color: '#22c55e', marginLeft: 6, background: 'rgba(34,197,94,0.1)', padding: '1px 5px', borderRadius: 4 }}>LIVE</span>}
            </span>
            {/* Undo button — always visible when history exists */}
            {undoStack.length > 0 && (
              <button
                type="button"
                onClick={handleTrustUndo}
                title={undoStack[0]?.description ?? 'Undo last edit'}
                aria-label="Undo last AI edit"
                style={{
                  marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                  background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                  border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <Undo2 size={12} />
                Undo
              </button>
            )}
          </div>

          <div className="de-widget-body" style={{ padding: '12px 14px' }}>

            {/* ── STEP 1: Instruction input ── */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', marginBottom: 5, letterSpacing: '0.06em' }}>
                STEP 1 — Tell Dr. Eams what to change
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder='e.g. "rename score to userScore everywhere"'
                  value={assistPrompt}
                  onChange={e => setAssistPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAiAssist()}
                  aria-label="AI instruction"
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 9, fontSize: 12,
                    border: `1px solid ${ACCENT}30`, background: 'rgba(255,255,255,0.7)',
                    color: 'var(--de-heading)', outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAiAssist}
                  disabled={assistLoading || !assistPrompt.trim()}
                  className="de-btn de-btn-primary"
                  aria-label="Ask Dr. Eams"
                  style={{ opacity: assistLoading || !assistPrompt.trim() ? 0.6 : 1, transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                >
                  {assistLoading ? <Loader2 size={14} className="animate-spin" /> : 'Ask'}
                </button>
              </div>
            </div>

            {/* ── Trust Layer: steps 2–5 (shown when suggestion exists) ── */}
            {trustSuggestion && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Suggestion card */}
                <div
                  style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: `${ACCENT}08`, border: `1px solid ${ACCENT}22`,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, marginBottom: 4, letterSpacing: '0.06em' }}>
                    DR. EAMS SUGGESTS
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--de-heading)', lineHeight: 1.5 }}>
                    {trustSuggestion.instruction}
                  </div>
                  {trustSuggestion.target && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>Target:</span>
                      <code style={{ fontSize: 11, background: 'rgba(0,0,0,0.08)', padding: '1px 6px', borderRadius: 4, color: '#f87171', fontFamily: 'monospace' }}>
                        {trustSuggestion.target}
                      </code>
                      <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>→</span>
                      <code style={{ fontSize: 11, background: 'rgba(0,0,0,0.08)', padding: '1px 6px', borderRadius: 4, color: OUT_OK, fontFamily: 'monospace' }}>
                        {trustReplacement || '(empty)'}
                      </code>
                    </div>
                  )}
                  {/* Low-confidence warning — shown when Dr. Eams couldn't reliably parse the instruction */}
                  {trustSuggestion.confidence === 'low' && (
                    <div
                      style={{
                        marginTop: 8, padding: '6px 10px', borderRadius: 8, fontSize: 10,
                        background: 'rgba(245,158,11,0.08)', color: '#d97706',
                        border: '1px solid rgba(245,158,11,0.25)',
                        display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.45,
                      }}
                    >
                      <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>
                        Dr. Eams couldn&apos;t fully parse this instruction.
                        Set the target and scope manually below before applying.
                      </span>
                    </div>
                  )}
                  {/* Medium-confidence notice */}
                  {trustSuggestion.confidence === 'medium' && (
                    <div
                      style={{
                        marginTop: 8, padding: '5px 10px', borderRadius: 8, fontSize: 10,
                        background: 'rgba(245,158,11,0.05)', color: '#b45309',
                        border: '1px solid rgba(245,158,11,0.18)',
                        display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.45,
                      }}
                    >
                      <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>Verify the target word and scope are correct before applying.</span>
                    </div>
                  )}
                </div>

                {/* ── STEP 2: Scope picker ── */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', marginBottom: 6, letterSpacing: '0.06em' }}>
                    STEP 2 — Choose what to target
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {SCOPE_ORDER.map(scope => {
                      const risk  = SCOPE_RISK[scope];
                      const active = scope === trustScope;
                      const riskColor = risk === 'low' ? '#22c55e'
                        : risk === 'medium' ? '#f59e0b'
                        : risk === 'high'   ? '#f87171'
                        : '#c084fc'; // critical — purple
                      return (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => { setTrustScope(scope); setTrustPreview(null); }}
                          aria-label={`Select scope: ${SCOPE_LABEL[scope]}`}
                          aria-pressed={active}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 12px', borderRadius: 9, cursor: 'pointer',
                            background: active ? `${ACCENT}12` : 'rgba(255,255,255,0.5)',
                            border: active ? `1.5px solid ${ACCENT}` : '1px solid rgba(160,195,240,0.22)',
                            textAlign: 'left', transition: 'all 0.12s',
                          }}
                        >
                          {/* Risk indicator dot */}
                          <span
                            style={{
                              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                              background: riskColor,
                              opacity: active ? 1 : 0.45,
                            }}
                          />
                          <span style={{ flex: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? ACCENT : 'var(--de-heading)' }}>
                              {SCOPE_LABEL[scope]}
                            </span>
                            <span style={{ display: 'block', fontSize: 10, color: 'var(--de-text-dim)', marginTop: 1, lineHeight: 1.4 }}>
                              {SCOPE_DESCRIPTION[scope]}
                            </span>
                          </span>
                          {/* Suggested badge */}
                          {scope === trustSuggestion.suggestedScope && (
                            <span
                              style={{
                                fontSize: 9, fontWeight: 700, padding: '1px 6px',
                                borderRadius: 999, flexShrink: 0,
                                background: `${ACCENT}15`, color: ACCENT,
                                border: `1px solid ${ACCENT}30`,
                              }}
                            >
                              suggested
                            </span>
                          )}
                          {/* Risk label */}
                          {CONFIRMATION_REQUIRED.has(risk) && (
                            <AlertTriangle
                              size={12}
                              style={{ color: riskColor, flexShrink: 0, opacity: active ? 1 : 0.5 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Replace-with field (shown for word-based scopes) ── */}
                {(trustScope === 'word' || trustScope === 'word-in-file' || trustScope === 'word-in-codebase') && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', marginBottom: 5, letterSpacing: '0.06em' }}>
                      REPLACE WITH
                    </div>
                    <input
                      type="text"
                      value={trustReplacement}
                      onChange={e => { setTrustReplacement(e.target.value); setTrustPreview(null); }}
                      placeholder="New name or value…"
                      aria-label="Replace with"
                      style={{
                        width: '100%', padding: '7px 12px', borderRadius: 9, fontSize: 12,
                        border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                        color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box',
                        fontFamily: '"Fira Code","JetBrains Mono",monospace',
                      }}
                    />
                  </div>
                )}

                {/* ── STEP 3: Preview button ── */}
                <button
                  type="button"
                  onClick={handleTrustPreview}
                  aria-label="Preview what will be changed"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: `${ACCENT}12`, color: ACCENT,
                    border: `1px solid ${ACCENT}35`, transition: 'all 0.15s',
                  }}
                >
                  👁 Preview Change
                </button>

                {/* ── Preview panel (STEP 3 result) ── */}
                {trustPreview && (
                  <div
                    style={{
                      borderRadius: 12, overflow: 'hidden',
                      border: trustPreview.noMatches
                        ? '1px solid rgba(248,113,113,0.3)'
                        : `1px solid ${ACCENT}25`,
                    }}
                  >
                    {/* Preview header — match count + scope + risk */}
                    <div
                      style={{
                        padding: '8px 14px', display: 'flex', alignItems: 'center',
                        gap: 8, flexWrap: 'wrap',
                        background: trustPreview.noMatches
                          ? 'rgba(248,113,113,0.07)'
                          : `${ACCENT}07`,
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT }}>
                        STEP 3 — What will change
                      </span>
                      {!trustPreview.noMatches && (
                        <>
                          <span
                            style={{
                              fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                              background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30`,
                            }}
                          >
                            {trustPreview.matchCount} match{trustPreview.matchCount !== 1 ? 'es' : ''}
                          </span>
                          {trustPreview.affectedCellCount > 1 && (
                            <span
                              style={{
                                fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                                background: 'rgba(167,139,250,0.12)', color: '#a78bfa',
                                border: '1px solid rgba(167,139,250,0.3)',
                              }}
                            >
                              {trustPreview.affectedCellCount} cells affected
                            </span>
                          )}
                          {/* Risk badge */}
                          {(() => {
                            const c = trustPreview.risk === 'low'    ? '#22c55e'
                              : trustPreview.risk === 'medium' ? '#f59e0b'
                              : trustPreview.risk === 'high'   ? '#f87171'
                              : '#c084fc';
                            return (
                              <span
                                style={{
                                  fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700, marginLeft: 'auto',
                                  background: `${c}14`, color: c, border: `1px solid ${c}35`,
                                  display: 'flex', alignItems: 'center', gap: 4,
                                }}
                              >
                                {CONFIRMATION_REQUIRED.has(trustPreview.risk) && <AlertTriangle size={10} />}
                                {trustPreview.risk.toUpperCase()} RISK
                              </span>
                            );
                          })()}
                        </>
                      )}
                    </div>

                    {/* No-match state */}
                    {trustPreview.noMatches ? (
                      <div style={{ padding: '10px 14px', fontSize: 11, color: '#f87171' }}>
                        ⚠ No matches found for &ldquo;{trustPreview.target}&rdquo; with scope &ldquo;{trustPreview.scopeLabel}&rdquo;.
                        Try a different scope or check the word is in the active cell.
                      </div>
                    ) : (
                      <>
                        {/* Diff preview */}
                        {trustPreview.diffLines.length > 0 && (
                          <div
                            style={{
                              overflowX: 'auto', background: CELL_BG,
                              fontFamily: '"Fira Code","JetBrains Mono",monospace',
                              fontSize: 11, lineHeight: 1.6,
                              maxHeight: 220, overflowY: 'auto',
                            }}
                          >
                            {trustPreview.diffLines.map((line, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: '0 10px',
                                  background: line.type === 'removed'
                                    ? 'rgba(248,113,113,0.12)'
                                    : line.type === 'added'
                                    ? 'rgba(74,222,128,0.10)'
                                    : 'transparent',
                                  color: line.type === 'removed' ? '#f87171'
                                    : line.type === 'added'   ? OUT_OK
                                    : 'rgba(226,232,240,0.5)',
                                  whiteSpace: 'pre',
                                }}
                              >
                                {line.type === 'removed' ? '−' : line.type === 'added' ? '+' : ' '}
                                {' '}{line.content}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Match list (up to 5) */}
                        {trustPreview.matches.slice(0, 5).map((m, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '5px 14px', fontSize: 10, borderTop: '1px solid rgba(160,195,240,0.1)',
                              display: 'flex', gap: 6, alignItems: 'center', color: 'var(--de-text-dim)',
                            }}
                          >
                            <span style={{ color: ACCENT, fontWeight: 700, fontFamily: 'monospace' }}>
                              Line {m.lineNo}
                            </span>
                            <span style={{ fontFamily: 'monospace', color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.matched.slice(0, 60)}
                            </span>
                          </div>
                        ))}
                        {trustPreview.matchCount > 5 && (
                          <div style={{ padding: '4px 14px', fontSize: 10, color: 'var(--de-text-dim)', borderTop: '1px solid rgba(160,195,240,0.1)' }}>
                            … and {trustPreview.matchCount - 5} more
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ── Confirmation dialog (for high/critical risk) ── */}
                {trustConfirming && trustPreview && !trustPreview.noMatches && (
                  <div
                    style={{
                      padding: '12px 14px', borderRadius: 12,
                      background: 'rgba(248,113,113,0.07)',
                      border: '1.5px solid rgba(248,113,113,0.35)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <AlertTriangle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f87171' }}>
                        {trustPreview.risk === 'critical' ? 'This will change every occurrence across all open notebook cells.' : 'This will change the entire file.'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--de-text)', marginBottom: 10, lineHeight: 1.5 }}>
                      {trustPreview.matchCount} occurrence{trustPreview.matchCount !== 1 ? 's' : ''} across{' '}
                      {trustPreview.affectedCellCount} cell{trustPreview.affectedCellCount !== 1 ? 's' : ''} will be modified.
                      Undo is available immediately after.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleTrustApply}
                        aria-label="Confirm and apply the edit"
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          background: 'rgba(248,113,113,0.15)', color: '#f87171',
                          border: '1px solid rgba(248,113,113,0.35)', cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        Yes, Apply
                      </button>
                      <button
                        type="button"
                        onClick={handleTrustReject}
                        aria-label="Cancel the edit"
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: 'rgba(160,195,240,0.1)', color: 'var(--de-text)',
                          border: '1px solid rgba(160,195,240,0.22)', cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 4 / 5: Apply + Reject buttons (low/medium risk) ── */}
                {trustPreview && !trustPreview.noMatches && !trustConfirming && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleTrustApply}
                      aria-label="Apply the change"
                      style={{
                        flex: 2, padding: '9px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                        background: `${ACCENT}18`, color: ACCENT,
                        border: `1px solid ${ACCENT}35`, cursor: 'pointer',
                        transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <CheckCircle size={14} />
                      Apply Change
                    </button>
                    <button
                      type="button"
                      onClick={handleTrustReject}
                      aria-label="Reject the change"
                      style={{
                        flex: 1, padding: '9px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                        background: 'rgba(248,113,113,0.08)', color: '#f87171',
                        border: '1px solid rgba(248,113,113,0.25)', cursor: 'pointer',
                        transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <X size={14} />
                      Reject
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* Fallback text response (for non-scoped queries) */}
            {assistResponse && !trustSuggestion && (
              <pre
                style={{
                  padding: '10px 12px', borderRadius: 10, margin: 0,
                  background: CELL_BG, color: OUT_OK,
                  fontSize: 11, fontFamily: 'monospace', overflowX: 'auto',
                  border: `1px solid ${ACCENT}20`, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}
              >
                {assistResponse}
              </pre>
            )}

          </div>
        </div>

        {/* ── Pair Programming ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <FolderOpen className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Pair Programming</span>
            {pairActive && (
              <span
                className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                Live
              </span>
            )}
          </div>
          <div className="de-widget-body">
            {pairActive ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: `${ACCENT}08`, border: `1px solid ${ACCENT}25`, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 4 }}>SESSION CODE</div>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.15em', color: ACCENT, fontFamily: 'monospace' }}>{pairCode}</div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(160,195,240,0.18)', fontSize: 11, color: 'var(--de-text-dim)' }}>
                  Partner cursor: <span style={{ color: ACCENT, fontWeight: 700, fontFamily: 'monospace' }}>{pairCursor}</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
                Start a pair programming session and share the code with your partner.
              </p>
            )}
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handlePairToggle}
              className={pairActive ? 'de-btn de-btn-ghost' : 'de-btn de-btn-primary'}
              aria-label={pairActive ? 'End pair programming session' : 'Start pair programming session'}
              style={{ transition: 'all 0.15s' }}
            >
              {pairActive ? 'End Session' : 'Start Session'}
            </button>
          </div>
        </div>

        {/* ── Deployment Console ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <CheckCircle className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Deployment Console</span>
            {deployStatus !== 'idle' && (
              <span
                className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
                style={{
                  background: deployStatus === 'success' ? 'rgba(34,197,94,0.12)' : deployStatus === 'error' ? 'rgba(239,68,68,0.12)' : `${ACCENT}12`,
                  color: deployStatus === 'success' ? '#22c55e' : deployStatus === 'error' ? '#ef4444' : ACCENT,
                  border: `1px solid ${deployStatus === 'success' ? 'rgba(34,197,94,0.25)' : deployStatus === 'error' ? 'rgba(239,68,68,0.25)' : ACCENT + '30'}`,
                }}
              >
                {deployStatus === 'deploying' ? 'Deploying…' : deployStatus === 'success' ? '✓ Deployed' : 'Error'}
              </span>
            )}
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {(['vercel', 'supabase'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setDeployTarget(t); setDeployStatus('idle'); setDeployLog([]); }}
                  aria-label={`Deploy to ${t}`}
                  style={{
                    padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                    border: `1.5px solid ${deployTarget === t ? ACCENT : 'rgba(160,195,240,0.25)'}`,
                    background: deployTarget === t ? `${ACCENT}15` : 'rgba(255,255,255,0.5)',
                    color: deployTarget === t ? ACCENT : 'var(--de-text)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {t === 'vercel' ? '▲ Vercel' : '⚡ Supabase'}
                </button>
              ))}
            </div>
            {deployLog.length > 0 && (
              <div
                style={{
                  padding: '10px 12px', borderRadius: 9,
                  background: CELL_BG, border: `1px solid ${ACCENT}20`,
                  maxHeight: 120, overflowY: 'auto',
                  display: 'flex', flexDirection: 'column', gap: 3,
                }}
              >
                {deployLog.map((line, i) => (
                  <div key={i} style={{ fontSize: 11, fontFamily: 'monospace', color: line.startsWith('✅') ? OUT_OK : CODE_FG }}>
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleDeploy}
              disabled={deployStatus === 'deploying'}
              className="de-btn de-btn-primary"
              aria-label={`Deploy to ${deployTarget}`}
              style={{ opacity: deployStatus === 'deploying' ? 0.6 : 1, transition: 'all 0.15s' }}
            >
              {deployStatus === 'deploying' ? 'Deploying…' : `Deploy to ${deployTarget}`}
            </button>
          </div>
        </div>

        {/* ── API Inspector ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Gamepad2 className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">API Inspector</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {(['GET', 'POST', 'PUT', 'DELETE'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setApiMethod(m)}
                  aria-label={`Set method to ${m}`}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    border: `1.5px solid ${apiMethod === m ? ACCENT : 'rgba(160,195,240,0.25)'}`,
                    background: apiMethod === m ? `${ACCENT}15` : 'rgba(255,255,255,0.5)',
                    color: apiMethod === m ? ACCENT : 'var(--de-text)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="URL e.g. /api/posts"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              aria-label="API URL"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 9, fontSize: 12, marginBottom: 8,
                border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {(apiMethod === 'POST' || apiMethod === 'PUT') && (
              <textarea
                placeholder='{"content":"hello"}'
                value={apiBody}
                onChange={e => setApiBody(e.target.value)}
                aria-label="Request body"
                rows={3}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 9, fontSize: 11, fontFamily: 'monospace',
                  border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                  color: 'var(--de-heading)', outline: 'none', resize: 'vertical', marginBottom: 8,
                  boxSizing: 'border-box',
                }}
              />
            )}
            {apiResponse && (
              <pre
                style={{
                  padding: '10px 12px', borderRadius: 9, margin: '0 0 8px',
                  background: CELL_BG, color: OUT_OK,
                  fontSize: 11, fontFamily: 'monospace', overflowX: 'auto',
                  border: `1px solid ${ACCENT}20`, maxHeight: 130,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}
              >
                {apiResponse}
              </pre>
            )}
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleApiSend}
              disabled={!apiUrl.trim()}
              className="de-btn de-btn-primary"
              aria-label="Send API request"
              style={{ opacity: !apiUrl.trim() ? 0.5 : 1, transition: 'all 0.15s' }}
            >
              Send {apiMethod}
            </button>
          </div>
        </div>

        {/* ── Snippet Library ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Plus className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Snippet Library</span>
            <span
              className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
            >
              {snippets.length} snippets
            </span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
              {snippets.map(sn => (
                <div
                  key={sn.id}
                  style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(160,195,240,0.18)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{sn.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: ACCENT, background: `${ACCENT}12`, padding: '2px 6px', borderRadius: 4 }}>{sn.language}</span>
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard.writeText(sn.code)}
                      aria-label={`Copy snippet ${sn.name}`}
                      style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                        border: `1px solid ${ACCENT}30`, background: `${ACCENT}10`, color: ACCENT,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => setSnippets(prev => prev.filter(s => s.id !== sn.id))}
                      aria-label={`Delete snippet ${sn.name}`}
                      style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                        border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <pre
                    style={{
                      margin: 0, padding: '6px 8px', borderRadius: 7,
                      background: CELL_BG, color: CODE_FG,
                      fontSize: 10, fontFamily: 'monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {sn.code.split('\n')[0]}
                  </pre>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <input
                type="text"
                placeholder="Snippet name…"
                value={newSnippetName}
                onChange={e => setNewSnippetName(e.target.value)}
                aria-label="New snippet name"
                style={{
                  padding: '7px 12px', borderRadius: 9, fontSize: 12,
                  border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                  color: 'var(--de-heading)', outline: 'none',
                }}
              />
              <textarea
                placeholder="Snippet code…"
                value={newSnippetCode}
                onChange={e => setNewSnippetCode(e.target.value)}
                aria-label="New snippet code"
                rows={3}
                style={{
                  padding: '7px 12px', borderRadius: 9, fontSize: 11, fontFamily: 'monospace',
                  border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                  color: 'var(--de-heading)', outline: 'none', resize: 'vertical',
                }}
              />
              <button
                type="button"
                onClick={handleSaveSnippet}
                disabled={!newSnippetName.trim() || !newSnippetCode.trim()}
                className="de-btn de-btn-primary"
                aria-label="Save new snippet"
                style={{ opacity: !newSnippetName.trim() || !newSnippetCode.trim() ? 0.5 : 1, transition: 'all 0.15s' }}
              >
                Save Snippet
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            TAB: Diff Viewer
            ════════════════════════════════════════ */}
        {activeTab === 'diff' && (
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Diff Viewer</span>
              <span
                style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}30`,
                }}
              >
                full-file mode
              </span>
            </div>
            <div className="de-widget-body" style={{ padding: '12px 14px' }}>
              <DiffViewer defaultFullFile />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Module-level style helpers ───────────────────────────────────────────────

function codeToolBtnStyle(disabled: boolean): CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '4px 8px', borderRadius: 7,
    border: '1px solid rgba(160,195,240,0.35)',
    background: 'rgba(0,0,0,0.03)',
    color: disabled ? 'rgba(100,116,139,0.35)' : 'var(--de-text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 12, lineHeight: 1,
    transition: 'background 0.12s',
    flexShrink: 0,
  };
}

const selBtnStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '5px 9px', borderRadius: 8,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#e2e8f0',
  cursor: 'pointer', fontSize: 11, fontWeight: 600,
  transition: 'background 0.12s',
  whiteSpace: 'nowrap',
};

const smartSelBtnStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 10px', borderRadius: 7,
  border: '1px solid rgba(160,195,240,0.30)',
  background: 'rgba(255,255,255,0.55)',
  color: 'var(--de-text)',
  cursor: 'pointer', fontSize: 11, fontWeight: 600,
  transition: 'background 0.12s',
  whiteSpace: 'nowrap',
};

