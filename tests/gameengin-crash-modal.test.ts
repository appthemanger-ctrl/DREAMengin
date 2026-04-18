/**
 * tests/gameengin-crash-modal.test.ts
 *
 * Lightweight unit tests for the player-facing crash window. The modal
 * itself is React/TSX (no jsdom in this repo), so we test:
 *   1. The modal's payload-cap constant tracks the server-side cap.
 *   2. The error-boundary state derivation works (pure function).
 *   3. The launcher integrates the modal & boundary (smoke import).
 *
 * The HTTP contract the modal speaks to is already covered by
 * tests/gameengin-loop.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { CRASH_REPORT_MAX_BYTES as SERVER_CAP } from '@/lib/gameengin/brain-reader';
import { CRASH_REPORT_MAX_BYTES as CLIENT_CAP } from '@/components/gameengin/CrashReportModal';
import { CartridgeErrorBoundary } from '@/components/gameengin/CartridgeErrorBoundary';

describe('Crash modal — client/server payload cap parity', () => {
  it('client cap matches server cap (16 KB)', () => {
    expect(CLIENT_CAP).toBe(SERVER_CAP);
    expect(CLIENT_CAP).toBe(16 * 1024);
  });
});

describe('CartridgeErrorBoundary', () => {
  it('getDerivedStateFromError marks crashed=true', () => {
    expect(CartridgeErrorBoundary.getDerivedStateFromError()).toEqual({ crashed: true });
  });
});

describe('CartridgeLauncher integration', () => {
  it('imports CrashReportModal + CartridgeErrorBoundary at module load', async () => {
    // Module-load smoke test: ensures the launcher TSX compiles & wires the
    // crash window without runtime errors during import resolution.
    const launcher = await import('@/components/gameengin/CartridgeLauncher');
    expect(typeof launcher.default).toBe('function');
  });
});
