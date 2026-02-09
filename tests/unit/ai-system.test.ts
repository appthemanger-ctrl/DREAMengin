// tests/unit/ai-system.test.ts
// Unit tests for three-tier AI system (§13)

import aiSystem from '../../lib/ai/AISystem';
import widgetBus from '../../lib/widgets/WidgetBus';

describe('AISystem', () => {
  // ---- Agent registration ----
  test('should have three agents registered', () => {
    const agents = aiSystem.getAllAgents();
    expect(agents).toHaveLength(3);
    expect(agents.map((a) => a.tier).sort()).toEqual(['boogieman', 'dr_eams', 'idari']);
  });

  test('Dr. Eams should have creative and assistant roles', () => {
    const drEams = aiSystem.getAgent('dr_eams');
    expect(drEams).toBeDefined();
    expect(drEams!.name).toBe('Dr. Eams');
    expect(drEams!.roles).toEqual(['creative', 'assistant']);
  });

  test('IDARi should have debugger and overseer roles', () => {
    const idari = aiSystem.getAgent('idari');
    expect(idari).toBeDefined();
    expect(idari!.name).toBe('IDARi');
    expect(idari!.roles).toEqual(['debugger', 'overseer']);
  });

  test('BoogieManAI should have policy and enforcement roles', () => {
    const boogieman = aiSystem.getAgent('boogieman');
    expect(boogieman).toBeDefined();
    expect(boogieman!.name).toBe('BoogieManAI');
    expect(boogieman!.roles).toEqual(['policy', 'enforcement']);
  });

  // ---- Widget binding (§13: AI lives inside widgets) ----
  test('bindToWidget should set hostWidgetId', () => {
    aiSystem.bindToWidget('dr_eams', 'widget-123');
    const agent = aiSystem.getAgent('dr_eams');
    expect(agent!.hostWidgetId).toBe('widget-123');
  });

  test('bindToWidget should emit ai:bound event on WidgetBus', () => {
    const received: unknown[] = [];
    const handler = (p: unknown) => received.push(p);
    widgetBus.on('ai:bound', handler);
    aiSystem.bindToWidget('idari', 'widget-456');
    expect(received).toEqual([{ tier: 'idari', widgetId: 'widget-456' }]);
    widgetBus.off('ai:bound', handler);
  });

  // ---- Inter-agent messaging ----
  test('send should route message to target tier via WidgetBus', () => {
    const received: unknown[] = [];
    const handler = (p: unknown) => received.push(p);
    widgetBus.on('ai:idari', handler);

    aiSystem.send({
      from: 'dr_eams',
      to: 'idari',
      action: 'debug_request',
      payload: { component: 'HomeFeed' },
      timestamp: Date.now(),
    });

    expect(received).toHaveLength(1);
    expect((received[0] as any).action).toBe('debug_request');
    widgetBus.off('ai:idari', handler);
  });

  test('send broadcast should emit on ai:broadcast', () => {
    const received: unknown[] = [];
    const handler = (p: unknown) => received.push(p);
    widgetBus.on('ai:broadcast', handler);

    aiSystem.send({
      from: 'boogieman',
      to: 'broadcast',
      action: 'policy_update',
      timestamp: Date.now(),
    });

    expect(received).toHaveLength(1);
    widgetBus.off('ai:broadcast', handler);
  });

  // ---- Policy check ----
  test('checkPolicy should allow by default', () => {
    const result = aiSystem.checkPolicy('create_widget');
    expect(result.allowed).toBe(true);
  });
});
