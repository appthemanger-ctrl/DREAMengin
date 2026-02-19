// tests/boogieman.test.ts
// Unit tests for BoogieMan policy gate

import { describe, it, expect } from 'vitest';
import { boogieEvaluate } from '@/lib/ai/boogieman';
import type { Intent } from '@/lib/ai/schemas';

describe('BoogieMan Policy Gate', () => {
  it('should deny admin intent for non-admin user', () => {
    const intents: Intent[] = [
      {
        intent_id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'DIAG_SCHEMA_SNAPSHOT',
        payload: {},
        confidence: 0.9,
        requires_confirmation: false,
        rationale: 'Test',
        idempotency_key: 'test-key',
      },
    ];

    const result = boogieEvaluate({
      actorRole: 'user',
      rateRpm: 10,
      intents,
    });

    expect(result.per_intent[0].decision).toBe('DENY');
    expect(result.per_intent[0].reason_code).toBe('ADMIN_REQUIRED');
  });

  it('should allow low-risk nav intent for user', () => {
    const intents: Intent[] = [
      {
        intent_id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'NAV_DELTA',
        payload: { delta_route: '/home' },
        confidence: 0.9,
        requires_confirmation: false,
        rationale: 'Navigate to home',
        idempotency_key: 'nav-key',
      },
    ];

    const result = boogieEvaluate({
      actorRole: 'user',
      rateRpm: 10,
      intents,
    });

    expect(result.per_intent[0].decision).toBe('ALLOW');
    expect(result.per_intent[0].reason_code).toBe('OK');
  });

  it('should confirm high-risk intent', () => {
    const intents: Intent[] = [
      {
        intent_id: '123e4567-e89b-12d3-a456-426614174002',
        type: 'DREAM_CONFIG_PATCH',
        payload: { config: { theme: 'dark' } },
        confidence: 0.9,
        requires_confirmation: false,
        rationale: 'Update config',
        idempotency_key: 'config-key',
      },
    ];

    const result = boogieEvaluate({
      actorRole: 'user',
      rateRpm: 10,
      intents,
    });

    expect(result.per_intent[0].decision).toBe('CONFIRM');
    expect(result.per_intent[0].reason_code).toBe('HIGH_RISK');
  });

  it('should hard block on high RPM', () => {
    const intents: Intent[] = [
      {
        intent_id: '123e4567-e89b-12d3-a456-426614174003',
        type: 'NAV_DELTA',
        payload: {},
        confidence: 0.9,
        requires_confirmation: false,
        rationale: 'Test',
        idempotency_key: 'test-key',
      },
    ];

    const result = boogieEvaluate({
      actorRole: 'user',
      rateRpm: 70, // Above threshold
      intents,
    });

    expect(result.global.hard_block).toBe(true);
    expect(result.global.cooldown_seconds).toBe(60);
  });

  it('should deny low confidence intents', () => {
    const intents: Intent[] = [
      {
        intent_id: '123e4567-e89b-12d3-a456-426614174004',
        type: 'POST_CREATE',
        payload: { content: 'test' },
        confidence: 0.3, // Low confidence
        requires_confirmation: false,
        rationale: 'Create post',
        idempotency_key: 'post-key',
      },
    ];

    const result = boogieEvaluate({
      actorRole: 'user',
      rateRpm: 10,
      intents,
    });

    expect(result.per_intent[0].decision).toBe('DENY');
    expect(result.per_intent[0].reason_code).toBe('LOW_CONFIDENCE');
  });
});
