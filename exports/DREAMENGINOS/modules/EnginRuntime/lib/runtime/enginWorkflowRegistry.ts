/**
 * lib/runtime/enginWorkflowRegistry.ts
 *
 * Cross-Engin Workflow Registry
 *
 * Every meaningful drag through the seam bar maps to one or more entries here.
 * Each WorkflowDefinition declares EXACTLY:
 *   - which Engin pair it connects (from / to)
 *   - which bridge channel fires and what event name
 *   - an execute() that calls bridge.emitDurable so the target Engin receives
 *     the payload even if it comes online after the drag.
 *
 * No UI concerns live here — this is pure data routing.
 *
 * Architecture: lib/runtime/dualRuntimeBridge.ts — 6-channel virtual bus.
 * Circular import rule: this file imports ONLY bridge. It must never import
 * seamClipboard.ts or dreamOSBus.ts (those import this file).
 * Privacy: only IDs / primitives cross Engin boundaries (AXIOM 4).
 */

import { bridge } from '@/lib/runtime/dualRuntimeBridge';

// ── Engin key type ─────────────────────────────────────────────────────────────

export const ENGIN_KEYS = [
  'starmaker',
  'game',
  'code',
  'lab',
  'brand',
  'content',
  'forge',
] as const;

export type EnginKey = (typeof ENGIN_KEYS)[number];

// ── Artifact type ──────────────────────────────────────────────────────────────

export type WorkflowArtifactType =
  | 'stem'
  | 'track'
  | 'script'
  | 'notebook'
  | '3d-asset'
  | 'clip'
  | 'dataset'
  | 'post'
  | 'brand-kit'
  | 'any';

// ── Workflow definition ────────────────────────────────────────────────────────

export interface WorkflowDefinition {
  /** Unique workflow identifier — used for targeted execution and UI labelling. */
  id: string;
  /** Source Engin key. */
  from: EnginKey;
  /** Target Engin key. */
  to: EnginKey;
  /** Short human-readable name shown in seam UI. */
  label: string;
  /** What actually happens when this workflow fires. */
  description: string;
  /** Artifact types that trigger this workflow. */
  artifactTypes: readonly WorkflowArtifactType[];
  /** Bridge channel the event fires on (e.g. 'lab', 'games', 'music'). */
  bridgeChannel: string;
  /** Exact event name emitted on the bridge (e.g. 'lab:stem-visualization-requested'). */
  bridgeEvent: string;
  /**
   * Execute the workflow by firing bridge.emitDurable on the target channel.
   * The durable queue ensures delivery even if the target Engin is offline.
   */
  execute(payload: Record<string, unknown>): void;
}

// ── Helper: factory for workflow definitions ───────────────────────────────────

function defineWorkflow(
  spec: Omit<WorkflowDefinition, 'execute'>,
): WorkflowDefinition {
  return {
    ...spec,
    execute(payload: Record<string, unknown>): void {
      bridge.emitDurable(spec.bridgeChannel, spec.bridgeEvent, payload);
    },
  };
}

// ── Registry ───────────────────────────────────────────────────────────────────

const WORKFLOWS: readonly WorkflowDefinition[] = [

  // ── StarMakerEngin → LabEngin ────────────────────────────────────────────────
  defineWorkflow({
    id: 'starmaker-to-lab:stem-analyze',
    from: 'starmaker',
    to: 'lab',
    label: 'Analyze stem in LabEngin',
    description:
      'Sends a stem (voice, guitar, drums, bass) to LabEngin for 3D ' +
      'frequency/wavelength visualization. LabEngin decomposes the stem into ' +
      'frequency bands in 3D space. Tap+hold any band to sample that isolated sound.',
    artifactTypes: ['stem'],
    bridgeChannel: 'lab',
    bridgeEvent: 'lab:stem-visualization-requested',
  }),

  // ── StarMakerEngin → ContentEngin ────────────────────────────────────────────
  defineWorkflow({
    id: 'starmaker-to-content:attach-track',
    from: 'starmaker',
    to: 'content',
    label: 'Add track to content',
    description:
      'Attaches the current track or stem as audio background/soundtrack to a ' +
      'ContentEngin post or video.',
    artifactTypes: ['track', 'stem'],
    bridgeChannel: 'create',
    bridgeEvent: 'create:music-attached',
  }),

  // ── StarMakerEngin → GameEngin ───────────────────────────────────────────────
  defineWorkflow({
    id: 'starmaker-to-game:adaptive-soundtrack',
    from: 'starmaker',
    to: 'game',
    label: 'Set game soundtrack',
    description:
      'Sends the current track to GameEngin as the adaptive game soundtrack. ' +
      'GameEngin syncs BPM to game tempo and uses the track as background audio.',
    artifactTypes: ['track'],
    bridgeChannel: 'games',
    bridgeEvent: 'games:soundtrack-requested',
  }),

  // ── StarMakerEngin → BrandingEngin ───────────────────────────────────────────
  defineWorkflow({
    id: 'starmaker-to-brand:track-release',
    from: 'starmaker',
    to: 'brand',
    label: 'Release track via BrandingEngin',
    description:
      'Pushes a finished track to BrandingEngin to generate a campaign, ' +
      'playlist promo, or release post.',
    artifactTypes: ['track'],
    bridgeChannel: 'brand',
    bridgeEvent: 'brand:music-release-requested',
  }),

  // ── CodeEngin → GameEngin ────────────────────────────────────────────────────
  defineWorkflow({
    id: 'code-to-game:deploy-script',
    from: 'code',
    to: 'game',
    label: 'Deploy code to game',
    description:
      'Takes the active CodeEngin script/cell and deploys it as game logic — ' +
      'NPC behavior, physics rules, or game event handler.',
    artifactTypes: ['script'],
    bridgeChannel: 'games',
    bridgeEvent: 'games:script-deploy-requested',
  }),

  // ── CodeEngin → LabEngin ─────────────────────────────────────────────────────
  defineWorkflow({
    id: 'code-to-lab:run-experiment',
    from: 'code',
    to: 'lab',
    label: 'Run code as lab experiment',
    description:
      'Sends a CodeEngin notebook cell to LabEngin to execute as a scientific ' +
      'experiment with structured output, charts, and data export.',
    artifactTypes: ['script', 'notebook'],
    bridgeChannel: 'lab',
    bridgeEvent: 'lab:code-experiment-requested',
  }),

  // ── CodeEngin → ContentEngin ─────────────────────────────────────────────────
  defineWorkflow({
    id: 'code-to-content:export-notebook',
    from: 'code',
    to: 'content',
    label: 'Publish notebook as content',
    description:
      'Exports a CodeEngin notebook as a tutorial, dev blog post, or ' +
      'interactive article in ContentEngin.',
    artifactTypes: ['notebook'],
    bridgeChannel: 'create',
    bridgeEvent: 'create:notebook-publish-requested',
  }),

  // ── ForgeEngin → GameEngin ───────────────────────────────────────────────────
  defineWorkflow({
    id: 'forge-to-game:import-3d-asset',
    from: 'forge',
    to: 'game',
    label: 'Import 3D asset into game',
    description:
      'Sends a ForgeEngin 3D model (GLB/GLTF) directly into the GameEngin ' +
      'scene as a spawnable asset, environment prop, or character.',
    artifactTypes: ['3d-asset'],
    bridgeChannel: 'games',
    bridgeEvent: 'games:asset-import-requested',
  }),

  // ── ForgeEngin → ContentEngin ────────────────────────────────────────────────
  defineWorkflow({
    id: 'forge-to-content:embed-3d',
    from: 'forge',
    to: 'content',
    label: 'Embed 3D asset in content',
    description:
      'Places a ForgeEngin 3D model as an interactive embed in a ContentEngin ' +
      'post — readers can rotate/zoom the model.',
    artifactTypes: ['3d-asset'],
    bridgeChannel: 'create',
    bridgeEvent: 'create:asset-embedded',
  }),

  // ── ForgeEngin → StarMakerEngin ──────────────────────────────────────────────
  defineWorkflow({
    id: 'forge-to-starmaker:visualizer-scene',
    from: 'forge',
    to: 'starmaker',
    label: 'Use 3D scene as music visualizer',
    description:
      'Sends a ForgeEngin 3D scene to StarMakerEngin to use as a reactive ' +
      'music visualizer — objects pulse and move with the beat.',
    artifactTypes: ['3d-asset'],
    bridgeChannel: 'music',
    bridgeEvent: 'music:visualizer-scene-requested',
  }),

  // ── ForgeEngin → LabEngin ────────────────────────────────────────────────────
  defineWorkflow({
    id: 'forge-to-lab:simulate-asset',
    from: 'forge',
    to: 'lab',
    label: 'Simulate 3D asset in LabEngin',
    description:
      'Sends a 3D asset to LabEngin for physics simulation, stress testing, ' +
      'or material analysis.',
    artifactTypes: ['3d-asset'],
    bridgeChannel: 'lab',
    bridgeEvent: 'lab:asset-simulation-requested',
  }),

  // ── GameEngin → ContentEngin ─────────────────────────────────────────────────
  defineWorkflow({
    id: 'game-to-content:export-clip',
    from: 'game',
    to: 'content',
    label: 'Share game clip as content',
    description:
      'Exports the current game session state, score, or highlight clip to ' +
      'ContentEngin as a shareable post or video.',
    artifactTypes: ['clip'],
    bridgeChannel: 'create',
    bridgeEvent: 'create:game-clip-embedded',
  }),

  // ── GameEngin → BrandingEngin ────────────────────────────────────────────────
  defineWorkflow({
    id: 'game-to-brand:achievement-campaign',
    from: 'game',
    to: 'brand',
    label: 'Turn achievement into campaign',
    description:
      'Sends a game achievement or leaderboard milestone to BrandingEngin to ' +
      'auto-generate a hype post or marketing moment.',
    artifactTypes: ['clip', 'any'],
    bridgeChannel: 'brand',
    bridgeEvent: 'brand:achievement-campaign-requested',
  }),

  // ── GameEngin → CodeEngin ────────────────────────────────────────────────────
  defineWorkflow({
    id: 'game-to-code:export-script',
    from: 'game',
    to: 'code',
    label: 'Export game script to CodeEngin',
    description:
      "Brings a game's current script or AI behavior rules into CodeEngin for " +
      'editing and improvement.',
    artifactTypes: ['script'],
    bridgeChannel: 'code',
    bridgeEvent: 'code:game-script-imported',
  }),

  // ── LabEngin → CodeEngin ─────────────────────────────────────────────────────
  defineWorkflow({
    id: 'lab-to-code:export-dataset',
    from: 'lab',
    to: 'code',
    label: 'Send lab data to CodeEngin',
    description:
      "Exports a lab experiment's result dataset to CodeEngin as a pre-loaded " +
      'variable, ready to analyze or visualize in code.',
    artifactTypes: ['dataset'],
    bridgeChannel: 'code',
    bridgeEvent: 'code:lab-dataset-received',
  }),

  // ── LabEngin → StarMakerEngin ────────────────────────────────────────────────
  defineWorkflow({
    id: 'lab-to-starmaker:sonify',
    from: 'lab',
    to: 'starmaker',
    label: 'Sonify lab data as music',
    description:
      "Maps a lab dataset's values to musical parameters (pitch, rhythm, timbre) " +
      'and sends them to StarMakerEngin to generate a sonification track.',
    artifactTypes: ['dataset'],
    bridgeChannel: 'music',
    bridgeEvent: 'music:sonification-requested',
  }),

  // ── LabEngin → ForgeEngin ────────────────────────────────────────────────────
  defineWorkflow({
    id: 'lab-to-forge:generate-3d',
    from: 'lab',
    to: 'forge',
    label: 'Generate 3D from lab data',
    description:
      'Converts simulation or dataset output into a 3D model in ForgeEngin — ' +
      'e.g. protein folding, terrain from elevation data, or molecular structure.',
    artifactTypes: ['dataset'],
    bridgeChannel: 'code',
    bridgeEvent: 'code:lab-to-forge-requested',
  }),

  // ── ContentEngin → BrandingEngin ─────────────────────────────────────────────
  defineWorkflow({
    id: 'content-to-brand:campaign-asset',
    from: 'content',
    to: 'brand',
    label: 'Turn post into brand campaign',
    description:
      'Sends a published or drafted ContentEngin post to BrandingEngin to wrap ' +
      'it in a brand campaign with targeting, scheduling, and CTA.',
    artifactTypes: ['post'],
    bridgeChannel: 'brand',
    bridgeEvent: 'brand:content-campaign-requested',
  }),

  // ── ContentEngin → GameEngin ─────────────────────────────────────────────────
  defineWorkflow({
    id: 'content-to-game:world-lore',
    from: 'content',
    to: 'game',
    label: 'Use content as game lore',
    description:
      'Sends a ContentEngin story post or article into GameEngin as in-game ' +
      'lore, NPC dialogue, or quest description text.',
    artifactTypes: ['post'],
    bridgeChannel: 'games',
    bridgeEvent: 'games:lore-content-received',
  }),

  // ── BrandingEngin → ContentEngin ─────────────────────────────────────────────
  defineWorkflow({
    id: 'brand-to-content:apply-kit',
    from: 'brand',
    to: 'content',
    label: 'Apply brand kit to content',
    description:
      'Pushes the active brand kit (colors, fonts, logo, tone) to ContentEngin ' +
      'so new posts auto-apply the brand style.',
    artifactTypes: ['brand-kit'],
    bridgeChannel: 'create',
    bridgeEvent: 'create:brand-kit-applied',
  }),

  // ── BrandingEngin → GameEngin ────────────────────────────────────────────────
  defineWorkflow({
    id: 'brand-to-game:sponsor-skin',
    from: 'brand',
    to: 'game',
    label: 'Apply brand skin to game',
    description:
      'Applies a BrandingEngin campaign or sponsor skin to a game — custom UI ' +
      'colors, logos, and achievement badges.',
    artifactTypes: ['brand-kit', 'any'],
    bridgeChannel: 'games',
    bridgeEvent: 'games:brand-skin-requested',
  }),

  // ── 2026 NEW WORKFLOWS ───────────────────────────────────────────────────────

  // ── CodeEngin → StarMakerEngin ───────────────────────────────────────────────
  defineWorkflow({
    id: 'code-to-starmaker:generative-audio',
    from: 'code',
    to: 'starmaker',
    label: 'Generate audio from code',
    description:
      'Sends CodeEngin algorithm or ML model to StarMakerEngin to generate ' +
      'procedural music or sound design via algorithmic composition.',
    artifactTypes: ['script', 'notebook'],
    bridgeChannel: 'music',
    bridgeEvent: 'music:generative-audio-requested',
  }),

  // ── LabEngin → GameEngin ─────────────────────────────────────────────────────
  defineWorkflow({
    id: 'lab-to-game:physics-simulation',
    from: 'lab',
    to: 'game',
    label: 'Import physics simulation',
    description:
      'Transfers LabEngin physics simulation results to GameEngin for real-time ' +
      'gameplay physics, particle effects, or environmental dynamics.',
    artifactTypes: ['dataset'],
    bridgeChannel: 'games',
    bridgeEvent: 'games:physics-sim-imported',
  }),

  // ── ContentEngin → StarMakerEngin ────────────────────────────────────────────
  defineWorkflow({
    id: 'content-to-starmaker:podcast-audio',
    from: 'content',
    to: 'starmaker',
    label: 'Create podcast audio track',
    description:
      'Sends a ContentEngin podcast script or article to StarMakerEngin for ' +
      'text-to-speech, audio mastering, and podcast production.',
    artifactTypes: ['post'],
    bridgeChannel: 'music',
    bridgeEvent: 'music:podcast-production-requested',
  }),

  // ── ForgeEngin → LabEngin ────────────────────────────────────────────────────
  defineWorkflow({
    id: 'forge-to-lab:material-analysis',
    from: 'forge',
    to: 'lab',
    label: 'Analyze 3D material properties',
    description:
      'Sends a ForgeEngin 3D asset to LabEngin for material analysis, ' +
      'stress testing, or quantum-inspired material simulation.',
    artifactTypes: ['3d-asset'],
    bridgeChannel: 'lab',
    bridgeEvent: 'lab:material-analysis-requested',
  }),

  // ── GameEngin → ForgeEngin ───────────────────────────────────────────────────
  defineWorkflow({
    id: 'game-to-forge:export-level',
    from: 'game',
    to: 'forge',
    label: 'Export game level to 3D',
    description:
      'Exports the current game level or world from GameEngin to ForgeEngin ' +
      'as an editable 3D model for remixing and enhancement.',
    artifactTypes: ['3d-asset'],
    bridgeChannel: 'code',
    bridgeEvent: 'code:game-level-exported',
  }),

  // ── StarMakerEngin → LabEngin ────────────────────────────────────────────────
  defineWorkflow({
    id: 'starmaker-to-lab:audio-analysis',
    from: 'starmaker',
    to: 'lab',
    label: 'Audio spectral analysis',
    description:
      'Sends a StarMakerEngin track to LabEngin for deep spectral analysis, ' +
      'frequency visualization, and harmonic structure mapping.',
    artifactTypes: ['track', 'stem'],
    bridgeChannel: 'lab',
    bridgeEvent: 'lab:audio-analysis-requested',
  }),

  // ── LabEngin → ContentEngin ──────────────────────────────────────────────────
  defineWorkflow({
    id: 'lab-to-content:research-paper',
    from: 'lab',
    to: 'content',
    label: 'Generate research paper',
    description:
      'Exports a LabEngin experiment with results to ContentEngin as a ' +
      'formatted research paper or scientific article with embedded visualizations.',
    artifactTypes: ['dataset'],
    bridgeChannel: 'create',
    bridgeEvent: 'create:research-paper-requested',
  }),

  // ── BrandingEngin → StarMakerEngin ───────────────────────────────────────────
  defineWorkflow({
    id: 'brand-to-starmaker:sonic-branding',
    from: 'brand',
    to: 'starmaker',
    label: 'Create sonic brand identity',
    description:
      'Sends BrandingEngin brand kit to StarMakerEngin to generate sonic ' +
      'branding: jingles, audio logos, and brand-consistent music themes.',
    artifactTypes: ['brand-kit'],
    bridgeChannel: 'music',
    bridgeEvent: 'music:sonic-branding-requested',
  }),

  // ── CodeEngin → BrandingEngin ────────────────────────────────────────────────
  defineWorkflow({
    id: 'code-to-brand:analytics-dashboard',
    from: 'code',
    to: 'brand',
    label: 'Build analytics dashboard',
    description:
      'Exports a CodeEngin data analysis notebook to BrandingEngin as a live ' +
      'analytics dashboard for brand performance tracking.',
    artifactTypes: ['notebook'],
    bridgeChannel: 'brand',
    bridgeEvent: 'brand:analytics-dashboard-requested',
  }),

  // ── ContentEngin → LabEngin ──────────────────────────────────────────────────
  defineWorkflow({
    id: 'content-to-lab:ab-testing',
    from: 'content',
    to: 'lab',
    label: 'Run A/B content test',
    description:
      'Sends multiple ContentEngin post variants to LabEngin for A/B testing ' +
      'simulation and performance prediction analysis.',
    artifactTypes: ['post'],
    bridgeChannel: 'lab',
    bridgeEvent: 'lab:ab-test-requested',
  }),
];

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Find all workflows that connect a given source Engin to a target Engin.
 * Returns an empty array when no workflow is defined for that pair.
 */
export function findWorkflows(from: EnginKey, to: EnginKey): WorkflowDefinition[] {
  return WORKFLOWS.filter((w) => w.from === from && w.to === to);
}

/**
 * Find a single workflow by its unique ID.
 * Returns undefined if no workflow with that ID is registered.
 */
export function findWorkflowById(id: string): WorkflowDefinition | undefined {
  return WORKFLOWS.find((w) => w.id === id);
}

/**
 * Execute a workflow by ID with the given payload.
 * Fires bridge.emitDurable on the workflow's channel and event.
 * ── Improvement 47: wrapped in try/catch so one bad workflow never
 *    prevents the caller from continuing.
 *
 * @returns true if the workflow was found and executed; false if the ID is unknown.
 */
export function executeWorkflow(id: string, payload: Record<string, unknown>): boolean {
  const workflow = findWorkflowById(id);
  if (!workflow) return false;
  try {
    workflow.execute(payload);
  } catch (err) {
    console.error(`[enginWorkflowRegistry] executeWorkflow(${id}) threw`, err);
    return false;
  }
  return true;
}

/**
 * Return a readonly snapshot of every registered workflow.
 * Useful for building seam UI menus or debugging the registry.
 */
export function allWorkflows(): readonly WorkflowDefinition[] {
  return WORKFLOWS;
}

// ── Improvement 44: getWorkflowsByArtifactType ────────────────────────────────

/**
 * Return all workflows that accept the given artifact type (or 'any').
 * Useful when the drag payload has a known type but the target Engin is unknown.
 */
export function getWorkflowsByArtifactType(type: WorkflowArtifactType): WorkflowDefinition[] {
  return WORKFLOWS.filter(
    (w) => w.artifactTypes.includes(type) || w.artifactTypes.includes('any'),
  );
}

// ── Improvement 45: getWorkflowStats ─────────────────────────────────────────

export interface WorkflowStats {
  total: number;
  bySource: Record<string, number>;
  byTarget: Record<string, number>;
  byArtifactType: Record<string, number>;
}

/**
 * Return aggregate statistics about the registered workflow set.
 * Useful for analytics and debugging the seam configuration.
 */
export function getWorkflowStats(): WorkflowStats {
  const bySource: Record<string, number> = {};
  const byTarget: Record<string, number> = {};
  const byArtifactType: Record<string, number> = {};

  for (const w of WORKFLOWS) {
    bySource[w.from] = (bySource[w.from] ?? 0) + 1;
    byTarget[w.to] = (byTarget[w.to] ?? 0) + 1;
    for (const type of w.artifactTypes) {
      byArtifactType[type] = (byArtifactType[type] ?? 0) + 1;
    }
  }

  return { total: WORKFLOWS.length, bySource, byTarget, byArtifactType };
}

// ── Improvement 46: workflowExists ───────────────────────────────────────────

/**
 * Returns true when a workflow with the given ID is registered.
 * Slightly faster than findWorkflowById(id) !== undefined for boolean checks.
 */
export function workflowExists(id: string): boolean {
  return WORKFLOWS.some((w) => w.id === id);
}
