'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Play, Pause, RefreshCw, Shield, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { emitInnerDreamsEvent } from '@/lib/agents/agentBus';

interface InnerDreamsLog {
  timestamp: Date;
  action: string;
  status: 'success' | 'error' | 'pending';
  details?: string;
}

interface InnerDreamsProps {
  userId: string;
  isAdmin: boolean;
}

export default function InnerDreams({ userId, isAdmin }: InnerDreamsProps) {
  // Default ON unless the user turns it off. We persist this in localStorage.
  const [isRunning, setIsRunning] = useState(true);
  const [logs, setLogs] = useState<InnerDreamsLog[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  // Default ON unless the user turns it off. (This is the “acts on its own” toggle.)
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(7000);
  const [bugCheckEnabled, setBugCheckEnabled] = useState(true);

  useEffect(() => {
    // Load saved state from localStorage
    const savedState = localStorage.getItem('innerdreams_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        // Respect user's saved choice; otherwise default ON.
        setIsRunning(state.isRunning !== false);
        setAutoRefresh(state.autoRefresh !== false);
        setRefreshInterval(typeof state.refreshInterval === 'number' ? state.refreshInterval : 7000);
        setBugCheckEnabled(state.bugCheckEnabled !== false);
      } catch (e) {
        console.error('Failed to load InnerDreams state:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Save state to localStorage
    localStorage.setItem('innerdreams_state', JSON.stringify({
      isRunning,
      autoRefresh,
      refreshInterval,
      bugCheckEnabled
    }));
  }, [isRunning, autoRefresh, refreshInterval, bugCheckEnabled]);

  useEffect(() => {
    // Auto-refresh timer
    if (autoRefresh && isRunning) {
      const timer = setInterval(() => {
        performAutoUpdate();
      }, refreshInterval);
      return () => clearInterval(timer);
    }
  }, [autoRefresh, isRunning, refreshInterval]);

  const addLog = (action: string, status: InnerDreamsLog['status'], details?: string) => {
    const timestamp = new Date();
    // UI log
    setLogs(prev => [{
      timestamp,
      action,
      status,
      details
    }, ...prev.slice(0, 49)]); // Keep last 50 logs

    // Broadcast to Dr. Eams (and any other listeners)
    emitInnerDreamsEvent({
      type: 'innerdreams:log',
      timestamp: timestamp.toISOString(),
      status,
      message: action,
      details
    });
  };

  const performAutoUpdate = async () => {
    if (!isRunning) return;

    addLog('Auto-update cycle started', 'pending');

    try {
      // Check for bugs first if enabled
      if (bugCheckEnabled) {
        await checkForBugs();
      }

      // Run the update
      await runUpdate();

      addLog('Auto-update cycle completed', 'success');
    } catch (error) {
      addLog('Auto-update failed', 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const checkForBugs = async () => {
    addLog('Bug check initiated', 'pending');

    try {
      // In production, this would call your backend API
      const response = await fetch('/api/innerdreams/check-bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Bug check request failed');
      }

      const result = await response.json();
      
      if (result.bugsFound > 0) {
        addLog(`Found ${result.bugsFound} potential issues`, 'error', result.details);
      } else {
        addLog('No bugs detected', 'success');
      }
    } catch (error) {
      addLog('Bug check failed', 'error', error instanceof Error ? error.message : 'Unknown error');
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
      // Call your backend API endpoint
      const response = await fetch('/api/innerdreams/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          prompt,
          autoRefresh,
          bugCheck: bugCheckEnabled
        })
      });

      if (!response.ok) {
        throw new Error('Update request failed');
      }

      const result = await response.json();
      
      addLog('Update completed', 'success', result.message);
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
      addLog('InnerDreams system paused', 'success');
    } else {
      setIsRunning(true);
      addLog('InnerDreams system activated', 'success');
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">InnerDreams</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">AI Auto-Updater & Bug Monitor</p>
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
          {isRunning ? 'Pause' : 'Activate'}
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
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Bug Check</span>
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
            Update Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the changes you want InnerDreams to make (e.g., 'Fix the navigation alignment issue' or 'Add error handling to the form submission')"
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white resize-none"
            disabled={isProcessing}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRun}
            disabled={isProcessing || !prompt.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            <Zap className="w-4 h-4" />
            {isProcessing ? 'Processing...' : 'Run Update'}
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
            <span className="text-sm text-slate-700 dark:text-slate-300">Bug check</span>
          </label>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Activity Log</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              No activity yet. Activate InnerDreams to start monitoring.
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
