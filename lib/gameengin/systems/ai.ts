/**
 * lib/gameengin/systems/ai.ts
 *
 * AI SYSTEMS
 *
 * Focused module: behavior tree engine for NPC AI (sequence / selector /
 * decorator / parallel nodes + GOAP planner); parallel priority job scheduler
 * for offloading pathfinding and heavy computation off the main thread.
 *
 * Re-exports from power-systems so existing imports continue to work.
 * `BehaviorTreeSystem` is an alias for the canonical `BehaviorTreeEngine`.
 */

// ─── Classes ─────────────────────────────────────────────────────────────────

export {
    BehaviorTreeEngine,
    WorkerJobSystem
} from '../power-systems';

/** Alias: BehaviorTreeSystem → BehaviorTreeEngine. */
export { BehaviorTreeEngine as BehaviorTreeSystem } from '../power-systems';

// ─── Types ───────────────────────────────────────────────────────────────────

export type {
    BTContext,
    BTNode, BTStatus, Job, JobPriority, JobResult
} from '../power-systems';
