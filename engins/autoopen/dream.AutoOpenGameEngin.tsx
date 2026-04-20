'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Automatically opens GameEngin Side B when the games surface is entered with
 * `?openEngin=1`.
 */
export default function AutoOpenGameEngin() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const shouldOpenEngin = searchParams.get('openEngin') === '1';
    if (!shouldOpenEngin) return;

    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event('de:open-side-b'));
    }, 80);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  return null;
}
