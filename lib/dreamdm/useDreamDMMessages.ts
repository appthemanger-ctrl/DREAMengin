/**
 * useDreamDMMessages — fetch and subscribe to messages for a DreamDM conversation.
 *
 * Establishes a Supabase Realtime channel for the given conversationId so new
 * messages appear instantly without polling. The channel is torn down when the
 * conversationId changes or the component unmounts.
 *
 * Deduplication: incoming realtime events are merged by `id` so optimistic
 * messages are replaced cleanly without duplication.
 *
 * Architecture note: lives in lib/ (Logic layer) per GENERATION_LAW §3.1.
 * Privacy: RLS on messages enforces participant-only access at the DB layer.
 *
 * docs/dreamdm_bar_pass2.md §2.1 — Realtime Messaging
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

export interface DMMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | 'audio' | 'file' | null;
  sender?: {
    id: string;
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
  } | null;
}

interface UseMessagesReturn {
  messages: DMMessage[];
  isLoading: boolean;
  /** Append an optimistic message before the server confirms it */
  addOptimistic: (msg: DMMessage) => void;
  /** Replace an optimistic message once the real one arrives */
  replaceOptimistic: (tempId: string, real: DMMessage) => void;
  /** Remove an optimistic message (on send failure) */
  removeOptimistic: (tempId: string) => void;
}

export function useDreamDMMessages(
  conversationId: string | null,
  isDemoConversation: boolean,
  demoMessages: DMMessage[],
): UseMessagesReturn {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  const addOptimistic = useCallback((msg: DMMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const replaceOptimistic = useCallback((tempId: string, real: DMMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === tempId ? real : m)));
  }, []);

  const removeOptimistic = useCallback((tempId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    // Demo conversations are handled separately — no realtime subscription
    if (isDemoConversation) return;

    const supabase = createClient();

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/messages?conversation_id=${conversationId}`);
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages on this conversation
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresInsertPayload<DMMessage>) => {
          const newMsg = payload.new as DMMessage;
          setMessages((prev) => {
            // Avoid duplicate if already present (e.g., from optimistic insert)
            const exists = prev.some((m) => m.id === newMsg.id);
            if (exists) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, isDemoConversation]);

  // Populate demo messages when a demo conversation is selected
  useEffect(() => {
    if (isDemoConversation && conversationId) {
      setMessages(demoMessages);
    }
  // demoMessages is defined outside the component (stable reference)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, isDemoConversation]);

  return { messages, isLoading, addOptimistic, replaceOptimistic, removeOptimistic };
}
