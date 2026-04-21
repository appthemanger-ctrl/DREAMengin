/**
 * lib/enginpipe/input/index.ts
 *
 * Component 12 — Unified Input & Haptics Manager
 *
 * Every DREAMengin Engin receives input from multiple sources:
 *   • Keyboard / pointer (web)
 *   • Gamepad (via Gamepad API)
 *   • Touch (mobile)
 *   • MIDI (StarMakerEngin)
 *   • DualSense haptics (GameEngin / PS5 pathway)
 *
 * This module defines the `DomainInputState` canonical struct that
 * unifies all of these into a single, serialisable snapshot, plus:
 *
 *   • `HapticsRequest`   — cross-Engin haptics command
 *   • `InputEvent`       — normalised input event (source-agnostic)
 *   • `InputManager`     — manages listeners and emits `DomainInputState`
 *
 * The HapticsManager is intentionally a pure data layer: it queues
 * `HapticsRequest` objects.  The actual vibration / DualSense trigger
 * actuation is performed by the platform adapter in the Engin shell
 * (so SSR and test environments never crash).
 *
 * Server-safe: pure TypeScript, no React, no DOM, no Node.js builtins.
 *
 * Spec: docs/enginpipe/README.md §12
 */

// ─── Input source ─────────────────────────────────────────────────────────────

export type InputSource =
  | 'keyboard'
  | 'pointer'
  | 'touch'
  | 'gamepad'
  | 'midi'
  | 'dualsense';

// ─── Normalised input event ───────────────────────────────────────────────────

export type InputEventKind =
  | 'button_down'
  | 'button_up'
  | 'axis_move'
  | 'pointer_move'
  | 'touch_start'
  | 'touch_end'
  | 'midi_note_on'
  | 'midi_note_off';

export interface InputEvent {
  readonly kind: InputEventKind;
  readonly source: InputSource;
  /** Normalised identifier (key code, button index, note number…). */
  readonly id: string | number;
  /**
   * Normalised magnitude 0–1 for analogue sources.
   * Digital sources: 0 (up) or 1 (down).
   */
  readonly value: number;
  /** Platform epoch ms. */
  readonly timestamp: number;
  /** Raw platform event for debugging (stripped in production). */
  readonly raw?: unknown;
}

// ─── DomainInputState ─────────────────────────────────────────────────────────

/**
 * DomainInputState is the canonical, serialisable snapshot of all active
 * input at a given moment.  Engins read this struct each frame / tick
 * rather than subscribing directly to DOM events.
 *
 * Axis ranges:
 *   leftStick / rightStick / leftTrigger / rightTrigger: 0.0 – 1.0
 *   Pointer position: pixels relative to the Engin viewport origin.
 */
export interface DomainInputState {
  /** Which input sources contributed to this state. */
  readonly activeSources: ReadonlySet<InputSource>;

  // ── Gamepad / DualSense axes ──────────────────────────────────────────────
  readonly leftStick:    { readonly x: number; readonly y: number };
  readonly rightStick:   { readonly x: number; readonly y: number };
  readonly leftTrigger:  number;
  readonly rightTrigger: number;

  // ── Digital buttons (gamepad + keyboard mapping) ──────────────────────────
  /** Set of currently-held button IDs. */
  readonly heldButtons: ReadonlySet<string | number>;

  // ── Pointer / touch ───────────────────────────────────────────────────────
  readonly pointer: {
    readonly x: number;
    readonly y: number;
    readonly down: boolean;
  };
  readonly touches: readonly { readonly x: number; readonly y: number; readonly id: number }[];

  // ── MIDI ──────────────────────────────────────────────────────────────────
  /** Currently-held MIDI note numbers. */
  readonly heldNotes: ReadonlySet<number>;

  // ── Metadata ──────────────────────────────────────────────────────────────
  readonly capturedAt: number;
}

// ─── Empty / zero state ───────────────────────────────────────────────────────

export function emptyInputState(): DomainInputState {
  return {
    activeSources: new Set(),
    leftStick:     { x: 0, y: 0 },
    rightStick:    { x: 0, y: 0 },
    leftTrigger:   0,
    rightTrigger:  0,
    heldButtons:   new Set(),
    pointer:       { x: 0, y: 0, down: false },
    touches:       [],
    heldNotes:     new Set(),
    capturedAt:    Date.now(),
  };
}

// ─── Haptics ──────────────────────────────────────────────────────────────────

export type HapticsChannel =
  | 'left_trigger'    // DualSense adaptive trigger L2
  | 'right_trigger'   // DualSense adaptive trigger R2
  | 'left_motor'      // Left rumble motor
  | 'right_motor';    // Right rumble motor

export type HapticsEffect =
  | 'click'           // Short tap
  | 'pulse'           // Repeating rhythm
  | 'resistance'      // Progressive trigger resistance (DualSense)
  | 'vibration'       // General rumble
  | 'none';           // Stop

export interface HapticsRequest {
  readonly channel: HapticsChannel;
  readonly effect: HapticsEffect;
  /**
   * Intensity 0.0–1.0.  0 is equivalent to effect 'none' on that channel.
   */
  readonly intensity: number;
  /**
   * Duration in milliseconds.  Omit or set to 0 for indefinite (until
   * the next request on the same channel).
   */
  readonly durationMs?: number;
  /** ISO timestamp when the request was queued. */
  readonly queuedAt: number;
}

// ─── HapticsManager ───────────────────────────────────────────────────────────

export interface HapticsManager {
  /**
   * Queue a haptics request.  The host platform adapter drains the queue
   * and actuates the hardware.
   */
  request(req: Omit<HapticsRequest, 'queuedAt'>): void;

  /** Drain and return all queued requests.  Clears the queue. */
  drain(): HapticsRequest[];

  /**
   * Return a read-only snapshot of the current queue without clearing it.
   */
  peek(): readonly HapticsRequest[];

  /** Stop all haptic effects immediately (queues a 'none' on every channel). */
  stopAll(): void;
}

export function createHapticsManager(): HapticsManager {
  const queue: HapticsRequest[] = [];

  return {
    request(req) {
      queue.push({ ...req, queuedAt: Date.now() });
    },

    drain() {
      return queue.splice(0);
    },

    peek() {
      return [...queue];
    },

    stopAll() {
      const channels: HapticsChannel[] = [
        'left_trigger', 'right_trigger', 'left_motor', 'right_motor',
      ];
      for (const channel of channels) {
        queue.push({ channel, effect: 'none', intensity: 0, queuedAt: Date.now() });
      }
    },
  };
}

// ─── InputManager ─────────────────────────────────────────────────────────────

export type InputEventListener = (event: InputEvent) => void;
export type StateChangeListener = (state: DomainInputState) => void;

export interface InputManager {
  /**
   * Feed a normalised InputEvent into the manager.
   * The manager updates its internal DomainInputState and notifies listeners.
   */
  feed(event: InputEvent): void;

  /**
   * Return the current DomainInputState snapshot.
   */
  getState(): DomainInputState;

  /**
   * Subscribe to raw InputEvents.
   */
  onEvent(listener: InputEventListener): () => void;

  /**
   * Subscribe to DomainInputState changes (emitted after every `feed` call).
   */
  onStateChange(listener: StateChangeListener): () => void;

  /**
   * The haptics manager for this input domain.
   */
  readonly haptics: HapticsManager;

  /**
   * Reset to empty input state (e.g., on focus loss or surface swap).
   */
  reset(): void;
}

/**
 * Create a new InputManager for a specific Engin domain.
 */
export function createInputManager(): InputManager {
  let state = emptyInputState();
  const eventListeners    = new Set<InputEventListener>();
  const stateListeners    = new Set<StateChangeListener>();
  const haptics           = createHapticsManager();

  function updateState(event: InputEvent): void {
    // Clone mutable parts.
    const sources    = new Set(state.activeSources);
    const held       = new Set(state.heldButtons);
    const notes      = new Set(state.heldNotes);
    let leftStick    = { ...state.leftStick };
    let rightStick   = { ...state.rightStick };
    let leftTrigger  = state.leftTrigger;
    let rightTrigger = state.rightTrigger;
    let pointer      = { ...state.pointer };
    let touches      = [...state.touches];

    sources.add(event.source);

    switch (event.kind) {
      case 'button_down':
        held.add(event.id);
        break;
      case 'button_up':
        held.delete(event.id);
        break;
      case 'axis_move': {
        // Gamepad axis IDs: 0=lx, 1=ly, 2=rx, 3=ry, 4=lt, 5=rt
        const ax = Number(event.id);
        if      (ax === 0) leftStick    = { ...leftStick,   x: event.value };
        else if (ax === 1) leftStick    = { ...leftStick,   y: event.value };
        else if (ax === 2) rightStick   = { ...rightStick,  x: event.value };
        else if (ax === 3) rightStick   = { ...rightStick,  y: event.value };
        else if (ax === 4) leftTrigger  = event.value;
        else if (ax === 5) rightTrigger = event.value;
        break;
      }
      case 'pointer_move':
        pointer = { ...pointer, x: event.value, y: Number(event.raw ?? 0) };
        break;
      case 'touch_start':
        touches = [...touches, { x: event.value, y: Number(event.raw ?? 0), id: Number(event.id) }];
        break;
      case 'touch_end':
        touches = touches.filter((t) => t.id !== Number(event.id));
        break;
      case 'midi_note_on':
        notes.add(Number(event.id));
        break;
      case 'midi_note_off':
        notes.delete(Number(event.id));
        break;
    }

    state = {
      activeSources: sources,
      leftStick,
      rightStick,
      leftTrigger,
      rightTrigger,
      heldButtons: held,
      pointer,
      touches,
      heldNotes: notes,
      capturedAt: event.timestamp,
    };
  }

  return {
    haptics,

    feed(event) {
      updateState(event);
      for (const l of eventListeners) l(event);
      for (const l of stateListeners) l(state);
    },

    getState() { return state; },

    onEvent(listener) {
      eventListeners.add(listener);
      return () => eventListeners.delete(listener);
    },

    onStateChange(listener) {
      stateListeners.add(listener);
      return () => stateListeners.delete(listener);
    },

    reset() {
      state = emptyInputState();
      for (const l of stateListeners) l(state);
    },
  };
}
