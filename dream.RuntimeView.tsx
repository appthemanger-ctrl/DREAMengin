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

import HomeDreamSurface from '@/app/dreamdmbar/_components/HomeDreamRegion';
import DreamsSpacePanel from '@/components/dreams/dreamsurface.dreamspace';
import RuntimeShell from '@/components/runtime/dream.shell.RuntimeShell';
import EnhancedSpatialShell from '@/components/spatial/dream.shell.EnhancedSpatialShell';
import type { RuntimeRegion } from '@/lib/identity/canonical-names';

import type { RuntimeWorld } from '@/lib/runtime/dualRuntime';

// Local Post type used by panel views
type Post = Record<string, unknown>;
import React, { useCallback, useEffect, useState } from 'react';

// ── Panel components (loaded in-region, never as overlays) ───────────────────
import AlgorithmPanel from '@/components/panels/dream.panel.AlgorithmPanel';
import AppearancePanel from '@/components/panels/dream.panel.AppearancePanel';
import ConnectorsPanel from '@/components/panels/dream.panel.ConnectorsPanel';
import ControlsPanel from '@/components/panels/dream.panel.ControlsPanel';
import DataPanel from '@/components/panels/dream.panel.DataPanel';
import FeedSettingsPanel from '@/components/panels/dream.panel.FeedSettingsPanel';
import HelpPanel from '@/components/panels/dream.panel.HelpPanel';
import MarketplacePanel from '@/components/panels/dream.panel.MarketplacePanel';
import PrivacyPanel from '@/components/panels/dream.panel.PrivacyPanel';
import ProfilePanel from '@/components/panels/dream.panel.ProfilePanel';
import SafetyPanel from '@/components/panels/dream.panel.SafetyPanel';
import SettingsPanel from '@/components/panels/dream.panel.SettingsPanel';
import WidgetsPanel from '@/components/panels/dream.panel.WidgetsPanel';
import { getDreamComponent } from '@/lib/dreams/DreamRegistry';
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
   
  posts?: Post[];
  isAdmin?: boolean;
  onOpenDrEams: () => void;
  onOpenDreamSpace?: () => void;
  /** Open a path contained inside this region (iframe), instead of full-page navigation */
  onOpenInRegion?: (path: string) => void;
  /** Return to the default world for this region (close iframe) */
  onBackFromRegion?: () => void;
  seamOffsetPx?: number;
  splitRatio?: number;
  seamVisible?: boolean;
  dominantRegion?: RuntimeRegion;
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
   
  useEffect(() => { setIframeUrl(null); setIframeTitle(''); }, [world]);

  /* ── Shared outer wrapper style ─────────────────────────────────────────── */
  const outerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    opacity: isActive ? 1 : 0.3,
    pointerEvents: isActive ? 'auto' : 'none',
    transition: 'opacity 0.3s ease',
    contain: 'layout paint size',
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
          <HomeDreamSurface
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
          background: 'linear-gradient(180deg, #020818 0%, #08142A 42%, #0A1A30 100%)',
          overflow: 'hidden',
        }}
      >
        <RuntimeShell
          iframeUrl={iframeUrl}
          onCloseIframe={closeIframe}
          iframeTitle={iframeTitle}
        >
          <DreamsSpacePanel
            onOpenUrl={openUrl}
            onOpenInRegion={onOpenInRegion}
            accountId={profile?.id}
            profile={profile}
          />
        </RuntimeShell>
      </div>
    );
  }

  /* ── View Profile Surface runtime ───────────────────────────────────────── */
  if (world === 'View Profile Surface') {
    if (profile?.id && profile?.handle) {
      return (
        <div style={outerStyle}>
          <RuntimeShell
            iframeUrl={iframeUrl}
            onCloseIframe={closeIframe}
            iframeTitle={iframeTitle}
          >
            <EnhancedSpatialShell
              userId={profile.id}
              handle={profile.handle}
              displayName={profile.display_name ?? undefined}
              avatarUrl={profile.avatar_url ?? undefined}
            />
          </RuntimeShell>
        </div>
      );
    }
    // Fallback when profile data is not yet available
    return (
      <div style={outerStyle}>
        <RuntimeShell
          iframeUrl={iframeUrl}
          onCloseIframe={closeIframe}
          iframeTitle={iframeTitle}
        >
          <HomeDreamSurface
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
    const DreamComponent = getDreamComponent(world.id);
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
            <DreamComponent dreamId={world.id} title={`Dream ${world.id}`} open={openUrl} />
          </div>
        </RuntimeShell>
      </div>
    );
  }

  /* ── Engin runtime — open engin route in-region iframe ──────────────────── */
  if (typeof world === 'object' && world.type === 'engin') {
    const route = ENGIN_ROUTES[world.name] ?? '/dreamdmbar';
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