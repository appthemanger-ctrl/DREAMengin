// lib/ai/audit.ts
// Audit log writer for admin_audit_log table.
// Enforcement events are append-only; corrections are new events referencing prior events (req 20).

import { createServerClient } from '@/lib/supabase/server';
import { BOOGIE_POLICY_VERSION } from '@/lib/ai/boogie-policy';

interface WriteAuditLogInput {
  request_id: string;
  user_id: string;
  agent: string;
  ok: boolean;
  error_code?: string;
  latency_ms?: number;
  policy_version?: string;
  payload?: Record<string, unknown>;
}

/**
 * Write to admin_audit_log table.
 * policy_version is always stamped so every row is traceable to a published rule (req 3, 18).
 */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('admin_audit_log')
      .insert({
        actor_user_id: input.user_id,
        action: `${input.agent}:${input.ok ? 'success' : 'error'}`,
        payload: {
          request_id: input.request_id,
          agent: input.agent,
          error_code: input.error_code,
          latency_ms: input.latency_ms,
          policy_version: input.policy_version ?? BOOGIE_POLICY_VERSION,
          ...input.payload,
        },
      });

    if (error) {
      console.error('[audit] Failed to write audit log:', error);
      // Don't throw — audit failure must not break the request
    }
  } catch (error) {
    console.error('[audit] Unexpected error writing audit log:', error);
  }
}
