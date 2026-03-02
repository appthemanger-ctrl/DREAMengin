// tests/triad-events.test.ts
// Unit tests for the TRIAD AI PROTOCOL event schema and role guards.
// Docs: docs/AI_TRIAD_PROTOCOL.md

import { describe, it, expect } from 'vitest';
import {
  TriadEventSchema,
  TRIAD_PROTOCOL_VERSION,
  checkAgentPermission,
  requiresHumanConfirmation,
  BOOGIE_EXCLUSIVE_ACTIONS,
  IDARI_EXCLUSIVE_ACTIONS,
  EAMS_EXCLUSIVE_ACTIONS,
  PLATFORM_LIMITS,
  GLOBAL_IMPACT_ACTIONS,
} from '@/lib/ai/events';

// Use fixed UUIDs in module-level constants (consistent with existing tests)
const FIXED_EVENT_ID        = '123e4567-e89b-12d3-a456-426614174010';
const FIXED_CORRELATION_ID  = '123e4567-e89b-12d3-a456-426614174011';
const FIXED_USER_ID         = '123e4567-e89b-12d3-a456-426614174012';
const FIXED_DREAM_ID        = '123e4567-e89b-12d3-a456-426614174013';

// Shared valid event for schema tests
// IMPORTANT: payload must be {} at module level (Zod v4 eval-parser limitation;
// matches existing test patterns in boogieman.test.ts)
const validEvent = {
  event_id:        FIXED_EVENT_ID,
  correlation_id:  FIXED_CORRELATION_ID,
  timestamp:       '2026-03-02T10:00:00.000Z',
  actor:           'boogieman',
  target:          'dr_eams',
  type:            'ACTION_TAKEN',
  severity:        'HIGH',
  context_refs:    ['abc-123'],
  idempotency_key: 'test-idempotency-key',
  payload:         {},
};

// ──────────────────────────────────────────────────────────────────────────────
// TriadEventSchema validation
// ──────────────────────────────────────────────────────────────────────────────

describe('TriadEventSchema', () => {
  it('parses a valid triad event', () => {
    const result = TriadEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.event_id).toBe(validEvent.event_id);
      expect(result.data.protocol_version).toBe(TRIAD_PROTOCOL_VERSION);
    }
  });

  it('defaults simulation to false', () => {
    const result = TriadEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.simulation).toBe(false);
    }
  });

  it('accepts simulation=true', () => {
    const result = TriadEventSchema.safeParse({ ...validEvent, simulation: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.simulation).toBe(true);
    }
  });

  it('rejects event with invalid actor', () => {
    const result = TriadEventSchema.safeParse({ ...validEvent, actor: 'unknown_agent' });
    expect(result.success).toBe(false);
  });

  it('rejects event with invalid type', () => {
    const result = TriadEventSchema.safeParse({ ...validEvent, type: 'INVALID_TYPE' });
    expect(result.success).toBe(false);
  });

  it('rejects event with invalid severity', () => {
    const result = TriadEventSchema.safeParse({ ...validEvent, severity: 'EXTREME' });
    expect(result.success).toBe(false);
  });

  it('rejects event with invalid blast_radius', () => {
    const result = TriadEventSchema.safeParse({ ...validEvent, blast_radius: 'PLANETARY' });
    expect(result.success).toBe(false);
  });

  it('rejects event without required fields', () => {
    const { event_id: _removed, ...incomplete } = validEvent;
    const result = TriadEventSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('accepts all valid event types', () => {
    const validTypes = [
      'REQUEST_REVIEW', 'REQUEST_EXPLANATION', 'REQUEST_OPTIMIZATION',
      'INCIDENT_DETECTED', 'ACTION_TAKEN', 'SUGGESTION_PROPOSED',
      'SUGGESTION_APPROVED', 'SUGGESTION_REJECTED', 'STATUS_SNAPSHOT', 'APPEAL_RECEIVED',
    ];
    for (const type of validTypes) {
      const result = TriadEventSchema.safeParse({ ...validEvent, event_id: FIXED_EVENT_ID, type });
      expect(result.success, `Expected type ${type} to be valid`).toBe(true);
    }
  });

  it('accepts optional user_id and dream_id', () => {
    const withOptionals = {
      ...validEvent,
      event_id: FIXED_EVENT_ID,
      user_id: FIXED_USER_ID,
      dream_id: FIXED_DREAM_ID,
    };
    const result = TriadEventSchema.safeParse(withOptionals);
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID user_id', () => {
    const result = TriadEventSchema.safeParse({ ...validEvent, user_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// checkAgentPermission — role restraints (docs/AI_TRIAD_PROTOCOL.md §4)
// ──────────────────────────────────────────────────────────────────────────────

describe('checkAgentPermission — Boogie exclusive actions', () => {
  for (const action of BOOGIE_EXCLUSIVE_ACTIONS) {
    it(`allows boogieman to perform ${action}`, () => {
      const result = checkAgentPermission('boogieman', action);
      expect(result.allowed).toBe(true);
    });

    it(`denies dr_eams to perform ${action}`, () => {
      const result = checkAgentPermission('dr_eams', action);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it(`denies idari to perform ${action}`, () => {
      const result = checkAgentPermission('idari', action);
      expect(result.allowed).toBe(false);
    });
  }
});

describe('checkAgentPermission — IDARi exclusive actions', () => {
  for (const action of IDARI_EXCLUSIVE_ACTIONS) {
    it(`allows idari to perform ${action}`, () => {
      const result = checkAgentPermission('idari', action);
      expect(result.allowed).toBe(true);
    });

    it(`denies dr_eams to perform ${action}`, () => {
      const result = checkAgentPermission('dr_eams', action);
      expect(result.allowed).toBe(false);
    });

    it(`denies boogieman to perform ${action}`, () => {
      const result = checkAgentPermission('boogieman', action);
      expect(result.allowed).toBe(false);
    });
  }
});

describe('checkAgentPermission — Dr. Eams exclusive actions', () => {
  for (const action of EAMS_EXCLUSIVE_ACTIONS) {
    it(`allows dr_eams to perform ${action}`, () => {
      const result = checkAgentPermission('dr_eams', action);
      expect(result.allowed).toBe(true);
    });

    it(`denies idari to perform ${action}`, () => {
      const result = checkAgentPermission('idari', action);
      expect(result.allowed).toBe(false);
    });

    it(`denies boogieman to perform ${action}`, () => {
      const result = checkAgentPermission('boogieman', action);
      expect(result.allowed).toBe(false);
    });
  }
});

describe('checkAgentPermission — non-exclusive actions', () => {
  it('allows any action that is not in any exclusive list', () => {
    const result = checkAgentPermission('dr_eams', 'SOME_GENERIC_ACTION');
    expect(result.allowed).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// requiresHumanConfirmation — GLOBAL impact actions
// ──────────────────────────────────────────────────────────────────────────────

describe('requiresHumanConfirmation', () => {
  it('returns true for all GLOBAL_IMPACT_ACTIONS', () => {
    for (const action of GLOBAL_IMPACT_ACTIONS) {
      expect(requiresHumanConfirmation(action), `Expected ${action} to require human confirmation`).toBe(true);
    }
  });

  it('returns false for non-global actions', () => {
    expect(requiresHumanConfirmation('THROTTLE_SYSTEM')).toBe(false);
    expect(requiresHumanConfirmation('SEND_USER_MESSAGE')).toBe(false);
    expect(requiresHumanConfirmation('STATUS_SNAPSHOT')).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// PLATFORM_LIMITS — shared limits all agents respect
// ──────────────────────────────────────────────────────────────────────────────

describe('PLATFORM_LIMITS', () => {
  it('has expected shape with reasonable values', () => {
    expect(PLATFORM_LIMITS.MAX_DREAMS_PER_USER).toBe(48);
    expect(PLATFORM_LIMITS.MAX_POSTS_PER_HOUR).toBeGreaterThan(0);
    expect(PLATFORM_LIMITS.MAX_MESSAGES_PER_MINUTE).toBeGreaterThan(0);
    expect(PLATFORM_LIMITS.MAX_SHARE_CODES_PER_DAY).toBeGreaterThan(0);
    expect(PLATFORM_LIMITS.MAX_CONNECTOR_REQUESTS_PER_MIN).toBeGreaterThan(0);
    expect(PLATFORM_LIMITS.DATA_REFRESH_BUDGET_SECONDS).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// TRIAD_PROTOCOL_VERSION — version is stamped on events
// ──────────────────────────────────────────────────────────────────────────────

describe('TRIAD_PROTOCOL_VERSION', () => {
  it('is a non-empty string', () => {
    expect(typeof TRIAD_PROTOCOL_VERSION).toBe('string');
    expect(TRIAD_PROTOCOL_VERSION.length).toBeGreaterThan(0);
  });

  it('is stamped as default on parsed events', () => {
    const event = {
      event_id:        '123e4567-e89b-12d3-a456-426614174014',
      correlation_id:  '123e4567-e89b-12d3-a456-426614174015',
      timestamp:       '2026-03-02T10:00:00.000Z',
      actor:           'idari',
      target:          'boogieman',
      type:            'STATUS_SNAPSHOT',
      severity:        'INFO',
      context_refs:    [],
      idempotency_key: 'test-key',
      payload:         {},
    };
    const result = TriadEventSchema.safeParse(event);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.protocol_version).toBe(TRIAD_PROTOCOL_VERSION);
    }
  });
});

