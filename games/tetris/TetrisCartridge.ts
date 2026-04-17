/**
 * games/tetris/TetrisCartridge.ts
 *
 * Tetris as a proper GameCartridge — runs inside GameRuntime.
 *
 * What changed from standalone TetrisGame.tsx:
 *   - Uses api.loop.onTick instead of its own requestAnimationFrame
 *   - Uses api.physics.gravity for piece fall speed
 *     (Earth = normal 800ms base, Moon = slow 1200ms, Jupiter = fast 400ms)
 *   - Uses api.input.on('keydown', ...) instead of window.addEventListener
 *   - Uses api.score.submit instead of its own fetch call
 *   - Reports frame time via api.telemetry.reportFrame
 */

import type { GameCartridge, GameEngineAPI } from '@/lib/gameengin/cartridge';

// ── Game constants (same as TetrisGame.tsx) ──────────────────────────────────

const COLS = 10;
const ROWS = 20;
const CELL = 26;
const CW = COLS * CELL;
const CH = ROWS * CELL;

const PIECES = [
  { shape: [[1,1,1,1]],                              color: '#06b6d4' }, // I
  { shape: [[1,1],[1,1]],                             color: '#eab308' }, // O
  { shape: [[0,1,0],[1,1,1]],                         color: '#a855f7' }, // T
  { shape: [[1,1,0],[0,1,1]],                         color: '#22c55e' }, // S
  { shape: [[0,1,1],[1,1,0]],                         color: '#ef4444' }, // Z
  { shape: [[1,0,0],[1,1,1]],                         color: '#3b82f6' }, // J
  { shape: [[0,0,1],[1,1,1]],                         color: '#f97316' }, // L
];

interface Piece { shape: number[][]; color: string; x: number; y: number }

const SCORE_TABLE = [0, 100, 300, 500, 800];
const BASE_SPEEDS = [800, 700, 600, 500, 400, 350, 300, 250, 200, 150];
/** Large delay value to prevent held-key repeat for one-shot actions (rotation, hard drop) */
const DISABLE_REPEAT_DELAY = 9999;

// ── Pure helpers (same as TetrisGame.tsx) ─────────────────────────────────────

function randomPiece(): Piece {
  const p = PIECES[Math.floor(Math.random() * PIECES.length)];
  return { ...p, shape: p.shape.map(r => [...r]), x: Math.floor(COLS / 2) - Math.floor(p.shape[0].length / 2), y: 0 };
}

function rotate(shape: number[][]): number[][] {
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

function collision(board: (string | 0)[][], piece: Piece, dx = 0, dy = 0, newShape?: number[][]): boolean {
  const shape = newShape ?? piece.shape;
  return shape.some((row, r) => row.some((cell, c) => {
    if (!cell) return false;
    const nx = piece.x + c + dx;
    const ny = piece.y + r + dy;
    return nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx] !== 0);
  }));
}

function placePiece(board: (string | 0)[][], piece: Piece): (string | 0)[][] {
  const next = board.map(row => [...row]) as (string | 0)[][];
  piece.shape.forEach((row, r) => row.forEach((cell, c) => {
    if (cell && piece.y + r >= 0) next[piece.y + r][piece.x + c] = piece.color;
  }));
  return next;
}

function clearLines(board: (string | 0)[][]): { board: (string | 0)[][]; lines: number } {
  const next = board.filter(row => row.some(c => c === 0));
  const lines = ROWS - next.length;
  const empty = Array.from({ length: lines }, () => Array(COLS).fill(0) as (string | 0)[]);
  return { board: [...empty, ...next], lines };
}

/**
 * Map engine gravity to a speed multiplier.
 * Earth (9.8) = 1.0x (normal), Moon (0.1) = ~0.5x (slow), Jupiter (24.8) = ~2.0x (fast)
 */
function gravitySpeedMultiplier(gravity: number): number {
  // Clamp to sane range, normalize around Earth (9.8)
  return Math.max(0.3, Math.min(3.0, gravity / 9.8));
}

// ── Cartridge ────────────────────────────────────────────────────────────────

export const TetrisCartridge: GameCartridge = {
  id: 'tetris',

  mount(container: HTMLDivElement, api: GameEngineAPI): () => void {
    // ── Create canvas ─────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = CW;
    canvas.height = CH;
    canvas.tabIndex = 0;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.borderRadius = '8px';
    canvas.style.border = '2px solid rgba(6,182,212,0.3)';
    canvas.style.outline = 'none';
    canvas.style.maxWidth = '100%';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return () => { container.removeChild(canvas); };

    // ── Create HUD overlay ────────────────────────────────────────────────
    const hud = document.createElement('div');
    hud.style.cssText = 'position:absolute;top:8px;left:8px;color:#fff;font:bold 11px monospace;pointer-events:none;user-select:none;text-shadow:0 1px 3px rgba(0,0,0,0.6);';
    container.appendChild(hud);

    // ── Mutable game state (refs equivalent) ──────────────────────────────
    let phase: 'menu' | 'playing' | 'gameover' = 'menu';
    let board: (string | 0)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    let piece: Piece = randomPiece();
    let nextPiece: Piece = randomPiece();
    let score = 0;
    let lines = 0;
    let level = 1;
    let best = 0;
    let lastDropTime = 0;
    let elapsedTime = 0;
    const keysHeld = new Set<string>();
    const keyRepeat: Record<string, number> = {};

    // ── Drawing ───────────────────────────────────────────────────────────
    function drawBoard() {
      if (!ctx) return;
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, CW, CH);
      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, CH); ctx.stroke(); }
      for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(CW, r * CELL); ctx.stroke(); }
      // Board cells
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const cell = board[r][c];
        if (cell) {
          ctx.fillStyle = cell;
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, 4);
        }
      }
      // Ghost piece
      let ghostY = piece.y;
      while (!collision(board, piece, 0, ghostY - piece.y + 1)) ghostY++;
      piece.shape.forEach((row, r) => row.forEach((cell, c) => {
        if (cell) {
          ctx.fillStyle = `${piece.color}33`;
          ctx.fillRect((piece.x + c) * CELL + 1, (ghostY + r) * CELL + 1, CELL - 2, CELL - 2);
        }
      }));
      // Current piece
      piece.shape.forEach((row, r) => row.forEach((cell, c) => {
        if (cell && piece.y + r >= 0) {
          ctx.fillStyle = piece.color;
          ctx.fillRect((piece.x + c) * CELL + 1, (piece.y + r) * CELL + 1, CELL - 2, CELL - 2);
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.fillRect((piece.x + c) * CELL + 1, (piece.y + r) * CELL + 1, CELL - 2, 4);
        }
      }));
    }

    function drawMenu() {
      if (!ctx) return;
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BLOCK STACK', CW / 2, CH / 2 - 30);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText('Press ENTER or SPACE to play', CW / 2, CH / 2 + 10);
      if (best > 0) {
        ctx.fillStyle = '#facc15';
        ctx.font = '13px sans-serif';
        ctx.fillText(`Best: ${best}`, CW / 2, CH / 2 + 35);
      }
      ctx.textAlign = 'left';
    }

    function drawGameOver() {
      if (!ctx) return;
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, CW, CH);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Game Over', CW / 2, CH / 2 - 40);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`Score: ${score}  Lines: ${lines}  Lv ${level}`, CW / 2, CH / 2);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px sans-serif';
      ctx.fillText(`Best: ${best}`, CW / 2, CH / 2 + 25);
      ctx.fillText('Press ENTER to play again', CW / 2, CH / 2 + 50);
      ctx.textAlign = 'left';
    }

    function updateHUD() {
      hud.textContent = phase === 'playing' ? `Score: ${score}  Lv ${level}  Lines: ${lines}` : '';
    }

    // ── Game start/reset ──────────────────────────────────────────────────
    function startGame() {
      board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      piece = randomPiece();
      nextPiece = randomPiece();
      score = 0; lines = 0; level = 1;
      lastDropTime = 0; elapsedTime = 0;
      for (const k in keyRepeat) delete keyRepeat[k];
      phase = 'playing';
    }

    // ── Input handling via api.input ──────────────────────────────────────
    const unsubKeyDown = api.input.on('keydown', (ev) => {
      keysHeld.add(ev.key);
      if (phase === 'menu' && (ev.key === 'Enter' || ev.key === ' ')) {
        ev.preventDefault();
        startGame();
      }
      if (phase === 'gameover' && ev.key === 'Enter') {
        startGame();
      }
      if (phase === 'playing') {
        if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' || ev.key === 'ArrowDown' || ev.key === ' ' || ev.key === 'ArrowUp' || ev.key === 'z') {
          ev.preventDefault();
        }
      }
    });

    const unsubKeyUp = api.input.on('keyup', (ev) => {
      keysHeld.delete(ev.key);
      delete keyRepeat[ev.key];
    });

    // ── Subscribe to engine tick (fixed timestep) ─────────────────────────
    const unsubTick = api.loop.onTick((dt, elapsed) => {
      if (phase !== 'playing') return;

      const frameStart = performance.now();
      elapsedTime = elapsed;
      const nowMs = elapsed * 1000;

      // Key handling with repeat (DAS)
      for (const key of keysHeld) {
        const last = keyRepeat[key] ?? 0;
        const delay = last === 0 ? 150 : 60;
        if ((nowMs - last) >= delay) {
          keyRepeat[key] = nowMs;
          if (key === 'ArrowLeft' && !collision(board, piece, -1, 0)) piece.x--;
          if (key === 'ArrowRight' && !collision(board, piece, 1, 0)) piece.x++;
          if (key === 'ArrowDown' && !collision(board, piece, 0, 1)) { piece.y++; lastDropTime = nowMs; }
          if (key === 'ArrowUp' || key === 'z') {
            const rotated = rotate(piece.shape);
            if (!collision(board, piece, 0, 0, rotated)) { piece.shape = rotated; keyRepeat[key] = nowMs + DISABLE_REPEAT_DELAY; }
          }
          if (key === ' ') {
            while (!collision(board, piece, 0, 1)) piece.y++;
            keyRepeat[key] = nowMs + DISABLE_REPEAT_DELAY;
          }
        }
      }

      // Auto drop — gravity affects speed
      const baseSpeed = BASE_SPEEDS[Math.min(level - 1, BASE_SPEEDS.length - 1)];
      const speed = baseSpeed / gravitySpeedMultiplier(api.physics.gravity);
      if (nowMs - lastDropTime >= speed) {
        lastDropTime = nowMs;
        if (!collision(board, piece, 0, 1)) {
          piece.y++;
        } else {
          board = placePiece(board, piece);
          const result = clearLines(board);
          board = result.board;
          lines += result.lines;
          score += SCORE_TABLE[result.lines] * level;
          level = Math.floor(lines / 10) + 1;
          piece = { ...nextPiece };
          nextPiece = randomPiece();
          if (collision(board, piece, 0, 0)) {
            best = Math.max(best, score);
            phase = 'gameover';
            api.score.submit('tetris', score, level).catch(() => {});
            return;
          }
        }
      }

      api.telemetry.reportFrame(performance.now() - frameStart);
    });

    // ── Subscribe to engine render pass ───────────────────────────────────
    const unsubRender = api.loop.onRender(() => {
      if (phase === 'menu') drawMenu();
      else if (phase === 'gameover') drawGameOver();
      else drawBoard();
      updateHUD();
    });

    // ── Auto-start on mount (mimics useGameAutoStart) ─────────────────────
    // Draw the initial menu
    drawMenu();

    // Listen for de-game-start custom event
    const onAutoStart = () => { if (phase === 'menu') startGame(); };
    window.addEventListener('de-game-start', onAutoStart);

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      unsubKeyDown();
      unsubKeyUp();
      unsubTick();
      unsubRender();
      window.removeEventListener('de-game-start', onAutoStart);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      if (hud.parentNode) hud.parentNode.removeChild(hud);
    };
  },
};
