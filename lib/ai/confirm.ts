// lib/ai/confirm.ts
// HMAC-based confirmation token system

import crypto from 'crypto';

function getSecret(): string {
  const secret = process.env.AI_CONFIRM_TOKEN_SECRET;

  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('AI_CONFIRM_TOKEN_SECRET must be set in production');
  }

  return secret ?? 'dev-secret-change-in-production';
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

export function makeConfirmToken(input: MakeConfirmTokenInput): string {
  const { requestId, userId, ttlSeconds } = input;
  const secret = getSecret();

  const expiresAt = Date.now() + ttlSeconds * 1000;
  const payload = `${requestId}:${userId}:${expiresAt}`;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

export function verifyConfirmToken(input: VerifyConfirmTokenInput): boolean {
  const { token, requestId, userId } = input;
  const secret = getSecret();

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length !== 4) return false;

    const [tokenRequestId, tokenUserId, expiresAtStr, signature] = parts;

    if (tokenRequestId !== requestId || tokenUserId !== userId) return false;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

    const expectedPayload = `${tokenRequestId}:${tokenUserId}:${expiresAtStr}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(expectedPayload);
    const expectedSignature = hmac.digest('hex');

    return signature === expectedSignature;
  } catch {
    return false;
  }
}
