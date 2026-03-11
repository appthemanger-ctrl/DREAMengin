/**
 * Dual Runtime System
 *
 * The system has two independent runtime views:
 * - the top runtime
 * - the bottom runtime
 *
 * These runtimes are NOT locked to specific content types.
 * Both runtimes can display:
 * - Home
 * - DreamSpace
 * - any Dream
 * - any Engin
 * - any routed system world
 *
 * Valid states:
 * - HOME / HOME (two Home views, each can scroll independently)
 * - DREAMSPACE / DREAMSPACE (two DreamSpace views)
 * - HOME / DREAMSPACE
 * - DREAMSPACE / HOME
 * - Or any other combination
 *
 * The runtimes are independent views into the same system.
 * They can show the same world or different worlds.
 */

export type RuntimeWorld =
  | 'home'
  | 'dreamspace'
  | 'profile'
  | { type: 'dream'; id: string }
  | { type: 'engin'; name: string }
  | { type: 'custom'; path: string };

export interface DualRuntimeState {
  topRuntime: RuntimeWorld;
  bottomRuntime: RuntimeWorld;
  /** Which runtime is currently dominant/visible (controlled by bar position) */
  dominantRuntime: 'top' | 'bottom';
}

export const DEFAULT_DUAL_RUNTIME: DualRuntimeState = {
  topRuntime: 'home',
  bottomRuntime: 'dreamspace',
  dominantRuntime: 'top',
};

/**
 * Set the content of a specific runtime
 */
export function setRuntimeWorld(
  state: DualRuntimeState,
  runtime: 'top' | 'bottom',
  world: RuntimeWorld
): DualRuntimeState {
  return {
    ...state,
    [runtime === 'top' ? 'topRuntime' : 'bottomRuntime']: world,
  };
}

/**
 * Swap which runtime is dominant (controlled by bar drag)
 */
export function swapDominantRuntime(state: DualRuntimeState): DualRuntimeState {
  return {
    ...state,
    dominantRuntime: state.dominantRuntime === 'top' ? 'bottom' : 'top',
  };
}

/**
 * Make Home the active top runtime
 * Used when double-tapping Gold button
 */
export function makeHomeActiveTop(state: DualRuntimeState): DualRuntimeState {
  return {
    ...state,
    topRuntime: 'home',
    dominantRuntime: 'top',
  };
}

/**
 * Check if Home is currently the active top runtime
 */
export function isHomeActiveTop(state: DualRuntimeState): boolean {
  return state.topRuntime === 'home' && state.dominantRuntime === 'top';
}

/**
 * Check if two RuntimeWorld values are equal
 */
export function worldsEqual(a: RuntimeWorld, b: RuntimeWorld): boolean {
  if (typeof a === 'string' && typeof b === 'string') {
    return a === b;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    return a.type === b.type &&
      ('id' in a && 'id' in b ? a.id === b.id : true) &&
      ('name' in a && 'name' in b ? a.name === b.name : true) &&
      ('path' in a && 'path' in b ? a.path === b.path : true);
  }
  return false;
}
