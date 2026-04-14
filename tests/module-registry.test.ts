/**
 * tests/module-registry.test.ts
 *
 * Unit tests for lib/runtime/moduleRegistry.ts
 *
 * These are source-level checks — they verify the module registry
 * exports the required API surface and implements the transfer contract
 * described in the Universal Editor spec.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const registrySrc = readFileSync(
  resolve(__dirname, '../lib/runtime/moduleRegistry.ts'),
  'utf-8',
);

const draggableSrc = readFileSync(
  resolve(__dirname, '../components/draggable/DraggableModule.tsx'),
  'utf-8',
);

const manifestSrc = readFileSync(
  resolve(__dirname, '../types/module-manifest.ts'),
  'utf-8',
);

describe('ModuleManifest type', () => {
  it('declares id, type, sourceRuntime, compatibleRuntimes, content, and ui', () => {
    expect(manifestSrc).toContain('id: string');
    expect(manifestSrc).toContain('sourceRuntime');
    expect(manifestSrc).toContain('compatibleRuntimes');
    expect(manifestSrc).toContain('content');
    expect(manifestSrc).toContain('movable');
    expect(manifestSrc).toContain('resizable');
  });

  it('includes all canonical runtimes', () => {
    expect(manifestSrc).toContain("'homedream'");
    expect(manifestSrc).toContain("'dreamspace'");
    expect(manifestSrc).toContain("'daydream:music'");
    expect(manifestSrc).toContain("'engin:game'");
  });
});

describe('moduleRegistry exports', () => {
  it('exports useModuleRegistry Zustand store', () => {
    expect(registrySrc).toContain('useModuleRegistry');
    expect(registrySrc).toContain('create<ModuleRegistryState>');
  });

  it('provides registerModule, unregisterModule, transferModule, getModulesForRuntime', () => {
    expect(registrySrc).toContain('registerModule');
    expect(registrySrc).toContain('unregisterModule');
    expect(registrySrc).toContain('transferModule');
    expect(registrySrc).toContain('getModulesForRuntime');
  });

  it('publishes to bridge on transfer', () => {
    expect(registrySrc).toContain("bridge.emit('module', 'transfer'");
  });

  it('rejects incompatible target runtimes', () => {
    expect(registrySrc).toContain('compatibleRuntimes.includes(targetRuntime)');
    // returns false when incompatible
    expect(registrySrc).toContain('return false');
  });

  it('exports subscribeRegistryToTransferEvents for bridge wiring', () => {
    expect(registrySrc).toContain('subscribeRegistryToTransferEvents');
    expect(registrySrc).toContain("bridge.subscribe('module', 'transfer'");
  });

  it('exports manifestFromWidget helper', () => {
    expect(registrySrc).toContain('manifestFromWidget');
    expect(registrySrc).toContain("sourceRuntime: RuntimeId = 'homedream'");
  });
});

describe('DraggableModule component', () => {
  it('uses pointer events for tap-hold and drag', () => {
    expect(draggableSrc).toContain('onPointerDown');
    expect(draggableSrc).toContain('onPointerMove');
    expect(draggableSrc).toContain('onPointerUp');
    expect(draggableSrc).toContain('onPointerCancel');
  });

  it('uses translate3d for GPU-accelerated drag', () => {
    expect(draggableSrc).toContain('translate3d');
  });

  it('applies hold timeout of 300ms before lifting', () => {
    expect(draggableSrc).toContain('HOLD_MS = 300');
  });

  it('uses requestAnimationFrame for edge detection', () => {
    expect(draggableSrc).toContain('requestAnimationFrame');
  });

  it('fires bridge transfer on edge hold', () => {
    expect(draggableSrc).toContain("bridge.emit('module', 'transfer'");
  });

  it('cancels hold timer on significant pointer movement', () => {
    expect(draggableSrc).toContain('MOVE_CANCEL_PX');
    expect(draggableSrc).toContain('cancelHoldTimer');
  });

  it('provides keyboard accessibility via Ctrl+Arrow', () => {
    expect(draggableSrc).toContain('ArrowRight');
    expect(draggableSrc).toContain('ArrowLeft');
    expect(draggableSrc).toContain('ctrlKey');
  });

  it('sets willChange only when lifted for render-on-demand', () => {
    expect(draggableSrc).toContain("willChange: lifted ? 'transform' : undefined");
  });

  it('renders screen-edge glow overlays for visual feedback', () => {
    expect(draggableSrc).toContain('edgeSide');
    expect(draggableSrc).toContain('linear-gradient');
  });

  it('announces edge proximity to screen readers', () => {
    expect(draggableSrc).toContain('aria-live');
    expect(draggableSrc).toContain('edgeLabel');
  });
});

describe('DreamWidgetGrid integration', () => {
  const gridSrc = readFileSync(
    resolve(__dirname, '../components/home/DreamWidgetGrid.tsx'),
    'utf-8',
  );

  it('imports DraggableModule', () => {
    expect(gridSrc).toContain('DraggableModule');
  });

  it('imports manifestFromWidget helper', () => {
    expect(gridSrc).toContain('manifestFromWidget');
  });

  it('wraps each DreamWidget with DraggableModule', () => {
    expect(gridSrc).toContain('<DraggableModule');
    expect(gridSrc).toContain('manifestFromWidget(widget');
  });
});
