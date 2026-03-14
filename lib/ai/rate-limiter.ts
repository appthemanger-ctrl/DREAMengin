// lib/ai/rate-limiter.ts
// Rate Limiting Service

import { createServerClient } from '@/lib/supabase/server';

// ============================================================================
// RATE LIMIT CHECK
// ============================================================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/dr-eams/run': {
    maxRequests: 30,
    windowMinutes: 1,
  },
  '/api/innerdreams/run': {
    maxRequests: 20,
    windowMinutes: 1,
  },
  '/api/ai/execute': {
    maxRequests: 60,
    windowMinutes: 1,
  },
};

export async function checkRateLimit(
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; rpm: number; resetAt?: Date }> {
  const config = RATE_LIMITS[endpoint] ?? { maxRequests: 30, windowMinutes: 1 };

  const supabase = await createServerClient();

  // Call DB function to check rate limit
  const { data, error } = await supabase.rpc('check_ai_rate_limit', {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_max_requests: config.maxRequests,
    p_window_minutes: config.windowMinutes,
  });

  if (error) {
    console.error('Rate limit check error:', error);
    // Fail open (allow request) on error
    return { allowed: true, rpm: 0 };
  }

  const allowed = data?.allowed === true;

  // Calculate reset time
  const now = new Date();
  const resetAt = new Date(
    now.getTime() + config.windowMinutes * 60 * 1000
  );

  // Get current request count (approximate)
  const { data: rateLimitData } = await supabase
    .from('ai_rate_limits')
    .select('request_count')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .order('window_start', { ascending: false })
    .limit(1)
    .single();

  const rpm = data?.rpm ?? rateLimitData?.request_count ?? 0;

  return { allowed, rpm, resetAt };
}

// ============================================================================
// GET CURRENT RPM (for Boogie signals)
// ============================================================================

export async function getCurrentRPM(userId: string, endpoint: string): Promise<number> {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('ai_rate_limits')
    .select('request_count')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .order('window_start', { ascending: false })
    .limit(1)
    .single();

  return data?.request_count ?? 0;
}
