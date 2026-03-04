// lib/ai/rateLimit.ts
// Rate limiter using Supabase RPC function

import { createServerClient } from '@/lib/supabase/server';

interface RateLimitResult {
  allowed: boolean;
  rpm: number;
  retry_after_seconds?: number;
}

/**
 * Check rate limit using Supabase RPC
 * Fail-closed: if RPC fails, deny the request
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  try {
    const supabase = await createServerClient();
    const key = `${userId}:${endpoint}`;
    
    const { data, error } = await supabase.rpc('rate_limit_hit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
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
    
    if (!data) {
      console.error('[rateLimit] No data returned from RPC');
      return {
        allowed: false,
        rpm: 0,
        retry_after_seconds: windowSeconds,
      };
    }
    
    return {
      allowed: data.allowed === true,
      rpm: data.rpm || 0,
      retry_after_seconds: data.allowed ? undefined : (data.retry_after_seconds || windowSeconds),
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
 * Get current RPM for boogie evaluation (read-only, no increment)
 */
export async function getCurrentRPM(userId: string, endpoint: string): Promise<number> {
  try {
    const supabase = await createServerClient();
    const key = `${userId}:${endpoint}`;
    
    const { data } = await supabase
      .from('rate_limit_counters')
      .select('count, window_start')
      .eq('key', key)
      .single();
    
    if (!data) {
      return 0;
    }
    
    // Check if window is still valid (within last 60 seconds)
    const windowStart = new Date(data.window_start).getTime();
    const now = Date.now();
    const windowAge = (now - windowStart) / 1000;
    
    if (windowAge > 60) {
      return 0;
    }
    
    // Calculate RPM from count and window age
    const rpm = Math.round((data.count / Math.max(1, windowAge)) * 60);
    return rpm;
  } catch {
    return 0;
  }
}
