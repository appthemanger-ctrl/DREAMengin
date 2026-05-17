/**
 * lib/enginpipe/telemetry/client.ts
 *
 * Thin, artifact-agnostic wrapper that writes generic Engin Pipe
 * telemetry events into the existing Supabase `gameengin_telemetry`
 * table. The table schema (cartridge_id, event_type, payload, ...)
 * already matches the generic event shape, so no migration is needed
 * to start sharing it across Engins.
 *
 * Failure mode: the client never throws. Errors are returned in the
 * result object so callers can decide whether to log or retry.
 */

import {
  parseTelemetryEvent,
  type TelemetryEvent,
} from './events';

/** Minimal Supabase client shape we depend on. */
export interface TelemetrySupabaseClient {
  from(table: string): {
    insert(rows: unknown): Promise<{ error: unknown | null }>;
  };
}

export interface TelemetryClientOptions {
  /** Supabase client (browser or service role). */
  supabase: TelemetrySupabaseClient;
  /**
   * Override the destination table. Defaults to `gameengin_telemetry`,
   * which is the existing hypertable created by the GameEngin migration
   * and is the shared substrate for all Engins.
   */
  table?: string;
}

export interface TelemetryRecordResult {
  ok: boolean;
  error?: unknown;
}

const DEFAULT_TABLE = 'gameengin_telemetry';

/**
 * Create a telemetry client bound to a Supabase instance.
 */
export function createTelemetryClient(opts: TelemetryClientOptions {
  const table = opts.table ?? DEFAULT_TABLE;

  return {
    /**
     * Record a single Engin telemetry event.
     *
     * Maps the generic shape onto the `gameengin_telemetry` columns:
     *   artifact_id      → cartridge_id
     *   user_id          → player_id
     *   event_type       → event_type
     *   payload          → payload (jsonb)
     *   client_timestamp → client_timestamp
     */
    async record(event: TelemetryEvent): Promise<TelemetryRecordResult> {
      let validated: TelemetryEvent;
      try {
        validated = parseTelemetryEvent(event);
      } catch (error) {
        return { ok: false, error };
      }

      const row: Record<string, unknown> = {
        cartridge_id: validated.artifact_id,
        event_type: validated.event_type,
        payload: validated.payload,
      };
      if (validated.user_id !== undefined) row.player_id = validated.user_id;
      if (validated.client_timestamp !== undefined) {
        row.client_timestamp = validated.client_timestamp;
      }

      try {
        const { error } = await opts.supabase.from(table).insert([row]);
        if (error) return { ok: false, error };
        return { ok: true };
      } catch (error) {
        return { ok: false, error };
      }
    },
  };
}

export type TelemetryClient = ReturnType<typeof createTelemetryClient>;
