// tests/unit/ccc-core.test.ts
// Unit tests for Connected Chaos Core (§14)

import cccCore from '../../lib/core/CCCCore';
import widgetBus from '../../lib/widgets/WidgetBus';

describe('CCCCore', () => {
  // ---- Transformation recording (§14: information is never lost) ----
  test('recordTransformation should store and return transformation', () => {
    const t = cccCore.recordTransformation('edit', { before: 'A' }, { after: 'B' }, 'w1');
    expect(t.kind).toBe('edit');
    expect(t.inputSnapshot).toEqual({ before: 'A' });
    expect(t.outputSnapshot).toEqual({ after: 'B' });
    expect(t.sourceWidgetId).toBe('w1');
    expect(t.id).toBeTruthy();
  });

  test('getTransformations should return all or limited', () => {
    // Record a few transformations
    cccCore.recordTransformation('a', null, null);
    cccCore.recordTransformation('b', null, null);
    cccCore.recordTransformation('c', null, null);

    const all = cccCore.getTransformations();
    expect(all.length).toBeGreaterThanOrEqual(3);

    const last2 = cccCore.getTransformations(2);
    expect(last2).toHaveLength(2);
    expect(last2[1].kind).toBe('c');
  });

  test('recordTransformation should emit ccc:transformation on WidgetBus', () => {
    const received: unknown[] = [];
    const handler = (p: unknown) => received.push(p);
    widgetBus.on('ccc:transformation', handler);

    cccCore.recordTransformation('test', 'in', 'out');

    expect(received).toHaveLength(1);
    expect((received[0] as any).kind).toBe('test');
    widgetBus.off('ccc:transformation', handler);
  });

  // ---- Persistent memory (§14: delegates to WidgetBus shared memory) ----
  test('persist and recall should delegate to WidgetBus', () => {
    cccCore.persist('ccc-key', { data: 123 });
    expect(cccCore.recall('ccc-key')).toEqual({ data: 123 });
    expect(widgetBus.getMemory('ccc-key')).toEqual({ data: 123 });
  });

  // ---- Nested fields (§14: nested cubes / realities) ----
  test('addField and getField should manage fields', () => {
    cccCore.addField({ id: 'f1', depth: 0, label: 'Root' });
    expect(cccCore.getField('f1')).toEqual({ id: 'f1', depth: 0, label: 'Root' });
  });

  test('getChildFields should return children of a parent', () => {
    cccCore.addField({ id: 'p1', depth: 0, label: 'Parent' });
    cccCore.addField({ id: 'c1', parentId: 'p1', depth: 1, label: 'Child 1' });
    cccCore.addField({ id: 'c2', parentId: 'p1', depth: 1, label: 'Child 2' });
    const children = cccCore.getChildFields('p1');
    expect(children).toHaveLength(2);
    expect(children.map((c) => c.id).sort()).toEqual(['c1', 'c2']);
  });

  test('getRootFields should return fields without parent', () => {
    cccCore.addField({ id: 'root1', depth: 0 });
    const roots = cccCore.getRootFields();
    expect(roots.some((f) => f.id === 'root1')).toBe(true);
  });

  test('removeField should delete field', () => {
    cccCore.addField({ id: 'toRemove', depth: 0 });
    cccCore.removeField('toRemove');
    expect(cccCore.getField('toRemove')).toBeUndefined();
  });
});
