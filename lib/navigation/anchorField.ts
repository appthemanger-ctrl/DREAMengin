// Home Anchor Field Module
// Section 8: Home Anchor Field
// Anchor emits attractor field that biases navigation toward home

import type { Vector3 } from './manifold';
import { SINGULARITY_THRESHOLD } from './manifold';

/**
 * Section 8.1: Potential Function
 * 
 * U(p) = k / ||p - p_home||
 * 
 * Gradient: F = -∇U
 * 
 * Used to bias navigation
 */

export interface AnchorFieldConfig {
  strength: number;       // k - field strength constant
  homePosition: Vector3;  // p_home - anchor position
  maxDistance: number;    // Maximum effective distance
  idleThreshold: number;  // Time before recenter kicks in (ms)
}

export const DEFAULT_ANCHOR_CONFIG: AnchorFieldConfig = {
  strength: 1.0,
  homePosition: { x: 0, y: 0, z: 0 },
  maxDistance: 10.0,
  idleThreshold: 3000, // 3 seconds
};

/**
 * Compute potential energy at position
 * U(p) = k / ||p - p_home||
 */
export function computePotential(
  position: Vector3,
  config: AnchorFieldConfig = DEFAULT_ANCHOR_CONFIG
): number {
  const { strength, homePosition } = config;
  
  // Compute distance to home
  const dx = position.x - homePosition.x;
  const dy = position.y - homePosition.y;
  const dz = position.z - homePosition.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  // Avoid division by zero
  if (distance < SINGULARITY_THRESHOLD) {
    return 0;
  }
  
  // U(p) = k / ||p - p_home||
  return strength / distance;
}

/**
 * Compute gradient of potential (force field)
 * F = -∇U
 * 
 * ∇U = -k * (p - p_home) / ||p - p_home||³
 * F = k * (p - p_home) / ||p - p_home||³
 */
export function computeForceField(
  position: Vector3,
  config: AnchorFieldConfig = DEFAULT_ANCHOR_CONFIG
): Vector3 {
  const { strength, homePosition, maxDistance } = config;
  
  // Compute displacement from home
  const dx = position.x - homePosition.x;
  const dy = position.y - homePosition.y;
  const dz = position.z - homePosition.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  // No force at home position
  if (distance < SINGULARITY_THRESHOLD) {
    return { x: 0, y: 0, z: 0 };
  }
  
  // Limit force at large distances
  const effectiveDistance = Math.min(distance, maxDistance);
  const distanceCubed = effectiveDistance * effectiveDistance * effectiveDistance;
  
  // F = k * (p - p_home) / ||p - p_home||³
  // Note: Force points toward home (negative gradient)
  const forceMagnitude = strength / distanceCubed;
  
  return {
    x: -forceMagnitude * dx,
    y: -forceMagnitude * dy,
    z: -forceMagnitude * dz,
  };
}

/**
 * Section 8.2: Recenter Algorithm
 * 
 * If idle > t:
 *   applyForce(F)
 * 
 * User drifts home naturally
 */
export interface RecenterState {
  lastActivityTime: number;
  isIdle: boolean;
}

export function shouldApplyRecenter(
  state: RecenterState,
  currentTime: number,
  config: AnchorFieldConfig = DEFAULT_ANCHOR_CONFIG
): boolean {
  const idleDuration = currentTime - state.lastActivityTime;
  return idleDuration > config.idleThreshold;
}

/**
 * Update recenter state when user activity is detected
 */
export function updateActivityTime(state: RecenterState, currentTime: number): RecenterState {
  return {
    lastActivityTime: currentTime,
    isIdle: false,
  };
}

/**
 * Mark as idle if threshold is exceeded
 */
export function checkIdleStatus(
  state: RecenterState,
  currentTime: number,
  config: AnchorFieldConfig = DEFAULT_ANCHOR_CONFIG
): RecenterState {
  const idleDuration = currentTime - state.lastActivityTime;
  return {
    ...state,
    isIdle: idleDuration > config.idleThreshold,
  };
}

/**
 * Compute attractor force with smooth falloff
 * Uses inverse-square law with configurable strength
 */
export function computeAttractorForce(
  position: Vector3,
  target: Vector3,
  strength: number = 1.0,
  minDistance: number = 0.1
): Vector3 {
  // Compute displacement
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const dz = target.z - position.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  // Avoid singularity at target
  if (distance < minDistance) {
    return { x: 0, y: 0, z: 0 };
  }
  
  // F ∝ 1/r²
  const forceMagnitude = strength / (distance * distance);
  
  // Normalize direction and scale by force magnitude
  return {
    x: (dx / distance) * forceMagnitude,
    y: (dy / distance) * forceMagnitude,
    z: (dz / distance) * forceMagnitude,
  };
}

/**
 * Apply force field to velocity
 * Integrates force over time step
 */
export function applyForceToVelocity(
  velocity: Vector3,
  force: Vector3,
  dt: number,
  mass: number = 1.0
): Vector3 {
  // F = ma => a = F/m
  // v' = v + a*dt
  return {
    x: velocity.x + (force.x / mass) * dt,
    y: velocity.y + (force.y / mass) * dt,
    z: velocity.z + (force.z / mass) * dt,
  };
}

/**
 * Compute smooth interpolation factor based on distance
 * Used for gradual activation of recenter force
 */
export function computeRecenterInterpolation(
  distance: number,
  minDistance: number = 0.5,
  maxDistance: number = 5.0
): number {
  // No interpolation needed if too close or too far
  if (distance <= minDistance) return 0;
  if (distance >= maxDistance) return 1;
  
  // Smooth interpolation between min and max
  const t = (distance - minDistance) / (maxDistance - minDistance);
  
  // Smoothstep: 3t² - 2t³
  return t * t * (3 - 2 * t);
}

/**
 * Compute distance from position to home
 */
export function distanceToHome(
  position: Vector3,
  config: AnchorFieldConfig = DEFAULT_ANCHOR_CONFIG
): number {
  const { homePosition } = config;
  
  const dx = position.x - homePosition.x;
  const dy = position.y - homePosition.y;
  const dz = position.z - homePosition.z;
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
