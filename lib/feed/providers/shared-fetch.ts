// ─── Shared Fetch Helper ─────────────────────────────────────────────────────
// Adds timeout, one retry with exponential back-off, and a UA header.

const DEFAULT_TIMEOUT_MS = 4000;
const RETRY_DELAY_MS = 800;

export async function sharedFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const attempt = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'DREAMengin-Feed/1.0 (+https://dreamengin.app)',
          ...(options.headers ?? {}),
        },
      });
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    return await attempt();
  } catch {
    // One retry after a short delay
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return attempt();
  }
}
