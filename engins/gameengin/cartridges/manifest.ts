/**
 * engins/gameengin/cartridges/manifest.ts
 *
 * Server-safe catalog of every game in the repository, packaged as a
 * GameEngin cartridge entry. Pure data — no React, no client-only imports —
 * so it can be consumed by server components, tests, and the agent.
 *
 * Every game in `components/games/GamesHub#GAMES` MUST have a matching entry
 * here. The synchronisation is enforced by `tests/gameengin-cartridges.test.ts`.
 *
 * The actual runtime mounter lives in `./loaders.ts` (a `'use client'` module)
 * which dynamically imports each game component and wraps it as a
 * `GameCartridge` via `wrapAsCartridge`.
 */

export type CartridgeRenderMode = 'canvas' | 'webgpu' | 'babylon' | 'dom';

export interface CartridgeManifestEntry {
  /** Stable id — matches `GAMES[i].id` and the URL slug at /gameengin/cartridges/[id] */
  id: string;
  /** Display label — matches `GAMES[i].label` */
  label: string;
  /** Single-emoji icon */
  emoji: string;
  /** Genre / category bucket */
  category: string;
  /** Accent colour (hex) */
  color: string;
  /** Renderer the cartridge expects */
  renderMode: CartridgeRenderMode;
  /** Short tagline */
  subtitle?: string;
  /** Long-form description */
  description: string;
  /** Tier of system depth this cartridge represents on the platform */
  tier: 'flagship' | 'advanced' | 'classic' | 'casual';
}

export const CARTRIDGE_MANIFEST: readonly CartridgeManifestEntry[] = [
  // ── Flagship — Babylon.js / WebGPU / deep-systems ────────────────────────
  { id: 'platformer', label: 'MADMAXI', emoji: '🏎', category: 'Platformer', color: '#c8981a', renderMode: 'babylon', tier: 'flagship',
    subtitle: 'MADMAXI · Landing-grade robot hero',
    description: '150 levels · 15 zones · boss every 10 levels · unique each run — Babylon.js side-scroller rebuilt around the DREAMengin landing robot' },
  { id: 'neon-drift', label: 'Neon Drift', emoji: '🏎️', category: 'Racing', color: '#0ff', renderMode: 'webgpu', tier: 'flagship',
    subtitle: 'WebGPU · DualSense Ready',
    description: 'WebGPU cyberpunk racer — DualSense gyro steering, haptic feedback, high-performance 3D rendering' },
  { id: 'echo-arena', label: 'Echo Arena', emoji: '🎯', category: 'Shooter', color: '#a78bfa', renderMode: 'webgpu', tier: 'flagship',
    subtitle: 'WebGPU · DualSense Ready',
    description: 'WebGPU arena shooter — DualSense gyro aim, top-down combat, high-performance 3D rendering' },

  // ── Advanced — systems-heavy strategy / RPG ──────────────────────────────
  { id: 'engin-battle', label: 'ENGIN Battle', emoji: '⚙️', category: 'Strategy', color: '#38bdf8', renderMode: 'canvas', tier: 'advanced',
    subtitle: 'Dr. Eams · IDARi · Boogie',
    description: 'Age of Empires style — pick Dr. Eams, IDARi or Boogie; tech tree upgrades, 3-faction war' },
  { id: 'dreamquest', label: 'DREAMquest', emoji: '✨', category: 'RPG', color: '#a78bfa', renderMode: 'canvas', tier: 'advanced',
    subtitle: 'FF-style · 5 Dream Layers',
    description: 'FF7 + Chrono Trigger RPG — traverse 5 dream layers, unlock dream abilities, defeat the Dream Destroyer' },
  { id: 'dreamwars', label: 'DREAMwars', emoji: '🌙', category: 'Strategy', color: '#7c3aed', renderMode: 'canvas', tier: 'advanced',
    subtitle: 'Nightmares vs Dreamers',
    description: 'Nightmares vs Dreamers RTS — build base, harvest Dream Energy, crush the enemy HQ' },
  { id: 'rts', label: 'DREAM FORCE', emoji: '⚔️', category: 'Strategy', color: '#ef4444', renderMode: 'canvas', tier: 'advanced',
    subtitle: 'Command the Vanguard · Crush the Nightmare',
    description: 'Build your Dream base, harvest Dream Energy, command Vanguard units — crush the Nightmare HQ' },
  { id: 'tower-defense', label: 'Tower Defense', emoji: '🏰', category: 'Strategy', color: '#22c55e', renderMode: 'canvas', tier: 'advanced',
    description: 'Place arrow, cannon & freeze towers to stop 10 waves of enemies' },
  { id: 'rpg', label: 'DREAM REALM QUEST', emoji: '🗡️', category: 'RPG', color: '#c084fc', renderMode: 'dom', tier: 'advanced',
    subtitle: '5 Dream Realms · Turn-Based Combat',
    description: 'Turn-based adventure through 5 Dream Realms — battle Nightmare creatures, level up abilities, defeat the Dream Destroyer' },
  { id: 'lucid-avenue', label: 'Lucid Avenue', emoji: '🌴', category: 'Adventure', color: '#f59e0b', renderMode: 'dom', tier: 'advanced',
    description: 'Original LA-inspired retro city quest — expanded 8-district GameEngin-linked city run with free-roam sandbox jumps, vehicle systems, persistent route contracts, west-side missions, and an observatory skyline finale' },

  // ── Classic — arcade and puzzle staples ──────────────────────────────────
  { id: 'space-shooter', label: 'VOID STRIKE', emoji: '🚀', category: 'Arcade', color: '#60a5fa', renderMode: 'canvas', tier: 'classic',
    subtitle: 'Defend the Dream Realm',
    description: 'Defend the Dream Realm from Void-spawn invaders — auto-fire, dodge plasma bolts, survive endless waves' },
  { id: 'snake', label: 'SHADOW SERPENT', emoji: '🐍', category: 'Arcade', color: '#4ade80', renderMode: 'canvas', tier: 'classic',
    description: 'Guide the Shadow Serpent through the Dream Grid — consume Dream Sparks, grow longer, never cross your own tail' },
  { id: 'breakout', label: 'DREAM BREAKER', emoji: '💎', category: 'Arcade', color: '#3b82f6', renderMode: 'canvas', tier: 'classic',
    description: 'Launch the Orb of Light — shatter the Nightmare Wall, recover the Dream Fragments' },
  { id: 'tetris', label: 'BLOCK STACK', emoji: '🟦', category: 'Puzzle', color: '#06b6d4', renderMode: 'canvas', tier: 'classic',
    description: 'Dream shards rain from the sky — stack them perfectly, clear layers, defy the collapse' },
  { id: 'match3', label: 'DREAM GEMS', emoji: '💎', category: 'Puzzle', color: '#a78bfa', renderMode: 'dom', tier: 'classic',
    description: 'Swap Dream shards to match 3 or more — chain combos, collect Dream Energy, 30 moves to master it' },
  { id: 'racing', label: 'DREAM CIRCUIT', emoji: '🏎️', category: 'Sports', color: '#3b82f6', renderMode: 'canvas', tier: 'classic',
    description: '3-lap Dream Circuit sprint — race 2 rival Engin AIs around neon canyon tracks, WASD/arrows' },
  { id: 'chess', label: 'ENGIN CHESS', emoji: '♛', category: 'Board', color: '#f5f5f4', renderMode: 'dom', tier: 'classic',
    description: '2-player local chess — full piece movement rules, click to select & move' },
  { id: 'rhythm', label: 'BEAT ENGINE', emoji: '🎵', category: 'Music', color: '#a78bfa', renderMode: 'canvas', tier: 'classic',
    description: 'Hit the Dream beats as they fall — ASDK keys or on-screen pads, chain combos to awaken the Dream' },
  { id: 'maze', label: 'LABYRINTH ZERO', emoji: '🌀', category: 'Adventure', color: '#38bdf8', renderMode: 'canvas', tier: 'classic',
    description: 'Navigate the procedural Dream Labyrinth — escape before the Nightmare closes in' },
  { id: 'pong', label: 'DREAM PONG', emoji: '🏓', category: 'Sports', color: '#22d3ee', renderMode: 'canvas', tier: 'classic',
    description: 'Classic Pong — 2-player local or vs AI; be the first to 7 points' },
  { id: 'minesweeper', label: 'DREAM SWEEP', emoji: '💣', category: 'Puzzle', color: '#6b7280', renderMode: 'dom', tier: 'classic',
    description: 'Classic minesweeper — 12×16 grid, 28 mines, flag all threats to win' },
  { id: 'solitaire', label: 'DREAM SOLITAIRE', emoji: '🃏', category: 'Board', color: '#10b981', renderMode: 'dom', tier: 'classic',
    description: 'Classic Klondike solitaire — build all four suits from Ace to King' },

  // ── Casual — quick-play / party ──────────────────────────────────────────
  { id: 'flappy', label: 'NITE FLYER', emoji: '✨', category: 'Casual', color: '#a78bfa', renderMode: 'canvas', tier: 'casual',
    description: 'Dr. Eams soars through the neon Dream-scape — tap to flap, dodge the Nightmare gates' },
  { id: 'memory-grid', label: 'MEMORY GRID', emoji: '🃏', category: 'Puzzle', color: '#f59e0b', renderMode: 'dom', tier: 'casual',
    description: 'Flip cards to match emoji pairs — clear the full 4×4 grid to win' },
  { id: 'word-sprint', label: 'WORD SPRINT', emoji: '📝', category: 'Casual', color: '#f472b6', renderMode: 'dom', tier: 'casual',
    description: 'Type the falling words before time runs out — chain combos for bonus points' },
  { id: 'speed-tap', label: 'SPEED TAP', emoji: '👆', category: 'Casual', color: '#fb923c', renderMode: 'dom', tier: 'casual',
    description: 'Tap as fast as you can in 10 seconds — beat your personal best' },
  { id: 'trivia', label: 'DREAM TRIVIA', emoji: '🧠', category: 'Casual', color: '#818cf8', renderMode: 'dom', tier: 'casual',
    description: 'Ten-question trivia sprint — science, history, pop-culture, and code' },
  { id: 'avatar-maker', label: 'AVATAR MAKER', emoji: '🎨', category: 'Creative', color: '#e879f9', renderMode: 'dom', tier: 'casual',
    description: 'Build your DREAMengin avatar — pick skin, hair, outfit and expression' },
];

/** Quick lookup by id. Returns undefined if no cartridge with that id exists. */
export function getCartridgeManifest(id: string): CartridgeManifestEntry | undefined {
  return CARTRIDGE_MANIFEST.find((c) => c.id === id);
}

/** Distinct categories preserved in manifest order. */
export function getCartridgeCategories(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of CARTRIDGE_MANIFEST) {
    if (!seen.has(c.category)) { seen.add(c.category); out.push(c.category); }
  }
  return out;
}
