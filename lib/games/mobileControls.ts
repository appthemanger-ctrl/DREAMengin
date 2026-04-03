'use client';

import { useEffect, useRef } from 'react';
import { broadcastGameInput } from '@/lib/games/useRemoteChannel';

export interface MobileControlVector {
  x: number;
  y: number;
}

export type MobileHudMode = 'buttons' | 'joystick' | 'controller';
export type MobileHudButton = 'jump' | 'dash' | 'action' | 'pause';

type LegacyMoveAction =
  | 'move-left'
  | 'move-right'
  | 'move-up'
  | 'move-down'
  | 'move-up-left'
  | 'move-up-right'
  | 'move-down-left'
  | 'move-down-right';

type LegacyGameInputAction = LegacyMoveAction | 'move-stop' | 'jump' | 'r1' | 'shoot' | 'pause';

export interface MobileGameControlHandlers {
  onMove?: (directionVector: MobileControlVector) => void;
  onLook?: (lookVector: MobileControlVector) => void;
  onLookDelta?: (delta: { dx: number; dy: number }) => void;
  onJump?: () => void;
  onDash?: () => void;
  onAction?: () => void;
  onPause?: () => void;
}

export interface MobileHudRingButtonDefinition {
  id: string;
  symbol: string;
  label: string;
  interactive: boolean;
  slotClassName: string;
}

const MOBILE_CONTROL_LISTENERS = new Set<MobileGameControlHandlers>();
const ZERO_VECTOR: MobileControlVector = Object.freeze({ x: 0, y: 0 });
const LEGACY_BUTTON_MAP: Record<Exclude<MobileHudButton, 'pause'>, LegacyGameInputAction> = {
  jump: 'jump',
  dash: 'r1',
  action: 'shoot',
};

export const MOBILE_HUD_BUTTON_RING: readonly MobileHudRingButtonDefinition[] = [
  { id: 'l1', symbol: 'L1', label: 'Guard', interactive: false, slotClassName: 'slotL1' },
  { id: 'triangle', symbol: '△', label: 'Look', interactive: false, slotClassName: 'slotJump' },
  { id: 'dash', symbol: 'R1', label: 'Dash', interactive: true, slotClassName: 'slotR1' },
  { id: 'action', symbol: '⭕️', label: 'Action', interactive: true, slotClassName: 'slotCircle' },
  { id: 'r2', symbol: 'R2', label: 'Boost', interactive: false, slotClassName: 'slotR2' },
  { id: 'jump', symbol: '×', label: 'Jump', interactive: true, slotClassName: 'slotX' },
  { id: 'l2', symbol: 'L2', label: 'Hold', interactive: false, slotClassName: 'slotL2' },
  { id: 'square', symbol: '□', label: 'Tech', interactive: false, slotClassName: 'slotSquare' },
] as const;

function emitWindowEvent(name: string, detail: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function normalizeStickVector(dx: number, dy: number, radius: number): MobileControlVector {
  if (!radius) return ZERO_VECTOR;
  const distance = Math.hypot(dx, dy);
  if (!distance) return ZERO_VECTOR;
  const clamped = Math.min(distance, radius);
  return {
    x: Number(((dx / distance) * (clamped / radius)).toFixed(4)),
    y: Number(((dy / distance) * (clamped / radius)).toFixed(4)),
  };
}

export function getLegacyMoveAction(vector: MobileControlVector, deadZone = 0.24): LegacyMoveAction | null {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (magnitude < deadZone) return null;
  const angle = Math.atan2(vector.y, vector.x) * (180 / Math.PI);
  if (angle > -22.5 && angle <= 22.5) return 'move-right';
  if (angle > 22.5 && angle <= 67.5) return 'move-down-right';
  if (angle > 67.5 && angle <= 112.5) return 'move-down';
  if (angle > 112.5 && angle <= 157.5) return 'move-down-left';
  if (angle > 157.5 || angle <= -157.5) return 'move-left';
  if (angle > -157.5 && angle <= -112.5) return 'move-up-left';
  if (angle > -112.5 && angle <= -67.5) return 'move-up';
  return 'move-up-right';
}

export function fireLegacyGameInput(action: LegacyGameInputAction, active: boolean) {
  emitWindowEvent('de-game-input', { action, active });
  broadcastGameInput(action, active);
}

export function registerMobileGameControls(handlers: MobileGameControlHandlers) {
  MOBILE_CONTROL_LISTENERS.add(handlers);
  return () => {
    MOBILE_CONTROL_LISTENERS.delete(handlers);
  };
}

export function emitMobileMove(vector: MobileControlVector) {
  emitWindowEvent('de-mobile-move', vector);
  MOBILE_CONTROL_LISTENERS.forEach((handlers) => handlers.onMove?.(vector));
}

export function emitMobileLook(vector: MobileControlVector) {
  emitWindowEvent('de-mobile-look', vector);
  MOBILE_CONTROL_LISTENERS.forEach((handlers) => handlers.onLook?.(vector));
}

export function emitMobileButton(button: MobileHudButton) {
  emitWindowEvent('de-mobile-button', { button });
  MOBILE_CONTROL_LISTENERS.forEach((handlers) => {
    if (button === 'jump') handlers.onJump?.();
    if (button === 'dash') handlers.onDash?.();
    if (button === 'action') handlers.onAction?.();
    if (button === 'pause') handlers.onPause?.();
  });
}

export function emitMobileLookDelta(dx: number, dy: number) {
  emitWindowEvent('de-mobile-look-delta', { dx, dy });
  MOBILE_CONTROL_LISTENERS.forEach((handlers) => handlers.onLookDelta?.({ dx, dy }));
}

export function emitMobileJump(vector: { x: number; y: number }) {
  emitWindowEvent('de-mobile-jump', vector);
  MOBILE_CONTROL_LISTENERS.forEach((handlers) => handlers.onJump?.());
}

export function emitMobileShoot() {
  emitWindowEvent('de-mobile-shoot', {});
  MOBILE_CONTROL_LISTENERS.forEach((handlers) => handlers.onAction?.());
}

export function getLegacyActionForMobileButton(button: Exclude<MobileHudButton, 'pause'>) {
  return LEGACY_BUTTON_MAP[button];
}

export function useRegisterMobileGameControls(handlers: MobileGameControlHandlers | null) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!handlers) return undefined;
    const listener: MobileGameControlHandlers = {
      onMove: (vector) => handlersRef.current?.onMove?.(vector),
      onLook: (vector) => handlersRef.current?.onLook?.(vector),
      onLookDelta: (delta) => handlersRef.current?.onLookDelta?.(delta),
      onJump: () => handlersRef.current?.onJump?.(),
      onDash: () => handlersRef.current?.onDash?.(),
      onAction: () => handlersRef.current?.onAction?.(),
      onPause: () => handlersRef.current?.onPause?.(),
    };
    return registerMobileGameControls(listener);
  }, [Boolean(handlers)]);
}
