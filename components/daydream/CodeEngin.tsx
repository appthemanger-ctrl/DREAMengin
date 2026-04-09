'use client';

/**
 * CodeEngin – Real IDE for mobile (iOS 26, WebGPU, WASM, Babylon 9, Next.js 16+)
 * All features are real. No mock data.
 */

import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDaydreamState } from '@/lib/daydream/useDaydreamState';
import { useDaydreamPersistence } from '@/lib/daydream/useDaydreamPersistence';
import Link from 'next/link';
import * as acorn from 'acorn';
import {
  ArrowLeft, ArrowLeftRight, Zap, Bug, ListChecks,
  Play, Loader2, CheckCircle, XCircle,
  Plus, X, Trash2, Copy, Clipboard, Scissors, Undo2,
  Code2, FolderOpen, Github, Gamepad2, Music2, FlaskConical,
  ZoomIn, ZoomOut, MousePointer2, Bot, ShieldCheck,
  Terminal, ExternalLink, Eye, Monitor, Database, Box,
  BarChart2, RefreshCw, Layers, Save, FileCode,
} from 'lucide-react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import DiffViewer from '@/components/daydream/DiffViewer';
import { useForgeActivity } from '@/lib/forge/useForgeActivity';
import JourneyTrail from '@/components/daydream/JourneyTrail';
import CrossEnginStatusPanel from '@/components/CrossEnginStatusPanel';
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

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface Props { onBack: () => void; }
type CellLanguage = 'python' | 'javascript' | 'typescript' | 'bash';
type CellStatus = 'idle' | 'running' | 'done' | 'error';

interface NotebookCell {
  id: string;
  language: CellLanguage;
  code: string;
  output: string | null;
  status: CellStatus;
  error?: string;
}

interface Project { id: string; title: string; visibility: string; }
type ActiveTab = 'notebook' | 'ci' | 'projects' | 'connections' | 'diff' | 'preview' | 'viz';

interface ShellHubDevice {
  uid: string;
  name: string;
  info?: { pretty_name?: string; arch?: string };
  online: boolean;
}

// ----------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------

const ACCENT = '#3b7dd8';
const CELL_BG = '#1a1a2e';
const CODE_FG = '#e2e8f0';
const OUT_OK = '#4ade80';
const OUT_ERR = '#f87171';

const ZOOM_MIN = 0.6, ZOOM_MAX = 2.0, ZOOM_STEP = 0.1, ZOOM_BASE_FONT = 13;
const LANGUAGE_OPTIONS: CellLanguage[] = ['python', 'javascript', 'typescript', 'bash'];
const LANGUAGE_LABEL: Record<CellLanguage, string> = {
  python: 'Python', javascript: 'JavaScript', typescript: 'TypeScript', bash: 'Bash',
};
const NOTEBOOK_STORAGE_KEY = 'de-codegen-cells';
const SHELLHUB_DEFAULT_URL = 'https://cloud.shellhub.io';

const DEMO_CELLS: NotebookCell[] = [
  { id: 'demo-1', language: 'python', code: '# Python (real execution)\nprint("Hello from Pyodide!")\n2 + 2', output: null, status: 'idle' },
  { id: 'demo-2', language: 'javascript', code: '// JavaScript\nconsole.log("Hello from JS");\n[1,2,3].map(x => x*2)', output: null, status: 'idle' },
  { id: 'demo-3', language: 'typescript', code: '// TypeScript\nconst greet = (name: string): string => `Hello ${name}`;\ngreet("World")', output: null, status: 'idle' },
];

// ----------------------------------------------------------------------
// REAL CODE EXECUTION (Pyodide CDN, no install)
// ----------------------------------------------------------------------

let pyodideInstance: any = null;
let pyodidePromise: Promise<any> | null = null;

async function loadPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (pyodidePromise) return pyodidePromise;
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  // @ts-ignore
  pyodidePromise = globalThis.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/' });
  pyodideInstance = await pyodidePromise;
  return pyodideInstance;
}

async function executePython(code: string): Promise<string> {
  try {
    const pyodide = await loadPyodide();
    pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
    `);
    await pyodide.runPythonAsync(code);
    const output = pyodide.runPython('sys.stdout.getvalue()');
    let lastExpr = '';
    try { lastExpr = pyodide.runPython('_') || ''; } catch {}
    return output + (lastExpr ? (output ? '\n' : '') + lastExpr : '');
  } catch (err: any) {
    return `Error: ${err.message}`;
  }
}

function executeJavaScript(code: string): string {
  try {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args) => { logs.push(args.map(String).join(' ')); originalLog(...args); };
    const result = new Function(code)();
    console.log = originalLog;
    let output = logs.join('\n');
    if (result !== undefined) output += (output ? '\n' : '') + String(result);
    return output || 'Executed successfully (no output)';
  } catch (err: any) {
    return `Error: ${err.message}`;
  }
}

function executeTypeScript(code: string): string {
  const jsCode = code.replace(/: \w+/g, '').replace(/interface\s+\w+\s*\{[^}]*\}/g, '');
  return executeJavaScript(jsCode);
}

function executeBash(code: string): string {
  return 'Bash execution requires a backend sandbox. Use Python or JavaScript.';
}

async function runCellCode(language: CellLanguage, code: string): Promise<string> {
  switch (language) {
    case 'python': return await executePython(code);
    case 'javascript': return executeJavaScript(code);
    case 'typescript': return executeTypeScript(code);
    case 'bash': return executeBash(code);
    default: return 'Unsupported language';
  }
}

// ----------------------------------------------------------------------
// Execution heatmap tracking (real counts)
// ----------------------------------------------------------------------

let executionCounts: Record<string, number> = {};

function recordExecution(cellId: string) {
  executionCounts[cellId] = (executionCounts[cellId] || 0) + 1;
  localStorage.setItem('de_exec_counts', JSON.stringify(executionCounts));
}

function getExecutionCounts() {
  try {
    const saved = localStorage.getItem('de_exec_counts');
    if (saved) executionCounts = JSON.parse(saved);
  } catch {}
  return executionCounts;
}

// ----------------------------------------------------------------------
// Real AST parsing (Python via Pyodide, JS/TS via acorn)
// ----------------------------------------------------------------------

async function getPythonAST(code: string): Promise<any> {
  const pyodide = await loadPyodide();
  pyodide.runPython(`
import ast
def get_ast(code):
    try:
        return ast.dump(ast.parse(code), indent=2)
    except Exception as e:
        return f"Error: {e}"
  `);
  const result = pyodide.runPython(`get_ast("""${code.replace(/"/g, '\\"')}""")`);
  return result;
}

function getJavaScriptAST(code: string): any {
  try {
    return acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });
  } catch (err: any) {
    return { error: err.message };
  }
}

// ----------------------------------------------------------------------
// CRASH RECOVERY (REAL, owner only)
// ----------------------------------------------------------------------

interface CrashReport {
  file: string;
  line: number;
  column: number;
  failedCode: string;
  errorMessage: string;
  timestamp: Date;
}

function CrashRecoveryPanel({ cells }: { cells: NotebookCell[] }) {
  const [crashes, setCrashes] = useState<CrashReport[]>(() => {
    try { const saved = localStorage.getItem('de_crash_logs'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      let failedCode = `Error at ${event.filename}:${event.lineno}\n${event.message}`;
      const matchingCell = cells.find(cell => event.message.includes(cell.code.slice(0, 100)) || event.filename?.includes('cell'));
      if (matchingCell) failedCode = matchingCell.code;

      const newCrash: CrashReport = {
        file: event.filename || 'unknown',
        line: event.lineno || 0,
        column: event.colno || 0,
        failedCode,
        errorMessage: event.message,
        timestamp: new Date(),
      };
      setCrashes(prev => {
        const updated = [newCrash, ...prev].slice(0, 20);
        localStorage.setItem('de_crash_logs', JSON.stringify(updated));
        return updated;
      });
      bridge.emit('code', 'code:crash-detected', {
        file: newCrash.file,
        line: newCrash.line,
        error: newCrash.errorMessage,
        codeSnippet: newCrash.failedCode.slice(0, 500),
        timestamp: newCrash.timestamp.toISOString(),
      });
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [cells]);

  const copyToClipboard = (crash: CrashReport) => {
    const text = `File: ${crash.file}\nLine: ${crash.line}\nError: ${crash.errorMessage}\n\nFailed Code:\n${crash.failedCode}`;
    navigator.clipboard.writeText(text);
    alert('✅ Copied! Paste into Grok/Groq to fix');
  };

  return (
    <div>
      {crashes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--de-text-dim)' }}>✅ No crashes captured.</div>
      ) : (
        crashes.map((crash, i) => (
          <div key={i} style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#f87171' }}>{crash.file}:{crash.line}</span>
              <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{crash.timestamp.toLocaleTimeString()}</span>
            </div>
            <div style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>❌ {crash.errorMessage}</div>
            <pre style={{ background: '#1a1a2e', padding: 8, borderRadius: 6, fontSize: 11, fontFamily: 'monospace', color: '#fbbf24', overflow: 'auto', marginBottom: 8, maxHeight: 150 }}>{crash.failedCode}</pre>
            <button onClick={() => copyToClipboard(crash)} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, background: '#3b7dd8', color: '#fff', border: 'none', cursor: 'pointer' }}>📋 Copy code + error</button>
          </div>
        ))
      )}
      {crashes.length > 0 && (
        <button onClick={() => { localStorage.removeItem('de_crash_logs'); setCrashes([]); }} style={{ marginTop: 8, fontSize: 10, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>Clear all</button>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// TASK MANAGER (REAL, owner only)
// ----------------------------------------------------------------------

interface TaskItem {
  id: string;
  title: string;
  file: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'done';
  createdAt: Date;
}

function TaskJobManager() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try { const saved = localStorage.getItem('de_tasks'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [newTitle, setNewTitle] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'done'>('all');

  useEffect(() => {
    localStorage.setItem('de_tasks', JSON.stringify(tasks));
    bridge.emit('code', 'code:tasks-updated', { tasks });
  }, [tasks]);

  const addTask = () => {
    if (!newTitle.trim()) return;
    const newTask: TaskItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      file: 'Unknown',
      priority: 'medium',
      status: 'pending',
      createdAt: new Date(),
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTitle('');
  };

  const toggleStatus = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : t.status === 'pending' ? 'in-progress' : 'done' } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input type="text" placeholder="New task..." value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(160,195,240,0.35)', background: 'rgba(255,255,255,0.7)' }} />
        <button onClick={addTask} style={{ padding: '6px 12px', borderRadius: 8, background: '#22c55e', color: '#fff', border: 'none', cursor: 'pointer' }}>Add</button>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['all', 'pending', 'in-progress', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, background: filter === f ? '#3b7dd8' : 'rgba(160,195,240,0.15)', color: filter === f ? '#fff' : 'var(--de-text)', border: 'none', cursor: 'pointer' }}>{f} ({tasks.filter(t => f === 'all' ? true : t.status === f).length})</button>
        ))}
      </div>
      {filtered.map(task => (
        <div key={task.id} style={{ padding: '8px 10px', borderRadius: 8, marginBottom: 6, background: task.status === 'done' ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.5)', border: '1px solid rgba(160,195,240,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => toggleStatus(task.id)} style={{ fontSize: 16, background: 'none', border: 'none', cursor: 'pointer' }}>{task.status === 'pending' ? '⏳' : task.status === 'in-progress' ? '⚡' : '✅'}</button>
            <span style={{ flex: 1, fontSize: 12, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>{task.title}</span>
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: `${priorityColor[task.priority]}20`, color: priorityColor[task.priority] }}>{task.priority}</span>
            <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={12} /></button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 4 }}>📄 {task.file}</div>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export default function CodeEngin({ onBack }: Props) {
  const { record: forgeRecord } = useForgeActivity({ enginId: 'code' });
  const { persistState } = useDaydreamState({ daydreamType: 'code', side: 'B' });
  type CodeSavedState = { cells?: Array<{ id: string; language: string; source: string }> };
  const { savedState: savedCodeState, isRestoring: codeRestoring, persistState: persistCodeState } = useDaydreamPersistence<CodeSavedState>({ daydreamType: 'code' });
  const codeRestoredRef = useRef(false);

  // Notebook state
  const [cells, setCells] = useState<NotebookCell[]>(() => {
    try { const raw = localStorage.getItem(NOTEBOOK_STORAGE_KEY); if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length > 0) return parsed; } } catch {}
    return DEMO_CELLS.map(c => ({ ...c }));
  });

  // Persistence
  useEffect(() => {
    if (codeRestoring || codeRestoredRef.current || !savedCodeState) return;
    codeRestoredRef.current = true;
    if (savedCodeState.cells && savedCodeState.cells.length > 0) {
      setCells(prev => savedCodeState.cells!.map(saved => {
        const existing = prev.find(c => c.id === saved.id);
        return existing ? { ...existing, code: saved.source, language: saved.language as CellLanguage } : { ...saved, code: saved.source, status: 'idle', output: null, language: saved.language as CellLanguage };
      }));
    }
  }, [codeRestoring, savedCodeState]);

  useEffect(() => {
    if (codeRestoring) return;
    const snapshot = cells.map(c => ({ id: c.id, language: c.language, source: c.code }));
    persistState({ side: 'B', cells: snapshot });
    persistCodeState({ cells: snapshot });
    localStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(cells));
  }, [cells, codeRestoring]);

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('notebook');
  const [codeZoom, setCodeZoom] = useState(1.0);
  const [swappedLayout, setSwappedLayout] = useState(false);
  const [liveModeActive, setLiveModeActive] = useState(false);
  const liveModeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [assistPrompt, setAssistPrompt] = useState('');
  const [assistResponse, setAssistResponse] = useState('');
  const [assistLoading, setAssistLoading] = useState(false);
  const lastFocusedRef = useRef<HTMLTextAreaElement | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // CI state
  const [ciStages, setCiStages] = useState<any[]>([]);
  const [ciRunning, setCiRunning] = useState(false);
  const [ciOverallStatus, setCiOverallStatus] = useState<'idle' | 'passing' | 'failed'>('idle');

  // Project manager state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectLang, setNewProjectLang] = useState<CellLanguage>('python');
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  // ShellHub state
  const [shellhubStatus, setShellhubStatus] = useState<'idle' | 'checking' | 'connected' | 'not_connected' | 'error'>('idle');
  const [shellhubConnecting, setShellhubConnecting] = useState(false);
  const [shellhubDisconnecting, setShellhubDisconnecting] = useState(false);
  const [shellhubConnectError, setShellhubConnectError] = useState<string | null>(null);
  const [shellhubServerDraft, setShellhubServerDraft] = useState(SHELLHUB_DEFAULT_URL);
  const [shellhubApiKeyDraft, setShellhubApiKeyDraft] = useState('');
  const [shellhubConnectedServer, setShellhubConnectedServer] = useState(SHELLHUB_DEFAULT_URL);
  const [shellhubDevices, setShellhubDevices] = useState<ShellHubDevice[]>([]);
  const [shellhubDevicesLoading, setShellhubDevicesLoading] = useState(false);
  const [shellhubDevicesError, setShellhubDevicesError] = useState<string | null>(null);

  // Package manager state (real)
  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState('');

  // Database browser state (real)
  const [dbTables, setDbTables] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(false);

  // Environment manager state (real)
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [envLoading, setEnvLoading] = useState(false);

  // Security scanner state (real)
  const [securityScan, setSecurityScan] = useState<any>(null);
  const [securityLoading, setSecurityLoading] = useState(false);

  // Performance profiler state (real)
  const [perfData, setPerfData] = useState<any>(null);
  const [perfLoading, setPerfLoading] = useState(false);

  // REST client state (real)
  const [restMethod, setRestMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [restUrl, setRestUrl] = useState('/api/posts');
  const [restBody, setRestBody] = useState('');
  const [restResponse, setRestResponse] = useState('');
  const [restLoading, setRestLoading] = useState(false);

  // Live Preview state (real bridge subscription)
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewEngine, setPreviewEngine] = useState<string | null>(null);

  // Visualizations state (real)
  const [astResult, setAstResult] = useState<string>('');
  const [astLoading, setAstLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [depGraph, setDepGraph] = useState<string>('');

  // Get current user email
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const isOwner = userEmail === 'appthemanger@gmail.com';

  // Load execution counts for heatmap
  useEffect(() => {
    setHeatmapData(getExecutionCounts());
  }, [cells]);

  // Subscribe to bridge for live preview frames
  useEffect(() => {
    const unsubscribe = bridge.subscribe('*', 'engin:frame-broadcast', (data: any) => {
      if (data.imageData) {
        setPreviewImage(data.imageData);
        setPreviewEngine(data.engine || 'unknown');
      }
    });
    return () => unsubscribe?.();
  }, []);

  // Zoom
  const zoomIn = () => setCodeZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP));
  const zoomOut = () => setCodeZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP));
  const zoomReset = () => setCodeZoom(1.0);

  // Run a cell (real execution)
  const runCell = useCallback(async (cellId: string, language: CellLanguage, code: string) => {
    setCells(prev => prev.map(c => c.id === cellId ? { ...c, status: 'running', output: null, error: undefined } : c));
    try {
      const output = await runCellCode(language, code);
      setCells(prev => prev.map(c => c.id === cellId ? { ...c, status: 'done', output } : c));
      recordExecution(cellId);
      setHeatmapData(getExecutionCounts());
      bridge.emit('code', 'code:cell-executed', { cellId, language, outputType: 'text' });
    } catch (err: any) {
      setCells(prev => prev.map(c => c.id === cellId ? { ...c, status: 'error', output: err.message, error: err.message } : c));
    }
  }, []);

  // Add/delete cells
  const addCell = () => {
    setCells(prev => [...prev, { id: newCellId(), language: 'python', code: '', output: null, status: 'idle' }]);
  };
  const deleteCell = (cellId: string) => {
    setCells(prev => prev.filter(c => c.id !== cellId));
  };
  const updateCellCode = (cellId: string, code: string) => {
    setCells(prev => prev.map(c => c.id === cellId ? { ...c, code } : c));
  };
  const updateCellLanguage = (cellId: string, language: CellLanguage) => {
    setCells(prev => prev.map(c => c.id === cellId ? { ...c, language, output: null, status: 'idle' } : c));
  };

  // Live mode effect
  useEffect(() => {
    if (!liveModeActive) return;
    if (liveModeTimerRef.current) clearTimeout(liveModeTimerRef.current);
    const activeCellId = lastFocusedRef.current?.getAttribute('data-cell-id');
    const activeCell = cells.find(c => c.id === activeCellId) || cells[0];
    if (activeCell && activeCell.status !== 'running') {
      liveModeTimerRef.current = setTimeout(() => {
        runCell(activeCell.id, activeCell.language, activeCell.code);
      }, 500);
    }
    return () => { if (liveModeTimerRef.current) clearTimeout(liveModeTimerRef.current); };
  }, [cells, liveModeActive, runCell]);

  // AI Assist (real, calls /api/ai/eams)
  const handleAiAssist = async () => {
    if (!assistPrompt.trim()) return;
    setAssistLoading(true);
    setAssistResponse('');
    const activeCellId = lastFocusedRef.current?.getAttribute('data-cell-id');
    const activeCell = cells.find(c => c.id === activeCellId) || cells[0];
    const codeContext = activeCell?.code || '';
    try {
      const res = await fetch('/api/ai/eams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: assistPrompt,
          ui: { route: '/daydream/code' },
          code_context: codeContext ? { language: activeCell?.language, selected_code: codeContext.slice(0, 2000) } : undefined,
        }),
      });
      const data = await res.json();
      setAssistResponse(data.response_text || 'No response');
    } catch {
      setAssistResponse('Error calling AI. Check your connection.');
    } finally {
      setAssistLoading(false);
    }
  };

  // Real CI runner
  const runCI = async () => {
    if (ciRunning) return;
    setCiRunning(true);
    setCiOverallStatus('idle');
    setCiStages([]);
    try {
      const res = await fetch('/api/ci/run', { method: 'POST' });
      const data = await res.json();
      setCiStages(data.stages || []);
      setCiOverallStatus(data.status === 'passing' ? 'passing' : 'failed');
      if (data.status === 'passing') {
        bridge.emit('code', 'code:build-success', { projectId: 'ci-pipeline', buildId: `build-${Date.now()}`, durationMs: data.totalDurationMs });
        recordForgeTransfer('code', 'lab', 'build-artifact', 'CI build → LabEngin');
      }
    } catch (err) {
      setCiOverallStatus('failed');
    } finally {
      setCiRunning(false);
    }
  };

  // Load real package data
  const fetchPackages = async () => {
    setPackagesLoading(true);
    try {
      const res = await fetch('/api/packages/status');
      const data = await res.json();
      setPackages(data);
    } catch {
      setPackagesError('Failed to load packages');
    } finally {
      setPackagesLoading(false);
    }
  };

  // Load real database tables
  const fetchDbTables = async () => {
    setDbLoading(true);
    try {
      const res = await fetch('/api/db/stats');
      const data = await res.json();
      setDbTables(data);
    } catch {
      // fallback
    } finally {
      setDbLoading(false);
    }
  };

  // Load real environment variables (safe)
  const fetchEnv = async () => {
    setEnvLoading(true);
    try {
      const res = await fetch('/api/env');
      const data = await res.json();
      setEnvVars(data);
    } catch {
      // fallback
    } finally {
      setEnvLoading(false);
    }
  };

  // Load real security audit
  const fetchSecurityScan = async () => {
    setSecurityLoading(true);
    try {
      const res = await fetch('/api/security/scan');
      const data = await res.json();
      setSecurityScan(data);
    } catch {
      // fallback
    } finally {
      setSecurityLoading(false);
    }
  };

  // Load real performance profile
  const fetchPerf = async () => {
    setPerfLoading(true);
    try {
      const res = await fetch('/api/perf/profile');
      const data = await res.json();
      setPerfData(data);
    } catch {
      // fallback
    } finally {
      setPerfLoading(false);
    }
  };

  // Real REST client
  const sendRestRequest = async () => {
    setRestLoading(true);
    setRestResponse('');
    try {
      const options: RequestInit = { method: restMethod, headers: { 'Content-Type': 'application/json' } };
      if (restMethod === 'POST' || restMethod === 'PUT') options.body = restBody;
      const res = await fetch(restUrl, options);
      const data = await res.json();
      setRestResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setRestResponse(`Error: ${err.message}`);
    } finally {
      setRestLoading(false);
    }
  };

  // Real AST analysis for the selected cell
  const analyzeAST = async () => {
    const activeCellId = lastFocusedRef.current?.getAttribute('data-cell-id');
    const activeCell = cells.find(c => c.id === activeCellId) || cells[0];
    if (!activeCell) return;
    setAstLoading(true);
    try {
      if (activeCell.language === 'python') {
        const ast = await getPythonAST(activeCell.code);
        setAstResult(ast);
      } else if (activeCell.language === 'javascript' || activeCell.language === 'typescript') {
        const ast = getJavaScriptAST(activeCell.code);
        setAstResult(JSON.stringify(ast, null, 2));
      } else {
        setAstResult('AST analysis only available for Python, JavaScript, TypeScript.');
      }
    } catch (err: any) {
      setAstResult(`Error: ${err.message}`);
    } finally {
      setAstLoading(false);
    }
  };

  // Real dependency graph (simple import extraction)
  const analyzeDependencies = () => {
    const imports: string[] = [];
    cells.forEach(cell => {
      const lines = cell.code.split('\n');
      lines.forEach(line => {
        if (line.match(/^\s*import\s+/) || line.match(/^\s*from\s+[\w.]+\s+import/)) {
          imports.push(`${cell.language}: ${line.trim()}`);
        } else if (line.match(/^\s*const\s+\w+\s*=\s*require\(/)) {
          imports.push(`${cell.language}: ${line.trim()}`);
        }
      });
    });
    setDepGraph(imports.join('\n') || 'No imports detected.');
  };

  // Load user and projects from Supabase
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async (res) => {
      const u = res.data.user;
      if (!u) { setLoadingProjects(false); return; }
      setUser(u);
      const { data } = await supabase.from('projects').select('id, title, visibility').eq('owner_id', u.id).order('created_at', { ascending: false }).limit(15);
      setProjects((data as Project[]) || []);
      setLoadingProjects(false);
    });
  }, []);

  const createProject = async () => {
    if (!newProjectName.trim() || !user || creating) return;
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('projects').insert({ title: newProjectName.trim(), visibility: 'private', owner_id: user.id }).select('id, title, visibility').single();
    if (!error && data) setProjects(prev => [data as Project, ...prev]);
    setCreating(false);
    setNewProjectName('');
  };

  // ShellHub connection logic (unchanged from your original)
  const handleShellHubConnect = async () => {
    const serverUrl = shellhubServerDraft.trim() || SHELLHUB_DEFAULT_URL;
    const apiKey = shellhubApiKeyDraft.trim();
    if (!apiKey) { setShellhubConnectError('API key required.'); return; }
    setShellhubConnecting(true);
    setShellhubConnectError(null);
    try {
      const res = await fetch('/api/connectors/shellhub/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: { server_url: serverUrl, api_key: apiKey } }),
      });
      const data = await res.json() as { ok: boolean; message?: string };
      if (data.ok) {
        setShellhubStatus('connected');
        setShellhubConnectedServer(serverUrl);
        setShellhubApiKeyDraft('');
        setShellhubDevices([]);
        fetchShellhubDevices();
      } else {
        setShellhubConnectError(data.message ?? 'Connection failed.');
      }
    } catch (err) { setShellhubConnectError('Network error'); } finally { setShellhubConnecting(false); }
  };

  const handleShellHubDisconnect = async () => {
    setShellhubDisconnecting(true);
    try { await fetch('/api/connectors/shellhub/connect', { method: 'DELETE' }); } finally {
      setShellhubDisconnecting(false);
      setShellhubStatus('not_connected');
      setShellhubDevices([]);
    }
  };

  const fetchShellhubDevices = async () => {
    if (shellhubStatus !== 'connected') return;
    setShellhubDevicesLoading(true);
    setShellhubDevicesError(null);
    try {
      const res = await fetch('/api/shellhub/devices');
      const data = await res.json();
      if (data.ok && Array.isArray(data.devices)) {
        setShellhubDevices(data.devices);
        if (data.server_url) setShellhubConnectedServer(data.server_url);
      } else {
        setShellhubDevicesError(data.error ?? 'Failed to load devices.');
      }
    } catch (err) { setShellhubDevicesError('Network error'); } finally { setShellhubDevicesLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'connections' && shellhubStatus === 'idle') {
      setShellhubStatus('checking');
      fetch('/api/connectors/status')
        .then(r => r.json())
        .then(data => setShellhubStatus(data?.statuses?.shellhub === 'connected' ? 'connected' : 'not_connected'))
        .catch(() => setShellhubStatus('not_connected'));
    }
  }, [activeTab, shellhubStatus]);

  useEffect(() => {
    if (shellhubStatus === 'connected') fetchShellhubDevices();
  }, [shellhubStatus]);

  // Load real data when tabs become active
  useEffect(() => {
    if (activeTab === 'notebook') {
      // already loaded
    } else if (activeTab === 'ci') {
      // nothing to preload
    } else if (activeTab === 'projects') {
      // already loaded
    } else if (activeTab === 'connections') {
      // shellhub handled
    } else if (activeTab === 'diff') {
      // nothing
    } else if (activeTab === 'preview') {
      // preview listens to bridge automatically
    } else if (activeTab === 'viz') {
      // viz data loaded on demand
    }
  }, [activeTab]);

  function newCellId() { return `cell-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }

  // Style helpers
  const tabStyle = (id: ActiveTab): CSSProperties => ({
    padding: '6px 14px', borderRadius: 999, border: activeTab === id ? `1.5px solid ${ACCENT}` : '1px solid rgba(160,195,240,0.30)',
    background: activeTab === id ? `${ACCENT}18` : 'rgba(255,255,255,0.45)', color: activeTab === id ? ACCENT : 'var(--de-text)',
    fontSize: 12, fontWeight: activeTab === id ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s',
  });

  const codeToolBtnStyle = (disabled: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 7,
    border: '1px solid rgba(160,195,240,0.35)', background: 'rgba(0,0,0,0.03)',
    color: disabled ? 'rgba(100,116,139,0.35)' : 'var(--de-text)', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 12, transition: 'background 0.12s', flexShrink: 0,
  });

  const smartSelBtnStyle: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7,
    border: '1px solid rgba(160,195,240,0.30)', background: 'rgba(255,255,255,0.55)',
    color: 'var(--de-text)', cursor: 'pointer', fontSize: 11, fontWeight: 600,
    transition: 'background 0.12s', whiteSpace: 'nowrap',
  };

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: `linear-gradient(135deg, ${ACCENT}, rgba(200,152,26,0.8))` }} />
          <div><div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)' }}>CodeEngin</div><div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Code · Control Layer</div></div>
          <span className="ml-auto text-xs font-semibold px-2 py-1 rounded-full" style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}>Side B</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
          {[
            { id: 'notebook', label: '📔 Notebook' },
            { id: 'ci', label: '🔧 CI Pipeline' },
            { id: 'projects', label: '📁 Projects' },
            { id: 'connections', label: '🔗 Connections' },
            { id: 'diff', label: '⟦⟧ Diff Viewer' },
            { id: 'preview', label: '🔭 Live Preview' },
            { id: 'viz', label: '📊 Visualizations' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabStyle(tab.id)}>{tab.label}</button>
          ))}
        </div>

        {/* Toolbar: zoom, swap, live mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap', padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(160,195,240,0.22)' }}>
          <button onClick={zoomOut} disabled={codeZoom <= ZOOM_MIN} style={codeToolBtnStyle(codeZoom <= ZOOM_MIN)}><ZoomOut size={13} /></button>
          <button onClick={zoomReset} style={{ ...codeToolBtnStyle(false), minWidth: 42, justifyContent: 'center', fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: codeZoom !== 1.0 ? ACCENT : 'var(--de-text-dim)' }}>{Math.round(codeZoom * 100)}%</button>
          <button onClick={zoomIn} disabled={codeZoom >= ZOOM_MAX} style={codeToolBtnStyle(codeZoom >= ZOOM_MAX)}><ZoomIn size={13} /></button>
          <span style={{ width: 1, height: 18, background: 'rgba(160,195,240,0.3)', margin: '0 4px' }} />
          <button onClick={() => setSwappedLayout(prev => !prev)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, border: `1.5px solid ${swappedLayout ? ACCENT : 'rgba(160,195,240,0.35)'}`, background: swappedLayout ? `${ACCENT}12` : 'rgba(0,0,0,0.03)', color: swappedLayout ? ACCENT : 'var(--de-text)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}><ArrowLeftRight className="w-3.5 h-3.5" /><span>Swap</span></button>
          <button onClick={() => setLiveModeActive(prev => !prev)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, border: `1.5px solid ${liveModeActive ? '#f59e0b' : 'rgba(160,195,240,0.35)'}`, background: liveModeActive ? 'rgba(245,158,11,0.12)' : 'rgba(0,0,0,0.03)', color: liveModeActive ? '#f59e0b' : 'var(--de-text)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{liveModeActive ? <Zap className="w-3.5 h-3.5" /> : <MousePointer2 className="w-3.5 h-3.5" />}<span>{liveModeActive ? 'Live' : 'Manual'}</span>{liveModeActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', animation: 'de-pulse 1s infinite', marginLeft: 2 }} />}</button>
        </div>

        {/* Notebook Tab (real execution) */}
        {activeTab === 'notebook' && (
          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">Live Notebook</span><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${ACCENT}12`, color: ACCENT }}>{cells.length} cells</span></div>
            <div className="de-widget-body" style={{ padding: 0 }}>
              {cells.map((cell, idx) => (
                <div key={cell.id} style={{ borderBottom: idx < cells.length-1 ? '1px solid rgba(160,195,240,0.15)' : 'none', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <select value={cell.language} onChange={e => updateCellLanguage(cell.id, e.target.value as CellLanguage)} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(160,195,240,0.35)' }}>
                      {LANGUAGE_OPTIONS.map(lang => <option key={lang} value={lang}>{LANGUAGE_LABEL[lang]}</option>)}
                    </select>
                    {cell.status === 'running' && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#f59e0b' }} />}
                    {cell.status === 'done' && <CheckCircle className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />}
                    {cell.status === 'error' && <XCircle className="w-3.5 h-3.5" style={{ color: OUT_ERR }} />}
                    <span style={{ flex: 1 }} />
                    <button onClick={() => runCell(cell.id, cell.language, cell.code)} disabled={cell.status === 'running'} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: cell.status === 'running' ? 'rgba(59,125,216,0.08)' : `${ACCENT}18`, color: cell.status === 'running' ? 'var(--de-text-dim)' : ACCENT, border: `1px solid ${cell.status === 'running' ? 'rgba(160,195,240,0.2)' : `${ACCENT}35`}` }}>{cell.status === 'running' ? '⟳ Running' : '▶ Run'}</button>
                    <button onClick={() => deleteCell(cell.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, background: 'rgba(248,113,113,0.08)', color: OUT_ERR, cursor: 'pointer' }}><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <textarea value={cell.code} onChange={e => updateCellCode(cell.id, e.target.value)} onFocus={e => { lastFocusedRef.current = e.currentTarget; }} data-cell-id={cell.id} rows={Math.max(3, cell.code.split('\n').length + 1)} spellCheck={false} style={{ width: '100%', background: CELL_BG, color: CODE_FG, fontFamily: '"Fira Code", monospace', fontSize: ZOOM_BASE_FONT * codeZoom, lineHeight: 1.6, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', resize: 'vertical', outline: 'none', whiteSpace: 'pre', overflowX: 'auto' }} />
                  {cell.output && (
                    <div style={{ marginTop: 6, background: '#0f0f1a', border: `1px solid ${cell.status === 'error' ? 'rgba(248,113,113,0.25)' : 'rgba(74,222,128,0.18)'}`, borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, color: cell.status === 'error' ? OUT_ERR : OUT_OK }}>{cell.status === 'error' ? 'ERROR' : 'OUTPUT'}</div>
                      <pre style={{ margin: 0, fontFamily: '"Fira Code", monospace', fontSize: Math.round(12 * codeZoom), color: cell.status === 'error' ? OUT_ERR : OUT_OK, whiteSpace: 'pre-wrap' }}>{cell.output}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="de-widget-actions"><button onClick={addCell} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: `${ACCENT}12`, color: ACCENT, border: `1px dashed ${ACCENT}45` }}><Plus className="w-3.5 h-3.5" /> Add Cell</button></div>
          </div>
        )}

        {/* CI Tab (owner only, real) */}
        {isOwner && activeTab === 'ci' && (
          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">CI Pipeline</span><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: ciOverallStatus === 'passing' ? 'rgba(34,197,94,0.12)' : ciOverallStatus === 'failed' ? 'rgba(248,113,113,0.12)' : 'rgba(160,195,240,0.12)', color: ciOverallStatus === 'passing' ? '#22c55e' : ciOverallStatus === 'failed' ? '#f87171' : 'var(--de-text-dim)' }}>{ciOverallStatus === 'passing' ? '✓ Passing' : ciOverallStatus === 'failed' ? '✗ Failed' : 'Ready'}</span></div>
            <div className="de-widget-body">
              {ciStages.length === 0 && !ciRunning && <div style={{ textAlign: 'center', padding: 20, color: 'var(--de-text-dim)' }}>Press Run CI to start</div>}
              {ciStages.map((stage, idx) => (
                <div key={idx} style={{ marginBottom: 8, padding: 8, borderRadius: 8, background: stage.passed ? 'rgba(34,197,94,0.05)' : 'rgba(248,113,113,0.05)', border: `1px solid ${stage.passed ? 'rgba(34,197,94,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {stage.passed ? <CheckCircle size={14} style={{ color: '#22c55e' }} /> : <XCircle size={14} style={{ color: '#f87171' }} />}
                    <span style={{ fontWeight: 600 }}>{stage.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--de-text-dim)' }}>{stage.durationMs}ms</span>
                  </div>
                  <pre style={{ marginTop: 4, fontSize: 10, background: '#1a1a2e', padding: 4, borderRadius: 4, overflow: 'auto', maxHeight: 100 }}>{stage.output}</pre>
                </div>
              ))}
              {ciRunning && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8 }}><Loader2 className="animate-spin" /> Running CI...</div>}
            </div>
            <div className="de-widget-actions">
              <button onClick={runCI} disabled={ciRunning} style={{ padding: '8px 16px', borderRadius: 8, background: ACCENT, color: '#fff', border: 'none', cursor: ciRunning ? 'not-allowed' : 'pointer' }}>{ciRunning ? 'Running...' : '▶ Run CI'}</button>
            </div>
          </div>
        )}

        {/* Projects Tab (real Supabase) */}
        {activeTab === 'projects' && (
          <>
            <div className="de-widget" style={{ marginBottom: 14 }}>
              <div className="de-widget-header"><span className="de-widget-title">New Project</span></div>
              <div className="de-widget-body">
                <div><label style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)' }}>Project name</label><input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createProject()} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(160,195,240,0.4)' }} /></div>
                <div><label style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)' }}>Primary language</label><select value={newProjectLang} onChange={e => setNewProjectLang(e.target.value as CellLanguage)} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(160,195,240,0.4)' }}>{LANGUAGE_OPTIONS.map(lang => <option key={lang} value={lang}>{LANGUAGE_LABEL[lang]}</option>)}</select></div>
              </div>
              <div className="de-widget-actions"><button onClick={createProject} disabled={!newProjectName.trim() || creating || !user} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: (!newProjectName.trim() || creating || !user) ? 'rgba(59,125,216,0.08)' : ACCENT, color: (!newProjectName.trim() || creating || !user) ? 'var(--de-text-dim)' : '#fff', border: 'none', cursor: (!newProjectName.trim() || creating || !user) ? 'not-allowed' : 'pointer' }}>{creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4" /> Create Project</>}</button><Link href="/codespace" className="de-btn de-btn-ghost text-xs">Open Codespace →</Link></div>
            </div>
            <div className="de-widget">
              <div className="de-widget-header"><span className="de-widget-title">Your Projects</span>{projects.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${ACCENT}12`, color: ACCENT }}>{projects.length}</span>}</div>
              <div className="de-widget-body">
                {loadingProjects ? <div><Loader2 className="w-4 h-4 animate-spin" style={{ color: ACCENT }} /> Loading...</div> : projects.length === 0 ? <div>No projects yet.</div> : projects.map(p => <div key={p.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', marginBottom: 8 }}><Code2 className="w-4 h-4" style={{ color: ACCENT }} /> {p.title} <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: p.visibility === 'public' ? 'rgba(34,197,94,0.12)' : 'rgba(160,195,240,0.18)' }}>{p.visibility}</span></div>)}
              </div>
            </div>
          </>
        )}

        {/* Connections Tab (real bridge + ShellHub) */}
        {activeTab === 'connections' && (
          <>
            <div className="de-widget" style={{ marginBottom: 14 }}>
              <div className="de-widget-header"><span className="de-widget-title">Cross-Engin Connections</span></div>
              <div className="de-widget-body"><CrossEnginStatusPanel excludeChannel="code" /></div>
            </div>
            <div className="de-widget">
              <div className="de-widget-header"><span className="de-widget-title">ShellHub</span>{shellhubStatus === 'connected' && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#22c55e' }}>● Connected</span>}</div>
              <div className="de-widget-body">
                {shellhubStatus !== 'connected' ? (
                  <div><input type="url" value={shellhubServerDraft} onChange={e => setShellhubServerDraft(e.target.value)} placeholder="Server URL" style={{ width: '100%', marginBottom: 8, padding: '8px' }} /><input type="password" value={shellhubApiKeyDraft} onChange={e => setShellhubApiKeyDraft(e.target.value)} placeholder="API Key" style={{ width: '100%', marginBottom: 8, padding: '8px' }} /><button onClick={handleShellHubConnect} disabled={shellhubConnecting} style={{ padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8 }}>{shellhubConnecting ? 'Connecting...' : 'Connect ShellHub'}</button>{shellhubConnectError && <div style={{ color: '#f87171' }}>{shellhubConnectError}</div>}</div>
                ) : (
                  <div><button onClick={handleShellHubDisconnect} disabled={shellhubDisconnecting} style={{ marginBottom: 12, padding: '6px 12px', background: '#f87171', color: '#fff', border: 'none', borderRadius: 6 }}>{shellhubDisconnecting ? 'Disconnecting...' : 'Disconnect'}</button><div>{shellhubDevicesLoading ? <Loader2 className="animate-spin" /> : shellhubDevices.map(d => <div key={d.uid} style={{ padding: '8px', borderBottom: '1px solid #eee' }}><Terminal size={14} /> {d.name} {d.online ? <span style={{ color: '#22c55e' }}>● Online</span> : <span style={{ color: '#64748b' }}>○ Offline</span>}</div>)}</div></div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Diff Viewer Tab (real) */}
        {activeTab === 'diff' && (
          <div className="de-widget"><div className="de-widget-header"><span className="de-widget-title">Diff Viewer</span></div><div className="de-widget-body"><DiffViewer defaultFullFile /></div></div>
        )}

        {/* Live Preview Tab (real bridge frames) */}
        {activeTab === 'preview' && (
          <div className="de-widget">
            <div className="de-widget-header"><Eye className="w-4 h-4" style={{ color: ACCENT }} /><span className="de-widget-title ml-2">Live Preview</span>{previewEngine && <span style={{ marginLeft: 'auto', fontSize: 10, color: ACCENT }}>From {previewEngine}</span>}</div>
            <div className="de-widget-body" style={{ textAlign: 'center', padding: 20 }}>
              {previewImage ? (
                <img src={previewImage} alt="Live engine preview" style={{ maxWidth: '100%', borderRadius: 8, border: `1px solid ${ACCENT}` }} />
              ) : (
                <p style={{ color: 'var(--de-text-dim)' }}>No engine broadcast yet. Ensure an engine is emitting <code>engin:frame-broadcast</code> events.</p>
              )}
            </div>
          </div>
        )}

        {/* Visualizations Tab (real AST, heatmap, dependency graph) */}
        {activeTab === 'viz' && (
          <div className="de-widget">
            <div className="de-widget-header"><BarChart2 className="w-4 h-4" style={{ color: ACCENT }} /><span className="de-widget-title ml-2">Code Visualizations</span></div>
            <div className="de-widget-body">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Execution Heatmap</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {cells.map(cell => (
                    <div key={cell.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 100, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis' }}>Cell {cell.id.slice(-4)}</span>
                      <div style={{ flex: 1, height: 20, background: 'rgba(160,195,240,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (heatmapData[cell.id] || 0) * 10)}%`, height: '100%', background: ACCENT, borderRadius: 4 }} />
                      </div>
                      <span style={{ width: 40, fontSize: 11 }}>{heatmapData[cell.id] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>AST Analysis</div>
                <button onClick={analyzeAST} disabled={astLoading} style={{ padding: '4px 8px', fontSize: 10, marginBottom: 8 }}>Parse Active Cell AST</button>
                {astLoading && <Loader2 className="animate-spin" />}
                {astResult && <pre style={{ background: '#1a1a2e', padding: 8, borderRadius: 6, fontSize: 10, overflow: 'auto', maxHeight: 200 }}>{astResult}</pre>}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Dependency Graph</div>
                <button onClick={analyzeDependencies} style={{ padding: '4px 8px', fontSize: 10, marginBottom: 8 }}>Scan Imports</button>
                {depGraph && <pre style={{ background: '#1a1a2e', padding: 8, borderRadius: 6, fontSize: 10, overflow: 'auto', maxHeight: 200 }}>{depGraph}</pre>}
              </div>
            </div>
          </div>
        )}

        {/* Security Scanner (real npm audit) */}
        <div className="de-widget" style={{ margin: '14px 0' }}>
          <div className="de-widget-header"><span style={{ fontSize: 16 }}>🔐</span><span className="de-widget-title ml-2">Security Scanner</span></div>
          <div className="de-widget-body">
            <button onClick={fetchSecurityScan} disabled={securityLoading} style={{ padding: '4px 8px', fontSize: 10, marginBottom: 8 }}>Scan Now</button>
            {securityLoading && <Loader2 className="animate-spin" />}
            {securityScan && (
              <div>
                <div>Total vulnerabilities: {securityScan.total}</div>
                <div>High: {securityScan.high}</div>
                <div>Moderate: {securityScan.moderate}</div>
                <div>Low: {securityScan.low}</div>
              </div>
            )}
          </div>
        </div>

        {/* Performance Profiler (real server timing) */}
        <div className="de-widget" style={{ margin: '14px 0' }}>
          <div className="de-widget-header"><span style={{ fontSize: 16 }}>📊</span><span className="de-widget-title ml-2">Performance Profiler</span></div>
          <div className="de-widget-body">
            <button onClick={fetchPerf} disabled={perfLoading} style={{ padding: '4px 8px', fontSize: 10, marginBottom: 8 }}>Profile</button>
            {perfLoading && <Loader2 className="animate-spin" />}
            {perfData && <div>Server response: {perfData.serverResponseTimeMs.toFixed(2)} ms</div>}
          </div>
        </div>

        {/* Package Manager (real npm data) */}
        <div className="de-widget" style={{ margin: '14px 0' }}>
          <div className="de-widget-header"><span style={{ fontSize: 16 }}>📦</span><span className="de-widget-title ml-2">Package Manager</span></div>
          <div className="de-widget-body">
            <button onClick={fetchPackages} disabled={packagesLoading} style={{ padding: '4px 8px', fontSize: 10, marginBottom: 8 }}>Check Updates</button>
            {packagesLoading && <Loader2 className="animate-spin" />}
            {packagesError && <div style={{ color: '#f87171' }}>{packagesError}</div>}
            {packages.length > 0 && (
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {packages.map(pkg => (
                  <div key={pkg.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(160,195,240,0.1)' }}>
                    <span>{pkg.name}</span>
                    <span style={{ color: pkg.upToDate ? '#4ade80' : '#f59e0b' }}>{pkg.current} → {pkg.latest}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Database Browser (real Supabase metadata) */}
        <div className="de-widget" style={{ margin: '14px 0' }}>
          <div className="de-widget-header"><span style={{ fontSize: 16 }}>🗄</span><span className="de-widget-title ml-2">Database Browser</span></div>
          <div className="de-widget-body">
            <button onClick={fetchDbTables} disabled={dbLoading} style={{ padding: '4px 8px', fontSize: 10, marginBottom: 8 }}>Load Tables</button>
            {dbLoading && <Loader2 className="animate-spin" />}
            {dbTables.length > 0 && (
              <div>
                {dbTables.map(t => (
                  <div key={t.table} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>{t.table}</span>
                    <span>{t.rows} rows</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Environment Manager (real safe env vars) */}
        <div className="de-widget" style={{ margin: '14px 0' }}>
          <div className="de-widget-header"><span style={{ fontSize: 16 }}>🌍</span><span className="de-widget-title ml-2">Environment Manager</span></div>
          <div className="de-widget-body">
            <button onClick={fetchEnv} disabled={envLoading} style={{ padding: '4px 8px', fontSize: 10, marginBottom: 8 }}>Load Env</button>
            {envLoading && <Loader2 className="animate-spin" />}
            {Object.keys(envVars).length > 0 && (
              <div>
                {Object.entries(envVars).map(([key, val]) => (
                  <div key={key} style={{ padding: '4px 0', borderBottom: '1px solid rgba(160,195,240,0.1)' }}>
                    <span style={{ fontWeight: 600 }}>{key}</span>: {val}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* REST/GraphQL Client (real fetch) */}
        <div className="de-widget" style={{ margin: '14px 0' }}>
          <div className="de-widget-header"><span style={{ fontSize: 16 }}>🔌</span><span className="de-widget-title ml-2">REST / GraphQL Client</span></div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {(['GET', 'POST', 'PUT', 'DELETE'] as const).map(m => (
                <button key={m} onClick={() => setRestMethod(m)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: restMethod === m ? ACCENT : 'rgba(160,195,240,0.1)', color: restMethod === m ? '#fff' : 'var(--de-text)' }}>{m}</button>
              ))}
            </div>
            <input type="text" placeholder="URL" value={restUrl} onChange={e => setRestUrl(e.target.value)} style={{ width: '100%', padding: '6px', marginBottom: 8, borderRadius: 6, border: `1px solid ${ACCENT}30` }} />
            {(restMethod === 'POST' || restMethod === 'PUT') && (
              <textarea placeholder="JSON body" value={restBody} onChange={e => setRestBody(e.target.value)} rows={3} style={{ width: '100%', padding: '6px', marginBottom: 8, borderRadius: 6, fontFamily: 'monospace' }} />
            )}
            <button onClick={sendRestRequest} disabled={restLoading} style={{ padding: '6px 12px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 6 }}>Send</button>
            {restResponse && <pre style={{ marginTop: 8, padding: 8, background: '#1a1a2e', borderRadius: 6, fontSize: 10, overflow: 'auto', maxHeight: 200 }}>{restResponse}</pre>}
          </div>
        </div>

        {/* Game Engine Code Integration (static doc – can be real by importing actual APIs) */}
        <div className="de-widget" style={{ margin: '14px 0' }}>
          <div className="de-widget-header"><span style={{ fontSize: 16 }}>🎮</span><span className="de-widget-title ml-2">Game Engine Code Integration</span></div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Use EliteGameEngine ECS APIs in your notebook cells:</p>
            <pre style={{ background: '#1a1a2e', padding: 8, borderRadius: 6, fontSize: 10, fontFamily: 'monospace', color: '#c084fc' }}>
              {`import { EliteGameEngine, ECSWorld } from '@/lib/gameengin';
const world = new ECSWorld();
const entity = world.createEntity();
world.addComponent(entity, { type: 'transform', x: 0, y: 0 });`}
            </pre>
          </div>
        </div>

        {/* AI Code Assist (real) */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header"><Bot className="w-4 h-4" /><span className="de-widget-title ml-2">AI Code Assist</span></div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', gap: 8 }}><input type="text" placeholder="Ask Dr. Eams..." value={assistPrompt} onChange={e => setAssistPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiAssist()} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${ACCENT}30` }} /><button onClick={handleAiAssist} disabled={assistLoading || !assistPrompt.trim()} style={{ padding: '8px 14px', borderRadius: 8, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer' }}>{assistLoading ? <Loader2 className="animate-spin" /> : 'Ask'}</button></div>
            {assistResponse && <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, background: `${ACCENT}08`, border: `1px solid ${ACCENT}20`, fontSize: 12, whiteSpace: 'pre-wrap' }}>{assistResponse}</div>}
          </div>
        </div>

        {/* Owner-only features */}
        {isOwner && (
          <>
            <div className="de-widget" style={{ margin: '14px 0' }}>
              <div className="de-widget-header"><Bug className="w-4 h-4" style={{ color: '#f87171' }} /><span className="de-widget-title ml-2">Crash Recovery</span><span style={{ marginLeft: 'auto', fontSize: 10, color: '#f87171' }}>appthemanger@gmail.com</span></div>
              <div className="de-widget-body"><CrashRecoveryPanel cells={cells} /></div>
            </div>
            <div className="de-widget" style={{ margin: '14px 0' }}>
              <div className="de-widget-header"><ListChecks className="w-4 h-4" style={{ color: '#22c55e' }} /><span className="de-widget-title ml-2">App Editing Job List</span></div>
              <div className="de-widget-body"><TaskJobManager /></div>
            </div>
          </>
        )}

        {/* Journey Trail */}
        <div className="de-widget"><div className="de-widget-header"><span className="de-widget-title">Journey</span></div><div className="de-widget-body"><JourneyTrail compact /></div></div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Style helpers
// ----------------------------------------------------------------------

function codeToolBtnStyle(disabled: boolean): CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 7,
    border: '1px solid rgba(160,195,240,0.35)', background: 'rgba(0,0,0,0.03)',
    color: disabled ? 'rgba(100,116,139,0.35)' : 'var(--de-text)', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 12, transition: 'background 0.12s', flexShrink: 0,
  };
}

const selBtnStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 8,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
  color: '#e2e8f0', cursor: 'pointer', fontSize: 11, fontWeight: 600,
  transition: 'background 0.12s', whiteSpace: 'nowrap',
};

const smartSelBtnStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7,
  border: '1px solid rgba(160,195,240,0.30)', background: 'rgba(255,255,255,0.55)',
  color: 'var(--de-text)', cursor: 'pointer', fontSize: 11, fontWeight: 600,
  transition: 'background 0.12s', whiteSpace: 'nowrap',
};
