/**
 * Forge Intelligence — Predictive Next-Step Engine
 *
 * Analyses recent activity history and suggests contextual next workflows.
 * Implements pattern detection: when an action is recorded in engine X,
 * the intelligence layer checks which engines historically follow X and
 * suggests the most likely next step.
 *
 * Architecture justification: docs/ARCHITECTURE.md §1 — Forge is the
 * meta-creation orchestration layer; cross-engine linkage is its purpose.
 * No Supabase writes — local intelligence only (no privacy impact).
 *
 * Performance impact: pure in-memory pattern matching — no network, no render loops.
 */

import {
  CREATIVE_ENGINES,
  ENGIN_REGISTRY,
  FORGE_WORKFLOWS,
  type ForgeWorkflow,
  type EnginEntry,
} from './forgeRegistry';

// ── Activity History ──────────────────────────────────────────────────────────

export interface ForgeHistoryEntry {
  /** Engine id */
  enginId: string;
  /** Human-readable label */
  label: string;
  /** ISO timestamp */
  timestamp: string;
}

const HISTORY_STORAGE_KEY = 'de:forge:history';
const MAX_HISTORY_ENTRIES = 100;

/**
 * Append an entry to the persistent activity history log.
 * Keeps the last MAX_HISTORY_ENTRIES entries to prevent unbounded growth.
 *
 * Note: recordForgeActivity in forgeRegistry.ts also writes to this key inline
 * to avoid circular imports.  This function is the canonical API for direct writes.
 */
export function appendForgeHistory(enginId: string, label: string): void {
  if (typeof window === 'undefined') return;
  try {
    const history = readForgeHistory();
    history.push({ enginId, label, timestamp: new Date().toISOString() });
    // Trim to max size (keep most recent)
    const trimmed = history.slice(-MAX_HISTORY_ENTRIES);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable — silent
  }
}

/**
 * Read the full activity history log.
 */
export function readForgeHistory(): ForgeHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ForgeHistoryEntry[];
  } catch {
    return [];
  }
}

/**
 * Clear all history (for testing / reset).
 */
export function clearForgeHistory(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(HISTORY_STORAGE_KEY); } catch { /* silent */ }
}

// ── Pattern Detection ─────────────────────────────────────────────────────────

/**
 * Transition map: tracks how often engine A is followed by engine B.
 * Key: "fromId→toId", Value: count
 */
function buildTransitionMap(history: ForgeHistoryEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 1; i < history.length; i++) {
    const from = history[i - 1].enginId;
    const to = history[i].enginId;
    if (from === to) continue; // skip same-engine sequential
    const key = `${from}→${to}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

/**
 * Given the most recent engine action, predict which engines the user
 * is likely to use next, based on historical transition patterns.
 */
export function predictNextEngines(
  currentEnginId: string,
  history: ForgeHistoryEntry[],
  limit = 3,
): Array<{ engine: EnginEntry; confidence: number }> {
  const transitions = buildTransitionMap(history);
  const candidates: Array<{ engine: EnginEntry; count: number }> = [];

  for (const engine of CREATIVE_ENGINES) {
    if (engine.id === currentEnginId) continue;
    const key = `${currentEnginId}→${engine.id}`;
    const count = transitions.get(key) ?? 0;
    if (count > 0) {
      candidates.push({ engine, count });
    }
  }

  // Sort by frequency, descending
  candidates.sort((a, b) => b.count - a.count);

  const totalOutgoing = candidates.reduce((s, c) => s + c.count, 0);
  return candidates.slice(0, limit).map(c => ({
    engine: c.engine,
    confidence: totalOutgoing > 0 ? c.count / totalOutgoing : 0,
  }));
}

// ── Contextual Suggestions ────────────────────────────────────────────────────

export interface ForgeSuggestion {
  /** What type of suggestion */
  type: 'workflow' | 'next-engine' | 'transfer';
  /** Display title */
  title: string;
  /** Short reason */
  reason: string;
  /** Accent colour */
  accent: string;
  /** Emoji */
  emoji: string;
  /** Route to navigate to (if applicable) */
  href?: string;
  /** Workflow id (if type is 'workflow') */
  workflowId?: string;
}

/**
 * Given the most recent activity, generate contextual suggestions.
 * Combines:
 *  1. Pattern-based next-engine predictions
 *  2. Workflow recommendations based on current engine
 *  3. Cross-engine transfer suggestions
 */
export function generateSuggestions(
  lastAction: { enginId: string; label: string } | null,
): ForgeSuggestion[] {
  if (!lastAction) return [];
  const { enginId, label } = lastAction;
  const suggestions: ForgeSuggestion[] = [];

  // 1. Match workflows that start with or include the current engine
  const matchingWorkflows = FORGE_WORKFLOWS.filter(
    wf => wf.engines[0] === enginId || wf.engines.includes(enginId),
  );
  for (const wf of matchingWorkflows.slice(0, 2)) {
    const nextIdx = wf.engines.indexOf(enginId);
    const nextEngine = nextIdx >= 0 && nextIdx < wf.engines.length - 1
      ? ENGIN_REGISTRY.find(e => e.id === wf.engines[nextIdx + 1])
      : null;

    suggestions.push({
      type: 'workflow',
      title: wf.title,
      reason: nextEngine
        ? `Continue to ${nextEngine.name} — ${wf.steps[nextIdx + 1] ?? 'next step'}`
        : `Start this workflow from ${ENGIN_REGISTRY.find(e => e.id === enginId)?.name ?? enginId}`,
      accent: wf.accent,
      emoji: wf.emoji,
      href: nextEngine?.daydreamHref,
      workflowId: wf.id,
    });
  }

  // 2. Pattern-based predictions from history
  const history = readForgeHistory();
  const predicted = predictNextEngines(enginId, history, 2);
  for (const { engine, confidence } of predicted) {
    suggestions.push({
      type: 'next-engine',
      title: `Open ${engine.name}`,
      reason: `You often go to ${engine.name} after ${ENGIN_REGISTRY.find(e => e.id === enginId)?.name ?? enginId} (${Math.round(confidence * 100)}% of the time)`,
      accent: engine.accent,
      emoji: engine.emoji,
      href: engine.daydreamHref,
    });
  }

  // 3. Contextual transfer suggestions based on action keywords
  const actionLower = label.toLowerCase();
  if (actionLower.includes('publish') || actionLower.includes('release')) {
    suggestions.push({
      type: 'transfer',
      title: 'Create a post about it',
      reason: 'You just published something — draft a promotional post in ContentEngin',
      accent: '#fb923c',
      emoji: '✨',
      href: '/daydream/create',
    });
  }
  if (actionLower.includes('export') || actionLower.includes('save')) {
    suggestions.push({
      type: 'transfer',
      title: 'Use in another engine',
      reason: 'Your exported asset can be used in other engines via the Forge transfer system',
      accent: '#c8981a',
      emoji: '🔗',
    });
  }
  if (actionLower.includes('beat') || actionLower.includes('track') || actionLower.includes('stem')) {
    suggestions.push({
      type: 'transfer',
      title: 'Wire into GameEngin',
      reason: 'Your audio work can power in-game soundtracks and SFX',
      accent: '#c8981a',
      emoji: '🎮',
      href: '/daydream/games',
    });
  }

  return suggestions;
}

// ── Natural Language Goal Parser ──────────────────────────────────────────────

/**
 * Keyword-to-engine mapping for natural language goal parsing.
 */
const ENGINE_KEYWORDS: Record<string, string[]> = {
  games: ['game', 'play', 'world', 'level', 'character', 'quest', 'adventure', 'rpg', 'platformer', 'build a game', 'multiplayer'],
  music: ['music', 'beat', 'track', 'song', 'mix', 'record', 'audio', 'sound', 'synthesizer', 'melody', 'rhythm', 'album', 'stem'],
  code:  ['code', 'script', 'program', 'develop', 'build', 'deploy', 'notebook', 'debug', 'api', 'algorithm', 'function'],
  lab:   ['experiment', 'simulation', 'data', 'analyse', 'analyze', 'quantum', 'physics', 'visualize', 'chart', 'research', 'hypothesis'],
  brand: ['brand', 'logo', 'identity', 'campaign', 'analytics', 'audience', 'marketing', 'palette', 'promote', 'advertise'],
  create:['content', 'post', 'publish', 'video', 'article', 'blog', 'draft', 'schedule', 'calendar', 'story', 'share'],
};

/**
 * Parse a natural-language goal into a generated workflow.
 * Returns null if no engines match the goal.
 *
 * Example: "Make a short game with music and publish it"
 * → matches: games, music, create
 * → generates steps based on engine capabilities
 */
export function parseGoalToWorkflow(goal: string): ForgeWorkflow | null {
  if (!goal.trim()) return null;

  const goalLower = goal.toLowerCase();
  const matched: Array<{ id: string; score: number }> = [];

  for (const [engineId, keywords] of Object.entries(ENGINE_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (goalLower.includes(kw)) score++;
    }
    if (score > 0) matched.push({ id: engineId, score });
  }

  if (matched.length === 0) return null;

  // Sort by relevance score
  matched.sort((a, b) => b.score - a.score);
  const engineIds = matched.map(m => m.id);

  // Generate steps based on matched engines
  const steps = engineIds.map(eid => {
    const engine = ENGIN_REGISTRY.find(e => e.id === eid);
    if (!engine) return '';
    return `Open ${engine.name} → ${generateStepDescription(eid, goalLower)}`;
  }).filter(Boolean);

  // If "publish" or "share" appears, ensure ContentEngin is last
  if (goalLower.includes('publish') || goalLower.includes('share')) {
    if (!engineIds.includes('create')) {
      engineIds.push('create');
      steps.push('Open ContentEngin → publish and share your creation');
    }
  }

  const primaryEngine = ENGIN_REGISTRY.find(e => e.id === engineIds[0]);

  return {
    id: `goal-${Date.now()}`,
    title: goal.length > 50 ? goal.slice(0, 47) + '…' : goal,
    emoji: primaryEngine?.emoji ?? '🔥',
    accent: primaryEngine?.accent ?? '#ef4444',
    desc: `Auto-generated workflow from your goal`,
    engines: engineIds,
    steps,
  };
}

function generateStepDescription(engineId: string, goal: string): string {
  switch (engineId) {
    case 'games':
      if (goal.includes('level')) return 'design levels in the world builder';
      if (goal.includes('character')) return 'create characters and game assets';
      return 'build and playtest your game world';
    case 'music':
      if (goal.includes('beat')) return 'produce beats in the beat maker';
      if (goal.includes('stem')) return 'isolate and export stems';
      return 'compose and mix your audio';
    case 'code':
      if (goal.includes('api')) return 'build your API endpoints';
      if (goal.includes('script')) return 'write and test scripts';
      return 'write and run your code';
    case 'lab':
      if (goal.includes('data')) return 'analyse your data sets';
      if (goal.includes('simulation')) return 'run and configure simulations';
      return 'run experiments and analyse results';
    case 'brand':
      if (goal.includes('campaign')) return 'set up your marketing campaign';
      if (goal.includes('logo')) return 'design your brand identity';
      return 'configure brand identity and analytics';
    case 'create':
      if (goal.includes('video')) return 'produce and edit video content';
      if (goal.includes('blog') || goal.includes('article')) return 'write and format your article';
      return 'draft and schedule your content';
    default:
      return 'complete this step';
  }
}

// ── Cross-Engine Asset Transfer ───────────────────────────────────────────────

export interface ForgeTransferEntry {
  /** Unique transfer id */
  id: string;
  /** Source engine */
  fromEnginId: string;
  /** Target engine */
  toEnginId: string;
  /** Asset type descriptor */
  assetType: string;
  /** Human-readable label */
  label: string;
  /** ISO timestamp */
  timestamp: string;
  /** Transfer status */
  status: 'pending' | 'complete' | 'failed';
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

const TRANSFER_STORAGE_KEY = 'de:forge:transfers';
const MAX_TRANSFERS = 50;

/**
 * Record a cross-engine asset transfer.
 */
export function recordForgeTransfer(
  fromEnginId: string,
  toEnginId: string,
  assetType: string,
  label: string,
  metadata?: Record<string, unknown>,
): ForgeTransferEntry {
  const entry: ForgeTransferEntry = {
    id: `xfer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fromEnginId,
    toEnginId,
    assetType,
    label,
    timestamp: new Date().toISOString(),
    status: 'complete',
    metadata,
  };

  if (typeof window === 'undefined') return entry;
  try {
    const transfers = readForgeTransfers();
    transfers.push(entry);
    const trimmed = transfers.slice(-MAX_TRANSFERS);
    localStorage.setItem(TRANSFER_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable — silent
  }
  return entry;
}

/**
 * Read all recorded transfers.
 */
export function readForgeTransfers(): ForgeTransferEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRANSFER_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ForgeTransferEntry[];
  } catch {
    return [];
  }
}

/**
 * Clear all transfers (for testing / reset).
 */
export function clearForgeTransfers(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(TRANSFER_STORAGE_KEY); } catch { /* silent */ }
}

// ── User-Created Workflows ────────────────────────────────────────────────────

const CUSTOM_WORKFLOWS_KEY = 'de:forge:custom-workflows';

/**
 * Save a user-created workflow.
 */
export function saveCustomWorkflow(workflow: ForgeWorkflow): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = readCustomWorkflows();
    // Replace if same id exists
    const updated = existing.filter(w => w.id !== workflow.id);
    updated.push(workflow);
    localStorage.setItem(CUSTOM_WORKFLOWS_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable — silent
  }
}

/**
 * Read all user-created workflows.
 */
export function readCustomWorkflows(): ForgeWorkflow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_WORKFLOWS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ForgeWorkflow[];
  } catch {
    return [];
  }
}

/**
 * Delete a user-created workflow by id.
 */
export function deleteCustomWorkflow(workflowId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = readCustomWorkflows();
    const filtered = existing.filter(w => w.id !== workflowId);
    localStorage.setItem(CUSTOM_WORKFLOWS_KEY, JSON.stringify(filtered));
  } catch {
    // localStorage unavailable — silent
  }
}

/**
 * Clear all custom workflows (for testing / reset).
 */
export function clearCustomWorkflows(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(CUSTOM_WORKFLOWS_KEY); } catch { /* silent */ }
}

// ── Workflow Step Tracking & Failure Recovery ─────────────────────────────────

export interface WorkflowStepStatus {
  workflowId: string;
  stepIndex: number;
  status: 'pending' | 'active' | 'complete' | 'failed';
  failureReason?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowRunState {
  workflowId: string;
  steps: WorkflowStepStatus[];
  startedAt: string;
  status: 'running' | 'complete' | 'failed';
}

const WORKFLOW_RUNS_KEY = 'de:forge:workflow-runs';

/**
 * Start a new workflow run, initialising all steps to 'pending'.
 */
export function startWorkflowRun(workflowId: string, stepCount: number): WorkflowRunState {
  const run: WorkflowRunState = {
    workflowId,
    startedAt: new Date().toISOString(),
    status: 'running',
    steps: Array.from({ length: stepCount }, (_, i) => ({
      workflowId,
      stepIndex: i,
      status: i === 0 ? 'active' : 'pending',
      startedAt: i === 0 ? new Date().toISOString() : undefined,
    })),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WORKFLOW_RUNS_KEY, JSON.stringify(run));
    } catch { /* silent */ }
  }
  return run;
}

/**
 * Update a step's status in the active workflow run.
 */
export function updateWorkflowStep(
  stepIndex: number,
  status: 'complete' | 'failed',
  failureReason?: string,
): WorkflowRunState | null {
  const run = getActiveWorkflowRun();
  if (!run) return null;

  const step = run.steps[stepIndex];
  if (!step) return null;

  step.status = status;
  step.completedAt = new Date().toISOString();
  if (failureReason) step.failureReason = failureReason;

  // Activate next step if current completed
  if (status === 'complete' && stepIndex + 1 < run.steps.length) {
    run.steps[stepIndex + 1].status = 'active';
    run.steps[stepIndex + 1].startedAt = new Date().toISOString();
  }

  // Check if all steps are done
  const allDone = run.steps.every(s => s.status === 'complete' || s.status === 'failed');
  if (allDone) {
    run.status = run.steps.some(s => s.status === 'failed') ? 'failed' : 'complete';
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WORKFLOW_RUNS_KEY, JSON.stringify(run));
    } catch { /* silent */ }
  }
  return run;
}

/**
 * Read the active workflow run, if any.
 */
export function getActiveWorkflowRun(): WorkflowRunState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WORKFLOW_RUNS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkflowRunState;
  } catch {
    return null;
  }
}

/**
 * Clear the active workflow run.
 */
export function clearWorkflowRun(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(WORKFLOW_RUNS_KEY); } catch { /* silent */ }
}

/**
 * Generate recovery suggestions for a failed workflow step.
 */
export function getFailureRecovery(
  failedStep: WorkflowStepStatus,
  workflow: ForgeWorkflow,
): ForgeSuggestion[] {
  const suggestions: ForgeSuggestion[] = [];
  const engineId = workflow.engines[failedStep.stepIndex];
  const engine = ENGIN_REGISTRY.find(e => e.id === engineId);

  if (!engine) return suggestions;

  // Suggest retry
  suggestions.push({
    type: 'workflow',
    title: `Retry: ${engine.name}`,
    reason: `Re-open ${engine.name} and try again${failedStep.failureReason ? ` (failed: ${failedStep.failureReason})` : ''}`,
    accent: engine.accent,
    emoji: '🔄',
    href: engine.daydreamHref,
  });

  // Suggest skipping to next step
  if (failedStep.stepIndex < workflow.steps.length - 1) {
    const nextEngine = ENGIN_REGISTRY.find(e => e.id === workflow.engines[failedStep.stepIndex + 1]);
    if (nextEngine) {
      suggestions.push({
        type: 'workflow',
        title: `Skip to ${nextEngine.name}`,
        reason: 'Skip this step and continue with the next engine in the workflow',
        accent: nextEngine.accent,
        emoji: '⏭️',
        href: nextEngine.daydreamHref,
      });
    }
  }

  // Suggest alternative engine for similar capability
  const alternatives = CREATIVE_ENGINES.filter(
    e => e.id !== engineId && e.capabilities.some(
      cap => engine.capabilities.includes(cap),
    ),
  );
  for (const alt of alternatives.slice(0, 1)) {
    suggestions.push({
      type: 'next-engine',
      title: `Try ${alt.name} instead`,
      reason: `${alt.name} shares similar capabilities and may work as an alternative`,
      accent: alt.accent,
      emoji: alt.emoji,
      href: alt.daydreamHref,
    });
  }

  return suggestions;
}
