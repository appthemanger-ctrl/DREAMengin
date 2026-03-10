/**
 * useDreamDMDraft — localStorage-backed draft persistence for DreamDM.
 *
 * Saves the in-progress message body and subject for a conversation to
 * localStorage. Drafts survive page refresh and surface navigation.
 *
 * Key scheme:  de-dm-draft:{conversationId}
 * Value:       JSON { subject: string, body: string }
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
    };
    localStorage.setItem(buildKey(conversationId), JSON.stringify(truncated));
  } catch {
    // Storage quota exceeded or private browsing — fail silently
  }
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
      setDraft(payload);
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

  return { draft, saveDraft, clearDraft, draftRestored };
}
