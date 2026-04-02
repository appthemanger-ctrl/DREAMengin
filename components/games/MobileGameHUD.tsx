'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from '@/components/games/MobileGameHUD.module.css';
import {
  emitMobileButton,
  emitMobileLook,
  emitMobileMove,
  fireLegacyGameInput,
  getLegacyActionForMobileButton,
  getLegacyMoveAction,
  MOBILE_HUD_BUTTON_RING,
  normalizeStickVector,
  type MobileControlVector,
  type MobileHudButton,
  type MobileHudMode,
} from '@/lib/games/mobileControls';

const SCALE_MIN = 0.55;
const SCALE_MAX = 1.45;
const SCALE_STEP = 0.1;

// Fraction of dock radius within which a touch claims the right joystick
const RIGHT_JOY_ZONE = 0.40;

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadPersisted(key: string, fallback: number, min?: number, max?: number): number {
  try {
    const v = parseFloat(localStorage.getItem(key) ?? '');
    if (!isNaN(v) && (min === undefined || v >= min) && (max === undefined || v <= max)) return v;
  } catch { /* ignore */ }
  return fallback;
}

function savePersisted(key: string, value: number) {
  try { localStorage.setItem(key, String(value)); } catch { /* ignore */ }
}

interface MobileGameHUDProps {
  gameLabel: string;
  mode: MobileHudMode;
  onExit: () => void;
}

const ZERO_VECTOR: MobileControlVector = { x: 0, y: 0 };
type TouchPoint = { clientX: number; clientY: number };

function getStickTransform(vector: MobileControlVector) {
  return `translate(calc(-50% + ${vector.x * 34}%), calc(-50% + ${vector.y * 34}%))`;
}

function keepPreviousVectorIfUnchanged(
  previous: MobileControlVector,
  next: MobileControlVector,
) {
  return previous.x === next.x && previous.y === next.y ? previous : next;
}

function formatVectorLabel(vector: MobileControlVector, idleLabel: string) {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (magnitude < 0.08) return idleLabel;
  const x = vector.x > 0.18 ? 'R' : vector.x < -0.18 ? 'L' : '•';
  const y = vector.y > 0.18 ? 'D' : vector.y < -0.18 ? 'U' : '•';
  return `${x}${y}`;
}

function isInJoystickZone(touch: TouchPoint, dock: HTMLDivElement | null): boolean {
  if (!dock) return false;
  const rect = dock.getBoundingClientRect();
  const dist = Math.hypot(
    touch.clientX - (rect.left + rect.width / 2),
    touch.clientY - (rect.top + rect.height / 2),
  );
  return dist < (rect.width / 2) * RIGHT_JOY_ZONE;
}

const INTERACTIVE_BUTTONS = new Set(['jump', 'dash', 'action']);

export default function MobileGameHUD({ gameLabel, mode: _mode, onExit }: MobileGameHUDProps) {
  const leftDockRef = useRef<HTMLDivElement>(null);
  const rightDockRef = useRef<HTMLDivElement>(null);
  const leftCapRef = useRef<HTMLDivElement>(null);
  const rightCapRef = useRef<HTMLDivElement>(null);
  const ringButtonRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const leftTouchIdRef = useRef<number | null>(null);
  const rightJoyTouchIdRef = useRef<number | null>(null);
  const rightBtnTouchesRef = useRef<Map<number, string | null>>(new Map());
  const activeBtnCountsRef = useRef<Record<string, number>>({});
  const activeMoveActionRef = useRef<ReturnType<typeof getLegacyMoveAction>>(null);
  const touchFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartRef = useRef<{ y: number; baseOffsetY: number } | null>(null);
  /** Tracks start position of the right joystick touch for tap detection */
  const rightJoyTapRef = useRef<{ startX: number; startY: number; startAt: number } | null>(null);

  const [leftVector, setLeftVector] = useState(ZERO_VECTOR);
  const [rightVector, setRightVector] = useState(ZERO_VECTOR);
  const [pressedButtons, setPressedButtons] = useState<Record<string, boolean>>({});
  const [pausePressed, setPausePressed] = useState(false);
  const [exitPressed, setExitPressed] = useState(false);
  const [remoteScale, setRemoteScale] = useState(() => loadPersisted('de:hud:scale', 1.0, SCALE_MIN, SCALE_MAX));
  const [offsetY, setOffsetY] = useState(() => loadPersisted('de:hud:offsetY', -36, -80, 200));
  const [isTouching, setIsTouching] = useState(false);

  const interactiveButtons = MOBILE_HUD_BUTTON_RING.filter((b) => b.interactive);

  // ── Emit CSS var so game stage clears the remote ──────────────────────────
  useEffect(() => {
    const dockH = 170;
    const readoutH = 40;
    const baseBottom = 18 + (dockH + readoutH) * remoteScale + offsetY;
    const clamped = Math.max(0, Math.min(480, Math.round(baseBottom)));
    document.documentElement.style.setProperty('--de-hud-bottom', `${clamped}px`);
    return () => { document.documentElement.style.removeProperty('--de-hud-bottom'); };
  }, [remoteScale, offsetY]);

  // ── Touch activity → opacity ──────────────────────────────────────────────
  const markTouchStart = useCallback(() => {
    if (touchFadeTimerRef.current !== null) {
      clearTimeout(touchFadeTimerRef.current);
      touchFadeTimerRef.current = null;
    }
    setIsTouching(true);
  }, []);

  const markTouchEnd = useCallback(() => {
    if (touchFadeTimerRef.current !== null) clearTimeout(touchFadeTimerRef.current);
    touchFadeTimerRef.current = setTimeout(() => {
      setIsTouching(false);
      touchFadeTimerRef.current = null;
    }, 700);
  }, []);

  // ── Stick sync ────────────────────────────────────────────────────────────
  const syncStickCap = useCallback((cap: HTMLDivElement | null, vector: MobileControlVector) => {
    if (!cap) return;
    cap.style.transform = getStickTransform(vector);
  }, []);

  const syncLegacyMove = useCallback((vector: MobileControlVector) => {
    const nextAction = getLegacyMoveAction(vector);
    if (activeMoveActionRef.current && activeMoveActionRef.current !== nextAction) {
      fireLegacyGameInput(activeMoveActionRef.current, false);
    }
    if (nextAction && nextAction !== activeMoveActionRef.current) {
      fireLegacyGameInput(nextAction, true);
    }
    if (!nextAction && activeMoveActionRef.current) {
      fireLegacyGameInput('move-stop', true);
      fireLegacyGameInput('move-stop', false);
    }
    activeMoveActionRef.current = nextAction;
  }, []);

  const updateLeftVector = useCallback((nextVector: MobileControlVector) => {
    syncStickCap(leftCapRef.current, nextVector);
    setLeftVector((prev) => keepPreviousVectorIfUnchanged(prev, nextVector));
    emitMobileMove(nextVector);
    syncLegacyMove(nextVector);
  }, [syncLegacyMove, syncStickCap]);

  const updateRightVector = useCallback((nextVector: MobileControlVector) => {
    syncStickCap(rightCapRef.current, nextVector);
    setRightVector((prev) => keepPreviousVectorIfUnchanged(prev, nextVector));
    emitMobileLook(nextVector);
  }, [syncStickCap]);

  const updateStickFromTouch = useCallback((
    touch: TouchPoint,
    dock: HTMLDivElement | null,
    setVector: (v: MobileControlVector) => void,
  ) => {
    if (!dock) return;
    const rect = dock.getBoundingClientRect();
    const radius = rect.width * 0.3;
    setVector(normalizeStickVector(
      touch.clientX - (rect.left + rect.width / 2),
      touch.clientY - (rect.top + rect.height / 2),
      radius,
    ));
  }, []);

  // ── Left stick ────────────────────────────────────────────────────────────
  const handleLeftTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (leftTouchIdRef.current !== null) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    leftTouchIdRef.current = touch.identifier;
    markTouchStart();
    updateStickFromTouch(touch, leftDockRef.current, updateLeftVector);
  }, [markTouchStart, updateLeftVector, updateStickFromTouch]);

  const handleLeftTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    const touch = Array.from(event.changedTouches).find((t) => t.identifier === leftTouchIdRef.current);
    if (!touch) return;
    updateStickFromTouch(touch, leftDockRef.current, updateLeftVector);
  }, [updateLeftVector, updateStickFromTouch]);

  const releaseLeftStick = useCallback(() => {
    if (leftTouchIdRef.current === null && leftVector.x === 0 && leftVector.y === 0) return;
    leftTouchIdRef.current = null;
    markTouchEnd();
    updateLeftVector(ZERO_VECTOR);
  }, [leftVector.x, leftVector.y, markTouchEnd, updateLeftVector]);

  const handleLeftTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (Array.from(event.changedTouches).some((t) => t.identifier === leftTouchIdRef.current)) {
      releaseLeftStick();
    }
  }, [releaseLeftStick]);

  // ── Button helpers ────────────────────────────────────────────────────────
  const updateButtonPressed = useCallback((buttonId: string, active: boolean) => {
    setPressedButtons((prev) => {
      if ((prev[buttonId] ?? false) === active) return prev;
      return { ...prev, [buttonId]: active };
    });
  }, []);

  const setButtonActive = useCallback((buttonId: string, active: boolean) => {
    if (!INTERACTIVE_BUTTONS.has(buttonId)) return;
    const counts = activeBtnCountsRef.current;
    const current = counts[buttonId] ?? 0;
    const next = active ? current + 1 : Math.max(0, current - 1);
    counts[buttonId] = next;
    updateButtonPressed(buttonId, next > 0);
    if (active && current === 0) {
      emitMobileButton(buttonId as MobileHudButton);
      fireLegacyGameInput(getLegacyActionForMobileButton(buttonId as 'jump' | 'dash' | 'action'), true);
    }
    if (!active && current > 0 && next === 0) {
      fireLegacyGameInput(getLegacyActionForMobileButton(buttonId as 'jump' | 'dash' | 'action'), false);
    }
  }, [updateButtonPressed]);

  const findButtonAtPoint = useCallback((clientX: number, clientY: number): string | null => {
    for (const btn of interactiveButtons) {
      const rect = ringButtonRefs.current[btn.id]?.getBoundingClientRect();
      if (!rect) continue;
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return btn.id;
      }
    }
    return null;
  }, [interactiveButtons]);

  // ── Right dock — combined joystick + buttons ──────────────────────────────
  const handleRightDockTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    Array.from(event.changedTouches).forEach((touch) => {
      markTouchStart();
      if (rightJoyTouchIdRef.current === null && isInJoystickZone(touch, rightDockRef.current)) {
        rightJoyTouchIdRef.current = touch.identifier;
        rightJoyTapRef.current = { startX: touch.clientX, startY: touch.clientY, startAt: Date.now() };
        updateStickFromTouch(touch, rightDockRef.current, updateRightVector);
      } else {
        const buttonId = findButtonAtPoint(touch.clientX, touch.clientY);
        rightBtnTouchesRef.current.set(touch.identifier, buttonId);
        if (buttonId) setButtonActive(buttonId, true);
      }
    });
  }, [findButtonAtPoint, markTouchStart, setButtonActive, updateRightVector, updateStickFromTouch]);

  const handleRightDockTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    Array.from(event.changedTouches).forEach((touch) => {
      if (touch.identifier === rightJoyTouchIdRef.current) {
        updateStickFromTouch(touch, rightDockRef.current, updateRightVector);
      } else if (rightBtnTouchesRef.current.has(touch.identifier)) {
        const prev = rightBtnTouchesRef.current.get(touch.identifier) ?? null;
        const next = findButtonAtPoint(touch.clientX, touch.clientY);
        if (prev !== next) {
          if (prev) setButtonActive(prev, false);
          if (next) setButtonActive(next, true);
          rightBtnTouchesRef.current.set(touch.identifier, next);
        }
      }
    });
  }, [findButtonAtPoint, setButtonActive, updateRightVector, updateStickFromTouch]);

  const releaseRightDockTouch = useCallback((touchId: number, clientX?: number, clientY?: number) => {
    if (touchId === rightJoyTouchIdRef.current) {
      rightJoyTouchIdRef.current = null;
      updateRightVector(ZERO_VECTOR);
      // Tap detection: short touch (< 280ms) with minimal movement (< 12px) = jump
      const tap = rightJoyTapRef.current;
      if (tap && clientX !== undefined && clientY !== undefined) {
        const moved = Math.hypot(clientX - tap.startX, clientY - tap.startY);
        const elapsed = Date.now() - tap.startAt;
        if (elapsed < 280 && moved < 12) {
          setButtonActive('jump', true);
          setTimeout(() => setButtonActive('jump', false), 80);
        }
      }
      rightJoyTapRef.current = null;
    } else if (rightBtnTouchesRef.current.has(touchId)) {
      const buttonId = rightBtnTouchesRef.current.get(touchId);
      if (buttonId) setButtonActive(buttonId, false);
      rightBtnTouchesRef.current.delete(touchId);
    }
    markTouchEnd();
  }, [markTouchEnd, setButtonActive, updateRightVector]);

  const handleRightDockTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    Array.from(event.changedTouches).forEach((t) => releaseRightDockTouch(t.identifier, t.clientX, t.clientY));
  }, [releaseRightDockTouch]);

  // ── Pause / Exit ──────────────────────────────────────────────────────────
  const handlePausePress = useCallback(() => {
    setPausePressed(true);
    markTouchStart();
    emitMobileButton('pause');
    fireLegacyGameInput('pause', true);
  }, [markTouchStart]);

  const handlePauseRelease = useCallback(() => {
    setPausePressed(false);
    markTouchEnd();
    fireLegacyGameInput('pause', false);
  }, [markTouchEnd]);

  // ── Size control ──────────────────────────────────────────────────────────
  const adjustScale = useCallback((delta: number) => {
    setRemoteScale((prev) => {
      const next = Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round((prev + delta) * 10) / 10));
      savePersisted('de:hud:scale', next);
      return next;
    });
  }, []);

  // ── Drag to reposition ────────────────────────────────────────────────────
  const handleDragStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    dragStartRef.current = { y: event.clientY, baseOffsetY: offsetY };
    markTouchStart();
  }, [markTouchStart, offsetY]);

  const handleDragMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dy = dragStartRef.current.y - event.clientY;
    const next = Math.max(-80, Math.min(200, dragStartRef.current.baseOffsetY + dy));
    setOffsetY(next);
    savePersisted('de:hud:offsetY', next);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragStartRef.current = null;
    markTouchEnd();
  }, [markTouchEnd]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (touchFadeTimerRef.current !== null) clearTimeout(touchFadeTimerRef.current);
    if (activeMoveActionRef.current) fireLegacyGameInput(activeMoveActionRef.current, false);
    fireLegacyGameInput('move-stop', true);
    fireLegacyGameInput('move-stop', false);
    Object.entries(activeBtnCountsRef.current).forEach(([buttonId, count]) => {
      if (!count || !INTERACTIVE_BUTTONS.has(buttonId)) return;
      fireLegacyGameInput(getLegacyActionForMobileButton(buttonId as 'jump' | 'dash' | 'action'), false);
    });
    fireLegacyGameInput('pause', false);
  }, []);

  const remoteVars = {
    '--remote-scale': String(remoteScale),
    '--remote-offset-y': `${offsetY}px`,
  } as React.CSSProperties;

  return (
    <div
      className={clsx(styles.overlay, isTouching ? styles.overlayActive : styles.overlayIdle)}
      style={remoteVars}
    >
      <div className={styles.hudBadge}>{gameLabel} · mobile HUD</div>

      {/* ── Left joystick (MOVE) ── */}
      <div
        ref={leftDockRef}
        className={clsx(styles.joystickDock, styles.leftDock)}
        onTouchStart={handleLeftTouchStart}
        onTouchMove={handleLeftTouchMove}
        onTouchEnd={handleLeftTouchEnd}
        onTouchCancel={handleLeftTouchEnd}
      >
        <div className={styles.readout}>{formatVectorLabel(leftVector, 'MOVE')}</div>
        <div className={styles.joystickShell}>
          <div className={styles.joystickRing} />
          <div className={styles.joystickCore} />
          <div
            ref={leftCapRef}
            className={clsx(styles.joystickCap, leftTouchIdRef.current === null && styles.joystickCapReset)}
            style={{ transform: getStickTransform(leftVector) }}
          />
        </div>
      </div>

      {/* ── Center: pause/exit + size control + drag handle ── */}
      <div className={styles.centerGroup}>
        <div className={styles.centerPills}>
          <button
            type="button"
            className={clsx(styles.pill, styles.pillPause, pausePressed && styles.pillActive)}
            onTouchStart={handlePausePress}
            onTouchEnd={handlePauseRelease}
            onTouchCancel={handlePauseRelease}
            onMouseDown={handlePausePress}
            onMouseUp={handlePauseRelease}
            onMouseLeave={handlePauseRelease}
          >
            Pause
          </button>
          <button
            type="button"
            className={clsx(styles.pill, styles.pillExit, exitPressed && styles.pillActive)}
            onTouchStart={() => { setExitPressed(true); markTouchStart(); }}
            onTouchEnd={() => { setExitPressed(false); markTouchEnd(); }}
            onTouchCancel={() => { setExitPressed(false); markTouchEnd(); }}
            onMouseDown={() => { setExitPressed(true); markTouchStart(); }}
            onMouseUp={() => { setExitPressed(false); markTouchEnd(); }}
            onMouseLeave={() => { setExitPressed(false); markTouchEnd(); }}
            onClick={onExit}
          >
            Exit
          </button>
        </div>

        {/* +/- size control */}
        <div className={styles.sizeControl}>
          <button
            type="button"
            className={styles.sizeBtn}
            onPointerDown={() => { adjustScale(-SCALE_STEP); markTouchStart(); }}
            onPointerUp={markTouchEnd}
            onPointerCancel={markTouchEnd}
            aria-label="Shrink remote"
          >
            −
          </button>
          <span className={styles.sizeLabel}>{Math.round(remoteScale * 100)}%</span>
          <button
            type="button"
            className={styles.sizeBtn}
            onPointerDown={() => { adjustScale(+SCALE_STEP); markTouchStart(); }}
            onPointerUp={markTouchEnd}
            onPointerCancel={markTouchEnd}
            aria-label="Grow remote"
          >
            +
          </button>
        </div>

        {/* Drag handle for repositioning */}
        <div
          className={styles.dragHandle}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          title="Drag to reposition"
        >
          ⠿
        </div>
      </div>

      {/* ── Right dock — button ring around an embedded joystick (LOOK) ── */}
      <div
        ref={rightDockRef}
        className={clsx(styles.joystickDock, styles.rightDock)}
        onTouchStart={handleRightDockTouchStart}
        onTouchMove={handleRightDockTouchMove}
        onTouchEnd={handleRightDockTouchEnd}
        onTouchCancel={handleRightDockTouchEnd}
      >
        <div className={styles.readout}>{formatVectorLabel(rightVector, 'LOOK')}</div>
        <div className={styles.buttonCluster}>
          <div className={styles.clusterRing} />
          {/* Central joystick embedded in the hub */}
          <div className={styles.clusterHub} />
          <div
            ref={rightCapRef}
            className={clsx(styles.joystickCap, styles.rightJoyCap, rightJoyTouchIdRef.current === null && styles.joystickCapReset)}
            style={{ transform: getStickTransform(rightVector) }}
          />
          {/* Ring buttons */}
          {MOBILE_HUD_BUTTON_RING.map((button) => (
            <div
              key={button.id}
              ref={(node) => { ringButtonRefs.current[button.id] = node; }}
              className={clsx(
                styles.ringButton,
                styles[button.slotClassName as keyof typeof styles],
                button.interactive ? styles.interactive : styles.decorative,
                pressedButtons[button.id] && styles.buttonPressed,
              )}
            >
              <span className={styles.buttonSymbol}>{button.symbol}</span>
              <span className={styles.buttonLabel}>{button.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
