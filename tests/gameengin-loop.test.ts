/**
 * tests/gameengin-loop.test.ts
 *
 * Locks the Brain feedback loop pieces added per the "Brain — what it really
 * is" directive:
 *   - Two-Project Rule (active-projects.json + setActiveProjects validation)
 *   - Crash Report → Brain Project History (recordCrashReport + listCrashReports)
 *   - /api/gameengin/crash-report endpoint contract
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  BRAIN_ROOT,
  readActiveProjects,
  setActiveProjects,
  isActiveCartridge,
  recordCrashReport,
  listCrashReports,
  CRASH_REPORT_MAX_BYTES,
  type ActiveProjects,
} from '@/lib/gameengin/brain-reader';
import { POST } from '@/app/api/gameengin/crash-report/route';

const ACTIVE_PATH = path.join(BRAIN_ROOT, 'active-projects.json');
const CRASH_DIR = path.join(BRAIN_ROOT, 'crash-reports');

let originalActive: string;

function makeReq(body: unknown): Request {
  return new Request('http://test.local/api/gameengin/crash-report', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  originalActive = fs.readFileSync(ACTIVE_PATH, 'utf-8');
});

afterEach(() => {
  fs.writeFileSync(ACTIVE_PATH, originalActive);
  // Clean up any reports written during a test for the synthetic test cartridge.
  const testDir = path.join(CRASH_DIR, 'test-loop-cartridge');
  if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
});

describe('Brain — Two-Project Rule', () => {
  it('seeds an active-projects ledger with mad-maxi', () => {
    const ap = readActiveProjects();
    expect(ap.max_slots).toBe(2);
    expect(ap.slots.some((s) => s.cartridge_id === 'mad-maxi')).toBe(true);
  });

  it('isActiveCartridge reflects the ledger', () => {
    expect(isActiveCartridge('mad-maxi')).toBe(true);
    expect(isActiveCartridge('not-a-real-cartridge')).toBe(false);
  });

  it('setActiveProjects rejects more than 2 slots', () => {
    const tooMany: ActiveProjects = {
      max_slots: 2,
      slots: [
        { cartridge_id: 'mad-maxi',  added_at: '2026-01-01T00:00:00.000Z', focus: 'primary' },
        { cartridge_id: 'echo-arena', added_at: '2026-01-02T00:00:00.000Z', focus: 'parallel' },
        { cartridge_id: 'neon-drift', added_at: '2026-01-03T00:00:00.000Z', focus: 'parallel' },
      ],
    };
    expect(() => setActiveProjects(tooMany)).toThrow(/Two-Project cap/);
  });

  it('setActiveProjects rejects duplicate cartridge_ids and bad slugs', () => {
    expect(() => setActiveProjects({
      max_slots: 2,
      slots: [
        { cartridge_id: 'mad-maxi', added_at: 'x', focus: 'primary' },
        { cartridge_id: 'mad-maxi', added_at: 'x', focus: 'parallel' },
      ],
    })).toThrow(/duplicate/);
    expect(() => setActiveProjects({
      max_slots: 2,
      slots: [{ cartridge_id: 'BAD SLUG!', added_at: 'x', focus: 'primary' }],
    })).toThrow(/invalid cartridge_id/);
  });
});

describe('Brain — Crash Report → Project History', () => {
  it('records a crash report for an active cartridge into the Brain', () => {
    setActiveProjects({
      max_slots: 2,
      slots: [
        { cartridge_id: 'test-loop-cartridge', added_at: '2026-04-18T00:00:00.000Z', focus: 'primary' },
      ],
    });
    const filePath = recordCrashReport({
      cartridge_id: 'test-loop-cartridge',
      player_statement: 'Game froze on Sprint Drop Kick.',
      version: '0.1.0',
    });
    expect(fs.existsSync(filePath)).toBe(true);
    const reports = listCrashReports('test-loop-cartridge');
    expect(reports).toHaveLength(1);
    expect(reports[0].player_statement).toBe('Game froze on Sprint Drop Kick.');
    expect(reports[0].received_at).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('refuses to record for an inactive cartridge', () => {
    setActiveProjects({ max_slots: 2, slots: [] });
    expect(() => recordCrashReport({
      cartridge_id: 'mad-maxi',
      player_statement: 'whatever',
    })).toThrow(/not an active project/);
  });

  it('rejects empty player_statement and bad cartridge_id', () => {
    expect(() => recordCrashReport({ cartridge_id: 'mad-maxi', player_statement: '   ' }))
      .toThrow(/player_statement is required/);
    expect(() => recordCrashReport({ cartridge_id: 'BAD!', player_statement: 'x' }))
      .toThrow(/invalid cartridge_id/);
  });

  it('CRASH_REPORT_MAX_BYTES is the documented 16 KB cap', () => {
    expect(CRASH_REPORT_MAX_BYTES).toBe(16 * 1024);
  });
});

describe('Brain — /api/gameengin/crash-report endpoint', () => {
  it('writes to the Brain and returns 201 for an active cartridge', async () => {
    setActiveProjects({
      max_slots: 2,
      slots: [
        { cartridge_id: 'test-loop-cartridge', added_at: '2026-04-18T00:00:00.000Z', focus: 'primary' },
      ],
    });
    const res = await POST(makeReq({
      cartridge_id: 'test-loop-cartridge',
      player_statement: 'Crashed at level 3.',
    }) as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.stored).toMatch(/^crash-reports\/test-loop-cartridge\//);
  });

  it('returns 404 for an inactive / unknown cartridge', async () => {
    setActiveProjects({ max_slots: 2, slots: [] });
    const res = await POST(makeReq({
      cartridge_id: 'mad-maxi',
      player_statement: 'whatever',
    }) as never);
    expect(res.status).toBe(404);
  });

  it('returns 400 for bad cartridge_id or empty statement', async () => {
    const r1 = await POST(makeReq({ cartridge_id: 'BAD!', player_statement: 'x' }) as never);
    expect(r1.status).toBe(400);
    const r2 = await POST(makeReq({ cartridge_id: 'mad-maxi', player_statement: '   ' }) as never);
    expect(r2.status).toBe(400);
  });

  it('returns 413 when the payload exceeds 16 KB', async () => {
    const big = 'x'.repeat(CRASH_REPORT_MAX_BYTES + 100);
    const res = await POST(makeReq({ cartridge_id: 'mad-maxi', player_statement: big }) as never);
    expect(res.status).toBe(413);
  });

  it('returns 400 for invalid JSON', async () => {
    const res = await POST(makeReq('not-json{') as never);
    expect(res.status).toBe(400);
  });

  it('ignores unknown payload keys (allow-list)', async () => {
    setActiveProjects({
      max_slots: 2,
      slots: [
        { cartridge_id: 'test-loop-cartridge', added_at: '2026-04-18T00:00:00.000Z', focus: 'primary' },
      ],
    });
    await POST(makeReq({
      cartridge_id: 'test-loop-cartridge',
      player_statement: 'crash',
      __proto__: { polluted: true },
      malicious: 'ignored',
    }) as never);
    const reports = listCrashReports('test-loop-cartridge');
    expect(reports[0]).not.toHaveProperty('malicious');
  });
});
