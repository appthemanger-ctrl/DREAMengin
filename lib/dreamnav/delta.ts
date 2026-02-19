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
  | 'zoom_in'
  | 'zoom_out'
  | 'go_back'
  | 'home';

export type Heading = 'L' | 'R' | 'U' | 'D' | 'IN' | 'OUT' | null;

export type NavState = {
  node: Node;
  heading: Heading;
  lastNode?: Node | null;
  backStack?: Node[];
};

const INNER_FROM_ACTION: Record<'swipe_up' | 'swipe_down' | 'swipe_left' | 'swipe_right' | 'depth_in' | 'depth_out', 1 | 2 | 3 | 4 | 5 | 6> = {
  swipe_up: 1,
  swipe_down: 2,
  swipe_left: 3,
  swipe_right: 4,
  depth_in: 5,
  depth_out: 6,
};

const normalize = (action: Action): Action => action === 'zoom_in' ? 'depth_in' : action === 'zoom_out' ? 'depth_out' : action;

function actionToHeading(action: Action): Heading {
  const n = normalize(action);
  if (n === 'swipe_left') return 'L';
  if (n === 'swipe_right') return 'R';
  if (n === 'swipe_up') return 'U';
  if (n === 'swipe_down') return 'D';
  if (n === 'depth_in') return 'IN';
  if (n === 'depth_out') return 'OUT';
  return null;
}

function isOuter(node: Node): node is '1b' | '2b' | '3b' | '4b' | '5b' | '6b' {
  return typeof node === 'string';
}

function getAxis(node: Exclude<Node, 0>): 1 | 2 | 3 | 4 | 5 | 6 {
  return typeof node === 'number' ? node : Number(node[0]) as 1 | 2 | 3 | 4 | 5 | 6;
}

function toNode(axis: 1 | 2 | 3 | 4 | 5 | 6, outer = false): Node {
  return outer ? `${axis}b` as Node : axis;
}

export function tau(node: Node, action: Action): Node {
  const nAction = normalize(action);
  if (nAction === 'home' || nAction === 'go_back') return node;

  if (node === 0) return INNER_FROM_ACTION[nAction as keyof typeof INNER_FROM_ACTION];

  const axis = getAxis(node);
  const outer = isOuter(node);
  const opposite: Record<number, Action> = { 1: 'swipe_down', 2: 'swipe_up', 3: 'swipe_right', 4: 'swipe_left', 5: 'depth_out', 6: 'depth_in' };

  if (!outer && nAction === opposite[axis]) return 0;
  if (outer && nAction === opposite[axis]) return axis === 5 || axis === 6 ? 0 : toNode(axis, false);

  const incomingAxis = INNER_FROM_ACTION[nAction as keyof typeof INNER_FROM_ACTION];
  if (incomingAxis === axis) return outer ? 0 : toNode(axis, true);
  if (!outer && axis === 6 && nAction === 'depth_in') return 0;
  if (!outer && axis === 5 && nAction === 'depth_out') return 0;

  return toNode(incomingAxis, outer);
}

export function transition(state: NavState, action: Action): NavState {
  const nAction = normalize(action);
  const hasHistory = Object.prototype.hasOwnProperty.call(state, 'lastNode') || Object.prototype.hasOwnProperty.call(state, 'backStack');
  const backStack = state.backStack ?? [];

  if (nAction === 'home') {
    return hasHistory ? { ...state, node: 0, heading: null, lastNode: null, backStack: [] } : { node: 0, heading: null };
  }

  if (nAction === 'go_back') {
    if (state.node === 0 || backStack.length === 0) return state;
    const next = backStack[backStack.length - 1];
    const rest = backStack.slice(0, -1);
    return hasHistory ? { ...state, node: next, heading: null, lastNode: rest[rest.length - 1] ?? null, backStack: rest } : { node: next, heading: null };
  }

  const nextNode = tau(state.node, nAction);

  if (!hasHistory) return { node: nextNode, heading: nextNode === 0 ? null : actionToHeading(nAction) };

  const nextStack = nextNode === 0 ? [] : state.node === 0 ? [nextNode] : [...backStack, nextNode];
  return {
    ...state,
    node: nextNode,
    heading: nextNode === 0 ? null : actionToHeading(nAction),
    lastNode: nextNode === 0 ? null : state.node === 0 ? nextNode : state.node,
    backStack: nextStack,
  };
}

export const DEFAULT_NAV_STATE: NavState = { node: 0, heading: null, lastNode: null, backStack: [] };

export function reduceNav(prev: NavState, action: Action): NavState {
  return transition(prev, action);
}
