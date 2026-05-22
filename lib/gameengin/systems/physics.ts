/**
 * lib/gameengin/systems/physics.ts
 *
 * PHYSICS SYSTEMS
 *
 * Focused module: rigid-body dynamics, continuous collision detection,
 * surface material table, raycast/AABB queries.
 *
 * Re-exports from power-systems so existing imports continue to work.
 * Import from this path for tree-shaken physics-only bundles.
 */

// ─── Classes ─────────────────────────────────────────────────────────────────

export {
    AdvancedPhysicsWorld,
    PhysicsMaterialSystem
} from '../power-systems';

// ─── Types ───────────────────────────────────────────────────────────────────

export type {
    MaterialPair, PhysicsBody, PhysicsBodyDef, PhysicsBodyType, PhysicsConstraint, PhysicsMaterial, RaycastResult, ShapeType
} from '../power-systems';
