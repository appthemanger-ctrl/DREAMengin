type AuthUserResponse<TUser> = {
  data?: {
    user?: TUser | null;
  } | null;
};

type SupabaseAuthLike<TUser> = {
  auth: {
    getUser: () => Promise<AuthUserResponse<TUser>>;
  };
};

export const AUTH_GET_USER_TIMEOUT_MS = 2500;

export async function safeGetUser<TUser>(
  supabase: SupabaseAuthLike<TUser>,
  timeoutMs = AUTH_GET_USER_TIMEOUT_MS,
): Promise<TUser | null> {
  const effectiveTimeoutMs = Math.max(1, timeoutMs);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Supabase auth timed out after ${effectiveTimeoutMs}ms`));
    }, effectiveTimeoutMs);
    if (typeof timeoutId === 'object' && timeoutId && 'unref' in timeoutId) {
      timeoutId.unref();
    }
  });

  try {
    const result = await Promise.race([supabase.auth.getUser(), timeoutPromise]);
    return result.data?.user ?? null;
  } catch {
    return null;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
