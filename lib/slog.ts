/**
 * slog — Symmetric Log Transform Utility
 *
 * slog(x) = sign(x) · ln(1 + |x|)
 *
 * Properties:
 *  - Compresses large values while preserving sign and zero
 *  - Differentiable everywhere (derivative = 1/(1+|x|))
 *  - Used across DREAMengin for: deviation compression, velocity smoothing,
 *    engagement metric scaling, and torridity-rank normalisation.
 */

/**
 * slog(x) = Math.sign(x) * Math.log1p(Math.abs(x))
 */
export function slog(x: number): number {
  return Math.sign(x) * Math.log1p(Math.abs(x));
}

/**
 * Inverse of slog.
 * slogInv(y) = Math.sign(y) * (Math.exp(Math.abs(y)) - 1)
 */
export function slogInv(y: number): number {
  return Math.sign(y) * (Math.exp(Math.abs(y)) - 1);
}

/**
 * Apply slog element-wise to an array.
 */
export function slogArray(xs: number[]): number[] {
  return xs.map(slog);
}

/**
 * slog-transform a deviation series, then compute its mean.
 */
export function slogMean(xs: number[]): number {
  if (xs.length === 0) return 0;
  const transformed = slogArray(xs);
  return transformed.reduce((a, b) => a + b, 0) / transformed.length;
}

/**
 * slog-transform a deviation series, then compute its variance.
 */
export function slogVariance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const transformed = slogArray(xs);
  const mean = transformed.reduce((a, b) => a + b, 0) / transformed.length;
  const squaredDiffs = transformed.map((v) => (v - mean) ** 2);
  return squaredDiffs.reduce((a, b) => a + b, 0) / (transformed.length - 1);
}

/**
 * Shannon entropy of a set of values after slog-transforming and
 * normalising into a probability distribution.
 *
 * Returns a value in [0, log(n)].  Divide by log(n) for [0,1].
 */
export function slogEntropy(xs: number[]): number {
  if (xs.length === 0) return 0;
  const transformed = slogArray(xs).map(Math.abs);
  const total = transformed.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const probs = transformed.map((v) => v / total);
  return -probs.reduce((acc, p) => (p > 0 ? acc + p * Math.log(p) : acc), 0);
}
