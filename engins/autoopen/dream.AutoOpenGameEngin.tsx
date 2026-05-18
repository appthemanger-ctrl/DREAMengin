'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSharedEnginChannel } from '@/lib/runtime/useSharedEnginChannel';
import { createInstance } from '@/lib/runtime/instanceManager';

/**
 * Automatically opens GameEngin Side B when the games surface is entered with
 * `?openEngin=1`.
 */
export default function AutoOpenGameEngin( ){
  const searchParams = useSearchParams();
  const instanceId = searchParams.get('instanceId') ?? 'autoopen';
  const sharedChannel = useSharedEnginChannel({
    enginName: 'game',
    instanceId,
    region: 'engin:game',
    mode: 'solo',
  });

  useEffect(() => {
    const shouldOpenEngin = searchParams.get('openEngin') === '1';
    if (!shouldOpenEngin) return;

    createInstance({ enginName: 'game', instanceId, region: 'engin:game', mode: 'solo' });

    const timer = window.setTimeout(() => {
      void sharedChannel.publish({
        type: 'game:auto-open',
        openEngin: true,
        source: 'route',
      });
      window.dispatchEvent(new Event('de:open-side-b'));
    }, 80);

    return () => window.clearTimeout(timer);
  }, [instanceId, searchParams, sharedChannel.publish]);

  return null;
}