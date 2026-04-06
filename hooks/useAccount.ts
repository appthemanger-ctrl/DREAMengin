'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAccount(initialAccountId?: string | null) {
  const [accountId, setAccountId] = useState<string | null>(initialAccountId ?? null);

  useEffect(() => {
    if (initialAccountId) {
      setAccountId(initialAccountId);
      return;
    }

    const supabase = createClient();
    let mounted = true;

    void supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (!mounted) return;
      setAccountId(data.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: { user?: { id?: string } | null } | null) => {
      if (!mounted) return;
      setAccountId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialAccountId]);

  return { accountId };
}
