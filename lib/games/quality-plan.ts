export interface GameQualityPillar {
  id: string;
  title: string;
  detail: string;
  emphasis: 'Quality' | 'Controls' | 'Home' | 'Retention';
}

export interface GameControlProfile {
  id: string;
  label: string;
  summary: string;
  bullets: [string, string];
}

export interface GameEngineStandard {
  id: string;
  title: string;
  detail: string;
}

export interface AdvancedGameTarget {
  id: string;
  label: string;
  componentPath: string;
  tier: 'flagship' | 'advanced';
  why: string;
  requiredUpgradeThemes: readonly [string, string, string, string];
}

export const GAME_QUALITY_PILLARS: readonly GameQualityPillar[] = [
  {
    id: 'game-feel-first',
    title: 'Game Feel First',
    detail: 'Faster restarts, readable combat, honest difficulty, and smooth performance before platform sprawl.',
    emphasis: 'Quality',
  },
  {
    id: 'console-class-touch',
    title: 'Console-Class Touch',
    detail: 'Dual-stick remote polish, stronger touch targets, haptics, and thumb-first layouts that feel better than glass controls.',
    emphasis: 'Controls',
  },
  {
    id: 'home-session-flow',
    title: 'Home Session Flow',
    detail: 'Instant resume, short-session goals, couch handoff, and continuity from phone to living-room play.',
    emphasis: 'Home',
  },
  {
    id: 'competitive-depth',
    title: 'Competitive Depth',
    detail: 'Daily runs, ranked ladders, replays, creator worlds, and challenge loops that make players come back.',
    emphasis: 'Retention',
  },
] as const;

export const GAME_CONTROL_PROFILES: readonly GameControlProfile[] = [
  {
    id: 'precision',
    label: 'Precision',
    summary: 'For platformers, shooters, and score-chasing runs where accuracy matters most.',
    bullets: ['Lower travel feel', 'Fast recovery prompts'],
  },
  {
    id: 'arcade',
    label: 'Arcade',
    summary: 'For tap-heavy sessions that need louder feedback, bigger actions, and quick repeat play.',
    bullets: ['Bigger touch cues', 'Punchier haptic rhythm'],
  },
  {
    id: 'couch',
    label: 'Couch',
    summary: 'For home sessions that need handoff-ready controls, readable HUDs, and remote-style comfort.',
    bullets: ['Shared-screen clarity', 'Relaxed thumb reach'],
  },
] as const;

export const GAME_ENGINE_STANDARDS: readonly GameEngineStandard[] = [
  {
    id: 'state-of-the-art-feel',
    title: 'State-of-the-Art Feel',
    detail: 'Prioritize responsiveness, readable depth, and premium engine-grade feedback over shallow novelty.',
  },
  {
    id: 'advanced-systems',
    title: 'Advanced Systems',
    detail: 'Prefer deeper combat, AI, progression, procedural variety, bosses, simulation, or narrative reactivity over simple tap-only loops.',
  },
  {
    id: 'remote-ready-premium',
    title: 'Remote-Ready Premium',
    detail: 'Every upgrade should preserve GameRemote comfort, quick resume flow, and home-session clarity.',
  },
] as const;

export const ADVANCED_GAME_TARGETS: readonly AdvancedGameTarget[] = [
  {
    id: 'babylon-side-scroller',
    label: 'Babylon Side Scroller',
    componentPath: 'components/games/BabylonSideScroller.tsx',
    tier: 'flagship',
    why: 'Babylon-powered platformer with procedural zones and boss encounters that can absorb deeper engine polish.',
    requiredUpgradeThemes: ['combat depth', 'boss behaviors', 'procedural variety', 'render polish'],
  },
  {
    id: 'engin-battle',
    label: 'ENGINBattle',
    componentPath: 'components/games/ENGINBattle.tsx',
    tier: 'advanced',
    why: 'Strategy systems already exist, making it a strong target for better AI, economy, and battlefield depth.',
    requiredUpgradeThemes: ['system depth', 'enemy AI', 'strategy readability', 'late-game escalation'],
  },
  {
    id: 'dreamquest',
    label: 'DREAMquest',
    componentPath: 'components/games/DREAMquest.tsx',
    tier: 'advanced',
    why: 'Quest and progression structure are already in place, so richer world-state and encounter loops fit naturally.',
    requiredUpgradeThemes: ['quest depth', 'progression loops', 'world-state reactivity', 'encounter variety'],
  },
] as const;
