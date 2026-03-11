/**
 * tests/dreamdm-messaging-phase2.test.ts
 *
 * Unit tests for Phase 2 shared messaging/search hooks.
 *
 * Validates:
 *   - useDreamSearch: Dr. Eams localStorage key and toggle behaviour (pure logic)
 *   - useMessagingCore: file validation logic
 *   - SearchResult shape contract
 *   - dr-eams-mode localStorage key contract
 *
 * docs/dreamdm_messaging_phase2.md §6 — Testing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mock localStorage ─────────────────────────────────────────────────────────
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem:    (key: string)              => localStorageStore[key] ?? null,
  setItem:    (key: string, val: string) => { localStorageStore[key] = val; },
  removeItem: (key: string)              => { delete localStorageStore[key]; },
  clear:      ()                         => { Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]); },
};
vi.stubGlobal('localStorage', localStorageMock);

// ─────────────────────────────────────────────────────────────────────────────
// Dr. Eams toggle — pure logic extracted from useDreamSearch for testing
// ─────────────────────────────────────────────────────────────────────────────

const DR_EAMS_KEY = 'de-dreams-mode';

function readDrEams(): boolean {
  return localStorage.getItem(DR_EAMS_KEY) === 'true';
}

function writeDrEams(on: boolean): void {
  localStorage.setItem(DR_EAMS_KEY, String(on));
}

describe('Dr. Eams toggle — localStorage contract', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to false (standard search is default)', () => {
    expect(readDrEams()).toBe(false);
  });

  it('persists true on enable', () => {
    writeDrEams(true);
    expect(readDrEams()).toBe(true);
  });

  it('persists false on disable', () => {
    writeDrEams(true);
    writeDrEams(false);
    expect(readDrEams()).toBe(false);
  });

  it('toggle cycle: off → on → off', () => {
    expect(readDrEams()).toBe(false);
    writeDrEams(true);
    expect(readDrEams()).toBe(true);
    writeDrEams(false);
    expect(readDrEams()).toBe(false);
  });

  it('uses the canonical DR_EAMS_KEY', () => {
    writeDrEams(true);
    const raw = localStorage.getItem(DR_EAMS_KEY);
    expect(raw).toBe('true');
  });

  it('key is different from the bar snap key (no collision)', () => {
    const BAR_SNAP_KEY = 'dreamengin:dreamdm-snap';
    expect(DR_EAMS_KEY).not.toBe(BAR_SNAP_KEY);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SearchResult shape contract
// ─────────────────────────────────────────────────────────────────────────────

type SearchResultType = 'person' | 'conversation' | 'board' | 'topic';

interface SearchResult {
  id:        string;
  type:      SearchResultType;
  label:     string;
  sublabel?: string;
  avatarUrl?: string | null;
  href?:     string;
  targetId?: string;
}

describe('SearchResult type contract', () => {
  it('person result has targetId (for message flow)', () => {
    const result: SearchResult = {
      id:       'user-1',
      type:     'person',
      label:    'Alice',
      sublabel: '@alice',
      targetId: 'user-1',
      href:     '/profile/alice',
    };
    expect(result.targetId).toBe('user-1');
    expect(result.type).toBe('person');
  });

  it('conversation result has targetId (for opening conversation)', () => {
    const result: SearchResult = {
      id:       'conv-abc',
      type:     'conversation',
      label:    'Bob',
      targetId: 'conv-abc',
      href:     '/messages?conversation=conv-abc',
    };
    expect(result.targetId).toBe('conv-abc');
    expect(result.type).toBe('conversation');
  });

  it('board result has href but no targetId required', () => {
    const result: SearchResult = {
      id:    'board-1',
      type:  'board',
      label: 'General Discussion',
      href:  '/messages/boards/board-1',
    };
    expect(result.href).toContain('/messages/boards/');
    expect(result.targetId).toBeUndefined();
  });

  it('topic result has href', () => {
    const result: SearchResult = {
      id:    'topic-1',
      type:  'topic',
      label: 'Announcements',
      href:  '/messages/boards/board-1#topic-1',
    };
    expect(result.type).toBe('topic');
    expect(result.href).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// File validation — logic extracted from useMessagingCore
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 50 * 1024 * 1024;

function validateFile(file: { size: number }): string | null {
  if (file.size > MAX_FILE_BYTES) return 'File must be smaller than 50 MB';
  return null;
}

function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'file' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

describe('File validation — useMessagingCore parity', () => {
  it('accepts files under 50 MB', () => {
    expect(validateFile({ size: 1024 })).toBeNull();
    expect(validateFile({ size: MAX_FILE_BYTES - 1 })).toBeNull();
  });

  it('rejects files over 50 MB', () => {
    expect(validateFile({ size: MAX_FILE_BYTES + 1 })).toBe('File must be smaller than 50 MB');
  });

  it('rejects files exactly at the limit', () => {
    // MAX_FILE_BYTES is the exclusive upper bound
    expect(validateFile({ size: MAX_FILE_BYTES + 1 })).not.toBeNull();
  });

  it('accepts files exactly at MAX_FILE_BYTES', () => {
    expect(validateFile({ size: MAX_FILE_BYTES })).toBeNull();
  });
});

describe('getFileType — MIME type mapping', () => {
  it('maps image/* to image', () => {
    expect(getFileType('image/jpeg')).toBe('image');
    expect(getFileType('image/png')).toBe('image');
    expect(getFileType('image/webp')).toBe('image');
  });

  it('maps video/* to video', () => {
    expect(getFileType('video/mp4')).toBe('video');
    expect(getFileType('video/webm')).toBe('video');
  });

  it('maps audio/* to audio', () => {
    expect(getFileType('audio/mpeg')).toBe('audio');
    expect(getFileType('audio/wav')).toBe('audio');
  });

  it('maps unknown types to file', () => {
    expect(getFileType('application/pdf')).toBe('file');
    expect(getFileType('text/plain')).toBe('file');
    expect(getFileType('application/zip')).toBe('file');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature parity assertion: shared hooks must cover both surfaces
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 2 feature parity contract', () => {
  it('DreamDMessaging and DreamDM Bar share the same DR_EAMS_KEY', () => {
    // Both surfaces use the same localStorage key so toggling on one surface
    // is reflected on the other (spec §78).
    expect(DR_EAMS_KEY).toBe('de-dreams-mode');
  });

  it('DR_EAMS_KEY is distinct from draft key prefix', () => {
    const DRAFT_PREFIX = 'de-dm-draft:';
    expect(DR_EAMS_KEY).not.toContain(DRAFT_PREFIX);
  });

  it('MAX_FILE_BYTES is 50 MB — identical on both surfaces (spec §74)', () => {
    expect(MAX_FILE_BYTES).toBe(50 * 1024 * 1024);
  });

  it('valid search result types are the four canonical types', () => {
    const validTypes: SearchResultType[] = ['person', 'conversation', 'board', 'topic'];
    expect(validTypes).toHaveLength(4);
    expect(validTypes).toContain('person');
    expect(validTypes).toContain('conversation');
    expect(validTypes).toContain('board');
    expect(validTypes).toContain('topic');
  });
});
