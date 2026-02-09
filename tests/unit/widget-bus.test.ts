// tests/unit/widget-bus.test.ts
// Unit tests for WidgetBus shared memory, chain triggering, and sub-widget spawning (§11)

import widgetBus from '../../lib/widgets/WidgetBus';

describe('WidgetBus', () => {
  afterEach(() => {
    widgetBus.clearMemory('test-key');
  });

  // ---- Existing pub/sub ----
  test('emit and on should deliver messages', () => {
    const received: unknown[] = [];
    const handler = (p: unknown) => received.push(p);
    widgetBus.on('test-channel', handler);
    widgetBus.emit('test-channel', { hello: 'world' });
    expect(received).toEqual([{ hello: 'world' }]);
    widgetBus.off('test-channel', handler);
  });

  test('off should remove listener', () => {
    const received: unknown[] = [];
    const handler = (p: unknown) => received.push(p);
    widgetBus.on('test-channel', handler);
    widgetBus.off('test-channel', handler);
    widgetBus.emit('test-channel', 'ignored');
    expect(received).toEqual([]);
  });

  // ---- Shared memory (§11) ----
  test('setMemory and getMemory should store and retrieve values', () => {
    widgetBus.setMemory('test-key', 42);
    expect(widgetBus.getMemory('test-key')).toBe(42);
  });

  test('clearMemory should remove stored value', () => {
    widgetBus.setMemory('test-key', 'value');
    widgetBus.clearMemory('test-key');
    expect(widgetBus.getMemory('test-key')).toBeUndefined();
  });

  test('setMemory should emit memory event', () => {
    const received: unknown[] = [];
    const handler = (p: unknown) => received.push(p);
    widgetBus.on('memory:test-key', handler);
    widgetBus.setMemory('test-key', 'new-value');
    expect(received).toEqual(['new-value']);
    widgetBus.off('memory:test-key', handler);
  });

  // ---- Chain triggering (§11) ----
  test('triggerChain should emit chain events in order', () => {
    const log: string[] = [];
    const handlerA = (p: any) => log.push(`A:${p.action}`);
    const handlerB = (p: any) => log.push(`B:${p.action}`);
    widgetBus.on('chain:widgetA', handlerA);
    widgetBus.on('chain:widgetB', handlerB);

    widgetBus.triggerChain([
      { widgetId: 'widgetA', action: 'start' },
      { widgetId: 'widgetB', action: 'process' },
    ]);

    expect(log).toEqual(['A:start', 'B:process']);
    widgetBus.off('chain:widgetA', handlerA);
    widgetBus.off('chain:widgetB', handlerB);
  });

  // ---- Sub-widget spawning (§11) ----
  test('spawnSubWidget and getSubWidgets should manage children', () => {
    widgetBus.spawnSubWidget('parent1', 'child1');
    widgetBus.spawnSubWidget('parent1', 'child2');
    expect(widgetBus.getSubWidgets('parent1')).toEqual(['child1', 'child2']);
  });

  test('removeSubWidget should remove child', () => {
    widgetBus.spawnSubWidget('parent2', 'childX');
    widgetBus.removeSubWidget('parent2', 'childX');
    expect(widgetBus.getSubWidgets('parent2')).toEqual([]);
  });

  test('spawnSubWidget should emit spawn event', () => {
    const received: unknown[] = [];
    const handler = (p: unknown) => received.push(p);
    widgetBus.on('spawn:parentS', handler);
    widgetBus.spawnSubWidget('parentS', 'childS');
    expect(received).toEqual([{ childId: 'childS' }]);
    widgetBus.off('spawn:parentS', handler);
  });
});
