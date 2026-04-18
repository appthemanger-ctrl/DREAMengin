/**
 * lib/gameengin/remote/comboMachine.ts
 *
 * Pure combo recogniser for the GameEngin standard remote.
 *
 * Recognises:
 *   - Sequential combos (BASE_COMBOS, SPRINT_COMBOS) within a configurable
 *     time window between consecutive inputs.
 *   - Multi-touch combos (MULTITOUCH_COMBOS) when ≥ 2 face buttons are
 *     simultaneously pressed inside MULTITOUCH_WINDOW_MS.
 *
 * Sprint state is supplied externally (e.g. by SprintDetector). When sprint
 * is active and the current sequence matches both a base and a sprint
 * variant, the sprint variant wins.
 *
 * The machine does NOT debounce game logic — consumers should treat each
 * `consume()` result as the highest-priority combo recognised at that
 * instant. Returning a combo also resets the sequence buffer.
 */

import {
  ALL_COMBOS,
  MULTITOUCH_COMBOS,
  type Combo,
  type FaceButton,
  type MultiTouchCombo,
  maxComboLength,
} from './moves';

export const COMBO_WINDOW_MS = 350;
export const MULTITOUCH_WINDOW_MS = 60;

interface PressRecord {
  button: FaceButton;
  at: number;
}

export interface ComboMatch {
  kind: 'sequence';
  combo: Combo;
}

export interface MultiTouchMatch {
  kind: 'multitouch';
  combo: MultiTouchCombo;
}

export type RemoteMatch = ComboMatch | MultiTouchMatch;

export interface ComboMachineOptions {
  comboWindowMs?: number;
  multiTouchWindowMs?: number;
  combos?: readonly Combo[];
  multiTouchCombos?: readonly MultiTouchCombo[];
  /** External sprint flag; queried on every press. */
  isSprinting?: () => boolean;
}

export class ComboMachine {
  private buffer: PressRecord[] = [];
  private readonly comboWindowMs: number;
  private readonly multiTouchWindowMs: number;
  private readonly combos: readonly Combo[];
  private readonly multiTouchCombos: readonly MultiTouchCombo[];
  private readonly maxLen: number;
  private readonly isSprinting: () => boolean;

  constructor(opts: ComboMachineOptions = {}) {
    this.comboWindowMs = opts.comboWindowMs ?? COMBO_WINDOW_MS;
    this.multiTouchWindowMs = opts.multiTouchWindowMs ?? MULTITOUCH_WINDOW_MS;
    this.combos = opts.combos ?? ALL_COMBOS;
    this.multiTouchCombos = opts.multiTouchCombos ?? MULTITOUCH_COMBOS;
    this.maxLen = maxComboLength(this.combos);
    this.isSprinting = opts.isSprinting ?? (() => false);
  }

  /**
   * Record a press and return the highest-priority match recognised at this
   * instant, if any. Returning a match clears the buffer.
   */
  press(button: FaceButton, nowMs: number): RemoteMatch | null {
    // Drop expired presses from buffer head.
    this.buffer = this.buffer.filter((r) => nowMs - r.at <= this.comboWindowMs);
    this.buffer.push({ button, at: nowMs });

    // 1. Multi-touch wins if ≥ 2 distinct buttons inside multi-touch window.
    const recent = this.buffer.filter((r) => nowMs - r.at <= this.multiTouchWindowMs);
    if (recent.length >= 2) {
      const distinct = Array.from(new Set(recent.map((r) => r.button)));
      if (distinct.length >= 2) {
        const mt = this.matchMultiTouch(distinct);
        if (mt) {
          this.buffer = [];
          return { kind: 'multitouch', combo: mt };
        }
      }
    }

    // 2. Sequential combo. Try longest suffix down to length 2.
    const sequence = this.buffer.map((r) => r.button);
    const sprint = this.isSprinting();
    for (let len = Math.min(sequence.length, this.maxLen); len >= 2; len--) {
      const suffix = sequence.slice(sequence.length - len);
      const combo = this.matchSequence(suffix, sprint);
      if (combo) {
        this.buffer = [];
        return { kind: 'sequence', combo };
      }
    }

    // Trim buffer to maxLen for memory.
    if (this.buffer.length > this.maxLen) this.buffer = this.buffer.slice(-this.maxLen);
    return null;
  }

  /** Forget any pending sequence (e.g. on level reset). */
  reset(): void {
    this.buffer = [];
  }

  inspect(): readonly PressRecord[] {
    return [...this.buffer];
  }

  private matchSequence(suffix: FaceButton[], sprint: boolean): Combo | null {
    // Prefer sprint variants when sprint is active.
    if (sprint) {
      const sprintMatch = this.combos.find(
        (c) => c.sprint && sequenceEquals(c.sequence, suffix),
      );
      if (sprintMatch) return sprintMatch;
    }
    return this.combos.find((c) => !c.sprint && sequenceEquals(c.sequence, suffix)) ?? null;
  }

  private matchMultiTouch(buttons: FaceButton[]): MultiTouchCombo | null {
    const sorted = [...buttons].sort();
    return this.multiTouchCombos.find((c) => {
      if (c.buttons.length !== sorted.length) return false;
      const csorted = [...c.buttons].sort();
      return csorted.every((b, i) => b === sorted[i]);
    }) ?? null;
  }
}

function sequenceEquals(a: readonly FaceButton[], b: readonly FaceButton[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
