// lib/game/dreamengin-game.ts
// Pure game logic for the Dr. Eams Platformer — no browser dependencies.
// All state is plain data; rendering is handled by the canvas component.

// ── Constants ─────────────────────────────────────────────────────────────────
export const CANVAS_W   = 800;
export const CANVAS_H   = 480;
export const GROUND_Y   = CANVAS_H - 80; // y=400
export const GROUND_H   = 80;

export const GRAVITY    = 0.55;
export const MAX_FALL   = 16;
export const JUMP_VY    = -13;
export const WALK_SPD   = 3.5;

export const PLAYER_W   = 28;
export const PLAYER_H   = 40;
export const COIN_SIZE  = 18;
export const ENEMY_W    = 32;
export const ENEMY_H    = 32;
export const PLATFORM_H = 20; // standard floating platform height

// ── Entity types ──────────────────────────────────────────────────────────────
export interface Rect { x: number; y: number; w: number; h: number; }

export interface Player extends Rect {
  vx: number; vy: number;
  onGround: boolean;
  alive: boolean;
  facingRight: boolean;
  animTick: number;
  jumpCount: number;
  invincible: number; // frames of post-hit invincibility
}

export type PlatformType = 'solid' | 'moving' | 'goal';

export interface Platform extends Rect {
  type: PlatformType;
  startX?: number;
  moveRange?: number;
  moveSpeed?: number;
  moveDir?: number;
}

export interface Coin extends Rect {
  collected: boolean;
  value: number;
  isGoal: boolean;
  animTick: number;
}

export interface Enemy extends Rect {
  vx: number; vy: number;
  alive: boolean;
  facingRight: boolean;
  stomped: boolean;
  stompTimer: number;
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export type GameStatus =
  | 'playing'
  | 'playerDead'
  | 'levelComplete'
  | 'gameOver'
  | 'victory';

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpJustPressed: boolean;
}

export interface GameState {
  player: Player;
  platforms: Platform[];
  coins: Coin[];
  enemies: Enemy[];
  particles: Particle[];
  score: number;
  lives: number;
  level: number;
  status: GameStatus;
  coinsLeft: number;
  deathTimer: number;
  levelTimer: number;
  cameraX: number;
  worldWidth: number;
}

// ── AABB helpers ──────────────────────────────────────────────────────────────
export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function overlapX(a: Rect, b: Rect): number {
  return Math.min(a.x + a.w - b.x, b.x + b.w - a.x);
}

function overlapY(a: Rect, b: Rect): number {
  return Math.min(a.y + a.h - b.y, b.y + b.h - a.y);
}

// ── Player ────────────────────────────────────────────────────────────────────
export function createPlayer(x: number, y: number): Player {
  return {
    x, y, w: PLAYER_W, h: PLAYER_H,
    vx: 0, vy: 0,
    onGround: false,
    alive: true,
    facingRight: true,
    animTick: 0,
    jumpCount: 0,
    invincible: 0,
  };
}

export function applyGravity(player: Player): void {
  player.vy = Math.min(player.vy + GRAVITY, MAX_FALL);
}

export function applyInput(player: Player, input: InputState): void {
  if (input.left) {
    player.vx = -WALK_SPD;
    player.facingRight = false;
  } else if (input.right) {
    player.vx = WALK_SPD;
    player.facingRight = true;
  } else {
    player.vx *= 0.72;
    if (Math.abs(player.vx) < 0.15) player.vx = 0;
  }

  if (input.jumpJustPressed) {
    if (player.onGround) {
      player.vy = JUMP_VY;
      player.onGround = false;
      player.jumpCount = 1;
    } else if (player.jumpCount === 1) {
      player.vy = JUMP_VY * 0.85;
      player.jumpCount = 2;
    }
  }
}

export function movePlatforms(platforms: Platform[]): void {
  for (const p of platforms) {
    if (p.type !== 'moving') continue;
    const speed  = p.moveSpeed ?? 1.5;
    const dir    = p.moveDir   ?? 1;
    const range  = p.moveRange ?? 80;
    const start  = p.startX    ?? p.x;

    p.x += speed * dir;
    if (p.x > start + range) { p.x = start + range; p.moveDir = -1; }
    else if (p.x < start - range) { p.x = start - range; p.moveDir = 1; }
  }
}

export function resolvePlayerPlatformCollisions(player: Player, platforms: Platform[]): void {
  player.onGround = false;
  for (const plat of platforms) {
    if (!overlaps(player, plat)) continue;
    const ox = overlapX(player, plat);
    const oy = overlapY(player, plat);

    if (oy <= ox) {
      // Vertical collision — use player top vs platform top to decide direction
      if (player.y < plat.y) {
        // Player came from above → land on platform top
        player.y = plat.y - player.h;
        player.vy = 0;
        player.onGround = true;
        player.jumpCount = 0;
      } else {
        // Player came from below → ceiling hit
        player.y = plat.y + plat.h;
        if (player.vy < 0) player.vy = 0;
      }
    } else {
      // Side wall
      if (player.x + player.w / 2 < plat.x + plat.w / 2) {
        player.x = plat.x - player.w;
      } else {
        player.x = plat.x + plat.w;
      }
      player.vx = 0;
    }
  }
}

export function updateEnemies(enemies: Enemy[], platforms: Platform[]): void {
  for (const e of enemies) {
    if (!e.alive) continue;

    if (e.stomped) {
      e.stompTimer--;
      if (e.stompTimer <= 0) e.alive = false;
      continue;
    }

    e.vy = Math.min(e.vy + GRAVITY, MAX_FALL);
    e.x += e.vx;
    e.y += e.vy;

    let grounded = false;
    for (const p of platforms) {
      if (!overlaps(e, p)) continue;
      const ox = overlapX(e, p);
      const oy = overlapY(e, p);
      if (oy <= ox) {
        if (e.y + e.h / 2 < p.y + p.h / 2) {
          e.y = p.y - e.h;
          e.vy = 0;
          grounded = true;
        }
      } else {
        e.vx = -e.vx;
        e.facingRight = !e.facingRight;
        e.x = e.x + e.w / 2 < p.x + p.w / 2 ? p.x - e.w : p.x + p.w;
      }
    }

    // Turn around at platform edges (patrol AI)
    if (grounded) {
      const nextX = e.x + e.vx * 10;
      const footY = e.y + e.h + 4;
      let hasFloor = false;
      for (const p of platforms) {
        if (nextX + e.w > p.x && nextX < p.x + p.w && footY > p.y && footY < p.y + p.h + 6) {
          hasFloor = true;
          break;
        }
      }
      if (!hasFloor) {
        e.vx = -e.vx;
        e.facingRight = !e.facingRight;
      }
    }
  }
}

export function checkCoinCollection(player: Player, coins: Coin[]): number {
  let pts = 0;
  for (const c of coins) {
    if (!c.collected && overlaps(player, c)) {
      c.collected = true;
      pts += c.value;
    }
  }
  return pts;
}

export function checkEnemyCollisions(
  player: Player,
  enemies: Enemy[],
  onStomp: (e: Enemy) => void,
): boolean {
  if (player.invincible > 0) return false;
  for (const e of enemies) {
    if (!e.alive || e.stomped) continue;
    if (!overlaps(player, e)) continue;

    const playerBottom  = player.y + player.h;
    const stomping      = player.vy > 0 && playerBottom - player.vy <= e.y + e.h / 2;

    if (stomping) {
      e.stomped    = true;
      e.stompTimer = 28;
      player.vy    = -8;
      onStomp(e);
    } else {
      return true;
    }
  }
  return false;
}

export function updateParticles(particles: Particle[]): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.18;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

export function spawnCoinBurst(particles: Particle[], x: number, y: number): void {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(a) * (1.5 + Math.random() * 2),
      vy: Math.sin(a) * (1.5 + Math.random() * 2) - 2,
      life: 30 + Math.floor(Math.random() * 20),
      maxLife: 50,
      color: '#c8981a',
      size: 3 + Math.random() * 3,
    });
  }
}

export function spawnDeathBurst(particles: Particle[], x: number, y: number): void {
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(a) * (3 + Math.random() * 3),
      vy: Math.sin(a) * (3 + Math.random() * 3) - 4,
      life: 45 + Math.floor(Math.random() * 20),
      maxLife: 65,
      color: i % 2 === 0 ? '#2a8ab8' : '#c8981a',
      size: 4 + Math.random() * 5,
    });
  }
}

// ── Level factories ───────────────────────────────────────────────────────────
function plat(x: number, y: number, w: number, type: PlatformType = 'solid', extra: Partial<Platform> = {}): Platform {
  return { x, y, w, h: PLATFORM_H, type, ...extra };
}

function ground(x: number, w: number): Platform {
  return { x, y: GROUND_Y, w, h: GROUND_H, type: 'solid' };
}

function coin(x: number, y: number, value = 10, isGoal = false): Coin {
  return { x, y, w: COIN_SIZE, h: COIN_SIZE, collected: false, value, isGoal, animTick: 0 };
}

function enemy(x: number, speed = 1.2): Enemy {
  return {
    x, y: GROUND_Y - ENEMY_H, w: ENEMY_W, h: ENEMY_H,
    vx: -speed, vy: 0,
    alive: true, facingRight: false,
    stomped: false, stompTimer: 0,
  };
}

function enemyOnPlat(x: number, platY: number, speed = 1): Enemy {
  return { ...enemy(x, speed), y: platY - ENEMY_H };
}

export interface LevelData {
  platforms: Platform[];
  coins: Coin[];
  enemies: Enemy[];
  playerStart: { x: number; y: number };
  worldWidth: number;
}

function level1(): LevelData {
  const W = 3200;
  const platforms: Platform[] = [
    ground(0, 840),
    ground(950, 650),
    ground(1700, 800),
    ground(2600, 600),
    plat(200, GROUND_Y - 100, 120),
    plat(450, GROUND_Y - 155, 100),
    plat(700, GROUND_Y - 120, 120),
    plat(950, GROUND_Y - 180, 100),
    plat(1170, GROUND_Y - 130, 140),
    plat(1420, GROUND_Y - 165, 100, 'moving', { startX: 1420, moveRange: 100, moveSpeed: 1.4, moveDir: 1 }),
    plat(1720, GROUND_Y - 205, 80),
    plat(1960, GROUND_Y - 145, 120),
    plat(2220, GROUND_Y - 185, 100),
    plat(2500, GROUND_Y - 130, 120),
    plat(2760, GROUND_Y - 165, 100, 'moving', { startX: 2760, moveRange: 80, moveSpeed: 1.4, moveDir: -1 }),
    plat(3040, GROUND_Y - 125, 130, 'goal'),
  ];
  const coins: Coin[] = [
    coin(100, GROUND_Y - 35), coin(140, GROUND_Y - 35), coin(180, GROUND_Y - 35),
    coin(220, GROUND_Y - 130), coin(260, GROUND_Y - 130), coin(300, GROUND_Y - 130),
    coin(470, GROUND_Y - 185), coin(510, GROUND_Y - 185),
    coin(720, GROUND_Y - 150), coin(760, GROUND_Y - 150),
    coin(970, GROUND_Y - 210), coin(1010, GROUND_Y - 210), coin(1050, GROUND_Y - 210),
    coin(1190, GROUND_Y - 160), coin(1230, GROUND_Y - 160), coin(1270, GROUND_Y - 160),
    coin(1740, GROUND_Y - 235), coin(1780, GROUND_Y - 235),
    coin(1980, GROUND_Y - 175), coin(2020, GROUND_Y - 175), coin(2060, GROUND_Y - 175),
    coin(2240, GROUND_Y - 215), coin(2280, GROUND_Y - 215),
    coin(2620, GROUND_Y - 35), coin(2660, GROUND_Y - 35), coin(2700, GROUND_Y - 35),
    coin(3070, GROUND_Y - 165, 500, true), // goal star
  ];
  const enemies: Enemy[] = [
    enemy(620, 1.2), enemyOnPlat(1120, GROUND_Y - 130, 1),
    enemy(1830, 1.3), enemyOnPlat(2260, GROUND_Y - 185, 1),
    enemy(2820, 1.2),
  ];
  return { platforms, coins, enemies, playerStart: { x: 60, y: GROUND_Y - PLAYER_H }, worldWidth: W };
}

function level2(): LevelData {
  const W = 3600;
  const platforms: Platform[] = [
    ground(0, 620),
    ground(730, 420),
    ground(1260, 520),
    ground(1900, 420),
    ground(2420, 620),
    ground(3100, 500),
    plat(200, GROUND_Y - 120, 100),
    plat(390, GROUND_Y - 185, 80),
    plat(560, GROUND_Y - 250, 80),
    plat(760, GROUND_Y - 145, 120),
    plat(960, GROUND_Y - 205, 100, 'moving', { startX: 960, moveRange: 120, moveSpeed: 2, moveDir: 1 }),
    plat(1270, GROUND_Y - 155, 100),
    plat(1460, GROUND_Y - 225, 80),
    plat(1640, GROUND_Y - 185, 100, 'moving', { startX: 1640, moveRange: 100, moveSpeed: 2.2, moveDir: -1 }),
    plat(1910, GROUND_Y - 165, 80),
    plat(2090, GROUND_Y - 225, 80),
    plat(2290, GROUND_Y - 185, 100),
    plat(2550, GROUND_Y - 250, 80, 'moving', { startX: 2550, moveRange: 90, moveSpeed: 2.5, moveDir: 1 }),
    plat(2800, GROUND_Y - 165, 100),
    plat(3040, GROUND_Y - 210, 80),
    plat(3200, GROUND_Y - 270, 80, 'moving', { startX: 3200, moveRange: 80, moveSpeed: 2, moveDir: -1 }),
    plat(3380, GROUND_Y - 145, 130, 'goal'),
  ];
  const coins: Coin[] = [
    coin(100, GROUND_Y - 35), coin(140, GROUND_Y - 35), coin(180, GROUND_Y - 35),
    coin(210, GROUND_Y - 150), coin(250, GROUND_Y - 150),
    coin(400, GROUND_Y - 215), coin(440, GROUND_Y - 215),
    coin(570, GROUND_Y - 280), coin(610, GROUND_Y - 280),
    coin(780, GROUND_Y - 175), coin(820, GROUND_Y - 175), coin(860, GROUND_Y - 175),
    coin(1280, GROUND_Y - 185), coin(1320, GROUND_Y - 185),
    coin(1470, GROUND_Y - 255), coin(1510, GROUND_Y - 255),
    coin(1920, GROUND_Y - 195), coin(1960, GROUND_Y - 195),
    coin(2100, GROUND_Y - 255), coin(2140, GROUND_Y - 255), coin(2180, GROUND_Y - 255),
    coin(2300, GROUND_Y - 215), coin(2340, GROUND_Y - 215),
    coin(2810, GROUND_Y - 195), coin(2850, GROUND_Y - 195), coin(2890, GROUND_Y - 195),
    coin(3410, GROUND_Y - 185, 500, true),
  ];
  const enemies: Enemy[] = [
    enemy(380, 1.5), enemyOnPlat(820, GROUND_Y - 145, 1.2),
    enemy(1350, 1.4), enemyOnPlat(1680, GROUND_Y - 185, 1),
    enemy(2060, 1.6), enemyOnPlat(2450, GROUND_Y - 185, 1.3),
    enemy(2960, 1.5), enemyOnPlat(3090, GROUND_Y - 210, 1.2),
  ];
  return { platforms, coins, enemies, playerStart: { x: 60, y: GROUND_Y - PLAYER_H }, worldWidth: W };
}

function level3(): LevelData {
  const W = 4000;
  const platforms: Platform[] = [
    ground(0, 500),
    ground(600, 320),
    ground(1020, 320),
    ground(1440, 320),
    ground(1860, 320),
    ground(2280, 320),
    ground(2700, 320),
    ground(3120, 320),
    ground(3540, 460),
    plat(160, GROUND_Y - 135, 80),
    plat(320, GROUND_Y - 205, 65, 'moving', { startX: 320, moveRange: 80, moveSpeed: 2, moveDir: 1 }),
    plat(520, GROUND_Y - 265, 65),
    plat(680, GROUND_Y - 165, 80),
    plat(850, GROUND_Y - 225, 65, 'moving', { startX: 850, moveRange: 90, moveSpeed: 2.5, moveDir: -1 }),
    plat(1040, GROUND_Y - 155, 80),
    plat(1220, GROUND_Y - 225, 65),
    plat(1400, GROUND_Y - 285, 65, 'moving', { startX: 1400, moveRange: 100, moveSpeed: 3, moveDir: 1 }),
    plat(1610, GROUND_Y - 205, 80),
    plat(1800, GROUND_Y - 265, 65),
    plat(2000, GROUND_Y - 185, 80, 'moving', { startX: 2000, moveRange: 80, moveSpeed: 2.8, moveDir: -1 }),
    plat(2230, GROUND_Y - 245, 65),
    plat(2440, GROUND_Y - 175, 80),
    plat(2640, GROUND_Y - 235, 65, 'moving', { startX: 2640, moveRange: 100, moveSpeed: 3, moveDir: 1 }),
    plat(2880, GROUND_Y - 195, 80),
    plat(3070, GROUND_Y - 265, 65, 'moving', { startX: 3070, moveRange: 80, moveSpeed: 2.5, moveDir: -1 }),
    plat(3310, GROUND_Y - 205, 80),
    plat(3560, GROUND_Y - 155, 130, 'goal'),
  ];
  const coins: Coin[] = [
    coin(80, GROUND_Y - 35), coin(120, GROUND_Y - 35), coin(160, GROUND_Y - 35), coin(200, GROUND_Y - 35),
    coin(170, GROUND_Y - 165),
    coin(530, GROUND_Y - 295), coin(570, GROUND_Y - 295),
    coin(690, GROUND_Y - 195), coin(730, GROUND_Y - 195),
    coin(1050, GROUND_Y - 185), coin(1090, GROUND_Y - 185), coin(1130, GROUND_Y - 185),
    coin(1230, GROUND_Y - 255), coin(1270, GROUND_Y - 255),
    coin(1620, GROUND_Y - 235), coin(1660, GROUND_Y - 235),
    coin(1810, GROUND_Y - 295), coin(1850, GROUND_Y - 295), coin(1890, GROUND_Y - 295),
    coin(2240, GROUND_Y - 275), coin(2280, GROUND_Y - 275),
    coin(2450, GROUND_Y - 205), coin(2490, GROUND_Y - 205),
    coin(2890, GROUND_Y - 225), coin(2930, GROUND_Y - 225), coin(2970, GROUND_Y - 225),
    coin(3320, GROUND_Y - 235), coin(3360, GROUND_Y - 235),
    coin(3590, GROUND_Y - 195, 1000, true),
  ];
  const enemies: Enemy[] = [
    enemy(410, 1.5), enemyOnPlat(720, GROUND_Y - 165, 1.5),
    enemy(940, 1.8), enemyOnPlat(1290, GROUND_Y - 225, 1.5),
    enemy(1540, 2), enemyOnPlat(1970, GROUND_Y - 185, 1.8),
    enemyOnPlat(2310, GROUND_Y - 245, 1.5), enemy(2520, 2),
    enemyOnPlat(2830, GROUND_Y - 195, 1.8), enemyOnPlat(3150, GROUND_Y - 265, 1.5),
    enemy(3400, 2),
  ];
  return { platforms, coins, enemies, playerStart: { x: 60, y: GROUND_Y - PLAYER_H }, worldWidth: W };
}

export function createLevel(n: number): LevelData {
  if (n === 1) return level1();
  if (n === 2) return level2();
  return level3();
}

// ── Game state factory ────────────────────────────────────────────────────────
export function createGameState(level = 1, lives = 3, score = 0): GameState {
  const ld = createLevel(level);
  return {
    player:     createPlayer(ld.playerStart.x, ld.playerStart.y),
    platforms:  ld.platforms,
    coins:      ld.coins,
    enemies:    ld.enemies,
    particles:  [],
    score,
    lives,
    level,
    status:     'playing',
    coinsLeft:  ld.coins.filter(c => !c.isGoal).length,
    deathTimer:  0,
    levelTimer:  0,
    cameraX:     0,
    worldWidth:  ld.worldWidth,
  };
}

// ── Main step function ────────────────────────────────────────────────────────
export function stepGame(state: GameState, input: InputState): GameState {
  const { player, platforms, coins, enemies, particles } = state;

  // Handle non-playing statuses
  if (state.status === 'playerDead') {
    state.deathTimer--;
    updateParticles(particles);
    if (state.deathTimer <= 0) {
      if (state.lives <= 0) {
        state.status = 'gameOver';
      } else {
        return createGameState(state.level, state.lives, state.score);
      }
    }
    return state;
  }

  if (state.status === 'levelComplete') {
    state.levelTimer--;
    updateParticles(particles);
    if (state.levelTimer <= 0) {
      if (state.level >= 3) {
        state.status = 'victory';
      } else {
        return createGameState(state.level + 1, state.lives, state.score);
      }
    }
    return state;
  }

  if (state.status !== 'playing') return state;

  // Tick animations
  player.animTick++;
  for (const c of coins) c.animTick++;
  if (player.invincible > 0) player.invincible--;

  // Physics
  applyInput(player, input);
  applyGravity(player);
  movePlatforms(platforms);

  // Move player X, clamp to world
  player.x += player.vx;
  if (player.x < 0) { player.x = 0; player.vx = 0; }
  if (player.x + player.w > state.worldWidth) { player.x = state.worldWidth - player.w; player.vx = 0; }

  // Move player Y
  player.y += player.vy;
  resolvePlayerPlatformCollisions(player, platforms);

  // Enemies
  updateEnemies(enemies, platforms);

  // Coin collection
  const pts = checkCoinCollection(player, coins);
  if (pts > 0) {
    state.score += pts;
    spawnCoinBurst(particles, player.x + player.w / 2, player.y);

    const goalDone = coins.some(c => c.isGoal && c.collected);
    if (goalDone) {
      state.status = 'levelComplete';
      state.levelTimer = 120;
      return state;
    }
    state.coinsLeft = coins.filter(c => !c.isGoal && !c.collected).length;
  }

  // Enemy collisions
  const takingHit = checkEnemyCollisions(player, enemies, (e) => {
    state.score += 200;
    spawnCoinBurst(particles, e.x + e.w / 2, e.y);
  });

  if (takingHit) {
    player.alive = false;
    state.lives--;
    state.status = 'playerDead';
    state.deathTimer = 90;
    spawnDeathBurst(particles, player.x + player.w / 2, player.y + player.h / 2);
    return state;
  }

  // Fall into void
  if (player.y > CANVAS_H + 60) {
    player.alive = false;
    state.lives--;
    state.status = 'playerDead';
    state.deathTimer = 60;
    return state;
  }

  updateParticles(particles);

  // Smooth camera follow
  const target = player.x - CANVAS_W / 2 + player.w / 2;
  state.cameraX += (target - state.cameraX) * 0.12;
  state.cameraX = Math.max(0, Math.min(state.worldWidth - CANVAS_W, state.cameraX));

  return state;
}
