// dream.homedream.transforms — state transformation functions
// Pure functions only. No side effects. No engin imports.

import { HOMEDREAM_WORLD_ID } from './dream.homedream.constants';

export interface EntityState {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

export interface HomeDreamState {
  entities: EntityState[];
  frameIndex: number;
  worldId: string;
}

export function applyDelta(
  state: HomeDreamState,
  delta: Partial<HomeDreamState>
): HomeDreamState {
  return {
    entities: delta.entities !== undefined ? delta.entities : state.entities,
    frameIndex: delta.frameIndex !== undefined ? delta.frameIndex : state.frameIndex,
    worldId: delta.worldId !== undefined ? delta.worldId : state.worldId,
  };
}

export function createInitialState(): HomeDreamState {
  return {
    entities: [],
    frameIndex: 0,
    worldId: HOMEDREAM_WORLD_ID,
  };
}