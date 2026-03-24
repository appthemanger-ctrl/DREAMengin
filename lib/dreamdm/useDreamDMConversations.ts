/**
 * useDreamDMConversations — fetch and subscribe to the current user's DreamDM
 * conversation list.
 *
 * Architecture note: lives in lib/ (Logic layer) per GENERATION_LAW §3.1.
 * Privacy: reads only conversations where auth.uid() is a participant (RLS
 * enforced at the database layer; client filter is defence-in-depth).
 *
 * docs/dreamdm_bar_pass2.md §4 — Hook layer
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

export interface DMConversation {
  id: string;
  otherUser: {
    id: string;
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
  };
  lastMessage?: string;
  updatedAt: string;
}

interface UseConversationsReturn {
  conversations: DMConversation[];
  isLoading: boolean;
  reload: () => void;
}

export function useDreamDMConversations(userId: string, initial: DMConversation[] = []): UseConversationsReturn {
  const [conversations, setConversations] = useState<DMConversation[]>(initial);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          updated_at,
          participant1_id,
          participant2_id,
          participant1:profiles!participant1_id(id, handle, display_name, avatar_url),
          participant2:profiles!participant2_id(id, handle, display_name, avatar_url)
        `)
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error || !data) return;

       
      const formatted: DMConversation[] = (data as any[]).map((conv) => {
        const other = conv.participant1_id === userId ? conv.participant2 : conv.participant1;
        return {
          id: conv.id,
          otherUser: other as DMConversation['otherUser'],
          updatedAt: conv.updated_at,
        };
      });

      setConversations(formatted);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Load conversations immediately on mount (and whenever userId changes)
    load();

    // Subscribe to conversations updates for this user
    const supabase = createClient();
    const channel = supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `participant1_id=eq.${userId}`,
        },
        (_payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => { load(); },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `participant2_id=eq.${userId}`,
        },
        (_payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => { load(); },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  return { conversations, isLoading, reload: load };
}
