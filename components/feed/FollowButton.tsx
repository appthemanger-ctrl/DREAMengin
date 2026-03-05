'use client';

import { useState } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import FollowOnboarding, { type FollowFrequency } from '@/components/feed/FollowOnboarding';

type Props = { handle: string; displayName: string };

export default function FollowButton({ handle, displayName }: Props) {
  const [open,      setOpen]      = useState(false);
  const [following, setFollowing] = useState(false);

  const handleConfirm = (_freq: FollowFrequency) => {
    setFollowing(true);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { if (!following) setOpen(true); }}
        className="de-btn de-btn-primary"
        style={{ fontSize: 11, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 4,
          background: following ? 'rgba(42,138,184,0.15)' : undefined,
          color: following ? 'var(--de-accent)' : undefined,
        }}
        aria-label={following ? `Following ${handle}` : `Follow ${handle}`}
      >
        {following
          ? <><UserCheck className="w-3 h-3" /> Following</>
          : <><UserPlus  className="w-3 h-3" /> Follow</>
        }
      </button>

      {open && (
        <FollowOnboarding
          handle={handle}
          displayName={displayName}
          onConfirm={handleConfirm}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
