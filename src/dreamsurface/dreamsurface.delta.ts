// dreamsurface.delta — delta computation utilities
// Bridges state transitions between dream.* and engin.core.*.

export interface StateDelta<T> {
  previous: T;
  next: T;
  changedKeys: (keyof T)[];
}

export function computeDelta<T extends object>(prev: T, next: T): StateDelta<T> {
  const changedKeys = (Object.keys(next) as (keyof T)[]).filter(
    (key) => prev[key] !== next[key]
  );
  return { previous: prev, next, changedKeys };
}

export function mergeDelta<T>(base: T, delta: Partial<T>): T {
  return { ...base, ...delta };
}
