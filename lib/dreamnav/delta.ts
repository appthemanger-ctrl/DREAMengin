export type Node =
  | 0
  | 1 | 2 | 3 | 4 | 5 | 6
  | '1b' | '2b' | '3b' | '4b' | '5b' | '6b';

export type Dir = 'U' | 'D' | 'L' | 'R' | 'IN' | 'OUT';

// DREAMengin v3 — Full deterministic direction map (all moves defined)
// Direct transcription of the FULL δ table you provided.
export const DELTA: Record<Node, Record<Dir, Node>> = {
  0:   { U: 1,   D: 2,   L: 3,   R: 4,   IN: 5,   OUT: 6 },

  1:   { U: '1b', D: 0,   L: 3,   R: 4,   IN: 5,   OUT: 6 },
  2:   { U: 0,   D: '2b', L: 3,   R: 4,   IN: 5,   OUT: 6 },
  3:   { U: 1,   D: 2,   L: '3b', R: 0,   IN: 5,   OUT: 6 },
  4:   { U: 1,   D: 2,   L: 0,   R: '4b', IN: 5,   OUT: 6 },
  5:   { U: 1,   D: 2,   L: 3,   R: 4,   IN: '5b', OUT: 0 },
  6:   { U: 1,   D: 2,   L: 3,   R: 4,   IN: 0,   OUT: '6b' },

  '1b': { U: 0,   D: 1,   L: 3,   R: 4,   IN: 5,   OUT: 6 },
  '2b': { U: 2,   D: 0,   L: 3,   R: 4,   IN: 5,   OUT: 6 },
  '3b': { U: 1,   D: 2,   L: 0,   R: 3,   IN: 5,   OUT: 6 },
  '4b': { U: 1,   D: 2,   L: 4,   R: 0,   IN: 5,   OUT: 6 },
  '5b': { U: 1,   D: 2,   L: 3,   R: 4,   IN: 0,   OUT: 5 },
  '6b': { U: 1,   D: 2,   L: 3,   R: 4,   IN: 6,   OUT: 0 },
};

export function delta(state: Node, dir: Dir): Node {
  return DELTA[state][dir];
}

export const opp: Record<Dir, Dir> = {
  U: 'D',
  D: 'U',
  L: 'R',
  R: 'L',
  IN: 'OUT',
  OUT: 'IN',
};
