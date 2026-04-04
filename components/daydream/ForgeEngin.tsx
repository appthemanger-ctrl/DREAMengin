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

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Flame, Zap, Activity, Layers,
  ExternalLink, Clock, BarChart3, Workflow, ChevronRight,
  Brain, ArrowRightLeft, Sparkles, Plus, Trash2, AlertTriangle,
  CheckCircle2, XCircle, SkipForward, RefreshCw, Wand2,
  Save, X,
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { bridge, type DualRuntimeChannel } from '@/lib/runtime/dualRuntimeBridge';
import { useForgeActivity } from '@/lib/forge/useForgeActivity';
import JourneyTrail from '@/components/daydream/JourneyTrail';
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
import {
  generateSuggestions,
  readForgeHistory,
  readForgeTransfers,
  readCustomWorkflows,
  saveCustomWorkflow,
  deleteCustomWorkflow,
  parseGoalToWorkflow,
  getActiveWorkflowRun,
  startWorkflowRun,
  updateWorkflowStep,
  clearWorkflowRun,
  getFailureRecovery,
  type ForgeSuggestion,
  type ForgeHistoryEntry,
  type ForgeTransferEntry,
  type WorkflowRunState,
} from '@/lib/forge/forgeIntelligence';

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

// ── Pulse Monitor — channel color-coding for cross-engine event feed ──────────
const CHANNEL_COLORS: Record<string, string> = {
  music: '#ec4899', games: '#22c55e', lab: '#8b5cf6',
  code: '#38bdf8', brand: '#f59e0b', create: '#6366f1',
};

// All typed events per channel — used for exhaustive bridge subscription.
// ForgeEngin is the meta-layer; it watches every event on every channel.
const ALL_CHANNEL_EVENTS: Record<DualRuntimeChannel, string[]> = {
  music:  ['music:track-released', 'music:bpm-changed', 'music:stem-ready', 'music:upload-complete'],
  games:  ['games:score-submitted', 'games:session-started', 'games:session-ended', 'games:achievement-unlocked', 'games:asset-exported'],
  lab:    ['lab:result-ready', 'lab:simulation-started', 'lab:simulation-complete', 'lab:quantum-measured', 'lab:data-exported'],
  code:   ['code:cell-executed', 'code:deploy-to-game', 'code:build-success', 'code:build-failed', 'code:notebook-exported'],
  brand:  ['brand:campaign-launched', 'brand:campaign-paused', 'brand:asset-updated', 'brand:analytics-snapshot', 'brand:segment-created'],
  create: ['create:draft-saved', 'create:published', 'create:export-asset', 'create:queue-updated', 'create:calendar-event'],
};

interface BridgeEvent {
  channel: string;
  event: string;
  timestamp: number;
}

type Props = { onBack: () => void };

export default function ForgeEngin({ onBack }: Props) {
  const [activity, setActivity] = useState<ForgeActivityPulse[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ForgeSuggestion[]>([]);
  const [history, setHistory] = useState<ForgeHistoryEntry[]>([]);
  const [transfers, setTransfers] = useState<ForgeTransferEntry[]>([]);
  const [customWorkflows, setCustomWorkflows] = useState<ForgeWorkflow[]>([]);
  const [workflowRun, setWorkflowRun] = useState<WorkflowRunState | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [generatedWorkflow, setGeneratedWorkflow] = useState<ForgeWorkflow | null>(null);
  const [bridgeEvents, setBridgeEvents] = useState<BridgeEvent[]>([]);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [builderEngines, setBuilderEngines] = useState<string[]>([]);
  const [builderTitle, setBuilderTitle] = useState('');

  // Forge activity pulse — record when this engine is used
  const forge = useForgeActivity({ enginId: 'forge' });

  // Subscribe to ALL 6 channels for the live Pulse Monitor event feed.
  // Uses a cast because ForgeEngin is the meta-layer that monitors every channel
  // generically — it doesn't need the typed payloads, only channel + event name.
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const castSubscribe = bridge.subscribe as unknown as (
      ch: string, ev: string, handler: (payload: unknown) => void,
    ) => () => void;

    for (const [channel, events] of Object.entries(ALL_CHANNEL_EVENTS)) {
      for (const event of events) {
        unsubs.push(
          castSubscribe(channel, event, () => {
            setBridgeEvents(prev => {
              const next = [{ channel, event, timestamp: Date.now() }, ...prev];
              return next.slice(0, 20); // keep last 20
            });
          }),
        );
      }
    }

    return () => { unsubs.forEach(fn => fn()); };
  }, []);

  // Refresh all forge data every 10s
  useEffect(() => {
    const refresh = () => {
      const act = readForgeActivity();
      setActivity(act);
      setHistory(readForgeHistory());
      setTransfers(readForgeTransfers());
      setCustomWorkflows(readCustomWorkflows());
      setWorkflowRun(getActiveWorkflowRun());

      // Generate suggestions from last activity
      const sorted = [...act].sort((a, b) =>
        new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
      );
      const last = sorted[0];
      if (last) {
        setSuggestions(generateSuggestions({ enginId: last.enginId, label: last.label }));
      }
    };
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

  // All workflows = built-in + custom
  const allWorkflows = useMemo(() => [...FORGE_WORKFLOWS, ...customWorkflows], [customWorkflows]);

  // Goal → workflow handler
  const handleGoalSubmit = useCallback(() => {
    if (!goalInput.trim()) return;
    const wf = parseGoalToWorkflow(goalInput);
    setGeneratedWorkflow(wf);
    forge.record('Generated workflow suggestion');
  }, [goalInput, forge]);

  // Save generated or custom workflow
  const handleSaveWorkflow = useCallback((wf: ForgeWorkflow) => {
    saveCustomWorkflow(wf);
    setCustomWorkflows(readCustomWorkflows());
    setGeneratedWorkflow(null);
    setGoalInput('');
  }, []);

  // Delete custom workflow
  const handleDeleteWorkflow = useCallback((id: string) => {
    deleteCustomWorkflow(id);
    setCustomWorkflows(readCustomWorkflows());
  }, []);

  // Start a workflow run
  const handleStartRun = useCallback((wf: ForgeWorkflow) => {
    const run = startWorkflowRun(wf.id, wf.steps.length);
    setWorkflowRun(run);
    forge.record('Started workflow run');
  }, [forge]);

  // Complete a workflow step
  const handleCompleteStep = useCallback((stepIndex: number) => {
    const run = updateWorkflowStep(stepIndex, 'complete');
    setWorkflowRun(run);
    forge.record('Completed workflow step');

    // Emit to the relevant engine's channel when a step completes.
    // Map step index → engine id from the active workflow, then emit
    // on that channel. Uses cast because 'forge' is not a typed channel.
    if (run) {
      const wf = allWorkflows.find(w => w.id === run.workflowId);
      const engineId = wf?.engines[stepIndex];
      if (engineId) {
        const validChannels: string[] = ['music', 'games', 'lab', 'code', 'brand', 'create'];
        if (validChannels.includes(engineId)) {
          (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
            engineId,
            `${engineId}:forge-step-complete`,
            { workflowId: run.workflowId, stepIndex, engineId },
          );
        }
      }
    }
  }, [forge, allWorkflows]);

  // Fail a workflow step
  const handleFailStep = useCallback((stepIndex: number) => {
    const run = updateWorkflowStep(stepIndex, 'failed', 'Manual failure report');
    setWorkflowRun(run);
  }, []);

  // Dismiss workflow run
  const handleDismissRun = useCallback(() => {
    clearWorkflowRun();
    setWorkflowRun(null);
  }, []);

  // Custom workflow builder
  const handleSaveCustom = useCallback(() => {
    if (!builderTitle.trim() || builderEngines.length === 0) return;
    const wf: ForgeWorkflow = {
      id: `custom-${Date.now()}`,
      title: builderTitle,
      emoji: '⚡',
      accent: ENGIN_REGISTRY.find(e => e.id === builderEngines[0])?.accent ?? '#ef4444',
      desc: 'Custom workflow created in Forge',
      engines: builderEngines,
      steps: builderEngines.map(eid => {
        const eng = ENGIN_REGISTRY.find(e => e.id === eid);
        return `Open ${eng?.name ?? eid} → complete your work`;
      }),
    };
    saveCustomWorkflow(wf);
    setCustomWorkflows(readCustomWorkflows());
    setShowWorkflowBuilder(false);
    setBuilderTitle('');
    setBuilderEngines([]);
  }, [builderTitle, builderEngines]);

  const toggleBuilderEngine = useCallback((eid: string) => {
    setBuilderEngines(prev =>
      prev.includes(eid) ? prev.filter(e => e !== eid) : [...prev, eid],
    );
  }, []);

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

        {/* ── 🧠 Predictive Suggestions (Intelligence Layer) ── */}
        {suggestions.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Brain className="w-4 h-4" style={{ color: '#a855f7' }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: FORGE.text }}>Forge Intelligence</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: 10, fontWeight: 700,
                padding: '3px 10px', borderRadius: 999,
                background: '#a855f718', color: '#a855f7',
                border: '1px solid #a855f730',
              }}>
                {suggestions.length} suggestions
              </span>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {suggestions.slice(0, 4).map((sug, i) => (
                <SuggestionCard key={`${sug.type}-${i}`} suggestion={sug} />
              ))}
            </div>
          </div>
        )}

        {/* ── 🎯 Natural Language Goal Input ── */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Wand2 className="w-4 h-4" style={{ color: '#22d3ee' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: FORGE.text }}>Describe Your Goal</span>
          </div>
          <div style={{
            padding: '16px',
            borderRadius: 16,
            background: FORGE.panel,
            border: `1px solid ${FORGE.border}`,
          }}>
            <div style={{ fontSize: 11, color: FORGE.dim, marginBottom: 10 }}>
              Tell the Forge what you want to create and it will generate a workflow for you.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGoalSubmit()}
                placeholder="e.g. Make a game with music and publish it"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${FORGE.border}`,
                  color: FORGE.text,
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleGoalSubmit}
                disabled={!goalInput.trim()}
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: goalInput.trim() ? '#22d3ee' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: goalInput.trim() ? '#fff' : FORGE.dim,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: goalInput.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" /> Generate
              </button>
            </div>

            {/* Generated workflow preview */}
            <AnimatePresence>
              {generatedWorkflow && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden', marginTop: 12 }}
                >
                  <div style={{
                    padding: '14px',
                    borderRadius: 14,
                    background: `${generatedWorkflow.accent}08`,
                    border: `1px solid ${generatedWorkflow.accent}25`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>{generatedWorkflow.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: generatedWorkflow.accent }}>
                          {generatedWorkflow.title}
                        </div>
                        <div style={{ fontSize: 11, color: FORGE.dim }}>AI-generated workflow</div>
                      </div>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {generatedWorkflow.engines.map(eid => {
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
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {generatedWorkflow.steps.map((step, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 10px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${FORGE.border}`,
                          fontSize: 12, color: FORGE.dim,
                        }}>
                          <span style={{
                            width: 20, height: 20, borderRadius: 999,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: `${generatedWorkflow.accent}18`, color: generatedWorkflow.accent,
                            fontSize: 10, fontWeight: 800, flexShrink: 0,
                          }}>
                            {i + 1}
                          </span>
                          {step}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => handleSaveWorkflow(generatedWorkflow)}
                        style={{
                          padding: '8px 16px', borderRadius: 999,
                          background: generatedWorkflow.accent, color: '#fff',
                          border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <Save className="w-3.5 h-3.5" /> Save Workflow
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartRun(generatedWorkflow)}
                        style={{
                          padding: '8px 16px', borderRadius: 999,
                          background: 'rgba(255,255,255,0.08)', color: FORGE.text,
                          border: `1px solid ${FORGE.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Start Now
                      </button>
                      <button
                        type="button"
                        onClick={() => setGeneratedWorkflow(null)}
                        style={{
                          padding: '8px 12px', borderRadius: 999,
                          background: 'transparent', color: FORGE.dim,
                          border: 'none', fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── 🔄 Active Workflow Run (step tracker + failure recovery) ── */}
        {workflowRun && (
          <ActiveWorkflowPanel
            run={workflowRun}
            allWorkflows={allWorkflows}
            onCompleteStep={handleCompleteStep}
            onFailStep={handleFailStep}
            onDismiss={handleDismissRun}
          />
        )}

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

        {/* ── Workflow Launcher (built-in + custom + builder) ── */}
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
              {allWorkflows.length} workflows
            </span>
          </div>

          {/* Built-in workflows */}
          <div style={{ display: 'grid', gap: 10 }}>
            {FORGE_WORKFLOWS.map(wf => (
              <WorkflowCard key={wf.id} workflow={wf} onStart={() => handleStartRun(wf)} />
            ))}
          </div>

          {/* Custom workflows */}
          {customWorkflows.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: FORGE.dim, marginBottom: 8 }}>
                YOUR CUSTOM WORKFLOWS
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {customWorkflows.map(wf => (
                  <WorkflowCard
                    key={wf.id}
                    workflow={wf}
                    onStart={() => handleStartRun(wf)}
                    onDelete={() => handleDeleteWorkflow(wf.id)}
                    isCustom
                  />
                ))}
              </div>
            </div>
          )}

          {/* Workflow builder toggle */}
          <button
            type="button"
            onClick={() => setShowWorkflowBuilder(!showWorkflowBuilder)}
            style={{
              marginTop: 12,
              padding: '10px 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${FORGE.border}`,
              color: FORGE.dim,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Create Custom Workflow
          </button>

          {/* Workflow builder */}
          <AnimatePresence>
            {showWorkflowBuilder && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  marginTop: 10,
                  padding: '16px',
                  borderRadius: 16,
                  background: FORGE.panel,
                  border: `1px solid ${FORGE.accent}25`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: FORGE.text, marginBottom: 10 }}>
                    Build a Custom Workflow
                  </div>
                  <input
                    type="text"
                    value={builderTitle}
                    onChange={e => setBuilderTitle(e.target.value)}
                    placeholder="Workflow name"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.06)',
                      border: `1px solid ${FORGE.border}`,
                      color: FORGE.text,
                      fontSize: 13,
                      outline: 'none',
                      marginBottom: 10,
                    }}
                  />
                  <div style={{ fontSize: 11, color: FORGE.dim, marginBottom: 8 }}>
                    Select engines in order:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {CREATIVE_ENGINES.map(eng => {
                      const selected = builderEngines.includes(eng.id);
                      const order = builderEngines.indexOf(eng.id) + 1;
                      return (
                        <button
                          key={eng.id}
                          type="button"
                          onClick={() => toggleBuilderEngine(eng.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 10,
                            background: selected ? `${eng.accent}22` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${selected ? eng.accent + '50' : FORGE.border}`,
                            color: selected ? eng.accent : FORGE.dim,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span>{eng.emoji}</span>
                          <span>{eng.name}</span>
                          {selected && <span style={{ fontSize: 10, opacity: 0.7 }}>#{order}</span>}
                        </button>
                      );
                    })}
                  </div>
                  {builderEngines.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginBottom: 12, fontSize: 11, color: FORGE.dim }}>
                      Flow: {builderEngines.map((eid, i) => {
                        const eng = ENGIN_REGISTRY.find(e => e.id === eid);
                        return (
                          <span key={eid}>
                            {eng?.emoji}{i < builderEngines.length - 1 ? ' → ' : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleSaveCustom}
                      disabled={!builderTitle.trim() || builderEngines.length === 0}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 999,
                        background: builderTitle.trim() && builderEngines.length > 0 ? FORGE.accent : 'rgba(255,255,255,0.06)',
                        border: 'none',
                        color: builderTitle.trim() && builderEngines.length > 0 ? '#fff' : FORGE.dim,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: builderTitle.trim() && builderEngines.length > 0 ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Save className="w-3.5 h-3.5" /> Save Workflow
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowWorkflowBuilder(false); setBuilderTitle(''); setBuilderEngines([]); }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        background: 'transparent',
                        border: 'none',
                        color: FORGE.dim,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Transfer Log ── */}
        {transfers.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ArrowRightLeft className="w-4 h-4" style={{ color: '#fb923c' }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: FORGE.text }}>Cross-Engine Transfers</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: 10, fontWeight: 700,
                padding: '3px 10px', borderRadius: 999,
                background: '#fb923c18', color: '#fb923c',
                border: '1px solid #fb923c30',
              }}>
                {transfers.length} transfers
              </span>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {[...transfers].reverse().slice(0, 5).map(t => {
                const from = ENGIN_REGISTRY.find(e => e.id === t.fromEnginId);
                const to = ENGIN_REGISTRY.find(e => e.id === t.toEnginId);
                return (
                  <div
                    key={t.id}
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
                    <span style={{ fontSize: 14 }}>{from?.emoji ?? '?'}</span>
                    <span style={{ fontSize: 11, color: FORGE.dim }}>→</span>
                    <span style={{ fontSize: 14 }}>{to?.emoji ?? '?'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: FORGE.text }}>{t.label}</div>
                      <div style={{ fontSize: 10, color: FORGE.dim }}>{t.assetType}</div>
                    </div>
                    <div style={{ fontSize: 10, color: FORGE.dim, whiteSpace: 'nowrap' }}>
                      {formatRelativeTime(t.timestamp)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Activity Timeline (full history) ── */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock className="w-4 h-4" style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: FORGE.text }}>Activity Timeline</span>
            {history.length > 0 && (
              <span style={{
                marginLeft: 'auto',
                fontSize: 10, fontWeight: 700,
                padding: '3px 10px', borderRadius: 999,
                background: '#38bdf818', color: '#38bdf8',
                border: '1px solid #38bdf830',
              }}>
                {history.length} actions
              </span>
            )}
          </div>
          {history.length === 0 ? (
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
              {[...history]
                .reverse()
                .slice(0, 15)
                .map((entry, i) => {
                  const eng = ENGIN_REGISTRY.find(e => e.id === entry.enginId);
                  if (!eng) return null;
                  return (
                    <div
                      key={`${entry.timestamp}-${i}`}
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
                        <div style={{ fontSize: 11, color: FORGE.dim }}>{entry.label}</div>
                      </div>
                      <div style={{ fontSize: 10, color: FORGE.dim, whiteSpace: 'nowrap' }}>
                        {formatRelativeTime(entry.timestamp)}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ── Pulse Monitor — Live Cross-Engine Event Feed ── */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Zap className="w-4 h-4" style={{ color: '#22d3ee' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: FORGE.text }}>Pulse Monitor</span>
            <span style={{
              marginLeft: 'auto',
              fontSize: 10, fontWeight: 700,
              padding: '3px 10px', borderRadius: 999,
              background: 'rgba(34,211,238,0.1)', color: '#22d3ee',
              border: '1px solid rgba(34,211,238,0.2)',
            }}>
              {bridgeEvents.length} events
            </span>
          </div>
          {bridgeEvents.length === 0 ? (
            <div style={{
              padding: '16px',
              borderRadius: 14,
              background: FORGE.panel,
              border: `1px solid ${FORGE.border}`,
              fontSize: 12,
              color: FORGE.dim,
              textAlign: 'center',
            }}>
              Listening on all 6 channels… no cross-engine events yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 4 }}>
              {bridgeEvents.map((ev, i) => {
                const color = CHANNEL_COLORS[ev.channel] ?? FORGE.dim;
                const shortEvent = ev.event.replace(`${ev.channel}:`, '');
                const ago = Math.max(0, Math.round((Date.now() - ev.timestamp) / 1000));
                const agoLabel = ago < 60 ? `${ago}s ago` : `${Math.round(ago / 60)}m ago`;
                return (
                  <div
                    key={`${ev.timestamp}-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: FORGE.panel,
                      border: `1px solid ${FORGE.border}`,
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: color, flexShrink: 0,
                      boxShadow: `0 0 6px ${color}60`,
                    }} />
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                      letterSpacing: '0.08em', color, minWidth: 48,
                    }}>
                      {ev.channel}
                    </span>
                    <span style={{ fontSize: 11, color: FORGE.text, flex: 1 }}>
                      {shortEvent}
                    </span>
                    <span style={{ fontSize: 10, color: FORGE.dim, whiteSpace: 'nowrap' }}>
                      {agoLabel}
                    </span>
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

        {/* ── Journey Trail ── */}
        <div style={{ marginTop: 24 }}>
          <JourneyTrail compact />
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

// ── Suggestion Card ───────────────────────────────────────────────────────────

function SuggestionCard({ suggestion }: { suggestion: ForgeSuggestion }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 14,
        background: `${suggestion.accent}06`,
        border: `1px solid ${suggestion.accent}20`,
      }}
    >
      <span style={{
        width: 32, height: 32, borderRadius: 8,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: `${suggestion.accent}18`, fontSize: 16,
      }}>
        {suggestion.emoji}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: suggestion.accent }}>{suggestion.title}</div>
        <div style={{ fontSize: 11, color: FORGE.dim, lineHeight: 1.5 }}>{suggestion.reason}</div>
      </div>
      {suggestion.href && (
        <Link
          href={suggestion.href}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: suggestion.accent,
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Go →
        </Link>
      )}
    </div>
  );
}

// ── Active Workflow Panel ─────────────────────────────────────────────────────

function ActiveWorkflowPanel({ run, allWorkflows, onCompleteStep, onFailStep, onDismiss }: {
  run: WorkflowRunState;
  allWorkflows: readonly ForgeWorkflow[];
  onCompleteStep: (i: number) => void;
  onFailStep: (i: number) => void;
  onDismiss: () => void;
}) {
  const workflow = allWorkflows.find(w => w.id === run.workflowId);
  if (!workflow) return null;

  const failedStep = run.steps.find(s => s.status === 'failed');
  const recoverySuggestions = failedStep ? getFailureRecovery(failedStep, workflow) : [];

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <RefreshCw className="w-4 h-4" style={{ color: '#22c55e' }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: FORGE.text }}>Active Workflow</span>
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: '3px 10px', borderRadius: 999,
          background: run.status === 'running' ? '#22c55e18' : run.status === 'failed' ? '#ef444418' : '#38bdf818',
          color: run.status === 'running' ? '#22c55e' : run.status === 'failed' ? '#ef4444' : '#38bdf8',
          border: `1px solid ${run.status === 'running' ? '#22c55e30' : run.status === 'failed' ? '#ef444430' : '#38bdf830'}`,
        }}>
          {run.status}
        </span>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            marginLeft: 'auto',
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(255,255,255,0.06)', border: 'none',
            color: FORGE.dim, fontSize: 10, cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
      <div style={{
        padding: '16px',
        borderRadius: 16,
        background: `${workflow.accent}06`,
        border: `1px solid ${workflow.accent}20`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>{workflow.emoji}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: workflow.accent }}>{workflow.title}</span>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {run.steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                background: step.status === 'complete' ? 'rgba(34,197,94,0.06)'
                  : step.status === 'failed' ? 'rgba(239,68,68,0.06)'
                  : step.status === 'active' ? 'rgba(56,189,248,0.06)'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${
                  step.status === 'complete' ? 'rgba(34,197,94,0.2)'
                  : step.status === 'failed' ? 'rgba(239,68,68,0.2)'
                  : step.status === 'active' ? 'rgba(56,189,248,0.2)'
                  : FORGE.border
                }`,
              }}
            >
              <span style={{ flexShrink: 0 }}>
                {step.status === 'complete' && <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />}
                {step.status === 'failed' && <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />}
                {step.status === 'active' && <Activity className="w-4 h-4" style={{ color: '#38bdf8' }} />}
                {step.status === 'pending' && (
                  <span style={{
                    width: 16, height: 16, borderRadius: 999,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.08)', fontSize: 9, fontWeight: 800, color: FORGE.dim,
                  }}>
                    {i + 1}
                  </span>
                )}
              </span>
              <span style={{
                flex: 1,
                fontSize: 12,
                color: step.status === 'pending' ? FORGE.dim : FORGE.text,
                textDecoration: step.status === 'complete' ? 'line-through' : 'none',
                opacity: step.status === 'pending' ? 0.5 : 1,
              }}>
                {workflow.steps[i] ?? `Step ${i + 1}`}
              </span>
              {step.status === 'active' && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => onCompleteStep(i)}
                    style={{
                      padding: '4px 10px', borderRadius: 999,
                      background: '#22c55e', border: 'none',
                      color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    ✓ Done
                  </button>
                  <button
                    type="button"
                    onClick={() => onFailStep(i)}
                    style={{
                      padding: '4px 10px', borderRadius: 999,
                      background: 'rgba(239,68,68,0.2)', border: 'none',
                      color: '#ef4444', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    ✗ Failed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Failure recovery suggestions */}
        {recoverySuggestions.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b' }}>Recovery Options</span>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {recoverySuggestions.map((sug, i) => (
                <SuggestionCard key={i} suggestion={sug} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Workflow Card ─────────────────────────────────────────────────────────────

function WorkflowCard({ workflow, onStart, onDelete, isCustom }: {
  workflow: ForgeWorkflow;
  onStart?: () => void;
  onDelete?: () => void;
  isCustom?: boolean;
}) {
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
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Link
                  href={ENGIN_REGISTRY.find(e => e.id === workflow.engines[0])?.daydreamHref ?? '/daydream/forge'}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 18px', borderRadius: 999,
                    background: workflow.accent, color: '#fff',
                    fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  Start Workflow <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                {onStart && (
                  <button
                    type="button"
                    onClick={onStart}
                    style={{
                      padding: '10px 16px', borderRadius: 999,
                      background: 'rgba(255,255,255,0.08)',
                      border: `1px solid ${FORGE.border}`, color: FORGE.text,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Track Run
                  </button>
                )}
                {isCustom && onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    style={{
                      padding: '10px 12px', borderRadius: 999,
                      background: 'rgba(239,68,68,0.1)',
                      border: 'none', color: '#ef4444',
                      fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
