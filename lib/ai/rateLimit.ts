// lib/ai/rateLimit.ts
// Rate limiter using Supabase RPC function

import { createServerClient } from '@/lib/supabase/server';

export interface RateLimitResult {
  allowed: boolean;
  rpm: number;
  retry_after_seconds?: number;
}

/**
 * Check rate limit using Supabase RPC check_ai_rate_limit.
 * Fail-closed: if RPC errors or returns invalid data, deny the request.
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const windowMinutes = Math.max(1, Math.ceil(windowSeconds / 60));
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase.rpc('check_ai_rate_limit', {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_max_requests: limit,
      p_window_minutes: windowMinutes,
    });

    if (error) {
      console.error('[rateLimit] RPC error:', error);
      // Fail-closed
      return {
        allowed: false,
        rpm: 0,
        retry_after_seconds: windowSeconds,
      };
    }

    if (data === null || data === undefined) {
      console.error('[rateLimit] No data returned from RPC');
      return {
        allowed: false,
        rpm: 0,
        retry_after_seconds: windowSeconds,
      };
    }

    return {
      allowed: data.allowed === true,
      rpm: data.rpm ?? 0,
      retry_after_seconds: data.allowed
        ? undefined
        : (data.retry_after_seconds ?? windowSeconds),
    };
  } catch (error) {
    console.error('[rateLimit] Unexpected error:', error);
    // Fail-closed
    return {
      allowed: false,
      rpm: 0,
      retry_after_seconds: windowSeconds,
    };
  }
}

/**
 * Get current RPM for boogie evaluation (read-only, no increment).
 * Reads from ai_rate_limits by user_id + endpoint, using the latest window.
 */
export async function getCurrentRPM(userId: string, endpoint: string): Promise<number> {
  try {
    const supabase = await createServerClient();

    const { data } = await supabase
      .from('ai_rate_limits')
      .select('request_count, window_start')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .order('window_start', { ascending: false })
      .limit(1)
      .single();

    if (!data) {
      return 0;
    }

    // Check if window is still within the last 60 seconds
    const windowStart = new Date(data.window_start).getTime();
    const windowAge = (Date.now() - windowStart) / 1000;

    if (windowAge > 60) {
      return 0;
    }

    // Compute RPM from request_count and elapsed window time
    return Math.round((data.request_count / Math.max(1, windowAge)) * 60);
  } catch {
    return 0;
  }
}
