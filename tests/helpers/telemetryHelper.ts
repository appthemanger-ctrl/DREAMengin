// tests/helpers/telemetryHelper.ts
// Helper to test telemetry sanitisation (req 96)

const FORBIDDEN_KEYS = new Set([
  'token', 'access_token', 'refresh_token', 'secret', 'password',
  'api_key', 'apikey', 'authorization', 'client_secret',
]);

export function sanitizeTelemetry(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (FORBIDDEN_KEYS.has(k.toLowerCase())) continue;
    out[k] = v;
  }
  return out;
}
