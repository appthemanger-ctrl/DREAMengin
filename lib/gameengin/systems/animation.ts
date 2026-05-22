/**
 * lib/gameengin/systems/animation.ts
 *
 * ANIMATION + EVENT SYSTEMS
 *
 * Focused module: animation state machine with blend-tree + IK interface;
 * deterministic input replay buffer (ghost / anti-cheat); strongly-typed
 * publish/subscribe event bus with history replay.
 *
 * Re-exports from power-systems so existing imports continue to work.
 * `AnimationFSM` and `EventBus` are canonical short-form aliases.
 */

// ─── Classes ─────────────────────────────────────────────────────────────────

export {
    AnimationStateMachine,
    ReplayBuffer,
    TypedEventBus
} from '../power-systems';

/** Alias: AnimationFSM → AnimationStateMachine. */
export { AnimationStateMachine as AnimationFSM } from '../power-systems';

/** Alias: EventBus → TypedEventBus. */
export { TypedEventBus as EventBus } from '../power-systems';

// ─── Types ───────────────────────────────────────────────────────────────────

export type {
    AnimState, AnimTransition, AnimationClip, EventMap, InputFrame,
    ReplayMeta
} from '../power-systems';
