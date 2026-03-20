'use client';

/**
 * IDariPanel — admin control panel for the IDARi AI system.
 *
 * Tabs:
 *   1. Control — existing auto-update / bug-check loop.
 *   2. Observability — AI-assisted observability and remediation loop
 *      (collect → correlate → diagnose → patch plan).
 *
 * All API calls go to the real /api/ai/idari endpoint (Groq-backed, admin-only).
 * Observability data is fetched from /api/admin/observability (admin-only).
 *
 * ARCHITECTURE.md §3 — Component layer.
 * IDARI_CONTRACT.md — admin-only; never surfaced to regular users.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Play, Pause, RefreshCw, Shield, AlertCircle,
  CheckCircle, Zap, Activity, TrendingUp, Eye, Radio,
} from 'lucide-react';
import { emitIdariEvent } from '@/lib/agents/agentBus';
import { runRemediationLoop, type LoopIteration } from '@/lib/agents/idariLoop';
import { collectLog, collectMetric, collectTrace } from '@/lib/observability/collector';
import type { CorrelationResult } from '@/lib/observability/correlator';
import type { RootCauseAnalysis } from '@/lib/observability/rootCauseAnalyzer';

interface IdariLog {
  timestamp: Date;
  action: string;
  status: 'success' | 'error' | 'pending';
  details?: string;
}

interface IDariPanelProps {
  userId: string;
  isAdmin: boolean;
}

/** Minimal valid UIContext for admin panel calls */
const ADMIN_UI = { route: '/admin' };

/**
 * Call the real IDARi endpoint and return the AI response text.
 * Throws on network/auth error so callers can log the failure.
 */
async function callIdari(message: string): Promise<string> {
  const res = await fetch('/api/ai/idari', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, ui: ADMIN_UI }),
  });
  const data = await res.json() as { response_text?: string; message?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? `HTTP ${res.status}`);
  }
  return data.response_text ?? 'IDARi processed the request.';
}

export default function IDariPanel({ userId: _userId, isAdmin }: IDariPanelProps) {
  // ── Tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'control' | 'observability'>('control');

  // ── Control tab state ────────────────────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(true);
  const [logs, setLogs] = useState<IdariLog[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  // autoRefresh defaults to false — only fires when the tab is visible (ARCH §10)
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [bugCheckEnabled, setBugCheckEnabled] = useState(true);

  // ── Observability loop state ─────────────────────────────────────────────────
  const [loopRunning, setLoopRunning] = useState(false);
  const [loopIterations, setLoopIterations] = useState<LoopIteration[]>([]);
  const [latestCorrelation, setLatestCorrelation] = useState<CorrelationResult | null>(null);
  const [latestRootCause, setLatestRootCause] = useState<RootCauseAnalysis | null>(null);
  const [obsAutoRun, setObsAutoRun] = useState(false);

  /** Inject a synthetic telemetry event for demo/testing purposes */
  const injectSyntheticTelemetry = useCallback(() => {
    collectLog('info', 'IDariPanel: observability loop activated', { source: 'IDariPanel' });
    collectMetric('admin_panel_opens', 1, { panel: 'idari' });
    collectTrace('GET /api/admin/observability', Math.floor(Math.random() * 300 + 50), 'ok');
  }, []);

  const runObservabilityLoop = useCallback(async () => {
    if (loopRunning) return;
    setLoopRunning(true);
    injectSyntheticTelemetry();

    try {
      const iterations = await runRemediationLoop({
        windowMs: 10 * 60 * 1000, // last 10 minutes
        maxIterations: 1,
        stopOnHealthy: true,
        callAi: async (message: string) => {
          try {
            return await callIdari(message);
          } catch {
            return '';
          }
        },
        onIteration: (iter) => {
          setLoopIterations((prev) => [iter, ...prev.slice(0, 9)]);
          setLatestCorrelation(iter.correlation);
          setLatestRootCause(iter.root_cause);
          emitIdariEvent({
            type: 'idari:result',
            timestamp: iter.started_at,
            status: iter.status === 'resolved' ? 'success' : iter.status === 'failed' ? 'error' : 'pending',
            message: `Observability loop iteration ${iter.iteration_number}: ${iter.correlation.health}`,
            details: iter.correlation.summary.slice(0, 200),
          });
        },
      });
      // Collect a metric for loop execution time
      const lastIter = iterations[iterations.length - 1];
      if (lastIter?.finished_at && lastIter.started_at) {
        const durationMs = new Date(lastIter.finished_at).getTime() - new Date(lastIter.started_at).getTime();
        collectMetric('observability_loop_duration_ms', durationMs, { status: lastIter.status });
      }
    } finally {
      setLoopRunning(false);
    }
  }, [loopRunning, injectSyntheticTelemetry]);

  // Auto-run observability loop every 30 s when enabled
  useEffect(() => {
    if (!obsAutoRun) return;
    const timer = setInterval(() => { void runObservabilityLoop(); }, 30_000);
    return () => clearInterval(timer);
  }, [obsAutoRun, runObservabilityLoop]);

  useEffect(() => {
    const savedState = localStorage.getItem('idari_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState) as {
          isRunning?: boolean;
          autoRefresh?: boolean;
          refreshInterval?: number;
          bugCheckEnabled?: boolean;
        };
        setIsRunning(state.isRunning !== false);
        setAutoRefresh(state.autoRefresh === true); // default off
        setRefreshInterval(typeof state.refreshInterval === 'number' ? Math.max(state.refreshInterval, 30000) : 30000);
        setBugCheckEnabled(state.bugCheckEnabled !== false);
      } catch (e) {
        console.error('Failed to load IDARi state:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('idari_state', JSON.stringify({
      isRunning,
      autoRefresh,
      refreshInterval,
      bugCheckEnabled,
    }));
  }, [isRunning, autoRefresh, refreshInterval, bugCheckEnabled]);

  // Visibility-gated polling — only runs when the page is in the foreground
  // and autoRefresh is on. Never fires in background tabs (ARCH §10).
  useEffect(() => {
    if (!autoRefresh || !isRunning) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') void performAutoUpdate();
      }, refreshInterval);
    };

    const stopPolling = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') startPolling();
      else stopPolling();
    };

    if (document.visibilityState === 'visible') startPolling();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, isRunning, refreshInterval]);

  const addLog = (action: string, status: IdariLog['status'], details?: string) => {
    const timestamp = new Date();
    setLogs(prev => [{ timestamp, action, status, details }, ...prev.slice(0, 49)]);
    emitIdariEvent({
      type: 'idari:log',
      timestamp: timestamp.toISOString(),
      status,
      message: action,
      details,
    });
  };

  const performAutoUpdate = async () => {
    if (!isRunning) return;
    addLog('Auto-update cycle started', 'pending');
    try {
      if (bugCheckEnabled) await checkForBugs();
      await runUpdate();
      addLog('Auto-update cycle completed', 'success');
    } catch (error) {
      addLog('Auto-update failed', 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const checkForBugs = async () => {
    addLog('Diagnostic check initiated', 'pending');
    try {
      const responseText = await callIdari(
        'Run a diagnostic check on the DREAMengin platform. Identify any bugs, errors, broken flows, or system health issues. Report your findings clearly.',
      );
      // Heuristic: if the response mentions errors/bugs/issues, flag as error; otherwise success
      const looksLikeIssues = /error|bug|issue|broken|fail|problem/i.test(responseText);
      addLog(
        looksLikeIssues ? 'IDARi found potential issues' : 'Diagnostic complete — no issues found',
        looksLikeIssues ? 'error' : 'success',
        responseText.slice(0, 300),
      );
    } catch (error) {
      addLog('Diagnostic check failed', 'error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };

  const runUpdate = async () => {
    if (!prompt.trim()) {
      addLog('Update skipped', 'error', 'No prompt provided');
      return;
    }
    setIsProcessing(true);
    addLog('Processing update request', 'pending', prompt);
    try {
      const responseText = await callIdari(prompt);
      addLog('IDARi responded', 'success', responseText.slice(0, 300));
      setPrompt('');
    } catch (error) {
      addLog('Update failed', 'error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualRun = async () => {
    if (!prompt.trim()) {
      addLog('Manual run skipped', 'error', 'No prompt provided');
      return;
    }
    await runUpdate();
  };

  const toggleSystem = () => {
    if (isRunning) {
      setIsRunning(false);
      setAutoRefresh(false);
      addLog('IDARi system paused', 'success');
    } else {
      setIsRunning(true);
      addLog('IDARi system activated', 'success');
    }
  };

  if (!isAdmin) return null;

  // ── Health badge helper ───────────────────────────────────────────────────
  const healthBadge = (health: string) => {
    const map: Record<string, string> = {
      healthy: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      degraded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${map[health] ?? map.healthy}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${health === 'healthy' ? 'bg-green-500' : health === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
        {health.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">IDARi</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">AI Auto-Updater &amp; Observability Loop</p>
          </div>
        </div>
        {activeTab === 'control' && (
          <button
            onClick={toggleSystem}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isRunning
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Pause' : 'Activate IDARi'}
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 bg-white/60 dark:bg-slate-800/60 rounded-lg p-1">
        {([
          { id: 'control', label: 'Control', icon: Zap },
          { id: 'observability', label: 'Observability Loop', icon: Activity },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Control ─────────────────────────────────────────────────────── */}
      {activeTab === 'control' && (
        <>
          {/* Status Indicators */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className={`p-3 rounded-lg border-2 ${
              isRunning
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">System</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {isRunning ? 'Active' : 'Paused'}
              </p>
            </div>

            <div className={`p-3 rounded-lg border-2 ${
              autoRefresh
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className={`w-3 h-3 text-slate-700 dark:text-slate-300 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Auto-Refresh</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {autoRefresh ? `${refreshInterval / 1000}s` : 'Off'}
              </p>
            </div>

            <div className={`p-3 rounded-lg border-2 ${
              bugCheckEnabled
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3 h-3 text-slate-700 dark:text-slate-300" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Diagnostics</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {bugCheckEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Prompt IDARi
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Tell IDARi what to do (e.g., 'Fix the navigation alignment issue' or 'Add error handling to the form submission')"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white resize-none"
                disabled={isProcessing}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => void handleManualRun()}
                disabled={isProcessing || !prompt.trim()}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                <Zap className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Run IDARi'}
              </button>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Auto-refresh</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bugCheckEnabled}
                  onChange={(e) => setBugCheckEnabled(e.target.checked)}
                  className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Auto-diagnose</span>
              </label>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">IDARi Activity Log</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No activity yet. Activate IDARi to start monitoring.
                </p>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {log.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
                    {log.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                    {log.status === 'pending' && <RefreshCw className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 dark:text-white font-medium">{log.action}</p>
                      {log.details && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{log.details}</p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {log.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Observability Loop ───────────────────────────────────────────── */}
      {activeTab === 'observability' && (
        <div className="space-y-4">
          {/* Loop status bar */}
          <div className="flex items-center justify-between gap-3 p-3 bg-white/70 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Radio className={`w-4 h-4 ${loopRunning ? 'text-purple-500 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {loopRunning ? 'Loop running…' : loopIterations.length === 0 ? 'Loop idle' : `${loopIterations.length} iteration(s) completed`}
              </span>
              {latestCorrelation && healthBadge(latestCorrelation.health)}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={obsAutoRun}
                  onChange={(e) => setObsAutoRun(e.target.checked)}
                  className="w-3.5 h-3.5 text-purple-500 rounded"
                />
                Auto (30 s)
              </label>
              <button
                type="button"
                onClick={() => void runObservabilityLoop()}
                disabled={loopRunning}
                className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                {loopRunning ? 'Running…' : 'Run Loop'}
              </button>
            </div>
          </div>

          {/* How it works */}
          {loopIterations.length === 0 && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700 text-sm text-indigo-800 dark:text-indigo-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> AI-assisted observability &amp; remediation loop</p>
              <p>1. <strong>Collect</strong> — captures logs, metrics, and traces from the running app.</p>
              <p>2. <strong>Correlate</strong> — detects anomaly clusters (error spikes, latency regressions, metric outliers).</p>
              <p>3. <strong>Root cause</strong> — pattern-matches evidence to likely cause &amp; risk level.</p>
              <p>4. <strong>Patch plan</strong> — IDARi generates a minimal safe fix with verification steps.</p>
              <p>5. <strong>Iterate</strong> — loop repeats until the system is healthy.</p>
            </div>
          )}

          {/* Latest correlation result */}
          {latestCorrelation && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Latest Correlation</h4>
                {healthBadge(latestCorrelation.health)}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{latestCorrelation.summary}</p>
              {latestCorrelation.anomalies.length > 0 && (
                <div className="space-y-1">
                  {latestCorrelation.anomalies.slice(0, 3).map((a, i) => (
                    <div key={i} className={`flex items-start gap-2 p-2 rounded text-xs ${
                      a.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                      a.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                      'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span><strong>[{a.severity.toUpperCase()}]</strong> {a.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Latest root cause */}
          {latestRootCause && latestRootCause.affected_area !== 'none' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Root Cause Analysis</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-500 dark:text-slate-400">Cause:</span> <span className="text-slate-800 dark:text-slate-200 font-medium">{latestRootCause.likely_cause}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Area:</span> <span className="text-slate-800 dark:text-slate-200">{latestRootCause.affected_area}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Risk:</span> <span className={`font-semibold ${latestRootCause.risk === 'high' || latestRootCause.risk === 'critical' ? 'text-red-600 dark:text-red-400' : latestRootCause.risk === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>{latestRootCause.risk.toUpperCase()}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Confidence:</span> <span className="text-slate-800 dark:text-slate-200">{latestRootCause.confidence}</span></div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-medium">Fix:</span> {latestRootCause.recommended_action}</p>
            </div>
          )}

          {/* Patch plans from recent iterations */}
          {loopIterations.some((iter) => iter.patch_plan) && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Generated Patch Plans</h4>
              <div className="space-y-3">
                {loopIterations
                  .filter((iter) => iter.patch_plan)
                  .slice(0, 3)
                  .map((iter) => {
                    const plan = iter.patch_plan!;
                    return (
                      <div key={plan.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 dark:text-white">{plan.title}</span>
                          <span className={`px-1.5 py-0.5 rounded font-medium ${plan.risk === 'high' || plan.risk === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : plan.risk === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                            {plan.risk}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400"><span className="font-medium text-slate-700 dark:text-slate-300">Cause:</span> {plan.cause}</p>
                        <p className="text-slate-600 dark:text-slate-400"><span className="font-medium text-slate-700 dark:text-slate-300">Fix:</span> {plan.fix}</p>
                        <p className="text-slate-500 dark:text-slate-500"><span className="font-medium">Verify:</span> {plan.verification}</p>
                        {plan.rollback && <p className="text-slate-500 dark:text-slate-500"><span className="font-medium">Rollback:</span> {plan.rollback}</p>}
                        {iter.ai_response && (
                          <p className="mt-1 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-indigo-700 dark:text-indigo-300 italic">IDARi: {iter.ai_response.slice(0, 200)}{iter.ai_response.length > 200 ? '…' : ''}</p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Iteration history */}
          {loopIterations.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Loop History</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {loopIterations.map((iter) => (
                  <div key={iter.id} className="flex items-center gap-2 text-xs p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                    {iter.status === 'resolved' ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : iter.status === 'failed' ? <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /> : <RefreshCw className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 animate-spin" />}
                    <span className="text-slate-600 dark:text-slate-400">#{iter.iteration_number}</span>
                    {healthBadge(iter.correlation.health)}
                    <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">{iter.correlation.summary.slice(0, 80)}</span>
                    <span className="text-slate-400 dark:text-slate-500 shrink-0">{new Date(iter.started_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
