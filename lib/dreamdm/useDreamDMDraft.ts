/**
 * useDreamDMDraft — localStorage-backed draft persistence for DreamDM.
 *
 * Saves the in-progress message body and subject for a conversation to
 * localStorage. Drafts survive page refresh and surface navigation.
 *
 * Key scheme:  de-dm-draft:{conversationId}
 * Value:       JSON { subject: string, body: string, savedAt: number }
 *
 * Draft body is silently truncated to MAX_DRAFT_CHARS (4999) before save to
 * avoid localStorage quota errors.
 *
 * Privacy: drafts are stored client-side only in Pass 2. They are never sent
 * to the server here. The `drafts` Supabase table is provisioned but not
 * written by this hook (reserved for Pass 3 cross-device sync).
 *
 * docs/dreamdm_bar_pass2.md §2.2 — Draft Persistence
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_DRAFT_CHARS = 4999;
const STORAGE_PREFIX = 'de-dm-draft:';

export interface DraftPayload {
  subject: string;
  body: string;
  /** ── Improvement 81: savedAt timestamp ──────────────────────────────────
   * Epoch ms when this draft was last saved. Used by cleanupStaleDrafts(). */
  savedAt?: number;
}

interface UseDreamDMDraftReturn {
  /** Current draft for the active conversation (null until first restore) */
  draft: DraftPayload | null;
  /** Save the current draft; debounced 500 ms */
  saveDraft: (payload: DraftPayload) => void;
  /** Remove the draft for the given conversation (call on successful send) */
  clearDraft: (conversationId: string) => void;
  /** Whether a draft was restored for the current conversation */
  draftRestored: boolean;
  /** ── Improvement 84: age of the current draft in ms (null if none) ───── */
  draftAgeMs: number | null;
}

function buildKey(conversationId: string): string {
  return `${STORAGE_PREFIX}${conversationId}`;
}

function readDraft(conversationId: string): DraftPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(buildKey(conversationId));
    if (!raw) return null;
    return JSON.parse(raw) as DraftPayload;
  } catch {
    return null;
  }
}

function writeDraft(conversationId: string, payload: DraftPayload): void {
  if (typeof window === 'undefined') return;
  try {
    const truncated: DraftPayload = {
      subject: payload.subject,
      body: payload.body.length > MAX_DRAFT_CHARS ? payload.body.slice(0, MAX_DRAFT_CHARS) : payload.body,
      savedAt: Date.now(),
    };
    localStorage.setItem(buildKey(conversationId), JSON.stringify(truncated));
  } catch (err) {
    // ── Improvement 83: log storage quota errors instead of silently swallowing ──
    console.warn('[DreamDMDraft] Failed to persist draft', { conversationId, err });
  }
}

// ── Improvement 82: listAllDraftIds ───────────────────────────────────────────

/**
 * Return the conversation IDs of all drafts currently in localStorage.
 * Useful for rendering a "You have unsent drafts" indicator or a draft manager UI.
 */
export function listAllDraftIds(): string[] {
  if (typeof window === 'undefined') return [];
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      ids.push(key.slice(STORAGE_PREFIX.length));
    }
  }
  return ids;
}

// ── Improvement 83: cleanupStaleDrafts ───────────────────────────────────────

/**
 * Remove draft entries older than `maxAgeDays` days from localStorage.
 * Drafts without a `savedAt` timestamp are also removed (legacy entries).
 * Returns the array of conversation IDs that were removed.
 */
export function cleanupStaleDrafts(maxAgeDays: number): string[] {
  if (typeof window === 'undefined') return [];
  const cutoff = Date.now() - maxAgeDays * 86_400_000;
  const removed: string[] = [];
  for (const convId of listAllDraftIds()) {
    const draft = readDraft(convId);
    if (!draft || !draft.savedAt || draft.savedAt < cutoff) {
      localStorage.removeItem(buildKey(convId));
      removed.push(convId);
    }
  }
  return removed;
}

// ── Improvement 84: getDraftAge ───────────────────────────────────────────────

/**
 * Return how old the draft for a conversation is in milliseconds, or null
 * if no draft exists. Useful for UI indicators like "Draft saved 3h ago".
 */
export function getDraftAge(conversationId: string): number | null {
  const draft = readDraft(conversationId);
  if (!draft || !draft.savedAt) return null;
  return Date.now() - draft.savedAt;
}

export function useDreamDMDraft(conversationId: string | null): UseDreamDMDraftReturn {
  const [draft, setDraft] = useState<DraftPayload | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft whenever conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setDraft(null);
      setDraftRestored(false);
      return;
    }
    const saved = readDraft(conversationId);
    setDraft(saved);
    // Show "Draft restored" indicator briefly if a non-empty draft was found
    if (saved && (saved.body.trim() || saved.subject.trim())) {
      setDraftRestored(true);
      const timer = setTimeout(() => setDraftRestored(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [conversationId]);

  const saveDraft = useCallback((payload: DraftPayload) => {
    if (!conversationId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      writeDraft(conversationId, payload);
      setDraft({ ...payload, savedAt: Date.now() });
    }, 500);
  }, [conversationId]);

  const clearDraft = useCallback((convId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(buildKey(convId));
    }
    if (convId === conversationId) {
      setDraft(null);
      setDraftRestored(false);
    }
  }, [conversationId]);

  // Clear debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Improvement 84: draftAgeMs ────────────────────────────────────────────
  const draftAgeMs = draft?.savedAt ? Date.now() - draft.savedAt : null;

  return { draft, saveDraft, clearDraft, draftRestored, draftAgeMs };
}
