// lib/ai/confirm.ts
import crypto from 'crypto';

// Don't check at module level - just try to get the secret
const SECRET = process.env.AI_CONFIRM_TOKEN_SECRET;
const EFFECTIVE_SECRET = SECRET || 'dev-secret-change-in-production';

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
  // Check inside the function, at runtime
  if (!process.env.AI_CONFIRM_TOKEN_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('AI_CONFIRM_TOKEN_SECRET must be set in production');
  }
  
  const { requestId, userId, ttlSeconds } = input;
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const payload = `${requestId}:${userId}:${expiresAt}`;
  
  const hmac = crypto.createHmac('sha256', EFFECTIVE_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
  return token;
}

/**
 * Verify confirmation token
 */
export function verifyConfirmToken(input: VerifyConfirmTokenInput): boolean {
  // Check inside the function, at runtime
  if (!process.env.AI_CONFIRM_TOKEN_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('AI_CONFIRM_TOKEN_SECRET must be set in production');
  }
  
  const { token, requestId, userId } = input;
  
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    
    if (parts.length !== 4) {
      return false;
    }
    
    const [tokenRequestId, tokenUserId, expiresAtStr, signature] = parts;
    
    if (tokenRequestId !== requestId || tokenUserId !== userId) {
      return false;
    }
    
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return false;
    }
    
    const expectedPayload = `${tokenRequestId}:${tokenUserId}:${expiresAtStr}`;
    const hmac = crypto.createHmac('sha256', EFFECTIVE_SECRET);
    hmac.update(expectedPayload);
    const expectedSignature = hmac.digest('hex');
    
    return signature === expectedSignature;
  } catch {
    return false;
  }
}
