// lib/ai/handlers/dreams.ts
// Dream Management Intent Handlers

import { ToolHandler } from '../tool-router';
import {
  DreamPreviewPayload,
  DreamOpenPayload,
  DreamConfigPatchPayload,
  DreamReorderPayload,
  DreamAddFromPresetPayload,
  DreamRemovePayload,
} from '@/types/ai-system';

// ============================================================================
// DREAM_PREVIEW Handler
// ============================================================================

export const handleDreamPreview: ToolHandler = async (ctx) => {
  const payload = ctx.intent.payload as unknown as DreamPreviewPayload;

  // Fetch dream metadata
  const { data: dream, error } = await ctx.supabase
    .from('widget_instances')
    .select('*')
    .eq('id', payload.dream_id)
    .single();

  if (error || !dream) {
    return {
      ok: false,
      error: {
        code: 'DREAM_NOT_FOUND',
        message: 'Dream not found',
      },
    };
  }

  return {
    ok: true,
    data: { dream },
    ui_delta: {
      open_overlay: 'PREVIEW',
      toast: {
        kind: 'info',
        message: 'Opening dream preview',
      },
    },
  };
};

// ============================================================================
// DREAM_OPEN Handler
// ============================================================================

export const handleDreamOpen: ToolHandler = async (ctx) => {
  const payload = ctx.intent.payload as unknown as DreamOpenPayload;

  return {
    ok: true,
    data: { dream_id: payload.dream_id },
    ui_delta: {
      nav_patch: [
        {
          op: 'replace',
          path: '/focus/dream_id',
          value: payload.dream_id,
        },
      ],
    },
  };
};

// ============================================================================
// DREAM_CONFIG_PATCH Handler
// ============================================================================

export const handleDreamConfigPatch: ToolHandler = async (ctx) => {
  const payload = ctx.intent.payload as unknown as DreamConfigPatchPayload;

  // Get existing dream
  const { data: existing, error: fetchError } = await ctx.supabase
    .from('widget_instances')
    .select('config_json, user_id')
    .eq('id', payload.dream_id)
    .single();

  if (fetchError || !existing) {
    return {
      ok: false,
      error: {
        code: 'DREAM_NOT_FOUND',
        message: 'Dream not found',
      },
    };
  }

  // Check ownership (redundant with capability gate, but defense in depth)
  if (existing.user_id !== ctx.actor.user_id && ctx.actor.role !== 'admin') {
    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not own this dream',
      },
    };
  }

  // Merge config
  const newConfig = {
    ...(existing.config_json as Record<string, unknown>),
    ...payload.config_patch,
  };

  // Update dream
  const { data: updated, error: updateError } = await ctx.supabase
    .from('widget_instances')
    .update({ config_json: newConfig })
    .eq('id', payload.dream_id)
    .select()
    .single();

  if (updateError) {
    return {
      ok: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update dream config',
        detail: updateError,
      },
    };
  }

  return {
    ok: true,
    data: { dream: updated },
    ui_delta: {
      toast: {
        kind: 'success',
        message: 'Dream configuration updated',
      },
    },
  };
};

// ============================================================================
// DREAM_REORDER Handler
// ============================================================================

export const handleDreamReorder: ToolHandler = async (ctx) => {
  const payload = ctx.intent.payload as unknown as DreamReorderPayload;

  // Update order for each dream
  for (let i = 0; i < payload.dream_ids.length; i++) {
    await ctx.supabase
      .from('widget_instances')
      .update({ order: i })
      .eq('id', payload.dream_ids[i])
      .eq('user_id', ctx.actor.user_id); // Ensure ownership
  }

  return {
    ok: true,
    data: { dream_ids: payload.dream_ids },
    ui_delta: {
      toast: {
        kind: 'success',
        message: 'Dreams reordered',
      },
    },
  };
};

// ============================================================================
// DREAM_ADD_FROM_PRESET Handler
// ============================================================================

export const handleDreamAddFromPreset: ToolHandler = async (ctx) => {
  const payload = ctx.intent.payload as unknown as DreamAddFromPresetPayload;

  // Get max order
  const { data: maxOrderRow } = await ctx.supabase
    .from('widget_instances')
    .select('order')
    .eq('user_id', ctx.actor.user_id)
    .order('order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = payload.position ?? ((maxOrderRow?.order ?? -1) + 1);

  // Create new dream from preset
  const { data: newDream, error } = await ctx.supabase
    .from('widget_instances')
    .insert({
      user_id: ctx.actor.user_id,
      type: payload.preset_type,
      config_json: {},
      order: nextOrder,
      enabled: true,
    })
    .select()
    .single();

  if (error) {
    return {
      ok: false,
      error: {
        code: 'CREATE_FAILED',
        message: 'Failed to create dream',
        detail: error,
      },
    };
  }

  return {
    ok: true,
    data: { dream: newDream },
    ui_delta: {
      toast: {
        kind: 'success',
        message: `Added ${payload.preset_type} dream`,
      },
    },
  };
};

// ============================================================================
// DREAM_REMOVE Handler
// ============================================================================

export const handleDreamRemove: ToolHandler = async (ctx) => {
  const payload = ctx.intent.payload as unknown as DreamRemovePayload;

  // Double-check ownership
  const { data: dream, error: fetchError } = await ctx.supabase
    .from('widget_instances')
    .select('user_id')
    .eq('id', payload.dream_id)
    .single();

  if (fetchError || !dream) {
    return {
      ok: false,
      error: {
        code: 'DREAM_NOT_FOUND',
        message: 'Dream not found',
      },
    };
  }

  if (dream.user_id !== ctx.actor.user_id && ctx.actor.role !== 'admin') {
    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not own this dream',
      },
    };
  }

  // Delete dream
  const { error: deleteError } = await ctx.supabase
    .from('widget_instances')
    .delete()
    .eq('id', payload.dream_id);

  if (deleteError) {
    return {
      ok: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete dream',
        detail: deleteError,
        },
    };
  }

  return {
    ok: true,
    data: { deleted: true },
    ui_delta: {
      toast: {
        kind: 'success',
        message: 'Dream removed',
      },
    },
  };
};
