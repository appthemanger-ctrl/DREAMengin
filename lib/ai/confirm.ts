// lib/ai/confirm.ts
// HMAC-based confirmation token system

import crypto from 'crypto';

const SECRET = process.env.AI_CONFIRM_TOKEN_SECRET;

// Resolved at module load; null in production when env var is absent.
const CACHED_SECRET = SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-secret-change-in-production');

function getSecret(): string {
  if (!CACHED_SECRET) {
    throw new Error('AI_CONFIRM_TOKEN_SECRET environment variable is required');
  }
  return CACHED_SECRET;
}

interface MakeConfirmTokenInput {
  requestId: string;
  userId: string;
  ttlSeconds: number;
}

interface VerifyConfirmTokenInput {
  token: string;
  requestId: string;
  userId: string;
}

/**
 * Generate HMAC confirmation token
 */
export function makeConfirmToken(input: MakeConfirmTokenInput): string {
  const { requestId, userId, ttlSeconds } = input;
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const payload = `${requestId}:${userId}:${expiresAt}`;
  
  const hmac = crypto.createHmac('sha256', getSecret());
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  // Token format: base64(payload:signature)
  const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
  return token;
}

/**
 * Verify confirmation token
 */
export function verifyConfirmToken(input: VerifyConfirmTokenInput): boolean {
  const { token, requestId, userId } = input;
  
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    
    if (parts.length !== 4) {
      return false;
    }
    
    const [tokenRequestId, tokenUserId, expiresAtStr, signature] = parts;
    
    // Check request ID and user ID match
    if (tokenRequestId !== requestId || tokenUserId !== userId) {
      return false;
    }
    
    // Check expiration
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return false;
    }
    
    // Verify HMAC signature
    const expectedPayload = `${tokenRequestId}:${tokenUserId}:${expiresAtStr}`;
    const hmac = crypto.createHmac('sha256', getSecret());
    hmac.update(expectedPayload);
    const expectedSignature = hmac.digest('hex');
    
    return signature === expectedSignature;
  } catch {
    return false;
  }
}
