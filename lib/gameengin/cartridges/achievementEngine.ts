/**
 * lib/gameengin/cartridges/achievementEngine.ts
 *
 * Per-cartridge achievement engine.
 *
 * Achievements are defined by each cartridge via its AchievementDefinition[].
 * Progress and unlock state is persisted in localStorage under a namespaced key.
 * The runtime exposes this as CartridgeAchievementsAPI in the GameEngineAPI.
 *
 * Features:
 *  - Binary (unlock) and progress (incremental) achievements
 *  - Persistent unlock/progress state per cartridge
 *  - Event emission for unlock notifications (HUD pop-ups)
 *  - Offline-first: all state in localStorage, syncs to Supabase when online
 *
 * Storage key: dreamge:ach:<cartridgeId>
 */

import type {
  AchievementDefinition,
  AchievementState,
  CartridgeAchievementsAPI,
} from '../cartridge';

const PREFIX = 'dreamge:ach';

type PersistedState = Record<string, {
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
}>;

function storeKey(cartridgeId: string: string {
  return `${PREFIX}:${cartridgeId}`;
}

function readState(cartridgeId: string: PersistedState {
  try {
    const raw = localStorage.getItem(storeKey(cartridgeId));
    if (!raw) return {};
    return JSON.parse(raw) as PersistedState;
  } catch {
    return {};
  }
}

function writeState(cartridgeId: string, state: PersistedState: void {
  try {
    localStorage.setItem(storeKey(cartridgeId), JSON.stringify(state));
  } catch {
    // Non-fatal
  }
}

export type AchievementUnlockListener = (achievement: AchievementDefinition) => void;

/**
 * Create a CartridgeAchievementsAPI bound to a cartridge.
 *
 * @param cartridgeId  - The cartridge's unique id (namespace key)
 * @param definitions  - The achievement registry declared by the cartridge
 * @param onUnlock     - Callback fired when an achievement is first unlocked (for HUD pop-ups)
 */
export function createAchievementsAPI(
  cartridgeId: string,
  definitions: AchievementDefinition[],
  onUnlock: AchievementUnlockListener,
): CartridgeAchievementsAPI {
  const defMap = new Map(definitions.map((d: Record<string, unknown>) => [d.id, d]));

  return {
    async unlock(id: string): Promise<void> {
      const def = defMap.get(id);
      if (!def) return;
      const state = readState(cartridgeId);
      if (state[id]?.unlocked) return; // already unlocked
      state[id] = { ...state[id], unlocked: true, unlockedAt: Date.now() };
      writeState(cartridgeId, state);
      onUnlock(def);
    },

    async progress(id: string, increment: number): Promise<void> {
      const def = defMap.get(id);
      if (!def || !def.total) return;
      const state = readState(cartridgeId);
      if (state[id]?.unlocked) return; // already done
      const current = state[id]?.progress ?? 0;
      const next = Math.min(current + increment, def.total);
      state[id] = { ...state[id], progress: next, unlocked: false };
      if (next >= def.total) {
        state[id].unlocked = true;
        state[id].unlockedAt = Date.now();
        writeState(cartridgeId, state);
        onUnlock(def);
      } else {
        writeState(cartridgeId, state);
      }
    },

    async getAll(): Promise<AchievementState[]> {
      const state = readState(cartridgeId);
      return definitions.map((def: Record<string, unknown>) => {
        const s = state[def.id];
        return {
          id: def.id,
          unlocked: s?.unlocked ?? false,
          unlockedAt: s?.unlockedAt,
          progress: s?.progress,
          total: def.total,
        };
      });
    },
  };
}

/** Wipe all achievement state for a cartridge. */
export function purgeCartridgeAchievements(cartridgeId: string: void {
  localStorage.removeItem(storeKey(cartridgeId));
}

/** Return count of unlocked achievements for a cartridge (without full API). */
export function getUnlockedCount(cartridgeId: string: number {
  const state = readState(cartridgeId);
  return Object.values(state).filter((s: Record<string, unknown>) => s.unlocked).length;
}
