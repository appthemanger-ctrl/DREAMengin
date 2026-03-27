'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Automatically opens GameEngin Side B when the games surface is entered with
 * `?openEngin=1` (optionally with `?remote=1` to jump straight into GameRemote).
 */
export default function AutoOpenGameEngin() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const shouldOpenEngin = searchParams.get('openEngin') === '1';
    if (!shouldOpenEngin) return;

    const shouldOpenRemote = searchParams.get('remote') === '1';
    if (shouldOpenRemote) {
      window.sessionStorage.setItem('de:games:auto-open-remote', '1');
    }

    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event('de:open-side-b'));
    }, 80);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  return null;
}
