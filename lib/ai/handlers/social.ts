// lib/ai/handlers/social.ts
// Social and Content Intent Handlers

import { ToolHandler } from '../tool-router';
import {
  PostCreatePayload,
  PostLikePayload,
  FollowUserPayload,
  SearchPayload,
  DraftSavePayload,
} from '@/types/ai-system';
import { randomUUID } from 'crypto';

// ============================================================================
// POST_CREATE Handler
// ============================================================================

export const handlePostCreate: ToolHandler = async (ctx) => {
  const payload = ctx.intent.payload as unknown as PostCreatePayload;

  const { data: post, error } = await ctx.supabase
    .from('app_posts')
    .insert({
      user_id: ctx.actor.user_id,
      content: payload.content,
      media_json: payload.media_json,
      visibility: payload.visibility ?? 'followers',
    })
    .select()
    .single();

  if (error) {
    return {
      ok: false,
      error: {
        code: 'POST_CREATE_FAILED',
        message: 'Failed to create post',
        detail: error,
      },
    };
  }

  return {
    ok: true,
    data: { post },
    ui_delta: {
      toast: {
        kind: 'success',
        message: 'Post created',
      },
    },
  };
};

// ============================================================================
// POST_LIKE Handler
// ============================================================================

export const handlePostLike: ToolHandler = async (ctx) => {
  const payload = ctx.intent.payload as unknown as PostLikePayload;

  // Check if already liked (idempotent)
  const { data: existing } = await ctx.supabase
    .from('likes')
    .select('id')
    .eq('user_id', ctx.actor.user_id)
    .eq('post_id', payload.post_id)
    .single();

  if (existing) {
    return {
      ok: true,
      data: { already_liked: true },
      ui_delta: {
        toast: {
          kind: 'info',
          message: 'Already liked',
        },
      },
    };
  }

  // Create like
  const { error } = await ctx.supabase.from('likes').insert({
    user_id: ctx.actor.user_id,
    post_id: payload.post_id,
  });

  if (error) {
    return {
      ok: false,
      error: {
        code: 'LIKE_FAILED',
        message: 'Failed to like post',
        detail: error,
      },
    };
  }

  return {
    ok: true,
    data: { liked: true },
    ui_delta: {
      toast: {
        kind: 'success',
        message: 'Post liked',
      },
    },
  };
};

// ============================================================================
// FOLLOW_USER Handler
// ============================================================================

export const handleFollowUser: ToolHandler = async (ctx) => {
  const payload = ctx.intent.payload as unknown as FollowUserPayload;

  // Check if already following (idempotent)
  const { data: existing } = await ctx.supabase
    .from('follows')
    .select('*')
    .eq('follower_id', ctx.actor.user_id)
    .eq('followed_id', payload.user_id)
    .single();

  if (existing) {
    return {
      ok: true,
      data: { already_following: true },
      ui_delta: {
        toast: {
          kind: 'info',
          message: 'Already following',
        },
      },
    };
  }

  // Create follow
  const { error } = await ctx.supabase.from('follows').insert({
    follower_id: ctx.actor.user_id,
    followed_id: payload.user_id,
  });

  if (error) {
    return {
      ok: false,
      error: {
        code: 'FOLLOW_FAILED',
        message: 'Failed to follow user',
        detail: error,
      },
    };
  }

  return {
    ok: true,
    data: { following: true },
    ui_delta: {
      toast: {
        kind: 'success',
        message: 'Now following',
      },
    },
  };
};

// ============================================================================
// SEARCH Handler
// ============================================================================

export const handleSearch: ToolHandler = async (ctx) => {
  const payload = ctx.intent.payload as unknown as SearchPayload;
  const scope = payload.scope ?? 'all';

  const results: Record<string, unknown[]> = {};

  // Search posts
  if (scope === 'posts' || scope === 'all') {
    const { data: posts } = await ctx.supabase
      .from('app_posts')
      .select('*')
      .textSearch('content', payload.query)
      .limit(10);

    results.posts = posts ?? [];
  }

  // Search users
  if (scope === 'users' || scope === 'all') {
    const { data: users } = await ctx.supabase
      .from('profiles')
      .select('id, handle, display_name, avatar_url')
      .or(`handle.ilike.%${payload.query}%,display_name.ilike.%${payload.query}%`)
      .limit(10);

    results.users = users ?? [];
  }

  return {
    ok: true,
    data: { results, query: payload.query },
  };
};

// ============================================================================
// DRAFT_SAVE Handler
// ============================================================================

export const handleDraftSave: ToolHandler = async (ctx) => {
  const payload = ctx.intent.payload as unknown as DraftSavePayload;

  // Store draft in ai_memories
  const draftId = payload.draft_id ?? randomUUID();

  const { error } = await ctx.supabase.from('ai_memories').upsert({
    user_id: ctx.actor.user_id,
    agent: 'dr_eams',
    scope: 'drafts',
    key: draftId,
    value: {
      content: payload.content,
      context: payload.context,
      saved_at: ctx.now,
    },
  });

  if (error) {
    return {
      ok: false,
      error: {
        code: 'DRAFT_SAVE_FAILED',
        message: 'Failed to save draft',
        detail: error,
      },
    };
  }

  return {
    ok: true,
    data: { draft_id: draftId },
    ui_delta: {
      toast: {
        kind: 'success',
        message: 'Draft saved',
      },
    },
  };
};
