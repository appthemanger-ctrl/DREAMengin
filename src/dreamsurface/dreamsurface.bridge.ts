// dreamsurface.bridge — the ONLY legal path from dream.* → engin.core.*
// Apply Rule-Set deltas to Base State. Bridge between dream.* and engin.core.*.

import { type DreamLedger, appendEntry } from '../engin/core/engin.ledger';
import { type EventBus } from '../engin/core/engin.eventbus';
import {
  type HomeDreamState,
  applyDelta,
} from '../dream/rulesets/homedream/dream.homedream.transforms';

export interface DreamSurfaceBridge {
  applyRulesetDelta(
    ledger: DreamLedger,
    bus: EventBus,
    state: HomeDreamState,
    delta: Partial<HomeDreamState>
  ): { ledger: DreamLedger; state: HomeDreamState };
  swapRuleset(currentRuleset: string, nextRuleset: string, bus: EventBus): void;
}

export function createBridge(): DreamSurfaceBridge {
  function applyRulesetDelta(
    ledger: DreamLedger,
    bus: EventBus,
    state: HomeDreamState,
    delta: Partial<HomeDreamState>
  ): { ledger: DreamLedger; state: HomeDreamState } {
    const nextState = applyDelta(state, delta);
    const nextLedger = appendEntry(ledger, {
      eventType: 'ruleset:delta',
      payload: { delta, frameIndex: nextState.frameIndex },
    });
    bus.publish({
      type: 'ruleset:delta',
      payload: { frameIndex: nextState.frameIndex },
      sourceNamespace: 'dreamsurface',
    });
    return { ledger: nextLedger, state: nextState };
  }

  function swapRuleset(currentRuleset: string, nextRuleset: string, bus: EventBus): void {
    bus.publish({
      type: 'ruleset:swap',
      payload: { from: currentRuleset, to: nextRuleset },
      sourceNamespace: 'dreamsurface',
    });
  }

  return { applyRulesetDelta, swapRuleset };
}