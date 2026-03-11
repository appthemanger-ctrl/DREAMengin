// lib/ai/capability-gate.ts
// RBAC + ABAC Capability Gate
// DB-backed authorization checks

import { ActorContext, IntentType } from '@/types/ai-system';
import { createServerClient } from '@/lib/supabase/server';
import { isOwnerEmail } from '@/lib/ai/triad';

// ============================================================================
// ROLE RANKS
// ============================================================================

const ROLE_RANKS: Record<string, number> = {
  user: 0,
  admin: 10,
  system: 20,
};

export function getRoleRank(role: string): number {
  return ROLE_RANKS[role] ?? 0;
}

// ============================================================================
// BUILD ACTOR CONTEXT
// ============================================================================

export async function buildActorContext(userId: string): Promise<ActorContext> {
  const supabase = await createServerClient();

  // Get authenticated user to check email for owner admin role
  const { data: { user } } = await supabase.auth.getUser();

  // Owner email always gets admin role, regardless of DB state
  let role = 'user';
  if (user && isOwnerEmail(user.email)) {
    role = 'admin';
  } else {
    // Get user role from DB
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    role = roleData?.role ?? 'user';
  }

  // Get capabilities (from DB function)
  const { data: capsData } = await supabase.rpc('get_user_capabilities', {
    p_user_id: userId,
  });

  const caps = capsData ?? ['user:follow', 'user:post', 'user:dream_manage'];

  // Get space memberships (if you have spaces/workspaces)
  // For now, returning empty array
  const space_memberships: string[] = [];

  return {
    user_id: userId,
    role: role as 'user' | 'admin' | 'system',
    caps,
    space_memberships,
    issued_at: new Date().toISOString(),
  };
}

// ============================================================================
// CAPABILITY CHECKS
// ============================================================================

export function hasCapability(actor: ActorContext, capability: string): boolean {
  // System role has all capabilities
  if (actor.role === 'system') return true;

  // Check for wildcard
  if (actor.caps.includes('*')) return true;

  // Check for specific capability
  return actor.caps.includes(capability);
}

export function meetsMinimumRole(actor: ActorContext, minRole: string): boolean {
  const actorRank = getRoleRank(actor.role);
  const minRank = getRoleRank(minRole);
  return actorRank >= minRank;
}

// ============================================================================
// INTENT AUTHORIZATION
// ============================================================================

interface IntentRequirement {
  min_rank: number;
  capabilities?: string[];
  resource_checks?: (actor: ActorContext, payload: Record<string, unknown>) => Promise<boolean>;
}

// Define requirements for each intent type
const INTENT_REQUIREMENTS: Partial<Record<IntentType, IntentRequirement>> = {
  // Dr. Eams intents - user level
  NAV_DELTA: {
    min_rank: ROLE_RANKS.user,
  },
  HOME_ANCHOR_SET_STATE: {
    min_rank: ROLE_RANKS.user,
  },
  HOME_MENU_OPEN: {
    min_rank: ROLE_RANKS.user,
  },
  DREAM_PREVIEW: {
    min_rank: ROLE_RANKS.user,
  },
  DREAM_OPEN: {
    min_rank: ROLE_RANKS.user,
  },
  DREAM_CONFIG_PATCH: {
    min_rank: ROLE_RANKS.user,
    capabilities: ['user:dream_manage'],
    resource_checks: async (actor, payload) => {
      // Check ownership of dream
      const dreamId = payload.dream_id as string | undefined;
      if (!dreamId) return false;

      const supabase = await createServerClient();
      const { data } = await supabase
        .from('widget_instances')
        .select('user_id')
        .eq('id', dreamId)
        .single();

      // Allow if owner or admin
      return data?.user_id === actor.user_id || actor.role === 'admin';
    },
  },
  DREAM_REORDER: {
    min_rank: ROLE_RANKS.user,
    capabilities: ['user:dream_manage'],
  },
  DREAM_ADD_FROM_PRESET: {
    min_rank: ROLE_RANKS.user,
    capabilities: ['user:dream_manage'],
  },
  DREAM_REMOVE: {
    min_rank: ROLE_RANKS.user,
    capabilities: ['user:dream_manage'],
    resource_checks: async (actor, payload) => {
      const dreamId = payload.dream_id as string | undefined;
      if (!dreamId) return false;

      const supabase = await createServerClient();
      const { data } = await supabase
        .from('widget_instances')
        .select('user_id')
        .eq('id', dreamId)
        .single();

      return data?.user_id === actor.user_id || actor.role === 'admin';
    },
  },
  POST_CREATE: {
    min_rank: ROLE_RANKS.user,
    capabilities: ['user:post'],
  },
  POST_LIKE: {
    min_rank: ROLE_RANKS.user,
  },
  FOLLOW_USER: {
    min_rank: ROLE_RANKS.user,
    capabilities: ['user:follow'],
  },
  SEARCH: {
    min_rank: ROLE_RANKS.user,
  },
  DRAFT_SAVE: {
    min_rank: ROLE_RANKS.user,
  },

  // iDari intents - admin only
  DIAG_SCHEMA_SNAPSHOT: {
    min_rank: ROLE_RANKS.admin,
    capabilities: ['admin:diagnostics'],
  },
  DIAG_RLS_SNAPSHOT: {
    min_rank: ROLE_RANKS.admin,
    capabilities: ['admin:diagnostics'],
  },
  DIAG_CODE_REFERENCE_SCAN: {
    min_rank: ROLE_RANKS.admin,
    capabilities: ['admin:diagnostics'],
  },
  DIAG_ENV_CHECKLIST: {
    min_rank: ROLE_RANKS.admin,
    capabilities: ['admin:diagnostics'],
  },
  ADMIN_PATCH_PROPOSAL: {
    min_rank: ROLE_RANKS.admin,
    capabilities: ['admin:proposals'],
  },
  ADMIN_MIGRATION_PROPOSAL: {
    min_rank: ROLE_RANKS.admin,
    capabilities: ['admin:proposals'],
  },
  MODERATION_FLAG_CONTENT: {
    min_rank: ROLE_RANKS.admin,
    capabilities: ['admin:moderate'],
  },
};

export async function authorizeIntent(
  actor: ActorContext,
  intentType: IntentType,
  payload: Record<string, unknown>
): Promise<{ authorized: boolean; reason?: string }> {
  const requirement = INTENT_REQUIREMENTS[intentType];

  // If no specific requirement, default to user level
  if (!requirement) {
    return { authorized: getRoleRank(actor.role) >= ROLE_RANKS.user };
  }

  // Check minimum rank
  if (getRoleRank(actor.role) < requirement.min_rank) {
    return {
      authorized: false,
      reason: `Requires minimum role rank ${requirement.min_rank}`,
    };
  }

  // Check capabilities
  if (requirement.capabilities) {
    for (const cap of requirement.capabilities) {
      if (!hasCapability(actor, cap)) {
        return {
          authorized: false,
          reason: `Missing capability: ${cap}`,
        };
      }
    }
  }

  // Check resource-specific rules
  if (requirement.resource_checks) {
    const resourceOk = await requirement.resource_checks(actor, payload);
    if (!resourceOk) {
      return {
        authorized: false,
        reason: 'Resource access denied',
      };
    }
  }

  return { authorized: true };
}

// ============================================================================
// BATCH AUTHORIZATION
// ============================================================================

export async function authorizeIntents(
  actor: ActorContext,
  intents: Array<{ type: IntentType; payload: Record<string, unknown> }>
): Promise<
  Array<{
    type: IntentType;
    authorized: boolean;
    reason?: string;
  }>
> {
  const results = [];

  for (const intent of intents) {
    const result = await authorizeIntent(actor, intent.type, intent.payload);
    results.push({
      type: intent.type,
      ...result,
    });
  }

  return results;
}
