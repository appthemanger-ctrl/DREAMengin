/**
 * lib/bot-detection/swipe-physics.ts — §36 Swipe Physics Metrics
 *
 * Five physics-based metrics for discriminating human from bot swipes:
 *   1. perpendicularDeviation(path)          — per-swipe jitter
 *   2. crossSwipeSimilarity(paths)           — normalised cosine-like similarity
 *   3. coarseGrainInvariance(path)           — first-half vs second-half comparison
 *   4. deviationEntropy(path)                — normalised Shannon entropy
 *   5. velocityVarianceJerk(path,timestamps) — slog-transformed velocity stats
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PathPoint {
  x: number;
  y: number;
}

export type Path = PathPoint[];

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Natural log of (1 + |x|) * sign(x) — symmetric log for human-scale values. */
function slog(x: number): number {
  return Math.sign(x) * Math.log1p(Math.abs(x));
}

/** Fit a line through first and last point of a path. Returns {dx, dy, len}. */
function lineDirection(path: Path): { dx: number; dy: number; len: number } {
  const first = path[0];
  const last  = path[path.length - 1];
  const dx    = last.x - first.x;
  const dy    = last.y - first.y;
  const len   = Math.sqrt(dx * dx + dy * dy);
  return { dx, dy, len };
}

/** Signed perpendicular distance from point to line through p0→p1. */
function perpDist(p: PathPoint, p0: PathPoint, dx: number, dy: number, len: number): number {
  if (len < 1e-9) return Math.sqrt((p.x - p0.x) ** 2 + (p.y - p0.y) ** 2);
  // Cross product / length = perpendicular distance
  return Math.abs((p.x - p0.x) * dy - (p.y - p0.y) * dx) / len;
}

/** Normalise a vector to unit length. */
function normalise(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  if (norm < 1e-12) return v.map(() => 0);
  return v.map((x) => x / norm);
}

/** Dot product of two same-length vectors. */
function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) s += a[i] * b[i];
  return s;
}

/** Resample a path to exactly N equally-spaced points by linear interpolation. */
function resample(path: Path, n: number): Path {
  if (path.length <= 1) return Array(n).fill(path[0] ?? { x: 0, y: 0 }) as Path;
  const out: Path = [];
  const total = path.length - 1;
  for (let i = 0; i < n; i++) {
    const t   = (i / (n - 1)) * total;
    const lo  = Math.floor(t);
    const hi  = Math.min(lo + 1, total);
    const frac = t - lo;
    out.push({
      x: path[lo].x + (path[hi].x - path[lo].x) * frac,
      y: path[lo].y + (path[hi].y - path[lo].y) * frac,
    });
  }
  return out;
}

// ─── §36 Metric 1: perpendicularDeviation ────────────────────────────────────

/**
 * perpendicularDeviation(path)
 *
 * Returns the mean perpendicular deviation of all intermediate points
 * from the straight line defined by the first and last points.
 *
 * Human: > 1.5 px   Bot: < 0.8 px
 */
export function perpendicularDeviation(path: Path): number {
  if (path.length < 3) return 0;
  const { dx, dy, len } = lineDirection(path);
  const p0 = path[0];
  const inner = path.slice(1, -1);
  const deviations = inner.map((p) => perpDist(p, p0, dx, dy, len));
  return deviations.reduce((s, d) => s + d, 0) / deviations.length;
}

// ─── §36 Metric 2: crossSwipeSimilarity ──────────────────────────────────────

/**
 * crossSwipeSimilarity(paths)
 *
 * Compares the last ≤5 paths after resampling to a common length.
 * Returns a cosine-like similarity score in [0, 1].
 *
 * High similarity (> 0.95) is suspicious (bot).
 * Humans typically score < 0.85.
 */
export function crossSwipeSimilarity(paths: Path[]): number {
  const window = paths.slice(-5);
  if (window.length < 2) return 0;

  const N = 20; // resample length
  const vectors = window.map((p) => {
    const rs = resample(p, N);
    return normalise(rs.flatMap((pt) => [pt.x, pt.y]));
  });

  let totalSim = 0;
  let pairs    = 0;
  for (let i = 0; i < vectors.length - 1; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      totalSim += dot(vectors[i], vectors[j]);
      pairs++;
    }
  }
  return pairs > 0 ? Math.max(0, Math.min(1, totalSim / pairs)) : 0;
}

// ─── §36 Metric 3: coarseGrainInvariance ─────────────────────────────────────

/**
 * coarseGrainInvariance(path)
 *
 * Compares mean perpendicular deviation of the first half vs second half
 * of the path.  Bots tend to have near-zero difference; humans vary.
 *
 * Human: diff < 0.1   Bot: diff > 0.15
 */
export function coarseGrainInvariance(path: Path): number {
  if (path.length < 4) return 0;
  const mid   = Math.floor(path.length / 2);
  const first = path.slice(0, mid + 1);
  const second = path.slice(mid);

  return Math.abs(
    perpendicularDeviation(first) - perpendicularDeviation(second),
  );
}

// ─── §36 Metric 4: deviationEntropy ──────────────────────────────────────────

/**
 * deviationEntropy(path)
 *
 * Normalised Shannon entropy of the perpendicular-deviation distribution.
 * Bins the deviations into N_BINS buckets and computes entropy.
 *
 * Human: > 0.7   Bot: < 0.5
 */
export function deviationEntropy(path: Path): number {
  if (path.length < 3) return 0;

  const { dx, dy, len } = lineDirection(path);
  const p0   = path[0];
  const devs = path.slice(1, -1).map((p) => perpDist(p, p0, dx, dy, len));
  if (devs.length === 0) return 0;

  const N_BINS = 10;
  const maxDev = Math.max(...devs, 1e-6);
  const counts = new Array<number>(N_BINS).fill(0);
  for (const d of devs) {
    const bin = Math.min(N_BINS - 1, Math.floor((d / maxDev) * N_BINS));
    counts[bin]++;
  }

  const total = devs.length;
  let entropy = 0;
  for (const c of counts) {
    if (c > 0) {
      const p = c / total;
      entropy -= p * Math.log2(p);
    }
  }
  // Normalise by log2(N_BINS)
  return entropy / Math.log2(N_BINS);
}

// ─── §36 Metric 5: velocityVarianceJerk ──────────────────────────────────────

export interface VelocityStats {
  variance: number;
  jerk:     number;
}

/**
 * velocityVarianceJerk(path, timestamps)
 *
 * Computes slog-transformed variance of instantaneous velocity and
 * slog-transformed mean jerk (3rd derivative) of the path.
 *
 * Human: variance > 0.5, jerk > 0.3
 * Bot:   variance < 0.3, jerk ≈ 0
 */
export function velocityVarianceJerk(path: Path, timestamps: number[]): VelocityStats {
  const n = Math.min(path.length, timestamps.length);
  if (n < 2) return { variance: 0, jerk: 0 };

  // Instantaneous speeds
  const speeds: number[] = [];
  for (let i = 1; i < n; i++) {
    const dt = Math.max(timestamps[i] - timestamps[i - 1], 1);
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    speeds.push(Math.sqrt(dx * dx + dy * dy) / dt);
  }

  const mean = speeds.reduce((s, v) => s + v, 0) / speeds.length;
  const variance = speeds.reduce((s, v) => s + (v - mean) ** 2, 0) / speeds.length;

  // Jerk: 3rd derivative ≈ differences of accelerations
  const accels: number[] = [];
  for (let i = 1; i < speeds.length; i++) accels.push(speeds[i] - speeds[i - 1]);

  const jerks: number[] = [];
  for (let i = 1; i < accels.length; i++) jerks.push(Math.abs(accels[i] - accels[i - 1]));

  const meanJerk = jerks.length > 0
    ? jerks.reduce((s, j) => s + j, 0) / jerks.length
    : 0;

  return {
    variance: slog(variance),
    jerk:     slog(meanJerk),
  };
}
