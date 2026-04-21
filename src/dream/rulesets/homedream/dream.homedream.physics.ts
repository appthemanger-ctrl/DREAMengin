// dream.homedream.physics — physics constraint definitions for HomeDream
// No engin imports. Pure definitions only.

import { HOMEDREAM_GRAVITY } from './dream.homedream.constants';

export interface PhysicsConstraint {
  entityType: string;
  maxVelocity: number;
  collisionEnabled: boolean;
}

export const HOMEDREAM_PHYSICS_CONSTRAINTS: PhysicsConstraint[] = [
  { entityType: 'player', maxVelocity: 10, collisionEnabled: true },
  { entityType: 'npc', maxVelocity: 5, collisionEnabled: true },
  { entityType: 'projectile', maxVelocity: 50, collisionEnabled: false },
  { entityType: 'static', maxVelocity: 0, collisionEnabled: true },
];

const DEFAULT_CONSTRAINT: PhysicsConstraint = {
  entityType: 'default',
  maxVelocity: HOMEDREAM_GRAVITY === 0 ? 10 : 20,
  collisionEnabled: true,
};

export function resolveConstraint(entityType: string): PhysicsConstraint {
  return (
    HOMEDREAM_PHYSICS_CONSTRAINTS.find((c) => c.entityType === entityType) ??
    DEFAULT_CONSTRAINT
  );
}
