'use client';
/**
 * GameRemoteIsland — client-side island for embedding GameRemote in server pages.
 * Wraps the dynamic import so `ssr: false` is legal inside a Client Component.
 */

import dynamicImport from 'next/dynamic';

const GameRemote = dynamicImport(() => import('@/components/games/GameRemote'), { ssr: false });

export default function GameRemoteIsland() {
  return <GameRemote embedded />;
}
