'use client';
/**
 * GamesHub — Client-side games collection showcasing the playable catalog.
 * Lazy-loads each game component to keep the initial bundle small.
 * Every finished game is wired here immediately after completion.
 */

import dynamicImport from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GAME_LIBRARY_SELECTION_STORAGE_KEY,
  GAME_LIBRARY_SESSION_STORAGE_KEY,
  type SavedGameSession,
  upsertSavedGameSession,
} from '@/lib/games/library-state';
import { buildGameLaunchHref, resolveGameLaunchId } from '@/lib/games/navigation';
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
// WebGPU-powered games with DualSense controller support
const NeonDrift   = dynamicImport(() => import('@/components/games/NeonDrift'),   { ssr: false, loading: Loading });
const EchoArena   = dynamicImport(() => import('@/components/games/EchoArena'),   { ssr: false, loading: Loading });
const LucidAvenue = dynamicImport(() => import('@/components/games/LucidAvenue'), { ssr: false, loading: Loading });

export interface GameDef {
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

// ── Playable games across the major DREAMengin categories ───────────────────
// Each entry is wired immediately after the game was finished.
export const GAMES: GameDef[] = [
  // ── MADMAXI — Babylon.js 3-D side-scroller (default game) ─────────────────
  { id: 'platformer',    emoji: '🏎',  label: 'MADMAXI',          category: 'Platformer',  color: '#c8981a', component: BabylonSideScroller,
    desc: '150 levels · 15 zones · boss every 10 levels · unique each run — Babylon.js 3-D side-scroller' },
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
  { id: 'lucid-avenue',  emoji: '🌴', label: 'Lucid Avenue',     category: 'Adventure',   color: '#f59e0b', component: LucidAvenue,
    desc: 'Original LA-inspired retro city quest — expanded 8-district GameEngin-linked city run with free-roam sandbox jumps, vehicle systems, persistent route contracts, west-side missions, and an observatory skyline finale' },
  // ── Dream Universe games ──────────────────────────────────────────────────
  { id: 'dreamwars',     emoji: '🌙', label: 'DREAMwars',         category: 'Strategy',    color: '#7c3aed', component: DREAMwars,
    desc: 'Nightmares vs Dreamers RTS — build base, harvest Dream Energy, crush the enemy HQ' },
  { id: 'engin-battle',  emoji: '⚙️', label: 'ENGIN Battle',      category: 'Strategy',    color: '#38bdf8', component: ENGINBattle,
    desc: 'Age of Empires style — pick Dr. Eams, IDARi or Boogie; tech tree upgrades, 3-faction war' },
  { id: 'dreamquest',    emoji: '✨', label: 'DREAMquest',         category: 'RPG',         color: '#a78bfa', component: DREAMquest,
    desc: 'FF7 + Chrono Trigger RPG — traverse 5 dream layers, unlock dream abilities, defeat the Dream Destroyer' },
  // ── WebGPU-Powered Games ──────────────────────────────────────────────
  { id: 'neon-drift',    emoji: '🏎️', label: 'Neon Drift',        category: 'Racing',      color: '#0ff',    component: NeonDrift,
    desc: 'WebGPU cyberpunk racer — DualSense gyro steering, haptic feedback, high-performance 3D rendering' },
  { id: 'echo-arena',    emoji: '🎯', label: 'Echo Arena',        category: 'Shooter',     color: '#a78bfa', component: EchoArena,
    desc: 'WebGPU arena shooter — DualSense gyro aim, top-down combat, high-performance 3D rendering' },
];

const FEATURED_GAME_IDS = ['platformer', 'lucid-avenue', 'dreamquest', 'dreamwars'] as const;
const QUICK_RESUME_FALLBACK_COUNT = 3;
const ENGINE_CAPABILITY_CHIPS = [
  'Fullscreen boot',
  'Remote ready',
  'Quick resume',
  'Powered by DREAMengin',
] as const;

export default function GamesHub() {
  const [savedSessions, setSavedSessions] = useState<SavedGameSession[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const searchParams = useSearchParams();
  const initializedLaunchRef = useRef(false);

  // GSAP stagger entrance for the game card grid — replays on every filter change
  const gridRef = useRef<HTMLDivElement>(null);
  useGsapEntrance(gridRef, [filter, query], { stagger: 0.035, y: 18, duration: 0.32 });

  const categories = ['All', ...Array.from(new Set(GAMES.map(g => g.category))).sort()];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredByCategory = filter === 'All' ? GAMES : GAMES.filter((game) => game.category === filter);
  const filtered = normalizedQuery
    ? filteredByCategory.filter((game) => (
      `${game.label} ${game.category} ${game.desc}`.toLowerCase().includes(normalizedQuery)
    ))
    : filteredByCategory;
  const savedGameIds = new Set(savedSessions.map((session) => session.gameId));
  const featuredGames = FEATURED_GAME_IDS
    .map((id) => GAMES.find((game) => game.id === id))
    .filter((game): game is GameDef => Boolean(game));
  const recentLaunches = savedSessions
    .map((session) => GAMES.find((game) => game.id === session.gameId))
    .filter((game): game is GameDef => Boolean(game))
    .slice(0, 4);

  const saveGameToEngin = useCallback((id: string, source: SavedGameSession['source']) => {
    if (typeof window === 'undefined') return;
    const game = GAMES.find((entry) => entry.id === id);
    if (!game) return;

    let existing: SavedGameSession[] = [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(GAME_LIBRARY_SESSION_STORAGE_KEY) ?? '[]');
      if (Array.isArray(parsed)) existing = parsed as SavedGameSession[];
    } catch {
      existing = [];
    }

    const nextSession: SavedGameSession = {
      gameId: game.id,
      label: game.label,
      savedAt: new Date().toISOString(),
      source,
    };
    const updated = upsertSavedGameSession(existing, nextSession);
    window.localStorage.setItem(GAME_LIBRARY_SESSION_STORAGE_KEY, JSON.stringify(updated));
    setSavedSessions(updated);
  }, []);

  const playGame = useCallback((id: string) => {
    if (typeof window === 'undefined') return;
    saveGameToEngin(id, 'library-screen');
    window.localStorage.setItem(GAME_LIBRARY_SELECTION_STORAGE_KEY, id);
    window.location.assign(buildGameLaunchHref(id, { openEngin: true, play: true, expand: true }));
  }, [saveGameToEngin]);

  useEffect(() => {
    if (initializedLaunchRef.current) return;
    initializedLaunchRef.current = true;
    if (typeof window === 'undefined') return;

    let restoredSessions: SavedGameSession[] = [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(GAME_LIBRARY_SESSION_STORAGE_KEY) ?? '[]');
      if (Array.isArray(parsed)) restoredSessions = parsed as SavedGameSession[];
    } catch {
      restoredSessions = [];
    }
    setSavedSessions(restoredSessions);

    // Restore last selected game from URL or storage (used for deep-link awareness only)
    const storedSelection = window.localStorage.getItem(GAME_LIBRARY_SELECTION_STORAGE_KEY)
      ?? window.localStorage.getItem('de:games:last-launch')
      ?? GAMES[0]?.id
      ?? null;
    const resolvedId = resolveGameLaunchId(searchParams.get('game'), GAMES.map((game) => game.id), storedSelection);
    if (resolvedId) {
      window.localStorage.setItem(GAME_LIBRARY_SELECTION_STORAGE_KEY, resolvedId);
    }
  }, [searchParams]);

  // ── Library — pick a game and play ────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          borderRadius: 18,
          padding: 14,
          background: 'linear-gradient(135deg, rgba(42,138,184,0.14), rgba(124,58,237,0.08), rgba(15,23,42,0.08))',
          border: '1px solid rgba(42,138,184,0.2)',
          display: 'grid',
          gap: 12,
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--de-accent)',
              }}
            >
              Engine Shelf
            </div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900, color: 'var(--de-heading)', lineHeight: 1.05 }}>
              Browse the upgraded GameEngin library.
            </div>
            <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.65, color: 'var(--de-text-dim)', maxWidth: 760 }}>
              This is the engine shelf now — discovery, featured launches, quick resume awareness, fullscreen boot, and remote-ready cards all live in one place before handoff into GameEngin.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, minWidth: 'min(100%, 320px)' }}>
            {[
              { label: 'Playable', value: String(GAMES.length) },
              { label: 'Categories', value: String(categories.length - 1) },
              { label: 'Saved', value: String(savedSessions.length) },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  borderRadius: 14,
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.56)',
                  border: '1px solid rgba(42,138,184,0.14)',
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--de-accent)' }}>{stat.label}</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 900, color: 'var(--de-heading)' }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ENGINE_CAPABILITY_CHIPS.map((chip) => (
            <span
              key={chip}
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.58)',
                color: 'var(--de-accent)',
                border: '1px solid rgba(42,138,184,0.16)',
              }}
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--de-text-dim)' }}>
              Featured Launch Deck
            </div>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              {featuredGames.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => playGame(game.id)}
                  style={{
                    borderRadius: 14,
                    padding: '12px 12px',
                    border: `1px solid ${game.color}30`,
                    background: 'rgba(255,255,255,0.52)',
                    textAlign: 'left',
                    display: 'grid',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{game.emoji}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: game.color }}>
                      Boot now
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)' }}>{game.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>{game.category} · fullscreen-ready</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--de-text-dim)' }}>
              Quick Resume Rack
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {(recentLaunches.length ? recentLaunches : featuredGames.slice(0, QUICK_RESUME_FALLBACK_COUNT)).map((game) => (
                <button
                  key={`recent-${game.id}`}
                  type="button"
                  onClick={() => playGame(game.id)}
                  style={{
                    borderRadius: 14,
                    padding: '10px 12px',
                    border: `1px solid ${game.color}24`,
                    background: savedGameIds.has(game.id) ? `${game.color}16` : 'rgba(255,255,255,0.48)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{game.emoji}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--de-heading)' }}>{game.label}</span>
                    <span style={{ display: 'block', fontSize: 10, color: 'var(--de-text-dim)' }}>
                      {savedGameIds.has(game.id) ? 'Resume from your memory deck' : 'Pin to your memory deck on first boot'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label style={{ flex: 1, display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--de-text-dim)' }}>
            Search the GameEngin shelf
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, category, or vibe"
            aria-label="Search the GameEngin shelf"
            style={{
              width: '100%',
              borderRadius: 14,
              border: '1px solid rgba(160,195,240,0.2)',
              background: 'rgba(255,255,255,0.72)',
              padding: '12px 14px',
              fontSize: 13,
              color: 'var(--de-heading)',
              outline: 'none',
            }}
          />
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--de-text-dim)', alignSelf: 'center' }}>
            Live filters
          </span>
          {normalizedQuery && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '5px 10px',
                borderRadius: 999,
                border: '1px solid rgba(239,68,68,0.18)',
                background: 'rgba(254,242,242,0.85)',
                color: '#dc2626',
                cursor: 'pointer',
              }}
            >
              Clear search
            </button>
          )}
        </div>
      </div>

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
          const isSaved = savedSessions.some((s) => s.gameId === game.id);

          const cardContent = (
            <>
              <div style={{ fontSize: 28, lineHeight: 1 }}>{game.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.2 }}>
                {game.label}
              </div>
              <div style={{ fontSize: 10, color: 'var(--de-text-dim)', lineHeight: 1.4 }}>
                {game.desc}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <div style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 999,
                  background: `${game.color}18`, color: game.color, border: `1px solid ${game.color}30`,
                  fontWeight: 700, alignSelf: 'flex-start',
                }}>
                  {game.category}
                </div>
                <div style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 999,
                  background: 'rgba(42,138,184,0.08)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.16)',
                  fontWeight: 700, alignSelf: 'flex-start',
                }}>
                  Fullscreen boot
                </div>
                <div style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 999,
                  background: 'rgba(124,58,237,0.08)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.16)',
                  fontWeight: 700, alignSelf: 'flex-start',
                }}>
                  Remote ready
                </div>
              </div>
              <div style={{
                marginTop: 4,
                padding: '5px 10px',
                borderRadius: 8,
                background: `${game.color}22`,
                border: `1px solid ${game.color}55`,
                fontSize: 10, fontWeight: 800,
                color: game.color,
                textAlign: 'center',
                letterSpacing: '0.06em',
              }}>
                {isSaved ? '▶ Quick resume' : '▶ Boot in GameEngin'}
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

          // Link-out games open a full page; inline games launch via GameEngin
          if (game.href) {
            return (
              <Link key={game.id} href={game.href} style={cardStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                {cardContent}
              </Link>
            );
          }

          return (
            <button
              key={game.id}
              type="button"
              onClick={() => playGame(game.id)}
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
        {filtered.length} visible on the upgraded engine shelf · {GAMES.length} total games across {categories.length - 1} categories · Powered by GameEngin
      </div>
    </div>
  );
}
