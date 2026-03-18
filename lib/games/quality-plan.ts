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
