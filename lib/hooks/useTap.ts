/**
 * useTap — canonical single-tap hook.
 *
 * SYSTEM-WIDE TAP DISCIPLINE
 * --------------------------
 * Every interactive surface in DREAMengin responds to a single tap. The user
 * has explicitly banned double-tap as a UI affordance ("we feel like the
 * system is not working") *everywhere except the home / gold particle*.
 *
 *   - `useTap`              → single-tap only. Use this for all new code.
 *   - `useHomeParticleTap`  → the SOLE site allowed to expose double-tap.
 *                             Reserved for the gold particle / home button.
 *
 * If you find yourself reaching for `onDoubleClick` or implementing a tap
 * counter outside the home particle, stop — it is a contract violation.
 */
import { useCallback, useEffect, useRef } from 'react';

export interface UseTapOptions {
  /** Disable the handler without unmounting it. */
  disabled?: boolean;
}

export interface UseTapResult {
  /** Fire on every press release. Single tap, every time. */
  onTap: (event?: unknown) => void;
}

/**
 * Single-tap. No timers, no double-tap window, no surprise.
 */
export function useTap(
  handler: (event?: unknown) => void,
  options: UseTapOptions = {},
): UseTapResult {
  const { disabled = false } = options;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const onTap = useCallback(
    (event?: unknown) => {
      if (disabled) return;
      handlerRef.current(event);
    },
    [disabled],
  );

  return { onTap };
}

export interface UseHomeParticleTapOptions {
  /**
   * Window (ms) within which two taps register as a double-tap.
   * The default matches the existing gold-particle constant so behaviour
   * is consistent with the bar's `DOUBLE_TAP_WINDOW_MS`.
   */
  doubleTapWindowMs?: number;
  disabled?: boolean;
}

export interface UseHomeParticleTapResult {
  /** Fires once on the trailing edge of a single tap (after the window closes). */
  onTap: () => void;
}

/**
 * Home-particle tap router — the only place in the system where double-tap
 * is a sanctioned UI affordance.
 *
 *   single tap → `onSingleTap`
 *   double tap → `onDoubleTap`
 *
 * Single-tap firing is delayed by the double-tap window so a follow-up tap
 * can override and promote the gesture to a double-tap (matching the
 * existing dreamdmbar gold-particle behaviour).
 */
export function useHomeParticleTap(
  onSingleTap: () => void,
  onDoubleTap: () => void,
  options: UseHomeParticleTapOptions = {},
): UseHomeParticleTapResult {
  const { doubleTapWindowMs = 260, disabled = false } = options;
  const stateRef = useRef<{
    timer: ReturnType<typeof setTimeout> | null;
    pending: boolean;
  }>({ timer: null, pending: false });

  const singleRef = useRef(onSingleTap);
  const doubleRef = useRef(onDoubleTap);
  singleRef.current = onSingleTap;
  doubleRef.current = onDoubleTap;

  useEffect(
    () => () => {
      if (stateRef.current.timer) clearTimeout(stateRef.current.timer);
    },
    [],
  );

  const onTap = useCallback(() => {
    if (disabled) return;
    const state = stateRef.current;
    if (state.pending && state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
      state.pending = false;
      doubleRef.current();
      return;
    }
    state.pending = true;
    state.timer = setTimeout(() => {
      state.pending = false;
      state.timer = null;
      singleRef.current();
    }, doubleTapWindowMs);
  }, [disabled, doubleTapWindowMs]);

  return { onTap };
}
