import { describe, expect, it } from 'vitest';
import { formatOAuthErrorMessage } from '@/lib/auth/oauth-errors';

describe('formatOAuthErrorMessage', () => {
  it('returns provider-specific guidance when provider is unsupported', () => {
    expect(formatOAuthErrorMessage('google', 'Unsupported provider: provider is not enabled'))
      .toContain('Google sign-in is not enabled');
    expect(formatOAuthErrorMessage('github', 'Unsupported provider: provider is not enabled'))
      .toContain('GitHub sign-in is not enabled');
  });

  it('returns original message for other errors', () => {
    expect(formatOAuthErrorMessage('google', 'OAuth callback failed')).toBe('OAuth callback failed');
  });

  it('returns fallback when message is undefined', () => {
    expect(formatOAuthErrorMessage('google', undefined)).toBe('OAuth failed');
  });
});
