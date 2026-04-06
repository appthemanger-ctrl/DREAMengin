import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const useDualRuntimeSrc = readFileSync(
  resolve(__dirname, '../lib/runtime/useDualRuntime.ts'),
  'utf8',
);

const dualRuntimeBridgeSrc = readFileSync(
  resolve(__dirname, '../lib/runtime/dualRuntimeBridge.ts'),
  'utf8',
);

describe('runtime wiring', () => {
  it('wires useDualRuntime peer updates through bridge subscriptions', () => {
    expect(useDualRuntimeSrc).toContain('bridge.subscribePeerActivity');
    expect(useDualRuntimeSrc).not.toContain('setInterval');
  });

  it('exposes bridge observers for peer and event activity', () => {
    expect(dualRuntimeBridgeSrc).toContain('subscribePeerActivity');
    expect(dualRuntimeBridgeSrc).toContain('subscribeEventActivity');
  });
});
