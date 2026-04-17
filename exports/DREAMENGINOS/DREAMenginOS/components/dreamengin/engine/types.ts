// components/dreamengin/engine/types.ts

import type { UnitComplex } from './math';

export type Depth = 0 | 1;

export type FlightMode = 'in' | 'out';

export interface FlightState {
  active: boolean;
  mode: FlightMode;
  // normalized 0..1 (computed from upward drag distance)
  thrust: number;
  // radians per frame, accumulated by steer input (applied inside render loop)
  steerDelta: number;
}

export interface EngineState {
  // Toroidal world position (camera target) in pixels.
  x: number;
  y: number;

  // Inspection zoom. Not navigation.
  scale: number;

  // Binary context depth: 0 base, 1 day layer.
  depth: Depth;

  // Yaw as unit complex (cosθ, sinθ) to avoid angle drift.
  yawQ: UnitComplex;

  flight: FlightState;

  // When true: UI overlays are open and navigation must not update.
  overlayLock: boolean;
}
