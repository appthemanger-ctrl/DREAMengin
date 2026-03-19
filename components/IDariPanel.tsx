'use client';

/**
 * IDariPanel — admin control panel for the IDARi AI system.
 *
 * All API calls go to the real /api/ai/idari endpoint (Groq-backed, admin-only).
 * The old /api/innerdreams/* routes no longer exist — they were dead stubs.
 *
 * ARCHITECTURE.md §3 — Component layer.
 * IDARI_CONTRACT.md — admin-only; never surfaced to regular users.
 */

import { useState, useEffect } from 'react';
import { Sparkles, Play, Pause, RefreshCw, Shield, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { emitIdariEvent } from '@/lib/agents/agentBus';

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
  const [isRunning, setIsRunning] = useState(true);
  const [logs, setLogs] = useState<IdariLog[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(7000);
  const [bugCheckEnabled, setBugCheckEnabled] = useState(true);

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
        setAutoRefresh(state.autoRefresh !== false);
        setRefreshInterval(typeof state.refreshInterval === 'number' ? state.refreshInterval : 7000);
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

  useEffect(() => {
    if (autoRefresh && isRunning) {
      const timer = setInterval(() => { void performAutoUpdate(); }, refreshInterval);
      return () => clearInterval(timer);
    }
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

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">IDARi</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">AI Auto-Updater &amp; Bug Monitor</p>
          </div>
        </div>
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
      </div>

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
    </div>
  );
}
