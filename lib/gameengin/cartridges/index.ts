/**
 * lib/gameengin/cartridges/index.ts
 *
 * Public surface for the GameEngin cartridge bay. Server-safe metadata
 * (`manifest`) is re-exported directly; the client-only loader registry is
 * re-exported as well but should only be imported from `'use client'` files.
 */

export {
  CARTRIDGE_MANIFEST,
  getCartridgeManifest,
  getCartridgeCategories,
  type CartridgeManifestEntry,
  type CartridgeRenderMode,
} from './manifest';

export {
  CARTRIDGE_LOADERS,
  loadCartridge,
  getCartridgeIds,
  type CartridgeLoader,
} from './loaders';
