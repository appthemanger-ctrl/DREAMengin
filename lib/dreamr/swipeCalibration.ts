/**
 * lib/dreamr/swipeCalibration.ts
 *
 * Device-relative calibration pass for the Torridity swipe physics.
 *
 * On first meaningful interaction (or explicit re-calibration), run
 * calibrateDevice(samples) to compute a CalibrationProfile that scales
 * the hard-coded thresholds in torridityLedger to the actual jitter and
 * response characteristics of the current device.
 *
 * Addresses false positives on stylus, 120 Hz, and accessibility devices
 * where absolute constants (slopeMin/slopeMax/triggerThresholdPx) are
 * outside the device's natural operating range.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * A single warm-up sample collected during the calibration phase.
 * Pass 3–10 samples from the user's first few natural gestures.
 */
export interface CalibrationSample {
  /** Observed perpendicular deviation (px) from a known-human gesture. */
  observedDeviationPx: number;
  /** Total travel distance of that gesture in pixels. */
  travelPx: number;
  /** Duration of that gesture in milliseconds. */
  durationMs: number;
}

/**
 * Device-adjusted thresholds used by verifyHumanity and resolveSwipeRelease.
 * Values are safe to serialise and persist between sessions.
 */
export interface CalibrationProfile {
  /** Adjusted lower bound for the human beta-slope window. */
  slopeMin: number;
  /** Adjusted upper bound for the human beta-slope window. */
  slopeMax: number;
  /** Adjusted minimum swipe distance (px) to trigger a card change. */
  triggerThresholdPx: number;
  /** ISO 8601 timestamp of when this profile was last computed. Empty string = factory defaults. */
  calibratedAt: string;
}

// ─── Factory defaults (match TORRIDITY_LEDGER_CONFIG) ────────────────────────

const FACTORY_DEFAULTS: Readonly<CalibrationProfile> = {
  slopeMin: 0.6,
  slopeMax: 0.85,
  triggerThresholdPx: 55,
  calibratedAt: '',
};

// Module-level active profile, starts at factory defaults.
let activeProfile: CalibrationProfile = { ...FACTORY_DEFAULTS };

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute a device-specific CalibrationProfile from warm-up samples and
 * store it as the module-level active profile.
 *
 * Algorithm:
 *  1. Compute mean observed deviation across samples.
 *  2. Derive a scale factor (devScale) relative to the canonical 1.5 px human
 *     threshold — clamped to [0.5, 2.0] to prevent extreme outliers.
 *  3. Scale the slope window symmetrically around the factory centre (0.725),
 *     so high-jitter devices get a wider acceptance window and stylus/120 Hz
 *     devices get a narrower one.
 *  4. Scale the trigger threshold by the same devScale.
 *
 * @returns The newly computed and stored CalibrationProfile.
 */
export function calibrateDevice(samples: CalibrationSample[]): CalibrationProfile {
  if (samples.length === 0) return activeProfile;

  const meanDev =
    samples.reduce((sum, s) => sum + s.observedDeviationPx, 0) / samples.length;

  // Scale factor relative to the canonical 1.5 px human-jitter threshold.
  const devScale = Math.max(0.5, Math.min(2.0, meanDev / 1.5));

  // Scale the slope window symmetrically around the factory centre.
  const slopeCenter = (FACTORY_DEFAULTS.slopeMin + FACTORY_DEFAULTS.slopeMax) / 2;
  const halfWidth = (FACTORY_DEFAULTS.slopeMax - FACTORY_DEFAULTS.slopeMin) / 2;
  const scaledHalfWidth = halfWidth * devScale;
  const newMin = Math.max(0.1, slopeCenter - scaledHalfWidth);
  const newMax = Math.min(3.0, slopeCenter + scaledHalfWidth);

  // Trigger threshold scales with device jitter, clamped to a safe range.
  const rawThreshold = Math.round(FACTORY_DEFAULTS.triggerThresholdPx * devScale);

  activeProfile = {
    slopeMin: newMin,
    slopeMax: Math.max(newMin + 0.05, newMax), // always a non-degenerate window
    triggerThresholdPx: Math.max(20, Math.min(120, rawThreshold)),
    calibratedAt: new Date().toISOString(),
  };

  return activeProfile;
}

/** Return the currently active CalibrationProfile (starts at factory defaults). */
export function getActiveProfile(): CalibrationProfile {
  return activeProfile;
}

/**
 * Replace the active profile with a previously persisted one.
 * Call this on app start to restore a user's saved calibration.
 */
export function setActiveProfile(profile: CalibrationProfile): void {
  activeProfile = { ...profile };
}

/** Reset calibration back to factory defaults. */
export function resetCalibration(): void {
  activeProfile = { ...FACTORY_DEFAULTS };
}
