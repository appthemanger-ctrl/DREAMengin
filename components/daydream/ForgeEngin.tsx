'use client';

/**
 * ForgeEngin — The Meta-Creation Engine
 *
 * A unified launch deck and status matrix for all 6 creative engines.
 * Shows activity pulses, last-opened timestamps, cross-engine linkages,
 * and provides one-tap launch into any engine's Side B.
 *
 * Design: Dark command-center aesthetic. Status cards glow based on
 * activity heat. The grid breathes — hotter engines pulse brighter.
 *
 * Architecture: Follows the same pattern as GameEngin, StarMakerEngin etc.
 * Receives an `onBack` callback to flip back to Side A.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Flame, Zap, Activity, Layers,
  ExternalLink, Clock, BarChart3, Workflow, ChevronRight,
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import {
  CREATIVE_ENGINES,
  ENGIN_REGISTRY,
  FORGE_WORKFLOWS,
  readForgeActivity,
  formatRelativeTime,
  type ForgeActivityPulse,
  type EnginEntry,
  type ForgeWorkflow,
} from '@/lib/forge/forgeRegistry';

// ── Design tokens ─────────────────────────────────────────────────────────────
const FORGE = {
  bg:     '#0a0a0f',
  panel:  'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  text:   'rgba(255,255,255,0.88)',
  dim:    'rgba(255,255,255,0.45)',
  accent: '#ef4444',
  gold:   '#c8981a',
  glow:   'rgba(239,68,68,0.18)',
} as const;

type Props = { onBack: () => void };

export default function ForgeEngin({ onBack }: Props) {
  const [activity, setActivity] = useState<ForgeActivityPulse[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);

  // Refresh activity data every 10s
  useEffect(() => {
    const refresh = () => setActivity(readForgeActivity());
    refresh();
    const timer = setInterval(refresh, 10_000);
    return () => clearInterval(timer);
  }, []);

  const getHeat = useCallback((enginId: string) => {
    return activity.find(a => a.enginId === enginId)?.heat ?? 0;
  }, [activity]);

  const getLastActive = useCallback((enginId: string) => {
    const pulse = activity.find(a => a.enginId === enginId);
    return pulse ? formatRelativeTime(pulse.lastActive) : 'never';
  }, [activity]);

  const totalHeat = activity.reduce((sum, a) => sum + a.heat, 0);
  const activeCount = activity.filter(a => a.heat > 0.1).length;

  return (
    <div style={{ minHeight: '100vh', background: FORGE.bg, color: FORGE.text }}>
      {/* ── Header ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(10,10,15,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${FORGE.border}`,
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button
            type="button"
            onClick={onBack}
            whileTap={{ scale: 0.92 }}
            style={{
              padding: 8,
              marginLeft: -8,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: FORGE.text,
            }}
            aria-label="Back to Forge Daydream"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>

          <Flame className="w-5 h-5" style={{ color: FORGE.accent }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>ForgeEngin</div>
            <div style={{ fontSize: 11, color: FORGE.dim }}>Meta-Creation Engine · Orchestration Layer</div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrandLogo width={24} height={24} alt="DREAMengin" />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 999,
                background: `${FORGE.accent}18`,
                color: FORGE.accent,
                border: `1px solid ${FORGE.accent}35`,
              }}
            >
              Side B
            </span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* ── System Pulse Overview ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: FORGE.accent, marginBottom: 10 }}>
            SYSTEM PULSE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <PulseCard
              icon={<Flame className="w-4 h-4" />}
              label="Total Heat"
              value={totalHeat.toFixed(1)}
              accent={FORGE.accent}
            />
            <PulseCard
              icon={<Activity className="w-4 h-4" />}
              label="Active Engines"
              value={`${activeCount} / ${CREATIVE_ENGINES.length}`}
              accent="#22c55e"
            />
            <PulseCard
              icon={<Layers className="w-4 h-4" />}
              label="Total Engines"
              value={String(ENGIN_REGISTRY.length)}
              accent="#38bdf8"
            />
          </div>
        </div>

        {/* ── Engine Status Matrix ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BarChart3 className="w-4 h-4" style={{ color: FORGE.gold }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: FORGE.text }}>Engine Status Matrix</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {CREATIVE_ENGINES.map(engine => (
              <EngineStatusCard
                key={engine.id}
                engine={engine}
                heat={getHeat(engine.id)}
                lastActive={getLastActive(engine.id)}
                isSelected={selectedEngine === engine.id}
                onSelect={() => setSelectedEngine(selectedEngine === engine.id ? null : engine.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Selected Engine Detail ── */}
        <AnimatePresence mode="wait">
          {selectedEngine && (
            <EngineDetailPanel
              key={selectedEngine}
              engine={CREATIVE_ENGINES.find(e => e.id === selectedEngine)!}
              heat={getHeat(selectedEngine)}
              lastActive={getLastActive(selectedEngine)}
              activity={activity.find(a => a.enginId === selectedEngine)}
            />
          )}
        </AnimatePresence>

        {/* ── Cross-Engine Linkage Map ── */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Zap className="w-4 h-4" style={{ color: '#a855f7' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: FORGE.text }}>Cross-Engine Linkages</span>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {LINKAGES.map(linkage => (
              <div
                key={linkage.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: FORGE.panel,
                  border: `1px solid ${FORGE.border}`,
                }}
              >
                <div style={{ display: 'flex', gap: 4 }}>
                  {linkage.engines.map(eid => {
                    const eng = ENGIN_REGISTRY.find(e => e.id === eid);
                    return eng ? (
                      <span
                        key={eid}
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          background: `${eng.accent}18`, fontSize: 14,
                        }}
                        title={eng.name}
                      >
                        {eng.emoji}
                      </span>
                    ) : null;
                  })}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: FORGE.text }}>{linkage.label}</div>
                  <div style={{ fontSize: 11, color: FORGE.dim }}>{linkage.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Workflow Launcher ── */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Workflow className="w-4 h-4" style={{ color: FORGE.gold }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: FORGE.text }}>Workflow Launcher</span>
            <span style={{
              marginLeft: 'auto',
              fontSize: 10, fontWeight: 700,
              padding: '3px 10px', borderRadius: 999,
              background: `${FORGE.gold}18`, color: FORGE.gold,
              border: `1px solid ${FORGE.gold}30`,
            }}>
              {FORGE_WORKFLOWS.length} workflows
            </span>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {FORGE_WORKFLOWS.map(wf => (
              <WorkflowCard key={wf.id} workflow={wf} />
            ))}
          </div>
        </div>

        {/* ── Activity Timeline ── */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock className="w-4 h-4" style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: FORGE.text }}>Activity Timeline</span>
          </div>
          {activity.length === 0 ? (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              borderRadius: 14,
              background: FORGE.panel,
              border: `1px solid ${FORGE.border}`,
              fontSize: 12,
              color: FORGE.dim,
            }}>
              No activity yet — open any engine to start tracking.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {[...activity]
                .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
                .map(pulse => {
                  const eng = ENGIN_REGISTRY.find(e => e.id === pulse.enginId);
                  if (!eng) return null;
                  return (
                    <div
                      key={pulse.enginId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: FORGE.panel,
                        border: `1px solid ${FORGE.border}`,
                      }}
                    >
                      <span style={{
                        width: 28, height: 28, borderRadius: 8,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: `${eng.accent}18`, fontSize: 14,
                      }}>
                        {eng.emoji}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: eng.accent }}>{eng.name}</div>
                        <div style={{ fontSize: 11, color: FORGE.dim }}>{pulse.label}</div>
                      </div>
                      <div style={{ fontSize: 10, color: FORGE.dim, whiteSpace: 'nowrap' }}>
                        {formatRelativeTime(pulse.lastActive)}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ── Forge Philosophy ── */}
        <div style={{
          marginTop: 24,
          padding: '16px 18px',
          borderRadius: 16,
          background: `linear-gradient(135deg, ${FORGE.accent}0a, ${FORGE.gold}08)`,
          border: `1px solid ${FORGE.accent}20`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: FORGE.accent, marginBottom: 8 }}>
            FORGE PHILOSOPHY
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: FORGE.dim }}>
            Every engine in DREAMengin is a standalone creative tool. The Forge is the meta-layer — 
            it watches them all, shows their pulse, and helps you orchestrate cross-engine workflows.
            The Forge never replaces an engine. It connects them.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PulseCard({ icon, label, value, accent }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 14,
      background: FORGE.panel,
      border: `1px solid ${FORGE.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ color: accent }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: FORGE.dim }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', color: accent }}>{value}</div>
    </div>
  );
}

function EngineStatusCard({ engine, heat, lastActive, isSelected, onSelect }: {
  engine: EnginEntry;
  heat: number;
  lastActive: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const glowIntensity = Math.round(heat * 40);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '16px',
        borderRadius: 16,
        background: FORGE.panel,
        border: `1px solid ${isSelected ? engine.accent + '60' : FORGE.border}`,
        boxShadow: heat > 0.05 ? `0 0 ${glowIntensity}px ${engine.accent}30, inset 0 0 ${glowIntensity}px ${engine.accent}08` : 'none',
        transition: 'border-color 0.2s, box-shadow 0.3s',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: `${engine.accent}18`, fontSize: 18,
        }}>
          {engine.emoji}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: engine.accent }}>{engine.name}</div>
          <div style={{ fontSize: 11, color: FORGE.dim }}>{engine.desc}</div>
        </div>
      </div>

      {/* Heat bar */}
      <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(heat * 100, 2)}%` }}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
          style={{ height: '100%', borderRadius: 2, background: engine.accent }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: FORGE.dim }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock className="w-3 h-3" /> {lastActive}
        </span>
        <span style={{
          padding: '2px 8px',
          borderRadius: 999,
          background: heat > 0.5 ? `${engine.accent}22` : 'rgba(255,255,255,0.04)',
          color: heat > 0.5 ? engine.accent : FORGE.dim,
          fontWeight: 700,
        }}>
          {heat > 0.7 ? '🔥 HOT' : heat > 0.3 ? '◉ WARM' : heat > 0.05 ? '○ COOL' : '◌ IDLE'}
        </span>
      </div>
    </motion.button>
  );
}

function EngineDetailPanel({ engine, heat, lastActive, activity }: {
  engine: EnginEntry;
  heat: number;
  lastActive: string;
  activity?: ForgeActivityPulse;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      style={{
        padding: '20px',
        borderRadius: 18,
        background: `linear-gradient(135deg, ${engine.accent}08, ${FORGE.panel})`,
        border: `1px solid ${engine.accent}30`,
        marginBottom: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span style={{
          width: 44, height: 44, borderRadius: 12,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: `${engine.accent}18`, fontSize: 22,
        }}>
          {engine.emoji}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: engine.accent }}>{engine.name}</div>
          <div style={{ fontSize: 12, color: FORGE.dim }}>{engine.desc}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${FORGE.border}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: FORGE.dim }}>Heat</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: engine.accent, marginTop: 4 }}>{(heat * 100).toFixed(0)}%</div>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${FORGE.border}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: FORGE.dim }}>Last Active</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: FORGE.text, marginTop: 6 }}>{lastActive}</div>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${FORGE.border}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: FORGE.dim }}>Last Action</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: FORGE.text, marginTop: 6 }}>{activity?.label ?? '—'}</div>
        </div>
      </div>

      {/* Capabilities */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {engine.capabilities.map(cap => (
          <span
            key={cap}
            style={{
              fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
              background: `${engine.accent}12`, color: `${engine.accent}cc`, border: `1px solid ${engine.accent}20`,
            }}
          >
            {cap}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Link
          href={engine.daydreamHref}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 999,
            background: engine.accent, color: '#fff',
            fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}
        >
          Open Daydream <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <Link
          href={engine.enginHref}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 999,
            background: 'rgba(255,255,255,0.08)', color: FORGE.text,
            fontSize: 12, fontWeight: 700, textDecoration: 'none',
            border: `1px solid ${FORGE.border}`,
          }}
        >
          Open Engin <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

// ── Cross-Engine Linkages ─────────────────────────────────────────────────────

const LINKAGES = [
  {
    engines: ['music', 'games'] as const,
    label: 'Audio → GameEngin',
    desc: 'StarMaker beats and synth patches can power in-game soundtracks and SFX.',
  },
  {
    engines: ['code', 'games'] as const,
    label: 'Code → GameEngin',
    desc: 'CodeEngin scripts can define game logic, AI behaviour, and procedural levels.',
  },
  {
    engines: ['brand', 'create'] as const,
    label: 'Brand → Content',
    desc: 'BrandingEngin identity feeds directly into ContentEngin publishing templates.',
  },
  {
    engines: ['lab', 'code'] as const,
    label: 'Lab → Code',
    desc: 'LabEngin experiments export data pipelines that CodeEngin can consume.',
  },
  {
    engines: ['music', 'create'] as const,
    label: 'Music → Content',
    desc: 'StarMaker stems and mixes embed directly into ContentEngin posts.',
  },
] as const;

// ── Workflow Card ─────────────────────────────────────────────────────────────

function WorkflowCard({ workflow }: { workflow: ForgeWorkflow }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        borderRadius: 16,
        background: FORGE.panel,
        border: `1px solid ${workflow.accent}20`,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
        }}
      >
        <span style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: `${workflow.accent}18`, fontSize: 18,
        }}>
          {workflow.emoji}
        </span>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: workflow.accent }}>{workflow.title}</div>
          <div style={{ fontSize: 11, color: FORGE.dim }}>{workflow.desc}</div>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {workflow.engines.map(eid => {
            const eng = ENGIN_REGISTRY.find(e => e.id === eid);
            return eng ? (
              <span key={eid} style={{
                width: 22, height: 22, borderRadius: 6,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: `${eng.accent}18`, fontSize: 11,
              }} title={eng.name}>
                {eng.emoji}
              </span>
            ) : null;
          })}
        </div>
        <ChevronRight
          className="w-4 h-4"
          style={{
            color: FORGE.dim,
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', display: 'grid', gap: 8 }}>
              {workflow.steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${FORGE.border}`,
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: 999,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: `${workflow.accent}18`, color: workflow.accent,
                    fontSize: 10, fontWeight: 800, flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 12, lineHeight: 1.6, color: FORGE.dim }}>{step}</span>
                </div>
              ))}

              {/* Launch first engine */}
              <Link
                href={ENGIN_REGISTRY.find(e => e.id === workflow.engines[0])?.daydreamHref ?? '/daydream/forge'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 18px', borderRadius: 999, marginTop: 4,
                  background: workflow.accent, color: '#fff',
                  fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  alignSelf: 'flex-start',
                }}
              >
                Start Workflow <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
