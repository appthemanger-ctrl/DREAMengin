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
  /** Open a path contained inside this region (iframe), instead of full-page navigation */
  onOpenInRegion?: (path: string) => void;
  /** Return to the default world for this region (close iframe) */
  onBackFromRegion?: () => void;
}

export default function RuntimeView({
  world,
  isActive,
  profile,
  posts,
  isAdmin,
  onOpenDrEams,
  onOpenDreamSpace,
  onOpenInRegion,
  onBackFromRegion,
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
          onOpenInRegion={onOpenInRegion}
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
        <DreamsSpacePanel onOpenInRegion={onOpenInRegion} />
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
          onOpenInRegion={onOpenInRegion}
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

  // Engin runtime — renders the Daydream Engin surface in an in-region iframe
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
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Thin in-region header with back navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: 'rgba(10,20,40,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(200,152,26,0.18)',
          flexShrink: 0,
          zIndex: 2,
        }}>
          <button
            type="button"
            onClick={onBackFromRegion ?? undefined}
            disabled={!onBackFromRegion}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 8,
              color: '#c8981a',
              fontSize: 13,
              fontWeight: 700,
              padding: '5px 12px',
              cursor: onBackFromRegion ? 'pointer' : 'default',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ← Back
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {world.name}
          </span>
        </div>
        <iframe
          src={route}
          title={world.name}
          style={{ flex: 1, border: 'none', width: '100%', background: 'var(--de-bg-start, #020818)' }}
          allow="fullscreen"
        />
      </div>
    );
  }

  // Custom runtime — loads the path in an in-region iframe
  if (typeof world === 'object' && world.type === 'custom') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isActive ? 1 : 0.3,
          pointerEvents: isActive ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Thin in-region header with back navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: 'rgba(10,20,40,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(200,152,26,0.18)',
          flexShrink: 0,
          zIndex: 2,
        }}>
          <button
            type="button"
            onClick={onBackFromRegion ?? undefined}
            disabled={!onBackFromRegion}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 8,
              color: '#c8981a',
              fontSize: 13,
              fontWeight: 700,
              padding: '5px 12px',
              cursor: onBackFromRegion ? 'pointer' : 'default',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ← Back
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {world.path}
          </span>
        </div>
        <iframe
          src={world.path}
          title={world.path}
          style={{ flex: 1, border: 'none', width: '100%', background: 'var(--de-bg-start, #020818)' }}
          allow="fullscreen"
        />
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
