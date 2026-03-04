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

export const isSupabaseConfigured = () =>
  hasValue(process.env.NEXT_PUBLIC_dreamengin_SUPABASE_URL) &&
  hasValue(process.env.dreamengin_SUPABASE_SECRET_KEY);
