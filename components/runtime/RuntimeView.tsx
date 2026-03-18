'use client';

/**
 * RuntimeView
 *
 * Renders the content for a single runtime view based on the RuntimeWorld.
 * Used by both Surface Space (top) and DreamSpace (bottom) regions.
 *
 * Panel worlds — { type: 'panel'; name: SystemPanelId } — render the system
 * feature component directly inside the region. No routing. No overlays.
 * The seam and bar remain persistent. Only this region's content changes.
 */

import React from 'react';
import type { RuntimeWorld } from '@/lib/runtime/dualRuntime';
import WorkspaceDashboard from '@/components/home/WorkspaceDashboard';
import DreamsSpacePanel from '@/components/dreams/DreamsSpacePanel';

// ── Panel components (loaded in-region, never as overlays) ───────────────────
import SettingsPanel     from '@/components/panels/SettingsPanel';
import ConnectorsPanel   from '@/components/panels/ConnectorsPanel';
import MarketplacePanel  from '@/components/panels/MarketplacePanel';
import ProfilePanel      from '@/components/panels/ProfilePanel';
import FeedSettingsPanel from '@/components/panels/FeedSettingsPanel';
import AppearancePanel   from '@/components/panels/AppearancePanel';
import PrivacyPanel      from '@/components/panels/PrivacyPanel';
import ControlsPanel     from '@/components/panels/ControlsPanel';
import DataPanel         from '@/components/panels/DataPanel';
import AlgorithmPanel    from '@/components/panels/AlgorithmPanel';
import WidgetsPanel      from '@/components/panels/WidgetsPanel';
import HelpPanel         from '@/components/panels/HelpPanel';
import SafetyPanel       from '@/components/panels/SafetyPanel';
import type { SystemPanelId } from '@/lib/panels/panelTypes';

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
  if (world === 'HomeDream Surface') {
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
  if (world === 'DreamSpace') {
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

  // View Profile Surface runtime
  if (world === 'View Profile Surface') {
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

  // Panel world — a system feature loaded in-region via world dispatch.
  // No routing. No overlays. The panel fills the region like any other world.
  if (typeof world === 'object' && world.type === 'panel') {
    const PANEL_MAP: Record<SystemPanelId, React.ReactNode> = {
      'settings':             <SettingsPanel />,
      'connectors':           <ConnectorsPanel />,
      'marketplace':          <MarketplacePanel />,
      'profile':              <ProfilePanel />,
      'feed-settings':        <FeedSettingsPanel />,
      'settings/appearance':  <AppearancePanel />,
      'settings/privacy':     <PrivacyPanel />,
      'settings/controls':    <ControlsPanel />,
      'settings/data':        <DataPanel />,
      'settings/algorithm':   <AlgorithmPanel />,
      'settings/widgets':     <WidgetsPanel />,
      'settings/help':        <HelpPanel />,
      'settings/safety':      <SafetyPanel />,
      'settings/feed':        <FeedSettingsPanel />,
    };
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isActive ? 1 : 0.3,
          pointerEvents: isActive ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
          background: 'var(--de-surface, #f4f8fd)',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {PANEL_MAP[world.name] ?? null}
      </div>
    );
  }

  // Fallback
  return null;
}
