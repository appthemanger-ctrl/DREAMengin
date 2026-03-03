// lib/engine-v2/gameplay.ts
// Phase 5 — Gameplay layer: state machines, intent component, ability system,
// event bus, trigger volumes, tag queries, health/damage, deterministic RNG.
// Pure module — no React, no DOM dependencies.

import { mulberry32 } from './determinism';

// ---------------------------------------------------------------------------
// Entity state machine
// ---------------------------------------------------------------------------

export type EntityStateId = 'idle' | 'move' | 'interact' | 'stunned' | string;

export interface EntityStateTransition {
  from: EntityStateId;
  to: EntityStateId;
  /** Optional guard: transition is allowed only when this returns true. */
  guard?: () => boolean;
  /** Optional side-effect on entering the new state. */
  onEnter?: () => void;
}

export class EntityStateMachine {
  private current: EntityStateId;
  private readonly transitions: EntityStateTransition[];

  constructor(initial: EntityStateId, transitions: EntityStateTransition[]) {
    this.current = initial;
    this.transitions = transitions;
  }

  get state(): EntityStateId {
    return this.current;
  }

  /** Attempt transition to `to`. Returns true if the transition was taken. */
  transition(to: EntityStateId): boolean {
    const rule = this.transitions.find(t => t.from === this.current && t.to === to);
    if (!rule) return false;
    if (rule.guard && !rule.guard()) return false;
    this.current = to;
    rule.onEnter?.();
    return true;
  }

  /** Force-set state (bypasses guards; use only for resets/checkpoints). */
  forceSet(state: EntityStateId): void {
    this.current = state;
  }
}

// ---------------------------------------------------------------------------
// Intent component (input → intent, separate from physics velocity)
// ---------------------------------------------------------------------------

export interface IntentComponent {
  entityId: number;
  /** Normalised direction [-1,1] on each axis. */
  moveX: number;
  moveY: number;
  jump: boolean;
  interact: boolean;
  /** Action name if an ability was triggered this tick, else null. */
  abilityName: string | null;
}

export function zeroIntent(entityId: number): IntentComponent {
  return { entityId, moveX: 0, moveY: 0, jump: false, interact: false, abilityName: null };
}

// ---------------------------------------------------------------------------
// Ability system
// ---------------------------------------------------------------------------

export interface AbilityDef {
  name: string;
  cooldownMs: number;
  cost: number;
  /** Animation hook name to trigger (resolved by render layer). */
  animHook: string;
}

export class AbilityState {
  private lastUsed = -Infinity;
  readonly def: AbilityDef;

  constructor(def: AbilityDef) {
    this.def = def;
  }

  isReady(nowMs: number): boolean {
    return nowMs - this.lastUsed >= this.def.cooldownMs;
  }

  /** Returns true if the ability was activated (cooldown ready + enough resource). */
  tryActivate(nowMs: number, resource: number): boolean {
    if (!this.isReady(nowMs)) return false;
    if (resource < this.def.cost) return false;
    this.lastUsed = nowMs;
    return true;
  }

  remainingCooldownMs(nowMs: number): number {
    return Math.max(0, this.def.cooldownMs - (nowMs - this.lastUsed));
  }
}

// ---------------------------------------------------------------------------
// Event bus (ring buffer)
// ---------------------------------------------------------------------------

export type CollisionEventType = 'entered' | 'stayed' | 'exited';

export interface CollisionEvent {
  type: CollisionEventType;
  entityA: number;
  entityB: number;
  /** Simulation tick. */
  tick: number;
}

export const EVENT_BUS_CAPACITY = 512;

export class EventBus {
  private readonly buf: CollisionEvent[] = new Array(EVENT_BUS_CAPACITY);
  private head = 0;
  private count = 0;

  emit(evt: CollisionEvent): void {
    this.buf[this.head] = evt;
    this.head = (this.head + 1) % EVENT_BUS_CAPACITY;
    if (this.count < EVENT_BUS_CAPACITY) this.count++;
  }

  /** Drain all events. Clears the buffer. */
  drain(): CollisionEvent[] {
    const out = this.recent(this.count);
    this.head = 0;
    this.count = 0;
    return out;
  }

  recent(n = this.count): CollisionEvent[] {
    const len = Math.min(n, this.count);
    const result: CollisionEvent[] = [];
    for (let i = 0; i < len; i++) {
      const idx = (this.head - len + i + EVENT_BUS_CAPACITY) % EVENT_BUS_CAPACITY;
      result.push(this.buf[idx]);
    }
    return result;
  }

  get size(): number {
    return this.count;
  }
}

// ---------------------------------------------------------------------------
// Trigger volumes
// ---------------------------------------------------------------------------

export interface TriggerVolume {
  id: number;
  /** Axis-aligned bounds. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Which entity tags can activate this trigger. Empty = any. */
  activatorTags: string[];
}

export function isTriggerActivated(
  trigger: TriggerVolume,
  entityX: number,
  entityY: number,
  entityTags: string[],
): boolean {
  if (trigger.activatorTags.length > 0) {
    if (!trigger.activatorTags.some(t => entityTags.includes(t))) return false;
  }

  return (
    entityX >= trigger.x &&
    entityX <= trigger.x + trigger.width &&
    entityY >= trigger.y &&
    entityY <= trigger.y + trigger.height
  );
}

// ---------------------------------------------------------------------------
// Tag queries
// ---------------------------------------------------------------------------

export interface TaggedEntity {
  id: number;
  tags: string[];
  x: number;
  y: number;
}

export function findAllWithTagInRadius(
  entities: TaggedEntity[],
  tag: string,
  cx: number,
  cy: number,
  radius: number,
): TaggedEntity[] {
  const rr = radius * radius;
  return entities.filter(e => {
    if (!e.tags.includes(tag)) return false;
    const dx = e.x - cx;
    const dy = e.y - cy;
    return dx * dx + dy * dy <= rr;
  });
}

// ---------------------------------------------------------------------------
// Health / damage components
// ---------------------------------------------------------------------------

export interface HealthComponent {
  entityId: number;
  hp: number;
  maxHp: number;
  invincibleUntilMs: number;
}

export function isAlive(health: HealthComponent): boolean {
  return health.hp > 0;
}

export function applyDamage(
  health: HealthComponent,
  amount: number,
  nowMs: number,
): HealthComponent {
  if (nowMs < health.invincibleUntilMs) return health;
  return { ...health, hp: Math.max(0, health.hp - amount) };
}

// ---------------------------------------------------------------------------
// Deterministic RNG registry
// ---------------------------------------------------------------------------

export class DeterministicRNGRegistry {
  private readonly streams = new Map<string, () => number>();

  /** Register a named RNG stream with a given seed. */
  register(name: string, seed: number): void {
    this.streams.set(name, mulberry32(seed));
  }

  /** Get the next value from a named stream. Returns 0 if stream not found. */
  next(name: string): number {
    return this.streams.get(name)?.() ?? 0;
  }

  has(name: string): boolean {
    return this.streams.has(name);
  }

  clear(): void {
    this.streams.clear();
  }
}
