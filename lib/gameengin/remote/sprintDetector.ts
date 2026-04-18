/**
 * lib/gameengin/remote/sprintDetector.ts
 *
 * Pure double-tap-and-hold sprint detector for the left joystick.
 *
 * Directive: "Left Joystick: Disappear on touch. Double-tap + hold = sprint
 * (faster, higher jumps). Sprint only when moved. Release exits sprint.
 * No indicator."
 *
 * Usage:
 *   const det = new SprintDetector();
 *   det.onTouchStart(t0);
 *   det.onTouchEnd(t1);
 *   det.onTouchStart(t2);          // 2nd tap within DOUBLE_TAP_WINDOW_MS
 *   det.onMove(t3, magnitude);     // sprint becomes active when held + moving
 *   det.onTouchEnd(t4);            // sprint exits
 *   det.isSprinting()              // boolean
 */

export const DOUBLE_TAP_WINDOW_MS = 280;
/** Minimum joystick magnitude (0..1) at which sprint is considered "moving". */
export const SPRINT_MOVE_THRESHOLD = 0.18;

interface InternalState {
  lastReleaseAt: number | null;
  pressActive: boolean;
  pressedAt: number | null;
  /** True when the current press began as the second tap of a double-tap. */
  armedForSprint: boolean;
  /** True only while the joystick is also being moved. */
  moving: boolean;
}

export class SprintDetector {
  private state: InternalState = {
    lastReleaseAt: null,
    pressActive: false,
    pressedAt: null,
    armedForSprint: false,
    moving: false,
  };

  constructor(private readonly doubleTapWindowMs: number = DOUBLE_TAP_WINDOW_MS) {}

  onTouchStart(nowMs: number): void {
    const sinceRelease = this.state.lastReleaseAt === null
      ? Number.POSITIVE_INFINITY
      : nowMs - this.state.lastReleaseAt;
    this.state.pressActive = true;
    this.state.pressedAt = nowMs;
    this.state.armedForSprint = sinceRelease <= this.doubleTapWindowMs;
    this.state.moving = false;
  }

  onMove(_nowMs: number, magnitude: number): void {
    if (!this.state.pressActive) return;
    this.state.moving = magnitude >= SPRINT_MOVE_THRESHOLD;
  }

  onTouchEnd(nowMs: number): void {
    this.state.pressActive = false;
    this.state.pressedAt = null;
    this.state.armedForSprint = false;
    this.state.moving = false;
    this.state.lastReleaseAt = nowMs;
  }

  /** Sprint is active iff the second tap is held AND the joystick is being moved. */
  isSprinting(): boolean {
    return this.state.pressActive && this.state.armedForSprint && this.state.moving;
  }

  /** Test/inspection-only snapshot. */
  inspect(): Readonly<InternalState> {
    return { ...this.state };
  }
}
