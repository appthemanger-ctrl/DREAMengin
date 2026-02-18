export type Node =
  | 0
  | 1 | 2 | 3 | 4 | 5 | 6
  | '1b' | '2b' | '3b' | '4b' | '5b' | '6b';

export type Action =
  | 'swipe_left'
  | 'swipe_right'
  | 'swipe_up'
  | 'swipe_down'
  | 'zoom_in'
  | 'zoom_out'
  | 'depth_in'
  | 'depth_out'
  | 'home';

export type Heading = 'L' | 'R' | 'U' | 'D' | 'IN' | 'OUT' | null;

export type NavState = {
  node: Node;
  heading: Heading;
};

const INNER_FROM_ACTION: Record<'swipe_up' | 'swipe_down' | 'swipe_left' | 'swipe_right' | 'zoom_in' | 'zoom_out', 1 | 2 | 3 | 4 | 5 | 6> = {
  swipe_up: 1,
  swipe_down: 2,
  swipe_left: 3,
  swipe_right: 4,
  zoom_in: 5,
  zoom_out: 6,
};

const OPPOSITE_ACTION: Record<'swipe_up' | 'swipe_down' | 'swipe_left' | 'swipe_right' | 'zoom_in' | 'zoom_out', 'swipe_up' | 'swipe_down' | 'swipe_left' | 'swipe_right' | 'zoom_in' | 'zoom_out'> = {
  swipe_up: 'swipe_down',
  swipe_down: 'swipe_up',
  swipe_left: 'swipe_right',
  swipe_right: 'swipe_left',
  zoom_in: 'zoom_out',
  zoom_out: 'zoom_in',
};

function normalizeAction(action: Action): Exclude<Action, 'depth_in' | 'depth_out'> {
  if (action === 'depth_in') return 'zoom_in';
  if (action === 'depth_out') return 'zoom_out';
  return action;
}

function isOuter(node: Node): node is '1b' | '2b' | '3b' | '4b' | '5b' | '6b' {
  return typeof node === 'string';
}

function getAxis(node: Exclude<Node, 0>): 1 | 2 | 3 | 4 | 5 | 6 {
  return typeof node === 'number' ? node : (Number(node[0]) as 1 | 2 | 3 | 4 | 5 | 6);
}

function toNode(axis: 1 | 2 | 3 | 4 | 5 | 6, outer: boolean): Node {
  return outer ? (`${axis}b` as Node) : axis;
}

function actionToHeading(action: Exclude<Action, 'depth_in' | 'depth_out'>): Heading {
  switch (action) {
    case 'swipe_left':
      return 'L';
    case 'swipe_right':
      return 'R';
    case 'swipe_up':
      return 'U';
    case 'swipe_down':
      return 'D';
    case 'zoom_in':
      return 'IN';
    case 'zoom_out':
      return 'OUT';
    default:
      return null;
  }
}

export function tau(node: Node, action: Action): Node {
  const normalized = normalizeAction(action);

  if (normalized === 'home') return 0;

  if (node === 0) {
    return INNER_FROM_ACTION[normalized];
  }

  const axis = getAxis(node);
  const outer = isOuter(node);
  const actionAxis = INNER_FROM_ACTION[normalized];

  if (actionAxis === axis) {
    if (!outer) return toNode(axis, true);
    return 0;
  }

  if (normalized === OPPOSITE_ACTION[axisToAction(axis)]) {
    return 0;
  }

  return toNode(actionAxis, outer);
}

function axisToAction(axis: 1 | 2 | 3 | 4 | 5 | 6): 'swipe_up' | 'swipe_down' | 'swipe_left' | 'swipe_right' | 'zoom_in' | 'zoom_out' {
  switch (axis) {
    case 1:
      return 'swipe_up';
    case 2:
      return 'swipe_down';
    case 3:
      return 'swipe_left';
    case 4:
      return 'swipe_right';
    case 5:
      return 'zoom_in';
    case 6:
      return 'zoom_out';
  }
}

export function transition(state: NavState, action: Action): NavState {
  const normalized = normalizeAction(action);
  const nextNode = tau(state.node, normalized);
  if (nextNode === 0) {
    return { node: 0, heading: null };
  }
  const nextHeading = actionToHeading(normalized);
  return {
    node: nextNode,
    heading: nextHeading ?? state.heading,
  };
}

export const DEFAULT_NAV_STATE: NavState = { node: 0, heading: null };
