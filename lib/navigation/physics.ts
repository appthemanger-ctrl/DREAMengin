// Gesture Physics Model
// Section 5: Gesture Physics Model
// Navigation behaves like damped spring with inertia

/**
 * Section 5.1: Motion Equation
 * 
 * Navigation behaves like damped spring:
 * θ'' + 2ζωθ' + ω²θ = F(t)
 * 
 * Where:
 * - θ = rotation
 * - ζ = damping (critically damped: ζ = 1)
 * - ω = natural frequency
 * - F = gesture impulse
 */

export interface PhysicsState {
  position: number;    // θ
  velocity: number;    // θ'
  acceleration: number; // θ''
}

export interface PhysicsConfig {
  damping: number;           // ζ (zeta)
  naturalFrequency: number;  // ω (omega)
  frictionConstant: number;  // β (beta) for inertia decay
}

/**
 * Default physics configuration
 * Critical damping: ζ = 1, no overshoot
 */
export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  damping: 1.0,              // Critical damping
  naturalFrequency: 10.0,    // ω = 10 rad/s
  frictionConstant: 5.0,     // β = 5 for smooth decay
};

/**
 * Compute acceleration from damped spring equation
 * θ'' = F(t) - 2ζωθ' - ω²θ
 */
export function computeAcceleration(
  state: PhysicsState,
  force: number,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): number {
  const { damping, naturalFrequency } = config;
  
  // θ'' = F(t) - 2ζωθ' - ω²θ
  return (
    force -
    2 * damping * naturalFrequency * state.velocity -
    naturalFrequency * naturalFrequency * state.position
  );
}

/**
 * Update physics state using explicit Euler integration
 * Simple and fast for real-time use
 */
export function updatePhysicsState(
  state: PhysicsState,
  force: number,
  dt: number,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): PhysicsState {
  const acceleration = computeAcceleration(state, force, config);
  
  return {
    position: state.position + state.velocity * dt,
    velocity: state.velocity + acceleration * dt,
    acceleration,
  };
}

/**
 * Section 5.2: Inertia
 * After release: v(t) = v0 * e^(-βt)
 * β = friction constant
 */
export function applyInertialDecay(
  velocity: number,
  dt: number,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): number {
  const { frictionConstant } = config;
  
  // v(t) = v0 * e^(-βt)
  return velocity * Math.exp(-frictionConstant * dt);
}

/**
 * Section 5.3: Snap Stabilization
 * If |θ| < δ: snapToGrid()
 * δ = 0.02 rad
 */
export const SNAP_THRESHOLD = 0.02; // radians

export function shouldSnapToGrid(position: number): boolean {
  return Math.abs(position) < SNAP_THRESHOLD;
}

/**
 * Snap position to nearest grid point
 * Typically snaps to 0, π/2, π, 3π/2, 2π for face alignment
 */
export function snapToGrid(
  position: number,
  gridSpacing: number = Math.PI / 2
): number {
  const gridPoint = Math.round(position / gridSpacing) * gridSpacing;
  return gridPoint;
}

/**
 * Verlet integration for better stability
 * More accurate than Euler for oscillating systems
 */
export function verletIntegration(
  currentPos: number,
  previousPos: number,
  acceleration: number,
  dt: number
): number {
  // x(t+dt) = 2*x(t) - x(t-dt) + a*dt²
  return 2 * currentPos - previousPos + acceleration * dt * dt;
}

/**
 * Runge-Kutta 4th order integration
 * Section 16: Verlet + RK4 hybrid
 * Most accurate but more expensive
 */
export function rk4Integration(
  state: PhysicsState,
  force: number,
  dt: number,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): PhysicsState {
  // RK4 for velocity
  const k1v = computeAcceleration(state, force, config);
  
  const k2State = {
    position: state.position + state.velocity * dt / 2,
    velocity: state.velocity + k1v * dt / 2,
    acceleration: 0,
  };
  const k2v = computeAcceleration(k2State, force, config);
  
  const k3State = {
    position: state.position + k2State.velocity * dt / 2,
    velocity: state.velocity + k2v * dt / 2,
    acceleration: 0,
  };
  const k3v = computeAcceleration(k3State, force, config);
  
  const k4State = {
    position: state.position + k3State.velocity * dt,
    velocity: state.velocity + k3v * dt,
    acceleration: 0,
  };
  const k4v = computeAcceleration(k4State, force, config);
  
  // Weighted average
  const newVelocity = state.velocity + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
  const newPosition = state.position + (dt / 6) * (
    state.velocity + 2 * k2State.velocity + 2 * k3State.velocity + k4State.velocity
  );
  
  return {
    position: newPosition,
    velocity: newVelocity,
    acceleration: k1v,
  };
}

/**
 * Compute impulse force from gesture
 * Converts gesture magnitude to force
 */
export function gestureToForce(
  gestureMagnitude: number,
  impulseFactor: number = 100.0
): number {
  return gestureMagnitude * impulseFactor;
}

/**
 * Apply damping to prevent overshooting
 * Useful when gesture ends
 */
export function applyDamping(
  velocity: number,
  dampingFactor: number = 0.9
): number {
  return velocity * dampingFactor;
}

/**
 * Check if motion has settled (for optimization)
 */
export function hasSettled(
  state: PhysicsState,
  positionThreshold: number = 0.001,
  velocityThreshold: number = 0.001
): boolean {
  return (
    Math.abs(state.position) < positionThreshold &&
    Math.abs(state.velocity) < velocityThreshold
  );
}

/**
 * Compute spring force for home anchor field
 * Section 8: Home Anchor Field
 */
export function computeSpringForce(
  currentPosition: number,
  targetPosition: number,
  springConstant: number = 1.0
): number {
  // Hooke's law: F = -k * (x - x0)
  return -springConstant * (currentPosition - targetPosition);
}
