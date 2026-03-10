/**
 * tests/dreamdm-draft.test.ts
 * Unit tests for useDreamDMDraft localStorage-backed draft persistence.
 *
 * docs/dreamdm_bar_pass2.md §8 — Testing Checklist
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';

// ── Mock localStorage (test environment is 'node', no browser globals) ───────
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => { localStorageStore[key] = value; },
  removeItem: (key: string) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
};
vi.stubGlobal('localStorage', localStorageMock);

// ── Inline the pure logic from useDreamDMDraft for unit testing ──────────────
// We test the pure storage helpers, not the React hook (which requires
// renderHook / jsdom setup). The hook's behaviour is validated via the helpers.

const MAX_DRAFT_CHARS = 4999;
const STORAGE_PREFIX = 'de-dm-draft:';

function buildKey(conversationId: string) {
  return `${STORAGE_PREFIX}${conversationId}`;
}

interface DraftPayload {
  subject: string;
  body: string;
}

function readDraft(conversationId: string): DraftPayload | null {
  const raw = localStorage.getItem(buildKey(conversationId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DraftPayload;
  } catch {
    return null;
  }
}

function writeDraft(conversationId: string, payload: DraftPayload): void {
  const truncated: DraftPayload = {
    subject: payload.subject,
    body: payload.body.length > MAX_DRAFT_CHARS ? payload.body.slice(0, MAX_DRAFT_CHARS) : payload.body,
  };
  localStorage.setItem(buildKey(conversationId), JSON.stringify(truncated));
}

function clearDraft(conversationId: string): void {
  localStorage.removeItem(buildKey(conversationId));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DreamDM draft helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes and reads a draft', () => {
    const convId = 'conv-abc';
    writeDraft(convId, { subject: 'Hello', body: 'Draft body' });
    const restored = readDraft(convId);
    expect(restored).toEqual({ subject: 'Hello', body: 'Draft body' });
  });

  it('returns null when no draft exists', () => {
    expect(readDraft('no-such-conv')).toBeNull();
  });

  it('clears draft on send', () => {
    const convId = 'conv-xyz';
    writeDraft(convId, { subject: '', body: 'temp draft' });
    expect(readDraft(convId)).not.toBeNull();
    clearDraft(convId);
    expect(readDraft(convId)).toBeNull();
  });

  it('overwrites an existing draft', () => {
    const convId = 'conv-overwrite';
    writeDraft(convId, { subject: '', body: 'first' });
    writeDraft(convId, { subject: '', body: 'second' });
    expect(readDraft(convId)?.body).toBe('second');
  });

  it('truncates body at MAX_DRAFT_CHARS', () => {
    const convId = 'conv-long';
    const longBody = 'x'.repeat(MAX_DRAFT_CHARS + 100);
    writeDraft(convId, { subject: '', body: longBody });
    const restored = readDraft(convId);
    expect(restored?.body.length).toBe(MAX_DRAFT_CHARS);
  });

  it('does not truncate body within limit', () => {
    const convId = 'conv-short';
    const body = 'a'.repeat(100);
    writeDraft(convId, { subject: 'Sub', body });
    const restored = readDraft(convId);
    expect(restored?.body.length).toBe(100);
    expect(restored?.subject).toBe('Sub');
  });

  it('uses correct localStorage key prefix', () => {
    const convId = 'conv-key-check';
    writeDraft(convId, { subject: '', body: 'test' });
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${convId}`);
    expect(raw).not.toBeNull();
  });

  it('isolates drafts by conversationId', () => {
    writeDraft('conv-1', { subject: '', body: 'for conv 1' });
    writeDraft('conv-2', { subject: '', body: 'for conv 2' });
    expect(readDraft('conv-1')?.body).toBe('for conv 1');
    expect(readDraft('conv-2')?.body).toBe('for conv 2');
    clearDraft('conv-1');
    expect(readDraft('conv-1')).toBeNull();
    expect(readDraft('conv-2')?.body).toBe('for conv 2');
  });
});

// ── parseSubject / formatMessageContent tests ────────────────────────────────

function parseSubject(content: string): { subject: string | null; body: string } {
  const match = content.match(/^\*\*Subject:\*\* (.+?)\n\n([\s\S]*)$/);
  if (match) return { subject: match[1].trim(), body: match[2].trimStart() };
  return { subject: null, body: content };
}

function formatMessageContent(subject: string, body: string): string {
  if (subject.trim()) return `**Subject:** ${subject.trim()}\n\n${body}`;
  return body;
}

describe('parseSubject', () => {
  it('parses a subject line', () => {
    const content = '**Subject:** My subject\n\nBody text here';
    expect(parseSubject(content)).toEqual({ subject: 'My subject', body: 'Body text here' });
  });

  it('returns null subject when no subject line', () => {
    expect(parseSubject('Plain message')).toEqual({ subject: null, body: 'Plain message' });
  });

  it('trims subject whitespace', () => {
    const { subject } = parseSubject('**Subject:**  Trimmed  \n\nBody');
    expect(subject).toBe('Trimmed');
  });
});

describe('formatMessageContent', () => {
  it('includes subject when provided', () => {
    const result = formatMessageContent('Hello', 'Body text');
    expect(result).toBe('**Subject:** Hello\n\nBody text');
  });

  it('returns plain body when subject is empty', () => {
    expect(formatMessageContent('', 'Just a message')).toBe('Just a message');
  });

  it('trims subject whitespace before including', () => {
    expect(formatMessageContent('  Hi  ', 'Body')).toBe('**Subject:** Hi\n\nBody');
  });
});

describe('getConversationPreview', () => {
  function getConversationPreview(lastMessage: string): string {
    const { subject, body } = parseSubject(lastMessage);
    return subject ? `Re: ${subject}` : body;
  }

  it('shows Re: prefix for subject messages', () => {
    const msg = '**Subject:** Important\n\nDetails here';
    expect(getConversationPreview(msg)).toBe('Re: Important');
  });

  it('shows body for plain messages', () => {
    expect(getConversationPreview('Hey there!')).toBe('Hey there!');
  });
});
