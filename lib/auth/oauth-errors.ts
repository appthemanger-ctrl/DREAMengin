export function formatOAuthErrorMessage(provider: 'google' | 'github', message?: string): string {
  const fallback = 'OAuth failed';
  if (!message) return fallback;
  if (message.toLowerCase().includes('unsupported provider')) {
    const label = provider === 'google' ? 'Google' : 'GitHub';
    return `${label} sign-in is not enabled right now. Please use email + password instead.`;
  }
  return message;
}
