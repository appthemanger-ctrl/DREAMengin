'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAccount(initialAccountId?: string | null {
  const [accountId, setAccountId] = useState<string | null>(initialAccountId ?? null);

  useEffect(() => {
    if (initialAccountId) {
      setAccountId(initialAccountId);
      return;
    }

    const supabase = createClient();
    let mounted = true;

    void supabase.auth
      .getUser()
      .then(({ data }: { data: { user: { id: string } | null } }) => {
        if (!mounted) return;
        setAccountId(data.user?.id ?? null);
      })
      .catch(() => {
        // Supabase unavailable / unconfigured — leave accountId as-is.
      });

    // onAuthStateChange may throw or return a rejected proxy when Supabase
    // isn't configured. Guard so the host component never crashes (which
    // bubbles to error.tsx and replaces the entire UI with the themed error
    // screen — appears as a solid orange page on sunset/sunrise themes).
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const result = supabase.auth.onAuthStateChange(
        (_event: string, session: { user?: { id?: string } | null } | null) => {
          if (!mounted) return;
          setAccountId(session?.user?.id ?? null);
        },
      );
      subscription = result?.data?.subscription ?? null;
    } catch {
      // ignore — auth state changes simply won't be observed
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [initialAccountId]);

  return { accountId };
}
