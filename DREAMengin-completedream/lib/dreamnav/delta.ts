export * from './tau';

import type { Action, NavState } from './tau';
import { transition } from './tau';

// Backward-compat reducer name.
export function reduceNav(prev: NavState, action: Action): NavState {
  return transition(prev, action);
}
