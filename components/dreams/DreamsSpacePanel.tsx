'use client';

/**
 * components/dreams/DreamsSpacePanel.tsx
 *
 * Dreams Space — the DreamSpace world panel.
 *
 * Rendered whenever a runtime region's world is set to 'DreamSpace'.
 * Either the Surface Space or the DreamSpace region can load this world,
 * allowing two independent DreamSpace sessions simultaneously (e.g. two
 * Daydreams or Engins open at the same time in separate runtime regions).
 *
 * Each mounted instance maintains its own independent navigation state
 * (active service, detail URL, etc.) — opening content in one region does
 * not affect the other.
 *
 * Permanent iOS-style app windows are the priority content of the Dreams Space.
 * The 6 Daydream surfaces plus Engin apps (Shop, Marketplace, Ads, Links) are
 * pinned as permanent windows, organized like an iOS home screen, and remain
 * in place until the user changes them.
 *
 * Architecture note (docs/AXIOMS.md §3 — every visible action must do
 * something real): app icons now navigate to the real canonical routes via
 * router.push() instead of embedding them in dead-end iframes.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import UniversalWidget from '@/components/widgets/UniversalWidget';
import { useDreamsRuntime } from '@/lib/dreams/useDreamsRuntime';
import {
  computeMomentum,
  getLevelColor,
  type MomentumLevel,
  type MomentumSnapshot,
} from '@/lib/forge/forgeMomentum';
import {
  generateSuggestions,
  readForgeHistory,
  type ForgeHistoryEntry,
  type ForgeSuggestion,
} from '@/lib/forge/forgeIntelligence';
import {
  readForgeActivity,
  type ForgeActivityPulse,
} from '@/lib/forge/forgeRegistry';

/** Called to open a URL inside the runtime region (no full-page navigation). */
type OpenUrlFn = (url: string, title?: string) => void;

type ServiceType = 'youtube' | 'github' | 'spotify' | null;
/** Top-level view for the Dreams Space panel: Apps home screen (priority) or connector Feeds. */
type DreamsSpaceView = 'apps' | 'feeds';

/** The 6 canonical Daydream surfaces + Analytics — permanent windows from DreamSpace. */
const DAYDREAMS = [
  { id: 'music',     label: 'Music',     icon: '🎵', route: '/daydream/music',      color: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
  { id: 'games',     label: 'Games',     icon: '🎮', route: '/daydream/games',      color: 'linear-gradient(135deg,#059669,#10b981)' },
  { id: 'lab',       label: 'Lab',       icon: '🔬', route: '/daydream/lab',        color: 'linear-gradient(135deg,#0284c7,#38bdf8)' },
  { id: 'code',      label: 'Code',      icon: '💻', route: '/daydream/code',       color: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' },
  { id: 'brand',     label: 'Brand',     icon: '🎨', route: '/daydream/brand',      color: 'linear-gradient(135deg,#b45309,#f59e0b)' },
  { id: 'create',    label: 'Create',    icon: '✏️', route: '/daydream/create',     color: 'linear-gradient(135deg,#be185d,#ec4899)' },
  { id: 'analytics', label: 'Analytics', icon: '📊', route: '/daydream/analytics',  color: 'linear-gradient(135deg,#4338ca,#6366f1)' },
] as const;

/**
 * Permanent Engin app windows — Shop, Marketplace, Ads, and Links (Connectors).
 * These are always pinned in the DreamSpace alongside the Daydream windows.
 */
const ENGIN_APPS = [
  { id: 'shop',        label: 'Shop',      icon: '🛍️', route: '/shop',        color: 'linear-gradient(135deg,#065f46,#059669)' },
  { id: 'marketplace', label: 'Market',    icon: '🏪', route: '/marketplace', color: 'linear-gradient(135deg,#581c87,#9333ea)' },
  { id: 'messages',    label: 'DreamDM',   icon: '💬', route: '/messages',    color: 'linear-gradient(135deg,#0c4a6e,#0ea5e9)' },
  { id: 'discover',    label: 'Discover',  icon: '🔭', route: '/discover',    color: 'linear-gradient(135deg,#1c1917,#44403c)' },
  { id: 'ads',         label: 'Ads',       icon: '📢', route: '/ads',         color: 'linear-gradient(135deg,#1e3a8a,#2563eb)' },
  { id: 'connectors',  label: 'Links',     icon: '🔗', route: '/connectors',  color: 'linear-gradient(135deg,#0e7490,#06b6d4)' },
] as const;

const SERVICE_TABS: { id: ServiceType; label: string; icon: string }[] = [
  { id: null,      label: 'All',     icon: '✨' },
  { id: 'youtube', label: 'YouTube', icon: '📺' },
  { id: 'github',  label: 'GitHub',  icon: '🐙' },
  { id: 'spotify', label: 'Spotify', icon: '🎵' },
];

// iOS-style app icon layout constants
const ICON_SIZE = 54;
const ICON_RADIUS = 14;
const ICON_FONT = 26;
const LABEL_FONT = 11;

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins <= 0) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * iOS-style squircle app icon.
 * Clicking navigates to the canonical surface route — no iframe dead-ends.
 */
function AppIcon({ icon, label, color, onClick }: {
  icon: string;
  label: string;
  color: string;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const press   = () => setPressed(true);
  const release = () => setPressed(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={press}
      onMouseUp={release}
      onMouseLeave={release}
      onTouchStart={press}
      onTouchEnd={release}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && press()}
      onKeyUp={(e)   => (e.key === 'Enter' || e.key === ' ') && release()}
      aria-label={`Open ${label}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 2px',
        transform: pressed ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 0.12s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Squircle icon — iOS-style rounded square with gradient background */}
      <div style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_RADIUS,
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
        fontSize: ICON_FONT,
        lineHeight: 1,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      {/* App label */}
      <span style={{
        fontSize: LABEL_FONT,
        fontWeight: 600,
        color: 'var(--de-heading)',
        letterSpacing: '0.01em',
        textAlign: 'center',
        lineHeight: 1.2,
        maxWidth: 62,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </button>
  );
}

export default function DreamsSpacePanel({
  onOpenUrl,
  onOpenInRegion,
}: {
  onOpenUrl?: OpenUrlFn;
  onOpenInRegion?: (path: string) => void;
}) {
  const runtime = useDreamsRuntime();
  const { state, setService } = runtime;
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [momentum, setMomentum] = useState<MomentumSnapshot | null>(null);
  const [history, setHistory] = useState<ForgeHistoryEntry[]>([]);
  const [activity, setActivity] = useState<ForgeActivityPulse[]>([]);
  const [suggestions, setSuggestions] = useState<ForgeSuggestion[]>([]);

  /** Navigate to a route: use in-region iframe when available, else full navigation. */
  const navigate = (route: string, title?: string) => {
    if (onOpenUrl) {
      onOpenUrl(route, title);
    } else if (onOpenInRegion) {
      onOpenInRegion(route);
    } else {
      router.push(route);
    }
  };

  // Apps home screen is the priority tab — permanent windows shown by default.
  const [view, setView] = useState<DreamsSpaceView>('apps');

  const refreshDreamSpace = useCallback(() => {
    const nextMomentum = computeMomentum();
    const nextHistory = readForgeHistory();
    const nextActivity = readForgeActivity();
    const lastActive = [...nextActivity].sort(
      (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
    )[0];

    setMomentum(nextMomentum);
    setHistory(nextHistory);
    setActivity(nextActivity);
    setSuggestions(generateSuggestions(lastActive ? { enginId: lastActive.enginId, label: lastActive.label } : null));
  }, []);

  useEffect(() => {
    refreshDreamSpace();
    refreshTimer.current = setInterval(refreshDreamSpace, 15_000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [refreshDreamSpace]);

  const levelColor = momentum ? getLevelColor(momentum.level as MomentumLevel) : '#d4a843';
  const leadSuggestion = suggestions[0] ?? null;
  const recentHistory = history.slice().reverse().slice(0, 3);

  // Feed view — main dreams space content
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px 8px',
        flexShrink: 0,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(42,138,184,0.92), rgba(200,152,26,0.88))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(42,138,184,0.18)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 16 }}>✨</span>
        </div>
        <div>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--de-heading)', letterSpacing: '-0.02em', display: 'block' }}>
            DreamSpace
          </span>
          <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
            Pinned apps + feeds across the dual runtime
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--de-text-dim)', marginLeft: 'auto', fontStyle: 'italic' }}>
          dual runtime
        </span>
      </div>

      {/* Primary tab bar — Apps home screen first (priority), Feeds second */}
      <div style={{
        display: 'flex', gap: 0, padding: '0 10px 6px',
        flexShrink: 0,
        borderBottom: '1px solid rgba(200,152,26,0.12)',
      }}>
        {(['apps', 'feeds'] as DreamsSpaceView[]).map((v) => {
          const isActive = view === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              style={{
                flex: 1,
                padding: '6px 0',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #d4a843' : '2px solid transparent',
                color: isActive ? '#d4a843' : 'var(--de-text-dim)',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}
            >
              {v === 'apps' ? '⊞ Apps' : '✨ Feeds'}
            </button>
          );
        })}
      </div>

      {view === 'apps' ? (
        /* ── Permanent iOS-style app home screen ─────────────────────────────── */
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px 20px' }}>

          <div style={{
            marginBottom: 16,
            background: 'linear-gradient(135deg, rgba(42,138,184,0.18), rgba(200,152,26,0.12))',
            borderRadius: 22,
            border: '1px solid rgba(160,195,240,0.18)',
            padding: '14px 14px 12px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(24px) saturate(150%)',
            WebkitBackdropFilter: 'blur(24px) saturate(150%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(42,138,184,0.92), rgba(200,152,26,0.92))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(42,138,184,0.22)',
                fontSize: 18,
                flexShrink: 0,
              }}>
                ✦
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)' }}>DreamSpace</div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                  DREAMfield now powers the live pulse of this layer.
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/daydream/field', 'DREAMfield')}
                style={{
                  marginLeft: 'auto',
                  borderRadius: 9999,
                  border: '1px solid rgba(200,152,26,0.28)',
                  background: 'rgba(200,152,26,0.12)',
                  color: '#d4a843',
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Open DREAMfield
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 10 }}>
              <div style={{
                borderRadius: 18,
                background: 'rgba(255,255,255,0.58)',
                border: '1px solid rgba(255,255,255,0.78)',
                padding: '12px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Live Pulse
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1 }}>
                    {momentum?.composite ?? 0}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>/100</span>
                </div>
                <div style={{
                  marginTop: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  borderRadius: 9999,
                  background: `${levelColor}18`,
                  border: `1px solid ${levelColor}28`,
                  color: levelColor,
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  {momentum?.level ?? 'DORMANT'}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.45 }}>
                  {(momentum?.enginesUsedToday?.length ?? 0) > 0
                    ? `Active today: ${momentum?.enginesUsedToday.join(' · ')}`
                    : 'Move through a few Daydreams to wake up the pulse.'}
                </div>
              </div>

              <div style={{
                borderRadius: 18,
                background: 'rgba(255,255,255,0.58)',
                border: '1px solid rgba(255,255,255,0.78)',
                padding: '12px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Next Move
                </div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: leadSuggestion?.accent ?? 'var(--de-heading)' }}>
                  {leadSuggestion?.title ?? 'Open a Daydream and start shaping the space'}
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.45 }}>
                  {leadSuggestion?.reason ?? 'DreamSpace now carries your momentum, suggestions, and recent flow in one place.'}
                </div>
                {leadSuggestion?.href && (
                  <button
                    type="button"
                    onClick={() => navigate(leadSuggestion.href, leadSuggestion.title)}
                    style={{
                      marginTop: 10,
                      borderRadius: 9999,
                      border: `1px solid ${leadSuggestion.accent}30`,
                      background: `${leadSuggestion.accent}14`,
                      color: leadSuggestion.accent,
                      padding: '6px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Open suggestion
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <div style={{
                borderRadius: 18,
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.74)',
                padding: '12px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Recent Motion
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recentHistory.length > 0 ? recentHistory.map((entry, index) => (
                    <div
                      key={`${entry.timestamp}-${index}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 8px',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.46)',
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0, fontSize: 11, color: 'var(--de-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entry.label}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--de-text-dim)', flexShrink: 0 }}>
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </div>
                  )) : (
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                      Your recent motion shows up here once you move through the system.
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                borderRadius: 18,
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.74)',
                padding: '12px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Active Channels
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activity.length > 0 ? activity
                    .slice()
                    .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item.enginId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 8px',
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.46)',
                        }}
                      >
                        <span style={{ flex: 1, minWidth: 0, fontSize: 11, color: 'var(--de-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: 10, color: '#d4a843', fontWeight: 700, flexShrink: 0 }}>
                          {formatRelativeTime(item.lastActive)}
                        </span>
                      </div>
                    )) : (
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                      Channels light up as your Daydreams and Engins stay in motion.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Daydreams */}
          <div style={{
            marginBottom: 16,
            background: 'rgba(255,255,255,0.58)',
            borderRadius: 22,
            border: '1px solid rgba(255,255,255,0.78)',
            padding: '12px 8px 10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.52)',
            backdropFilter: 'blur(24px) saturate(150%)',
            WebkitBackdropFilter: 'blur(24px) saturate(150%)',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--de-text-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0 4px 8px',
            }}>
              Daydreams
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px 4px',
              justifyItems: 'center',
            }}>
              {DAYDREAMS.map((dd) => (
                <AppIcon
                  key={dd.id}
                  icon={dd.icon}
                  label={dd.label}
                  color={dd.color}
                  onClick={() => navigate(dd.route, dd.label)}
                />
              ))}
            </div>
          </div>

          {/* Section: Engin — Shop, Marketplace, Ads, Links */}
          <div style={{
            background: 'rgba(255,255,255,0.58)',
            borderRadius: 22,
            border: '1px solid rgba(255,255,255,0.78)',
            padding: '12px 8px 10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.52)',
            backdropFilter: 'blur(24px) saturate(150%)',
            WebkitBackdropFilter: 'blur(24px) saturate(150%)',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--de-text-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0 4px 8px',
            }}>
              Engin
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px 4px',
              justifyItems: 'center',
            }}>
              {ENGIN_APPS.map((app) => (
                <AppIcon
                  key={app.id}
                  icon={app.icon}
                  label={app.label}
                  color={app.color}
                  onClick={() => navigate(app.route, app.label)}
                />
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* ── Feeds — connector content ── */
        <>
          {/* Service tabs */}
          <div style={{
            display: 'flex', gap: 4, padding: '6px 10px 8px',
            overflowX: 'auto', flexShrink: 0,
          }}>
            {SERVICE_TABS.map((tab) => {
              const isActive = state.activeService === tab.id;
              return (
                <button
                  key={tab.id ?? 'all'}
                  type="button"
                  onClick={() => setService(tab.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 9999,
                    border: isActive
                      ? '1px solid rgba(200,152,26,0.6)'
                      : '1px solid rgba(160,195,240,0.2)',
                    background: isActive
                      ? 'rgba(200,152,26,0.15)'
                      : 'rgba(160,195,240,0.06)',
                    color: isActive ? '#d4a843' : 'var(--de-text-dim)',
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Widget content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 10px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {state.activeService === null ? (
              // All services
              <>
                <UniversalWidget service="youtube" sliceName="Subscriptions" />
                <UniversalWidget service="github" sliceName="Activity" />
              </>
            ) : (
              // Single service
              <UniversalWidget
                service={state.activeService as ServiceType}
                sliceName={
                  state.activeService === 'youtube' ? 'Subscriptions' :
                  state.activeService === 'github'  ? 'Activity' :
                  state.activeService === 'spotify' ? 'Now Playing' :
                  undefined
                }
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
