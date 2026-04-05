'use client';

/**
 * components/forge/AIBuilderPanel.tsx
 *
 * ForgeEngin — AI Anything Builder UI panel.
 *
 * Self-contained React component that renders the "AI Anything Builder" UI.
 * Matches the ForgeEngin dark command-center aesthetic exactly.
 *
 * Architecture: 'use client' component. Communicates with /api/forge/build
 * via the useForgeBuild hook only. No direct server calls from this file.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Zap, Copy, ExternalLink, ChevronDown, ChevronUp,
  User, Settings, Shield, CheckCircle2, AlertCircle,
  FileText, Clock, RotateCcw,
} from 'lucide-react';
import { useForgeBuild } from '@/lib/forge/useForgeBuild';
import { readForgeBuilds, canBuildToday, type ForgeLogEvent, type ForgeBuildRecord } from '@/lib/forge/forgeBuild';
import { ENGIN_REGISTRY } from '@/lib/forge/forgeRegistry';

// ── Design tokens (matches ForgeEngin FORGE object) ──────────────────────────
const FORGE = {
  bg:     '#0a0a0f',
  panel:  'rgba(255,255,255,0.04)',
  panel2: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)',
  text:   'rgba(255,255,255,0.88)',
  dim:    'rgba(255,255,255,0.45)',
  accent: '#ef4444',
  gold:   '#c8981a',
  glow:   'rgba(239,68,68,0.18)',
} as const;

// Agent color map
const AGENT_COLORS: Record<string, string> = {
  'Dr. Eams':          '#a855f7',
  'IDARi':             '#22d3ee',
  'TheBoogieMan.Ai':   '#fb923c',
};

const AGENT_INITIALS: Record<string, string> = {
  'Dr. Eams':          'DE',
  'IDARi':             'ID',
  'TheBoogieMan.Ai':   'BM',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function buildMarkdownSummary(logs: ForgeLogEvent[], prompt: string): string {
  const lines = [
    `# ForgeEngin AI Build Log`,
    `**Prompt:** ${prompt}`,
    `**Built:** ${new Date().toLocaleString()}`,
    '',
    '## Agent Conversation',
    '',
  ];
  for (const log of logs) {
    const time = formatTimestamp(log.ts);
    if (log.type === 'agent') {
      lines.push(`### [${time}] ${log.agent}`);
      lines.push(log.message);
      lines.push('');
    } else if (log.type === 'step') {
      lines.push(`- ⚡ \`${log.step}\``);
    } else if (log.type === 'file') {
      lines.push(`- 📄 \`${log.path}\` (${log.action})`);
    } else if (log.type === 'result') {
      lines.push('');
      lines.push(`## Result`);
      lines.push(`**Engine:** ${log.enginId}`);
      lines.push(`**Link:** ${log.href}`);
      lines.push(`**Summary:** ${log.summary}`);
    } else if (log.type === 'error') {
      lines.push(`> ⚠️ Error: ${log.message}`);
    }
  }
  return lines.join('\n');
}

// ── Log entry renderer ────────────────────────────────────────────────────────

function LogEntry({ event }: { event: ForgeLogEvent }) {
  const time = formatTimestamp(event.ts);

  if (event.type === 'agent') {
    const color = AGENT_COLORS[event.agent] ?? '#888';
    const initials = AGENT_INITIALS[event.agent] ?? '??';
    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${FORGE.border}` }}
      >
        {/* Agent badge */}
        <div style={{
          flexShrink: 0,
          width: 28, height: 28,
          borderRadius: '50%',
          background: `${color}22`,
          border: `1.5px solid ${color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 800, color,
          marginTop: 2,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color }}>{event.agent}</span>
            <span style={{
              fontSize: 9, fontWeight: 700,
              padding: '2px 6px', borderRadius: 999,
              background: `${color}18`,
              color,
              border: `1px solid ${color}30`,
            }}>
              {event.agent === 'Dr. Eams' ? 'Creative' : event.agent === 'IDARi' ? 'Systems' : 'Policy'}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: FORGE.dim, fontFamily: 'monospace' }}>
              {time}
            </span>
          </div>
          <p style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.6,
            color: FORGE.text,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {event.message}
          </p>
        </div>
      </motion.div>
    );
  }

  if (event.type === 'step') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '5px 0',
          color: FORGE.dim,
        }}
      >
        <Zap className="w-3 h-3" style={{ color: FORGE.gold, flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {event.step}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: FORGE.dim, fontFamily: 'monospace', flexShrink: 0 }}>
          {time}
        </span>
      </motion.div>
    );
  }

  if (event.type === 'file') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 0',
        }}
      >
        <FileText className="w-3 h-3" style={{ color: '#22d3ee', flexShrink: 0 }} />
        <code style={{ fontSize: 11, color: '#22d3ee', wordBreak: 'break-all' }}>
          {event.path}
        </code>
        <span style={{
          fontSize: 9, fontWeight: 700,
          padding: '2px 6px', borderRadius: 999,
          background: event.action === 'created' ? 'rgba(34,197,94,0.12)' : 'rgba(251,146,60,0.12)',
          color: event.action === 'created' ? '#22c55e' : '#fb923c',
          border: `1px solid ${event.action === 'created' ? 'rgba(34,197,94,0.25)' : 'rgba(251,146,60,0.25)'}`,
          flexShrink: 0,
        }}>
          {event.action}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: FORGE.dim, fontFamily: 'monospace', flexShrink: 0 }}>
          {time}
        </span>
      </motion.div>
    );
  }

  if (event.type === 'result') {
    const enginEntry = ENGIN_REGISTRY.find(e => e.id === event.enginId);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          padding: '12px 14px',
          borderRadius: 12,
          background: `linear-gradient(135deg, ${FORGE.accent}12, rgba(200,152,26,0.08))`,
          border: `1px solid ${FORGE.accent}35`,
          margin: '8px 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <CheckCircle2 className="w-4 h-4" style={{ color: FORGE.accent }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: FORGE.accent }}>BUILD COMPLETE</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: FORGE.dim, fontFamily: 'monospace' }}>{time}</span>
        </div>
        <div style={{ fontSize: 12, color: FORGE.text, marginBottom: 4 }}>
          <strong style={{ color: FORGE.gold }}>{enginEntry?.name ?? event.enginId}</strong>
          {' · '}{event.summary}
        </div>
      </motion.div>
    );
  }

  if (event.type === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '6px 10px',
          borderRadius: 8,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          margin: '4px 0',
        }}
      >
        <AlertCircle className="w-3.5 h-3.5" style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 11, color: '#ef4444', wordBreak: 'break-word' }}>{event.message}</span>
      </motion.div>
    );
  }

  // done — handled externally
  return null;
}

// ── Build history item ────────────────────────────────────────────────────────

function HistoryItem({ record, onLaunch }: { record: ForgeBuildRecord; onLaunch: (href: string) => void }) {
  const enginEntry = ENGIN_REGISTRY.find(e => e.id === record.primaryEnginId);
  const elapsed = Date.now() - new Date(record.createdAt).getTime();
  const timeStr =
    elapsed < 60_000 ? 'just now' :
    elapsed < 3600_000 ? `${Math.floor(elapsed / 60_000)}m ago` :
    elapsed < 86400_000 ? `${Math.floor(elapsed / 3600_000)}h ago` :
    `${Math.floor(elapsed / 86400_000)}d ago`;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0',
      borderBottom: `1px solid ${FORGE.border}`,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{enginEntry?.emoji ?? '🔥'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: FORGE.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {record.summary || record.prompt.slice(0, 50)}
        </div>
        <div style={{ fontSize: 10, color: FORGE.dim, marginTop: 2 }}>
          <Clock className="w-2.5 h-2.5" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          {timeStr} · {enginEntry?.name ?? record.primaryEnginId}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onLaunch(record.primaryHref)}
        style={{
          padding: '5px 10px',
          borderRadius: 999,
          background: FORGE.panel2,
          border: `1px solid ${FORGE.border}`,
          color: FORGE.text,
          fontSize: 11, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          flexShrink: 0,
        }}
      >
        <ExternalLink className="w-3 h-3" />
        Open
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AIBuilderPanel() {
  const router = useRouter();
  const { state, logs, result, submit, reset, rateLimitError } = useForgeBuild();

  const [prompt, setPrompt] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [buildHistory, setBuildHistory] = useState<ForgeBuildRecord[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [dailyLimitHit, setDailyLimitHit] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);

  // Check daily limit on mount
  useEffect(() => {
    setDailyLimitHit(!canBuildToday());
    setBuildHistory(readForgeBuilds());
  }, []);

  // Auto-scroll log viewer
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Refresh daily limit after successful build
  useEffect(() => {
    if (state === 'done') {
      setDailyLimitHit(!canBuildToday());
      setBuildHistory(readForgeBuilds());
    }
  }, [state]);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim() || state === 'running') return;
    submit(prompt);
  }, [prompt, state, submit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleCopyLog = useCallback(async () => {
    if (!logs.length) return;
    const md = buildMarkdownSummary(logs, prompt);
    try {
      await navigator.clipboard.writeText(md);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Clipboard not available
    }
  }, [logs, prompt]);

  const handleLaunch = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  const handleReset = useCallback(() => {
    reset();
    setPrompt('');
  }, [reset]);

  const isRunning = state === 'running';
  const isDone = state === 'done';
  const isLimitHit = dailyLimitHit || !!rateLimitError;
  const canSubmit = prompt.trim().length > 0 && !isRunning && !isLimitHit;

  return (
    <div style={{
      background: FORGE.bg,
      borderRadius: 18,
      border: `1px solid ${FORGE.border}`,
      overflow: 'hidden',
    }}>
      {/* ── Agent persona badges ── */}
      <div style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${FORGE.border}`,
        background: FORGE.panel,
        display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: FORGE.dim, marginRight: 4 }}>
          AI TRIAD
        </span>
        {[
          { name: 'Dr. Eams', role: 'Creative', Icon: User, color: AGENT_COLORS['Dr. Eams'] },
          { name: 'IDARi', role: 'Systems', Icon: Settings, color: AGENT_COLORS['IDARi'] },
          { name: 'TheBoogieMan.Ai', role: 'Policy', Icon: Shield, color: AGENT_COLORS['TheBoogieMan.Ai'] },
        ].map(({ name, role, Icon, color }) => (
          <div
            key={name}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 999,
              background: `${color}12`,
              border: `1px solid ${color}30`,
            }}
          >
            <Icon className="w-3 h-3" style={{ color }} />
            <span style={{ fontSize: 11, fontWeight: 700, color }}>{name}</span>
            <span style={{ fontSize: 10, color: `${color}99` }}>· {role}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '18px 18px 0' }}>
        {/* ── Rate limit banner ── */}
        <AnimatePresence>
          {isLimitHit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(251,146,60,0.10)',
                border: '1px solid rgba(251,146,60,0.30)',
                marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>🌙</span>
              <span style={{ fontSize: 12, color: '#fb923c' }}>
                {rateLimitError ?? 'Daily build limit reached. 1 free build per day — come back tomorrow!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Prompt textarea ── */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: FORGE.dim, marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Describe what you want to build
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning || isLimitHit}
            placeholder={[
              'Build me a 2D desert platformer game with a scoreboard...',
              'Create a lo-fi hip-hop beat with chord progressions...',
              'Write a TypeScript parser for JSON to YAML with tests...',
              'Design a brand kit for a tech startup with a blue palette...',
            ].join('\n')}
            rows={4}
            style={{
              width: '100%',
              resize: 'none',
              background: FORGE.panel,
              border: `1px solid ${isRunning ? FORGE.accent + '55' : FORGE.border}`,
              borderRadius: 10,
              padding: '12px 14px',
              color: FORGE.text,
              fontSize: 13,
              lineHeight: 1.6,
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              opacity: (isRunning || isLimitHit) ? 0.6 : 1,
              transition: 'border-color 0.2s, opacity 0.2s',
            }}
          />
          <div style={{ fontSize: 10, color: FORGE.dim, marginTop: 4 }}>
            ⌘↵ or Ctrl+↵ to submit · 1 build per day
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            whileTap={canSubmit ? { scale: 0.96 } : {}}
            style={{
              flex: 1,
              padding: '11px 20px',
              borderRadius: 999,
              background: canSubmit ? FORGE.accent : 'rgba(239,68,68,0.18)',
              border: 'none',
              color: canSubmit ? '#fff' : 'rgba(255,255,255,0.35)',
              fontSize: 13, fontWeight: 800,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s, color 0.2s',
              letterSpacing: '-0.01em',
            }}
          >
            {isRunning ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  style={{ display: 'inline-block' }}
                >
                  🔥
                </motion.span>
                Building...
              </>
            ) : (
              <>🔥 Forge It</>
            )}
          </motion.button>

          {(isDone || state === 'error') && (
            <motion.button
              type="button"
              onClick={handleReset}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.92 }}
              style={{
                padding: '11px 14px',
                borderRadius: 999,
                background: FORGE.panel,
                border: `1px solid ${FORGE.border}`,
                color: FORGE.dim,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 700,
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </motion.button>
          )}

          {logs.length > 0 && (
            <motion.button
              type="button"
              onClick={handleCopyLog}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.92 }}
              title="Copy build log as Markdown"
              style={{
                padding: '11px 14px',
                borderRadius: 999,
                background: copySuccess ? 'rgba(34,197,94,0.15)' : FORGE.panel,
                border: `1px solid ${copySuccess ? 'rgba(34,197,94,0.4)' : FORGE.border}`,
                color: copySuccess ? '#22c55e' : FORGE.dim,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 700,
                transition: 'background 0.2s, color 0.2s, border-color 0.2s',
              }}
            >
              <Copy className="w-3.5 h-3.5" />
              {copySuccess ? 'Copied!' : 'Share Log'}
            </motion.button>
          )}
        </div>

        {/* ── Log viewer ── */}
        <AnimatePresence>
          {logs.length > 0 && (
            <motion.div
              key="log-viewer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: 18 }}
            >
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: FORGE.dim, marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Zap className="w-3 h-3" style={{ color: FORGE.accent }} />
                BUILD LOG
                {isRunning && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    style={{ fontSize: 9, color: FORGE.accent, marginLeft: 4 }}
                  >
                    ● LIVE
                  </motion.span>
                )}
              </div>
              <div style={{
                maxHeight: 360,
                overflowY: 'auto',
                padding: '12px 14px',
                background: FORGE.panel,
                border: `1px solid ${FORGE.border}`,
                borderRadius: 12,
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                {logs.filter(e => e.type !== 'done').map((event, i) => (
                  <LogEntry key={`${event.type}-${event.ts}-${i}`} event={event} />
                ))}
                <div ref={logEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Launch Result button ── */}
        <AnimatePresence>
          {isDone && result && (
            <motion.div
              key="launch-result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{ marginBottom: 18 }}
            >
              <motion.button
                type="button"
                onClick={() => handleLaunch(result.primaryHref)}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${FORGE.accent}, ${FORGE.gold})`,
                  border: 'none',
                  color: '#fff',
                  fontSize: 14, fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  letterSpacing: '-0.01em',
                  boxShadow: `0 4px 24px ${FORGE.glow}`,
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Launch Result in {ENGIN_REGISTRY.find(e => e.id === result.primaryEnginId)?.name ?? 'Engin'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Build History ── */}
      <div style={{
        borderTop: `1px solid ${FORGE.border}`,
      }}>
        <button
          type="button"
          onClick={() => setShowHistory(v => !v)}
          style={{
            width: '100%',
            padding: '12px 18px',
            background: 'transparent',
            border: 'none',
            color: FORGE.dim,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}
        >
          <Clock className="w-3.5 h-3.5" />
          Build History ({buildHistory.length})
          <div style={{ marginLeft: 'auto' }}>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>
        <AnimatePresence>
          {showHistory && (
            <motion.div
              key="history"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '0 18px 16px' }}>
                {buildHistory.length === 0 ? (
                  <p style={{ fontSize: 12, color: FORGE.dim, textAlign: 'center', padding: '16px 0' }}>
                    No builds yet. Forge something! 🔥
                  </p>
                ) : (
                  buildHistory.map(rec => (
                    <HistoryItem key={rec.id} record={rec} onLaunch={handleLaunch} />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
