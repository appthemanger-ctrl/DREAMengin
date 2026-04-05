/**
 * matchmover – Camera tracking and matchmoving data model.
 *
 * Inspired by Syntheyes and 3DEqualizer — the industry tools for
 * pinning animated objects to live-action camera moves.
 *
 * Provides:
 *   - TrackPoint  – a 2D feature point tracked across frames
 *   - CameraTrack – the full solved camera track for a shot
 *   - computeHomography – 4-point direct linear transform (DLT) for 2D
 *   - estimateCameraMotion – velocity/acceleration from track data
 *   - exportTrackCSV – export track data for handoff to compositing
 *   - trackSummary – human-readable solve summary
 */

/** A single 2D screen-space observation of a track point in one frame. */
export interface TrackSample {
  frame: number;
  /** Normalised screen-space coords (0–1 from top-left) */
  x: number;
  y: number;
  /** Confidence/residual of this sample (0–1, 1 = perfect) */
  confidence: number;
}

/** A named 2D track point with its samples across frames. */
export interface TrackPoint {
  id: string;
  name: string;
  samples: TrackSample[];
  /** True once the point is solved in 3D space */
  solved: boolean;
  /** 3D world position in cm, available after solving */
  worldPosition?: [number, number, number];
}

/** Per-frame camera extrinsics (position + orientation) derived from the solve. */
export interface CameraFrame {
  frame: number;
  /** Camera position in 3D world space (cm) */
  position: [number, number, number];
  /** Euler rotation (degrees) */
  rotation: [number, number, number];
  /** Field of view in degrees (horizontal) */
  fov: number;
}

/** Full camera track solve result for a shot. */
export interface CameraTrack {
  id: string;
  name: string;
  /** Image/video dimensions used for tracking */
  width: number;
  height: number;
  frameCount: number;
  fps: number;
  trackPoints: TrackPoint[];
  /** Per-frame solved camera data (empty until solved) */
  cameraFrames: CameraFrame[];
  /** Average reprojection error in pixels (lower is better) */
  solveError: number;
  /** Whether the solve has been completed */
  isSolved: boolean;
}

/** Velocity estimate for a track point between two frames. */
export interface MotionEstimate {
  pointId: string;
  frame: number;
  /** Velocity in normalised screen units per frame */
  velocity: [number, number];
  /** Acceleration in normalised screen units per frame² */
  acceleration: [number, number];
  speed: number;
}

/** A 3×3 homography matrix as a flat 9-element array (row-major). */
export type Homography = [
  number, number, number,
  number, number, number,
  number, number, number,
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new empty CameraTrack for a shot.
 */
export function createTrack(
  name: string,
  width: number,
  height: number,
  frameCount: number,
  fps = 24
): CameraTrack {
  return {
    id: `track_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    width,
    height,
    frameCount,
    fps,
    trackPoints: [],
    cameraFrames: [],
    solveError: 0,
    isSolved: false,
  };
}

/**
 * Add a track point to a CameraTrack.
 */
export function addTrackPoint(
  track: CameraTrack,
  name: string,
  initialSamples: TrackSample[] = []
): CameraTrack {
  const point: TrackPoint = {
    id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    samples: initialSamples,
    solved: false,
  };
  return { ...track, trackPoints: [...track.trackPoints, point] };
}

/**
 * Add a sample observation to an existing track point.
 */
export function addSample(
  track: CameraTrack,
  pointId: string,
  sample: TrackSample
): CameraTrack {
  const points = track.trackPoints.map(p =>
    p.id === pointId
      ? { ...p, samples: [...p.samples, sample].sort((a, b) => a.frame - b.frame) }
      : p
  );
  return { ...track, trackPoints: points };
}

/**
 * Compute a 2D planar homography from 4 point correspondences.
 *
 * Implements the Direct Linear Transform (DLT) algorithm.
 * src[i] and dst[i] are [x, y] normalised coordinates (0–1).
 *
 * Returns a 3×3 homography matrix H such that dst ≈ H * src (in homogeneous coords).
 *
 * Requires exactly 4 point pairs.
 */
export function computeHomography(
  src: [[number, number], [number, number], [number, number], [number, number]],
  dst: [[number, number], [number, number], [number, number], [number, number]]
): Homography {
  // Build the 8×9 DLT matrix A
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [sx, sy] = src[i];
    const [dx, dy] = dst[i];
    A.push([-sx, -sy, -1,   0,   0,  0, dx * sx, dx * sy, dx]);
    A.push([  0,   0,  0, -sx, -sy, -1, dy * sx, dy * sy, dy]);
  }

  // Solve using a simplified SVD via power iteration (Jacobi method approximation)
  // For production use a full SVD — here we use a closed-form 4-point solution.
  const h = dlt4PointSolve(src, dst);
  return h;
}

/**
 * Estimate per-frame velocity and acceleration for each track point.
 */
export function estimateCameraMotion(track: CameraTrack): MotionEstimate[] {
  const estimates: MotionEstimate[] = [];

  for (const pt of track.trackPoints) {
    const sorted = [...pt.samples].sort((a, b) => a.frame - b.frame);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      const dt = cur.frame - prev.frame || 1;
      const vx = (cur.x - prev.x) / dt;
      const vy = (cur.y - prev.y) / dt;

      let ax = 0, ay = 0;
      if (i >= 2) {
        const pp = sorted[i - 2];
        const pvx = (prev.x - pp.x) / (prev.frame - pp.frame || 1);
        const pvy = (prev.y - pp.y) / (prev.frame - pp.frame || 1);
        ax = (vx - pvx) / dt;
        ay = (vy - pvy) / dt;
      }

      estimates.push({
        pointId: pt.id,
        frame: cur.frame,
        velocity: [vx, vy],
        acceleration: [ax, ay],
        speed: Math.sqrt(vx * vx + vy * vy),
      });
    }
  }

  return estimates;
}

/**
 * Export all track point samples as CSV text.
 *
 * Format: pointName,frame,x,y,confidence
 */
export function exportTrackCSV(track: CameraTrack): string {
  const rows = ['pointName,frame,x,y,confidence'];
  for (const pt of track.trackPoints) {
    for (const s of pt.samples) {
      rows.push(`${pt.name},${s.frame},${s.x.toFixed(6)},${s.y.toFixed(6)},${s.confidence.toFixed(4)}`);
    }
  }
  return rows.join('\n');
}

/**
 * Return a human-readable solve summary.
 */
export function trackSummary(track: CameraTrack): string {
  const totalSamples = track.trackPoints.reduce((acc, p) => acc + p.samples.length, 0);
  const solved = track.trackPoints.filter(p => p.solved).length;
  const status = track.isSolved
    ? `Solved (error: ${track.solveError.toFixed(3)} px)`
    : 'Unsolved';
  return `"${track.name}" — ${track.trackPoints.length} points, ${totalSamples} samples, ${solved} solved — ${status}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: closed-form 4-point DLT homography
// ─────────────────────────────────────────────────────────────────────────────

function dlt4PointSolve(
  src: [[number, number], [number, number], [number, number], [number, number]],
  dst: [[number, number], [number, number], [number, number], [number, number]]
): Homography {
  // Normalise source and destination points for numerical stability
  const [sOff, sScale] = normalisePoints(src);
  const [dOff, dScale] = normalisePoints(dst);

  const sn = src.map(([x, y]) => [(x - sOff[0]) / sScale, (y - sOff[1]) / sScale]) as typeof src;
  const dn = dst.map(([x, y]) => [(x - dOff[0]) / dScale, (y - dOff[1]) / dScale]) as typeof dst;

  // Build 8×9 matrix
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [sx, sy] = sn[i];
    const [dx, dy] = dn[i];
    A.push([-sx, -sy, -1,   0,   0,  0, dx * sx, dx * sy, dx]);
    A.push([  0,   0,  0, -sx, -sy, -1, dy * sx, dy * sy, dy]);
  }

  // Solve A*h=0 via Gaussian elimination (smallest singular vector approximation)
  const h = solveHomogeneousLS(A);
  const H: number[][] = [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], h[8]]];

  // Denormalise: H_out = Td_inv * H * Ts
  const Ts = normMatrix(sOff, sScale);
  const TdInv = denormMatrix(dOff, dScale);
  const H2 = mat3Mul(mat3Mul(TdInv, H), Ts);
  const scale = H2[2][2] || 1;
  return [
    H2[0][0] / scale, H2[0][1] / scale, H2[0][2] / scale,
    H2[1][0] / scale, H2[1][1] / scale, H2[1][2] / scale,
    H2[2][0] / scale, H2[2][1] / scale, H2[2][2] / scale,
  ];
}

function normalisePoints(pts: [number, number][]): [[number, number], number] {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const avgDist = pts.reduce((s, p) => s + Math.sqrt((p[0] - cx) ** 2 + (p[1] - cy) ** 2), 0) / pts.length;
  const scale = avgDist > 0 ? Math.SQRT2 / avgDist : 1;
  return [[cx, cy], scale];
}

function normMatrix(off: [number, number], scale: number): number[][] {
  return [
    [scale, 0, -scale * off[0]],
    [0, scale, -scale * off[1]],
    [0, 0, 1],
  ];
}

function denormMatrix(off: [number, number], scale: number): number[][] {
  return [
    [1 / scale, 0, off[0]],
    [0, 1 / scale, off[1]],
    [0, 0, 1],
  ];
}

function mat3Mul(A: number[][], B: number[][]): number[][] {
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      for (let k = 0; k < 3; k++)
        C[r][c] += A[r][k] * B[k][c];
  return C;
}

/** Solve A*h ≈ 0 using Gaussian elimination with partial pivoting. */
function solveHomogeneousLS(A: number[][]): number[] {
  const m = A.length;      // 8
  const n = A[0].length;   // 9
  const M = A.map(r => [...r]);

  // Gaussian elimination
  let pivotCol = 0;
  for (let row = 0; row < m && pivotCol < n - 1; row++, pivotCol++) {
    // Find pivot
    let maxRow = row;
    let maxVal = Math.abs(M[row][pivotCol]);
    for (let r = row + 1; r < m; r++) {
      if (Math.abs(M[r][pivotCol]) > maxVal) {
        maxVal = Math.abs(M[r][pivotCol]);
        maxRow = r;
      }
    }
    [M[row], M[maxRow]] = [M[maxRow], M[row]];
    if (Math.abs(M[row][pivotCol]) < 1e-12) { row--; continue; }

    const pivot = M[row][pivotCol];
    for (let c = pivotCol; c < n; c++) M[row][c] /= pivot;
    for (let r = 0; r < m; r++) {
      if (r === row) continue;
      const factor = M[r][pivotCol];
      for (let c = pivotCol; c < n; c++) M[r][c] -= factor * M[row][c];
    }
  }

  // Last column of M (h[8] = 1 by convention)
  const h = new Array(n).fill(0);
  h[n - 1] = 1;
  for (let row = m - 1; row >= 0; row--) {
    let pivotC = -1;
    for (let c = 0; c < n - 1; c++) {
      if (Math.abs(M[row][c]) > 1e-12) { pivotC = c; break; }
    }
    if (pivotC < 0) continue;
    let sum = M[row][n - 1];
    for (let c = pivotC + 1; c < n - 1; c++) sum -= M[row][c] * h[c];
    h[pivotC] = sum;
  }
  return h;
}
