'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Play, Pause, RefreshCw, Shield, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { emitIdariEvent } from '@/lib/agents/agentBus';

interface IdariLog {
  timestamp: Date;
  action: string;
  status: 'success' | 'error' | 'pending';
  details?: string;
}

interface IdariProps {
  userId: string;
  isAdmin: boolean;
}

export default function Idari({ userId, isAdmin }: IdariProps) {
  // Default ON unless the user turns it off. We persist this in localStorage.
  const [isRunning, setIsRunning] = useState(true);
  const [logs, setLogs] = useState<IdariLog[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  // Default ON unless the user turns it off. (This is the "acts on its own" toggle.)
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(7000);
  const [bugCheckEnabled, setBugCheckEnabled] = useState(true);

  useEffect(() => {
    // Load saved state from localStorage
    const savedState = localStorage.getItem('idari_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        // Respect user's saved choice; otherwise default ON.
        setIsRunning(state.isRunning !== false);
        setAutoRefresh(state.autoRefresh !== false);
        setRefreshInterval(typeof state.refreshInterval === 'number' ? state.refreshInterval : 7000);
        setBugCheckEnabled(state.bugCheckEnabled !== false);
      } catch (e) {
        console.error('Failed to load Idari state:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Save state to localStorage
    localStorage.setItem('idari_state', JSON.stringify({
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, isRunning, refreshInterval]);

  const addLog = (action: string, status: IdariLog['status'], details?: string) => {
    const timestamp = new Date();
    // UI log
    setLogs(prev => [{
      timestamp,
      action,
      status,
      details
    }, ...prev.slice(0, 49)]); // Keep last 50 logs

    // Broadcast to Dr. Eams (and any other listeners)
    emitIdariEvent({
      type: 'idari:log',
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
      const response = await fetch('/api/idari/check-bugs', {
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
      const response = await fetch('/api/idari/update', {
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
      addLog('Idari system paused', 'success');
    } else {
      setIsRunning(true);
      addLog('Idari system activated', 'success');
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="de-surface" style={{ padding: '24px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, var(--de-accent), var(--de-gold))' }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="de-widget-title" style={{ margin: 0 }}>Idari</h3>
            <p className="text-sm" style={{ color: 'var(--de-text-dim)', margin: 0 }}>AI Admin Agent · Bug Monitor · Optimizer</p>
          </div>
        </div>
        <button
          onClick={toggleSystem}
          className="de-btn"
          style={{
            background: isRunning
              ? 'rgba(239,68,68,0.12)'
              : 'rgba(34,197,94,0.12)',
            color: isRunning ? '#dc2626' : '#16a34a',
            border: `1px solid ${isRunning ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
          }}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'Pause' : 'Activate'}
        </button>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="de-surface" style={{ padding: '12px', borderRadius: '14px', opacity: isRunning ? 1 : 0.6 }}>
          <div className="flex items-center gap-2 mb-1">
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isRunning ? 'var(--de-accent)' : 'var(--de-text-dim)',
              boxShadow: isRunning ? '0 0 6px var(--de-accent)' : 'none',
              animation: isRunning ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--de-text-dim)' }}>System</span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', margin: 0 }}>
            {isRunning ? 'Active' : 'Paused'}
          </p>
        </div>

        <div className="de-surface" style={{ padding: '12px', borderRadius: '14px', opacity: autoRefresh ? 1 : 0.6 }}>
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-3 h-3" style={{ color: 'var(--de-text-dim)', animation: autoRefresh ? 'spin 2s linear infinite' : 'none' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--de-text-dim)' }}>Auto-Refresh</span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', margin: 0 }}>
            {autoRefresh ? `${refreshInterval / 1000}s` : 'Off'}
          </p>
        </div>

        <div className="de-surface" style={{ padding: '12px', borderRadius: '14px', opacity: bugCheckEnabled ? 1 : 0.6 }}>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3 h-3" style={{ color: 'var(--de-text-dim)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--de-text-dim)' }}>Bug Check</span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', margin: 0 }}>
            {bugCheckEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4 mb-6">
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--de-text-dim)', marginBottom: 8 }}>
            Update Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the changes you want Idari to make (e.g., 'Fix the navigation alignment issue' or 'Add error handling to the form submission')"
            rows={3}
            className="de-surface"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 14,
              color: 'var(--de-text)',
              resize: 'none',
              outline: 'none',
              borderRadius: '14px',
              boxSizing: 'border-box',
            }}
            disabled={isProcessing}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleManualRun}
            disabled={isProcessing || !prompt.trim()}
            className="de-btn de-btn-gold"
            style={{ opacity: (isProcessing || !prompt.trim()) ? 0.5 : 1, cursor: (isProcessing || !prompt.trim()) ? 'not-allowed' : 'pointer' }}
          >
            <Zap className="w-4 h-4" />
            {isProcessing ? 'Processing…' : 'Run Update'}
          </button>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ accentColor: 'var(--de-accent)' }}
            />
            <span style={{ fontSize: 13, color: 'var(--de-text)' }}>Auto-refresh</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bugCheckEnabled}
              onChange={(e) => setBugCheckEnabled(e.target.checked)}
              style={{ accentColor: 'var(--de-accent)' }}
            />
            <span style={{ fontSize: 13, color: 'var(--de-text)' }}>Bug check</span>
          </label>
        </div>
      </div>

      {/* Activity Log */}
      <div className="de-surface" style={{ padding: '16px', borderRadius: '18px' }}>
        <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--de-text-dim)', marginBottom: 12, marginTop: 0 }}>Activity Log</h4>
        <div style={{ maxHeight: 256, overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--de-text-dim)', textAlign: 'center', padding: '16px 0', margin: 0 }}>
              No activity yet. Activate Idari to start monitoring.
            </p>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2"
                style={{
                  padding: '8px',
                  borderRadius: 10,
                  borderTop: idx > 0 ? '1px solid rgba(160,195,240,0.18)' : 'none',
                }}
              >
                {log.status === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#16a34a' }} />}
                {log.status === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />}
                {log.status === 'pending' && <RefreshCw className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--de-accent)', animation: 'spin 1s linear infinite' }} />}
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, color: 'var(--de-heading)', fontWeight: 600, margin: 0 }}>{log.action}</p>
                  {log.details && (
                    <p style={{ fontSize: 12, color: 'var(--de-text-dim)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details}</p>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: '2px 0 0' }}>
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
