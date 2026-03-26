'use client';
/**
 * GamesHub — Client-side games collection showcasing all 20 games.
 * Lazy-loads each game component to keep the initial bundle small.
 * Every finished game is wired here immediately after completion.
 */

import dynamicImport from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Leaderboard from '@/components/games/Leaderboard';
import { useGamepad } from '@/lib/games/useGamepad';
import { useGsapEntrance } from '@/lib/gsap/useGsapEntrance';
import { getGsap } from '@/lib/gsap/gsap';

const Loading = () => (
  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--de-text-dim)', fontSize: 13 }}>
    Loading game…
  </div>
);

// ── Dynamically imported games (ssr:false — all use canvas / browser APIs) ──
const RTSGame         = dynamicImport(() => import('@/components/games/RTSGame'),         { ssr: false, loading: Loading });
const TowerDefense    = dynamicImport(() => import('@/components/games/TowerDefense'),    { ssr: false, loading: Loading });
const SpaceShooter    = dynamicImport(() => import('@/components/games/SpaceShooter'),    { ssr: false, loading: Loading });
const Match3Game      = dynamicImport(() => import('@/components/games/Match3Game'),      { ssr: false, loading: Loading });
const SnakeGame       = dynamicImport(() => import('@/components/games/SnakeGame'),       { ssr: false, loading: Loading });
const BreakoutGame    = dynamicImport(() => import('@/components/games/BreakoutGame'),    { ssr: false, loading: Loading });
const TetrisGame      = dynamicImport(() => import('@/components/games/TetrisGame'),      { ssr: false, loading: Loading });
const FlappyGame      = dynamicImport(() => import('@/components/games/FlappyGame'),      { ssr: false, loading: Loading });
const PongGame        = dynamicImport(() => import('@/components/games/PongGame'),        { ssr: false, loading: Loading });
const MinesweeperGame = dynamicImport(() => import('@/components/games/MinesweeperGame'), { ssr: false, loading: Loading });
const ChessGame       = dynamicImport(() => import('@/components/games/ChessGame'),       { ssr: false, loading: Loading });
const RacingGame      = dynamicImport(() => import('@/components/games/RacingGame'),      { ssr: false, loading: Loading });
const TriviaGame      = dynamicImport(() => import('@/components/games/TriviaGame'),      { ssr: false, loading: Loading });
const RPGGame         = dynamicImport(() => import('@/components/games/RPGGame'),         { ssr: false, loading: Loading });
const RhythmGame      = dynamicImport(() => import('@/components/games/RhythmGame'),      { ssr: false, loading: Loading });
const MazeGame        = dynamicImport(() => import('@/components/games/MazeGame'),        { ssr: false, loading: Loading });
const SolitaireGame   = dynamicImport(() => import('@/components/games/SolitaireGame'),   { ssr: false, loading: Loading });
// Pre-existing inline games — wired here so every finished game is accessible
const WordSprint         = dynamicImport(() => import('@/components/games/WordSprint'),         { ssr: false, loading: Loading });
const MemoryGrid         = dynamicImport(() => import('@/components/games/MemoryGrid'),         { ssr: false, loading: Loading });
const SpeedTap           = dynamicImport(() => import('@/components/games/SpeedTap'),           { ssr: false, loading: Loading });
// Babylon.js side-scroller — replaces old Dr. Eams Canvas 2D platformer
const BabylonSideScroller = dynamicImport(() => import('@/components/games/BabylonSideScroller'), { ssr: false, loading: Loading });
// New Dream-universe games
const DREAMwars   = dynamicImport(() => import('@/components/games/DREAMwars'),   { ssr: false, loading: Loading });
const ENGINBattle = dynamicImport(() => import('@/components/games/ENGINBattle'), { ssr: false, loading: Loading });
const DREAMquest  = dynamicImport(() => import('@/components/games/DREAMquest'),  { ssr: false, loading: Loading });

interface GameDef {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  category: string;
  color: string;
  /** Render inline inside the hub. Mutually exclusive with `href`. */
  component?: React.ComponentType;
  /** Navigate to a full page instead of rendering inline. */
  href?: string;
}

// ── 20 games — one from every major gaming category ─────────────────────────
// Each entry is wired immediately after the game was finished.
const GAMES: GameDef[] = [
  // ── Strategy ──────────────────────────────────────────────────────────────
  { id: 'rts',           emoji: '⚔️', label: 'Red Alert RTS',    category: 'Strategy',    color: '#ef4444', component: RTSGame,
    desc: 'C&C Red Alert 2 style — build base, harvest ore, train units, destroy enemy HQ' },
  { id: 'tower-defense', emoji: '🏰', label: 'Tower Defense',    category: 'Strategy',    color: '#22c55e', component: TowerDefense,
    desc: 'Place arrow, cannon & freeze towers to stop 10 waves of enemies' },
  // ── Arcade ────────────────────────────────────────────────────────────────
  { id: 'space-shooter', emoji: '🚀', label: 'Space Shooter',    category: 'Arcade',      color: '#60a5fa', component: SpaceShooter,
    desc: 'Top-down shoot-em-up — auto-fire, dodge enemy bullets, survive endless waves' },
  { id: 'snake',         emoji: '🐍', label: 'Snake',            category: 'Arcade',      color: '#4ade80', component: SnakeGame,
    desc: 'Classic snake — eat apples, grow longer, don\'t hit the walls' },
  { id: 'breakout',      emoji: '🧱', label: 'Breakout',         category: 'Arcade',      color: '#3b82f6', component: BreakoutGame,
    desc: 'Arkanoid-style brick breaker — mouse/touch to control the paddle' },
  { id: 'flappy',        emoji: '🐦', label: 'Flappy Bird',      category: 'Casual',      color: '#fbbf24', component: FlappyGame,
    desc: 'Tap or press Space to flap — dodge the pipes, beat your high score' },
  { id: 'speed-tap',     emoji: '⚡', label: 'Speed Tap',        category: 'Casual',      color: '#f59e0b', component: SpeedTap,
    desc: 'Tap as fast as you can — 10-second reaction speed challenge' },
  // ── Puzzle ────────────────────────────────────────────────────────────────
  { id: 'match3',        emoji: '💎', label: 'Match-3 Gems',     category: 'Puzzle',      color: '#a78bfa', component: Match3Game,
    desc: 'Swap adjacent gems to match 3 or more — 30 moves, aim for chains' },
  { id: 'tetris',        emoji: '🟦', label: 'Tetris',           category: 'Puzzle',      color: '#06b6d4', component: TetrisGame,
    desc: 'Classic falling blocks — rotate, drop, clear lines, level up' },
  { id: 'minesweeper',   emoji: '💣', label: 'Minesweeper',      category: 'Puzzle',      color: '#dc2626', component: MinesweeperGame,
    desc: 'Reveal safe squares, flag mines — classic 16×12 grid, 28 mines' },
  { id: 'memory-grid',   emoji: '🧩', label: 'Memory Grid',      category: 'Puzzle',      color: '#6366f1', component: MemoryGrid,
    desc: 'Flip cards and match all pairs — the classic concentration game' },
  // ── Word ──────────────────────────────────────────────────────────────────
  { id: 'word-sprint',   emoji: '📝', label: 'Word Sprint',      category: 'Word',        color: '#10b981', component: WordSprint,
    desc: '60-second typing challenge — type the falling words before time runs out' },
  // ── Sports ────────────────────────────────────────────────────────────────
  { id: 'pong',          emoji: '🏓', label: 'Pong',             category: 'Sports',      color: '#f1f5f9', component: PongGame,
    desc: 'Classic table tennis — play vs AI or 2 players local, first to 11 wins' },
  { id: 'racing',        emoji: '🏎️', label: 'Racing',          category: 'Sports',      color: '#3b82f6', component: RacingGame,
    desc: 'Top-down track racing — 3 laps vs 2 AI cars, WASD/arrows to drive' },
  // ── Board ─────────────────────────────────────────────────────────────────
  { id: 'chess',         emoji: '♛',  label: 'Chess',            category: 'Board',       color: '#f5f5f4', component: ChessGame,
    desc: '2-player local chess — full piece movement rules, click to select & move' },
  // ── Card ──────────────────────────────────────────────────────────────────
  { id: 'solitaire',     emoji: '🃏', label: 'Solitaire',        category: 'Card',        color: '#22c55e', component: SolitaireGame,
    desc: 'Klondike solitaire — build four foundation piles from Ace to King' },
  // ── Educational ───────────────────────────────────────────────────────────
  { id: 'trivia',        emoji: '🧠', label: 'Trivia Quiz',      category: 'Educational', color: '#818cf8', component: TriviaGame,
    desc: '10 questions across science, history, tech & more — streak bonuses' },
  // ── RPG ───────────────────────────────────────────────────────────────────
  { id: 'rpg',           emoji: '🗡️', label: 'RPG Adventure',   category: 'RPG',         color: '#c084fc', component: RPGGame,
    desc: 'Turn-based adventure — explore, battle monsters, level up, defeat 10 to win' },
  // ── Music ─────────────────────────────────────────────────────────────────
  { id: 'rhythm',        emoji: '🎵', label: 'Rhythm Master',    category: 'Music',       color: '#a78bfa', component: RhythmGame,
    desc: 'Hit notes as they fall — A S K L keys or on-screen buttons' },
  // ── Adventure / Platformer ────────────────────────────────────────────────
  { id: 'maze',          emoji: '🌀', label: 'Maze Runner',      category: 'Adventure',   color: '#38bdf8', component: MazeGame,
    desc: 'Procedurally generated maze — navigate from start to the ★ exit' },
  // ── MADMAXI — Babylon.js 3-D side-scroller ───────────────────────────────
  { id: 'platformer',    emoji: '🏎',  label: 'MADMAXI',          category: 'Platformer',  color: '#c8981a', component: BabylonSideScroller,
    desc: '150 levels · 15 zones · boss every 10 levels · unique each run — Babylon.js 3-D side-scroller' },
  // ── Dream Universe games ──────────────────────────────────────────────────
  { id: 'dreamwars',     emoji: '🌙', label: 'DREAMwars',         category: 'Strategy',    color: '#7c3aed', component: DREAMwars,
    desc: 'Nightmares vs Dreamers RTS — build base, harvest Dream Energy, crush the enemy HQ' },
  { id: 'engin-battle',  emoji: '⚙️', label: 'ENGIN Battle',      category: 'Strategy',    color: '#38bdf8', component: ENGINBattle,
    desc: 'Age of Empires style — pick Dr. Eams, IDARi or Boogie; tech tree upgrades, 3-faction war' },
  { id: 'dreamquest',    emoji: '✨', label: 'DREAMquest',         category: 'RPG',         color: '#a78bfa', component: DREAMquest,
    desc: 'FF7 + Chrono Trigger RPG — traverse 5 dream layers, unlock dream abilities, defeat the Dream Destroyer' },
];

// ── Universal D-Pad — fires de-game-input events consumed by all game canvases ──
function fireGameInput(action: string, active: boolean) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('de-game-input', { detail: { action, active } }));
  }
}

interface DPadState { left: boolean; right: boolean; up: boolean; down: boolean; jump: boolean; }

function UniversalDPad() {
  const [pad, setPad] = useState<DPadState>({ left: false, right: false, up: false, down: false, jump: false });
  const handleDPadInput = useCallback((key: keyof DPadState, active: boolean) => {
    setPad(p => ({ ...p, [key]: active }));
    fireGameInput(key === 'up' || key === 'jump' ? 'jump' : `move-${key}`, active);
    if (!active) fireGameInput('move-stop', false);
  }, []);

  const btnStyle = (active: boolean, color: string) => ({
    border: 'none', cursor: 'pointer', touchAction: 'none' as const, userSelect: 'none' as const,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.08s, box-shadow 0.08s',
    background: active ? `${color}cc` : `${color}28`,
    boxShadow: active ? `0 0 18px ${color}88` : 'none',
    color: active ? '#fff' : `${color}cc`,
    fontSize: 20, fontWeight: 800,
  });

  return (
    <div style={{
      display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center',
      padding: '12px 0 4px', userSelect: 'none',
    }}>
      {/* Cross D-Pad */}
      <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
        {/* Up */}
        <button
          style={{ ...btnStyle(pad.up || pad.jump, '#fbbf24'), position: 'absolute', left: '50%', top: 0,
            transform: 'translateX(-50%)', width: 46, height: 46, borderRadius: '10px 10px 4px 4px' }}
          onPointerDown={(e) => { e.preventDefault(); handleDPadInput('up', true); }}
          onPointerUp={() => handleDPadInput('up', false)}
          onPointerLeave={() => handleDPadInput('up', false)}
          onPointerCancel={() => handleDPadInput('up', false)}
          aria-label="Up"
        >▲</button>
        {/* Left */}
        <button
          style={{ ...btnStyle(pad.left, '#38bdf8'), position: 'absolute', left: 0, top: '50%',
            transform: 'translateY(-50%)', width: 46, height: 46, borderRadius: '10px 4px 4px 10px' }}
          onPointerDown={(e) => { e.preventDefault(); handleDPadInput('left', true); }}
          onPointerUp={() => handleDPadInput('left', false)}
          onPointerLeave={() => handleDPadInput('left', false)}
          onPointerCancel={() => handleDPadInput('left', false)}
          aria-label="Left"
        >◀</button>
        {/* Center hub */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
          width: 42, height: 42, borderRadius: 8,
          background: 'rgba(160,195,240,0.07)', border: '1.5px solid rgba(160,195,240,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: 'rgba(160,195,240,0.28)', fontWeight: 800,
        }}>✦</div>
        {/* Right */}
        <button
          style={{ ...btnStyle(pad.right, '#38bdf8'), position: 'absolute', right: 0, top: '50%',
            transform: 'translateY(-50%)', width: 46, height: 46, borderRadius: '4px 10px 10px 4px' }}
          onPointerDown={(e) => { e.preventDefault(); handleDPadInput('right', true); }}
          onPointerUp={() => handleDPadInput('right', false)}
          onPointerLeave={() => handleDPadInput('right', false)}
          onPointerCancel={() => handleDPadInput('right', false)}
          aria-label="Right"
        >▶</button>
        {/* Down */}
        <button
          style={{ ...btnStyle(pad.down, '#a78bfa'), position: 'absolute', left: '50%', bottom: 0,
            transform: 'translateX(-50%)', width: 46, height: 46, borderRadius: '4px 4px 10px 10px' }}
          onPointerDown={(e) => { e.preventDefault(); handleDPadInput('down', true); }}
          onPointerUp={() => handleDPadInput('down', false)}
          onPointerLeave={() => handleDPadInput('down', false)}
          onPointerCancel={() => handleDPadInput('down', false)}
          aria-label="Down"
        >▼</button>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <button
          style={{ ...btnStyle(pad.jump, '#fbbf24'), width: 68, height: 68, borderRadius: '50%',
            border: '2px solid rgba(251,191,36,0.35)' }}
          onPointerDown={(e) => { e.preventDefault(); handleDPadInput('jump', true); }}
          onPointerUp={() => handleDPadInput('jump', false)}
          onPointerLeave={() => handleDPadInput('jump', false)}
          onPointerCancel={() => handleDPadInput('jump', false)}
          aria-label="Jump / Action"
        >▲</button>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(251,191,36,0.45)', letterSpacing: '0.08em' }}>
          JUMP
        </span>
      </div>
    </div>
  );
}

export default function GamesHub() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const { connected: gpConnected, gamepadName } = useGamepad();

  // GSAP stagger entrance for the game card grid — replays on every filter change
  const gridRef = useRef<HTMLDivElement>(null);
  useGsapEntrance(gridRef, [filter], { stagger: 0.035, y: 18, duration: 0.32 });

  const categories = ['All', ...Array.from(new Set(GAMES.map(g => g.category))).sort()];
  const filtered = filter === 'All' ? GAMES : GAMES.filter(g => g.category === filter);
  const active = activeGame ? GAMES.find(g => g.id === activeGame) : null;

  // Lock body scroll when a game is open in the expanded overlay
  useEffect(() => {
    if (active?.component) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [active]);

  // ── Active game view — expands to fill the screen ─────────────────────────
  if (active?.component) {
    const GameComponent = active.component;

    // Detect PS5 DualSense / PlayStation pads for accurate label
    const gpNameLower = gamepadName.toLowerCase();
    const isDualSense = gpNameLower.includes('dualsense')
      || gpNameLower.includes('playstation')
      || gpNameLower.includes('ps5')
      || gpNameLower.includes('ps4');
    const controllerLabel = isDualSense ? '🎮 DualSense' : gpConnected ? '🕹 Controller' : null;

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(160deg, #07101e 0%, #0b1a30 55%, #07101e 100%)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '10px 14px',
          background: 'rgba(0,0,0,0.30)',
          borderBottom: '1px solid rgba(160,195,240,0.10)',
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={() => setActiveGame(null)}
            style={{
              background: 'rgba(160,195,240,0.12)', border: '1px solid rgba(160,195,240,0.20)',
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              color: 'rgba(220,235,255,0.85)', fontSize: 12, fontWeight: 700,
            }}
          >
            ← All Games
          </button>
          <span style={{ fontSize: 20 }}>{active.emoji}</span>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: 15, letterSpacing: '-0.01em' }}>{active.label}</span>
          <span style={{
            fontSize: 10, padding: '2px 9px', borderRadius: 999,
            background: `${active.color}22`, color: active.color,
            border: `1px solid ${active.color}44`, fontWeight: 700,
          }}>
            {active.category}
          </span>

          {/* Gamepad connection status badge — shown when a controller is detected */}
          <span style={{
            marginLeft: 'auto',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            padding: '3px 9px', borderRadius: 999,
            background: gpConnected ? 'rgba(74,222,128,0.14)' : 'rgba(160,195,240,0.07)',
            color: gpConnected ? '#4ade80' : 'rgba(160,195,240,0.35)',
            border: gpConnected
              ? '1px solid rgba(74,222,128,0.35)'
              : '1px solid rgba(160,195,240,0.12)',
            transition: 'all 0.3s',
            whiteSpace: 'nowrap',
          }}
            title={gpConnected ? gamepadName : 'No controller detected — press any button on your gamepad to connect'}
          >
            {gpConnected ? (controllerLabel ?? '🕹 Connected') : '🎮 No Controller'}
          </span>
        </div>

        {/* Scrollable content area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Game renders here — full width */}
          <div style={{ padding: '12px 12px 0', flexShrink: 0 }}>
            <GameComponent />
          </div>

          {/* Universal D-Pad — shown for all games */}
          <div style={{
            padding: '0 12px',
            borderTop: '1px solid rgba(160,195,240,0.08)',
            marginTop: 8,
            background: 'rgba(0,0,0,0.20)',
            flexShrink: 0,
          }}>
            <UniversalDPad />
            {/* Gamepad / PS5 hint */}
            {!gpConnected && (
              <p style={{
                textAlign: 'center', fontSize: 10, color: 'rgba(160,195,240,0.38)',
                margin: '0 0 10px', lineHeight: 1.5,
              }}>
                🎮 PS5 / Xbox controller? Press any button to auto-connect via Gamepad API
              </p>
            )}
            {gpConnected && (
              <p style={{
                textAlign: 'center', fontSize: 10, color: 'rgba(74,222,128,0.6)',
                margin: '0 0 10px', lineHeight: 1.5,
              }}>
                ✓ {gamepadName.slice(0, 40) || 'Controller'} connected — use D-Pad / sticks to play
              </p>
            )}
          </div>

          {/* Per-game leaderboard */}
          <div style={{
            margin: '12px 12px 16px', padding: '12px 14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(160,195,240,0.14)',
            borderRadius: 12,
            flexShrink: 0,
          }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: 'rgba(220,235,255,0.75)', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              🏆 Leaderboard — {active.label}
            </div>
            <Leaderboard game={active.id} />
          </div>
        </div>
      </div>
    );
  }

  // ── Game grid ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            style={{
              fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
              cursor: 'pointer', border: 'none',
              background: filter === cat ? 'var(--de-accent)' : 'rgba(160,195,240,0.12)',
              color: filter === cat ? '#fff' : 'var(--de-text)',
              transition: 'background 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Game card grid — ref'd for GSAP stagger entrance */}
      <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {filtered.map(game => {
          const cardContent = (
            <>
              <div style={{ fontSize: 28, lineHeight: 1 }}>{game.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.2 }}>
                {game.label}
              </div>
              <div style={{ fontSize: 10, color: 'var(--de-text-dim)', lineHeight: 1.4 }}>
                {game.desc}
              </div>
              <div style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 999,
                background: `${game.color}18`, color: game.color, border: `1px solid ${game.color}30`,
                fontWeight: 700, alignSelf: 'flex-start',
              }}>
                {game.category}
              </div>
            </>
          );

          const cardStyle: React.CSSProperties = {
            background: 'rgba(255,255,255,0.45)',
            border: `1.5px solid ${game.color}30`,
            borderRadius: 12,
            padding: '14px 12px',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            textDecoration: 'none',
            width: '100%',
          };

          // GSAP hover: smooth lift + background brighten via gsap.to
          const hoverIn  = (e: React.MouseEvent<HTMLElement>) => {
            const el = e.currentTarget;
            getGsap().then(gsap => gsap.to(el, { y: -3, background: 'rgba(255,255,255,0.68)', duration: 0.18, ease: 'power2.out', overwrite: 'auto' }));
          };
          const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
            const el = e.currentTarget;
            getGsap().then(gsap => gsap.to(el, { y: 0, background: 'rgba(255,255,255,0.45)', duration: 0.22, ease: 'power2.out', overwrite: 'auto' }));
          };

          // Link-out games open a full page; inline games render inside the hub
          if (game.href) {
            return (
              <Link key={game.id} href={game.href} style={cardStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                {cardContent}
                <div style={{ fontSize: 9, color: 'var(--de-accent)', fontWeight: 600, marginTop: 2 }}>↗ Full page</div>
              </Link>
            );
          }

          return (
            <button
              key={game.id}
              type="button"
              onClick={() => setActiveGame(game.id)}
              style={cardStyle}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              {cardContent}
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', color: 'var(--de-text-dim)', fontSize: 11, paddingTop: 4 }}>
        {GAMES.length} games across {categories.length - 1} categories · Powered by GameEngin
      </div>
    </div>
  );
}

