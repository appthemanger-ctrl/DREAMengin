/**
 * tests/enginpipe/telemetry.test.ts
 *
 * Unit tests for the generic Engin telemetry event schema and Supabase
 * client wrapper. The client uses a hand-rolled fake Supabase that
 * records inserted rows so we don't need a live database.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  parseTelemetryEvent,
  TelemetryEventTypeSchema,
} from '@/lib/enginpipe/telemetry/events';
import {
  createTelemetryClient,
  type TelemetrySupabaseClient,
} from '@/lib/enginpipe/telemetry/client';

function makeFakeSupabase(insertImpl?: (rows: unknown) => { error: unknown | null }) {
  const calls: { table: string; rows: unknown }[] = [];
  const client: TelemetrySupabaseClient = {
    from(table: string) {
      return {
        async insert(rows: unknown) {
          calls.push({ table, rows });
          return insertImpl ? insertImpl(rows) : { error: null };
        },
      };
    },
  };
  return { client, calls };
}

describe('enginpipe / telemetry events', () => {
  it('defines exactly the six canonical event types', () => {
    expect(TelemetryEventTypeSchema.options.sort()).toEqual([
      'error_encountered',
      'feature_used',
      'milestone_reached',
      'quality_metric',
      'session_start',
      'user_feedback',
    ]);
  });

  it('parses a minimal event and applies default payload', () => {
    const ev = parseTelemetryEvent({
      artifact_id: 'demo',
      event_type: 'session_start',
    });
    expect(ev.payload).toEqual({});
    expect(ev.user_id).toBeUndefined();
  });

  it('rejects unknown event_type', () => {
    expect(() =>
      parseTelemetryEvent({
        artifact_id: 'demo',
        event_type: 'unknown_type',
      }),
    ).toThrow();
  });
});

describe('enginpipe / telemetry client', () => {
  it('writes to gameengin_telemetry by default and maps generic keys', async () => {
    const { client, calls } = makeFakeSupabase();
    const tele = createTelemetryClient({ supabase: client });

    const result = await tele.record({
      artifact_id: 'demo-cart',
      user_id: 'user-1',
      event_type: 'feature_used',
      payload: { feature_id: 'export', success: true },
    });

    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe('gameengin_telemetry');
    const row = (calls[0].rows as Array<Record<string, unknown>>)[0];
    expect(row.cartridge_id).toBe('demo-cart');
    expect(row.player_id).toBe('user-1');
    expect(row.event_type).toBe('feature_used');
    expect(row.payload).toEqual({ feature_id: 'export', success: true });
  });

  it('omits player_id when no user_id is supplied', async () => {
    const { client, calls } = makeFakeSupabase();
    const tele = createTelemetryClient({ supabase: client });

    const result = await tele.record({
      artifact_id: 'demo-cart',
      event_type: 'session_start',
    });

    expect(result.ok).toBe(true);
    const row = (calls[0].rows as Array<Record<string, unknown>>)[0];
    expect('player_id' in row).toBe(false);
  });

  it('returns ok:false on validation failure without throwing', async () => {
    const { client, calls } = makeFakeSupabase();
    const tele = createTelemetryClient({ supabase: client });

    const result = await tele.record({
      // missing required artifact_id
      event_type: 'session_start',
    } as never);

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
    expect(calls).toHaveLength(0);
  });

  it('surfaces Supabase errors without throwing', async () => {
    const { client } = makeFakeSupabase(() => ({ error: { message: 'rls denied' } }));
    const tele = createTelemetryClient({ supabase: client });

    const result = await tele.record({
      artifact_id: 'demo-cart',
      event_type: 'error_encountered',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toEqual({ message: 'rls denied' });
  });

  it('honors a custom destination table', async () => {
    const { client, calls } = makeFakeSupabase();
    const tele = createTelemetryClient({
      supabase: client,
      table: 'codeengin_telemetry',
    });

    await tele.record({
      artifact_id: 'demo-project',
      event_type: 'milestone_reached',
    });

    expect(calls[0].table).toBe('codeengin_telemetry');
  });

  it('catches synchronous throws from Supabase clients', async () => {
    const client: TelemetrySupabaseClient = {
      from: vi.fn(() => {
        throw new Error('boom');
      }) as never,
    };
    const tele = createTelemetryClient({ supabase: client });
    const result = await tele.record({
      artifact_id: 'demo-cart',
      event_type: 'session_start',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});
