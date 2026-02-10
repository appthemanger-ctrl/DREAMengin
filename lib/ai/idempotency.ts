// lib/ai/idempotency.ts
// Idempotency key checker to prevent duplicate intent execution

import { createServerClient } from '@/lib/supabase/server';

interface CheckIdempotencyInput {
  key: string;
  userId: string;
  intentType: string;
}

interface CheckIdempotencyResult {
  allowed: boolean;
  isReplay: boolean;
}

/**
 * Check and insert idempotency key
 * Returns { allowed: false, isReplay: true } if key already exists (replay attack)
 */
export async function checkIdempotency(
  input: CheckIdempotencyInput
): Promise<CheckIdempotencyResult> {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('idempotency_keys')
      .insert({
        key: input.key,
        user_id: input.userId,
        intent_type: input.intentType,
      });
    
    if (error) {
      // Check if it's a unique constraint violation (replay)
      if (error.code === '23505') {
        return { allowed: false, isReplay: true };
      }
      
      console.error('[idempotency] Error inserting key:', error);
      // Fail-closed: if we can't verify idempotency, deny
      return { allowed: false, isReplay: false };
    }
    
    return { allowed: true, isReplay: false };
  } catch (error) {
    console.error('[idempotency] Unexpected error:', error);
    // Fail-closed
    return { allowed: false, isReplay: false };
  }
}
