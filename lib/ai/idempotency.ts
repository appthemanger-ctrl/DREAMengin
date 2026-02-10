// lib/ai/idempotency.ts
// Idempotency Service - Write-Once Semantics

import { createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// ============================================================================
// IDEMPOTENCY KEY GENERATION
// ============================================================================

export function generateIdempotencyKey(
  userId: string,
  intentType: string,
  payload: Record<string, unknown>,
  timeBucketHours: number = 1
): string {
  // Create stable JSON representation
  const stablePayload = JSON.stringify(payload, Object.keys(payload).sort());

  // Time bucket (floor to hour boundary)
  const now = Date.now();
  const timeBucket = Math.floor(now / (timeBucketHours * 3600 * 1000));

  // Hash components
  const components = `${userId}|${intentType}|${stablePayload}|${timeBucket}`;
  const hash = crypto.createHash('sha256').update(components).digest('hex');

  return hash;
}

// ============================================================================
// IDEMPOTENCY CHECK
// ============================================================================

export async function checkIdempotency(
  key: string
): Promise<{ exists: boolean; result?: unknown }> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('idempotency_keys')
    .select('result')
    .eq('key', key)
    .single();

  if (error || !data) {
    return { exists: false };
  }

  return { exists: true, result: data.result };
}

// ============================================================================
// STORE IDEMPOTENCY RESULT
// ============================================================================

export async function storeIdempotencyResult(
  key: string,
  userId: string,
  intentType: string,
  result: unknown
): Promise<boolean> {
  const supabase = await createServerClient();

  const { error } = await supabase.from('idempotency_keys').insert({
    key,
    user_id: userId,
    intent_type: intentType,
    result,
  });

  return !error;
}
