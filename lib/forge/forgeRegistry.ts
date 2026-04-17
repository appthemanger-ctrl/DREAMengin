/**
 * ForgeEngin — Registry & Status System
 *
 * Tracks the live state of every Engin in DREAMengin. Each Engin registers
 * its existence here, and the ForgeEngin reads from this registry to build
 * the unified status matrix.
 *
 * Architecture: Extends the StandaloneEnginSurface pattern from
 * components/daydream/StandaloneEnginSurface.tsx
 */

// ── Engin Catalog ─────────────────────────────────────────────────────────────

export interface EnginEntry {
  /** Canonical machine id, e.g. 'games', 'music', 'code' */
  id: string;
  /** Display name, e.g. 'GameEngin', 'StarMakerEngin' */
  name: string;
  /** Emoji icon */
  emoji: string;
  /** Accent colour (CSS hex) */
  accent: string;
  /** Description line */
  desc: string;
  /** Daydream surface route */
  daydreamHref: string;
  /** Standalone engin route */
  enginHref: string;
  /** Capability tags */
  capabilities: readonly string[];
}

/**
 * The canonical registry of all 6 creative engines + ForgeEngin itself.
 * Ordered by creation seniority.
 */
export const ENGIN_REGISTRY: readonly EnginEntry[] = [
  {
    id: 'games',
    name: 'GameEngin',
    emoji: '🎮',
    accent: '#3b82f6', // 2026 updated
    desc: 'Play, compete, build worlds. Babylon.js + WebGPU + ray-tracing.',
    daydreamHref: '/daydream/games',
    enginHref: '/engines/games',
    capabilities: ['Babylon.js', 'WebGPU', 'Ray-Tracing', 'Spatial Audio', 'AI NPCs'],
  },
  {
    id: 'music',
    name: 'StarMakerEngin',
    emoji: '🎵',
    accent: '#a855f7',
    desc: 'Full DAW · AI stem separation · spatial audio · live collab.',
    daydreamHref: '/daydream/music',
    enginHref: '/engines/music',
    capabilities: ['Web Audio', 'Multitrack', 'AI Stems', 'Spatial Audio', 'Live Collab'],
  },
  {
    id: 'code',
    name: 'CodeEngin',
    emoji: '💻',
    accent: '#22d3ee', // 2026 updated
    desc: 'IDE · AI copilot 2026 · multi-cursor · live preview.',
    daydreamHref: '/daydream/code',
    enginHref: '/engines/code',
    capabilities: ['Monaco', 'TypeScript', 'AI Copilot', 'Multi-Cursor', 'Live Preview'],
  },
  {
    id: 'lab',
    name: 'LabEngin',
    emoji: '🔬',
    accent: '#10b981',
    desc: 'Experiments · quantum circuits 2026 · GPU compute · real-time viz.',
    daydreamHref: '/daydream/lab',
    enginHref: '/engines/lab',
    capabilities: ['WebGPU', 'Quantum 2026', 'TensorFlow', 'GPU Compute', 'Real-Time Viz'],
  },
  {
    id: 'brand',
    name: 'BrandingEngin',
    emoji: '🎨',
    accent: '#f472b6',
    desc: 'Identity · AI brand kit · motion graphics · analytics 2.0.',
    daydreamHref: '/daydream/brand',
    enginHref: '/engines/brand',
    capabilities: ['AI Brand Kit', 'Motion Graphics', 'Analytics 2.0', 'Export'],
  },
  {
    id: 'create',
    name: 'ContentEngin',
    emoji: '✨',
    accent: '#fb923c',
    desc: 'Editor · multi-platform scheduler · AI optimizer · analytics.',
    daydreamHref: '/daydream/create',
    enginHref: '/engines/create',
    capabilities: ['Rich Text', 'Multi-Platform', 'AI Optimizer', 'Scheduling', 'Analytics'],
  },
  {
    id: 'forge',
    name: 'ForgeEngin',
    emoji: '🔥',
    accent: '#ef4444',
    desc: 'Meta-creation engine. Orchestrate all engines. Workflow automation 2.0.',
    daydreamHref: '/daydream/forge',
    enginHref: '/daydream/forge',
    capabilities: ['Cross-Engine', 'Status Matrix', 'Orchestration', 'Automation 2.0'],
  },
] as const;

/** Just the 6 creative engines (no Forge self-reference) */
export const CREATIVE_ENGINES = ENGIN_REGISTRY.filter(e => e.id !== 'forge');

// ── Activity Pulse ────────────────────────────────────────────────────────────

export interface ForgeActivityPulse {
  enginId: string;
  /** ISO timestamp of last activity */
  lastActive: string;
  /** 0–1 heat intensity (decays over time) */
  heat: number;
  /** Human-readable label */
  label: string;
}

/**
 * Storage key for forge activity data in localStorage.
 */
const FORGE_STORAGE_KEY = 'de:forge:activity';

/**
 * Record an activity pulse for a given engin.
 * Persists to localStorage so the forge dashboard survives page reload.
 * Also appends to the intelligence history log for pattern detection.
 */
export function recordForgeActivity(enginId: string, label: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(FORGE_STORAGE_KEY);
    const data: Record<string, ForgeActivityPulse> = raw ? JSON.parse(raw) : {};
    data[enginId] = {
      enginId,
      lastActive: new Date().toISOString(),
      heat: 1.0,
      label,
    };
    localStorage.setItem(FORGE_STORAGE_KEY, JSON.stringify(data));
    // Also feed the history log for intelligence pattern detection
    appendToHistory(enginId, label);
  } catch {
    // localStorage unavailable — silent
  }
}

/**
 * Storage key for forge activity history — shared with forgeIntelligence.ts.
 * Both files write to this key; this is the single source-of-truth constant.
 */
export const FORGE_HISTORY_KEY = 'de:forge:history';

/**
 * Internal: append to the history log inline (avoids circular import with forgeIntelligence).
 */
const MAX_HISTORY = 100;

function appendToHistory(enginId: string, label: string): void {
  try {
    const raw = localStorage.getItem(FORGE_HISTORY_KEY);
    const history: Array<{ enginId: string; label: string; timestamp: string }> = raw ? JSON.parse(raw) : [];
    history.push({ enginId, label, timestamp: new Date().toISOString() });
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
    localStorage.setItem(FORGE_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // silent
  }
}

/**
 * Read all forge activity pulses. Heat decays based on time elapsed.
 */
export function readForgeActivity(): ForgeActivityPulse[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FORGE_STORAGE_KEY);
    if (!raw) return [];
    const data: Record<string, ForgeActivityPulse> = JSON.parse(raw);
    const now = Date.now();
    return Object.values(data).map(pulse => {
      const elapsed = now - new Date(pulse.lastActive).getTime();
      // Heat decays to 0 over 30 minutes
      const decay = Math.max(0, 1 - elapsed / (30 * 60 * 1000));
      return { ...pulse, heat: decay };
    });
  } catch {
    return [];
  }
}

/**
 * Get the forge activity pulse for a specific engin, or null if never used.
 */
export function getForgeHeat(enginId: string): ForgeActivityPulse | null {
  const all = readForgeActivity();
  return all.find(p => p.enginId === enginId) ?? null;
}

/**
 * Format a relative time string from an ISO timestamp.
 */
export function formatRelativeTime(isoStr: string): string {
  const elapsed = Date.now() - new Date(isoStr).getTime();
  if (elapsed < 60_000) return 'just now';
  if (elapsed < 3600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86400_000) return `${Math.floor(elapsed / 3600_000)}h ago`;
  return `${Math.floor(elapsed / 86400_000)}d ago`;
}

// ── Cross-Engine Workflows ────────────────────────────────────────────────────

export interface ForgeWorkflow {
  /** Unique workflow id */
  id: string;
  /** Display title */
  title: string;
  /** Emoji icon */
  emoji: string;
  /** Accent colour */
  accent: string;
  /** Short description */
  desc: string;
  /** Ordered engine ids used in this workflow */
  engines: readonly string[];
  /** Steps the user walks through */
  steps: readonly string[];
}

/**
 * Pre-built cross-engine workflow templates.  Each describes a multi-engine
 * creative pipeline the user can launch from the Forge dashboard.
 */
export const FORGE_WORKFLOWS: readonly ForgeWorkflow[] = [
  {
    id: 'music-video',
    title: 'Music Video Pipeline',
    emoji: '🎬',
    accent: '#a855f7',
    desc: 'Record a track, build visual content, publish everywhere.',
    engines: ['music', 'create', 'brand'],
    steps: [
      'Open StarMakerEngin → compose & mix a track with AI stem separation',
      'Open ContentEngin → draft a video post with the stem',
      'Open BrandingEngin → apply brand kit to thumbnails',
    ],
  },
  {
    id: 'game-soundtrack',
    title: 'Game Soundtrack Flow',
    emoji: '🎮',
    accent: '#3b82f6',
    desc: 'Produce beats, wire them into a game world with spatial audio.',
    engines: ['music', 'games'],
    steps: [
      'Open StarMakerEngin → create a beat with spatial audio positioning',
      'Open GameEngin → attach audio to a scene with 3D positioning',
    ],
  },
  {
    id: 'data-story',
    title: 'Data Story',
    emoji: '📊',
    accent: '#10b981',
    desc: 'Run an experiment, analyse with code, publish the narrative.',
    engines: ['lab', 'code', 'create'],
    steps: [
      'Open LabEngin → run a simulation & export data',
      'Open CodeEngin → write an analysis notebook with AI copilot',
      'Open ContentEngin → publish the write-up with AI optimizer',
    ],
  },
  {
    id: 'brand-campaign',
    title: 'Brand Campaign',
    emoji: '📣',
    accent: '#f472b6',
    desc: 'Build brand identity, craft content, schedule the launch.',
    engines: ['brand', 'create'],
    steps: [
      'Open BrandingEngin → generate AI brand kit with motion graphics',
      'Open ContentEngin → write posts & schedule multi-platform queue',
    ],
  },
  {
    id: 'full-stack-game',
    title: 'Full-Stack Game Dev',
    emoji: '🚀',
    accent: '#22d3ee',
    desc: 'Code the logic, build the world, playtest & share.',
    engines: ['code', 'games', 'create'],
    steps: [
      'Open CodeEngin → write game scripts with multi-cursor editing',
      'Open GameEngin → world-build with ray-traced lighting & playtest',
      'Open ContentEngin → create a launch post with analytics tracking',
    ],
  },
  {
    id: 'ai-music-generation',
    title: 'AI Music Generation',
    emoji: '🤖',
    accent: '#a855f7',
    desc: 'Code generative algorithms, produce music, analyze results.',
    engines: ['code', 'music', 'lab'],
    steps: [
      'Open CodeEngin → write generative audio algorithm',
      'Open StarMakerEngin → generate procedural music tracks',
      'Open LabEngin → analyze audio spectral properties',
    ],
  },
  {
    id: 'quantum-game',
    title: 'Quantum Physics Game',
    emoji: '⚛️',
    accent: '#10b981',
    desc: 'Simulate quantum mechanics, build game world, export levels.',
    engines: ['lab', 'games', 'forge'],
    steps: [
      'Open LabEngin → run quantum circuit simulation',
      'Open GameEngin → import physics simulation into gameplay',
      'Open ForgeEngin → export game level as 3D model',
    ],
  },
  {
    id: 'sonic-branding',
    title: 'Sonic Brand Identity',
    emoji: '🔊',
    accent: '#f472b6',
    desc: 'Design brand kit, create sonic identity, launch campaign.',
    engines: ['brand', 'music', 'create'],
    steps: [
      'Open BrandingEngin → design AI-powered brand kit',
      'Open StarMakerEngin → create sonic branding and audio logo',
      'Open ContentEngin → schedule multi-platform brand campaign',
    ],
  },
  {
    id: 'research-publication',
    title: 'Research Publication Pipeline',
    emoji: '📄',
    accent: '#10b981',
    desc: 'Experiment, analyze, publish, and share findings.',
    engines: ['lab', 'code', 'create', 'brand'],
    steps: [
      'Open LabEngin → conduct experiment with GPU compute',
      'Open CodeEngin → analyze data with AI copilot',
      'Open ContentEngin → generate research paper with visualizations',
      'Open BrandingEngin → create presentation graphics',
    ],
  },
  {
    id: 'interactive-tutorial',
    title: 'Interactive Tutorial Creation',
    emoji: '📚',
    accent: '#22d3ee',
    desc: 'Code examples, build interactive demos, publish content.',
    engines: ['code', 'games', 'create'],
    steps: [
      'Open CodeEngin → write tutorial notebook with live preview',
      'Open GameEngin → create interactive demo world',
      'Open ContentEngin → publish as interactive article',
    ],
  },
] as const;
