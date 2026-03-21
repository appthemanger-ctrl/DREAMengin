'use client';

/**
 * RuntimeView
 *
 * Renders the content for a single runtime view based on the RuntimeWorld.
 * Used by both Surface Space (top) and DreamSpace (bottom) regions.
 *
 * Every world type is now wrapped in RuntimeShell, which provides:
 *  • A constrained scrollable + zoomable viewport (never the full page).
 *  • Zoom in / zoom out controls.
 *  • In-region iframe loading so app/engin navigation never leaves the home surface.
 *
 * Panel worlds — { type: 'panel'; name: SystemPanelId } — render the system
 * feature component directly inside the region. No routing. No overlays.
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { RuntimeWorld } from '@/lib/runtime/dualRuntime';
import WorkspaceDashboard from '@/components/home/WorkspaceDashboard';
import DreamsSpacePanel from '@/components/dreams/DreamsSpacePanel';
import RuntimeShell from '@/components/runtime/RuntimeShell';

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

/** Engin name → canonical daydream route */
const ENGIN_ROUTES: Record<string, string> = {
  StarMakerEngin: '/daydream/music',
  GameEngin:      '/daydream/games',
  LabEngin:       '/daydream/lab',
  CodeEngin:      '/daydream/code',
  BrandingEngin:  '/daydream/brand',
  ContentEngin:   '/daydream/create',
};

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
  /* ── In-region iframe state ─────────────────────────────────────────────── */
  const [iframeUrl,   setIframeUrl]   = useState<string | null>(null);
  const [iframeTitle, setIframeTitle] = useState<string>('');

  const openUrl = useCallback((url: string, title?: string) => {
    setIframeUrl(url);
    setIframeTitle(title ?? url);
  }, []);

  const closeIframe = useCallback(() => {
    setIframeUrl(null);
    setIframeTitle('');
  }, []);

  // Reset iframe whenever the world changes so stale pages don't linger.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: world is an external prop driving local UI state
  useEffect(() => { setIframeUrl(null); setIframeTitle(''); }, [world]);

  /* ── Shared outer wrapper style ─────────────────────────────────────────── */
  const outerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    opacity: isActive ? 1 : 0.3,
    pointerEvents: isActive ? 'auto' : 'none',
    transition: 'opacity 0.3s ease',
  };

  /* ── Home runtime ────────────────────────────────────────────────────────── */
  if (world === 'HomeDream Surface') {
    return (
      <div style={outerStyle}>
        <RuntimeShell
          iframeUrl={iframeUrl}
          onCloseIframe={closeIframe}
          iframeTitle={iframeTitle}
        >
          <WorkspaceDashboard
            profile={profile}
            posts={posts ?? []}
            onOpenDrEams={onOpenDrEams}
            onOpenDreamSpace={onOpenDreamSpace}
            onOpenInRegion={onOpenInRegion}
            onOpenUrl={openUrl}
            isAdmin={isAdmin}
            userId={profile?.id}
          />
        </RuntimeShell>
      </div>
    );
  }

  /* ── DreamSpace runtime ──────────────────────────────────────────────────── */
  if (world === 'DreamSpace') {
    return (
      <div
        style={{
          ...outerStyle,
          background: 'linear-gradient(180deg, var(--de-bg-start,#020818) 0%, var(--de-bg-mid,#081428) 42%, var(--de-bg-end,#0a1a30) 100%)',
          overflow: 'hidden',
        }}
      >
        <RuntimeShell
          iframeUrl={iframeUrl}
          onCloseIframe={closeIframe}
          iframeTitle={iframeTitle}
        >
          <DreamsSpacePanel onOpenUrl={openUrl} onOpenInRegion={onOpenInRegion} />
        </RuntimeShell>
      </div>
    );
  }

  /* ── View Profile Surface runtime ───────────────────────────────────────── */
  if (world === 'View Profile Surface') {
    return (
      <div style={outerStyle}>
        <RuntimeShell
          iframeUrl={iframeUrl}
          onCloseIframe={closeIframe}
          iframeTitle={iframeTitle}
        >
          <WorkspaceDashboard
            profile={profile}
            posts={posts ?? []}
            onOpenDrEams={onOpenDrEams}
            onOpenDreamSpace={onOpenDreamSpace}
            onOpenInRegion={onOpenInRegion}
            onOpenUrl={openUrl}
            isAdmin={isAdmin}
            userId={profile?.id}
          />
        </RuntimeShell>
      </div>
    );
  }

  /* ── Dream runtime — open the dream URL in-region ───────────────────────── */
  if (typeof world === 'object' && world.type === 'dream') {
    return (
      <div style={outerStyle}>
        <RuntimeShell
          iframeUrl={iframeUrl}
          onCloseIframe={closeIframe}
          iframeTitle={iframeTitle}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', minHeight: '100%',
              background: 'linear-gradient(180deg, var(--de-bg-start) 0%, var(--de-bg-mid) 42%, var(--de-bg-end) 100%)',
            }}
          >
            <div className="de-glass" style={{ borderRadius: 28, padding: 32, maxWidth: 600, textAlign: 'center' }}>
              <div className="de-tag">Dream</div>
              <div className="de-label" style={{ fontSize: 24, marginTop: 8 }}>Dream {world.id}</div>
              <p style={{ color: 'var(--de-text-dim)', marginTop: 12, fontSize: 13 }}>
                Open this Dream to view its full content.
              </p>
              <button
                type="button"
                onClick={() => openUrl(`/dreams/${world.id}`, `Dream ${world.id}`)}
                style={{
                  display: 'inline-block', marginTop: 16, padding: '10px 24px',
                  background: 'linear-gradient(135deg,#c8981a,#e0b830)', color: '#fff',
                  borderRadius: 10, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                }}
              >
                Open Dream →
              </button>
            </div>
          </div>
        </RuntimeShell>
      </div>
    );
  }

  /* ── Engin runtime — open engin route in-region iframe ──────────────────── */
  if (typeof world === 'object' && world.type === 'engin') {
    const route = ENGIN_ROUTES[world.name] ?? '/homedream';
    return (
      <div style={outerStyle}>
        <RuntimeShell
          iframeUrl={iframeUrl}
          onCloseIframe={closeIframe}
          iframeTitle={iframeTitle}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', minHeight: '100%',
              background: 'linear-gradient(180deg, var(--de-bg-start) 0%, var(--de-bg-mid) 42%, var(--de-bg-end) 100%)',
            }}
          >
            <div className="de-glass" style={{ borderRadius: 28, padding: 32, maxWidth: 600, textAlign: 'center' }}>
              <div className="de-tag">Engin</div>
              <div className="de-label" style={{ fontSize: 24, marginTop: 8 }}>{world.name}</div>
              <button
                type="button"
                onClick={() => openUrl(route, world.name)}
                style={{
                  display: 'inline-block', marginTop: 16, padding: '10px 24px',
                  background: 'linear-gradient(135deg,#c8981a,#e0b830)', color: '#fff',
                  borderRadius: 10, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                }}
              >
                Open {world.name} →
              </button>
            </div>
          </div>
        </RuntimeShell>
      </div>
    );
  }

  /* ── Custom runtime — open the custom path in-region iframe ─────────────── */
  if (typeof world === 'object' && world.type === 'custom') {
    return (
      <div style={outerStyle}>
        <RuntimeShell
          iframeUrl={iframeUrl}
          onCloseIframe={closeIframe}
          iframeTitle={iframeTitle}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', minHeight: '100%',
              background: 'linear-gradient(180deg, var(--de-bg-start) 0%, var(--de-bg-mid) 42%, var(--de-bg-end) 100%)',
            }}
          >
            <div className="de-glass" style={{ borderRadius: 28, padding: 32, maxWidth: 600, textAlign: 'center' }}>
              <div className="de-tag">Custom</div>
              <div className="de-label" style={{ fontSize: 24, marginTop: 8 }}>{world.path}</div>
              <button
                type="button"
                onClick={() => openUrl(world.path, world.path)}
                style={{
                  display: 'inline-block', marginTop: 16, padding: '10px 24px',
                  background: 'linear-gradient(135deg,#c8981a,#e0b830)', color: '#fff',
                  borderRadius: 10, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                }}
              >
                Navigate →
              </button>
            </div>
          </div>
        </RuntimeShell>
      </div>
    );
  }

  /* ── Panel world — a system feature loaded in-region via world dispatch ─── */
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
          ...outerStyle,
          background: 'var(--de-surface, #f4f8fd)',
        }}
      >
        <RuntimeShell
          iframeUrl={iframeUrl}
          onCloseIframe={closeIframe}
          iframeTitle={iframeTitle}
        >
          <div style={{ minHeight: '100%' }}>
            {PANEL_MAP[world.name] ?? null}
          </div>
        </RuntimeShell>
      </div>
    );
  }

  // Fallback
  return null;
}
