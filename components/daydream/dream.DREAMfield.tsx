'use client';

/**
 * DREAMfield -- Creative Intelligence Command Center
 *
 * A full-screen command center that surfaces the full depth of the Forge
 * intelligence layer in one fast, information-dense view.  No gimmicks --
 * just the most powerful read-out of your creative state anywhere in DREAMengin.
 *
 * Layout (top to bottom):
 *   1. Hero strip   -- Forge Momentum level + composite score + progress bar
 *   2. Main grid    -- Activity timeline (left) | AI next-steps (right)
 *   3. Insight row  -- Detected rituals | Engin connection heat-map | Quick-launch
 *
 * Data sources (all local, no Supabase):
 *   - computeMomentum()     - creative velocity score (forgeMomentum)
 *   - readForgeHistory()    - chronological activity log (forgeIntelligence)
 *   - generateSuggestions() - AI next-step predictions (forgeIntelligence)
 *   - computeRituals()      - auto-detected workflow patterns (forgeRituals)
 *   - computeNexus()        - engine-to-engine transition graph (forgeNexus)
 *   - readForgeActivity()   - per-engine heat scores (forgeRegistry)
 *
 * Architecture:
 *   - Pure client component; no Supabase calls
 *   - All data computed from localStorage on mount + refreshed every 15s
 *   - "/" command palette for keyboard navigation
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Command, Zap, Clock, ChevronRight, Sparkles, Activity } from 'lucide-react';

import {
  computeMomentum,
  getLevelColor,
  getLevelEmoji,
  type MomentumLevel,
  type MomentumSnapshot,
} from '@/lib/forge/forgeMomentum';
import {
  readForgeHistory,
  generateSuggestions,
  type ForgeHistoryEntry,
  type ForgeSuggestion,
} from '@/lib/forge/forgeIntelligence';
import {
  computeRituals,
  type RitualSnapshot,
} from '@/lib/forge/forgeRituals';
import {
  computeNexus,
  type NexusSnapshot,
} from '@/lib/forge/forgeNexus';
import {
  CREATIVE_ENGINES,
  readForgeActivity,
  type ForgeActivityPulse,
} from '@/lib/forge/forgeRegistry';

// -- Engin quick-launch config -------------------------------------------------

export interface EnginLaunchEntry {
  id: string;
  name: string;
  emoji: string;
  accent: string;
  href: string;
  desc: string;
}

export const ENGIN_LAUNCHPAD: EnginLaunchEntry[] = CREATIVE_ENGINES.map(e => ({
  id:     e.id,
  name:   e.name,
  emoji:  e.emoji,
  accent: e.accent,
  href:   e.daydreamHref,
  desc:   e.desc,
}));

// -- Utility ------------------------------------------------------------------

/**
 * Format an ISO timestamp as a human-readable relative string.
 * Exported so tests can verify it without mounting the full component.
 */
export function formatTimestampRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60)        return 'just now';
  if (secs < 3600)      return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)     return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 86400 * 7) return `${Math.floor(secs / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

// -- Design tokens (self-contained, no Tailwind runtime required here) ---------

const T = {
  bg:       '#05070f',
  panel:    'rgba(255,255,255,0.035)',
  border:   'rgba(255,255,255,0.07)',
  text:     'rgba(255,255,255,0.88)',
  dim:      'rgba(255,255,255,0.42)',
  faint:    'rgba(255,255,255,0.18)',
  radius:   16,
} as const;

// -- Sub-components -----------------------------------------------------------

/** Full-width hero strip showing the Momentum score + level */
function MomentumHero({ mom }: { mom: MomentumSnapshot }) {
  const color = getLevelColor(mom.level as MomentumLevel);
  const emoji = getLevelEmoji(mom.level as MomentumLevel);
  const pct   = mom.composite;

  return (
    <div style={{
      background:   `linear-gradient(135deg, ${color}14 0%, transparent 60%)`,
      border:       `1px solid ${color}28`,
      borderRadius:  T.radius,
      padding:      '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 56, fontWeight: 900, color: T.text, lineHeight: 1 }}>
            {pct}
          </span>
          <span style={{ fontSize: 14, color: T.dim }}>/100</span>
        </div>

        <div style={{
          display:     'flex',
          alignItems:  'center',
          gap:          8,
          padding:     '6px 16px',
          background:  `${color}20`,
          border:      `1px solid ${color}40`,
          borderRadius: 99,
        }}>
          <span style={{ fontSize: 18 }}>{emoji}</span>
          <span style={{ color, fontWeight: 700, fontSize: 14, letterSpacing: '0.1em' }}>
            {mom.level}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginLeft: 'auto' }}>
          {mom.dimensions.map(d => (
            <div key={d.name} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.dim, marginBottom: 2, letterSpacing: '0.07em' }}>
                {d.emoji} {d.name.toUpperCase()}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: d.accent }}>
                {Math.round(d.score)}
              </div>
            </div>
          ))}
          {mom.streakDays > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.dim, marginBottom: 2, letterSpacing: '0.07em' }}>
                STREAK
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fb923c' }}>
                {mom.streakDays}d
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        marginTop:    14,
        height:        5,
        background:   'rgba(255,255,255,0.07)',
        borderRadius:  4,
        overflow:     'hidden',
      }}>
        <div style={{
          width:      `${pct}%`,
          height:     '100%',
          background: `linear-gradient(90deg, ${color}60, ${color})`,
          borderRadius: 4,
          transition: 'width 0.8s ease',
        }} />
      </div>

      {mom.enginesUsedToday.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: T.faint }}>
          Active today: {mom.enginesUsedToday.join(' \u00b7 ')}
        </div>
      )}
    </div>
  );
}

/** Activity timeline: most-recent Forge history entries */
function ActivityTimeline({ history }: { history: ForgeHistoryEntry[] }) {
  const shown = history.slice().reverse().slice(0, 18);

  return (
    <PanelBox title="Activity" icon={<Clock size={13} />}>
      {shown.length === 0 ? (
        <EmptyState text="No activity recorded yet. Open any Engin to start." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {shown.map((entry, i) => {
            const eng = CREATIVE_ENGINES.find(e => e.id === entry.enginId);
            return (
              <div
                key={i}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:         10,
                  padding:    '7px 10px',
                  borderRadius: 8,
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{eng?.emoji ?? '\u26a1'}</span>
                <span style={{
                  flex:         1,
                  fontSize:      12,
                  color:        T.text,
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                }}>
                  {entry.label}
                </span>
                <span style={{ fontSize: 11, color: T.faint, flexShrink: 0 }}>
                  {formatTimestampRelative(entry.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </PanelBox>
  );
}

/** AI-generated next-step suggestions */
function NextSteps({ suggestions }: { suggestions: ForgeSuggestion[] }) {
  const router = useRouter();

  return (
    <PanelBox title="What's Next" icon={<Sparkles size={13} />}>
      {suggestions.length === 0 ? (
        <EmptyState text="Use a few Engins and your personalised next-steps appear here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {suggestions.slice(0, 6).map((s, i) => (
            <button
              key={i}
              onClick={() => s.href && router.push(s.href)}
              style={{
                display:    'flex',
                alignItems: 'flex-start',
                gap:         12,
                padding:    '10px 12px',
                background: `${s.accent}12`,
                border:     `1px solid ${s.accent}28`,
                borderRadius: 10,
                cursor:      s.href ? 'pointer' : 'default',
                textAlign:  'left',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{s.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.accent, marginBottom: 3 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.4 }}>{s.reason}</div>
              </div>
              {s.href && <ChevronRight size={14} style={{ color: T.faint, flexShrink: 0, marginTop: 2 }} />}
            </button>
          ))}
        </div>
      )}
    </PanelBox>
  );
}

/** Top detected creative rituals */
function RitualCards({ snap }: { snap: RitualSnapshot }) {
  const top = snap.rituals.slice(0, 4);

  return (
    <PanelBox title="Your Patterns" icon={<Activity size={13} />} flex={1}>
      {top.length === 0 ? (
        <EmptyState text="Patterns detected after you use multiple Engins over a few sessions." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {top.map(r => (
            <div
              key={r.id}
              style={{
                padding:      '8px 11px',
                background:   `${r.accent}10`,
                border:       `1px solid ${r.accent}22`,
                borderRadius:  8,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: r.accent, marginBottom: 2 }}>
                {r.emoji} {r.title}
              </div>
              <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.4 }}>
                {r.description}
              </div>
              <div style={{
                marginTop:    5,
                height:        2,
                background:   'rgba(255,255,255,0.06)',
                borderRadius:  2,
                overflow:     'hidden',
              }}>
                <div style={{
                  width:      `${Math.round(r.confidence * 100)}%`,
                  height:     '100%',
                  background:  r.accent,
                  borderRadius: 2,
                }} />
              </div>
              <div style={{ fontSize: 10, color: T.faint, marginTop: 3 }}>
                {Math.round(r.confidence * 100)}% confidence \u00b7 {r.occurrences}\u00d7 observed
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelBox>
  );
}

/** Engin connection heat map */
function ConnectionMap({ nexus, activity }: { nexus: NexusSnapshot; activity: ForgeActivityPulse[] }) {
  const engines   = CREATIVE_ENGINES;
  const maxWeight = nexus.edges.reduce((m, e) => Math.max(m, e.weight), 1);

  return (
    <PanelBox title="Connection Map" flex={1}>
      {nexus.totalTransitions === 0 ? (
        <EmptyState text="Switch between Engins and see which ones you naturally pair." />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
            {nexus.edges.slice(0, 5).map((edge, i) => {
              const fromEng = engines.find(e => e.id === edge.from);
              const toEng   = engines.find(e => e.id === edge.to);
              const pct     = (edge.weight / maxWeight) * 100;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, width: 80, flexShrink: 0, color: T.dim }}>
                    {fromEng?.emoji} \u2192 {toEng?.emoji}
                  </span>
                  <div style={{
                    flex:         1,
                    height:        4,
                    background:   'rgba(255,255,255,0.07)',
                    borderRadius:  2,
                    overflow:     'hidden',
                  }}>
                    <div style={{
                      width:      `${pct}%`,
                      height:     '100%',
                      background: `linear-gradient(90deg, ${fromEng?.accent ?? '#fff'}80, ${toEng?.accent ?? '#fff'})`,
                      borderRadius: 2,
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: T.faint, width: 24, textAlign: 'right' }}>
                    {edge.weight}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {engines.map(eng => {
              const pulse = activity.find(a => a.enginId === eng.id);
              const heat  = pulse?.heat ?? 0;
              return (
                <div key={eng.id} style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:         5,
                  padding:    '4px 10px',
                  background: `${eng.accent}${heat > 0.4 ? '28' : '0d'}`,
                  border:     `1px solid ${eng.accent}${heat > 0.4 ? '40' : '18'}`,
                  borderRadius: 20,
                }}>
                  <span style={{ fontSize: 12 }}>{eng.emoji}</span>
                  <span style={{ fontSize: 11, color: heat > 0.4 ? eng.accent : T.faint }}>
                    {eng.id}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </PanelBox>
  );
}

/** Heat-sorted quick-launch grid */
function QuickLaunch({ activity }: { activity: ForgeActivityPulse[] }) {
  const router = useRouter();

  const sorted = [...ENGIN_LAUNCHPAD].sort((a, b) => {
    const ha = activity.find(p => p.enginId === a.id)?.heat ?? 0;
    const hb = activity.find(p => p.enginId === b.id)?.heat ?? 0;
    return hb - ha;
  });

  return (
    <PanelBox title="Quick Launch" flex={1}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {sorted.map(eng => {
          const pulse = activity.find(p => p.enginId === eng.id);
          const heat  = pulse?.heat ?? 0;
          return (
            <button
              key={eng.id}
              onClick={() => router.push(eng.href)}
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:         11,
                padding:    '9px 12px',
                background: `${eng.accent}${heat > 0.3 ? '18' : '08'}`,
                border:     `1px solid ${eng.accent}${heat > 0.3 ? '38' : '18'}`,
                borderRadius: 10,
                cursor:      'pointer',
                textAlign:  'left',
              }}
            >
              <span style={{ fontSize: 20 }}>{eng.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: eng.accent }}>
                  {eng.name}
                </div>
                <div style={{
                  fontSize:      11,
                  color:         T.dim,
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                }}>
                  {eng.desc}
                </div>
              </div>
              {heat > 0.4 && (
                <div style={{
                  width:        8,
                  height:       8,
                  borderRadius: '50%',
                  background:   eng.accent,
                  boxShadow:   `0 0 6px ${eng.accent}`,
                  flexShrink:   0,
                }} />
              )}
            </button>
          );
        })}
      </div>
    </PanelBox>
  );
}

// -- Shared panel wrapper -----------------------------------------------------

function PanelBox({
  title,
  icon,
  children,
  flex,
}: {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  flex?: number;
}) {
  return (
    <div style={{
      background:    T.panel,
      border:        `1px solid ${T.border}`,
      borderRadius:   T.radius,
      padding:       '16px 18px',
      display:       'flex',
      flexDirection: 'column',
      flex:           flex ?? undefined,
      minWidth:       0,
    }}>
      {title && (
        <div style={{
          display:       'flex',
          alignItems:    'center',
          gap:            6,
          marginBottom:  12,
          color:          T.dim,
          fontSize:       11,
          fontWeight:     600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {icon}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ color: T.faint, fontSize: 12, lineHeight: 1.5 }}>{text}</div>;
}

// -- Command palette ----------------------------------------------------------

function CommandPalette({
  open,
  onClose,
  onWarp,
}: {
  open: boolean;
  onClose: () => void;
  onWarp: (href: string) => void;
}) {
  const [val, setVal] = useState('');

  useEffect(() => { if (!open) setVal(''); }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = ENGIN_LAUNCHPAD.find(entry =>
      entry.id.includes(val.toLowerCase()) ||
      entry.name.toLowerCase().includes(val.toLowerCase()),
    );
    if (match) onWarp(match.href);
    onClose();
  };

  return (
    <div
      style={{
        position:       'fixed',
        inset:           0,
        zIndex:          100,
        display:        'flex',
        alignItems:     'flex-start',
        justifyContent: 'center',
        paddingTop:     '20vh',
        background:     'rgba(0,0,0,0.72)',
        backdropFilter:  'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:   'rgba(4,10,28,0.98)',
          border:       `1px solid ${T.border}`,
          borderRadius:  22,
          padding:      '20px 24px',
          width:        '90%',
          maxWidth:      500,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ color: T.dim, fontSize: 11, marginBottom: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Jump to Engin
        </div>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder="games, music, code, lab, brand, create\u2026"
            style={{
              width:      '100%',
              background: 'transparent',
              border:     'none',
              outline:    'none',
              color:      '#fff',
              fontSize:    18,
              fontWeight:  500,
              boxSizing:  'border-box',
            }}
          />
        </form>
        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ENGIN_LAUNCHPAD.map(e => (
            <button
              key={e.id}
              onClick={() => { onWarp(e.href); onClose(); }}
              style={{
                background:   `${e.accent}1a`,
                border:       `1px solid ${e.accent}38`,
                borderRadius:  10,
                padding:      '5px 13px',
                color:         e.accent,
                fontSize:      12,
                cursor:        'pointer',
                fontWeight:    600,
              }}
            >
              {e.emoji} {e.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// -- Main component -----------------------------------------------------------

export default function DREAMfield() {
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [momentum,    setMomentum]    = useState<MomentumSnapshot | null>(null);
  const [history,     setHistory]     = useState<ForgeHistoryEntry[]>([]);
  const [suggestions, setSuggestions] = useState<ForgeSuggestion[]>([]);
  const [rituals,     setRituals]     = useState<RitualSnapshot | null>(null);
  const [nexus,       setNexus]       = useState<NexusSnapshot | null>(null);
  const [activity,    setActivity]    = useState<ForgeActivityPulse[]>([]);
  const [cmdOpen,     setCmdOpen]     = useState(false);

  const refresh = useCallback(() => {
    const mom  = computeMomentum();
    const hist = readForgeHistory();
    const act  = readForgeActivity();
    const rit  = computeRituals();
    const nex  = computeNexus();

    setMomentum(mom);
    setHistory(hist);
    setActivity(act);
    setRituals(rit);
    setNexus(nex);

    const last = [...act].sort(
      (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
    )[0];
    setSuggestions(generateSuggestions(last ? { enginId: last.enginId, label: last.label } : null));
  }, []);

  useEffect(() => {
    refresh();
    refreshTimer.current = setInterval(refresh, 15_000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [refresh]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !cmdOpen && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setCmdOpen(true);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cmdOpen]);

  const doNav = useCallback((href: string) => { router.push(href); }, [router]);

  const levelColor = momentum
    ? getLevelColor(momentum.level as MomentumLevel)
    : '#64748b';

  return (
    <div style={{
      position:      'fixed',
      inset:          0,
      background:     T.bg,
      overflowY:     'auto',
      display:       'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        position:         'sticky',
        top:               0,
        zIndex:            30,
        display:          'flex',
        alignItems:       'center',
        gap:               12,
        padding:          '12px 20px',
        background:       'rgba(5,7,15,0.82)',
        backdropFilter:   'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom:     '1px solid rgba(255,255,255,0.07)',
        flexShrink:        0,
      }}>
        <Link
          href="/homedream"
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:             6,
            color:          'rgba(160,195,240,0.72)',
            textDecoration: 'none',
            fontSize:        13,
            fontWeight:      600,
            padding:        '5px 12px',
            borderRadius:    20,
            background:     'rgba(255,255,255,0.05)',
            border:         '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <ArrowLeft size={14} />
          Home
        </Link>

        <Zap size={14} style={{ color: levelColor }} />
        <span style={{ color: T.text, fontWeight: 700, fontSize: 16 }}>Forge Analytics</span>
        <span style={{ color: T.dim, fontSize: 12 }}>Creative Intelligence Dashboard</span>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setCmdOpen(true)}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:         5,
            fontSize:    12,
            color:       T.dim,
            background: 'rgba(255,255,255,0.04)',
            border:     '1px solid rgba(255,255,255,0.07)',
            padding:    '5px 13px',
            borderRadius: 14,
            cursor:      'pointer',
          }}
        >
          <Command size={11} />
          <span style={{ fontFamily: 'monospace' }}>/</span>
          Jump
        </button>
      </div>

      {/* Page body */}
      <div style={{
        padding:       '20px',
        display:       'flex',
        flexDirection: 'column',
        gap:            16,
        maxWidth:       1280,
        width:         '100%',
        margin:        '0 auto',
        boxSizing:     'border-box',
      }}>
        {momentum && <MomentumHero mom={momentum} />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ActivityTimeline history={history} />
          <NextSteps suggestions={suggestions} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {rituals && <RitualCards snap={rituals} />}
          {nexus    && <ConnectionMap nexus={nexus} activity={activity} />}
          <QuickLaunch activity={activity} />
        </div>
      </div>

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onWarp={doNav}
      />
    </div>
  );
}
