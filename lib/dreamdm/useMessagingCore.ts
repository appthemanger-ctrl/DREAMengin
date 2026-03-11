'use client';

/**
 * useMessagingCore — shared message send / attachment logic for DreamDM.
 *
 * Encapsulates:
 *   - File validation (type + size)
 *   - File upload to Supabase Storage
 *   - Optimistic message management (add / replace / remove)
 *   - REST POST to /api/messages
 *   - isSending / sendError state
 *
 * Used by both DreamDMessaging (full surface) and DreamDM Bar (compact surface)
 * so that send behaviour is identical on both surfaces (spec §21–23, §72–74).
 *
 * Architecture: Logic layer (lib/) — no UI, no component imports.
 * Privacy: media stored under userId prefix; RLS enforced at DB/storage layer.
 *
 * docs/dreamdm_messaging_phase2.md §4 — useMessagingCore
 */

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DMMessage } from './useDreamDMMessages';

// ── Types ─────────────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video' | 'audio' | 'file';

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

const BUCKET_MAP: Record<MediaType, string> = {
  image: 'images',
  video: 'videos',
  audio: 'audio',
  file:  'files',
};

export interface SendMessageParams {
  conversationId: string;
  recipientId:    string;
  /** Fully-formatted message content (body, optionally with subject header) */
  content:        string;
  /** Optional attachment to upload alongside the message */
  file?:          File | null;
  userId:         string;
}

export interface UseMessagingCoreReturn {
  isSending: boolean;
  sendError: string | null;
  /** Validate a file before attaching; returns an error string or null */
  validateFile: (file: File) => string | null;
  /** Derive MediaType from a File's MIME type */
  getFileType:  (file: File) => MediaType;
  /**
   * Send a message — handles optimistic insert, upload, API call, and cleanup.
   * Returns the confirmed DMMessage on success, null on failure.
   */
  sendMessage:    (params: SendMessageParams) => Promise<DMMessage | null>;
  clearSendError: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMessagingCore(
  /** Called immediately with an optimistic message before server confirmation */
  onOptimistic?: (msg: DMMessage) => void,
  /** Called when the server confirms the message (replaces the optimistic one) */
  onReplace?:    (tempId: string, real: DMMessage) => void,
  /** Called if the send fails (should remove the optimistic message) */
  onRemove?:     (tempId: string) => void,
): UseMessagingCoreReturn {
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // ── File helpers ──────────────────────────────────────────────────────────

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_BYTES) return 'File must be smaller than 50 MB';
    return null;
  }, []);

  const getFileType = useCallback((file: File): MediaType => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'file';
  }, []);

  // ── Upload ────────────────────────────────────────────────────────────────

  const uploadFile = useCallback(
    async (file: File, userId: string): Promise<{ url: string; type: MediaType }> => {
      const supabase  = createClient();
      const fileType  = getFileType(file);
      const bucket    = BUCKET_MAP[fileType];
      const ext       = file.name.split('.').pop() ?? 'bin';
      const filename  = `${userId}/messages/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filename, file, { cacheControl: '3600', upsert: false });

      if (error) throw new Error(`Upload failed: ${error.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filename);

      return { url: publicUrl, type: fileType };
    },
    [getFileType],
  );

  // ── Send ──────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (params: SendMessageParams): Promise<DMMessage | null> => {
      const { conversationId, recipientId, content, file, userId } = params;

      if (!content.trim() && !file) return null;
      if (!conversationId)            return null;

      // ── Demo conversations — optimistic only, no network call ─────────────
      if (conversationId.startsWith('demo-')) {
        const optimistic: DMMessage = {
          id:         `temp-${Date.now()}`,
          sender_id:  userId,
          content,
          created_at: new Date().toISOString(),
        };
        onOptimistic?.(optimistic);
        return optimistic;
      }

      setIsSending(true);
      setSendError(null);

      const tempId = `temp-${Date.now()}`;
      let mediaUrl:  string    | undefined;
      let mediaType: MediaType | undefined;

      try {
        // Upload attachment if provided
        if (file) {
          const uploaded = await uploadFile(file, userId);
          mediaUrl  = uploaded.url;
          mediaType = uploaded.type;
        }

        // Add optimistic message immediately
        const optimistic: DMMessage = {
          id:         tempId,
          sender_id:  userId,
          content,
          created_at: new Date().toISOString(),
          media_url:  mediaUrl,
          media_type: mediaType,
        };
        onOptimistic?.(optimistic);

        // POST to API — snake_case field names required by the backend schema
        const res  = await fetch('/api/messages', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            conversation_id: conversationId,
            recipient_id:    recipientId,
            content,
            media_url:       mediaUrl,
            media_type:      mediaType,
          }),
        });

        const data = await res.json();
        if (data.message) {
          onReplace?.(tempId, data.message as DMMessage);
          return data.message as DMMessage;
        } else {
          throw new Error(data.error ?? 'Send failed');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send message';
        setSendError(msg);
        onRemove?.(tempId);
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [uploadFile, onOptimistic, onReplace, onRemove],
  );

  const clearSendError = useCallback(() => setSendError(null), []);

  return { isSending, sendError, validateFile, getFileType, sendMessage, clearSendError };
}
