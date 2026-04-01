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
  normalizeStickVector,
  type MobileControlVector,
  type MobileHudButton,
  type MobileHudMode,
} from '@/lib/games/mobileControls';

// PS-style face buttons arranged as a diamond (top/right/bottom/left)
const FACE_BUTTONS = [
  { id: 'jump',   symbol: '△', label: 'Jump',   pos: 'top'    as const, interactive: true  },
  { id: 'action', symbol: '○', label: 'Action', pos: 'right'  as const, interactive: true  },
  { id: 'x',      symbol: '×', label: 'Face',   pos: 'bottom' as const, interactive: false },
  { id: 'dash',   symbol: '□', label: 'Dash',   pos: 'left'   as const, interactive: true  },
] as const;

const INTERACTIVE_FACE = new Set<string>(['jump', 'dash', 'action']);

const SCALE_MIN = 0.55;
const SCALE_MAX = 1.45;
const SCALE_STEP = 0.1;

// ── Helpers ─────────────────────────────────────────────────────────────────

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

const FACE_POS_CLASS: Record<'top' | 'right' | 'bottom' | 'left', string> = {
  top:    styles.faceBtnPosTop,
  right:  styles.faceBtnPosRight,
  bottom: styles.faceBtnPosBottom,
  left:   styles.faceBtnPosLeft,
};

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

export default function MobileGameHUD({ gameLabel, mode: _mode, onExit }: MobileGameHUDProps) {
  const leftDockRef = useRef<HTMLDivElement>(null);
  const rightDockRef = useRef<HTMLDivElement>(null);
  const leftCapRef = useRef<HTMLDivElement>(null);
  const rightCapRef = useRef<HTMLDivElement>(null);
  const faceButtonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const leftTouchIdRef = useRef<number | null>(null);
  const rightTouchIdRef = useRef<number | null>(null);
  const activeMoveActionRef = useRef<ReturnType<typeof getLegacyMoveAction>>(null);
  const faceTouchMapRef = useRef<Map<number, string | null>>(new Map());
  const activeButtonCountsRef = useRef<Record<string, number>>({});
  const touchFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartRef = useRef<{ y: number; baseOffsetY: number } | null>(null);

  const [leftVector, setLeftVector] = useState(ZERO_VECTOR);
  const [rightVector, setRightVector] = useState(ZERO_VECTOR);
  const [pressedButtons, setPressedButtons] = useState<Record<string, boolean>>({});
  const [pausePressed, setPausePressed] = useState(false);
  const [exitPressed, setExitPressed] = useState(false);
  const [remoteScale, setRemoteScale] = useState(() => loadPersisted('de:hud:scale', 1.0, SCALE_MIN, SCALE_MAX));
  const [offsetY, setOffsetY] = useState(() => loadPersisted('de:hud:offsetY', 0, -80, 200));
  const [isTouching, setIsTouching] = useState(false);

  // ── Emit CSS var so game stage can clear the remote ───────────────────────
  useEffect(() => {
    // Approximate dock height (px) at scale 1 + readout above
    const dockH = 130;
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

  const updateButtonPressedState = useCallback((buttonId: string, active: boolean) => {
    setPressedButtons((prev) => {
      if ((prev[buttonId] ?? false) === active) return prev;
      return { ...prev, [buttonId]: active };
    });
  }, []);

  const setButtonActive = useCallback((buttonId: string, active: boolean) => {
    if (!INTERACTIVE_FACE.has(buttonId)) return;
    const counts = activeButtonCountsRef.current;
    const current = counts[buttonId] ?? 0;
    const next = active ? current + 1 : Math.max(0, current - 1);
    counts[buttonId] = next;
    updateButtonPressedState(buttonId, next > 0);
    if (active && current === 0) {
      emitMobileButton(buttonId as MobileHudButton);
      fireLegacyGameInput(getLegacyActionForMobileButton(buttonId as 'jump' | 'dash' | 'action'), true);
    }
    if (!active && current > 0 && next === 0) {
      fireLegacyGameInput(getLegacyActionForMobileButton(buttonId as 'jump' | 'dash' | 'action'), false);
    }
  }, [updateButtonPressedState]);

  const findFaceButtonAtPoint = useCallback((clientX: number, clientY: number) => {
    for (const btn of FACE_BUTTONS) {
      if (!btn.interactive) continue;
      const rect = faceButtonRefs.current[btn.id]?.getBoundingClientRect();
      if (!rect) continue;
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return btn.id;
      }
    }
    return null;
  }, []);

  const updateStickFromTouch = useCallback((
    touch: TouchPoint,
    dock: HTMLDivElement | null,
    setVector: (vector: MobileControlVector) => void,
  ) => {
    if (!dock) return;
    const rect = dock.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width * 0.3;
    setVector(normalizeStickVector(touch.clientX - centerX, touch.clientY - centerY, radius));
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
    const released = Array.from(event.changedTouches).some((t) => t.identifier === leftTouchIdRef.current);
    if (released) releaseLeftStick();
  }, [releaseLeftStick]);

  // ── Right stick ───────────────────────────────────────────────────────────
  const handleRightStickStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (rightTouchIdRef.current !== null) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    rightTouchIdRef.current = touch.identifier;
    markTouchStart();
    updateStickFromTouch(touch, rightDockRef.current, updateRightVector);
  }, [markTouchStart, updateRightVector, updateStickFromTouch]);

  const handleRightStickMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    const touch = Array.from(event.changedTouches).find((t) => t.identifier === rightTouchIdRef.current);
    if (!touch) return;
    updateStickFromTouch(touch, rightDockRef.current, updateRightVector);
  }, [updateRightVector, updateStickFromTouch]);

  const releaseRightStick = useCallback(() => {
    rightTouchIdRef.current = null;
    markTouchEnd();
    updateRightVector(ZERO_VECTOR);
  }, [markTouchEnd, updateRightVector]);

  const handleRightStickEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    const released = Array.from(event.changedTouches).some((t) => t.identifier === rightTouchIdRef.current);
    if (released) releaseRightStick();
  }, [releaseRightStick]);

  // ── Face buttons ──────────────────────────────────────────────────────────
  const handleFaceButtonStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    Array.from(event.changedTouches).forEach((touch) => {
      const buttonId = findFaceButtonAtPoint(touch.clientX, touch.clientY);
      faceTouchMapRef.current.set(touch.identifier, buttonId);
      if (buttonId) { markTouchStart(); setButtonActive(buttonId, true); }
    });
  }, [findFaceButtonAtPoint, markTouchStart, setButtonActive]);

  const handleFaceButtonMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    Array.from(event.changedTouches).forEach((touch) => {
      if (!faceTouchMapRef.current.has(touch.identifier)) return;
      const prev = faceTouchMapRef.current.get(touch.identifier) ?? null;
      const next = findFaceButtonAtPoint(touch.clientX, touch.clientY);
      if (prev === next) return;
      if (prev) setButtonActive(prev, false);
      if (next) setButtonActive(next, true);
      faceTouchMapRef.current.set(touch.identifier, next);
    });
  }, [findFaceButtonAtPoint, setButtonActive]);

  const releaseFaceTouch = useCallback((touchId: number) => {
    const buttonId = faceTouchMapRef.current.get(touchId);
    if (buttonId) { setButtonActive(buttonId, false); markTouchEnd(); }
    faceTouchMapRef.current.delete(touchId);
  }, [markTouchEnd, setButtonActive]);

  const handleFaceButtonEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    Array.from(event.changedTouches).forEach((t) => releaseFaceTouch(t.identifier));
  }, [releaseFaceTouch]);

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
    Object.entries(activeButtonCountsRef.current).forEach(([buttonId, count]) => {
      if (!count || !INTERACTIVE_FACE.has(buttonId)) return;
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

      {/* ── Right area: face buttons diamond + right joystick (LOOK) ── */}
      <div className={styles.rightArea}>
        {/* Face buttons (△/○/×/□ diamond) */}
        <div
          className={styles.faceButtonCluster}
          onTouchStart={handleFaceButtonStart}
          onTouchMove={handleFaceButtonMove}
          onTouchEnd={handleFaceButtonEnd}
          onTouchCancel={handleFaceButtonEnd}
        >
          {FACE_BUTTONS.map((btn) => (
            <div
              key={btn.id}
              ref={(node) => { faceButtonRefs.current[btn.id] = node; }}
              className={clsx(
                styles.faceBtn,
                FACE_POS_CLASS[btn.pos],
                btn.interactive ? styles.faceBtnInteractive : styles.faceBtnDecorative,
                pressedButtons[btn.id] && styles.faceBtnPressed,
              )}
            >
              {btn.symbol}
            </div>
          ))}
          <div className={styles.faceBtnHub} />
        </div>

        {/* Right joystick */}
        <div
          ref={rightDockRef}
          className={clsx(styles.joystickDock, styles.rightDock)}
          onTouchStart={handleRightStickStart}
          onTouchMove={handleRightStickMove}
          onTouchEnd={handleRightStickEnd}
          onTouchCancel={handleRightStickEnd}
        >
          <div className={styles.readout}>{formatVectorLabel(rightVector, 'LOOK')}</div>
          <div className={styles.joystickShell}>
            <div className={styles.joystickRing} />
            <div className={styles.joystickCore} />
            <div
              ref={rightCapRef}
              className={clsx(styles.joystickCap, rightTouchIdRef.current === null && styles.joystickCapReset)}
              style={{ transform: getStickTransform(rightVector) }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
