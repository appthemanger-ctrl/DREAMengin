'use client';

/**
 * GameController — DREAMengin floating-stick controller overlay.
 *
 * LEFT STICK  : appears where the left thumb first touches; drag to move;
 *               lift thumb to jump (preserving last movement direction).
 * RIGHT STICK : appears where the right thumb first touches; drag to aim
 *               (emits relative look-delta); quick tap fires a shot; tap-and-
 *               hold fires continuous auto; 200ms reset timeout on lift.
 * BUTTONS     : X · Circle · Triangle · Square · L1 · L2 · R1 · R2 at fixed
 *               positions, with tap / hold / double-tap / long-press /
 *               tap-and-hold / release interaction events.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';

import {
  emitMobileButton,
  emitMobileJump,
  emitMobileLookDelta,
  emitMobileMove,
  emitMobileShoot,
  fireLegacyGameInput,
  getLegacyMoveAction,
  type MobileControlVector,
} from '@/lib/games/mobileControls';
import {
  computeLeftStickVector,
  LEFT_STICK_RADIUS_PX,
  type StickVector,
} from '@/lib/games/gameControllerLeft';
import {
  AUTO_FIRE_DELAY_MS,
  AUTO_FIRE_INTERVAL_MS,
  computeAimDelta,
  evaluateRightStickTap,
  RIGHT_RESET_TIMEOUT_MS,
} from '@/lib/games/gameControllerRight';
import {
  ButtonInteractionManager,
  CONTROLLER_BUTTON_DEFS,
  type ControllerButton,
} from '@/lib/games/gameControllerButtons';
import styles from '@/components/games/GameController.module.css';

interface GameControllerProps {
  gameLabel: string;
  onExit: () => void;
}

interface StickState {
  active: boolean;
  originX: number;
  originY: number;
  vector: StickVector;
}

const INACTIVE_STICK: StickState = {
  active: false,
  originX: 0,
  originY: 0,
  vector: { x: 0, y: 0 },
};

const ZERO_VEC: MobileControlVector = { x: 0, y: 0 };

// ─── Left-stick legacy sync ─────────────────────────────────────────────────

function useLegacyMoveSync() {
  const activeMoveRef = useRef<ReturnType<typeof getLegacyMoveAction>>(null);

  const sync = useCallback((vector: MobileControlVector) => {
    const next = getLegacyMoveAction(vector);
    if (activeMoveRef.current && activeMoveRef.current !== next) {
      fireLegacyGameInput(activeMoveRef.current, false);
    }
    if (next && next !== activeMoveRef.current) {
      fireLegacyGameInput(next, true);
    }
    if (!next && activeMoveRef.current) {
      fireLegacyGameInput('move-stop', true);
      fireLegacyGameInput('move-stop', false);
    }
    activeMoveRef.current = next;
  }, []);

  const stop = useCallback(() => {
    if (activeMoveRef.current) fireLegacyGameInput(activeMoveRef.current, false);
    fireLegacyGameInput('move-stop', true);
    fireLegacyGameInput('move-stop', false);
    activeMoveRef.current = null;
  }, []);

  return { sync, stop };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function GameController({ gameLabel, onExit }: GameControllerProps) {
  // ── Stick state (visual only; logic lives in refs) ──────────────────────
  const [leftStick,  setLeftStick]  = useState<StickState>(INACTIVE_STICK);
  const [rightStick, setRightStick] = useState<StickState>(INACTIVE_STICK);
  const [shootFlash, setShootFlash] = useState(false);
  const [pressedBtns, setPressedBtns] = useState<Partial<Record<ControllerButton, boolean>>>({});
  const [pauseActive, setPauseActive] = useState(false);
  const [exitActive,  setExitActive]  = useState(false);

  // ── Refs — touch tracking (avoids stale closure issues) ────────────────
  const leftTouchIdRef    = useRef<number | null>(null);
  const leftOriginRef     = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const leftVectorRef     = useRef<StickVector>({ x: 0, y: 0 });

  const rightTouchIdRef   = useRef<number | null>(null);
  const rightOriginRef    = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rightStartMsRef   = useRef(0);
  const rightPrevPosRef   = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rightMovedRef     = useRef(false);
  const rightResetTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFireTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFireIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Button interaction manager ─────────────────────────────────────────
  const btnMgrRef = useRef<ButtonInteractionManager | null>(null);
  if (!btnMgrRef.current) {
    btnMgrRef.current = new ButtonInteractionManager();
  }

  // ── Button DOM refs for hit-testing ───────────────────────────────────
  const btnRefs = useRef<Partial<Record<ControllerButton, HTMLDivElement | null>>>({});

  // ── Legacy move sync ──────────────────────────────────────────────────
  const { sync: syncLegacyMove, stop: stopLegacyMove } = useLegacyMoveSync();

  // ── Wire button manager to visual state ───────────────────────────────
  useEffect(() => {
    const mgr = btnMgrRef.current!;
    const unsub = mgr.subscribe(({ button, interaction }) => {
      if (interaction === 'hold-start' || interaction === 'tap-and-hold') {
        setPressedBtns((prev) => ({ ...prev, [button]: true }));
      } else if (interaction === 'release') {
        setPressedBtns((prev) => ({ ...prev, [button]: false }));
      }
    });
    return unsub;
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      btnMgrRef.current?.destroy();
      if (rightResetTimerRef.current)    clearTimeout(rightResetTimerRef.current);
      if (autoFireTimerRef.current)      clearTimeout(autoFireTimerRef.current);
      if (autoFireIntervalRef.current)   clearInterval(autoFireIntervalRef.current);
      stopLegacyMove();
      fireLegacyGameInput('pause', false);
    };
  }, [stopLegacyMove]);

  // ────────────────────────────────────────────────────────────────────────
  // LEFT STICK
  // ────────────────────────────────────────────────────────────────────────

  const handleLeftStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (leftTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    leftTouchIdRef.current = touch.identifier;
    leftOriginRef.current  = { x: touch.clientX, y: touch.clientY };
    leftVectorRef.current  = { x: 0, y: 0 };

    setLeftStick({
      active: true,
      originX: touch.clientX,
      originY: touch.clientY,
      vector: { x: 0, y: 0 },
    });
  }, []);

  const handleLeftMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === leftTouchIdRef.current,
    );
    if (!touch) return;

    const origin = leftOriginRef.current;
    const vec = computeLeftStickVector(
      origin.x, origin.y,
      touch.clientX, touch.clientY,
      LEFT_STICK_RADIUS_PX,
    );
    leftVectorRef.current = vec;

    const mv: MobileControlVector = { x: vec.x, y: vec.y };
    emitMobileMove(mv);
    syncLegacyMove(mv);

    setLeftStick((prev) => ({ ...prev, vector: vec }));
  }, [syncLegacyMove]);

  const handleLeftEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const released = Array.from(e.changedTouches).some(
      (t) => t.identifier === leftTouchIdRef.current,
    );
    if (!released) return;

    // Jump — fire with the last movement vector preserved
    const lastVec = leftVectorRef.current;
    emitMobileJump(lastVec);
    emitMobileButton('jump');
    fireLegacyGameInput('jump', true);
    fireLegacyGameInput('jump', false);

    // Stop movement
    emitMobileMove(ZERO_VEC);
    stopLegacyMove();

    leftTouchIdRef.current = null;
    leftVectorRef.current  = { x: 0, y: 0 };
    setLeftStick(INACTIVE_STICK);
  }, [stopLegacyMove]);

  // ────────────────────────────────────────────────────────────────────────
  // RIGHT STICK  (tap=shoot, drag=aim, tap-and-hold=auto-fire)
  // ────────────────────────────────────────────────────────────────────────

  const fireShot = useCallback(() => {
    emitMobileShoot();
    fireLegacyGameInput('shoot', true);
    fireLegacyGameInput('shoot', false);
    setShootFlash(true);
    setTimeout(() => setShootFlash(false), 260);
  }, []);

  const stopAutoFire = useCallback(() => {
    if (autoFireTimerRef.current) {
      clearTimeout(autoFireTimerRef.current);
      autoFireTimerRef.current = null;
    }
    if (autoFireIntervalRef.current) {
      clearInterval(autoFireIntervalRef.current);
      autoFireIntervalRef.current = null;
    }
  }, []);

  const startAutoFire = useCallback(() => {
    stopAutoFire();
    autoFireTimerRef.current = setTimeout(() => {
      // Fire the first auto-shot
      fireShot();
      autoFireIntervalRef.current = setInterval(fireShot, AUTO_FIRE_INTERVAL_MS);
    }, AUTO_FIRE_DELAY_MS);
  }, [fireShot, stopAutoFire]);

  const handleRightStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (rightTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    // Cancel pending reset
    if (rightResetTimerRef.current) {
      clearTimeout(rightResetTimerRef.current);
      rightResetTimerRef.current = null;
    }

    rightTouchIdRef.current = touch.identifier;
    rightOriginRef.current  = { x: touch.clientX, y: touch.clientY };
    rightPrevPosRef.current = { x: touch.clientX, y: touch.clientY };
    rightStartMsRef.current = Date.now();
    rightMovedRef.current   = false;

    // Begin auto-fire detection (will cancel if thumb lifts quickly)
    startAutoFire();

    setRightStick({
      active: true,
      originX: touch.clientX,
      originY: touch.clientY,
      vector: { x: 0, y: 0 },
    });
  }, [startAutoFire]);

  const handleRightMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === rightTouchIdRef.current,
    );
    if (!touch) return;

    const prev = rightPrevPosRef.current;
    const delta = computeAimDelta(prev.x, prev.y, touch.clientX, touch.clientY);
    rightPrevPosRef.current = { x: touch.clientX, y: touch.clientY };

    const origin = rightOriginRef.current;
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      rightMovedRef.current = true;
      stopAutoFire(); // dragging = aim, not auto-fire
    }

    // Emit look delta for camera turn
    emitMobileLookDelta(delta.dx, delta.dy);

    // Visual nub position (clamped to radius)
    const radius = LEFT_STICK_RADIUS_PX;
    const scale  = Math.min(dist, radius) / (radius || 1);
    const vec: StickVector = dist
      ? { x: (dx / dist) * scale, y: (dy / dist) * scale }
      : { x: 0, y: 0 };

    setRightStick((prev) => ({ ...prev, vector: vec }));
  }, [stopAutoFire]);

  const handleRightEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const released = Array.from(e.changedTouches).some(
      (t) => t.identifier === rightTouchIdRef.current,
    );
    if (!released) return;

    stopAutoFire();

    const origin = rightOriginRef.current;
    const prev   = rightPrevPosRef.current;
    const result = evaluateRightStickTap(
      origin.x, origin.y,
      prev.x, prev.y,
      rightStartMsRef.current,
      Date.now(),
    );

    rightTouchIdRef.current = null;
    setRightStick(INACTIVE_STICK);

    if (result.isTap) {
      // 200ms reset timeout: fire only if not cancelled
      rightResetTimerRef.current = setTimeout(() => {
        rightResetTimerRef.current = null;
        fireShot();
      }, RIGHT_RESET_TIMEOUT_MS);
    } else {
      // Drag ended — cancel any pending reset
      if (rightResetTimerRef.current) {
        clearTimeout(rightResetTimerRef.current);
        rightResetTimerRef.current = null;
      }
    }

    // Reset aim delta to zero
    emitMobileLookDelta(0, 0);
  }, [fireShot, stopAutoFire]);

  // ────────────────────────────────────────────────────────────────────────
  // BUTTON HIT-TESTING  (right zone routes to buttons or right stick)
  // ────────────────────────────────────────────────────────────────────────

  const findButtonAt = useCallback((cx: number, cy: number): ControllerButton | null => {
    for (const def of CONTROLLER_BUTTON_DEFS) {
      const el = btnRefs.current[def.id];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
        return def.id;
      }
    }
    return null;
  }, []);

  // Per-touch routing map: touchId → 'button' | 'stick'
  const rightTouchRouteRef = useRef<Map<number, 'button' | 'stick'>>(new Map());
  const rightTouchButtonRef = useRef<Map<number, ControllerButton | null>>(new Map());

  const handleRightZoneStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    Array.from(e.changedTouches).forEach((touch) => {
      const btn = findButtonAt(touch.clientX, touch.clientY);
      if (btn) {
        rightTouchRouteRef.current.set(touch.identifier, 'button');
        rightTouchButtonRef.current.set(touch.identifier, btn);
        btnMgrRef.current?.pressStart(btn, touch.identifier);
      } else {
        rightTouchRouteRef.current.set(touch.identifier, 'stick');
        // Synthesise a right-stick touchstart event for this touch
        const synth = { ...e, changedTouches: [touch] } as unknown as React.TouchEvent;
        handleRightStart(synth);
      }
    });
  }, [findButtonAt, handleRightStart]);

  const handleRightZoneMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    Array.from(e.changedTouches).forEach((touch) => {
      const route = rightTouchRouteRef.current.get(touch.identifier);
      if (route === 'stick') {
        const synth = { ...e, changedTouches: [touch] } as unknown as React.TouchEvent;
        handleRightMove(synth);
      }
      // Button drags are intentionally ignored (buttons are independent)
    });
  }, [handleRightMove]);

  const handleRightZoneEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    Array.from(e.changedTouches).forEach((touch) => {
      const route = rightTouchRouteRef.current.get(touch.identifier);
      rightTouchRouteRef.current.delete(touch.identifier);
      if (route === 'button') {
        const btn = rightTouchButtonRef.current.get(touch.identifier) ?? null;
        rightTouchButtonRef.current.delete(touch.identifier);
        if (btn) btnMgrRef.current?.pressEnd(btn, touch.identifier);
      } else if (route === 'stick') {
        const synth = { ...e, changedTouches: [touch] } as unknown as React.TouchEvent;
        handleRightEnd(synth);
      }
    });
  }, [handleRightEnd]);

  // Shoulder buttons also live in their own groups — route via hit-test
  // (they are in the left/right zones but above the stick area)
  const handleShoulderStart = useCallback((e: React.TouchEvent, btn: ControllerButton) => {
    e.preventDefault();
    e.stopPropagation();
    btnMgrRef.current?.pressStart(btn, e.changedTouches[0]?.identifier ?? -1);
  }, []);

  const handleShoulderEnd = useCallback((e: React.TouchEvent, btn: ControllerButton) => {
    e.preventDefault();
    e.stopPropagation();
    btnMgrRef.current?.pressEnd(btn, e.changedTouches[0]?.identifier ?? -1);
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // PAUSE  (centre pill)
  // ────────────────────────────────────────────────────────────────────────

  const handlePauseStart = useCallback(() => {
    setPauseActive(true);
    emitMobileButton('pause');
    fireLegacyGameInput('pause', true);
  }, []);

  const handlePauseEnd = useCallback(() => {
    setPauseActive(false);
    fireLegacyGameInput('pause', false);
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // Shoulder pairs (L1/L2 on left, R1/R2 on right)
  // ────────────────────────────────────────────────────────────────────────

  const shoulderPairs = useMemo(() => ({
    left:  ['l1', 'l2'] as ControllerButton[],
    right: ['r1', 'r2'] as ControllerButton[],
  }), []);

  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.overlay}>
      <div className={styles.hudBadge}>{gameLabel}</div>

      {/* ── Left zone (movement) ──────────────────────────── */}
      <div
        className={styles.leftZone}
        onTouchStart={handleLeftStart}
        onTouchMove={handleLeftMove}
        onTouchEnd={handleLeftEnd}
        onTouchCancel={handleLeftEnd}
      >
        {leftStick.active ? (
          <div
            className={styles.floatingStick}
            style={{ left: leftStick.originX, top: leftStick.originY }}
          >
            <div className={styles.stickShell}>
              <div className={styles.stickRing} />
              <div
                className={styles.stickNub}
                style={{
                  transform: `translate(
                    calc(-50% + ${leftStick.vector.x * 34}%),
                    calc(-50% + ${leftStick.vector.y * 34}%)
                  )`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className={styles.zoneHint}>MOVE<br />↑↓←→</div>
        )}
      </div>

      {/* ── Right zone (aim / shoot + buttons) ───────────── */}
      <div
        className={styles.rightZone}
        onTouchStart={handleRightZoneStart}
        onTouchMove={handleRightZoneMove}
        onTouchEnd={handleRightZoneEnd}
        onTouchCancel={handleRightZoneEnd}
      >
        {rightStick.active ? (
          <div
            className={styles.floatingStick}
            style={{ left: rightStick.originX - window.innerWidth / 2, top: rightStick.originY }}
          >
            <div className={styles.stickShell}>
              <div className={styles.stickRing} />
              <div
                className={styles.stickNub}
                style={{
                  transform: `translate(
                    calc(-50% + ${rightStick.vector.x * 34}%),
                    calc(-50% + ${rightStick.vector.y * 34}%)
                  )`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className={styles.zoneHint}>AIM / SHOOT<br />tap · drag</div>
        )}

        {shootFlash && <div className={styles.shootFlash} />}

        {/* Face button cluster */}
        <div className={styles.faceCluster}>
          {([
            ['triangle', styles.faceTriangle],
            ['square',   styles.faceSquare  ],
            ['circle',   styles.faceCircle  ],
            ['x',        styles.faceCross   ],
          ] as [ControllerButton, string][]).map(([id, posClass]) => {
            const def = CONTROLLER_BUTTON_DEFS.find((d) => d.id === id)!;
            return (
              <div
                key={id}
                ref={(el) => { btnRefs.current[id] = el; }}
                className={clsx(styles.ctrlBtn, posClass, pressedBtns[id] && styles.ctrlBtnActive)}
              >
                <span className={styles.btnSymbol}>{def.symbol}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Shoulder buttons ─────────────────────────────── */}
      <div className={clsx(styles.shoulderGroup, styles.shoulderGroupLeft)}>
        {shoulderPairs.left.map((btn) => {
          const def = CONTROLLER_BUTTON_DEFS.find((d) => d.id === btn)!;
          return (
            <div
              key={btn}
              ref={(el) => { btnRefs.current[btn] = el; }}
              className={clsx(styles.ctrlBtn, pressedBtns[btn] && styles.ctrlBtnActive)}
              onTouchStart={(e) => handleShoulderStart(e, btn)}
              onTouchEnd={(e) => handleShoulderEnd(e, btn)}
              onTouchCancel={(e) => handleShoulderEnd(e, btn)}
            >
              <span className={styles.btnSymbol}>{def.symbol}</span>
            </div>
          );
        })}
      </div>

      <div className={clsx(styles.shoulderGroup, styles.shoulderGroupRight)}>
        {shoulderPairs.right.map((btn) => {
          const def = CONTROLLER_BUTTON_DEFS.find((d) => d.id === btn)!;
          return (
            <div
              key={btn}
              ref={(el) => { btnRefs.current[btn] = el; }}
              className={clsx(styles.ctrlBtn, pressedBtns[btn] && styles.ctrlBtnActive)}
              onTouchStart={(e) => handleShoulderStart(e, btn)}
              onTouchEnd={(e) => handleShoulderEnd(e, btn)}
              onTouchCancel={(e) => handleShoulderEnd(e, btn)}
            >
              <span className={styles.btnSymbol}>{def.symbol}</span>
            </div>
          );
        })}
      </div>

      {/* ── Centre pills ─────────────────────────────────── */}
      <div className={styles.centerPills}>
        <button
          type="button"
          className={clsx(styles.pill, styles.pillPause, pauseActive && styles.pillActive)}
          onTouchStart={handlePauseStart}
          onTouchEnd={handlePauseEnd}
          onTouchCancel={handlePauseEnd}
          onMouseDown={handlePauseStart}
          onMouseUp={handlePauseEnd}
          onMouseLeave={handlePauseEnd}
        >
          Pause
        </button>
        <button
          type="button"
          className={clsx(styles.pill, styles.pillExit, exitActive && styles.pillActive)}
          onTouchStart={() => setExitActive(true)}
          onTouchEnd={() => setExitActive(false)}
          onTouchCancel={() => setExitActive(false)}
          onMouseDown={() => setExitActive(true)}
          onMouseUp={() => setExitActive(false)}
          onMouseLeave={() => setExitActive(false)}
          onClick={onExit}
        >
          Exit
        </button>
      </div>
    </div>
  );
}
