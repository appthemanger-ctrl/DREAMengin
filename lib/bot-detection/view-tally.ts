/**
 * lib/bot-detection/view-tally.ts — §36.2 ViewTallyTimer
 *
 * Starts a 4-second timer when a card becomes visible.
 * On completion → calls the ledger tally callback.
 * If the card leaves before 4 s → cancels silently.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ViewTallyTimer {
  /** Cancel the pending tally (card left viewport). */
  cancel(): void;
  /** True while the timer is running. */
  readonly active: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const VIEW_TALLY_DURATION_MS = 4000;

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * createViewTallyTimer(onTally, onCancel?)
 *
 * Call when a card enters the viewport.
 * onTally fires after 4 s if the card remains visible.
 * onCancel fires if cancel() is called before the 4 s elapses.
 *
 * @param onTally   Called after VIEW_TALLY_DURATION_MS if not cancelled.
 * @param onCancel  Optional: called if cancel() fires before completion.
 */
export function createViewTallyTimer(
  onTally:  () => void,
  onCancel?: () => void,
): ViewTallyTimer {
  let handle: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    handle = null;
    onTally();
  }, VIEW_TALLY_DURATION_MS);

  return {
    get active(): boolean {
      return handle !== null;
    },
    cancel(): void {
      if (handle !== null) {
        clearTimeout(handle);
        handle = null;
        onCancel?.();
      }
    },
  };
}

// ─── React-friendly hook helper ───────────────────────────────────────────────

/**
 * ViewTallyTracker
 *
 * Class-based wrapper suitable for use inside framework lifecycle hooks.
 * Manages at most one active timer per instance.
 */
export class ViewTallyTracker {
  private _timer: ViewTallyTimer | null = null;
  private readonly _onTally: () => void;

  constructor(onTally: () => void) {
    this._onTally = onTally;
  }

  /** Call when the associated card enters the viewport. */
  onVisible(): void {
    if (this._timer?.active) return; // already counting
    this._timer = createViewTallyTimer(this._onTally);
  }

  /** Call when the associated card leaves the viewport. */
  onHidden(): void {
    this._timer?.cancel();
    this._timer = null;
  }

  /** Cleanup (e.g. on component unmount). */
  destroy(): void {
    this.onHidden();
  }

  get isActive(): boolean {
    return this._timer?.active ?? false;
  }
}
