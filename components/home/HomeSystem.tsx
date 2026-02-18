'use client';

import React, { useCallback, useState } from 'react';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';
import HomeDreamRuntime from '@/components/dreamnav/HomeDreamRuntime';
import DreamNavControls from '@/components/dreamnav/DreamNavControls';
import OutdreamMenu from '@/components/dreamengin/OutdreamMenu';
import NexusMenu from '@/components/dreamengin/NexusMenu';
import DrEamsPanel from '@/components/dreamengin/DrEamsPanel';
import ViewAllDreamsOverlay from '@/components/dreamengin/ViewAllDreamsOverlay';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

export default function HomeSystem({
  userId,
  profile,
  initialPosts,
}: {
  userId: string;
  profile: ProfileLike | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialPosts: any[];
}) {
  const { dispatch } = useDreamNav();

  const [dreamsOpen, setDreamsOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(false);
  const [drEamsOpen, setDrEamsOpen] = useState(false);
  const [viewAllDreamsOpen, setViewAllDreamsOpen] = useState(false);

  const [coreOpen, setCoreOpen] = useState(true);
  const [coreFace, setCoreFace] = useState<'home' | 'profile'>('home');

  const returnHome = useCallback(() => {
    dispatch('home');
    setDreamsOpen(false);
    setSystemOpen(false);
    setDrEamsOpen(false);
    setViewAllDreamsOpen(false);
    setCoreOpen(true);
    setCoreFace('home');
  }, [dispatch]);

  return (
    <>
      <HomeDreamRuntime
        userId={userId}
        profile={profile}
        initialPosts={initialPosts}
        coreFace={coreFace}
        coreOpen={coreOpen}
        onToggleCoreFace={() => setCoreFace((p) => (p === 'home' ? 'profile' : 'home'))}
        onCloseCore={() => setCoreOpen(false)}
      />

      <DreamNavControls
        onHome={returnHome}
        onOpenDreamsMenu={() => setDreamsOpen(true)}
        onOpenSystemMenu={() => setSystemOpen(true)}
        onDepthIn={() => dispatch('depth_in')}
        onDepthOut={() => dispatch('depth_out')}
      />

      {dreamsOpen ? <OutdreamMenu onClose={() => setDreamsOpen(false)} /> : null}

      {systemOpen ? (
        <NexusMenu
          onClose={() => setSystemOpen(false)}
          onViewAllDreams={() => {
            setSystemOpen(false);
            setViewAllDreamsOpen(true);
          }}
          onOpenDrEams={() => {
            setSystemOpen(false);
            setDrEamsOpen(true);
          }}
        />
      ) : null}

      {viewAllDreamsOpen ? (
        <ViewAllDreamsOverlay
          onClose={() => setViewAllDreamsOpen(false)}
          onReturnHome={returnHome}
        />
      ) : null}

      {drEamsOpen ? <DrEamsPanel onClose={() => setDrEamsOpen(false)} /> : null}
    </>
  );
}
