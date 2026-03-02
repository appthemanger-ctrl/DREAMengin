import { DREAMS } from './catalog';

// ─── Size definitions ───────────────────────────────────────────────────────
export type TileSize = 'sm' | 'wide' | 'tall' | 'lg' | 'hero' | 'L';

export const SIZE_META: Record<TileSize, { label: string; icon: string; col: number; row: number }> = {
  sm:   { label: 'Small',  icon: '▪',  col: 1, row: 1 },
  wide: { label: 'Wide',   icon: '▬',  col: 2, row: 1 },
  tall: { label: 'Tall',   icon: '▮',  col: 1, row: 2 },
  lg:   { label: 'Large',  icon: '■',  col: 2, row: 2 },
  hero: { label: 'Banner', icon: '━',  col: 4, row: 1 },
  L:    { label: 'L-shape',icon: '∟',  col: 2, row: 2 },
};

// ─── Widget kinds ────────────────────────────────────────────────────────────
export type DreamWidgetKind =
  | 'launcher' // links to a Dream route
  | 'status'   // editable status line  "is currently…"
  | 'about'    // About Me blurb
  | 'mood'     // emoji mood badge
  | 'quote'    // featured quote
  | 'music'    // music launcher with waveform vibe
  | 'links'    // custom link list
  | 'feed';    // embedded live feed snippet

// ─── Tile data ───────────────────────────────────────────────────────────────
export type BoardTile = {
  /** Unique per board — for launcher tiles matches catalog id */
  id: string;
  kind: DreamWidgetKind;
  size: TileSize;
  /** User-authored content (status text, about text, quote, etc.) */
  content?: Record<string, string>;
};

// ─── Persistence ─────────────────────────────────────────────────────────────
const BOARD_KEY = (scope: 'home' | 'profile') => `dreamengin:board:${scope}`;

export function loadBoard(scope: 'home' | 'profile'): BoardTile[] {
  try {
    const raw = localStorage.getItem(BOARD_KEY(scope));
    if (raw) return JSON.parse(raw) as BoardTile[];
  } catch { /* noop */ }
  return defaultBoard(scope);
}

export function saveBoard(scope: 'home' | 'profile', layout: BoardTile[]) {
  try { localStorage.setItem(BOARD_KEY(scope), JSON.stringify(layout)); } catch { /* noop */ }
}

// ─── Default layouts ──────────────────────────────────────────────────────────
export function defaultBoard(scope: 'home' | 'profile'): BoardTile[] {
  if (scope === 'profile') {
    return [
      { id: 'status',     kind: 'status',   size: 'hero' },
      { id: 'about',      kind: 'about',    size: 'lg'   },
      { id: 'mood',       kind: 'mood',     size: 'sm'   },
      { id: 'music',      kind: 'music',    size: 'sm'   },
      { id: 'quote',      kind: 'quote',    size: 'wide' },
      { id: 'create',     kind: 'launcher', size: 'sm'   },
      { id: 'brand',      kind: 'launcher', size: 'sm'   },
      { id: 'games',      kind: 'launcher', size: 'sm'   },
      { id: 'codespace',  kind: 'launcher', size: 'sm'   },
      { id: 'lab',        kind: 'launcher', size: 'sm'   },
      { id: 'links',      kind: 'links',    size: 'wide' },
    ];
  }
  // home default — denser, feed-first
  return [
    { id: 'status',       kind: 'status',   size: 'hero'  },
    { id: 'feed',         kind: 'feed',     size: 'lg'    },
    { id: 'mood',         kind: 'mood',     size: 'sm'    },
    { id: 'music',        kind: 'music',    size: 'sm'    },
    { id: 'about',        kind: 'about',    size: 'wide'  },
    { id: 'quote',        kind: 'quote',    size: 'wide'  },
    ...DREAMS.slice(0, 16).map((d) => ({ id: d.id, kind: 'launcher' as const, size: 'sm' as const })),
  ];
}
