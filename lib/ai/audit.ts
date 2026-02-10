// lib/ai/audit.ts
// Audit Service - Log All AI Operations

import { createServerClient } from '@/lib/supabase/server';
import {
  AgentType,
  IntentType,
  BoogieDecision,
  ReasonCode,
} from '@/types/ai-system';
import crypto from 'crypto';

// ============================================================================
// AUDIT ENTRY
// ============================================================================

export interface AuditParams {
  request_id: string;
  intent_id?: string;
  user_id: string;
  agent: AgentType | 'boogieman';
  intent_type?: IntentType;
  decision?: BoogieDecision;
  payload?: Record<string, unknown>;
  ok: boolean;
  error_code?: string;
  latency_ms: number;
  risk_score?: number;
  reason_code?: ReasonCode;
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  const supabase = await createServerClient();

  // Hash payload for privacy
  let payloadHash: string | undefined;
  if (params.payload) {
    const payloadStr = JSON.stringify(params.payload);
    payloadHash = crypto.createHash('sha256').update(payloadStr).digest('hex');
  }

  const { error } = await supabase.from('ai_audit_log').insert({
    request_id: params.request_id,
    intent_id: params.intent_id,
    user_id: params.user_id,
    agent: params.agent,
    intent_type: params.intent_type,
    decision: params.decision,
    payload_hash: payloadHash,
    ok: params.ok,
    error_code: params.error_code,
    latency_ms: params.latency_ms,
    risk_score: params.risk_score,
    reason_code: params.reason_code,
  });

  if (error) {
    console.error('Failed to write audit log:', error);
    // Don't throw - audit failure should not block operations
  }
}

// ============================================================================
// BATCH AUDIT
// ============================================================================

export async function writeAuditBatch(entries: AuditParams[]): Promise<void> {
  const supabase = await createServerClient();

  const rows = entries.map((params) => {
    let payloadHash: string | undefined;
    if (params.payload) {
      const payloadStr = JSON.stringify(params.payload);
      payloadHash = crypto.createHash('sha256').update(payloadStr).digest('hex');
    }

    return {
      request_id: params.request_id,
      intent_id: params.intent_id,
      user_id: params.user_id,
      agent: params.agent,
      intent_type: params.intent_type,
      decision: params.decision,
      payload_hash: payloadHash,
      ok: params.ok,
      error_code: params.error_code,
      latency_ms: params.latency_ms,
      risk_score: params.risk_score,
      reason_code: params.reason_code,
    };
  });

  const { error } = await supabase.from('ai_audit_log').insert(rows);

  if (error) {
    console.error('Failed to write audit batch:', error);
  }
}
