// lib/ai/confirm-token.ts
// Two-Phase Commit - Confirm Token Service

import { createServerClient } from '@/lib/supabase/server';
import { createHmac } from 'crypto';
import { UIContext } from '@/types/ai-system';

// ============================================================================
// GENERATE CONFIRM TOKEN
// ============================================================================

const SERVER_SECRET = process.env.AI_CONFIRM_SECRET ?? 'default-secret-change-in-production';

export function generateConfirmToken(
  requestId: string,
  userId: string,
  expirySeconds: number = 300
): string {
  const expiryTs = Date.now() + expirySeconds * 1000;
  const payload = `${requestId}|${userId}|${expiryTs}`;

  const hmac = createHmac('sha256', SERVER_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  // Token format: base64(payload|signature)
  const token = Buffer.from(`${payload}|${signature}`).toString('base64url');

  return token;
}

// ============================================================================
// VERIFY CONFIRM TOKEN
// ============================================================================

export function verifyConfirmToken(
  token: string,
  requestId: string,
  userId: string
): { valid: boolean; expired?: boolean } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split('|');

    if (parts.length !== 4) {
      return { valid: false };
    }

    const [tokenRequestId, tokenUserId, expiryTsStr, providedSignature] = parts;

    // Verify request ID and user ID match
    if (tokenRequestId !== requestId || tokenUserId !== userId) {
      return { valid: false };
    }

    // Verify signature
    const payload = `${tokenRequestId}|${tokenUserId}|${expiryTsStr}`;
    const hmac = createHmac('sha256', SERVER_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    if (providedSignature !== expectedSignature) {
      return { valid: false };
    }

    // Check expiry
    const expiryTs = parseInt(expiryTsStr, 10);
    if (Date.now() > expiryTs) {
      return { valid: false, expired: true };
    }

    return { valid: true };
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false };
  }
}

// ============================================================================
// STORE CONFIRM TOKEN IN DB
// ============================================================================

export async function storeConfirmToken(
  token: string,
  requestId: string,
  userId: string,
  intentIds: string[],
  uiSnapshot: UIContext,
  expirySeconds: number = 300
): Promise<boolean> {
  const supabase = await createServerClient();

  const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString();

  const { error } = await supabase.from('confirm_tokens').insert({
    token,
    request_id: requestId,
    user_id: userId,
    intent_ids: intentIds,
    ui_snapshot: uiSnapshot,
    expires_at: expiresAt,
  });

  return !error;
}

// ============================================================================
// CHECK AND MARK TOKEN AS USED
// ============================================================================

export async function consumeConfirmToken(
  token: string,
  userId: string
): Promise<{
  valid: boolean;
  requestId?: string;
  intentIds?: string[];
  uiSnapshot?: UIContext;
}> {
  const supabase = await createServerClient();

  // Get token from DB
  const { data, error } = await supabase
    .from('confirm_tokens')
    .select('*')
    .eq('token', token)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  // Check if already used
  if (data.used) {
    return { valid: false };
  }

  // Check expiry
  if (new Date(data.expires_at) < new Date()) {
    return { valid: false };
  }

  // Mark as used
  await supabase
    .from('confirm_tokens')
    .update({ used: true, used_at: new Date().toISOString() })
    .eq('token', token);

  return {
    valid: true,
    requestId: data.request_id,
    intentIds: data.intent_ids,
    uiSnapshot: data.ui_snapshot as UIContext,
  };
}
