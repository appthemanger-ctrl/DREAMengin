'use client';

/**
 * RuntimeView
 *
 * Renders the content for a single runtime view based on the RuntimeWorld.
 * This component is used by both the top and bottom runtimes.
 */

import React from 'react';
import type { RuntimeWorld } from '@/lib/runtime/dualRuntime';
import HomeDreamRuntime from '@/components/dreamnav/HomeDreamRuntime';

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
        <HomeDreamRuntime
          profile={profile}
          posts={posts}
          coreFace="home"
          coreOpen={true}
          onToggleCoreFace={() => {}}
          onCloseCore={() => {}}
          onOpenDrEams={onOpenDrEams}
          onOpenDreamSpace={onOpenDreamSpace}
          isAdmin={isAdmin}
        />
      </div>
    );
  }

  // DreamSpace runtime
  if (world === 'dreamspace') {
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
        <div className="fixed inset-0 z-10 grid place-items-center overflow-auto"
          style={{ background: 'linear-gradient(180deg, var(--de-bg-start) 0%, var(--de-bg-mid) 42%, var(--de-bg-end) 100%)' }}>
          <div style={{
            width: 'min(96vw, 1080px)',
            maxHeight: '90vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '24px',
          }}>
            <div className="de-glass" style={{ borderRadius: '28px', padding: '24px', color: 'var(--de-white)' }}>
              <div className="de-tag" style={{ marginBottom: '4px' }}>DreamSpace</div>
              <div className="de-label" style={{ fontSize: '20px', marginBottom: '8px' }}>Dream Navigator</div>
              <div style={{ fontSize: '13px', color: 'var(--de-text-dim)', marginBottom: '20px' }}>
                Browse and interact with Dreams in this space.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="de-widget-tile" style={{ minHeight: '100px', padding: '12px' }}>
                    <div className="de-tag">Dream</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--de-text)', marginTop: '6px' }}>
                      Dream {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
        <HomeDreamRuntime
          profile={profile}
          posts={posts}
          coreFace="profile"
          coreOpen={true}
          onToggleCoreFace={() => {}}
          onCloseCore={() => {}}
          onOpenDrEams={onOpenDrEams}
          onOpenDreamSpace={onOpenDreamSpace}
          isAdmin={isAdmin}
        />
      </div>
    );
  }

  // Dream runtime
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
          <div className="de-glass" style={{ borderRadius: '28px', padding: '32px', maxWidth: '600px' }}>
            <div className="de-tag">Dream</div>
            <div className="de-label" style={{ fontSize: '24px', marginTop: '8px' }}>Dream {world.id}</div>
            <p style={{ color: 'var(--de-text-dim)', marginTop: '12px' }}>
              This is a placeholder for Dream content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Engin runtime
  if (typeof world === 'object' && world.type === 'engin') {
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
          <div className="de-glass" style={{ borderRadius: '28px', padding: '32px', maxWidth: '600px' }}>
            <div className="de-tag">Engin</div>
            <div className="de-label" style={{ fontSize: '24px', marginTop: '8px' }}>{world.name}</div>
            <p style={{ color: 'var(--de-text-dim)', marginTop: '12px' }}>
              This is a placeholder for {world.name} Engin content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Custom runtime
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
          <div className="de-glass" style={{ borderRadius: '28px', padding: '32px', maxWidth: '600px' }}>
            <div className="de-tag">Custom</div>
            <div className="de-label" style={{ fontSize: '24px', marginTop: '8px' }}>{world.path}</div>
            <p style={{ color: 'var(--de-text-dim)', marginTop: '12px' }}>
              This is a placeholder for custom world content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
