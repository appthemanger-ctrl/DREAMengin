'use client';

import React from 'react';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';
import WidgetSurface from '@/components/widgets/WidgetSurface';
import CoreDream from '@/components/core/CoreDream';
import { Node1, Node2, Node3, Node4, Node5, Node6 } from './nodes/InnerNodes';
import { Node1b, Node2b, Node3b, Node4b, Node5b, Node6b } from './nodes/OuterNodes';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

type Props = {
  profile: ProfileLike | null;
  coreFace: 'home' | 'profile';
  coreOpen: boolean;
  onToggleCoreFace: () => void;
  onCloseCore: () => void;
  onOpenDrEams: () => void;
};

/** Wrapper that provides the consistent viewport background + node entrance animation */
function NodeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="de-node-wrapper"
      style={{
        width: 'min(96vw, 1080px)',
        maxHeight: '90vh',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

export default function HomeDreamRuntime({
  profile,
  coreFace,
  coreOpen,
  onToggleCoreFace,
  onCloseCore,
  onOpenDrEams,
}: Props) {
  const { node } = useDreamNav();

  // ── NODE 0 — CORE DREAM ────────────────────────────────────────────────────
  if (node === 0) {
    return (
      <div
        className="fixed inset-0 z-10 grid place-items-center overflow-y-auto"
        style={{ background: 'linear-gradient(180deg, var(--de-bg-start) 0%, var(--de-bg-mid) 62%, var(--de-bg-end) 100%)' }}
      >
        <CoreDream
          face={coreFace}
          isOpen={coreOpen}
          onToggleFace={onToggleCoreFace}
          onClose={onCloseCore}
          onOpenDrEams={onOpenDrEams}
          profile={profile}
        />

        {/* Navigation field shown when Core Dream is closed */}
        {!coreOpen && (
          <div
            className="de-glass"
            style={{ width: 'min(72rem, 96vw)', borderRadius: '28px', padding: '24px', color: 'var(--de-white)' }}
          >
            <div className="de-tag" style={{ marginBottom: '4px' }}>Dreams</div>
            <div className="de-label" style={{ fontSize: '20px', marginBottom: '8px' }}>Navigation Field</div>
            <div style={{ fontSize: '13px', color: 'var(--de-text-dim)', marginBottom: '20px' }}>
              Use swipe gestures to travel between nodes, or double-tap the controls for menus.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="de-widget-tile" style={{ minHeight: '80px', padding: '12px' }}>
                  <div className="de-tag">Dream</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--de-text)', marginTop: '3px' }}>
                    Slot {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── OUTER SHELL 1b–6b — DAY DREAMS ────────────────────────────────────────
  if (typeof node === 'string' && node.endsWith('b')) {
    const faceIndex = parseInt(node[0]);
    return (
      <div
        className="fixed inset-0 z-10 grid place-items-center overflow-auto"
        style={{ background: 'linear-gradient(180deg, var(--de-bg-start) 0%, var(--de-bg-mid) 42%, var(--de-bg-end) 100%)' }}
      >
        <NodeWrapper>
          {node === '1b' && <Node1b />}
          {node === '2b' && <Node2b />}
          {node === '3b' && <Node3b />}
          {node === '4b' && <Node4b />}
          {node === '5b' && <Node5b />}
          {node === '6b' && <Node6b />}
          {faceIndex && (
            <div style={{ marginTop: '16px' }}>
              <WidgetSurface surface="FACE" surfaceKey={faceIndex} />
            </div>
          )}
        </NodeWrapper>
      </div>
    );
  }

  // ── INNER LAYER 1–6 — DREAM SURFACES (core Dreams, NOT DayDreams) ──────────
  const faceIndex = typeof node === 'number' ? node : parseInt(String(node));
  return (
    <div
      className="fixed inset-0 z-10 grid place-items-center overflow-auto"
      style={{ background: 'linear-gradient(180deg, var(--de-bg-start) 0%, var(--de-bg-mid) 42%, var(--de-bg-end) 100%)' }}
    >
      <NodeWrapper>
        {node === 1 && <Node1 />}
        {node === 2 && <Node2 />}
        {node === 3 && <Node3 />}
        {node === 4 && <Node4 />}
        {node === 5 && <Node5 />}
        {node === 6 && <Node6 />}
        {faceIndex > 0 && (
          <div style={{ marginTop: '16px' }}>
            <WidgetSurface surface="FACE" surfaceKey={faceIndex} />
          </div>
        )}
      </NodeWrapper>
    </div>
  );
}
