'use client';

/**
 * RuntimeView
 *
 * Renders the content for a single runtime view based on the RuntimeWorld.
 * This component is used by both the top and bottom runtimes.
 */

import React from 'react';
import type { RuntimeWorld } from '@/lib/runtime/dualRuntime';
import WorkspaceDashboard from '@/components/home/WorkspaceDashboard';
import DreamsSpacePanel from '@/components/dreams/DreamsSpacePanel';

interface RuntimeViewProps {
  world: RuntimeWorld;
  isActive: boolean;
  profile: {
    id?: string;
    handle?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posts?: any[];
  isAdmin?: boolean;
  onOpenDrEams: () => void;
  onOpenDreamSpace?: () => void;
}

export default function RuntimeView({
  world,
  isActive,
  profile,
  posts,
  isAdmin,
  onOpenDrEams,
  onOpenDreamSpace,
}: RuntimeViewProps) {
  // Home runtime
  if (world === 'home') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isActive ? 1 : 0.3,
          pointerEvents: isActive ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        <WorkspaceDashboard
          profile={profile}
          posts={posts ?? []}
          onOpenDrEams={onOpenDrEams}
          onOpenDreamSpace={onOpenDreamSpace}
          isAdmin={isAdmin}
        />
      </div>
    );
  }

  // DreamSpace runtime — renders the live DreamsSpacePanel (Daydreams + connector feeds)
  if (world === 'dreamspace') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isActive ? 1 : 0.3,
          pointerEvents: isActive ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
          background: 'linear-gradient(180deg, var(--de-bg-start,#020818) 0%, var(--de-bg-mid,#081428) 42%, var(--de-bg-end,#0a1a30) 100%)',
          overflow: 'hidden',
        }}
      >
        <DreamsSpacePanel />
      </div>
    );
  }

  // Profile runtime
  if (world === 'profile') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isActive ? 1 : 0.3,
          pointerEvents: isActive ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        <WorkspaceDashboard
          profile={profile}
          posts={posts ?? []}
          onOpenDrEams={onOpenDrEams}
          onOpenDreamSpace={onOpenDreamSpace}
          isAdmin={isAdmin}
        />
      </div>
    );
  }

  // Dream runtime — routes to the Daydream surface for this dream
  if (typeof world === 'object' && world.type === 'dream') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isActive ? 1 : 0.3,
          pointerEvents: isActive ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        <div className="fixed inset-0 z-10 grid place-items-center"
          style={{ background: 'linear-gradient(180deg, var(--de-bg-start) 0%, var(--de-bg-mid) 42%, var(--de-bg-end) 100%)' }}>
          <div className="de-glass" style={{ borderRadius: '28px', padding: '32px', maxWidth: '600px', textAlign: 'center' }}>
            <div className="de-tag">Dream</div>
            <div className="de-label" style={{ fontSize: '24px', marginTop: '8px' }}>Dream {world.id}</div>
            <p style={{ color: 'var(--de-text-dim)', marginTop: '12px', fontSize: '13px' }}>
              Open this Dream to view its full content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Engin runtime — routes to the Daydream Engin surface
  if (typeof world === 'object' && world.type === 'engin') {
    const ENGIN_ROUTES: Record<string, string> = {
      StarMakerEngin: '/daydream/music',
      GameEngin: '/daydream/games',
      LabEngin: '/daydream/lab',
      CodeEngin: '/daydream/code',
      BrandingEngin: '/daydream/brand',
      ContentEngin: '/daydream/create',
    };
    const route = ENGIN_ROUTES[world.name] ?? '/homedream';
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isActive ? 1 : 0.3,
          pointerEvents: isActive ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        <div className="fixed inset-0 z-10 grid place-items-center"
          style={{ background: 'linear-gradient(180deg, var(--de-bg-start) 0%, var(--de-bg-mid) 42%, var(--de-bg-end) 100%)' }}>
          <div className="de-glass" style={{ borderRadius: '28px', padding: '32px', maxWidth: '600px', textAlign: 'center' }}>
            <div className="de-tag">Engin</div>
            <div className="de-label" style={{ fontSize: '24px', marginTop: '8px' }}>{world.name}</div>
            <a
              href={route}
              style={{
                display: 'inline-block',
                marginTop: '16px',
                padding: '10px 24px',
                background: 'linear-gradient(135deg,#c8981a,#e0b830)',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              Open {world.name} →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Custom runtime — navigate to the specified path
  if (typeof world === 'object' && world.type === 'custom') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isActive ? 1 : 0.3,
          pointerEvents: isActive ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        <div className="fixed inset-0 z-10 grid place-items-center"
          style={{ background: 'linear-gradient(180deg, var(--de-bg-start) 0%, var(--de-bg-mid) 42%, var(--de-bg-end) 100%)' }}>
          <div className="de-glass" style={{ borderRadius: '28px', padding: '32px', maxWidth: '600px', textAlign: 'center' }}>
            <div className="de-tag">Custom</div>
            <div className="de-label" style={{ fontSize: '24px', marginTop: '8px' }}>{world.path}</div>
            <a
              href={world.path}
              style={{
                display: 'inline-block',
                marginTop: '16px',
                padding: '10px 24px',
                background: 'linear-gradient(135deg,#c8981a,#e0b830)',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              Navigate →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
