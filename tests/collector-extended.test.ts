/**
 * tests/collector-extended.test.ts
 * Tests for improvements 21-25 in lib/observability/collector.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearBuffers,
  collectLog,
  collectTrace,
  collectBatchLogs,
  getErrorRate,
  getP95Latency,
  groupTracesByTraceId,
  getLogCountsBySeverity,
} from '../lib/observability/collector';

beforeEach(() => { clearBuffers(); });

// ── Improvement 91: collectBatchLogs ─────────────────────────────────────────
describe('collectBatchLogs', () => {
  it('pushes multiple log entries atomically', () => {
    collectBatchLogs([
      { level: 'error', message: 'err1' },
      { level: 'warn', message: 'warn1' },
      { level: 'info', message: 'info1' },
    ]);
    const counts = getLogCountsBySeverity();
    expect(counts.error).toBe(1);
    expect(counts.warn).toBe(1);
    expect(counts.info).toBe(1);
  });

  it('handles empty array without error', () => {
    expect(() => collectBatchLogs([])).not.toThrow();
  });
});

// ── Improvement 92: getErrorRate ──────────────────────────────────────────────
describe('getErrorRate', () => {
  it('returns 0 when no logs', () => {
    expect(getErrorRate()).toBe(0);
  });

  it('computes errors per minute', () => {
    collectLog('error', 'e1');
    collectLog('error', 'e2');
    collectLog('info', 'i1');
    // 2 errors in default 5-min window = 0.4 errors/min
    expect(getErrorRate()).toBeCloseTo(0.4, 1);
  });
});

// ── Improvement 93: getP95Latency ─────────────────────────────────────────────
describe('getP95Latency', () => {
  it('returns 0 when no traces', () => {
    expect(getP95Latency()).toBe(0);
  });

  it('computes P95 correctly', () => {
    // 10 traces: 1ms–10ms
    for (let i = 1; i <= 10; i++) {
      collectTrace(`op${i}`, i, 'ok');
    }
    // P95 of [1..10] sorted = index 9 (floor(10*0.95)=9) → value 10
    const p95 = getP95Latency();
    expect(p95).toBeGreaterThanOrEqual(9);
    expect(p95).toBeLessThanOrEqual(10);
  });
});

// ── Improvement 94: groupTracesByTraceId ──────────────────────────────────────
describe('groupTracesByTraceId', () => {
  it('groups spans by trace_id', () => {
    collectTrace('span-a', 10, 'ok', undefined, 'trace-1');
    collectTrace('span-b', 20, 'ok', undefined, 'trace-1');
    collectTrace('span-c', 15, 'error', undefined, 'trace-2');

    const grouped = groupTracesByTraceId();
    expect(grouped.get('trace-1')).toHaveLength(2);
    expect(grouped.get('trace-2')).toHaveLength(1);
  });

  it('returns empty map when no traces', () => {
    expect(groupTracesByTraceId().size).toBe(0);
  });
});

// ── Improvement 95: getLogCountsBySeverity ────────────────────────────────────
describe('getLogCountsBySeverity', () => {
  it('returns zeroed counts when no logs', () => {
    const counts = getLogCountsBySeverity();
    expect(counts).toEqual({ debug: 0, info: 0, warn: 0, error: 0 });
  });

  it('counts each severity correctly', () => {
    collectLog('debug', 'd');
    collectLog('info', 'i');
    collectLog('info', 'i2');
    collectLog('warn', 'w');
    collectLog('error', 'e');
    collectLog('error', 'e2');
    const counts = getLogCountsBySeverity();
    expect(counts.debug).toBe(1);
    expect(counts.info).toBe(2);
    expect(counts.warn).toBe(1);
    expect(counts.error).toBe(2);
  });
});
