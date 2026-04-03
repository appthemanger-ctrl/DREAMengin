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
    accent: '#c8981a',
    desc: 'Play, compete, build worlds. Babylon.js + WebGPU runtime.',
    daydreamHref: '/daydream/games',
    enginHref: '/engines/games',
    capabilities: ['Babylon.js', 'WebGPU', 'DualSense', 'Fullscreen HUD'],
  },
  {
    id: 'music',
    name: 'StarMakerEngin',
    emoji: '🎵',
    accent: '#a855f7',
    desc: 'Full DAW · record · arrange · multitrack.',
    daydreamHref: '/daydream/music',
    enginHref: '/engines/music',
    capabilities: ['Web Audio', 'Multitrack', 'MIDI', 'Beat Grid'],
  },
  {
    id: 'code',
    name: 'CodeEngin',
    emoji: '💻',
    accent: '#22d3ee',
    desc: 'IDE · notebook · AI assistant.',
    daydreamHref: '/daydream/code',
    enginHref: '/engines/code',
    capabilities: ['Monaco', 'TypeScript', 'AI Pair', 'Live Preview'],
  },
  {
    id: 'lab',
    name: 'LabEngin',
    emoji: '🔬',
    accent: '#10b981',
    desc: 'Experiments · data viz · quantum circuits.',
    daydreamHref: '/daydream/lab',
    enginHref: '/engines/lab',
    capabilities: ['WebGPU', 'Quantum', 'TensorFlow', 'Data Viz'],
  },
  {
    id: 'brand',
    name: 'BrandingEngin',
    emoji: '🎨',
    accent: '#f472b6',
    desc: 'Identity · analytics · campaigns.',
    daydreamHref: '/daydream/brand',
    enginHref: '/engines/brand',
    capabilities: ['Design System', 'Analytics', 'Export'],
  },
  {
    id: 'create',
    name: 'ContentEngin',
    emoji: '✨',
    accent: '#fb923c',
    desc: 'Editor · calendar · publish queue.',
    daydreamHref: '/daydream/create',
    enginHref: '/engines/create',
    capabilities: ['Rich Text', 'Scheduling', 'Multi-Platform'],
  },
  {
    id: 'forge',
    name: 'ForgeEngin',
    emoji: '🔥',
    accent: '#ef4444',
    desc: 'Meta-creation engine. Orchestrate all engines from one surface.',
    daydreamHref: '/daydream/forge',
    enginHref: '/daydream/forge',
    capabilities: ['Cross-Engine', 'Status Matrix', 'Orchestration'],
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
  } catch {
    // localStorage unavailable — silent
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
