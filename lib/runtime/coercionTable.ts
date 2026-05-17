/**
 * lib/runtime/coercionTable.ts — Pass 6
 *
 * Universal Drag/Drop Coercion Table
 *
 * When content is dragged into any runtime region, the raw DataTransfer or
 * custom payload is coerced into a typed DreamDrop before being routed to the
 * Universal Editor or the seam clipboard.
 *
 * Starter types (decision #4 from COOP_AND_SOLO_ROADMAP.md):
 *   image, video, audio, text/code, url, engin-state
 *
 * Everything outside this list is routed through the 'unknown' fallback which
 * surfaces it as a raw text/JSON payload in the Universal Editor.
 *
 * Architecture: docs/ARCHITECTURE.md §6 (Pass 6 — Universal drag/drop).
 */

// ── Drop types ────────────────────────────────────────────────────────────────

/** The canonical payload types recognised by the Universal Editor. */
export type DreamDropType =
  | 'image'
  | 'video'
  | 'audio'
  | 'text/code'
  | 'url'
  | 'engin-state'
  | 'unknown';

/** A fully coerced drop payload — safe to hand to the Universal Editor. */
export interface DreamDrop {
  /** Canonical type used for routing. */
  type: DreamDropType;
  /** Raw content: URL for media/url types, text for text/code, JSON string for engin-state. */
  content: string;
  /** Original MIME type from the DataTransfer, if available. */
  mimeType?: string;
  /** Source filename if the drop originated from the file system. */
  filename?: string;
  /** Wall-clock ms when the drop was received. */
  timestamp: number;
}

// ── MIME → DreamDropType mapping ──────────────────────────────────────────────

/** Maps known MIME type prefixes/exact values to canonical DreamDropTypes. */
const MIME_MAP: Array<[pattern: RegExp, type: DreamDropType]> = [
  [/^image\//,           'image'],
  [/^video\//,           'video'],
  [/^audio\//,           'audio'],
  [/^text\/html$/,       'text/code'],
  [/^text\/css$/,        'text/code'],
  [/^text\/javascript$/, 'text/code'],
  [/^application\/json$/, 'text/code'],
  [/^text\/plain$/,      'text/code'],
  [/^application\/x-dream-engin-state$/, 'engin-state'],
];

function mimeToDropType(mime: string: DreamDropType {
  for (const [pattern, type] of MIME_MAP) {
    if (pattern.test(mime)) return type;
  }
  return 'unknown';
}

// ── File-extension fallback ───────────────────────────────────────────────────

const EXT_MAP: Record<string, DreamDropType> = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image', avif: 'image',
  mp4: 'video', webm: 'video', mov: 'video', mkv: 'video',
  mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio', aac: 'audio',
  js: 'text/code', ts: 'text/code', tsx: 'text/code', jsx: 'text/code',
  css: 'text/code', html: 'text/code', json: 'text/code', md: 'text/code',
  txt: 'text/code',
};

function extToDropType(filename: string: DreamDropType {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MAP[ext] ?? 'unknown';
}

// ── URL heuristic ─────────────────────────────────────────────────────────────

function isUrl(value: string: boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'blob:';
  } catch {
    return false;
  }
}

// ── Main coercion entry points ────────────────────────────────────────────────

/**
 * coerceDataTransfer(dt)
 *
 * Coerce a browser DataTransfer object into a DreamDrop.
 * Inspects items, files, and text in priority order.
 */
export function coerceDataTransfer(dt: DataTransfer: DreamDrop {
  const ts = Date.now();

  // 1. File drop — inspect first file's MIME type.
  if (dt.files.length > 0) {
    const file = dt.files[0];
    if (file) {
      const type = file.type ? mimeToDropType(file.type) : extToDropType(file.name);
      return {
        type,
        content: URL.createObjectURL(file),
        mimeType: file.type || undefined,
        filename: file.name,
        timestamp: ts,
      };
    }
  }

  // 2. Typed items — walk in priority order (application types first).
  for (const item of Array.from(dt.items)) {
    if (item.kind !== 'string') continue;
    const dropType = mimeToDropType(item.type);
    if (dropType !== 'unknown') {
      // We can only read string items synchronously via getData.
      const content = dt.getData(item.type);
      return { type: dropType, content, mimeType: item.type, timestamp: ts };
    }
  }

  // 3. Plain text — check if it looks like a URL.
  const plainText = dt.getData('text/plain');
  if (plainText) {
    if (isUrl(plainText)) {
      return { type: 'url', content: plainText.trim(), mimeType: 'text/plain', timestamp: ts };
    }
    return { type: 'text/code', content: plainText, mimeType: 'text/plain', timestamp: ts };
  }

  return { type: 'unknown', content: '', timestamp: ts };
}

/**
 * coerceRawPayload(payload)
 *
 * Coerce an arbitrary object (e.g. from a cross-runtime bridge event or the
 * seam clipboard) into a DreamDrop.
 */
export function coerceRawPayload(payload: unknown: DreamDrop {
  const ts = Date.now();

  if (!payload || typeof payload !== 'object') {
    const str = String(payload ?? '');
    return {
      type: isUrl(str) ? 'url' : 'text/code',
      content: str,
      timestamp: ts,
    };
  }

  const p = payload as Record<string, unknown>;

  // Already a DreamDrop — pass through.
  if (typeof p['type'] === 'string' && typeof p['content'] === 'string' && p['timestamp']) {
    return p as unknown as DreamDrop;
  }

  // engin-state shape.
  if (typeof p['engin'] === 'string' || typeof p['enginState'] === 'string') {
    return { type: 'engin-state', content: JSON.stringify(payload), timestamp: ts };
  }

  // URL shape.
  if (typeof p['url'] === 'string') {
    return { type: 'url', content: p['url'], timestamp: ts };
  }

  // Fallback: serialise as JSON for the Universal Editor.
  return { type: 'unknown', content: JSON.stringify(payload), timestamp: ts };
}

/**
 * classifyDrop(drop)
 *
 * Returns a human-readable label for a DreamDrop type. Used in UI affordances.
 */
export function classifyDrop(drop: DreamDrop: string {
  const labels: Record<DreamDropType, string> = {
    'image':       'Image',
    'video':       'Video',
    'audio':       'Audio',
    'text/code':   'Text / Code',
    'url':         'URL',
    'engin-state': 'Engin State',
    'unknown':     'Unknown',
  };
  return labels[drop.type] ?? 'Unknown';
}
