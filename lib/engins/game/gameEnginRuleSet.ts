/**
 * lib/engins/game/gameEnginRuleSet.ts
 *
 * GameEngin Rule-Set — the ONLY place GameEngin domain logic lives.
 *
 * Contains:
 *   - Layout parameters (immersive vs standard)
 *   - Allowed capabilities for GameEngin
 *   - All state transforms (session start/end, score updates, world builder,
 *     physics config, script state)
 *   - deriveState() selector — projects base state into GameEnginDerivedState
 *
 * ZERO infrastructure here: no fetch, no Supabase, no localStorage.
 * The EnginRuntime handles all of that.
 *
 * Architecture: docs/AGENT_PLAYBOOK.md §1 — Foundation.Ruleset.
 */

import type {
  EnginAction,
  EnginRuleSetContract,
  EnginRuleSetParams,
  EnginConstraint,
  ConstraintResult,
} from '@/lib/engin-runtime/EnginRuleSetContract';
import {
  patchBaseState,
  type EnginBaseState,
} from '@/lib/engin-runtime/EnginBaseState';
import type { EnginCapability } from '@/lib/engin-runtime/EnginCapabilities';

// ─── Tile types ───────────────────────────────────────────────────────────────

export type TileType = 'empty' | 'ground' | 'wall' | 'water' | 'spawn';

// ─── Gravity presets ──────────────────────────────────────────────────────────

export type GravityPreset = 'moon' | 'earth' | 'mars' | 'jupiter';
export const GRAVITY_VALUES: Record<GravityPreset, number> = {
  moon: 0.10,
  earth: 1.0,
  mars: 0.38,
  jupiter: 2.53,
};

// ─── Script language ──────────────────────────────────────────────────────────

export type ScriptLanguage = 'GameScript' | 'Lua';

// ─── Domain state shape ───────────────────────────────────────────────────────

export interface GameScore {
  id: string;
  game: string;
  score: number;
  created_at: string;
  shared: boolean;
}

export interface WorldState {
  name: string;
  grid: TileType[][];
}

export interface PhysicsConfig {
  gravity: GravityPreset;
  friction: number;
}

export interface ScriptState {
  code: string;
  language: ScriptLanguage;
}

/** The domain-specific state shape exposed to GameEngin UI. */
export interface GameEnginDerivedState extends Record<string, unknown> {
  lifecycle: EnginBaseState['lifecycle'];
  scores: GameScore[];
  activeGame: string | null;
  selectedGame: string;
  savedWorld: WorldState | null;
  physicsConfig: PhysicsConfig;
  scriptState: ScriptState;
  isImmersive: boolean;
  controlProfile: string;
}

// ─── Action discriminated union ───────────────────────────────────────────────

export type GameEnginAction =
  | EnginAction<'game:session-start',  { gameId: string }>
  | EnginAction<'game:session-end',    { gameId: string }>
  | EnginAction<'game:select',         { gameId: string }>
  | EnginAction<'game:score-add',      { score: GameScore }>
  | EnginAction<'game:score-shared',   { scoreId: string }>
  | EnginAction<'game:scores-loaded',  { scores: GameScore[] }>
  | EnginAction<'game:world-save',     { world: WorldState }>
  | EnginAction<'game:physics-apply',  { config: PhysicsConfig }>
  | EnginAction<'game:script-save',    { code: string; language: ScriptLanguage }>
  | EnginAction<'game:control-profile', { profile: string }>
  | EnginAction<'game:immersive-toggle', { value: boolean }>;

// ─── Default domain state ─────────────────────────────────────────────────────

const DEFAULT_GRID: TileType[][] = Array.from({ length: 5 }, () =>
  Array.from({ length: 5 }, (): TileType => 'empty'),
);

const DEFAULT_DOMAIN: Omit<GameEnginDerivedState, 'lifecycle'> = {
  scores: [],
  activeGame: null,
  selectedGame: 'platformer',
  savedWorld: null,
  physicsConfig: { gravity: 'earth', friction: 50 },
  scriptState: {
    code: `// Game script — triggers on player action\n// emit('games', 'games:bpm-sync-request', { targetBpm: 120 })`,
    language: 'GameScript',
  },
  isImmersive: false,
  controlProfile: 'couch',
};

// ─── Constraints ──────────────────────────────────────────────────────────────

const sessionStartConstraint: EnginConstraint<GameEnginAction> = (
  _state,
  action,
): ConstraintResult => {
  if (action.type !== 'game:session-start') return { valid: true };
  const { gameId } = (action as EnginAction<'game:session-start', { gameId: string }>).payload ?? {};
  if (!gameId || typeof gameId !== 'string' || gameId.trim() === '') {
    return { valid: false, reason: 'game:session-start requires a non-empty gameId.' };
  }
  return { valid: true };
};

const scoreConstraint: EnginConstraint<GameEnginAction> = (
  _state,
  action,
): ConstraintResult => {
  if (action.type !== 'game:score-add') return { valid: true };
  const { score } = (action as EnginAction<'game:score-add', { score: GameScore }>).payload ?? {};
  if (!score || typeof score.score !== 'number' || score.score < 0) {
    return { valid: false, reason: 'game:score-add requires a non-negative numeric score.' };
  }
  return { valid: true };
};

const physicsConstraint: EnginConstraint<GameEnginAction> = (
  _state,
  action,
): ConstraintResult => {
  if (action.type !== 'game:physics-apply') return { valid: true };
  const { config } = (action as EnginAction<'game:physics-apply', { config: PhysicsConfig }>).payload ?? {};
  if (!config) return { valid: false, reason: 'game:physics-apply requires a config object.' };
  if (!Object.keys(GRAVITY_VALUES).includes(config.gravity)) {
    return { valid: false, reason: `Unknown gravity preset: ${config.gravity}` };
  }
  if (config.friction < 0 || config.friction > 100) {
    return { valid: false, reason: 'Friction must be between 0 and 100.' };
  }
  return { valid: true };
};

// ─── Transform ────────────────────────────────────────────────────────────────

function transform(state: EnginBaseState, action: GameEnginAction): EnginBaseState {
  const domain = (state.domain as Partial<typeof DEFAULT_DOMAIN>);

  switch (action.type) {
    case 'game:session-start': {
      const { gameId } = (action as EnginAction<'game:session-start', { gameId: string }>).payload!;
      return patchBaseState(state, {
        lifecycle: 'running',
        domain: { ...domain, activeGame: gameId },
      });
    }

    case 'game:session-end': {
      return patchBaseState(state, {
        lifecycle: 'idle',
        domain: { ...domain, activeGame: null },
      });
    }

    case 'game:select': {
      const { gameId } = (action as EnginAction<'game:select', { gameId: string }>).payload!;
      return patchBaseState(state, {
        domain: { ...domain, selectedGame: gameId },
      });
    }

    case 'game:score-add': {
      const { score } = (action as EnginAction<'game:score-add', { score: GameScore }>).payload!;
      const prev = (domain.scores ?? []) as GameScore[];
      const updated = [...prev, score]
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
      return patchBaseState(state, { domain: { ...domain, scores: updated } });
    }

    case 'game:score-shared': {
      const { scoreId } = (action as EnginAction<'game:score-shared', { scoreId: string }>).payload!;
      const prev = (domain.scores ?? []) as GameScore[];
      return patchBaseState(state, {
        domain: {
          ...domain,
          scores: prev.map((s) => s.id === scoreId ? { ...s, shared: true } : s),
        },
      });
    }

    case 'game:scores-loaded': {
      const { scores } = (action as EnginAction<'game:scores-loaded', { scores: GameScore[] }>).payload!;
      return patchBaseState(state, { domain: { ...domain, scores } });
    }

    case 'game:world-save': {
      const { world } = (action as EnginAction<'game:world-save', { world: WorldState }>).payload!;
      return patchBaseState(state, { domain: { ...domain, savedWorld: world } });
    }

    case 'game:physics-apply': {
      const { config } = (action as EnginAction<'game:physics-apply', { config: PhysicsConfig }>).payload!;
      return patchBaseState(state, { domain: { ...domain, physicsConfig: config } });
    }

    case 'game:script-save': {
      const { code, language } = (action as EnginAction<'game:script-save', { code: string; language: ScriptLanguage }>).payload!;
      return patchBaseState(state, { domain: { ...domain, scriptState: { code, language } } });
    }

    case 'game:control-profile': {
      const { profile } = (action as EnginAction<'game:control-profile', { profile: string }>).payload!;
      return patchBaseState(state, { domain: { ...domain, controlProfile: profile } });
    }

    case 'game:immersive-toggle': {
      const { value } = (action as EnginAction<'game:immersive-toggle', { value: boolean }>).payload!;
      return patchBaseState(state, { domain: { ...domain, isImmersive: value } });
    }

    default:
      return state;
  }
}

// ─── deriveState ──────────────────────────────────────────────────────────────

function deriveState(state: EnginBaseState): GameEnginDerivedState {
  const d = state.domain as Partial<typeof DEFAULT_DOMAIN>;
  return {
    lifecycle: state.lifecycle,
    scores: (d.scores ?? DEFAULT_DOMAIN.scores) as GameScore[],
    activeGame: (d.activeGame ?? DEFAULT_DOMAIN.activeGame) as string | null,
    selectedGame: (d.selectedGame ?? DEFAULT_DOMAIN.selectedGame) as string,
    savedWorld: (d.savedWorld ?? DEFAULT_DOMAIN.savedWorld) as WorldState | null,
    physicsConfig: (d.physicsConfig ?? DEFAULT_DOMAIN.physicsConfig) as PhysicsConfig,
    scriptState: (d.scriptState ?? DEFAULT_DOMAIN.scriptState) as ScriptState,
    isImmersive: (d.isImmersive ?? DEFAULT_DOMAIN.isImmersive) as boolean,
    controlProfile: (d.controlProfile ?? DEFAULT_DOMAIN.controlProfile) as string,
  };
}

// ─── Rule-set params ──────────────────────────────────────────────────────────

const PARAMS: EnginRuleSetParams = {
  enginId: 'games',
  name: 'GameEngin',
  layoutMode: 'immersive',
  accentColor: '#c8981a',
  defaultGrid: DEFAULT_GRID,
};

const REQUIRED_CAPABILITIES: ReadonlyArray<EnginCapability> = [
  'state:read',
  'state:write',
  'session:start',
  'session:end',
  'scores:read',
  'scores:publish',
  'world:edit',
  'world:save',
  'bridge:emit',
];

// ─── Exported rule-set ────────────────────────────────────────────────────────

export const GAME_ENGIN_RULE_SET: EnginRuleSetContract<GameEnginAction> = {
  params: PARAMS,
  requiredCapabilities: REQUIRED_CAPABILITIES,
  constraints: [sessionStartConstraint, scoreConstraint, physicsConstraint],
  transform,
  deriveState,
};
