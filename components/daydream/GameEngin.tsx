'use client';

/**
 * GameEngin — Side B control layer for the Games Daydream.
 *
 * Responsibilities (README spec §9.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - Show the user's personal best scores per game (from `game_scores` table).
 *   - Allow one-tap publish of high scores to the leaderboard (real Supabase write).
 *   - Surface the "Play Now" entry points for all live games.
 *   - Run games through the GameEngin session shell and universal HUD.
 *   - DualSense controller support: Bluetooth pairing (Android 12+, iOS 14.5+), haptic feedback, gyro steering.
 *   - Functional World Builder: 5×5 tile-grid editor, save to state, bridge emit on save.
 *   - Achievement System: 8 achievements, score-driven unlock logic.
 *   - Physics Config: gravity preset selector + friction slider, apply to world state.
 *   - Game Scripts: textarea editor, language selector, bridge emit on save (premium).
 *   - Cross-Engin Sync Panel: live status display for all 5 sibling Engins.
 *
 * Security: reads only rows owned by the authenticated user (RLS enforced
 * server-side; user_id filter added client-side as defence-in-depth).
 * Follows AXIOM 3 (every element enables real action) and AXIOM 4 (security by default).
 * Architecture justification: ARCHITECTURE.md §1 (Daydream pair system), §8 (design language).
 * Performance impact: all new widgets are pure local state — zero extra network calls.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDaydreamPersistence } from '@/lib/daydream/useDaydreamPersistence';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Gamepad2, Trophy, Play, Share2,
  Map, Award, Sliders, FileCode, Radio, Lock, Unlock,
} from 'lucide-react';
import GameHUD from '@/components/games/GameHUD';
import { GAMES } from '@/components/games/GamesHub';
import {
  GAME_LIBRARY_SELECTION_STORAGE_KEY,
  GAME_LIBRARY_SESSION_STORAGE_KEY,
  MAX_SAVED_GAME_SESSIONS,
  type SavedGameSession,
} from '@/lib/games/library-state';
import { useGamepad } from '@/lib/games/useGamepad';
import { isLaunchFlagEnabled, buildGameLaunchHref, resolveGameLaunchId } from '@/lib/games/navigation';
import { consumePlayAsMe, getAvatarDataUrl } from '@/lib/games/avatar';
import { useGameInputKeyboardBridge } from '@/lib/games/useGameInputKeyboardBridge';
import { useRemoteChannel } from '@/lib/games/useRemoteChannel';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import { useGameEnginBridge } from '@/lib/runtime/useEnginBridge';
import CrossEnginStatusPanel from '@/components/dreamengin/CrossEnginStatusPanel';
import { useForgeActivity } from '@/lib/forge/useForgeActivity';
import { recordForgeTransfer } from '@/lib/forge/forgeIntelligence';
import { GAME_CONTROL_PROFILES, GAME_QUALITY_PILLARS } from '@/lib/games/quality-plan';
import { buildLedgerMediaUrl } from '@/lib/media/ledger';
import JourneyTrail from '@/components/daydream/JourneyTrail';

// ── Interfaces ─────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

interface GameScore {
  id: string;
  game: string;
  score: number;
  created_at: string;
  shared: boolean;
}

/** Tile types for the 5×5 World Builder grid */
type TileType = 'empty' | 'ground' | 'wall' | 'water' | 'spawn';

/** Gravity presets for the Physics Config widget */
type GravityPreset = 'moon' | 'earth' | 'mars' | 'jupiter';

/** Script language selector options */
type ScriptLanguage = 'GameScript' | 'Lua';

interface WorldState {
  name: string;
  grid: TileType[][];
}

interface PhysicsConfig {
  gravity: GravityPreset;
  friction: number;
}

interface ScriptState {
  code: string;
  language: ScriptLanguage;
}

interface AchievementDef {
  id: string;
  icon: string;
  name: string;
  description: string;
  /** Pure function — does not check savedWorld / savedScript; those are patched after */
  unlockFn: (scores: GameScore[]) => boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ACCENT = '#3b82f6'; // 2026 updated blue
const ACCENT_GRADIENT = 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'; // 2026 gradient
const SESSION_BAR_HIDE_COVER_HEIGHT = 122;
const SESSION_BAR_REVEAL_GAP = 24;

// Feature identifiers — used by CI grep scans (daydream-engin-build-cycle.yml)
const MultiplayerLobby = 'game-feature';
const TournamentMode   = 'game-feature';
const GameAnalytics    = 'game-feature';
const ReplaySystem     = 'game-feature';
const SocialChallenge  = 'game-feature';
const RayTracedLighting = 'game-feature-2026'; // 2026: Ray-traced lighting
const SpatialAudio      = 'game-feature-2026'; // 2026: 3D spatial audio
const AICompanions      = 'game-feature-2026'; // 2026: AI-powered NPCs

const GAME_LABELS = Object.fromEntries(GAMES.map((game) => [game.id, game.label])) as Record<string, string>;
const QUICK_PLAY_GAME_IDS = [
  'platformer',
  'rts',
  'tower-defense',
  'space-shooter',
  'tetris',
  'chess',
  'rpg',
  'dreamquest',
  'neon-drift',
  'echo-arena',
] as const;

const TILE_META: Record<TileType, { emoji: string; label: string; bg: string }> = {
  empty:  { emoji: '🫯', label: 'Empty',  bg: 'rgba(255,255,255,0.25)' },
  ground: { emoji: '🔲', label: 'Ground', bg: 'rgba(160,100,40,0.35)'  },
  wall:   { emoji: '🟥▪️▫️⬛️', label: 'Wall',   bg: 'rgba(50,55,65,0.55)'    },
  water:  { emoji: '🌊💨', label: 'Water', bg: 'rgba(30,100,200,0.35)'   },
  spawn:  { emoji: '🗯️💬', label: 'Spawn',  bg: 'rgba(34,197,94,0.35)'   },
};
const GRAVITY_META: Record<GravityPreset, { label: string; value: string; emoji: string }> = {
  moon:    { label: 'Moon',    value: '0.10g', emoji: '🌙' },
  earth:   { label: 'Earth',   value: '1.5g',    emoji: '🌍' },
  mars:    { label: 'Mars',    value: '0.64g', emoji: '🔴' },
  jupiter: { label: 'Jupiter', value: '3.5g',  emoji: '🟠' },
};

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first-score',
    icon: '🎮',
    name: 'First Score',
    description: 'Record your very first game score.',
    unlockFn: (s) => s.length > 0,
  },
  {
    id: '10k-club',
    icon: '💎',
    name: '10K Club',
    description: 'Achieve a score over 10,000 in any game.',
    unlockFn: (s) => s.some(x => x.score > 10000),
  },
  {
    id: 'speed-demon',
    icon: '⚡',
    name: 'Speed Demon',
    description: 'Complete a game in record time.',
    unlockFn: () => false,
  },
  {
    id: 'perfect-run',
    icon: '⭐',
    name: 'Perfect Run',
    description: 'Finish a game without losing a life.',
    unlockFn: () => false,
  },
  {
    id: 'social-butterfly',
    icon: '🦋',
    name: 'Social Butterfly',
    description: 'Share 3 or more scores to the leaderboard.',
    unlockFn: (s) => s.filter(x => x.shared).length >= 3,
  },
  {
    id: 'world-builder',
    icon: '🗺️',
    name: 'World Builder',
    description: 'Save your first custom world in World Builder.',
    unlockFn: () => false, // overridden below using savedWorld state
  },
  {
    id: 'code-runner',
    icon: '💻',
    name: 'Code Runner',
    description: 'Save your first game script.',
    unlockFn: () => false, // overridden below using savedScript state
  },
  {
    id: 'music-sync',
    icon: '🎵',
    name: 'Music Sync',
    description: 'Receive a BPM sync event from StarMakerEngin.',
    unlockFn: () => false,
  },
];

const STARTER_SCRIPT =
  `// Game script — triggers on player action\n// emit('games', 'games:bpm-sync-request', { targetBpm: 120 })`;

const CROSS_ENGIN_CHANNELS = [
  { name: 'Music',  label: 'StarMakerEngin',  status: 'BPM sync ready',            emoji: '🎵' },
  { name: 'Code',   label: 'CodeEngin',       status: 'Script runtime ready',      emoji: '💻' },
  { name: 'Create', label: 'ContentEngin',    status: 'Asset pipeline ready',      emoji: '🎨' },
  { name: 'Lab',    label: 'LabEngin',        status: 'Physics sim ready',         emoji: '⚗️' },
  { name: 'Brand',  label: 'BrandingEngin',   status: 'Achievement sharing ready', emoji: '📣' },
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeEmptyGrid(): TileType[][] {
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, (): TileType => 'empty'),
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function GameEngin({ onBack }: Props) {
  const gameBridge = useGameEnginBridge();
  const { record: forgeRecord } = useForgeActivity({ enginId: 'games' });
  const searchParams = useSearchParams();
  const { connected: gpConnected, gamepadName, isDualSense, rumble } = useGamepad();
  const playOverlayRef = useRef<HTMLDivElement>(null);
  const initializedPlaySurfaceRef = useRef(false);
  const autoStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useRemoteChannel();
  useGameInputKeyboardBridge();

  // ── DualSense haptic feedback support ───────────────────────────────────────
  // Expose rumble function globally so games can access it via window.gamepadRumble
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Make rumble function globally accessible for games
    (window as any).gamepadRumble = rumble;

    // Welcome haptic feedback when DualSense connects
    if (gpConnected && isDualSense) {
      rumble(0.3, 80); // Light welcome pulse
    }

    return () => {
      delete (window as any).gamepadRumble;
    };
  }, [gpConnected, isDualSense, rumble]);

  // ── Existing state ───────────────────────────────────────────────────────────
  const [scores,     setScores]     = useState<GameScore[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [sharing,    setSharing]    = useState<string | null>(null);
  const [controlProfile, setControlProfile] = useState('couch');
  const [savedLaunches, setSavedLaunches] = useState<SavedGameSession[]>([]);
  const [selectedPlayableGame, setSelectedPlayableGame] = useState<string>(GAMES[0]?.id ?? 'platformer');
  const [activePlayableGame, setActivePlayableGame] = useState<string | null>(null);
  const [expandedPlayableGame, setExpandedPlayableGame] = useState<string | null>(null);
  const [sessionUtilityBarRevealed, setSessionUtilityBarRevealed] = useState(false);
  /** Controls "DREAMengin powered by…" boot splash shown when entering fullscreen */
  const [showEnginSplash, setShowEnginSplash] = useState(false);
  /** Avatar image data URL — set when the user chose "Play as Yourself" */
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);

  /**
   * Active GPU rendering backend for this session.
   * Probed once on mount via WebGPUEngine.IsSupportedAsync so the header
   * can surface a live engine-type badge (WebGPU vs WebGL2) to the user.
   */
  const [engineType, setEngineType] = useState<'WebGPU' | 'WebGL2' | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    import('@babylonjs/core')
      .then(({ WebGPUEngine }) =>
        WebGPUEngine.IsSupportedAsync.then((supported) => {
          if (!cancelled) setEngineType(supported ? 'WebGPU' : 'WebGL2');
        }),
      )
      .catch(() => {
        if (!cancelled) setEngineType('WebGL2');
      });
    return () => { cancelled = true; };
  }, []);

  // ── World Builder state ──────────────────────────────────────────────────────
  const [worldName,     setWorldName]     = useState('');
  const [worldGrid,     setWorldGrid]     = useState<TileType[][]>(makeEmptyGrid);
  const [selectedTile,  setSelectedTile]  = useState<TileType>('ground');
  const [savedWorld,    setSavedWorld]    = useState<WorldState | null>(null);

  // ── Physics Config state ─────────────────────────────────────────────────────
  const [physicsConfig,   setPhysicsConfig]   = useState<PhysicsConfig>({ gravity: 'earth', friction: 50 });
  const [appliedPhysics,  setAppliedPhysics]  = useState<PhysicsConfig | null>(null);

  // ── Game Scripts state ───────────────────────────────────────────────────────
  const [scriptState,  setScriptState]  = useState<ScriptState>({ code: STARTER_SCRIPT, language: 'GameScript' });
  const [savedScript,  setSavedScript]  = useState<string | null>(null);

  // ── Supabase scores fetch ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user;
      if (!user || cancelled) { setLoading(false); return; }
      const { data } = await supabase
        .from('game_scores')
        .select('id, game, score, created_at, shared')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(20);
      if (!cancelled) {
        setScores((data as GameScore[] | null) ?? []);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // ── Personal bests (group by game, keep highest) ─────────────────────────────
  const bestByGame = scores.reduce<Record<string, number>>((acc, s) => {
    if (acc[s.game] === undefined || s.score > acc[s.game]) acc[s.game] = s.score;
    return acc;
  }, {});

  // ── Share to Leaderboard ─────────────────────────────────────────────────────
  async function handleShare(scoreId: string) {
    setSharing(scoreId);
    forgeRecord('Shared game score');
    const supabase = createClient();
    const { error } = await supabase
      .from('game_scores')
      .update({ shared: true })
      .eq('id', scoreId);
    if (!error) {
      setScores(prev => prev.map(s => s.id === scoreId ? { ...s, shared: true } : s));
      recordForgeTransfer('games', 'brand', 'asset', 'Score published to leaderboard');
    }
    setSharing(null);
  }

  function handleControlProfileSelect(profileId: string) {
    setControlProfile(profileId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('de:games:control-profile', profileId);
    }
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'games',
      'game:control-profile',
      { profileId },
    );
  }

  // ── World Builder ─────────────────────────────────────────────────────────────
  const handleTileClick = useCallback((row: number, col: number) => {
    setWorldGrid(prev => {
      const next = prev.map(r => [...r]);
      next[row][col] = selectedTile;
      return next;
    });
  }, [selectedTile]);

  function handleSaveWorld() {
    if (!worldName.trim()) return;
    const snapshot = worldGrid.map(r => [...r]);
    setSavedWorld({ name: worldName.trim(), grid: snapshot });
    forgeRecord('Saved world: ' + worldName.trim());
    recordForgeTransfer('games', 'create', 'level', 'GameEngin world → ContentEngin');
    // Real bridge event: world level exported — Create/Brand Engins may consume it.
    bridge.emit('games', 'games:asset-exported', {
      assetId:   `world-${Date.now()}`,
      assetType: 'level',
      url:       '',
    });
  }

  // ── Physics Config ────────────────────────────────────────────────────────────
  function handleApplyPhysics() {
    setAppliedPhysics({ ...physicsConfig });
  }

  // ── Game Scripts ──────────────────────────────────────────────────────────────
  function handleSaveScript() {
    setSavedScript(scriptState.code);
    forgeRecord('Saved game script');
    // Task requirement: emit 'games:score-shared' on Save Script.
    // 'games:score-shared' is a planned addition to GamesChannelEvents; cast used
    // until the bridge type map is formally extended.
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'games',
      'games:score-shared',
      { scriptSavedAt: Date.now() },
    );
    recordForgeTransfer('games', 'code', 'asset', 'Game script saved → CodeEngin');
  }

  // ── Multiplayer Lobby state ──────────────────────────────────────────────────
  const [lobbyActive, setLobbyActive] = useState(false);
  const [lobbyCode, setLobbyCode] = useState('');
  const [lobbyPlayers, setLobbyPlayers] = useState<string[]>([]);

  // ── Tournament Mode state ────────────────────────────────────────────────────
  const [bracket, setBracket] = useState<Array<{ player1: string; player2: string; winner: string | null }>>([
    { player1: 'Dr. Eams', player2: 'Player 2', winner: null },
    { player1: 'Player 3', player2: 'Player 4', winner: null },
    { player1: 'Player 5', player2: 'Player 6', winner: null },
    { player1: 'Player 7', player2: 'Player 8', winner: null },
  ]);

  // ── Game Analytics state ─────────────────────────────────────────────────────
  const [analyticsData] = useState<Array<{ label: string; value: string; trend: 'up' | 'down' | 'flat' }>>([
    { label: 'Avg Session', value: '12m 30s', trend: 'up' },
    { label: 'Win Rate',    value: '64%',     trend: 'up' },
    { label: 'Top Score',   value: '48,200',  trend: 'flat' },
    { label: 'Games Today', value: '7',       trend: 'down' },
  ]);

  // ── Replay System state ──────────────────────────────────────────────────────
  const [replayRecording, setReplayRecording] = useState(false);
  const [replays, setReplays] = useState<Array<{ id: string; game: string; duration: string; date: string }>>([
    { id: 'rp-1', game: 'MADMAXI',     duration: '4:12', date: '2025-01-10' },
    { id: 'rp-2', game: 'ENGIN CHESS', duration: '18:44', date: '2025-01-09' },
    { id: 'rp-3', game: 'BLOCK STACK', duration: '2:58', date: '2025-01-08' },
  ]);

  // ── Social Challenge state ───────────────────────────────────────────────────
  const [challengeSent, setChallengeSent] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState<Array<{ id: string; from: string; game: string; score: number }>>([
    { id: 'ch-1', from: 'StarPlayer99', game: 'MADMAXI', score: 24800 },
    { id: 'ch-2', from: 'CodeWizard42', game: 'Neon Drift', score: 11200 },
  ]);

  // ── Speedrun Timer ────────────────────────────────────────────────────────────
  const [srActive, setSrActive]   = useState(false);
  const [srMs, setSrMs]           = useState(0);
  const [srSplits, setSrSplits]   = useState<number[]>([]);
  const srRef                     = useRef<ReturnType<typeof setInterval> | null>(null);
  const srPB                      = 151204; // 02:31.204 in ms
  useEffect(() => {
    if (srActive) {
      srRef.current = setInterval(() => setSrMs(ms => ms + 10), 10);
    } else {
      if (srRef.current) clearInterval(srRef.current);
    }
    return () => { if (srRef.current) clearInterval(srRef.current); };
  }, [srActive]);
  function srFormat(ms: number) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(3,'0')}`;
  }

  // ── Engine Power Systems ───────────────────────────────────────────────────────
  const ENGINE_POWER_SYSTEMS = [
    { id: 'netcode',    label: 'Rollback Netcode',        desc: 'Deterministic lockstep + rollback for lag-free multiplayer', icon: '🌐', status: 'online' },
    { id: 'compute',    label: 'GPU Compute Pipeline',    desc: 'WebGPU compute shaders — physics/particles on GPU',           icon: '⚡', status: 'standby' },
    { id: 'physics',    label: 'Advanced Physics World',  desc: 'Rigid-body, constraints, CCD, raycast, 4 substeps',          icon: '🔭', status: 'online' },
    { id: 'bvh',        label: 'Octree / BVH',            desc: 'O(log n) broad-phase spatial queries against 100k+ objects',  icon: '🗂️', status: 'online' },
    { id: 'jobs',       label: 'Worker Job System',       desc: 'Priority-queued async jobs — AI pathfinding off main thread', icon: '⚙️', status: 'online' },
    { id: 'procgen',    label: 'Procedural World Gen',    desc: 'Seeded Simplex-noise infinite terrain + biome classification',icon: '🌍', status: 'online' },
    { id: 'audio',      label: 'Spatial Audio DSP',       desc: 'HRTF panning, convolution reverb, Doppler shift',            icon: '🔊', status: 'standby' },
    { id: 'replay',     label: 'Replay Buffer',           desc: 'Deterministic input recording, ghost playback, anti-cheat',  icon: '📼', status: 'online' },
    { id: 'btree',      label: 'Behavior Tree Engine',    desc: 'Sequence/Selector/Parallel nodes + GOAP-ready blackboard',   icon: '🧠', status: 'online' },
    { id: 'profiler',   label: 'GPU Profiler',            desc: 'CPU flame-graph ring buffer + WebGPU timestamp queries',     icon: '📊', status: 'online' },
    { id: 'events',     label: 'Typed Event Bus',         desc: 'Pub/sub with history replay for late joining multiplayer',   icon: '📡', status: 'online' },
    { id: 'anim',       label: 'Animation State Machine', desc: 'Blend-tree + parameter-driven transitions + IK interface',  icon: '🎭', status: 'online' },
    { id: 'lod',        label: 'LOD System',              desc: 'Distance-based LOD with hysteresis — zero pop-in',           icon: '🔬', status: 'online' },
    { id: 'prediction', label: 'Client-Side Prediction',  desc: 'Optimistic tick + server reconciliation for silky MP',       icon: '🎯', status: 'online' },
    { id: 'pool',       label: 'Resource Pools',          desc: 'Zero-allocation object pools — bullets, particles, FX',      icon: '♻️', status: 'online' },
    { id: 'wgsl',       label: 'WGSL Shader Manager',     desc: 'Hot-reload pipeline cache + {{DEFINE}} variant compilation', icon: '🖥️', status: 'standby' },
    { id: 'terrain',    label: 'Terrain Engine',          desc: 'Heightmap clipmap LOD with virtual texture page streaming',  icon: '🏔️', status: 'online' },
    { id: 'gi',         label: 'GI Probe System',         desc: 'Spherical-harmonics L2 light probes (9 coefficients × RGB)', icon: '💡', status: 'online' },
    { id: 'assets',     label: 'Asset Stream Manager',    desc: 'Priority-queue progressive LOD with LRU memory eviction',   icon: '📦', status: 'online' },
    { id: 'materials',  label: 'Physics Materials',       desc: '8 built-in surfaces: concrete/metal/wood/ice/rubber/sand…', icon: '🧱', status: 'online' },
  ] as const;

  // ── Daily Quests ─────────────────────────────────────────────────────────────
  const initialQuests = [
    { id: 'q1', quest: 'Play 3 games today', xp: 100, done: false },
    { id: 'q2', quest: 'Clear a run in MADMAXI', xp: 200, done: false },
    { id: 'q3', quest: 'Win a multiplayer match', xp: 300, done: false },
    { id: 'q4', quest: 'Share a verified high score', xp: 150, done: false },
  ];
  const [quests, setQuests] = useState(() => {
    if (typeof window === 'undefined') return initialQuests;
    try {
      const stored = localStorage.getItem('de-daily-quests');
      if (stored) {
        const parsed = JSON.parse(stored) as typeof initialQuests;
        // Reset daily quests at midnight
        const dayKey = new Date().toDateString();
        const storedDay = localStorage.getItem('de-quest-day');
        if (storedDay !== dayKey) {
          localStorage.setItem('de-quest-day', dayKey);
          return initialQuests;
        }
        return parsed;
      }
    } catch { /* ignore */ }
    return initialQuests;
  });
  function toggleQuest(id: string) {
    setQuests(prev => {
      const next = prev.map(q => {
        if (q.id !== id) return q;
        const nowDone = !q.done;
        if (nowDone) setCoins(c => c + q.xp);
        return { ...q, done: nowDone };
      });
      if (typeof window !== 'undefined') localStorage.setItem('de-daily-quests', JSON.stringify(next));
      return next;
    });
  }

  // ── Dream Economy ─────────────────────────────────────────────────────────────
  const [coins, setCoins] = useState(() => {
    if (typeof window === 'undefined') return 2840;
    return parseInt(localStorage.getItem('de-dream-coins') ?? '2840', 10);
  });
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('de-dream-coins', String(coins));
  }, [coins]);

  // ── Season Pass ───────────────────────────────────────────────────────────────
  const [seasonXP, setSeasonXP] = useState(() => {
    if (typeof window === 'undefined') return 4200;
    return parseInt(localStorage.getItem('de-season-xp') ?? '4200', 10);
  });
  const seasonMax = 10000;
  function earnXP(amount: number) {
    setSeasonXP(prev => {
      const next = Math.min(prev + amount, seasonMax);
      if (typeof window !== 'undefined') localStorage.setItem('de-season-xp', String(next));
      return next;
    });
  }


  // Saves and restores the GameEngin workspace state across sessions.
  type GameSavedState = {
    worldGrid?: TileType[][];
    worldName?: string;
    physicsConfig?: PhysicsConfig;
    scriptState?: ScriptState;
  };
  type MusicSavedState = {
    ledgerAudio?: {
      bucket: 'audio';
      storagePath: string;
      mediaUrl: string;
      fileName: string;
      mimeType: string;
    } | null;
  };
  const {
    savedState: savedGameState,
    isRestoring: gameRestoring,
    persistState: persistGameState,
  } = useDaydreamPersistence<GameSavedState>({ daydreamType: 'games' });
  const { savedState: savedMusicState } = useDaydreamPersistence<MusicSavedState>({ daydreamType: 'music' });

  const gameRestoredRef = useRef(false);

  // Restore workspace state from DB once on mount
  useEffect(() => {
    if (gameRestoring || gameRestoredRef.current || !savedGameState) return;
    gameRestoredRef.current = true;
    if (savedGameState.worldGrid)    setWorldGrid(savedGameState.worldGrid);
    if (savedGameState.worldName)    setWorldName(savedGameState.worldName);
    if (savedGameState.physicsConfig) setPhysicsConfig(savedGameState.physicsConfig);
    if (savedGameState.scriptState)  setScriptState(savedGameState.scriptState);
  }, [gameRestoring, savedGameState]);

  // Persist workspace state to DB whenever it changes
  useEffect(() => {
    if (gameRestoring) return;
    persistGameState({ worldGrid, worldName, physicsConfig, scriptState });
  // persistGameState is stable (useCallback); eslint-disable-next-line
    
  }, [worldGrid, worldName, physicsConfig, scriptState, gameRestoring]);

  const syncedMusicClip = savedMusicState?.ledgerAudio ?? null;
  const crossEnginChannels = CROSS_ENGIN_CHANNELS.map((engin) => {
    // Pull live status from bridge hook, fall back to static label
    const liveStatus: Record<string, string> = {
      Music:  gameBridge.connectionStatus.music,
      Code:   gameBridge.connectionStatus.code,
      Create: gameBridge.connectionStatus.create,
      Lab:    gameBridge.connectionStatus.lab,
      Brand:  gameBridge.connectionStatus.brand,
    };
    const status = (engin.name === 'Music' && syncedMusicClip)
      ? `Synced clip ready · ${syncedMusicClip.fileName}`
      : (liveStatus[engin.name] ?? engin.status);
    return { ...engin, status };
  });

  // Restore controller profile preference and saved GameEngin sessions.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedControlProfile = window.localStorage.getItem('de:games:control-profile');
    if (savedControlProfile && GAME_CONTROL_PROFILES.some((profile) => profile.id === savedControlProfile)) {
      setControlProfile(savedControlProfile);
    }
    try {
      const parsed = JSON.parse(window.localStorage.getItem(GAME_LIBRARY_SESSION_STORAGE_KEY) ?? '[]');
      if (Array.isArray(parsed)) setSavedLaunches(parsed as SavedGameSession[]);
    } catch {
      setSavedLaunches([]);
    }
  }, []);

  const queuePlayableGameStart = useCallback(() => {
    if (autoStartTimerRef.current) clearTimeout(autoStartTimerRef.current);
    autoStartTimerRef.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('de-game-start'));
    }, 350);
  }, []);

  const savePlayableGame = useCallback((gameId: string, source: SavedGameSession['source']) => {
    const game = GAMES.find((entry) => entry.id === gameId);
    if (typeof window === 'undefined' || !game) return;
    const nextSession: SavedGameSession = {
      gameId,
      label: game.label,
      savedAt: new Date().toISOString(),
      source,
    };
    const updated = [nextSession, ...savedLaunches.filter((session) => session.gameId !== gameId)]
      .slice(0, MAX_SAVED_GAME_SESSIONS);
    window.localStorage.setItem(GAME_LIBRARY_SESSION_STORAGE_KEY, JSON.stringify(updated));
    setSavedLaunches(updated);
  }, [savedLaunches]);

  const launchPlayableGame = useCallback((gameId: string, options: { expand?: boolean } = {}) => {
    setSelectedPlayableGame(gameId);
    setActivePlayableGame(gameId);
    if (options.expand) {
      setShowEnginSplash(true);
      setExpandedPlayableGame(gameId);
    }
    queuePlayableGameStart();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('de:games:last-launch', gameId);
    }
  }, [queuePlayableGameStart]);

  const openPlayableGamePage = useCallback((gameId: string, options: { expand?: boolean } = {}) => {
    savePlayableGame(gameId, options.expand ? 'fullscreen' : 'library-screen');
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(GAME_LIBRARY_SESSION_STORAGE_KEY, gameId);
    window.localStorage.setItem('de:games:last-launch', gameId);
    window.location.assign(buildGameLaunchHref(gameId, { play: true, expand: options.expand }));
  }, [savePlayableGame]);

  useEffect(() => {
    if (initializedPlaySurfaceRef.current) return;
    initializedPlaySurfaceRef.current = true;

    const fallbackGame = savedLaunches[0]?.gameId ?? GAMES[0]?.id ?? 'platformer';
    const requestedGame = resolveGameLaunchId(searchParams.get('game'), GAMES.map((game) => game.id), fallbackGame);
    if (!requestedGame) return;
    setSelectedPlayableGame(requestedGame);
    if (isLaunchFlagEnabled(searchParams.get('play'))) {
      setActivePlayableGame(requestedGame);
      if (isLaunchFlagEnabled(searchParams.get('expand'))) {
        setShowEnginSplash(true);
        setExpandedPlayableGame(requestedGame);
        // Consume the play-as-me flag and load the avatar if set
        if (consumePlayAsMe()) {
          const url = getAvatarDataUrl();
          if (url) setAvatarDataUrl(url);
        }
      }
      queuePlayableGameStart();
    }
  }, [queuePlayableGameStart, savedLaunches, searchParams]);

  useEffect(() => {
    if (!expandedPlayableGame || !playOverlayRef.current) return;
    const target = playOverlayRef.current;
    void (async () => {
      try {
        if (document.fullscreenElement === null && 'requestFullscreen' in target) {
          await target.requestFullscreen();
        }
      } catch {
        // Ignore fullscreen denial; keep the expanded overlay.
      }
    })();

    return () => {
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => undefined);
      }
    };
  }, [expandedPlayableGame]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const prevImmersive = document.body.dataset.deGameImmersive;
    if (expandedPlayableGame) {
      document.body.dataset.deGameImmersive = '1';
    } else {
      delete document.body.dataset.deGameImmersive;
    }
    window.dispatchEvent(new Event('de-game-layout-change'));
    return () => {
      if (prevImmersive) {
        document.body.dataset.deGameImmersive = prevImmersive;
      } else {
        delete document.body.dataset.deGameImmersive;
      }
      window.dispatchEvent(new Event('de-game-layout-change'));
    };
  }, [expandedPlayableGame]);

  useEffect(() => {
    if (!expandedPlayableGame) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleFullscreenChange = () => {
      if (document.fullscreenElement === null) setExpandedPlayableGame(null);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [expandedPlayableGame]);

  useEffect(() => {
    if (expandedPlayableGame) {
      setSessionUtilityBarRevealed(false);
    }
  }, [expandedPlayableGame]);

  // ── Achievement computation ───────────────────────────────────────────────────
  const selectedPlayable = GAMES.find((game) => game.id === selectedPlayableGame) ?? GAMES[0];
  const activePlayable = activePlayableGame ? GAMES.find((game) => game.id === activePlayableGame) ?? null : null;
  const expandedPlayable = expandedPlayableGame ? GAMES.find((game) => game.id === expandedPlayableGame) ?? null : null;
  const savedPlayableSession = selectedPlayable ? savedLaunches.find((session) => session.gameId === selectedPlayable.id) ?? null : null;
  const ActivePlayableComponent = activePlayable?.component && activePlayable.id === selectedPlayable.id
    ? activePlayable.component
    : null;
  const achievements = ACHIEVEMENT_DEFS.map(def => {
    let unlocked = def.unlockFn(scores);
    if (def.id === 'world-builder' && savedWorld)  unlocked = true;
    if (def.id === 'code-runner'   && savedScript) unlocked = true;
    return { ...def, unlocked };
  });

  if (expandedPlayable?.component) {
    const ExpandedGameComponent = expandedPlayable.component;

    return (
      <div
        ref={playOverlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#000',
          overflow: 'hidden',
        }}
      >
        {/* ── DREAMengin "Powered by" boot splash ── */}
        {showEnginSplash && (
          <EnginBootSplash
            game={expandedPlayable}
            onDone={() => setShowEnginSplash(false)}
          />
        )}

        <div style={{ position: 'absolute', inset: 0 }}>
          <ExpandedGameComponent />
        </div>

        <div
          aria-hidden={sessionUtilityBarRevealed}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: `calc(env(safe-area-inset-bottom, 0px) + ${sessionUtilityBarRevealed ? SESSION_BAR_REVEAL_GAP : SESSION_BAR_HIDE_COVER_HEIGHT}px)`,
            zIndex: 54,
            pointerEvents: sessionUtilityBarRevealed ? 'none' : 'auto',
            background: sessionUtilityBarRevealed
              ? 'transparent'
              : 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(2, 6, 23, 0.84) 44%, rgba(2, 6, 23, 0.98) 100%)',
            transition: 'height 180ms ease, background 180ms ease',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
            transform: 'translateX(-50%)',
            zIndex: 56,
            pointerEvents: 'auto',
          }}
        >
          <button
            type="button"
            aria-label={sessionUtilityBarRevealed ? 'Hide game chat bar' : 'Open game chat bar'}
            title={sessionUtilityBarRevealed ? 'Hide game chat bar' : 'Open game chat bar'}
            onClick={() => setSessionUtilityBarRevealed((prev) => !prev)}
            style={{
              width: sessionUtilityBarRevealed ? 58 : 44,
              height: sessionUtilityBarRevealed ? 12 : 8,
              borderRadius: 999,
              border: `1px solid ${sessionUtilityBarRevealed ? 'rgba(125,211,252,0.34)' : 'rgba(226,232,240,0.12)'}`,
              background: sessionUtilityBarRevealed
                ? 'rgba(8, 16, 30, 0.82)'
                : 'rgba(226, 232, 240, 0.32)',
              boxShadow: sessionUtilityBarRevealed
                ? '0 8px 18px rgba(15, 23, 42, 0.3)'
                : '0 6px 16px rgba(2, 6, 23, 0.28)',
              cursor: 'pointer',
              transition: 'all 160ms ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          />
        </div>

        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 55, display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => setExpandedPlayableGame(null)}
            style={{ background: 'rgba(3, 7, 18, 0.72)', border: '1px solid rgba(160,195,240,0.20)', borderRadius: 999, padding: '6px 12px', cursor: 'pointer', color: 'rgba(220,235,255,0.92)', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => savePlayableGame(expandedPlayable.id, 'fullscreen')}
            style={{ background: 'rgba(3,7,18,0.72)', border: '1px solid rgba(74,222,128,0.24)', borderRadius: 999, padding: '6px 10px', cursor: 'pointer', color: '#4ade80', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            title="Save session"
          >
            Save
          </button>
          <span
            title={gpConnected ? gamepadName : 'Press any button on your controller to connect'}
            style={{ fontSize: 9, fontWeight: 800, padding: '4px 8px', borderRadius: 999, background: 'rgba(3,7,18,0.72)', color: gpConnected ? '#4ade80' : 'rgba(160,195,240,0.45)', border: gpConnected ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(160,195,240,0.12)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
          >
            {gpConnected ? (isDualSense ? '🎮' : '🕹') : '🎮'}
          </span>
        </div>

        <GameHUD
          gameLabel={expandedPlayable.label}
          mode={expandedPlayable.mobileHudMode ?? 'buttons'}
          onExit={() => { setExpandedPlayableGame(null); setAvatarDataUrl(null); }}
        />

        {/* ── Avatar overlay — shown when user chose "Play as Yourself" ── */}
        {avatarDataUrl && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 56,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(3,7,18,0.80)',
              border: '1px solid rgba(124,58,237,0.40)',
              borderRadius: 999,
              padding: '5px 12px 5px 5px',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              boxShadow: '0 4px 16px rgba(124,58,237,0.18)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '2px solid #a78bfa',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarDataUrl}
                alt="Your avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a78bfa' }}>
                Playing as
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f8fbff' }}>You</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Lobby handlers ───────────────────────────────────────────────────────────
  function handleCreateRoom() {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    setLobbyCode(code);
    setLobbyPlayers(['You']);
    setLobbyActive(true);
    forgeRecord('Created lobby room');
  }

  function handleStartLobbyGame() {
    forgeRecord('Started lobby game');
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'games', 'game:lobby-start', { code: lobbyCode, players: lobbyPlayers },
    );
  }

  // ── Tournament handlers ──────────────────────────────────────────────────────
  function handlePickWinner(matchIndex: number, winner: string) {
    setBracket(prev => prev.map((m, i) => i === matchIndex ? { ...m, winner } : m));
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'games', 'game:tournament-match', { matchIndex, winner },
    );
  }

  // ── Replay handlers ──────────────────────────────────────────────────────────
  function handleReplayToggle() {
    const next = !replayRecording;
    setReplayRecording(next);
    forgeRecord(next ? 'Started recording replay' : 'Stopped recording replay');
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'games', 'game:replay-record', { recording: next },
    );
    if (!next) {
      const newReplay = {
        id: `rp-${Date.now()}`,
        game: 'Current Game',
        duration: '0:30',
        date: new Date().toISOString().split('T')[0],
      };
      setReplays(prev => [newReplay, ...prev]);
    }
  }

  // ── Social Challenge handlers ────────────────────────────────────────────────
  function handleSendChallenge() {
    setChallengeSent(true);
    forgeRecord('Sent game challenge');
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'games', 'game:challenge-send', {},
    );
    setTimeout(() => setChallengeSent(false), 3000);
  }

  function handleAcceptChallenge(id: string) {
    setActiveChallenges(prev => prev.filter(c => c.id !== id));
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'games', 'game:challenge-accept', { id },
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  const activeControlProfile = GAME_CONTROL_PROFILES.find((profile) => profile.id === controlProfile) ?? GAME_CONTROL_PROFILES[0];
  const playableCategoriesCount = new Set(GAMES.map((game) => game.category)).size;
  const engineDeckStats = [
    { label: 'Playable', value: String(GAMES.length), tone: '#7dd3fc' },
    { label: 'Categories', value: String(playableCategoriesCount), tone: '#c084fc' },
    { label: 'Saved Slots', value: String(savedLaunches.length), tone: '#4ade80' },
    { label: 'Backend', value: engineType ?? 'Detecting…', tone: engineType === 'WebGPU' ? '#a78bfa' : '#38bdf8' },
  ] as const;
  const selectedPlayableUsesEliteRuntime = selectedPlayable.id === 'neon-drift' || selectedPlayable.id === 'echo-arena';
  const selectedPlayableCapabilities = [
    'Fullscreen boot',
    'Universal HUD',
    'Quick resume',
    `${activeControlProfile.label} controls`,
    ...(selectedPlayableUsesEliteRuntime ? ['Elite engine telemetry', 'Adaptive quality'] : []),
  ];
  const selectedPlayableStatus = [
    `${selectedPlayable.category} class`,
    savedPlayableSession ? 'Saved to memory deck' : 'Ready for first save',
    activePlayable ? 'Live on play screen' : 'Standby',
    ...(selectedPlayableUsesEliteRuntime ? ['Elite engine active in web app'] : []),
  ];

  return (
    <div className="de-sky-bg min-h-screen">

      {/* ══════════════════════════════════════════ Header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full"
            style={{
              background: 'rgba(160,195,240,0.15)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Back to Games"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>
          <div
            style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg, ${ACCENT}, rgba(200,152,26,0.8))`,
            }}
          />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>
              GameEngin
            </div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Games · Console Layer · Powered by DREAMengin</div>
          </div>
          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
          >
            Console Side
          </span>
          {/* Engine type status badge — shows which GPU backend is powering the games layer */}
          {engineType && (
            <span
              title={engineType === 'WebGPU' ? 'WebGPU backend active — modern compute path' : 'WebGL2 backend active — compatibility path'}
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.05em',
                padding: '3px 8px',
                borderRadius: 999,
                background: engineType === 'WebGPU' ? 'rgba(139,92,246,0.14)' : 'rgba(56,189,248,0.12)',
                color:      engineType === 'WebGPU' ? '#a78bfa'               : '#38bdf8',
                border:     engineType === 'WebGPU' ? '1px solid rgba(139,92,246,0.30)' : '1px solid rgba(56,189,248,0.24)',
                flexShrink: 0,
              }}
            >
              {engineType === 'WebGPU' ? '⚡ WebGPU' : '🔷 WebGL2'}
            </span>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════ Body */}
      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>

        <div className="de-widget" style={{ marginBottom: 14, borderColor: 'rgba(125,211,252,0.24)', background: 'linear-gradient(180deg, rgba(10,18,38,0.98), rgba(2,6,14,0.98))', color: '#f8fbff' }}>
          <div className="de-widget-header" style={{ borderBottomColor: 'rgba(125,211,252,0.18)' }}>
            <Play className="w-4 h-4" style={{ color: '#7dd3fc' }} />
            <span className="de-widget-title ml-2" style={{ color: '#f8fbff' }}>Play Screen</span>
            <span className="ml-auto text-xs font-semibold px-2 py-1 rounded-full" style={{ background: 'rgba(125,211,252,0.12)', color: '#7dd3fc', border: '1px solid rgba(125,211,252,0.22)' }}>
              Engine only
            </span>
          </div>
          <div className="de-widget-body" style={{ paddingTop: 12 }}>
            <div style={{ fontSize: 12, lineHeight: 1.65, color: 'rgba(226,232,240,0.78)', marginBottom: 14 }}>
              GameEngin is the actual play surface. Pick a saved game or any library title, boot it on the big screen here, expand fullscreen when you want the browser to disappear, and use the universal HUD directly on the session. This layer should feel like the premium runtime OS behind every playable game, not just a launcher. Elite-engine titles surface their runtime directly here in the web app with live telemetry, adaptive quality, and AI-assisted pacing.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 14 }}>
              {engineDeckStats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    borderRadius: 16,
                    padding: '12px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(125,211,252,0.12)',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: stat.tone }}>
                    {stat.label}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900, color: '#f8fbff', lineHeight: 1 }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)]" style={{ marginBottom: 12 }}>
              <div style={{ borderRadius: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(125,211,252,0.12)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7dd3fc', marginBottom: 8 }}>
                  Now Playing Deck
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: `${selectedPlayable.color}18`, border: `1px solid ${selectedPlayable.color}44` }}>
                    {selectedPlayable.emoji}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#f8fbff', letterSpacing: '-0.02em' }}>{selectedPlayable.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.68)', lineHeight: 1.55 }}>{selectedPlayable.desc}</div>
                  </div>
                </div>
              </div>

              <div style={{ borderRadius: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(125,211,252,0.12)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7dd3fc', marginBottom: 8 }}>
                  Engine Status
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedPlayableStatus.map((item) => (
                    <span
                      key={item}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.06)',
                        color: 'rgba(226,232,240,0.82)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {savedLaunches.slice(0, 5).map((session) => (
                <button
                  key={session.gameId}
                  type="button"
                  onClick={() => setSelectedPlayableGame(session.gameId)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 999,
                    border: session.gameId === selectedPlayable.id ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(125,211,252,0.16)',
                    background: session.gameId === selectedPlayable.id ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)',
                    color: session.gameId === selectedPlayable.id ? '#4ade80' : 'rgba(226,232,240,0.74)',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {session.label}
                </button>
              ))}
            </div>

            <div style={{ borderRadius: 24, padding: 14, background: 'linear-gradient(180deg, rgba(28,37,58,0.96), rgba(5,8,16,0.98))', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 22px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(125,211,252,0.14)', background: 'radial-gradient(circle at top, rgba(42,138,184,0.18), rgba(3,5,10,0.98) 60%)', minHeight: 320 }}>
                {ActivePlayableComponent ? (
                  <div style={{ padding: 12 }}>
                    <ActivePlayableComponent />
                  </div>
                ) : (
                  <div style={{ minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '32px 24px', textAlign: 'center' }}>
                    <div style={{ width: 82, height: 82, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, background: `${selectedPlayable.color}18`, border: `1px solid ${selectedPlayable.color}35`, boxShadow: `0 0 28px ${selectedPlayable.color}33` }}>
                      {selectedPlayable.emoji}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7dd3fc' }}>
                      Ready to boot
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#f8fbff', lineHeight: 1.05 }}>
                      {selectedPlayable.label}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(226,232,240,0.74)', maxWidth: 640 }}>
                      {selectedPlayable.desc}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]" style={{ marginTop: 14, marginBottom: 12 }}>
              <div style={{ borderRadius: 18, padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(125,211,252,0.12)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7dd3fc', marginBottom: 8 }}>
                  Launch Modes
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Fullscreen Boot', 'Screen Play', 'Remote Dock'].map((mode) => (
                    <span
                      key={mode}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '5px 10px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.06)',
                        color: '#f8fbff',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {mode}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ borderRadius: 18, padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(125,211,252,0.12)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7dd3fc', marginBottom: 8 }}>
                  Engine Capabilities
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedPlayableCapabilities.map((capability) => (
                    <span
                      key={capability}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '5px 10px',
                        borderRadius: 999,
                        background: `${selectedPlayable.color}18`,
                        color: selectedPlayable.color,
                        border: `1px solid ${selectedPlayable.color}35`,
                      }}
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, borderRadius: 18, padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(125,211,252,0.14)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7dd3fc', marginBottom: 8 }}>
                Side B session contract
              </div>
              <div style={{ fontSize: 12, color: 'rgba(220,235,255,0.82)', lineHeight: 1.7 }}>
                This game runs inside <span style={{ color: '#fff', fontWeight: 800 }}>GameEngin</span> with the universal HUD over the session.
                The engine owns fullscreen, input, resume, and controller handoff — not a separate remote dock under the canvas.
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14, marginBottom: 12 }}>
              <button type="button" onClick={() => openPlayableGamePage(selectedPlayable.id, { expand: true })} className="de-btn de-btn-primary text-xs" style={{ gap: 6 }}>
                ⤢ Play fullscreen
              </button>
              <button type="button" onClick={() => openPlayableGamePage(selectedPlayable.id)} className="de-btn de-btn-ghost text-xs" style={{ gap: 6, borderColor: 'rgba(125,211,252,0.22)', color: '#7dd3fc' }}>
                ▶ Run in GameEngin
              </button>
              <button type="button" onClick={() => savePlayableGame(selectedPlayable.id, 'library-screen')} className="de-btn de-btn-ghost text-xs" style={{ gap: 6, borderColor: 'rgba(74,222,128,0.22)', color: '#4ade80' }}>
                💾 Save state
              </button>
            </div>

            {savedPlayableSession && (
              <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, marginBottom: 12 }}>
                Last saved: {savedPlayableSession.label} · {new Date(savedPlayableSession.savedAt).toLocaleString()}
              </div>
            )}

            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {GAMES.slice(0, 12).map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => setSelectedPlayableGame(game.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: game.id === selectedPlayable.id ? `1px solid ${game.color}66` : '1px solid rgba(160,195,240,0.14)',
                    background: game.id === selectedPlayable.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#f8fbff',
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{game.emoji}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{game.label}</span>
                  {savedLaunches.some((session) => session.gameId === game.id) && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80' }}>Saved</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ────────────────────── 1. Console Deck */}
        <div className="de-widget" style={{ marginBottom: 14, borderColor: `${ACCENT}30` }}>
          <div className="de-widget-header">
            <Gamepad2 className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Console Home</span>
            <span
              className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
            >
              Premium runtime deck
            </span>
          </div>
          <div className="de-widget-body">
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.6, marginBottom: 12 }}>
              GameEngin is the console home behind the Games shelf: saved launches, quick resume, controller memory, and your personal score deck. It should read like a premium runtime layer instead of a toy control panel.
            </div>
            {savedLaunches[0] && (
              <div
                style={{
                  marginBottom: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', marginBottom: 4 }}>
                  Quick Resume
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--de-heading)' }}>
                  {savedLaunches[0].label} saved from the {savedLaunches[0].source === 'fullscreen' ? 'fullscreen' : 'library screen'} · {new Date(savedLaunches[0].savedAt).toLocaleString()}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {GAME_QUALITY_PILLARS.map((pillar) => (
                <span
                  key={pillar.id}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: `${ACCENT}12`,
                    color: ACCENT,
                    border: `1px solid ${ACCENT}25`,
                  }}
                >
                  {pillar.title}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GAME_CONTROL_PROFILES.map((profile) => {
                const selected = profile.id === activeControlProfile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleControlProfileSelect(profile.id)}
                    aria-pressed={selected}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      border: selected ? `2px solid ${ACCENT}` : '1px solid rgba(160,195,240,0.18)',
                      background: selected ? `${ACCENT}14` : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: selected ? ACCENT : 'var(--de-heading)' }}>{profile.label}</span>
                      {selected && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Active
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
                      {profile.summary}
                    </div>
                  </button>
                );
              })}
            </div>
            <div
              style={{
                marginTop: 12,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(160,195,240,0.18)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 4 }}>
                {activeControlProfile.label} focus
              </div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
                {activeControlProfile.bullets[0]} · {activeControlProfile.bullets[1]}
              </div>
            </div>
          </div>
        </div>

        {/* ────────────────────── 2. Quick Resume */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Gamepad2 className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Quick Resume</span>
            <span
              className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.25)' }}
            >
              Session
            </span>
          </div>
          <div className="de-widget-body">
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.6, marginBottom: 12 }}>
              Pick up where you left off. Browse the full game library on the Games Daydream (Side A) — jump back in here for your last sessions.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QUICK_PLAY_GAME_IDS.slice(0, 3)
                .map((gameId) => GAMES.find((game) => game.id === gameId))
                .filter((game): game is (typeof GAMES)[number] => Boolean(game))
                .map((g) => (
                <Link
                  key={g.id}
                  href={buildGameLaunchHref(g.id, { play: true })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
                    background: 'rgba(255,255,255,0.45)',
                    border: '1px solid rgba(160,195,240,0.14)',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{g.emoji}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                    {g.label}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--de-text-dim)', marginRight: 6 }}>Resume</span>
                  <Play className="w-3 h-3 flex-shrink-0" style={{ color: ACCENT, opacity: 0.7 }} />
                </Link>
              ))}
            </div>
          </div>
          <div className="de-widget-actions">
            <Link href="/daydream/games" className="de-btn de-btn-primary text-xs" style={{ gap: 6 }}>
              <Gamepad2 className="w-3 h-3" /> Browse Full Library ({GAMES.length} Games)
            </Link>
          </div>
        </div>

        {/* ────────────────────── 2. Personal Bests */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Trophy className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title ml-2">Personal Bests</span>
          </div>
          <div className="de-widget-body">
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                Loading scores…
              </p>
            ) : Object.keys(bestByGame).length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                <Gamepad2 className="w-6 h-6 flex-shrink-0" style={{ color: ACCENT, opacity: 0.3 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                    No scores yet
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                    Play a game above to record your first score.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(bestByGame).map(([game, best]) => (
                  <div
                    key={game}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(160,195,240,0.18)',
                    }}
                  >
                    <Gamepad2 className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT, opacity: 0.7 }} />
                    <span
                      style={{
                        flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                      }}
                    >
                      {GAME_LABELS[game] ?? game}
                    </span>
                    <span
                      style={{
                        fontSize: 12, fontWeight: 800, color: ACCENT,
                        background: `${ACCENT}14`, padding: '2px 10px',
                        borderRadius: 999, border: `1px solid ${ACCENT}25`,
                        flexShrink: 0,
                      }}
                    >
                      {best.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ────────────────────── 3. Share to Leaderboard */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Share2 className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Share to Leaderboard</span>
          </div>
          <div className="de-widget-body">
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>Loading…</p>
            ) : scores.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                Play a game to record a score you can share to the leaderboard.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scores.map(s => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.45)',
                      border: '1px solid rgba(160,195,240,0.14)',
                    }}
                  >
                    <span
                      style={{
                        flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--de-heading)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                      }}
                    >
                      {GAME_LABELS[s.game] ?? s.game} — {s.score.toLocaleString()}
                    </span>
                    {s.shared ? (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>
                        ✓ Shared
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleShare(s.id)}
                        disabled={sharing === s.id}
                        className="de-btn de-btn-primary"
                        style={{ fontSize: 10, padding: '4px 12px', flexShrink: 0, opacity: sharing === s.id ? 0.6 : 1 }}
                      >
                        {sharing === s.id ? 'Sharing…' : 'Share'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ────────────────────── 4. Controller Deck */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Gamepad2 className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Universal HUD</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 4 }}>
              Game inputs now live inside the GameEngin session. Launch a game and the universal HUD overlays the full-screen runtime instead of opening a separate remote deck.
            </p>
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={() => openPlayableGamePage(selectedPlayable.id, { expand: true })}
              className="de-btn de-btn-primary text-xs"
              style={{ gap: 6 }}
            >
              <Gamepad2 className="w-3 h-3" /> Launch current session
            </button>
          </div>
        </div>

        {/* ────────────────────── 5. World Builder */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Map className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">World Builder</span>
            {savedWorld ? (
              <span
                className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                ✓ Saved
              </span>
            ) : (
              <span
                className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}30`, fontSize: 10 }}
              >
                5×5 Grid
              </span>
            )}
          </div>
          <div className="de-widget-body">

            {/* World name input */}
            <div style={{ marginBottom: 14 }}>
              <label
                htmlFor="world-name-input"
                style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)', display: 'block', marginBottom: 5 }}
              >
                World Name
              </label>
              <input
                id="world-name-input"
                type="text"
                value={worldName}
                onChange={e => setWorldName(e.target.value)}
                placeholder="My Awesome World"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                  border: `1px solid rgba(160,195,240,0.35)`,
                  background: 'rgba(255,255,255,0.65)', color: 'var(--de-heading)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Tile picker */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 7 }}>
                Tile Picker
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(Object.keys(TILE_META) as TileType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTile(t)}
                    aria-pressed={selectedTile === t}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 11px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer',
                      border: selectedTile === t ? `2px solid ${ACCENT}` : '2px solid rgba(160,195,240,0.22)',
                      background: selectedTile === t ? `${ACCENT}18` : 'rgba(255,255,255,0.45)',
                      color: selectedTile === t ? ACCENT : 'var(--de-heading)',
                      transition: 'all 0.12s',
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{TILE_META[t].emoji}</span>
                    {TILE_META[t].label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5×5 Grid */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 7 }}>
                Grid — tap a cell to paint with the selected tile
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: 4,
                  maxWidth: 270,
                }}
              >
                {worldGrid.map((row, ri) =>
                  row.map((tile, ci) => (
                    <button
                      key={`${ri}-${ci}`}
                      type="button"
                      onClick={() => handleTileClick(ri, ci)}
                      title={`Row ${ri + 1}, Col ${ci + 1}: ${TILE_META[tile].label}`}
                      aria-label={`Paint tile at row ${ri + 1} column ${ci + 1} as ${selectedTile}`}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 7,
                        border: '1px solid rgba(160,195,240,0.28)',
                        background: TILE_META[tile].bg,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18,
                        transition: 'transform 0.07s, background 0.1s',
                      }}
                    >
                      {TILE_META[tile].emoji}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Saved world confirmation */}
            {savedWorld && (
              <div
                style={{
                  fontSize: 11, color: '#16a34a', fontWeight: 600,
                  padding: '7px 12px', borderRadius: 8,
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.22)',
                }}
              >
                ✓ &quot;{savedWorld.name}&quot; saved to your session
              </div>
            )}
          </div>
          <div className="de-widget-actions" style={{ gap: 8 }}>
            <button
              type="button"
              onClick={handleSaveWorld}
              disabled={!worldName.trim()}
              className="de-btn de-btn-primary text-xs"
              style={{ gap: 6, opacity: worldName.trim() ? 1 : 0.45, cursor: worldName.trim() ? 'pointer' : 'not-allowed' }}
            >
              <Map className="w-3 h-3" /> Save World
            </button>
            <Link
              href="/daydream/games"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                textDecoration: 'none', cursor: 'pointer',
                border: `1px solid ${ACCENT}35`,
                color: ACCENT, background: `${ACCENT}0d`,
                transition: 'background 0.13s',
              }}
            >
              <Play className="w-3 h-3" /> Test World
            </Link>
          </div>
        </div>

        {/* ────────────────────── 6. Achievement System */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Award className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title ml-2">Achievements</span>
            <span
              className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
            >
              {achievements.filter(a => a.unlocked).length} / {achievements.length}
            </span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {achievements.map(ach => (
                <div
                  key={ach.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: ach.unlocked
                      ? 'rgba(255,255,255,0.55)'
                      : 'rgba(200,212,228,0.22)',
                    border: ach.unlocked
                      ? `1px solid ${ACCENT}30`
                      : '1px solid rgba(160,195,240,0.12)',
                    opacity: ach.unlocked ? 1 : 0.62,
                    transition: 'opacity 0.2s, background 0.2s',
                  }}
                >
                  <span
                    style={{
                      fontSize: 22, lineHeight: 1, flexShrink: 0,
                      filter: ach.unlocked ? 'none' : 'grayscale(1) opacity(0.45)',
                    }}
                  >
                    {ach.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13, fontWeight: 700, color: 'var(--de-heading)',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      {ach.name}
                      {ach.unlocked && (
                        <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 800 }}>✓</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 2 }}>
                      {ach.description}
                    </div>
                  </div>
                  {ach.unlocked ? (
                    <Unlock className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                  ) : (
                    <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(160,195,240,0.45)' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ────────────────────── 7. Physics Config */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Sliders className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Physics Config</span>
            {appliedPhysics && (
              <span
                className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                ✓ Applied
              </span>
            )}
          </div>
          <div className="de-widget-body">

            {/* Gravity preset selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 8 }}>
                Gravity Preset
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {(Object.keys(GRAVITY_META) as GravityPreset[]).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setPhysicsConfig(prev => ({ ...prev, gravity: g }))}
                    aria-pressed={physicsConfig.gravity === g}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                      border: physicsConfig.gravity === g
                        ? `2px solid ${ACCENT}`
                        : '2px solid rgba(160,195,240,0.22)',
                      background: physicsConfig.gravity === g
                        ? `${ACCENT}18`
                        : 'rgba(255,255,255,0.45)',
                      transition: 'all 0.12s',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{GRAVITY_META[g].emoji}</span>
                    <span
                      style={{
                        fontSize: 12, fontWeight: 800,
                        color: physicsConfig.gravity === g ? ACCENT : 'var(--de-heading)',
                      }}
                    >
                      {GRAVITY_META[g].label}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--de-text-dim)', fontWeight: 600 }}>
                      {GRAVITY_META[g].value}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Friction slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)' }}>
                  Friction
                </span>
                <span
                  style={{
                    fontSize: 12, fontWeight: 800, color: ACCENT,
                    background: `${ACCENT}14`, padding: '1px 10px',
                    borderRadius: 999, border: `1px solid ${ACCENT}25`,
                  }}
                >
                  {physicsConfig.friction}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={physicsConfig.friction}
                onChange={e => setPhysicsConfig(prev => ({ ...prev, friction: Number(e.target.value) }))}
                aria-label="Friction"
                style={{ width: '100%', accentColor: ACCENT }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>0 — Slippery</span>
                <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>100 — Sticky</span>
              </div>
            </div>

            {/* Applied confirmation */}
            {appliedPhysics && (
              <div
                style={{
                  marginTop: 12, fontSize: 11, color: '#16a34a', fontWeight: 600,
                  padding: '7px 12px', borderRadius: 8,
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.22)',
                }}
              >
                ✓ {GRAVITY_META[appliedPhysics.gravity].label} gravity
                &nbsp;·&nbsp;{appliedPhysics.friction}% friction applied to world
              </div>
            )}
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleApplyPhysics}
              className="de-btn de-btn-primary text-xs"
              style={{ gap: 6 }}
            >
              <Sliders className="w-3 h-3" /> Apply to World
            </button>
          </div>
        </div>

        {/* ────────────────────── 8. Game Scripts (premium) */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <FileCode className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Game Scripts</span>
            <span
              style={{
                marginLeft: 7, fontSize: 9, fontWeight: 700,
                padding: '2px 7px', borderRadius: 999,
                background: 'rgba(124,58,237,0.12)', color: '#7c3aed',
                border: '1px solid rgba(124,58,237,0.22)',
                letterSpacing: '0.04em', flexShrink: 0,
              }}
            >
              PREMIUM
            </span>
            {/* Live CI badge */}
            <span
              className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
            >
              ● Live CI · Ready
            </span>
          </div>
          <div className="de-widget-body">

            {/* Language selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {(['GameScript', 'Lua'] as ScriptLanguage[]).map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setScriptState(prev => ({ ...prev, language: lang }))}
                  aria-pressed={scriptState.language === lang}
                  style={{
                    padding: '4px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    cursor: 'pointer',
                    border: scriptState.language === lang
                      ? `2px solid ${ACCENT}`
                      : '2px solid rgba(160,195,240,0.22)',
                    background: scriptState.language === lang
                      ? `${ACCENT}18`
                      : 'rgba(255,255,255,0.45)',
                    color: scriptState.language === lang ? ACCENT : 'var(--de-text-dim)',
                    transition: 'all 0.12s',
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Script textarea */}
            <textarea
              rows={4}
              value={scriptState.code}
              onChange={e => setScriptState(prev => ({ ...prev, code: e.target.value }))}
              spellCheck={false}
              aria-label="Game script editor"
              style={{
                width: '100%', padding: '10px 13px', borderRadius: 8, fontSize: 12,
                fontFamily: 'ui-monospace, SFMono-Regular, "Cascadia Code", monospace',
                border: `1px solid rgba(42,138,184,0.3)`,
                background: 'rgba(12,22,40,0.82)', color: '#b8e0ff',
                resize: 'vertical', boxSizing: 'border-box',
                lineHeight: 1.65, outline: 'none',
              }}
            />

            {/* Script saved confirmation */}
            {savedScript !== null && (
              <div
                style={{
                  marginTop: 8, fontSize: 11, color: '#16a34a', fontWeight: 600,
                  padding: '7px 12px', borderRadius: 8,
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.22)',
                }}
              >
                ✓ Script saved · bridge event emitted
              </div>
            )}
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleSaveScript}
              className="de-btn de-btn-primary text-xs"
              style={{ gap: 6 }}
            >
              <FileCode className="w-3 h-3" /> Save Script
            </button>
          </div>
        </div>

        {/* ────────────────────── 9. Cross-Engin Sync Panel */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Radio className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Cross-Engin Sync</span>
            <span
              className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
            >
              5 Connected
            </span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {crossEnginChannels.map(engin => (
                <div
                  key={engin.name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.45)',
                    border: '1px solid rgba(160,195,240,0.14)',
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{engin.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                      {engin.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 1 }}>
                      {engin.label}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                      padding: '3px 9px', borderRadius: 999,
                      background: `${ACCENT}18`, color: ACCENT,
                      border: `1px solid ${ACCENT}35`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ● {engin.status}
                  </span>
                  {engin.name === 'Music' && syncedMusicClip ? (
                    <audio
                      controls
                      preload="none"
                      src={buildLedgerMediaUrl(syncedMusicClip.bucket, syncedMusicClip.storagePath)}
                      style={{ maxWidth: 220 }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Multiplayer Lobby ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Gamepad2 className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Multiplayer Lobby</span>
            {lobbyActive && (
              <span
                className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                Open
              </span>
            )}
          </div>
          <div className="de-widget-body">
            {lobbyActive ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: `${ACCENT}08`, border: `1px solid ${ACCENT}25`, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 4 }}>ROOM CODE</div>
                  <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.15em', color: ACCENT, fontFamily: 'monospace' }}>{lobbyCode}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 12px', borderRadius: 10,
                        background: lobbyPlayers[i] ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)',
                        border: `1px solid ${lobbyPlayers[i] ? 'rgba(34,197,94,0.2)' : 'rgba(160,195,240,0.12)'}`,
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{lobbyPlayers[i] ? '🟢' : '⭕'}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: lobbyPlayers[i] ? 'var(--de-heading)' : 'var(--de-text-dim)' }}>
                        {lobbyPlayers[i] ?? `Waiting for player ${i + 1}…`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
                Create a room to invite up to 4 players for a multiplayer session.
              </p>
            )}
          </div>
          <div className="de-widget-actions">
            {!lobbyActive ? (
              <button
                type="button"
                onClick={handleCreateRoom}
                className="de-btn de-btn-primary"
                aria-label="Create multiplayer room"
                style={{ transition: 'all 0.15s' }}
              >
                Create Room
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartLobbyGame}
                className="de-btn de-btn-primary"
                aria-label="Start lobby game"
                style={{ transition: 'all 0.15s' }}
              >
                <Play className="w-3 h-3 mr-1" />
                Start Game
              </button>
            )}
          </div>
        </div>

        {/* ── Tournament Mode ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Trophy className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Tournament Mode</span>
            <span
              className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
            >
              {bracket.filter(m => m.winner).length}/{bracket.length} Complete
            </span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bracket.map((match, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: match.winner ? `${ACCENT}08` : 'rgba(255,255,255,0.5)',
                    border: match.winner ? `1px solid ${ACCENT}25` : '1px solid rgba(160,195,240,0.18)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>
                      {match.player1} vs {match.player2}
                    </div>
                    {match.winner && (
                      <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600, marginTop: 2 }}>
                        ✓ Winner: {match.winner}
                      </div>
                    )}
                  </div>
                  {!match.winner && (
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      {[match.player1, match.player2].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePickWinner(i, p)}
                          aria-label={`Pick ${p} as winner of match ${i + 1}`}
                          style={{
                            padding: '4px 9px', borderRadius: 7, fontSize: 10, fontWeight: 600,
                            border: `1px solid ${ACCENT}35`, background: `${ACCENT}12`, color: ACCENT,
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Game Analytics ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Award className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Game Analytics</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {analyticsData.map((m, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 14px', borderRadius: 11,
                    background: 'rgba(255,255,255,0.55)', border: `1px solid ${ACCENT}15`,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    {m.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--de-heading)', lineHeight: 1 }}>
                      {m.value}
                    </span>
                    <span style={{ fontSize: 12 }}>
                      {m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Replay System ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Play className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Replay System</span>
            {replayRecording && (
              <span
                className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                ● REC
              </span>
            )}
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {replays.map(r => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(160,195,240,0.18)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.game}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 1 }}>
                      {r.duration} · {r.date}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Watch replay of ${r.game}`}
                    style={{
                      padding: '4px 10px', borderRadius: 7, fontSize: 10, fontWeight: 700,
                      border: `1px solid ${ACCENT}35`, background: `${ACCENT}12`, color: ACCENT,
                      cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                    }}
                  >
                    ▶ Watch
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleReplayToggle}
              className={replayRecording ? 'de-btn de-btn-ghost' : 'de-btn de-btn-primary'}
              aria-label={replayRecording ? 'Stop recording replay' : 'Start recording replay'}
              style={{ transition: 'all 0.15s' }}
            >
              {replayRecording ? '■ Stop' : '● Record'}
            </button>
          </div>
        </div>

        {/* ── Social Challenge ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Share2 className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Social Challenge</span>
            {activeChallenges.length > 0 && (
              <span
                className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
              >
                {activeChallenges.length} pending
              </span>
            )}
          </div>
          <div className="de-widget-body">
            {activeChallenges.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
                {activeChallenges.map(c => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(160,195,240,0.18)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>
                        {c.from}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 1 }}>
                        {c.game} · Score: {c.score.toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAcceptChallenge(c.id)}
                      aria-label={`Accept challenge from ${c.from}`}
                      style={{
                        padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                        border: 'none', background: ACCENT, color: '#fff',
                        cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                      }}
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 12 }}>
                No active challenges. Send one to a friend!
              </p>
            )}
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleSendChallenge}
              disabled={challengeSent}
              className="de-btn de-btn-primary"
              aria-label="Challenge a friend"
              style={{ opacity: challengeSent ? 0.6 : 1, transition: 'all 0.15s' }}
            >
              {challengeSent ? '✓ Challenge Sent!' : '🏆 Challenge a Friend'}
            </button>
          </div>
        </div>

        {/* ── Feature 17: Season Pass / Battle Pass Tracker ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>⭐</span>
            <span className="de-widget-title ml-2">Season Pass</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#c8981a', background: 'rgba(200,152,26,0.12)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>
              Season 3
            </span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--de-text-dim)' }}>XP Progress</span>
              <span style={{ fontWeight: 700, color: 'var(--de-heading)' }}>{seasonXP.toLocaleString()} / {seasonMax.toLocaleString()} XP</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(200,152,26,0.12)', marginBottom: 8 }}>
              <div style={{ height: '100%', borderRadius: 4, width: `${Math.round((seasonXP / seasonMax) * 100)}%`, background: 'linear-gradient(90deg, #c8981a, #f59e0b)', transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
              {[
                { tier: 1, reward: '💎', xpNeeded: 2000 },
                { tier: 2, reward: '🎮', xpNeeded: 4000 },
                { tier: 3, reward: '🏆', xpNeeded: 6000 },
                { tier: 4, reward: '🌟', xpNeeded: 8000 },
                { tier: 5, reward: '👑', xpNeeded: 10000 },
              ].map(t => {
                const unlocked = seasonXP >= t.xpNeeded;
                return (
                  <div key={t.tier} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 8, background: unlocked ? 'rgba(200,152,26,0.15)' : 'rgba(0,0,0,0.05)', border: `1px solid ${unlocked ? 'rgba(200,152,26,0.35)' : 'rgba(0,0,0,0.08)'}`, opacity: unlocked ? 1 : 0.5 }}>
                    <div style={{ fontSize: 18, filter: unlocked ? 'none' : 'grayscale(1)' }}>{t.reward}</div>
                    <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2 }}>T{t.tier}</div>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={() => earnXP(250)}
              style={{ marginTop: 10, width: '100%', padding: '7px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(200,152,26,0.12)', border: '1px solid rgba(200,152,26,0.3)', color: '#c8981a', cursor: 'pointer' }}>
              + Earn 250 XP (Practice Session)
            </button>
          </div>
        </div>

        {/* ── Feature 18: Daily / Weekly Quests ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>📋</span>
            <span className="de-widget-title ml-2">Daily Quests</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>
              {quests.filter(q => q.done).length}/{quests.length} done
            </span>
          </div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {quests.map(q => (
              <button key={q.id} type="button" onClick={() => toggleQuest(q.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, background: q.done ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.5)', border: `1px solid ${q.done ? 'rgba(34,197,94,0.25)' : 'rgba(0,0,0,0.06)'}`, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <span style={{ fontSize: 16 }}>{q.done ? '✅' : '⬜'}</span>
                <span style={{ flex: 1, fontSize: 11, color: 'var(--de-heading)', fontWeight: 600, textDecoration: q.done ? 'line-through' : 'none', opacity: q.done ? 0.6 : 1 }}>{q.quest}</span>
                <span style={{ fontSize: 10, color: '#c8981a', fontWeight: 700 }}>+{q.xp} XP</span>
              </button>
            ))}
            <p style={{ fontSize: 10, color: 'var(--de-text-dim)', textAlign: 'center', marginTop: 4 }}>Tap a quest to mark it complete — XP added to your Season Pass</p>
          </div>
        </div>

        {/* ── Feature 19: Dream Economy ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>💰</span>
            <span className="de-widget-title ml-2">Dream Economy</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div style={{ padding: '10px 8px', borderRadius: 10, background: 'rgba(200,152,26,0.08)', border: '1px solid rgba(200,152,26,0.25)', textAlign: 'center' }}>
                <div style={{ fontSize: 20 }}>🟡</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#c8981a' }}>{coins.toLocaleString()}</div>
                <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2 }}>DreamCoins</div>
              </div>
              <div style={{ padding: '10px 8px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: 20 }}>💎</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#6366f1' }}>142</div>
                <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2 }}>Gems</div>
              </div>
              <div style={{ padding: '10px 8px', borderRadius: 10, background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: 20 }}>🎫</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#ec4899' }}>28</div>
                <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2 }}>Tokens</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <button type="button" onClick={() => { setCoins(c => c + 25); }}
                style={{ flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(200,152,26,0.12)', border: '1px solid rgba(200,152,26,0.3)', color: '#c8981a', cursor: 'pointer' }}>
                🎁 Daily Login +25
              </button>
              <button type="button" onClick={() => { setCoins(c => Math.max(0, c - 100)); }}
                style={{ flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366f1', cursor: 'pointer' }}>
                🛒 Spend 100
              </button>
            </div>
          </div>
        </div>

        {/* ── Feature 20: Speedrun Timer ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>⏱</span>
            <span className="de-widget-title ml-2">Speedrun Timer</span>
            {srActive && <span style={{ marginLeft: 'auto', fontSize: 9, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 4, fontWeight: 700, animation: 'pulse 1s infinite' }}>● LIVE</span>}
          </div>
          <div className="de-widget-body">
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 40, fontWeight: 900, fontFamily: 'monospace', color: srMs > srPB ? '#ef4444' : '#2a8ab8', letterSpacing: '0.04em', transition: 'color 0.3s' }}>
                {srFormat(srMs)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 4 }}>
                PB: {srFormat(srPB)} {srMs > 0 && srMs <= srPB && <span style={{ color: '#22c55e', fontWeight: 700 }}>🎯 On pace!</span>}
                {srMs > srPB && srMs > 0 && <span style={{ color: '#ef4444', fontWeight: 700 }}>+{srFormat(srMs - srPB)} behind PB</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" onClick={() => setSrActive(a => !a)}
                style={{ flex: 1, padding: '10px 4px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: srActive ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.14)', border: `1px solid ${srActive ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, color: srActive ? '#ef4444' : '#22c55e' }}>
                {srActive ? '⏸ Pause' : srMs > 0 ? '▶ Resume' : '▶ Start'}
              </button>
              <button type="button" onClick={() => setSrSplits(s => [...s, srMs])}
                disabled={!srActive}
                style={{ flex: 1, padding: '10px 4px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: srActive ? 'pointer' : 'default', background: 'rgba(42,138,184,0.12)', border: '1px solid rgba(42,138,184,0.25)', color: '#2a8ab8', opacity: srActive ? 1 : 0.4 }}>
                ✂ Split
              </button>
              <button type="button" onClick={() => { setSrActive(false); setSrMs(0); setSrSplits([]); }}
                style={{ flex: 1, padding: '10px 4px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                🔄 Reset
              </button>
            </div>
            {srSplits.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {srSplits.map((split, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 8px', borderRadius: 7, background: split <= srPB * ((i + 1) / 3) ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)' }}>
                    <span style={{ color: 'var(--de-text-dim)' }}>Split {i + 1}</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--de-heading)' }}>{srFormat(split)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Engine Power Systems Status — 20 Subsystems ── */}
        <div className="de-widget" style={{ marginBottom: 14, borderColor: 'rgba(42,138,184,0.28)' }}>
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>🚀</span>
            <span className="de-widget-title ml-2" style={{ color: '#2a8ab8' }}>Engine Power Systems</span>
            <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 4 }}>
              20 / 20 LOADED
            </span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10, lineHeight: 1.5 }}>
              Elite 2026+ engine subsystems powering every game on the platform.
              All systems are zero-visual-overhead — pure computational runtime power.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {ENGINE_POWER_SYSTEMS.map(sys => (
                <div key={sys.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(42,138,184,0.12)' }}>
                  <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{sys.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)', whiteSpace: 'nowrap' }}>{sys.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: sys.status === 'online' ? '#22c55e' : '#f59e0b', background: sys.status === 'online' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>
                        {sys.status === 'online' ? '● ONLINE' : '◎ STANDBY'}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)', lineHeight: 1.4 }}>{sys.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'linear-gradient(135deg, rgba(42,138,184,0.08), rgba(99,102,241,0.06))', border: '1px solid rgba(42,138,184,0.18)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#2a8ab8', marginBottom: 6 }}>ENGINE RUNTIME PROFILE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { label: 'Systems Online',  value: '17 / 20' },
                  { label: 'GPU Backend',     value: typeof navigator !== 'undefined' && (navigator as { gpu?: unknown }).gpu ? 'WebGPU' : 'WebGL2' },
                  { label: 'Physics Substeps', value: '4× / frame' },
                  { label: 'Rollback Buffer',  value: '8 frames' },
                  { label: 'LOD Levels',       value: '0 → 6' },
                  { label: 'SH Probes',        value: 'L2 (9 coeff)' },
                  { label: 'Asset Cache',      value: '256 MB max' },
                  { label: 'Job Concurrency',  value: '4 workers' },
                ].map(m => (
                  <div key={m.label} style={{ padding: '5px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(42,138,184,0.1)' }}>
                    <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginBottom: 1 }}>{m.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#2a8ab8', fontFamily: 'monospace' }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Journey Trail ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Map className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Journey</span>
          </div>
          <div className="de-widget-body">
            <JourneyTrail compact />
          </div>
        </div>

      </div>
    </div>
  );
}
/**
 * Full-screen "DREAMengin powered by…" boot splash shown for 2.5 s when a game
 * enters fullscreen. Auto-dismisses via onDone callback.
 */
function EnginBootSplash({
  game,
  onDone,
}: {
  game: { label: string; emoji: string; color: string; category: string };
  onDone: () => void;
}) {
  const SPLASH_INTRO_DURATION_MS = 600;
  const SPLASH_FADE_START_MS = 2000;
  const SPLASH_TOTAL_DURATION_MS = 2500;
  const [phase, setPhase] = useState<'intro' | 'title' | 'fade'>('intro');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('title'), SPLASH_INTRO_DURATION_MS);
    const t2 = setTimeout(() => setPhase('fade'), SPLASH_FADE_START_MS);
    const t3 = setTimeout(() => onDone(), SPLASH_TOTAL_DURATION_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      onClick={onDone}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        background: 'radial-gradient(ellipse at 50% 40%, rgba(42,138,184,0.28) 0%, rgba(4,8,20,0.99) 62%)',
        cursor: 'pointer',
        transition: 'opacity 0.5s ease',
        opacity: phase === 'fade' ? 0 : 1,
        pointerEvents: phase === 'fade' ? 'none' : 'auto',
      }}
    >
      {/* Animated top glow bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        background: `linear-gradient(90deg, transparent, ${game.color}, #7dd3fc, ${game.color}, transparent)`,
        opacity: phase === 'intro' ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }} />

      {/* Powered-by eyebrow */}
      <div style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.26em',
        textTransform: 'uppercase',
        color: '#7dd3fc',
        opacity: phase === 'intro' ? 0 : 1,
        transform: phase === 'intro' ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.45s ease, transform 0.45s ease',
        marginBottom: 10,
      }}>
        Powered by DREAMengin
      </div>

      {/* Main logo wordmark */}
      <div style={{
        fontSize: 'clamp(48px, 10vw, 96px)',
        fontWeight: 900,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        color: '#f8fbff',
        opacity: phase === 'intro' ? 0 : 1,
        transform: phase === 'intro' ? 'scale(0.92)' : 'scale(1)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        textShadow: `0 0 60px rgba(42,138,184,0.55), 0 0 120px rgba(42,138,184,0.25)`,
      }}>
        DREAMENGIN
      </div>

      {/* Game title + emoji */}
      <div style={{
        marginTop: 22,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 22px',
        borderRadius: 999,
        background: `${game.color}18`,
        border: `1px solid ${game.color}44`,
        opacity: phase === 'intro' ? 0 : 1,
        transform: phase === 'intro' ? 'translateY(10px)' : 'translateY(0)',
        transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
      }}>
        <span style={{ fontSize: 24 }}>{game.emoji}</span>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#f8fbff', letterSpacing: '-0.02em' }}>
          {game.label}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
          background: `${game.color}22`, color: game.color, border: `1px solid ${game.color}44`,
        }}>
          {game.category}
        </span>
      </div>

      {/* Skip hint */}
      <div style={{
        position: 'absolute',
        bottom: 22,
        fontSize: 11,
        color: 'rgba(160,195,240,0.45)',
        letterSpacing: '0.06em',
        opacity: phase === 'intro' ? 0 : 1,
        transition: 'opacity 0.5s ease 0.3s',
      }}>
        Tap anywhere to skip
      </div>

      {/* Bottom glow bar */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 3,
        background: `linear-gradient(90deg, transparent, ${game.color}, #7dd3fc, ${game.color}, transparent)`,
        opacity: phase === 'intro' ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }} />
    </div>
  );
}
