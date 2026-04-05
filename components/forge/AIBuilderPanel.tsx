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

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Zap, Copy, ExternalLink, ChevronDown, ChevronUp,
  User, Settings, Shield, CheckCircle2, AlertCircle,
  FileText, Clock, RotateCcw, Code2, Check,
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
  green:  '#22c55e',
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

// ── Phase system ──────────────────────────────────────────────────────────────

const PHASES = ['Parsing', 'Dr. Eams', 'IDARi', 'Safety', 'Generating', 'Staging', 'Done'] as const;

function getPhaseIndexFromStep(step: string): number {
  if (step.includes('Parsing'))               return 0;
  if (step.includes('Dr. Eams'))              return 1;
  if (step.includes('IDARi is architecting')) return 2;
  if (step.includes('TheBoogieMan'))          return 3;
  if (step.includes('Generating'))            return 4;
  if (step.includes('Staging'))               return 5;
  if (step.includes('Build complete'))        return 6;
  return -1;
}

// ── Phase progress bar ────────────────────────────────────────────────────────

function PhaseBar({ activePhase }: { activePhase: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      padding: '10px 14px',
      background: FORGE.panel,
      borderRadius: 10,
      border: `1px solid ${FORGE.border}`,
      marginBottom: 10,
      overflowX: 'auto',
    }}>
      {PHASES.map((phase, idx) => {
        const isDone    = idx < activePhase;
        const isActive  = idx === activePhase;

        const color = isDone ? FORGE.green
          : isActive ? FORGE.accent
          : FORGE.dim;

        const bg = isDone   ? 'rgba(34,197,94,0.12)'
          : isActive ? `${FORGE.accent}18`
          : 'transparent';

        return (
          <React.Fragment key={phase}>
            <motion.div
              animate={{ scale: isActive ? [1, 1.05, 1] : 1 }}
              transition={{ repeat: isActive ? Infinity : 0, duration: 1.8 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px',
                borderRadius: 999,
                background: bg,
                border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : isActive ? `${FORGE.accent}40` : 'transparent'}`,
                flexShrink: 0,
              }}
            >
              {isDone && <Check className="w-2.5 h-2.5" style={{ color: FORGE.green }} />}
              {isActive && (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.0 }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: FORGE.accent, display: 'inline-block' }}
                />
              )}
              <span style={{
                fontSize: 9,
                fontWeight: isActive || isDone ? 800 : 600,
                color,
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}>
                {phase}
              </span>
            </motion.div>
            {idx < PHASES.length - 1 && (
              <div style={{
                width: 12, height: 1,
                background: idx < activePhase ? 'rgba(34,197,94,0.5)' : FORGE.border,
                flexShrink: 0,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Code block renderer ───────────────────────────────────────────────────────

type CodeLogEvent = Extract<ForgeLogEvent, { type: 'code' }>;

function CodeBlock({ event }: { event: CodeLogEvent }) {
  const [copied, setCopied] = useState(false);
  const lines = event.content.split('\n');
  const MAX_VISIBLE = 15;
  const visibleLines = lines.slice(0, MAX_VISIBLE);
  const hiddenCount  = lines.length - MAX_VISIBLE;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(event.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }, [event.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 10,
        border: '1px solid rgba(34,211,238,0.2)',
        overflow: 'hidden',
        margin: '6px 0',
        background: '#0d1117',
      }}
    >
      {/* Filename header tab */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px',
        background: 'rgba(34,211,238,0.06)',
        borderBottom: '1px solid rgba(34,211,238,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Code2 className="w-3 h-3" style={{ color: '#22d3ee' }} />
          <span style={{ fontSize: 11, color: '#22d3ee', fontFamily: 'monospace', fontWeight: 600 }}>
            {event.filename}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Language badge */}
          <span style={{
            fontSize: 9, fontWeight: 700,
            padding: '2px 7px', borderRadius: 999,
            background: 'rgba(34,211,238,0.12)',
            border: '1px solid rgba(34,211,238,0.25)',
            color: '#22d3ee',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {event.language}
          </span>
          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${copied ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.12)'}`,
              color: copied ? FORGE.green : FORGE.dim,
              cursor: 'pointer',
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 4,
              transition: 'all 0.2s',
            }}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      {/* Scrollable code content */}
      <div style={{
        padding: '10px 12px',
        overflowX: 'auto',
        maxHeight: `${MAX_VISIBLE * 20}px`,
        overflowY: 'auto',
      }}>
        <pre style={{
          margin: 0,
          fontSize: 11,
          lineHeight: 1.65,
          fontFamily: 'JetBrains Mono, Fira Code, ui-monospace, monospace',
          color: 'rgba(255,255,255,0.82)',
          whiteSpace: 'pre',
        }}>
          {visibleLines.join('\n')}
          {hiddenCount > 0 && (
            <span style={{ color: FORGE.dim, fontStyle: 'italic' }}>
              {`\n... +${hiddenCount} more lines`}
            </span>
          )}
        </pre>
      </div>
    </motion.div>
  );
}

// ── Example prompt chips ──────────────────────────────────────────────────────

const EXAMPLE_CHIPS = [
  { emoji: '🎮', text: 'Desert platformer with dash ability and scoreboard' },
  { emoji: '🎵', text: 'Lo-fi hip-hop beat with vinyl crackle and chord progressions' },
  { emoji: '💻', text: 'TypeScript HTTP client with retry logic and rate limiting' },
  { emoji: '🔬', text: 'Monte Carlo simulation of stock price movement' },
] as const;

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
    } else if (log.type === 'code') {
      lines.push('');
      lines.push(`### Generated: \`${log.filename}\` (${log.language})`);
      lines.push('```' + log.language);
      lines.push(log.content);
      lines.push('```');
      lines.push('');
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

function LogEntry({
  event,
  isActive = false,
  isRunning = false,
}: {
  event: ForgeLogEvent;
  isActive?: boolean;
  isRunning?: boolean;
}) {
  const time = formatTimestamp(event.ts);

  // code event → full code block
  if (event.type === 'code') {
    return <CodeBlock event={event as CodeLogEvent} />;
  }

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
            {isActive && isRunning && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                style={{ color, marginLeft: 2, fontWeight: 400 }}
              >
                ▊
              </motion.span>
            )}
          </p>
        </div>
      </motion.div>
    );
  }

  if (event.type === 'step') {
    const isPhase = event.step.startsWith('PHASE:');
    if (isPhase) {
      const label = event.step.replace('PHASE: ', '').replace(' 🎉', '');
      const isBuildComplete = event.step.includes('Build complete');
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0' }}>
          <div style={{ flex: 1, height: 1, background: FORGE.border }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              background: isBuildComplete
                ? 'rgba(34,197,94,0.12)'
                : `${FORGE.accent}10`,
              border: `1px solid ${isBuildComplete ? 'rgba(34,197,94,0.35)' : `${FORGE.accent}30`}`,
              fontSize: 10, fontWeight: 800,
              color: isBuildComplete ? FORGE.green : FORGE.accent,
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {label}
          </motion.div>
          <div style={{ flex: 1, height: 1, background: FORGE.border }} />
        </div>
      );
    }

    // Regular step (non-PHASE)
    return (
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '4px 0',
          color: FORGE.dim,
        }}
      >
        <Zap className="w-3 h-3" style={{ color: FORGE.gold, flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
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

  // Active phase (from PHASE: step events)
  const activePhase = useMemo(() => {
    let phase = -1;
    for (const log of logs) {
      if (log.type === 'step' && log.step.startsWith('PHASE:')) {
        const p = getPhaseIndexFromStep(log.step);
        if (p > phase) phase = p;
      }
    }
    return phase;
  }, [logs]);

  // Current phase label shown in the Forge button while running
  const currentPhaseLabel = useMemo(() => {
    const phaseSteps = logs.filter(l => l.type === 'step' && l.step.startsWith('PHASE:'));
    if (!phaseSteps.length) return null;
    const last = phaseSteps[phaseSteps.length - 1] as Extract<ForgeLogEvent, { type: 'step' }>;
    return last.step.replace('PHASE: ', '').replace(' 🎉', '');
  }, [logs]);

  // Visible logs (exclude done event) + last-agent index for typing cursor
  const visibleLogs = useMemo(() => logs.filter(e => e.type !== 'done'), [logs]);
  const lastAgentVisibleIdx = useMemo(() => {
    if (state !== 'running') return -1;
    return visibleLogs.reduce((idx, log, i) => (log.type === 'agent' ? i : idx), -1);
  }, [visibleLogs, state]);

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
  const charCount = prompt.length;

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
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: FORGE.dim, marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Describe what you want to build
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isRunning || isLimitHit}
              placeholder="Describe anything... a game, a track, a script, a brand kit, an experiment"
              rows={5}
              style={{
                width: '100%',
                resize: 'none',
                background: FORGE.panel,
                border: `1px solid ${isRunning ? FORGE.accent + '55' : prompt.trim() ? `${FORGE.accent}30` : FORGE.border}`,
                borderRadius: 12,
                padding: '12px 14px 28px',
                color: FORGE.text,
                fontSize: 13,
                lineHeight: 1.65,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                opacity: (isRunning || isLimitHit) ? 0.6 : 1,
                transition: 'border-color 0.2s, opacity 0.2s',
              }}
            />
            {/* Character counter */}
            <div style={{
              position: 'absolute', bottom: 8, right: 10,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {charCount > 0 && (
                <motion.span
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: charCount > 500 ? '#fb923c' : FORGE.accent,
                    display: 'inline-block',
                  }}
                />
              )}
              <span style={{ fontSize: 10, color: charCount > 500 ? '#fb923c' : FORGE.dim, fontFamily: 'monospace' }}>
                {charCount}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 10, color: FORGE.dim, marginTop: 4 }}>
            ⌘↵ or Ctrl+↵ to submit · 1 build per day
          </div>
        </div>

        {/* ── Example chips ── */}
        {!isRunning && !isDone && !logs.length && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {EXAMPLE_CHIPS.map(chip => (
              <button
                key={chip.text}
                type="button"
                onClick={() => setPrompt(`${chip.emoji} ${chip.text}`)}
                disabled={isLimitHit}
                style={{
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: FORGE.panel,
                  border: `1px solid ${FORGE.border}`,
                  color: FORGE.text,
                  fontSize: 11,
                  cursor: isLimitHit ? 'not-allowed' : 'pointer',
                  opacity: isLimitHit ? 0.5 : 1,
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { if (!isLimitHit) (e.currentTarget as HTMLButtonElement).style.borderColor = `${FORGE.accent}50`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = FORGE.border; }}
              >
                {chip.emoji} {chip.text}
              </button>
            ))}
          </div>
        )}

        {/* ── Action buttons row: [Forge It] [Reset] [Share Log] ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            whileTap={canSubmit ? { scale: 0.96 } : {}}
            style={{
              flex: 1,
              padding: isRunning ? '8px 20px' : '11px 20px',
              borderRadius: 999,
              background: canSubmit ? FORGE.accent : 'rgba(239,68,68,0.18)',
              border: 'none',
              color: canSubmit ? '#fff' : 'rgba(255,255,255,0.35)',
              fontSize: 13, fontWeight: 800,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: isRunning && currentPhaseLabel ? 'column' : 'row',
              gap: isRunning ? 2 : 8,
              transition: 'background 0.2s, color 0.2s',
              letterSpacing: '-0.01em',
              minHeight: 44,
            }}
          >
            {isRunning ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                    style={{ display: 'inline-block' }}
                  >
                    🔥
                  </motion.span>
                  <span style={{ fontSize: 13, fontWeight: 800 }}>Building...</span>
                </div>
                {currentPhaseLabel && (
                  <span style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.72)',
                    fontWeight: 500,
                    maxWidth: 200,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {currentPhaseLabel}
                  </span>
                )}
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

        {/* ── Launch Result — full-width below action row ── */}
        <AnimatePresence>
          {isDone && result && (
            <motion.div
              key="launch-result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{ marginBottom: 14 }}
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
              {/* Phase progress bar — visible once first PHASE event arrives */}
              {activePhase >= 0 && <PhaseBar activePhase={activePhase} />}
              <div style={{
                maxHeight: 420,
                overflowY: 'auto',
                padding: '12px 14px',
                background: FORGE.panel,
                border: `1px solid ${FORGE.border}`,
                borderRadius: 12,
                display: 'flex', flexDirection: 'column', gap: 1,
              }}>
                {visibleLogs.map((event, i) => (
                  <LogEntry
                    key={`${event.type}-${event.ts}-${i}`}
                    event={event}
                    isActive={i === lastAgentVisibleIdx}
                    isRunning={isRunning}
                  />
                ))}
                <div ref={logEndRef} />
              </div>
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
