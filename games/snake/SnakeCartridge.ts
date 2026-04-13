/**
 * games/snake/SnakeCartridge.ts
 *
 * Snake as a proper GameCartridge — runs inside GameRuntime.
 *
 * What changed from standalone SnakeGame.tsx:
 *   - Uses api.loop.onTick instead of its own requestAnimationFrame
 *   - Uses api.physics.friction for snake speed
 *     (lower friction = faster snake, because ice is slippery)
 *   - Uses api.input.on('keydown', ...) instead of window.addEventListener
 *   - Uses api.score.submit instead of its own fetch call
 *   - Reports frame time via api.telemetry.reportFrame
 *
 * Note: The AI Director integration from the standalone component is not
 * included in the cartridge version to keep the initial migration simple.
 * It can be added in a follow-up once the cartridge contract is stable.
 */

import type { GameCartridge, GameEngineAPI } from '@/lib/gameengin/cartridge';

// ── Game constants ───────────────────────────────────────────────────────────

const CELL = 18;
const COLS = 24;
const ROWS = 22;
const CW = COLS * CELL;
const CH = ROWS * CELL;

type Dir = 'up' | 'down' | 'left' | 'right';
interface Pt { x: number; y: number }

const BASE_SPEED = 150; // ms between ticks
const MIN_SPEED = 55;   // fastest possible tick

// ── Pure helpers ─────────────────────────────────────────────────────────────

function randomFood(snake: Pt[]): Pt {
  let p: Pt;
  do {
    p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === p.x && s.y === p.y));
  return p;
}

/**
 * Map engine friction to a speed modifier.
 * friction=0 (slippery/ice) → speed is 60% of base (faster snake)
 * friction=0.5 (normal) → speed is 100% of base
 * friction=1 (sticky) → speed is 140% of base (slower snake)
 */
const MIN_FRICTION_MULTIPLIER = 0.6;
const FRICTION_RANGE = 0.8;

function frictionSpeedMultiplier(friction: number): number {
  return MIN_FRICTION_MULTIPLIER + friction * FRICTION_RANGE;
}

// ── Cartridge ────────────────────────────────────────────────────────────────

export const SnakeCartridge: GameCartridge = {
  id: 'snake',

  mount(container: HTMLDivElement, api: GameEngineAPI): () => void {
    // ── Create canvas ─────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = CW;
    canvas.height = CH;
    canvas.tabIndex = 0;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.borderRadius = '8px';
    canvas.style.border = '2px solid rgba(74,222,128,0.3)';
    canvas.style.outline = 'none';
    canvas.style.maxWidth = '100%';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return () => { container.removeChild(canvas); };

    // ── Mutable game state ────────────────────────────────────────────────
    let phase: 'menu' | 'playing' | 'gameover' = 'menu';
    let snake: Pt[] = [{ x: 12, y: 11 }, { x: 11, y: 11 }, { x: 10, y: 11 }];
    let dir: Dir = 'right';
    let nextDir: Dir = 'right';
    let food: Pt = { x: 18, y: 11 };
    let score = 0;
    let best = 0;
    let speed = BASE_SPEED;
    let lastTickTime = 0;

    // ── Drawing ───────────────────────────────────────────────────────────

    function draw() {
      if (!ctx) return;
      ctx.fillStyle = '#0f1a0f';
      ctx.fillRect(0, 0, CW, CH);
      // Grid dots
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
        ctx.beginPath(); ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 1, 0, Math.PI * 2); ctx.fill();
      }
      // Food
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `${CELL - 4}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('🍎', food.x * CELL + CELL / 2, food.y * CELL + CELL / 2 + 5); ctx.textAlign = 'left';
      // Snake
      for (let i = 0; i < snake.length; i++) {
        const s = snake[i];
        const ratio = 1 - i / snake.length * 0.5;
        ctx.fillStyle = i === 0 ? '#4ade80' : `rgba(34,197,94,${ratio})`;
        const pad = i === 0 ? 1 : 2;
        ctx.beginPath(); ctx.roundRect(s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 3); ctx.fill();
      }
      // Score HUD
      ctx.fillStyle = '#4ade80'; ctx.font = 'bold 11px monospace';
      ctx.fillText(`Score: ${score}`, 8, 16);
    }

    function drawMenu() {
      if (!ctx) return;
      ctx.fillStyle = '#0f1a0f';
      ctx.fillRect(0, 0, CW, CH);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('🐍 SHADOW SERPENT', CW / 2, CH / 2 - 30);
      ctx.fillStyle = '#86efac';
      ctx.font = '12px sans-serif';
      ctx.fillText('Arrow keys or WASD. Press ENTER to play.', CW / 2, CH / 2 + 10);
      if (best > 0) {
        ctx.fillStyle = '#facc15';
        ctx.font = '13px sans-serif';
        ctx.fillText(`Best: ${best}`, CW / 2, CH / 2 + 35);
      }
      ctx.textAlign = 'left';
    }

    function drawGameOver() {
      if (!ctx) return;
      ctx.fillStyle = '#0f1a0f';
      ctx.fillRect(0, 0, CW, CH);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('💀 Game Over', CW / 2, CH / 2 - 30);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`Score: ${score}`, CW / 2, CH / 2 + 5);
      ctx.fillStyle = '#facc15';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Best: ${best}`, CW / 2, CH / 2 + 30);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px sans-serif';
      ctx.fillText('Press ENTER to play again', CW / 2, CH / 2 + 55);
      ctx.textAlign = 'left';
    }

    // ── Game start/reset ──────────────────────────────────────────────────
    function startGame() {
      snake = [{ x: 12, y: 11 }, { x: 11, y: 11 }, { x: 10, y: 11 }];
      dir = 'right'; nextDir = 'right';
      food = { x: 18, y: 11 };
      score = 0; speed = BASE_SPEED;
      lastTickTime = 0;
      phase = 'playing';
    }

    // ── Input handling via api.input ──────────────────────────────────────
    const dirMap: Record<string, Dir> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };
    const opposite: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

    const unsubKeyDown = api.input.on('keydown', (ev) => {
      if (phase === 'menu' && (ev.key === 'Enter' || ev.key === ' ')) {
        ev.preventDefault();
        startGame();
        return;
      }
      if (phase === 'gameover' && ev.key === 'Enter') {
        startGame();
        return;
      }
      const d = dirMap[ev.key];
      if (d && phase === 'playing') {
        if (d !== opposite[dir]) nextDir = d;
        ev.preventDefault();
      }
    });

    // ── Subscribe to engine tick ──────────────────────────────────────────
    const unsubTick = api.loop.onTick((_dt, elapsed) => {
      if (phase !== 'playing') return;

      const frameStart = performance.now();
      const nowMs = elapsed * 1000;

      // Apply friction to speed — lower friction = faster snake
      const effectiveSpeed = speed * frictionSpeedMultiplier(api.physics.friction);

      if (nowMs - lastTickTime < effectiveSpeed) {
        api.telemetry.reportFrame(performance.now() - frameStart);
        return;
      }
      lastTickTime = nowMs;

      dir = nextDir;
      const head = snake[0];
      const delta: Record<Dir, Pt> = {
        up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
        left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
      };
      const next = { x: head.x + delta[dir].x, y: head.y + delta[dir].y };

      // Wall / self collision
      if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS || snake.some(s => s.x === next.x && s.y === next.y)) {
        best = Math.max(best, score);
        phase = 'gameover';
        api.score.submit('snake', score).catch(() => {});
        api.telemetry.reportFrame(performance.now() - frameStart);
        return;
      }

      const newSnake = [next, ...snake];
      if (next.x === food.x && next.y === food.y) {
        score += 10;
        food = randomFood(newSnake);
        speed = Math.max(MIN_SPEED, speed - 2);
      } else {
        newSnake.pop();
      }
      snake = newSnake;

      api.telemetry.reportFrame(performance.now() - frameStart);
    });

    // ── Subscribe to engine render pass ───────────────────────────────────
    const unsubRender = api.loop.onRender(() => {
      if (phase === 'menu') drawMenu();
      else if (phase === 'gameover') drawGameOver();
      else draw();
    });

    // ── Initial draw ──────────────────────────────────────────────────────
    drawMenu();

    // Listen for de-game-start custom event (auto-start)
    const onAutoStart = () => { if (phase === 'menu') startGame(); };
    window.addEventListener('de-game-start', onAutoStart);

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      unsubKeyDown();
      unsubTick();
      unsubRender();
      window.removeEventListener('de-game-start', onAutoStart);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  },
};
