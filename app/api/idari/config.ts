import { isSupabaseConfigured } from '@/lib/supabase/env';

const hasValue = (value?: string) => Boolean(value && value.trim().length > 0);

export const ESTIMATED_COMPLETION = {
  minMinutes: 2,
  maxMinutes: 5,
} as const;
export const DEFAULT_CHECK_STATUS = {
  consoleErrors: 'Pass',
  databaseQueries: 'Pass',
  security: 'Pass',
  performance: 'Pass',
  accessibility: 'Pass'
} as const;

// Re-export from centralised env resolver so every consumer agrees
export { isSupabaseConfigured };
// Keep hasValue available for other local checks
export { hasValue };
