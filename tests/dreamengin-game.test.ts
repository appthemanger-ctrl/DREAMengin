// tests/dreamengin-game.test.ts
// Unit tests for the Dr. Eams platformer game engine (pure logic, no browser).

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlayer,
  createGameState,
  createLevel,
  applyGravity,
  applyInput,
  resolvePlayerPlatformCollisions,
  checkCoinCollection,
  checkEnemyCollisions,
  updateEnemies,
  spawnCoinBurst,
  spawnDeathBurst,
  overlaps,
  stepGame,
  GRAVITY,
  JUMP_VY,
  WALK_SPD,
  MAX_FALL,
  PLAYER_W,
  PLAYER_H,
  GROUND_Y,
  CANVAS_H,
  type Platform,
  type Coin,
  type Enemy,
  type InputState,
  type Particle,
} from '@/lib/game/dreamengin-game';

// ── Helpers ───────────────────────────────────────────────────────────────────
function noInput(): InputState {
  return { left: false, right: false, jump: false, jumpJustPressed: false };
}

function jumpInput(): InputState {
  return { left: false, right: false, jump: true, jumpJustPressed: true };
}

function solidPlatform(x: number, y: number, w: number, h: number): Platform {
  return { x, y, w, h, type: 'solid' };
}

function makeCoin(x: number, y: number, value = 10, isGoal = false): Coin {
  return { x, y, w: 18, h: 18, collected: false, value, isGoal, animTick: 0 };
}

function makeEnemy(x: number, y: number): Enemy {
  return { x, y, w: 32, h: 32, vx: -1.2, vy: 0, alive: true, facingRight: false, stomped: false, stompTimer: 0 };
}

// ── overlaps ──────────────────────────────────────────────────────────────────
describe('overlaps', () => {
  it('returns true when rects overlap', () => {
    expect(overlaps({ x: 0, y: 0, w: 20, h: 20 }, { x: 10, y: 10, w: 20, h: 20 })).toBe(true);
  });

  it('returns false when rects are adjacent (touching but not overlapping)', () => {
    expect(overlaps({ x: 0, y: 0, w: 20, h: 20 }, { x: 20, y: 0, w: 20, h: 20 })).toBe(false);
  });

  it('returns false when rects are completely apart', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 50, y: 50, w: 10, h: 10 })).toBe(false);
  });
});

// ── createPlayer ──────────────────────────────────────────────────────────────
describe('createPlayer', () => {
  it('initialises at given position with correct dimensions', () => {
    const p = createPlayer(100, 200);
    expect(p.x).toBe(100);
    expect(p.y).toBe(200);
    expect(p.w).toBe(PLAYER_W);
    expect(p.h).toBe(PLAYER_H);
  });

  it('starts stationary, grounded flag false, alive true', () => {
    const p = createPlayer(0, 0);
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
    expect(p.onGround).toBe(false);
    expect(p.alive).toBe(true);
    expect(p.jumpCount).toBe(0);
    expect(p.invincible).toBe(0);
  });
});

// ── applyGravity ──────────────────────────────────────────────────────────────
describe('applyGravity', () => {
  it('increments vy by GRAVITY each call', () => {
    const p = createPlayer(0, 0);
    applyGravity(p);
    expect(p.vy).toBeCloseTo(GRAVITY);
    applyGravity(p);
    expect(p.vy).toBeCloseTo(GRAVITY * 2);
  });

  it('caps vy at MAX_FALL', () => {
    const p = createPlayer(0, 0);
    for (let i = 0; i < 100; i++) applyGravity(p);
    expect(p.vy).toBe(MAX_FALL);
  });
});

// ── applyInput ────────────────────────────────────────────────────────────────
describe('applyInput', () => {
  it('moves right at WALK_SPD when right is held', () => {
    const p = createPlayer(0, 0);
    applyInput(p, { left: false, right: true, jump: false, jumpJustPressed: false });
    expect(p.vx).toBe(WALK_SPD);
    expect(p.facingRight).toBe(true);
  });

  it('moves left at -WALK_SPD when left is held', () => {
    const p = createPlayer(0, 0);
    applyInput(p, { left: true, right: false, jump: false, jumpJustPressed: false });
    expect(p.vx).toBe(-WALK_SPD);
    expect(p.facingRight).toBe(false);
  });

  it('applies jump velocity from ground', () => {
    const p = createPlayer(0, 0);
    p.onGround = true;
    applyInput(p, jumpInput());
    expect(p.vy).toBe(JUMP_VY);
    expect(p.onGround).toBe(false);
    expect(p.jumpCount).toBe(1);
  });

  it('allows double jump from air (jumpCount 1 → 2)', () => {
    const p = createPlayer(0, 0);
    p.onGround = false;
    p.jumpCount = 1;
    applyInput(p, jumpInput());
    expect(p.vy).toBeCloseTo(JUMP_VY * 0.85);
    expect(p.jumpCount).toBe(2);
  });

  it('does NOT allow triple jump (jumpCount already 2)', () => {
    const p = createPlayer(0, 0);
    p.onGround = false;
    p.jumpCount = 2;
    p.vy = 5;
    applyInput(p, jumpInput());
    expect(p.vy).toBe(5); // unchanged
  });

  it('applies friction when no horizontal input', () => {
    const p = createPlayer(0, 0);
    p.vx = 10;
    applyInput(p, noInput());
    expect(p.vx).toBeLessThan(10);
    expect(p.vx).toBeGreaterThan(0);
  });

  it('clamps vx to zero below threshold after friction', () => {
    const p = createPlayer(0, 0);
    p.vx = 0.1;
    applyInput(p, noInput());
    expect(p.vx).toBe(0);
  });
});

// ── resolvePlayerPlatformCollisions ──────────────────────────────────────────
describe('resolvePlayerPlatformCollisions', () => {
  it('lands player on top of platform when falling', () => {
    const p = createPlayer(50, 90);
    p.vy = 5;
    const plat = solidPlatform(0, 100, 200, 20);
    resolvePlayerPlatformCollisions(p, [plat]);
    expect(p.y).toBe(100 - PLAYER_H);
    expect(p.vy).toBe(0);
    expect(p.onGround).toBe(true);
  });

  it('resets jumpCount on landing', () => {
    const p = createPlayer(50, 90);
    p.vy = 5;
    p.jumpCount = 2;
    resolvePlayerPlatformCollisions(p, [solidPlatform(0, 100, 200, 20)]);
    expect(p.jumpCount).toBe(0);
  });

  it('stops upward movement on ceiling hit', () => {
    const p = createPlayer(50, 40);
    p.vy = -10;
    // Platform is *above* the player (player hits ceiling from below)
    const ceil = solidPlatform(0, 0, 200, 30);
    // Position player below ceiling but overlapping
    p.y = 5; // overlapping with ceil (ceil y=0, h=30)
    resolvePlayerPlatformCollisions(p, [ceil]);
    expect(p.vy).toBe(0);
  });

  it('flags onGround false when not touching any platform', () => {
    const p = createPlayer(0, 0);
    p.onGround = true;
    resolvePlayerPlatformCollisions(p, [solidPlatform(1000, 1000, 20, 20)]);
    expect(p.onGround).toBe(false);
  });
});

// ── checkCoinCollection ───────────────────────────────────────────────────────
describe('checkCoinCollection', () => {
  it('returns 0 when player is not near any coins', () => {
    const p = createPlayer(0, 0);
    const coins = [makeCoin(500, 500)];
    expect(checkCoinCollection(p, coins)).toBe(0);
  });

  it('collects coin and returns its value', () => {
    const p = createPlayer(10, 10);
    const coins = [makeCoin(10, 10, 10)];
    expect(checkCoinCollection(p, coins)).toBe(10);
    expect(coins[0].collected).toBe(true);
  });

  it('does not collect already-collected coins', () => {
    const p = createPlayer(10, 10);
    const coins = [makeCoin(10, 10, 10)];
    coins[0].collected = true;
    expect(checkCoinCollection(p, coins)).toBe(0);
  });

  it('collects multiple coins in range', () => {
    const p = createPlayer(10, 10);
    const coins = [makeCoin(10, 10, 10), makeCoin(15, 10, 20), makeCoin(500, 500, 10)];
    expect(checkCoinCollection(p, coins)).toBe(30);
    expect(coins[0].collected).toBe(true);
    expect(coins[1].collected).toBe(true);
    expect(coins[2].collected).toBe(false);
  });

  it('collects goal coin with correct value', () => {
    const p = createPlayer(10, 10);
    const coins = [makeCoin(10, 10, 500, true)];
    expect(checkCoinCollection(p, coins)).toBe(500);
    expect(coins[0].collected).toBe(true);
    expect(coins[0].isGoal).toBe(true);
  });
});

// ── checkEnemyCollisions ──────────────────────────────────────────────────────
describe('checkEnemyCollisions', () => {
  it('returns false when not overlapping any enemy', () => {
    const p = createPlayer(0, 0);
    const enemies = [makeEnemy(500, 500)];
    const hit = checkEnemyCollisions(p, enemies, () => {});
    expect(hit).toBe(false);
  });

  it('returns true when player side-collides with enemy', () => {
    const p = createPlayer(10, 10);
    p.vy = 0; // not falling → not stomping
    const enemies = [makeEnemy(10, 10)];
    const hit = checkEnemyCollisions(p, enemies, () => {});
    expect(hit).toBe(true);
  });

  it('stomps enemy and calls onStomp callback when falling from above', () => {
    const p = createPlayer(10, 5);
    p.vy = 6;
    const enemies = [makeEnemy(10, 25)]; // enemy just below
    let stomped = false;
    const hit = checkEnemyCollisions(p, enemies, () => { stomped = true; });
    expect(hit).toBe(false);
    expect(stomped).toBe(true);
    expect(enemies[0].stomped).toBe(true);
    expect(p.vy).toBe(-8); // bounce
  });

  it('returns false (invincible) when player has invincibility frames', () => {
    const p = createPlayer(10, 10);
    p.invincible = 30;
    const enemies = [makeEnemy(10, 10)];
    expect(checkEnemyCollisions(p, enemies, () => {})).toBe(false);
  });

  it('ignores dead enemies', () => {
    const p = createPlayer(10, 10);
    const e = makeEnemy(10, 10);
    e.alive = false;
    expect(checkEnemyCollisions(p, [e], () => {})).toBe(false);
  });
});

// ── spawnCoinBurst / spawnDeathBurst ──────────────────────────────────────────
describe('spawnCoinBurst', () => {
  it('emits 8 particles', () => {
    const particles: Particle[] = [];
    spawnCoinBurst(particles, 100, 100);
    expect(particles).toHaveLength(8);
  });

  it('all particles have life > 0', () => {
    const particles: Particle[] = [];
    spawnCoinBurst(particles, 0, 0);
    particles.forEach(p => expect(p.life).toBeGreaterThan(0));
  });

  it('all particles use gold color', () => {
    const particles: Particle[] = [];
    spawnCoinBurst(particles, 0, 0);
    particles.forEach(p => expect(p.color).toBe('#c8981a'));
  });
});

describe('spawnDeathBurst', () => {
  it('emits 16 particles', () => {
    const particles: Particle[] = [];
    spawnDeathBurst(particles, 100, 100);
    expect(particles).toHaveLength(16);
  });

  it('particles are at the spawn position', () => {
    const particles: Particle[] = [];
    spawnDeathBurst(particles, 42, 99);
    particles.forEach(p => { expect(p.x).toBe(42); expect(p.y).toBe(99); });
  });
});

// ── createLevel ───────────────────────────────────────────────────────────────
describe('createLevel', () => {
  it('level 1 has exactly one goal coin', () => {
    const ld = createLevel(1);
    expect(ld.coins.filter(c => c.isGoal)).toHaveLength(1);
  });

  it('level 2 has at least one moving platform', () => {
    const ld = createLevel(2);
    expect(ld.platforms.some(p => p.type === 'moving')).toBe(true);
  });

  it('level 3 has at least one goal platform', () => {
    const ld = createLevel(3);
    expect(ld.platforms.some(p => p.type === 'goal')).toBe(true);
  });

  it('player starts above ground level', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      const ld = createLevel(lvl);
      expect(ld.playerStart.y).toBeLessThan(GROUND_Y);
    }
  });

  it('world width is wider than canvas', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      const ld = createLevel(lvl);
      expect(ld.worldWidth).toBeGreaterThan(800);
    }
  });
});

// ── createGameState ───────────────────────────────────────────────────────────
describe('createGameState', () => {
  it('starts with 3 lives and status playing', () => {
    const s = createGameState(1);
    expect(s.lives).toBe(3);
    expect(s.status).toBe('playing');
  });

  it('preserves score and lives when passed explicitly', () => {
    const s = createGameState(2, 2, 500);
    expect(s.lives).toBe(2);
    expect(s.score).toBe(500);
    expect(s.level).toBe(2);
  });
});

// ── stepGame integration ──────────────────────────────────────────────────────
describe('stepGame integration', () => {
  it('player falls when no ground is present', () => {
    const s = createGameState(1);
    // Place player in open air
    s.player.x = 50;
    s.player.y = 50;
    s.player.vy = 0;
    const s2 = stepGame(s, noInput());
    expect(s2.player.vy).toBeGreaterThan(0);
    expect(s2.player.y).toBeGreaterThan(50);
  });

  it('score increases when coin is collected', () => {
    const s = createGameState(1);
    s.coins = [makeCoin(s.player.x, s.player.y)];
    s.coinsLeft = 1;
    const s2 = stepGame(s, noInput());
    expect(s2.score).toBeGreaterThan(0);
  });

  it('transitions to playerDead when falling off world', () => {
    const s = createGameState(1);
    // Move player well past the void kill-zone (CANVAS_H + 60)
    s.player.y = CANVAS_H + 80;
    s.player.alive = true;
    const s2 = stepGame(s, noInput());
    // First step always sets playerDead (lives go from 3 → 2, deathTimer starts)
    expect(s2.status).toBe('playerDead');
    expect(s2.lives).toBe(2);
    expect(s2.deathTimer).toBeGreaterThan(0);
  });

  it('does not advance while playerDead countdown runs', () => {
    const s = createGameState(1);
    s.status = 'playerDead';
    s.deathTimer = 30;
    s.lives = 3;
    const score = s.score;
    const s2 = stepGame(s, noInput());
    expect(s2.score).toBe(score);
    expect(s2.deathTimer).toBe(29);
  });

  it('transitions to levelComplete when goal coin is collected', () => {
    const s = createGameState(1);
    // Place goal coin at player position
    s.coins = [{ ...makeCoin(s.player.x, s.player.y, 500, true) }];
    const s2 = stepGame(s, noInput());
    expect(s2.status).toBe('levelComplete');
  });

  it('transitions to gameOver when lives reach 0', () => {
    const s = createGameState(1);
    s.status = 'playerDead';
    s.deathTimer = 1;
    s.lives = 0;
    const s2 = stepGame(s, noInput());
    expect(s2.status).toBe('gameOver');
  });
});
