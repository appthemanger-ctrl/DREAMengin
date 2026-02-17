// lib/dreamnav/delta.ts
// DREAM ENGINE — Navigation Core (τ)
// Source of truth: deterministic transition function + pure reducer.
//
// Rules (from FINAL HANDOFF SPEC):
// - No stack / no history / no numeric depth.
// - Home (node 0) resets heading context.
// - Navigation lives ONLY in τ (tau()).

export type Node =
  | 0
  | 1 | 2 | 3 | 4 | 5 | 6
  | '1b' | '2b' | '3b' | '4b' | '5b' | '6b';

export type Action =
  | 'swipe_left'
  | 'swipe_right'
  | 'swipe_up'
  | 'swipe_down'
  | 'depth_in'
  | 'depth_out'
  | 'home';

export type Heading = 'L' | 'R' | 'U' | 'D' | 'IN' | 'OUT' | null;

export type NavState = {
  node: Node;
  heading: Heading;
};

const CORE_FACES = [1, 2, 3, 4, 5, 6] as const;

function isOuter(n: Node): n is Exclude<Node, 0 | 1 | 2 | 3 | 4 | 5 | 6> {
  return typeof n === 'string';
}

function faceOf(n: Node): 1 | 2 | 3 | 4 | 5 | 6 {
  if (typeof n === 'number') return n as 1 | 2 | 3 | 4 | 5 | 6;
  return Number(n[0]) as 1 | 2 | 3 | 4 | 5 | 6;
}

function toOuter(face: 1 | 2 | 3 | 4 | 5 | 6): Node {
  return `${face}b` as Node;
}

function toInner(face: 1 | 2 | 3 | 4 | 5 | 6): Node {
  return face as Node;
}

// Deterministic cube adjacency (screen-relative).
// Face ids:
// 1 = front, 2 = back, 3 = left, 4 = right, 5 = top, 6 = bottom
const ADJ: Record<1 | 2 | 3 | 4 | 5 | 6, Record<'U' | 'D' | 'L' | 'R', 1 | 2 | 3 | 4 | 5 | 6>> = {
  1: { U: 5, D: 6, L: 3, R: 4 }, // front
  2: { U: 5, D: 6, L: 4, R: 3 }, // back (L/R swap)
  3: { U: 5, D: 6, L: 2, R: 1 }, // left (L->back, R->front)
  4: { U: 5, D: 6, L: 1, R: 2 }, // right (L->front, R->back)
  5: { U: 2, D: 1, L: 3, R: 4 }, // top (U->back, D->front)
  6: { U: 1, D: 2, L: 3, R: 4 }, // bottom (U->front, D->back)
};

export function actionToHeading(a: Action): Heading {
  switch (a) {
    case 'swipe_left': return 'L';
    case 'swipe_right': return 'R';
    case 'swipe_up': return 'U';
    case 'swipe_down': return 'D';
    case 'depth_in': return 'IN';
    case 'depth_out': return 'OUT';
    case 'home': return null;
  }
}

/**
 * τ(node, action) -> next_node
 * Navigation lives ONLY here.
 */
export function tau(node: Node, action: Action): Node {
  // Home reset
  if (action === 'home') return 0;

  // Home anchor transitions
  if (node === 0) {
    switch (action) {
      case 'swipe_up': return 1;
      case 'swipe_down': return 2;
      case 'swipe_left': return 3;
      case 'swipe_right': return 4;
      case 'depth_in': return 5;
      case 'depth_out': return 6;
      default: return 0;
    }
  }

  const outer = isOuter(node);
  const face = faceOf(node);

  // Depth transitions (shell)
  if (action === 'depth_out') {
    // Optional collapse: zoom out from top -> home
    if (!outer && face === 5) return 0;
    return outer ? 0 : toOuter(face);
  }

  if (action === 'depth_in') {
    // Optional collapse: zoom in from bottom -> home
    if (!outer && face === 6) return 0;
    return outer ? toInner(face) : node;
  }

  // Swipes (local adjacency)
  let dir: 'U' | 'D' | 'L' | 'R' | null = null;
  if (action === 'swipe_up') dir = 'U';
  if (action === 'swipe_down') dir = 'D';
  if (action === 'swipe_left') dir = 'L';
  if (action === 'swipe_right') dir = 'R';

  if (!dir) return node;

  const nextFace = ADJ[face][dir];
  return outer ? toOuter(nextFace) : (nextFace as Node);
}

/**
 * Pure reducer for the spec's state = { node, heading }.
 * Home resets heading context.
 */
export function reduceNav(prev: NavState, action: Action): NavState {
  const nextNode = tau(prev.node, action);
  if (nextNode === 0) return { node: 0, heading: null };

  const h = actionToHeading(action);
  // For "no-op" actions (e.g., depth_in on inner non-bottom), keep heading stable.
  return { node: nextNode, heading: h ?? prev.heading };
}

// Safe defaults
export const DEFAULT_NAV_STATE: NavState = { node: 0, heading: null };
