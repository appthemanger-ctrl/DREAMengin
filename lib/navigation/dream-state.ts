export type DreamNode = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '1b' | '2b' | '3b' | '4b' | '5b' | '6b';

export type Axis = 'x' | 'y' | 'z';
export type Depth = 'inner' | 'outer';

export type MoveDirection = 'forward' | 'backward' | 'left' | 'right' | 'zoomIn' | 'zoomOut';

export interface DreamState {
  node: DreamNode;
  axis: Axis;
  depth: Depth;
  zoomLevel: number;
  cameraPosition: { x: number; y: number; z: number };
}

const DIRECTION_TO_BASE: Record<MoveDirection, Exclude<DreamNode, '0' | `${number}b`>> = {
  forward: '1',
  backward: '2',
  left: '3',
  right: '4',
  zoomIn: '5',
  zoomOut: '6',
};

const OPPOSITE_BASE: Record<string, string> = {
  '1': '2',
  '2': '1',
  '3': '4',
  '4': '3',
  '5': '6',
  '6': '5',
};

const AXIS_BY_BASE: Record<string, Axis> = {
  '1': 'y',
  '2': 'y',
  '3': 'x',
  '4': 'x',
  '5': 'z',
  '6': 'z',
};

const CAMERA_BY_NODE: Record<DreamNode, { x: number; y: number; z: number }> = {
  '0': { x: 0, y: 0, z: 0 },
  '1': { x: 0, y: 1, z: 0 },
  '2': { x: 0, y: -1, z: 0 },
  '3': { x: -1, y: 0, z: 0 },
  '4': { x: 1, y: 0, z: 0 },
  '5': { x: 0, y: 0, z: 1 },
  '6': { x: 0, y: 0, z: -1 },
  '1b': { x: 0, y: 2, z: 0 },
  '2b': { x: 0, y: -2, z: 0 },
  '3b': { x: -2, y: 0, z: 0 },
  '4b': { x: 2, y: 0, z: 0 },
  '5b': { x: 0, y: 0, z: 2 },
  '6b': { x: 0, y: 0, z: -2 },
};

function toBaseNode(node: DreamNode): string {
  return node.endsWith('b') ? node[0] : node;
}

function isOuter(node: DreamNode): boolean {
  return node.endsWith('b');
}

function computeState(nextNode: DreamNode): DreamState {
  const base = nextNode === '0' ? '1' : toBaseNode(nextNode);
  return {
    node: nextNode,
    axis: nextNode === '0' ? 'y' : AXIS_BY_BASE[base],
    depth: isOuter(nextNode) ? 'outer' : 'inner',
    zoomLevel: isOuter(nextNode) ? 2 : nextNode === '0' ? 1 : 1.5,
    cameraPosition: CAMERA_BY_NODE[nextNode],
  };
}

export function createInitialDreamState(): DreamState {
  return computeState('0');
}

export function returnHome(): DreamState {
  return computeState('0');
}

export function move(state: DreamState, direction: MoveDirection): DreamState {
  const targetBase = DIRECTION_TO_BASE[direction];

  if (state.node === '0') {
    return computeState(targetBase);
  }

  const currentBase = toBaseNode(state.node);
  const currentOuter = isOuter(state.node);

  if (currentBase === targetBase) {
    return computeState(currentOuter ? '0' : (`${currentBase}b` as DreamNode));
  }

  if (OPPOSITE_BASE[currentBase] === targetBase) {
    return computeState(currentOuter ? (currentBase as DreamNode) : '0');
  }

  // Cross-axis move from non-home must collapse inward first (no teleport).
  return computeState('0');
}

/** Z transition keeps Z context (example: 6b -> zoomIn -> 6). */
export function zoom(state: DreamState, direction: 'in' | 'out'): DreamState {
  return move(state, direction === 'in' ? 'zoomIn' : 'zoomOut');
}
