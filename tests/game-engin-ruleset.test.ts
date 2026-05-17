/**
 * tests/game-engin-ruleset.test.ts
 *
 * Unit tests for the GameEngin rule-set:
 *   - Layout parameters
 *   - Session start/end transforms
 *   - Score progression (add, share, load)
 *   - World builder (save)
 *   - Physics config apply
 *   - Script save
 *   - Constraints (invalid session, negative score, bad physics)
 *   - deriveState projection
 */

import { describe, it, expect } from 'vitest';
import { createBaseState } from '@/lib/engin-runtime/EnginBaseState';
import { GAME_ENGIN_RULE_SET, GRAVITY_VALUES } from '@/lib/engins/game/gameEnginRuleSet';
import type { GameEnginAction, GameScore } from '@/lib/engins/game/gameEnginRuleSet';
import type { EnginBaseState } from '@/lib/engin-runtime/EnginBaseState';

function makeState(): EnginBaseState {
  return createBaseState('games');
}

function dispatch(state: EnginBaseState, action: GameEnginAction): EnginBaseState {
  return GAME_ENGIN_RULE_SET.transform(state, action);
}

function check(state: EnginBaseState, action: GameEnginAction) {
  for (const c of GAME_ENGIN_RULE_SET.constraints) {
    const r = c(state, action);
    if (!r.valid) return r;
  }
  return { valid: true };
}

// --- Parameters ---------------------------------------------------------------

describe('GAME_ENGIN_RULE_SET parameters', () => {
  it('enginId is "games"', () => {
    expect(GAME_ENGIN_RULE_SET.params.enginId).toBe('games');
  });

  it('layoutMode is "immersive"', () => {
    expect(GAME_ENGIN_RULE_SET.params.layoutMode).toBe('immersive');
  });

  it('accentColor is set', () => {
    expect(GAME_ENGIN_RULE_SET.params.accentColor).toBeTruthy();
  });

  it('requires essential capabilities', () => {
    const caps = GAME_ENGIN_RULE_SET.requiredCapabilities;
    expect(caps).toContain('state:read');
    expect(caps).toContain('state:write');
    expect(caps).toContain('session:start');
    expect(caps).toContain('scores:read');
  });
});

// --- GRAVITY_VALUES -----------------------------------------------------------

describe('GRAVITY_VALUES', () => {
  it('exports gravity multipliers for all four presets', () => {
    expect(GRAVITY_VALUES.moon).toBeLessThan(1);
    expect(GRAVITY_VALUES.earth).toBe(1.0);
    expect(GRAVITY_VALUES.mars).toBeGreaterThan(0);
    expect(GRAVITY_VALUES.jupiter).toBeGreaterThan(1);
  });
});

// --- Session start / end ------------------------------------------------------

describe('session transforms', () => {
  it('game:session-start sets activeGame and transitions to running', () => {
    const next = dispatch(makeState(), { type: 'game:session-start', payload: { gameId: 'platformer' } });
    const derived = GAME_ENGIN_RULE_SET.deriveState(next);
    expect(derived.activeGame).toBe('platformer');
    expect(derived.lifecycle).toBe('running');
  });

  it('game:session-end clears activeGame and transitions to idle', () => {
    let s = makeState();
    s = dispatch(s, { type: 'game:session-start', payload: { gameId: 'platformer' } });
    s = dispatch(s, { type: 'game:session-end', payload: { gameId: 'platformer' } });
    const derived = GAME_ENGIN_RULE_SET.deriveState(s);
    expect(derived.activeGame).toBeNull();
    expect(derived.lifecycle).toBe('idle');
  });

  it('game:select updates selectedGame', () => {
    const next = dispatch(makeState(), { type: 'game:select', payload: { gameId: 'chess' } });
    expect(GAME_ENGIN_RULE_SET.deriveState(next).selectedGame).toBe('chess');
  });

  it('constraint: game:session-start rejects empty gameId', () => {
    const result = check(makeState(), { type: 'game:session-start', payload: { gameId: '' } });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('gameId');
  });
});

// --- Score progression --------------------------------------------------------

describe('score transforms', () => {
  const testScore: GameScore = {
    id: 'score-1',
    game: 'platformer',
    score: 5000,
    created_at: '2026-01-01T00:00:00Z',
    shared: false,
  };

  it('game:score-add adds a score', () => {
    const next = dispatch(makeState(), { type: 'game:score-add', payload: { score: testScore } });
    const derived = GAME_ENGIN_RULE_SET.deriveState(next);
    expect(derived.scores).toHaveLength(1);
    expect(derived.scores[0].score).toBe(5000);
  });

  it('game:score-add sorts scores descending', () => {
    let s = makeState();
    s = dispatch(s, { type: 'game:score-add', payload: { score: { ...testScore, id: 's1', score: 1000 } } });
    s = dispatch(s, { type: 'game:score-add', payload: { score: { ...testScore, id: 's2', score: 9000 } } });
    s = dispatch(s, { type: 'game:score-add', payload: { score: { ...testScore, id: 's3', score: 5000 } } });
    const derived = GAME_ENGIN_RULE_SET.deriveState(s);
    expect(derived.scores[0].score).toBe(9000);
    expect(derived.scores[1].score).toBe(5000);
    expect(derived.scores[2].score).toBe(1000);
  });

  it('game:score-add caps at 20 scores', () => {
    let s = makeState();
    for (let i = 0; i < 25; i++) {
      s = dispatch(s, { type: 'game:score-add', payload: { score: { ...testScore, id: `s${i}`, score: i * 100 } } });
    }
    expect(GAME_ENGIN_RULE_SET.deriveState(s).scores).toHaveLength(20);
  });

  it('game:score-shared marks a score as shared', () => {
    let s = makeState();
    s = dispatch(s, { type: 'game:score-add', payload: { score: testScore } });
    s = dispatch(s, { type: 'game:score-shared', payload: { scoreId: 'score-1' } });
    const derived = GAME_ENGIN_RULE_SET.deriveState(s);
    expect(derived.scores[0].shared).toBe(true);
  });

  it('game:scores-loaded replaces the scores array', () => {
    let s = makeState();
    s = dispatch(s, { type: 'game:score-add', payload: { score: testScore } });
    const newScores: GameScore[] = [
      { id: 'x1', game: 'chess', score: 3000, created_at: '2026-01-01T00:00:00Z', shared: false },
    ];
    s = dispatch(s, { type: 'game:scores-loaded', payload: { scores: newScores } });
    expect(GAME_ENGIN_RULE_SET.deriveState(s).scores).toEqual(newScores);
  });

  it('constraint: game:score-add rejects negative score', () => {
    const result = check(makeState(), { type: 'game:score-add', payload: { score: { ...testScore, score: -1 } } });
    expect(result.valid).toBe(false);
  });
});

// --- World Builder ------------------------------------------------------------

describe('world builder transform', () => {
  it('game:world-save persists the world', () => {
    const world = { name: 'TestWorld', grid: [['empty' as const]] };
    const next = dispatch(makeState(), { type: 'game:world-save', payload: { world } });
    const derived = GAME_ENGIN_RULE_SET.deriveState(next);
    expect(derived.savedWorld?.name).toBe('TestWorld');
  });
});

// --- Physics Config -----------------------------------------------------------

describe('physics config transform', () => {
  it('game:physics-apply updates physicsConfig', () => {
    const next = dispatch(makeState(), { type: 'game:physics-apply', payload: { config: { gravity: 'moon', friction: 20 } } });
    const derived = GAME_ENGIN_RULE_SET.deriveState(next);
    expect(derived.physicsConfig.gravity).toBe('moon');
    expect(derived.physicsConfig.friction).toBe(20);
  });

  it('constraint: rejects unknown gravity preset', () => {
    const result = check(makeState(), { type: 'game:physics-apply', payload: { config: { gravity: 'saturn' as never, friction: 50 } } });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('gravity');
  });

  it('constraint: rejects friction > 100', () => {
    const result = check(makeState(), { type: 'game:physics-apply', payload: { config: { gravity: 'earth', friction: 101 } } });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Friction');
  });

  it('constraint: rejects friction < 0', () => {
    const result = check(makeState(), { type: 'game:physics-apply', payload: { config: { gravity: 'earth', friction: -1 } } });
    expect(result.valid).toBe(false);
  });
});

// --- Script save --------------------------------------------------------------

describe('script save transform', () => {
  it('game:script-save persists code and language', () => {
    const next = dispatch(makeState(), { type: 'game:script-save', payload: { code: 'console.log("hi")', language: 'GameScript' } });
    const derived = GAME_ENGIN_RULE_SET.deriveState(next);
    expect(derived.scriptState.code).toBe('console.log("hi")');
    expect(derived.scriptState.language).toBe('GameScript');
  });
});

// --- Control profile ----------------------------------------------------------

describe('control profile transform', () => {
  it('game:control-profile updates controlProfile', () => {
    const next = dispatch(makeState(), { type: 'game:control-profile', payload: { profile: 'competitive' } });
    expect(GAME_ENGIN_RULE_SET.deriveState(next).controlProfile).toBe('competitive');
  });
});

// --- Immersive toggle ---------------------------------------------------------

describe('immersive toggle', () => {
  it('game:immersive-toggle sets isImmersive', () => {
    const next = dispatch(makeState(), { type: 'game:immersive-toggle', payload: { value: true } });
    expect(GAME_ENGIN_RULE_SET.deriveState(next).isImmersive).toBe(true);
  });
});

// --- deriveState defaults -----------------------------------------------------

describe('deriveState defaults', () => {
  it('returns safe defaults on empty domain', () => {
    const derived = GAME_ENGIN_RULE_SET.deriveState(makeState());
    expect(derived.scores).toEqual([]);
    expect(derived.activeGame).toBeNull();
    expect(derived.selectedGame).toBe('platformer');
    expect(derived.savedWorld).toBeNull();
    expect(derived.physicsConfig).toEqual({ gravity: 'earth', friction: 50 });
    expect(derived.isImmersive).toBe(false);
    expect(derived.controlProfile).toBe('couch');
  });
});
