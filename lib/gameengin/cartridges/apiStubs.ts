/**
 * lib/gameengin/cartridges/apiStubs.ts
 *
 * No-op stub implementations of every CartridgeAPI sub-interface.
 *
 * These are what GameRuntime provides when a capability is declared but the
 * full implementation has not been activated (e.g. 'spatial-audio' on a device
 * that doesn't support AudioContext, or 'multiplayer' before a session is joined).
 *
 * Stubs are safe to call — they log a development-mode warning once and return
 * sensible defaults so cartridge code never needs to null-check the api object.
 */

import type {
  CartridgeSaveAPI,
  CartridgeAchievementsAPI,
  CartridgeAudioAPI,
  CartridgeHapticsAPI,
  CartridgeAssetsAPI,
  CartridgeNetworkAPI,
} from '../cartridge';

function warn(capability: string, method: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[GameEngin] Cartridge called api.${capability}.${method}() but did not declare '${capability}' in capabilities[]. ` +
      `The stub no-op was used. Add '${capability}' to your cartridge capabilities to activate the real implementation.`,
    );
  }
}

// ── Save ──────────────────────────────────────────────────────────────────────

export const stubSaveAPI: CartridgeSaveAPI = {
  async list()             { warn('save', 'list'); return []; },
  async load()             { warn('save', 'load'); return null; },
  async write()            { warn('save', 'write'); },
  async erase()            { warn('save', 'erase'); },
  async autoSave()         { warn('save', 'autoSave'); },
};

// ── Achievements ──────────────────────────────────────────────────────────────

export const stubAchievementsAPI: CartridgeAchievementsAPI = {
  async unlock()           { warn('achievements', 'unlock'); },
  async progress()         { warn('achievements', 'progress'); },
  async getAll()           { warn('achievements', 'getAll'); return []; },
};

// ── Audio ─────────────────────────────────────────────────────────────────────

export const stubAudioAPI: CartridgeAudioAPI = {
  async resume()           { warn('audio', 'resume'); },
  async play()             { warn('audio', 'play'); return { stop: () => {}, setVolume: () => {} }; },
  sfx()                    { warn('audio', 'sfx'); },
  registerSFX()            { warn('audio', 'registerSFX'); },
  setMusicVolume()         { warn('audio', 'setMusicVolume'); },
  setSFXVolume()           { warn('audio', 'setSFXVolume'); },
  fadeOut()                { warn('audio', 'fadeOut'); },
};

// ── Haptics ───────────────────────────────────────────────────────────────────

export const stubHapticsAPI: CartridgeHapticsAPI = {
  rumble()                 { warn('haptics', 'rumble'); },
  tap()                    { warn('haptics', 'tap'); },
  impact()                 { warn('haptics', 'impact'); },
};

// ── Assets ────────────────────────────────────────────────────────────────────

export const stubAssetsAPI: CartridgeAssetsAPI = {
  prefetch()               { warn('assets', 'prefetch'); },
  get()                    { warn('assets', 'get'); return null; },
  resolve(path: string)    { warn('assets', 'resolve'); return path; },
};

// ── Network ───────────────────────────────────────────────────────────────────

export const stubNetworkAPI: CartridgeNetworkAPI = {
  async joinSession()      { warn('network', 'joinSession'); return ''; },
  async leaveSession()     { warn('network', 'leaveSession'); },
  broadcast()              { warn('network', 'broadcast'); },
  onMessage()              { warn('network', 'onMessage'); return () => {}; },
  getPlayers()             { warn('network', 'getPlayers'); return []; },
};
