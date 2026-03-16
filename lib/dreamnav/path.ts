import type { Action, Node } from '@/lib/dreamnav/delta';
import { tau } from '@/lib/dreamnav/delta';

const ACTIONS: Action[] = [
  'swipe_left',
  'swipe_right',
  'swipe_up',
  'swipe_down',
  'zoom_in',
  'zoom_out',
  'home',
];

type Step = { node: Node; via: Action | null; prev: Node | null };

/**
 * Find a short deterministic action sequence using τ only.
 * Graph is tiny, so BFS is fine.
 */
export function findTauPath(start: Node, goal: Node): Action[] {
  if (start === goal) return [];

  const q: Node[] = [start];
  const seen = new Map<Node, Step>();
  seen.set(start, { node: start, via: null, prev: null });

  while (q.length) {
    const n = q.shift() as Node;
    for (const a of ACTIONS) {
      const next = tau(n, a);
      if (seen.has(next)) continue;
      seen.set(next, { node: next, via: a, prev: n });
      if (next === goal) {
        const out: Action[] = [];
        let cur: Node | null = goal;
        while (cur && cur !== start) {
          const s = seen.get(cur);
          if (!s || !s.via || s.prev == null) break;
          out.push(s.via);
          cur = s.prev;
        }
        return out.reverse();
      }
      q.push(next);
    }
  }

  // Unreachable should never happen given our connected graph.
  return [];
}

export async function dispatchTauPath(
  dispatch: (a: Action) => void,
  actions: Action[],
  opts?: { stepMs?: number }
): Promise<void> {
  const stepMs = opts?.stepMs ?? 140;
  for (const a of actions) {
    dispatch(a);
     
    await new Promise((r) => setTimeout(r, stepMs));
  }
}
