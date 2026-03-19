// lib/telemetry.ts
// Telemetry utility — logs events; never includes secrets or tokens (req 95-96)

export type TelemetryEvent =
  | 'connect_success'
  | 'connect_failure'
  | 'disconnect_success'
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

function sanitize(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (FORBIDDEN_KEYS.has(k.toLowerCase())) continue;
    out[k] = v;
  }
  return out;
}

export function track(event: TelemetryEvent, payload: Record<string, unknown> = {}): void {
  const safe = sanitize(payload);
  // In production, replace console with your telemetry sink (Segment, PostHog, etc.)
  // We use console.info so it is visible in dev but filtered by severity in prod.
  if (process.env.NODE_ENV !== 'test') {
    console.info('[telemetry]', event, safe);
  }
}
