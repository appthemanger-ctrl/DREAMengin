import { CARTRIDGE_MANIFEST } from '@/lib/gameengin/cartridges/manifest';
import type { GameRenderMode } from '@/lib/games/performance-baseline';
import type { MobileHudMode } from '@/lib/games/mobileControls';

const MOBILE_HUD_BY_GAME_ID: Record<string, MobileHudMode> = {
  platformer: 'buttons',
  'echo-arena': 'joystick',
};

export interface GameCatalogEntry {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  category: string;
  color: string;
  renderMode: GameRenderMode;
  subtitle?: string;
  mobileHudMode?: MobileHudMode;
  href?: string;
}

export const GAME_CATALOG: readonly GameCatalogEntry[] = CARTRIDGE_MANIFEST.map((cartridge) => ({
  id: cartridge.id,
  emoji: cartridge.emoji,
  label: cartridge.label,
  desc: cartridge.description,
  category: cartridge.category,
  color: cartridge.color,
  renderMode: cartridge.renderMode,
  subtitle: cartridge.subtitle,
  mobileHudMode: MOBILE_HUD_BY_GAME_ID[cartridge.id],
}));

export const GAME_CATALOG_IDS = GAME_CATALOG.map((game) => game.id);
