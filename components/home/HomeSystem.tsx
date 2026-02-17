'use client';

import React, { useState } from 'react';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';
import HomeDreamRuntime from '@/components/dreamnav/HomeDreamRuntime';
import DreamNavControls from '@/components/dreamnav/DreamNavControls';
import OutdreamMenu from '@/components/dreamengin/OutdreamMenu';
import NexusMenu from '@/components/dreamengin/NexusMenu';
import DrEamsPanel from '@/components/dreamengin/DrEamsPanel';

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

  return (
    <>
      <HomeDreamRuntime userId={userId} profile={profile} initialPosts={initialPosts} />

      <DreamNavControls
        onHome={() => dispatch('home')}
        onOpenDreamsMenu={() => setDreamsOpen(true)}
        onOpenSystemMenu={() => setSystemOpen(true)}
      />

      {dreamsOpen ? <OutdreamMenu onClose={() => setDreamsOpen(false)} /> : null}

      {systemOpen ? (
        <NexusMenu
          onClose={() => setSystemOpen(false)}
          onOpenDrEams={() => {
            setSystemOpen(false);
            setDrEamsOpen(true);
          }}
        />
      ) : null}

      {drEamsOpen ? <DrEamsPanel onClose={() => setDrEamsOpen(false)} /> : null}
    </>
  );
}
