/**
 * engins/manifest.ts — DaydreamEngin Registry
 *
 * Single source of truth for every DaydreamEngin unit on the platform.
 *
 * Architecture contract (see lib/engins/types.ts):
 *   - Engin  = the code/logic layer  (power under the hood)
 *   - Daydream = the visual shell     (what users experience)
 *   - Together they form one DaydreamEngin — identified by `id` here.
 *
 * The Daydream IS the user-facing UI for the Engin.
 * There is no "Side A / Side B flip" — both dream and engin
 * capabilities are surfaced through a single unified visual experience.
 */

export interface DaydreamEnginDef {
  /** Canonical identifier, e.g. 'brand', 'music' */
  id: string;
  /** Code-layer class name, e.g. 'BrandingEngin' */
  enginName: string;
  /** User-facing combined label, e.g. 'Brand DaydreamEngin' */
  displayName: string;
  /** Short tag shown in headers, e.g. 'BrandingEngin' */
  tagName: string;
  /** Emoji representing the daydream's domain */
  emoji: string;
  /** Per-engin accent hex, used for glow/highlights/tab indicators */
  accentColor: string;
  /** Short description line shown on surfaces */
  description: string;
  /** Live Next.js route for the Daydream surface */
  daydreamPath: string;
  /** Live Next.js route for the full Engin app */
  enginPath: string;
}

export const DAYDREAM_ENGINS: Readonly<Record<string, DaydreamEnginDef>> = {
  brand: {
    id: 'brand',
    enginName: 'BrandingEngin',
    displayName: 'Brand DaydreamEngin',
    tagName: 'BrandingEngin',
    emoji: '✦',
    accentColor: '#ec4899',
    description: 'Identity · AI brand kit · analytics · motion graphics',
    daydreamPath: '/daydream/brand',
    enginPath: '/engines/brand',
  },
  music: {
    id: 'music',
    enginName: 'StarMakerEngin',
    displayName: 'Music DaydreamEngin',
    tagName: 'StarMakerEngin',
    emoji: '🎵',
    accentColor: '#a855f7',
    description: 'Record · release · distribute · spatial audio · AI mastering',
    daydreamPath: '/daydream/music',
    enginPath: '/engines/music',
  },
  games: {
    id: 'games',
    enginName: 'GameEngin',
    displayName: 'Games DaydreamEngin',
    tagName: 'GameEngin',
    emoji: '🎮',
    accentColor: '#3b82f6',
    description: 'Play · compete · build worlds · AI companions · leaderboards',
    daydreamPath: '/daydream/games',
    enginPath: '/engines/games',
  },
  lab: {
    id: 'lab',
    enginName: 'LabEngin',
    displayName: 'Lab DaydreamEngin',
    tagName: 'LabEngin',
    emoji: '🔬',
    accentColor: '#22c55e',
    description: 'Experiments · simulations · quantum circuits · data viz',
    daydreamPath: '/daydream/lab',
    enginPath: '/engines/lab',
  },
  code: {
    id: 'code',
    enginName: 'CodeEngin',
    displayName: 'Code DaydreamEngin',
    tagName: 'CodeEngin',
    emoji: '💻',
    accentColor: '#6366f1',
    description: 'IDE · notebook · projects · AI co-pilot · deployments',
    daydreamPath: '/daydream/code',
    enginPath: '/engines/code',
  },
  create: {
    id: 'create',
    enginName: 'ContentEngin',
    displayName: 'Create DaydreamEngin',
    tagName: 'ContentEngin',
    emoji: '✏️',
    accentColor: '#fb923c',
    description: 'Notes · tasks · posts · scheduling · AI optimizer',
    daydreamPath: '/daydream/create',
    enginPath: '/engines/create',
  },
  forge: {
    id: 'forge',
    enginName: 'ForgeEngin',
    displayName: 'Forge DaydreamEngin',
    tagName: 'ForgeEngin',
    emoji: '🔨',
    accentColor: '#c8981a',
    description: 'Portfolio · quantum optimizer · analytics · build',
    daydreamPath: '/daydream/forge',
    enginPath: '/engines/forge',
  },
} as const;

/** Ordered list for use in menus and navigation */
export const DAYDREAM_ENGIN_LIST: DaydreamEnginDef[] = [
  DAYDREAM_ENGINS.brand,
  DAYDREAM_ENGINS.music,
  DAYDREAM_ENGINS.games,
  DAYDREAM_ENGINS.lab,
  DAYDREAM_ENGINS.code,
  DAYDREAM_ENGINS.create,
  DAYDREAM_ENGINS.forge,
];

/** Look up a DaydreamEnginDef by enginName (e.g. 'BrandingEngin') */
export function findEnginByName(enginName: string): DaydreamEnginDef | undefined {
  return DAYDREAM_ENGIN_LIST.find(e => e.enginName === enginName);
}

/** Look up a DaydreamEnginDef by daydreamType/id (e.g. 'brand') */
export function findEnginById(id: string): DaydreamEnginDef | undefined {
  return DAYDREAM_ENGINS[id];
}
