import { describe, expect, it } from 'vitest';
import { RuntimeContainer } from '@/lib/runtime/runtimeContainer';

describe('RuntimeContainer', () => {
  it('runs injected logic without owning business rules', () => {
    const logicModuleA = (state: { count: number }, input: number) => ({
      ...state,
      count: state.count + input,
    });

    const context = new RuntimeContainer({ count: 0 }, logicModuleA);

    expect(context.run(5)).toEqual({ count: 5 });
    expect(context.getState()).toEqual({ count: 5 });
  });

  it('composes different behavior from a different strategy', () => {
    const logicModuleB = (state: { count: number }, input: number) => ({
      ...state,
      count: state.count * input,
    });

    const context = new RuntimeContainer({ count: 3 }, logicModuleB);

    expect(context.run(5)).toEqual({ count: 15 });
    expect(context.getState()).toEqual({ count: 15 });
  });
});
