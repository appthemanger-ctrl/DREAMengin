'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

interface MobileGameHUDProps {
  gameLabel: string;
  mode: MobileHudMode;
  onExit: () => void;
}

const ZERO_VECTOR: MobileControlVector = { x: 0, y: 0 };
type TouchPoint = { clientX: number; clientY: number };

function getStickTransform(vector: MobileControlVector) {
  return `translate(calc(-50% + ${vector.x * 34}% ), calc(-50% + ${vector.y * 34}% ))`;
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

export default function MobileGameHUD({ gameLabel, mode, onExit }: MobileGameHUDProps) {
  const leftDockRef = useRef<HTMLDivElement>(null);
  const rightDockRef = useRef<HTMLDivElement>(null);
  const leftCapRef = useRef<HTMLDivElement>(null);
  const rightCapRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const leftTouchIdRef = useRef<number | null>(null);
  const rightTouchIdRef = useRef<number | null>(null);
  const activeMoveActionRef = useRef<ReturnType<typeof getLegacyMoveAction>>(null);
  const rightTouchButtonsRef = useRef<Map<number, string | null>>(new Map());
  const activeButtonCountsRef = useRef<Record<string, number>>({});

  const [leftVector, setLeftVector] = useState(ZERO_VECTOR);
  const [rightVector, setRightVector] = useState(ZERO_VECTOR);
  const [pressedButtons, setPressedButtons] = useState<Record<string, boolean>>({});
  const [pausePressed, setPausePressed] = useState(false);
  const [exitPressed, setExitPressed] = useState(false);

  const interactiveButtons = useMemo(
    () => MOBILE_HUD_BUTTON_RING.filter((button) => button.interactive),
    [],
  );

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
    if (!['jump', 'dash', 'action'].includes(buttonId)) return;
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

  const findButtonAtPoint = useCallback((clientX: number, clientY: number) => {
    for (const button of interactiveButtons) {
      const rect = buttonRefs.current[button.id]?.getBoundingClientRect();
      if (!rect) continue;
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return button.id;
      }
    }
    return null;
  }, [interactiveButtons]);

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

  const handleLeftTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (leftTouchIdRef.current !== null) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    leftTouchIdRef.current = touch.identifier;
    updateStickFromTouch(touch, leftDockRef.current, updateLeftVector);
  }, [updateLeftVector, updateStickFromTouch]);

  const handleLeftTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    const touch = Array.from(event.changedTouches).find((entry) => entry.identifier === leftTouchIdRef.current);
    if (!touch) return;
    updateStickFromTouch(touch, leftDockRef.current, updateLeftVector);
  }, [updateLeftVector, updateStickFromTouch]);

  const releaseLeftStick = useCallback(() => {
    if (leftTouchIdRef.current === null && leftVector.x === 0 && leftVector.y === 0) return;
    leftTouchIdRef.current = null;
    updateLeftVector(ZERO_VECTOR);
  }, [leftVector.x, leftVector.y, updateLeftVector]);

  const handleLeftTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    const touchReleased = Array.from(event.changedTouches).some((entry) => entry.identifier === leftTouchIdRef.current);
    if (touchReleased) releaseLeftStick();
  }, [releaseLeftStick]);

  const handleRightStickStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (rightTouchIdRef.current !== null) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    rightTouchIdRef.current = touch.identifier;
    updateStickFromTouch(touch, rightDockRef.current, updateRightVector);
  }, [updateRightVector, updateStickFromTouch]);

  const handleRightStickMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    const touch = Array.from(event.changedTouches).find((entry) => entry.identifier === rightTouchIdRef.current);
    if (!touch) return;
    updateStickFromTouch(touch, rightDockRef.current, updateRightVector);
  }, [updateRightVector, updateStickFromTouch]);

  const releaseRightStick = useCallback(() => {
    rightTouchIdRef.current = null;
    updateRightVector(ZERO_VECTOR);
  }, [updateRightVector]);

  const handleRightStickEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    const touchReleased = Array.from(event.changedTouches).some((entry) => entry.identifier === rightTouchIdRef.current);
    if (touchReleased) releaseRightStick();
  }, [releaseRightStick]);

  const handleButtonClusterStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    Array.from(event.changedTouches).forEach((touch) => {
      const buttonId = findButtonAtPoint(touch.clientX, touch.clientY);
      rightTouchButtonsRef.current.set(touch.identifier, buttonId);
      if (buttonId) setButtonActive(buttonId, true);
    });
  }, [findButtonAtPoint, setButtonActive]);

  const handleButtonClusterMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    Array.from(event.changedTouches).forEach((touch) => {
      if (!rightTouchButtonsRef.current.has(touch.identifier)) return;
      const previousButton = rightTouchButtonsRef.current.get(touch.identifier) ?? null;
      const nextButton = findButtonAtPoint(touch.clientX, touch.clientY);
      if (previousButton === nextButton) return;
      if (previousButton) setButtonActive(previousButton, false);
      if (nextButton) setButtonActive(nextButton, true);
      rightTouchButtonsRef.current.set(touch.identifier, nextButton);
    });
  }, [findButtonAtPoint, setButtonActive]);

  const releaseClusterTouch = useCallback((touchId: number) => {
    const buttonId = rightTouchButtonsRef.current.get(touchId);
    if (buttonId) setButtonActive(buttonId, false);
    rightTouchButtonsRef.current.delete(touchId);
  }, [setButtonActive]);

  const handleButtonClusterEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    Array.from(event.changedTouches).forEach((touch) => releaseClusterTouch(touch.identifier));
  }, [releaseClusterTouch]);

  const handlePausePress = useCallback(() => {
    setPausePressed(true);
    emitMobileButton('pause');
    fireLegacyGameInput('pause', true);
  }, []);

  const handlePauseRelease = useCallback(() => {
    setPausePressed(false);
    fireLegacyGameInput('pause', false);
  }, []);

  useEffect(() => () => {
    if (activeMoveActionRef.current) {
      fireLegacyGameInput(activeMoveActionRef.current, false);
    }
    fireLegacyGameInput('move-stop', true);
    fireLegacyGameInput('move-stop', false);
    Object.entries(activeButtonCountsRef.current).forEach(([buttonId, count]) => {
      if (!count || !['jump', 'dash', 'action'].includes(buttonId)) return;
      fireLegacyGameInput(getLegacyActionForMobileButton(buttonId as 'jump' | 'dash' | 'action'), false);
    });
    fireLegacyGameInput('pause', false);
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.hudBadge}>{gameLabel} · mobile HUD</div>

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
            style={{
              transform: getStickTransform(leftVector),
            }}
          />
        </div>
      </div>

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
          onTouchStart={() => setExitPressed(true)}
          onTouchEnd={() => setExitPressed(false)}
          onTouchCancel={() => setExitPressed(false)}
          onMouseDown={() => setExitPressed(true)}
          onMouseUp={() => setExitPressed(false)}
          onMouseLeave={() => setExitPressed(false)}
          onClick={onExit}
        >
          Exit
        </button>
      </div>

      {mode === 'joystick' ? (
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
              style={{
                transform: getStickTransform(rightVector),
              }}
            />
          </div>
        </div>
      ) : (
        <div
          className={clsx(styles.joystickDock, styles.rightDock)}
          onTouchStart={handleButtonClusterStart}
          onTouchMove={handleButtonClusterMove}
          onTouchEnd={handleButtonClusterEnd}
          onTouchCancel={handleButtonClusterEnd}
        >
          <div className={styles.readout}>Jump · Dash · Action</div>
          <div className={styles.buttonCluster}>
            <div className={styles.clusterRing} />
            <div className={styles.clusterHub} />
            {MOBILE_HUD_BUTTON_RING.map((button) => (
              <div
                key={button.id}
                ref={(node) => {
                  buttonRefs.current[button.id] = node;
                }}
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
      )}
    </div>
  );
}
