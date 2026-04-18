/**
 * lib/enginpipe/telemetry/events.ts
 *
 * Generic Engin telemetry event schema.
 *
 * Mirrors §4 ("Telemetry & Feedback Loop") of the catalog. Every Engin
 * (Game/Code/Music/Brand/Lab) emits the same six core event types so
 * the autonomous improvement loop can reason across domains. Engins
 * may include domain-specific keys inside `payload`.
 *
 * Server-safe: pure TypeScript, no React, no DOM.
 */

import { z } from 'zod';

/** The six canonical event types from §4. */
export const TelemetryEventTypeSchema = z.enum([
  'session_start',
  'milestone_reached',
  'error_encountered',
  'feature_used',
  'quality_metric',
  'user_feedback',
]);

export type TelemetryEventType = z.infer<typeof TelemetryEventTypeSchema>;

/**
 * A single telemetry event.
 *
 * Required:
 *   - artifact_id  — which artifact (cartridge / project / track / ...)
 *   - event_type   — one of the canonical types
 *
 * Optional:
 *   - user_id            — anonymised when absent
 *   - client_timestamp   — ISO-8601 string; defaults to now() at emit
 *   - payload            — free-form JSON object (domain-specific keys)
 */
export const TelemetryEventSchema = z.object({
  artifact_id: z.string().min(1),
  user_id: z.string().min(1).optional(),
  event_type: TelemetryEventTypeSchema,
  client_timestamp: z.string().datetime().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

/** Validate (and apply defaults to) a telemetry event. Throws on failure. */
export function parseTelemetryEvent(input: unknown): TelemetryEvent {
  return TelemetryEventSchema.parse(input);
}
