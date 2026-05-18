'use client';
/**
 * GamesHub — Client-side games collection showcasing the playable catalog.
 * Lazy-loads each game component to keep the initial bundle small.
 * Every finished game is wired here immediately after completion.
 */

import dynamicImport from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  GAME_LIBRARY_SELECTION_STORAGE_KEY,
  GAME_LIBRARY_SESSION_STORAGE_KEY,
  type SavedGameSession,
  upsertSavedGameSession,
} from '@/lib/games/library-state';
import { GAME_CATALOG, type GameCatalogEntry } from '@/lib/games/catalog';
import { buildGameLaunchHref, resolveGameLaunchId } from '@/lib/games/navigation';
import { getAvatarDataUrl, setPlayAsMe } from '@/lib/games/avatar';
import { useGsapEntrance } from '@/lib/gsap/useGsapEntrance';
import { useGsapScrollReveal } from '@/lib/gsap/useGsapScrollReveal';
import { useMotionTilt } from '@/lib/hooks/useMotionTilt';

const Loading = () => (
  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--de-text-dim)', fontSize: 13 }}>
    Loading game…
  </div>
);

// ── Dynamically imported games (ssr:false — all use canvas / browser APIs) ──
const BabylonSideScroller = dynamicImport(() => import('@/components/games/dream.BabylonSideScroller'), { ssr: false, loading: Loading });
const NeonDrift           = dynamicImport(() => import('@/components/games/dream.NeonDrift'),           { ssr: false, loading: Loading });
const EchoArena           = dynamicImport(() => import('@/components/games/dream.EchoArena'),           { ssr: false, loading: Loading });
// ── Fusion cartridges — replace 25 source games ─────────────────────────────
const NullCathedral       = dynamicImport(() => import('@/components/games/dream.NullCathedral'),       { ssr: false, loading: Loading });
const VoidlineGP          = dynamicImport(() => import('@/components/games/dream.VoidlineGP'),          { ssr: false, loading: Loading });
const SerpentSiege        = dynamicImport(() => import('@/components/games/dream.SerpentSiege'),        { ssr: false, loading: Loading });
const AvenueOfMirrors     = dynamicImport(() => import('@/components/games/dream.AvenueOfMirrors'),     { ssr: false, loading: Loading });
const EnginFracture       = dynamicImport(() => import('@/components/games/dream.EnginFracture'),       { ssr: false, loading: Loading });
const Glassfall           = dynamicImport(() => import('@/components/games/dream.Glassfall'),           { ssr: false, loading: Loading });
const NiteFlyerSolarHymn  = dynamicImport(() => import('@/components/games/dream.NiteFlyerSolarHymn'),  { ssr: false, loading: Loading });
const LexiconSolitaire    = dynamicImport(() => import('@/components/games/dream.LexiconSolitaire'),    { ssr: false, loading: Loading });
const DefuseRitual        = dynamicImport(() => import('@/components/games/dream.DefuseRitual'),        { ssr: false, loading: Loading });

export interface GameDef extends GameCatalogEntry {
  /** Render inline inside the hub. Mutually exclusive with `href`. */
  component?: React.ComponentType;
}

const GAME_COMPONENTS: Record<string, React.ComponentType> = {
  platformer: BabylonSideScroller,
  'neon-drift': NeonDrift,
  'echo-arena': EchoArena,
  'null-cathedral': NullCathedral,
  'voidline-gp': VoidlineGP,
  'serpent-siege': SerpentSiege,
  'avenue-of-mirrors': AvenueOfMirrors,
  'engin-fracture': EnginFracture,
  glassfall: Glassfall,
  'nite-flyer-solar-hymn': NiteFlyerSolarHymn,
  'lexicon-solitaire': LexiconSolitaire,
  'defuse-ritual': DefuseRitual,
};

export const GAMES: GameDef[] = GAME_CATALOG.map((game) => ({
  ...game,
  component: GAME_COMPONENTS[game.id],
}));

const FEATURED_GAME_IDS = ['platformer', 'null-cathedral', 'engin-fracture', 'voidline-gp'] as const;
const QUICK_RESUME_FALLBACK_COUNT = 3;
const ENGINE_CAPABILITY_CHIPS = [
  'Fullscreen boot',
  'Remote ready',
  'Quick resume',
  'Powered by DREAMengin',
] as const;

// ── Tilt-enabled game card ────────────────────────────────────────────────────
// Extracted as a proper component so `useMotionTilt` (a hook) can be called
// once per card — hooks cannot be called inside a .map() callback.

interface TiltGameCardProps {
  game: GameDef;
  isSaved: boolean;
  onPlay: (id: string) => void;
  hasAvatar: boolean;
  onPlayAsMe: (id: string) => void;
}

function TiltGameCard({ game, isSaved, onPlay, hasAvatar, onPlayAsMe }: TiltGameCardProps) {
  const { motionProps, glareStyle } = useMotionTilt({ maxTilt: 8, scale: 1.04, glare: true });

  const cardContent = (
    <>
      {/* Glare overlay — moves with the cursor */}
      <motion.div style={{ ...glareStyle }} aria-hidden="true" />
      {/* Cover Art Banner */}
      <div style={{
        borderRadius: '16px 16px 0 0',
        background: `linear-gradient(145deg, rgba(5,10,24,0.96) 0%, ${game.color}33 56%, rgba(15,23,42,0.88) 100%)`,
        height: 112,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        margin: '-14px -12px 10px -12px',
        boxShadow: `0 14px 32px ${game.color}22`,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 72%, ${game.color}36 0%, transparent 72%)`,
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent 38%)' }} />
        <span style={{ fontSize: 30, lineHeight: 1, position: 'relative', zIndex: 1, filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.46))' }}>{game.emoji}</span>
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 8, fontWeight: 800, letterSpacing: '0.12em',
          padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase',
          background: `${game.color}33`, color: game.color,
          border: `1px solid ${game.color}55`,
          backdropFilter: 'blur(4px)',
        }}>
          {game.category}
        </div>
        {game.subtitle && (
          <div style={{
            position: 'absolute', bottom: 6, left: 8,
            fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.72)',
            letterSpacing: '0.06em',
          }}>
            {game.subtitle}
          </div>
        )}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', lineHeight: 1.2 }}>
        {game.label}
      </div>
      <div style={{ fontSize: 10, color: 'var(--de-text-dim)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {game.desc}
      </div>
      <div style={{
        marginTop: 4,
        padding: '6px 10px',
        borderRadius: 999,
        background: 'rgba(15,23,42,0.06)',
        border: `1px solid ${game.color}35`,
        fontSize: 10, fontWeight: 800,
        color: 'var(--de-heading)',
        textAlign: 'center',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        {isSaved ? 'Quick resume' : 'Launch in GameEngin'}
      </div>
      {hasAvatar && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPlayAsMe(game.id); }}
          style={{
            marginTop: 2,
            padding: '6px 10px',
            borderRadius: 999,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(167,139,250,0.1))',
            border: '1px solid rgba(124,58,237,0.35)',
            fontSize: 10, fontWeight: 800,
            color: '#7c3aed',
            textAlign: 'center',
            letterSpacing: '0.06em',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          👤 Play as Yourself
        </button>
      )}
    </>
  );

  const baseStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(247,250,255,0.46))',
    border: `1px solid ${game.color}24`,
    borderRadius: 16,
    padding: '14px 12px',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    textDecoration: 'none',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: `0 14px 34px ${game.color}12`,
  };

  if (game.href) {
    return (
      <motion.a
        layout
        layoutId={`game-card-${game.id}`}
        href={game.href}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        {...motionProps}
        style={{ ...baseStyle, ...motionProps.style }}
      >
        {cardContent}
      </motion.a>
    );
  }

  return (
    <motion.button
      layout
      layoutId={`game-card-${game.id}`}
      type="button"
      onClick={() => onPlay(game.id)}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      {...motionProps}
      style={{ ...baseStyle, ...motionProps.style }}
    >
      {cardContent}
    </motion.button>
  );
}

export default function GamesHub( ){
  const [savedSessions, setSavedSessions] = useState<SavedGameSession[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const initializedLaunchRef = useRef(false);

  // GSAP stagger entrance for the game card grid — replays on every filter change
  const gridRef = useRef<HTMLDivElement>(null);
  useGsapEntrance(gridRef, [filter, query], { stagger: 0.035, y: 18, duration: 0.32 });

  // Scroll-reveal for the featured section and category strip
  const featuredRef = useGsapScrollReveal<HTMLDivElement>({ direction: 'up', stagger: 0.07, duration: 0.42 });
  const categoryRef = useGsapScrollReveal<HTMLDivElement>({ direction: 'left', stagger: 0.03, duration: 0.3, threshold: 0.05 });

  const categories = ['All', ...Array.from(new Set(GAMES.map((g) => g.category))).sort()];
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

  const playGameAsMe = useCallback((id: string) => {
    if (typeof window === 'undefined') return;
    setPlayAsMe();
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

  // Load avatar from localStorage on mount and re-check on focus
  useEffect(() => {
    const load = () => setAvatarDataUrl(getAvatarDataUrl());
    load();
    window.addEventListener('focus', load);
    window.addEventListener('de:avatar:updated', load);
    return () => {
      window.removeEventListener('focus', load);
      window.removeEventListener('de:avatar:updated', load);
    };
  }, []);

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

        <div ref={featuredRef} className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--de-text-dim)' }}>
              Featured Launch Deck
            </div>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              {featuredGames.map((game) => (
                <div key={game.id} style={{ display: 'grid', gap: 4 }}>
                  <button
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
                  {avatarDataUrl && (
                    <button
                      type="button"
                      onClick={() => playGameAsMe(game.id)}
                      style={{
                        borderRadius: 10,
                        padding: '5px 8px',
                        border: '1px solid rgba(124,58,237,0.32)',
                        background: 'rgba(124,58,237,0.1)',
                        fontSize: 9, fontWeight: 800,
                        color: '#7c3aed',
                        cursor: 'pointer',
                        letterSpacing: '0.06em',
                      }}
                    >
                      👤 Play as Yourself
                    </button>
                  )}
                </div>
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

      {/* Category filter pills — GSAP scroll-reveal on first viewport entry */}
      <div ref={categoryRef} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {categories.map((cat) => (
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

      {/* Game card grid — AnimatePresence for smooth filter transitions + 3-D tilt cards */}
      <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        <AnimatePresence mode="popLayout">
          {filtered.map((game) => {
            const isSaved = savedSessions.some((s) => s.gameId === game.id);
            return (
              <TiltGameCard
                key={game.id}
                game={game}
                isSaved={isSaved}
                onPlay={playGame}
                hasAvatar={!!avatarDataUrl}
                onPlayAsMe={playGameAsMe}
              />
            );
          })}
        </AnimatePresence>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--de-text-dim)', fontSize: 11, paddingTop: 4 }}>
        {filtered.length} visible on the upgraded engine shelf · {GAMES.length} total games across {categories.length - 1} categories · Powered by GameEngin
      </div>
    </div>
  );
}
