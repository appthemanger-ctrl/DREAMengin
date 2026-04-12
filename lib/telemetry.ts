// lib/telemetry.ts
// Telemetry utility — logs events; never includes secrets or tokens (req 95-96)

export type TelemetryEvent =
  | 'connect_success'
  | 'connect_failure'
  | 'connect_oauth_start'
  | 'disconnect_success'
  | 'disconnect_failure'
  | 'add_widget'
  | 'add_slice'
  | 'dismiss_prompt'
  | 'widget_install_start'
  | 'widget_install_complete'
  | 'widget_data_error'
  | 'widget_data_retry'
  | 'placement_mode_enter'
  | 'placement_mode_exit'
  | 'placement_undo'
  | 'suggest_dismissed'
  | 'auto_lock'
  // ── Journey Trail events (logged via logJourneyDot() in lib/journey/journeyDots.ts) ──
  | 'journey_dot'
  | 'surface_first_entry'
  | 'engin_first_activated'
  | 'connector_linked'
  | 'content_first_created'
  | 'profile_first_projected'
  | 'first_follower'
  | 'follower_milestone'
  | 'runtime_first_entry';

// Fields that are never allowed in telemetry payloads (req 96)
const FORBIDDEN_KEYS = new Set([
  'token', 'access_token', 'refresh_token', 'secret', 'password',
  'api_key', 'apikey', 'authorization', 'client_secret',
]);

// ── Improvement 16: deep forbidden-key sanitization ──────────────────────────

/**
 * Recursively sanitize a payload object, removing any key at any depth that
 * matches the FORBIDDEN_KEYS list. Previously only top-level keys were
 * stripped, allowing secrets nested inside context objects to leak through.
 */
export function sanitize(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (FORBIDDEN_KEYS.has(k.toLowerCase())) continue;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = sanitize(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function track(event: TelemetryEvent, payload: Record<string, unknown> = {}): void {
  if (!shouldSample()) return;
  const safe = sanitize(payload);
  if (process.env.NODE_ENV !== 'test') {
    console.info('[telemetry]', event, safe);
  }
}

// ── Improvement 17: trackTimed ────────────────────────────────────────────────

/**
 * Wrap an async operation and automatically track its duration.
 * Emits the given event with `duration_ms` in the payload.
 * Re-throws any error from `fn` so callers can still handle it.
 */
export async function trackTimed<T>(
  event: TelemetryEvent,
  fn: () => Promise<T>,
  extraPayload: Record<string, unknown> = {},
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    track(event, { ...extraPayload, duration_ms: Date.now() - start, success: true });
    return result;
  } catch (err) {
    track(event, {
      ...extraPayload,
      duration_ms: Date.now() - start,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

// ── Improvement 18: trackBatch ────────────────────────────────────────────────

/**
 * Emit multiple telemetry events in one call.
 * Useful when several things happen atomically (e.g. page-load bootstrap).
 */
export function trackBatch(
  events: ReadonlyArray<{ event: TelemetryEvent; payload?: Record<string, unknown> }>,
): void {
  for (const { event, payload } of events) {
    track(event, payload ?? {});
  }
}

// ── Improvement 19: sampling rate ────────────────────────────────────────────

/**
 * Returns true when this event should be recorded, based on
 * `TELEMETRY_SAMPLE_RATE` (0–1). Default is 1 (record all events).
 * Set to 0.1 to record only 10% of events in high-traffic environments.
 */
function shouldSample(): boolean {
  const raw = typeof process !== 'undefined'
    ? process.env.TELEMETRY_SAMPLE_RATE
    : undefined;
  if (!raw) return true;
  const rate = parseFloat(raw);
  if (!isFinite(rate)) return true;
  return Math.random() < rate;
}

// ── Improvement 20: createTelemetryContext ────────────────────────────────────

export interface TelemetryContext {
  /** Track an event scoped to this context's default payload. */
  track(event: TelemetryEvent, extraPayload?: Record<string, unknown>): void;
  /** Time an async operation and emit the event with `duration_ms`. */
  trackTimed<T>(
    event: TelemetryEvent,
    fn: () => Promise<T>,
    extraPayload?: Record<string, unknown>,
  ): Promise<T>;
}

/**
 * Create a scoped telemetry context that merges `defaultPayload` into every
 * event it emits. Use this in components or services to avoid repeating
 * common dimensions like `{ subsystem: 'CodeEngin', userId: '...' }`.
 */
export function createTelemetryContext(
  defaultPayload: Record<string, unknown>,
): TelemetryContext {
  return {
    track(event, extraPayload = {}) {
      track(event, { ...defaultPayload, ...extraPayload });
    },
    trackTimed(event, fn, extraPayload = {}) {
      return trackTimed(event, fn, { ...defaultPayload, ...extraPayload });
    },
  };
}
