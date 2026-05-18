/**
 * lib/gameengin/remote/moves.ts
 *
 * GameEngin Standard Remote — single source of truth for every input the
 * remote produces, every base move, sprint move, combo, sprint-combo
 * variant, and multi-touch combination defined by the directive.
 *
 * Pure data. No DOM. No side effects.
 */

/** The four face buttons on the GameEngin standard remote. */
export type FaceButton = 'X' | 'O' | 'SQUARE' | 'TRIANGLE';

export const FACE_BUTTONS: readonly FaceButton[] = ['X', 'O', 'SQUARE', 'TRIANGLE'] as const;

export interface BaseMove {
  button: FaceButton;
  name: string;
  description: string;
}

/** §"BASE MOVES (Single Button)" of the directive. */
export const BASE_MOVES: readonly BaseMove[] = Object.freeze([
  { button: 'X',        name: 'Jump',        description: 'Standard jump.' },
  { button: 'O',        name: 'Spin',        description: 'Spins like Sonic. Damages enemies. Extends jump length and slows descent. Grants an extra jump after double jump when used in air.' },
  { button: 'SQUARE',   name: 'Shoot Laser', description: 'Fires laser with reticle.' },
  { button: 'TRIANGLE', name: 'Duck / Slide', description: 'Crouches. While moving: slide.' },
]);

export interface SprintMove {
  button: FaceButton;
  hold?: boolean;
  name: string;
  description: string;
}

/** §"SPECIAL SPRINT MOVES (Single Button while Sprinting)". */
export const SPRINT_MOVES: readonly SprintMove[] = Object.freeze([
  {
    button: 'SQUARE',
    hold: true,
    name: 'Targeting Mode',
    description:
      'Freezes movement and time. Aim reticle. Release within 2 seconds to shoot and kill one enemy on screen. ' +
      'After exiting, may jump once if airborne.',
  },
  {
    button: 'TRIANGLE',
    name: 'Slide Attack',
    description: 'Slide that kills weak enemies on contact (unless landing directly on them).',
  },
]);

/** A combo is an ordered sequence of face-button presses, optionally requiring sprint. */
export interface Combo {
  name: string;
  sequence: readonly FaceButton[];
  sprint: boolean;
  description: string;
}

/** §"COMBO SYSTEM (Up to 3 Buttons Sequential)". */
export const BASE_COMBOS: readonly Combo[] = Object.freeze([
  { name: 'Drop Kick',     sprint: false, sequence: ['X', 'TRIANGLE'],          description: 'Drop kick attack.' },
  { name: 'Upper Cut',     sprint: false, sequence: ['TRIANGLE', 'X'],          description: 'Rising uppercut attack.' },
  { name: 'Spinning Kick', sprint: false, sequence: ['O', 'X'],                 description: 'Spinning kick attack.' },
  { name: 'Sonic Spin',    sprint: false, sequence: ['TRIANGLE', 'O'],          description: 'Rapid spin like Sonic, damages enemies.' },
  { name: '10 Lasers',     sprint: false, sequence: ['X', 'O', 'SQUARE'],       description: 'Fires 10 lasers in all directions.' },
  // Spin Jump shares the input sequence (O → X) with Spinning Kick — directive lists both;
  // we keep both entries and let the runtime prefer the longer / more specific match. Since
  // they share a sequence, the matcher returns the first declared name; consumers can branch
  // on context (airborne vs. grounded) as the directive implies.
  { name: 'Spin Jump',     sprint: false, sequence: ['O', 'X'],                 description: 'Jump with extended height and slow descent; allows an extra jump after double jump.' },
  { name: 'Laser Spin',    sprint: false, sequence: ['O', 'SQUARE'],            description: 'Spins while firing lasers outward.' },
  { name: 'Slide Spin',    sprint: false, sequence: ['TRIANGLE', 'O'],          description: 'Spinning slide attack.' },
  { name: 'Jump Laser',    sprint: false, sequence: ['X', 'SQUARE'],            description: 'Fires laser downward or forward while jumping.' },
]);

/** §"SPRINT COMBO VARIANTS". */
export const SPRINT_COMBOS: readonly Combo[] = Object.freeze([
  { name: 'Sprint Drop Kick',     sprint: true, sequence: ['X', 'TRIANGLE'],          description: 'Longer range, more damage.' },
  { name: 'Sprint Upper Cut',     sprint: true, sequence: ['TRIANGLE', 'X'],          description: 'Higher launch, can follow with air combo.' },
  { name: 'Sprint Spinning Kick', sprint: true, sequence: ['O', 'X'],                 description: 'Multi-hit spinning kick.' },
  { name: 'Sprint Sonic Spin',    sprint: true, sequence: ['TRIANGLE', 'O'],          description: 'Faster, longer duration spin.' },
  { name: 'Sprint 10 Lasers',     sprint: true, sequence: ['X', 'O', 'SQUARE'],       description: 'Wider spread, more damage.' },
]);

/** §"MULTI-TOUCH / SIMULTANEOUS INPUTS" — a set of buttons pressed together. */
export interface MultiTouchCombo {
  name: string;
  buttons: readonly FaceButton[];
  description: string;
}

export const MULTITOUCH_COMBOS: readonly MultiTouchCombo[] = Object.freeze([
  { name: 'Jumping Spin',          buttons: ['X', 'O'],          description: 'Spin starts immediately on jump.' },
  { name: 'Slide Shoot',           buttons: ['TRIANGLE', 'SQUARE'], description: 'Slide and shoot simultaneously.' },
  { name: 'Jump Shoot',            buttons: ['X', 'SQUARE'],     description: 'Jump and shoot.' },
]);

export const ALL_COMBOS: readonly Combo[] = Object.freeze([...BASE_COMBOS, ...SPRINT_COMBOS]);

/** Returns the maximum combo sequence length declared. */
export function maxComboLength(combos: readonly Combo[] = ALL_COMBOS): number {
  return combos.reduce((m, c) => Math.max(m, c.sequence.length), 0);
}
