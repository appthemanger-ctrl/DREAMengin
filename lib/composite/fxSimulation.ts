/**
 * fxSimulation – VFX simulation preset catalogue.
 *
 * Inspired by Houdini's simulation shelf: fire, water, destruction,
 * smoke/particles, and fabric dynamics.
 *
 * Each preset defines the parameters that drive a simulation.
 * Parameters are structured so they can be mapped directly to
 * Three.js / Babylon.js particle systems or a GPU compute shader.
 */

export type FxCategory = 'fire' | 'water' | 'destruction' | 'smoke' | 'particles' | 'fabric';

export interface FxParam {
  name: string;
  label: string;
  type: 'float' | 'int' | 'boolean' | 'color' | 'vec3' | 'enum';
  value: number | boolean | string | number[];
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description: string;
}

export interface FxPreset {
  id: string;
  name: string;
  category: FxCategory;
  emoji: string;
  description: string;
  /** Display tags for the UI filter bar */
  tags: string[];
  params: FxParam[];
}

export interface FxSimulation {
  id: string;
  presetId: string;
  name: string;
  /** User-overridden parameter values */
  overrides: Record<string, FxParam['value']>;
  /** Current simulation state */
  state: 'idle' | 'running' | 'paused' | 'complete';
  /** Elapsed simulation time in seconds */
  elapsedSeconds: number;
  /** Total requested duration */
  durationSeconds: number;
  /** Frame rate for caching */
  fps: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset catalogue
// ─────────────────────────────────────────────────────────────────────────────

export const FX_PRESETS: FxPreset[] = [
  // ── Fire ──────────────────────────────────────────────────────────────────
  {
    id: 'fire_campfire',
    name: 'Campfire',
    category: 'fire',
    emoji: '🔥',
    description: 'Low, flickering campfire with warm orange/amber tones.',
    tags: ['fire', 'warm', 'outdoor', 'interactive'],
    params: [
      { name: 'intensity', label: 'Intensity', type: 'float', value: 0.6, min: 0, max: 1, step: 0.01, description: 'Overall flame intensity' },
      { name: 'radius', label: 'Base Radius (m)', type: 'float', value: 0.3, min: 0.05, max: 2, step: 0.05, description: 'Radius of the flame base' },
      { name: 'height', label: 'Height (m)', type: 'float', value: 0.8, min: 0.1, max: 5, step: 0.1, description: 'Maximum flame height' },
      { name: 'turbulence', label: 'Turbulence', type: 'float', value: 0.4, min: 0, max: 1, step: 0.01, description: 'Wind / air turbulence amount' },
      { name: 'colorCore', label: 'Core Color', type: 'color', value: [1, 0.95, 0.4], description: 'RGB of the hot flame core' },
      { name: 'colorOuter', label: 'Outer Color', type: 'color', value: [0.9, 0.3, 0.0], description: 'RGB of the cooler outer flame' },
      { name: 'emitSmoke', label: 'Emit Smoke', type: 'boolean', value: true, description: 'Automatically attach smoke sim' },
    ],
  },
  {
    id: 'fire_explosion',
    name: 'Explosion',
    category: 'fire',
    emoji: '💥',
    description: 'Fast-expanding fireball with shockwave and debris.',
    tags: ['fire', 'explosion', 'vfx', 'destruction'],
    params: [
      { name: 'scale', label: 'Scale (m)', type: 'float', value: 5, min: 0.5, max: 50, step: 0.5, description: 'Blast radius in metres' },
      { name: 'duration', label: 'Duration (s)', type: 'float', value: 1.5, min: 0.1, max: 10, step: 0.1, description: 'Fireball lifetime' },
      { name: 'shockwave', label: 'Shockwave Ring', type: 'boolean', value: true, description: 'Add ground-level shockwave ring' },
      { name: 'debrisCount', label: 'Debris Count', type: 'int', value: 200, min: 0, max: 2000, step: 10, description: 'Number of debris particles' },
      { name: 'intensity', label: 'Light Intensity', type: 'float', value: 1.0, min: 0, max: 2, step: 0.05, description: 'Dynamic light cast by the explosion' },
    ],
  },
  // ── Water ─────────────────────────────────────────────────────────────────
  {
    id: 'water_ocean',
    name: 'Ocean Surface',
    category: 'water',
    emoji: '🌊',
    description: 'Large-scale Gerstner wave ocean with JONSWAP spectrum.',
    tags: ['water', 'ocean', 'waves', 'outdoor'],
    params: [
      { name: 'windSpeed', label: 'Wind Speed (m/s)', type: 'float', value: 12, min: 0, max: 30, step: 0.5, description: 'Driving wind speed for wave generation' },
      { name: 'windDir', label: 'Wind Direction (°)', type: 'float', value: 45, min: 0, max: 360, step: 1, description: 'Primary wind direction in degrees' },
      { name: 'waveHeight', label: 'Wave Height (m)', type: 'float', value: 2.5, min: 0, max: 15, step: 0.1, description: 'Significant wave height' },
      { name: 'choppiness', label: 'Choppiness', type: 'float', value: 1.2, min: 0, max: 3, step: 0.1, description: 'Wave crest sharpness' },
      { name: 'foam', label: 'Foam Threshold', type: 'float', value: 0.6, min: 0, max: 1, step: 0.01, description: 'Whitecap / foam spawn threshold' },
      { name: 'deepColor', label: 'Deep Water Color', type: 'color', value: [0.0, 0.1, 0.25], description: 'RGB for deep water areas' },
    ],
  },
  {
    id: 'water_splash',
    name: 'Impact Splash',
    category: 'water',
    emoji: '💧',
    description: 'Object-impact splash with crown, drops, and foam ring.',
    tags: ['water', 'splash', 'interaction', 'vfx'],
    params: [
      { name: 'impactVelocity', label: 'Impact Velocity (m/s)', type: 'float', value: 8, min: 0.5, max: 50, step: 0.5, description: 'Vertical velocity of the impacting object' },
      { name: 'objectRadius', label: 'Object Radius (m)', type: 'float', value: 0.2, min: 0.01, max: 2, step: 0.01, description: 'Cross-section radius of the impacting object' },
      { name: 'dropCount', label: 'Droplet Count', type: 'int', value: 800, min: 10, max: 5000, step: 50, description: 'Number of secondary droplets' },
      { name: 'foamRing', label: 'Foam Ring', type: 'boolean', value: true, description: 'Spawn a foam ring on impact' },
    ],
  },
  // ── Destruction ───────────────────────────────────────────────────────────
  {
    id: 'destruction_concrete',
    name: 'Concrete Fracture',
    category: 'destruction',
    emoji: '🧱',
    description: 'Voronoi-fractured concrete with dust and chunk dynamics.',
    tags: ['destruction', 'concrete', 'fracture', 'rbd'],
    params: [
      { name: 'chunkCount', label: 'Chunk Count', type: 'int', value: 150, min: 10, max: 2000, step: 10, description: 'Number of Voronoi fracture pieces' },
      { name: 'impactForce', label: 'Impact Force (N)', type: 'float', value: 1000, min: 1, max: 100000, step: 100, description: 'Applied impulse force' },
      { name: 'dustAmount', label: 'Dust Amount', type: 'float', value: 0.8, min: 0, max: 1, step: 0.01, description: 'Secondary dust particle amount' },
      { name: 'gravity', label: 'Gravity (m/s²)', type: 'float', value: 9.81, min: 0, max: 30, step: 0.1, description: 'Gravity applied to chunks' },
      { name: 'restitution', label: 'Restitution (bounciness)', type: 'float', value: 0.1, min: 0, max: 1, step: 0.01, description: 'Bounciness of chunks on impact' },
    ],
  },
  {
    id: 'destruction_glass',
    name: 'Glass Shatter',
    category: 'destruction',
    emoji: '🪟',
    description: 'Tempered glass breakage with spider-crack propagation.',
    tags: ['destruction', 'glass', 'fracture', 'vfx'],
    params: [
      { name: 'shardCount', label: 'Shard Count', type: 'int', value: 400, min: 20, max: 3000, step: 20, description: 'Number of glass shards' },
      { name: 'thickness', label: 'Glass Thickness (mm)', type: 'float', value: 6, min: 2, max: 25, step: 0.5, description: 'Thickness of the pane' },
      { name: 'impactPoint', label: 'Impact Point', type: 'vec3', value: [0.5, 0.5, 0], description: 'Normalised (x,y) impact location on pane' },
      { name: 'crackPropagation', label: 'Crack Spread Speed', type: 'float', value: 0.8, min: 0, max: 1, step: 0.01, description: 'How fast cracks spread outward' },
    ],
  },
  // ── Smoke ─────────────────────────────────────────────────────────────────
  {
    id: 'smoke_wisp',
    name: 'Thin Wisp',
    category: 'smoke',
    emoji: '💨',
    description: 'Gentle rising smoke wisp with curl noise movement.',
    tags: ['smoke', 'ambient', 'subtle'],
    params: [
      { name: 'density', label: 'Density', type: 'float', value: 0.15, min: 0, max: 1, step: 0.01, description: 'Volume opacity/density of the smoke' },
      { name: 'rise', label: 'Rise Speed (m/s)', type: 'float', value: 0.5, min: 0, max: 5, step: 0.05, description: 'Upward drift speed' },
      { name: 'curl', label: 'Curl Noise Strength', type: 'float', value: 0.4, min: 0, max: 2, step: 0.05, description: 'Turbulence from curl noise field' },
      { name: 'color', label: 'Smoke Color', type: 'color', value: [0.85, 0.85, 0.85], description: 'Base scattering color of smoke' },
    ],
  },
  // ── Particles ─────────────────────────────────────────────────────────────
  {
    id: 'particles_sparkle',
    name: 'Magic Sparkle',
    category: 'particles',
    emoji: '✨',
    description: 'Floating sparkle / fairy dust particles with glow.',
    tags: ['particles', 'magic', 'ui-vfx', 'hero'],
    params: [
      { name: 'count', label: 'Particle Count', type: 'int', value: 500, min: 10, max: 10000, step: 50, description: 'Total living particle count' },
      { name: 'emitRadius', label: 'Emit Radius (m)', type: 'float', value: 0.5, min: 0.01, max: 5, step: 0.05, description: 'Spawn area radius' },
      { name: 'lifetime', label: 'Lifetime (s)', type: 'float', value: 2.5, min: 0.1, max: 10, step: 0.1, description: 'Particle lifespan' },
      { name: 'speed', label: 'Speed (m/s)', type: 'float', value: 0.3, min: 0, max: 5, step: 0.05, description: 'Initial emission speed' },
      { name: 'colorA', label: 'Color A', type: 'color', value: [1, 0.85, 0.3], description: 'Start color' },
      { name: 'colorB', label: 'Color B', type: 'color', value: [0.4, 0.7, 1], description: 'End color' },
      { name: 'glowIntensity', label: 'Glow', type: 'float', value: 1.5, min: 0, max: 5, step: 0.1, description: 'Additive bloom/glow multiplier' },
    ],
  },
  // ── Fabric ────────────────────────────────────────────────────────────────
  {
    id: 'fabric_cloth',
    name: 'Cloth Drape',
    category: 'fabric',
    emoji: '🧣',
    description: 'Position-based dynamics cloth simulation with collision.',
    tags: ['fabric', 'cloth', 'dynamics', 'character'],
    params: [
      { name: 'stiffness', label: 'Stiffness', type: 'float', value: 0.8, min: 0, max: 1, step: 0.01, description: 'Structural spring stiffness' },
      { name: 'damping', label: 'Damping', type: 'float', value: 0.02, min: 0, max: 0.5, step: 0.005, description: 'Velocity damping coefficient' },
      { name: 'resolution', label: 'Grid Resolution', type: 'int', value: 32, min: 4, max: 128, step: 4, description: 'Cloth grid resolution (N×N verts)' },
      { name: 'windForce', label: 'Wind Force (N)', type: 'float', value: 0.5, min: 0, max: 10, step: 0.1, description: 'Applied wind force magnitude' },
      { name: 'selfCollision', label: 'Self Collision', type: 'boolean', value: true, description: 'Enable cloth self-collision detection' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a preset by id. Returns undefined if not found.
 */
export function getPreset(id: string): FxPreset | undefined {
  return FX_PRESETS.find(p => p.id === id);
}

/**
 * Filter presets by category.
 */
export function presetsByCategory(category: FxCategory): FxPreset[] {
  return FX_PRESETS.filter(p => p.category === category);
}

/**
 * Create a new FxSimulation from a preset id.
 */
export function createSimulation(
  presetId: string,
  name?: string,
  durationSeconds = 5,
  fps = 24
): FxSimulation {
  const preset = getPreset(presetId);
  if (!preset) throw new Error(`FX preset "${presetId}" not found.`);

  return {
    id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    presetId,
    name: name ?? preset.name,
    overrides: {},
    state: 'idle',
    elapsedSeconds: 0,
    durationSeconds,
    fps,
  };
}

/**
 * Apply a parameter override to a simulation.
 */
export function setSimParam(
  sim: FxSimulation,
  paramName: string,
  value: FxParam['value']
): FxSimulation {
  return { ...sim, overrides: { ...sim.overrides, [paramName]: value } };
}

/**
 * Get the effective parameter value (override if set, else preset default).
 */
export function getSimParam(sim: FxSimulation, paramName: string): FxParam['value'] | undefined {
  if (paramName in sim.overrides) return sim.overrides[paramName];
  const preset = getPreset(sim.presetId);
  return preset?.params.find(p => p.name === paramName)?.value;
}

/**
 * Reset all parameter overrides to preset defaults.
 */
export function resetSimParams(sim: FxSimulation): FxSimulation {
  return { ...sim, overrides: {} };
}

/**
 * Return all unique categories present in the preset catalogue.
 */
export function allCategories(): FxCategory[] {
  return [...new Set(FX_PRESETS.map(p => p.category))];
}
