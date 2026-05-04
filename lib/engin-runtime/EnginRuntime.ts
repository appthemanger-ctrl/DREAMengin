/**
 * lib/engin-runtime/EnginRuntime.ts
 *
 * EnginRuntime — the ONE fixed engine that never changes.
 *
 * Responsibilities:
 *   1. Holds base state and a reference to the active rule-set.
 *   2. Processes actions: checks capabilities → runs constraints → applies transform.
 *   3. Emits lifecycle + state-change events via the scoped event bus.
 *   4. Delegates all persistence to the injected I/O adapter.
 *   5. Exposes getDerivedState() so the UI can read the projected state.
 *
 * The engine itself has NO knowledge of game scores, music stems, world
 * tiles, or any other domain concept.  All of that lives in rule-sets.
 *
 * Architecture: docs/AGENT_PLAYBOOK.md §1 — Foundation.Kernel.
 */

import { createBaseState, patchBaseState, type EnginBaseState, type EnginLifecycle } from './EnginBaseState';
import { createEnginEventBus, type EnginEventBus, type EnginLifecycleEvents } from './EnginEventBus';
import { LocalStorageAdapter, type EnginIOAdapter } from './EnginIOAdapter';
import {
  DEFAULT_USER_CAPABILITIES,
  gateCapability,
  type EnginCapabilityMap,
} from './EnginCapabilities';
import type { EnginAction, EnginRuleSetContract } from './EnginRuleSetContract';

// ─── Runtime options ──────────────────────────────────────────────────────────

export interface EnginRuntimeOptions {
  /** Override the capability map (e.g. for admin or guest users). */
  capabilities?: EnginCapabilityMap;
  /** Override the I/O adapter (e.g. MemoryAdapter for tests). */
  ioAdapter?: EnginIOAdapter;
  /** Persist domain state under this key on every change. Set to false to disable. */
  persistenceKey?: string | false;
}

// ─── Runtime ─────────────────────────────────────────────────────────────────

export class EnginRuntime<
  A extends EnginAction = EnginAction,
  DomainEvents extends Record<string, unknown> = Record<string, unknown>,
> {
  private _state: EnginBaseState;
  private readonly _ruleSet: EnginRuleSetContract<A>;
  private readonly _capabilities: EnginCapabilityMap;
  private readonly _io: EnginIOAdapter;
  private readonly _persistenceKey: string | false;

  /** Scoped event bus — owned by this runtime instance. */
  readonly bus: EnginEventBus<DomainEvents>;

  constructor(
    ruleSet: EnginRuleSetContract<A>,
    options: EnginRuntimeOptions = {},
  ) {
    this._ruleSet = ruleSet;
    this._capabilities = options.capabilities ?? DEFAULT_USER_CAPABILITIES;
    this._io = options.ioAdapter ?? new LocalStorageAdapter(ruleSet.params.enginId);
    this._persistenceKey = options.persistenceKey !== undefined
      ? options.persistenceKey
      : 'domain-state';
    this._state = createBaseState(ruleSet.params.enginId);
    this.bus = createEnginEventBus<DomainEvents>();
  }

  // ─── Read ───────────────────────────────────────────────────────────────────

  /** Current raw base state (read-only snapshot). */
  get state(): Readonly<EnginBaseState> {
    return this._state;
  }

  /**
   * getDerivedState()
   *
   * Projects the current base state through the rule-set's deriveState()
   * selector.  Call this to get the shape the UI needs.
   */
  getDerivedState(): Record<string, unknown> {
    return this._ruleSet.deriveState(this._state);
  }

  // ─── Action dispatch ────────────────────────────────────────────────────────

  /**
   * dispatch(action)
   *
   * Processes an action through the engine pipeline:
   *   1. Gate capability (if action declares one via __capability).
   *   2. Run all rule-set constraints.
   *   3. Apply the rule-set transform.
   *   4. Emit state change event.
   *   5. Persist if persistence is configured.
   *
   * Returns `true` if the action was applied, `false` if it was rejected.
   */
  dispatch(action: A): boolean {
    // Type-safe helper: cast payload to the bus's expected type
    const _emit = <K extends keyof EnginLifecycleEvents>(
      event: K,
      payload: EnginLifecycleEvents[K],
    ) => this.bus.emit(event as Parameters<typeof this.bus.emit>[0], payload as Parameters<typeof this.bus.emit>[1]);

    // 1. Capability gate
    const capabilityKey = (action as Record<string, unknown>)['__capability'];
    if (typeof capabilityKey === 'string') {
      const gate = gateCapability(this._capabilities, capabilityKey as Parameters<typeof gateCapability>[1]);
      if (!gate.granted) {
        _emit('engin:error', {
          enginId: this._state.enginId,
          message: gate.reason ?? 'Action denied: capability not granted.',
        });
        return false;
      }
    }

    // 2. Constraints
    for (const constraint of this._ruleSet.constraints) {
      const result = constraint(this._state, action);
      if (!result.valid) {
        _emit('engin:error', {
          enginId: this._state.enginId,
          message: result.reason ?? 'Action rejected by constraint.',
        });
        return false;
      }
    }

    // 3. Transform
    const next = this._ruleSet.transform(this._state, action);
    this._state = next;

    // 4. Emit state change
    _emit('engin:state', {
      enginId: this._state.enginId,
      revision: this._state.revision,
    });

    // 5. Persist (fire-and-forget)
    if (this._persistenceKey !== false) {
      const enginId = this._state.enginId;
      this._io.save(this._persistenceKey, this._state.domain).then((ok) => {
        if (ok) {
          _emit('engin:persisted', {
            enginId,
            key: this._persistenceKey as string,
          });
        }
      }).catch((cause: unknown) => {
        _emit('engin:error', {
          enginId,
          message: 'Persistence failed — state not saved.',
          cause,
        });
      });
    }

    return true;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  /** Transition the engine to a new lifecycle stage. */
  private _setLifecycle(lc: EnginLifecycle): void {
    this._state = patchBaseState(this._state, { lifecycle: lc });
  }

  start(): void {
    this._setLifecycle('running');
    this._emitLifecycle('engin:started', { enginId: this._state.enginId });
  }

  pause(): void {
    this._setLifecycle('paused');
    this._emitLifecycle('engin:paused', { enginId: this._state.enginId });
  }

  resume(): void {
    this._setLifecycle('running');
    this._emitLifecycle('engin:resumed', { enginId: this._state.enginId });
  }

  stop(): void {
    this._setLifecycle('stopped');
    this._emitLifecycle('engin:stopped', { enginId: this._state.enginId });
    this.bus.destroy();
  }

  private _emitLifecycle<K extends keyof EnginLifecycleEvents>(
    event: K,
    payload: EnginLifecycleEvents[K],
  ): void {
    this.bus.emit(
      event as Parameters<typeof this.bus.emit>[0],
      payload as Parameters<typeof this.bus.emit>[1],
    );
  }

  // ─── Persistence helpers ────────────────────────────────────────────────────

  /**
   * restore()
   *
   * Loads the previously persisted domain state and applies it to the
   * current base state.  Call during component mount to hydrate.
   */
  async restore(): Promise<boolean> {
    if (this._persistenceKey === false) return false;
    const domain = await this._io.load<Record<string, unknown>>(this._persistenceKey);
    if (!domain) return false;
    this._state = patchBaseState(this._state, { domain });
    this._emitLifecycle('engin:restored', {
      enginId: this._state.enginId,
      key: this._persistenceKey,
    });
    return true;
  }

  /**
   * clearPersistedState()
   *
   * Removes the persisted domain state from storage.
   */
  async clearPersistedState(): Promise<void> {
    if (this._persistenceKey === false) return;
    await this._io.remove(this._persistenceKey);
  }
}
