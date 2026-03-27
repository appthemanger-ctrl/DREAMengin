'use client';

import { useEffect } from 'react';
import type { GameInputAction } from '@/components/games/GameRemote';

type KeyboardInput = {
  key: string;
  code: string;
};

export const GAME_INPUT_KEYBOARD_MAP: Partial<Record<GameInputAction, KeyboardInput[]>> = {
  'move-left': [{ key: 'ArrowLeft', code: 'ArrowLeft' }],
  'move-right': [{ key: 'ArrowRight', code: 'ArrowRight' }],
  'move-up': [{ key: 'ArrowUp', code: 'ArrowUp' }],
  'move-down': [{ key: 'ArrowDown', code: 'ArrowDown' }],
  'move-up-left': [
    { key: 'ArrowUp', code: 'ArrowUp' },
    { key: 'ArrowLeft', code: 'ArrowLeft' },
  ],
  'move-up-right': [
    { key: 'ArrowUp', code: 'ArrowUp' },
    { key: 'ArrowRight', code: 'ArrowRight' },
  ],
  'move-down-left': [
    { key: 'ArrowDown', code: 'ArrowDown' },
    { key: 'ArrowLeft', code: 'ArrowLeft' },
  ],
  'move-down-right': [
    { key: 'ArrowDown', code: 'ArrowDown' },
    { key: 'ArrowRight', code: 'ArrowRight' },
  ],
  jump: [{ key: 'ArrowUp', code: 'ArrowUp' }],
  duck: [{ key: 'ArrowDown', code: 'ArrowDown' }],
  spin: [{ key: 'z', code: 'KeyZ' }],
  shoot: [{ key: ' ', code: 'Space' }],
  'jump-spin': [
    { key: 'ArrowUp', code: 'ArrowUp' },
    { key: 'z', code: 'KeyZ' },
  ],
  'jump-shoot': [
    { key: 'ArrowUp', code: 'ArrowUp' },
    { key: ' ', code: 'Space' },
  ],
  l2: [{ key: 'Shift', code: 'ShiftLeft' }],
  r1: [{ key: 'x', code: 'KeyX' }],
  pause: [{ key: 'Escape', code: 'Escape' }],
};

const DIRECTIONAL_ACTIONS: GameInputAction[] = [
  'move-left',
  'move-right',
  'move-up',
  'move-down',
  'move-up-left',
  'move-up-right',
  'move-down-left',
  'move-down-right',
];

function emitKeyboardEvent(type: 'keydown' | 'keyup', input: KeyboardInput) {
  window.dispatchEvent(new KeyboardEvent(type, {
    key: input.key,
    code: input.code,
    bubbles: true,
    cancelable: true,
  }));
}

export function useGameInputKeyboardBridge() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const activeInputsByAction = new Map<GameInputAction, KeyboardInput[]>();
    const pressedCounts = new Map<string, number>();

    const getInputKey = (input: KeyboardInput) => `${input.code}:${input.key}`;

    const pressInputs = (inputs: KeyboardInput[]) => {
      inputs.forEach((input) => {
        const inputKey = getInputKey(input);
        const nextCount = (pressedCounts.get(inputKey) ?? 0) + 1;
        pressedCounts.set(inputKey, nextCount);
        if (nextCount === 1) emitKeyboardEvent('keydown', input);
      });
    };

    const releaseInputs = (inputs: KeyboardInput[]) => {
      inputs.forEach((input) => {
        const inputKey = getInputKey(input);
        const prevCount = pressedCounts.get(inputKey) ?? 0;
        if (prevCount <= 1) {
          pressedCounts.delete(inputKey);
          emitKeyboardEvent('keyup', input);
          return;
        }
        pressedCounts.set(inputKey, prevCount - 1);
      });
    };

    const releaseAction = (action: GameInputAction) => {
      const activeInputs = activeInputsByAction.get(action);
      if (!activeInputs) return;
      releaseInputs(activeInputs);
      activeInputsByAction.delete(action);
    };

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ action?: string; active?: boolean }>).detail;
      const action = detail?.action;
      const active = detail?.active;

      if (typeof action !== 'string' || typeof active !== 'boolean') return;

      if (action === 'move-stop') {
        DIRECTIONAL_ACTIONS.forEach(releaseAction);
        return;
      }

      const mappedInputs = GAME_INPUT_KEYBOARD_MAP[action as GameInputAction];
      if (!mappedInputs?.length) return;

      if (active) {
        if (activeInputsByAction.has(action as GameInputAction)) return;
        activeInputsByAction.set(action as GameInputAction, mappedInputs);
        pressInputs(mappedInputs);
        return;
      }

      releaseAction(action as GameInputAction);
    };

    window.addEventListener('de-game-input', handler as EventListener);
    return () => {
      window.removeEventListener('de-game-input', handler as EventListener);
      activeInputsByAction.forEach((inputs) => releaseInputs(inputs));
      activeInputsByAction.clear();
      pressedCounts.clear();
    };
  }, []);
}
