'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, Users, X, Check, Plug, ChevronLeft, ChevronRight, Eye, EyeOff, Lock } from 'lucide-react';
import ConnectorWidgetPicker, { type PickerConnector, TOP_10_CONNECTORS } from '@/components/connectors/ConnectorWidgetPicker';
import { tierToDbVisibility, type WidgetShellVisibilityTier } from '@/types/widgets';

// ── Types ─────────────────────────────────────────────────────────────────────

export type WidgetType =
  | 'bio' | 'activity' | 'followers' | 'photos'
  | 'linkedin' | 'twitter' | 'quote'
  | 'instagram' | 'spotify' | 'youtube' | 'tiktok'
  | 'github' | 'weather' | 'apple' | 'snapchat';

/** small = 1 column (half-width), large = 2 columns (full-width) */
export type WidgetSize = 'small' | 'large';

export type WidgetBgStyle = 'white' | 'glass' | 'warm' | 'tinted' | 'dark';

export type WidgetConfig = {
  accentColor: string;
  bgStyle: WidgetBgStyle;
  titleOverride?: string;
  quoteText?: string;
  twitterHandle?: string;
  linkedinRole?: string;
  linkedinCompany?: string;
  activityDays?: 7 | 30 | 90;
  photoCount?: 3 | 6 | 9;
};

export type Widget = {
  id: string;
  type: WidgetType;
  size?: WidgetSize;
  config?: WidgetConfig;
  /**
   * Supabase widget_instances.instance_id for this widget.
   * Present when the widget was loaded from or saved to the DB.
   * When set, mutations (reorder, visibility) are synced to the DB via
   * PATCH /api/widgets/instances.
   */
  instanceId?: string;
  /**
   * Audience visibility tier for the profile output surface.
   * Defaults to 'hidden' (private) — nothing public by default (LAW.md §2).
   */
  visibilityTier?: WidgetShellVisibilityTier;
};

export const DEFAULT_CONFIG: WidgetConfig = {
  accentColor: '#c8981a',
  bgStyle: 'white',
  activityDays: 7,
  photoCount: 3,
  quoteText: 'The best way to predict the future is to create it.',
  linkedinRole: 'Senior UX Designer',
  linkedinCompany: 'Google',
  twitterHandle: 'TechNews',
};

export const DEFAULT_WIDGETS: Widget[] = [
  { id: 'bio',       type: 'bio',       size: 'large' },
  { id: 'activity',  type: 'activity',  size: 'large' },
  { id: 'photos',    type: 'photos',    size: 'large' },
  { id: 'followers', type: 'followers', size: 'small' },
  { id: 'twitter',   type: 'twitter',   size: 'small' },
  { id: 'linkedin',  type: 'linkedin',  size: 'small' },
  { id: 'quote',     type: 'quote',     size: 'small' },
];

export const WIDGET_TRAY: { type: WidgetType; label: string; icon: string }[] = [
  { type: 'bio',       label: 'Bio',       icon: '👤' },
  { type: 'photos',    label: 'Photos',    icon: '📷' },
  { type: 'activity',  label: 'Activity',  icon: '📈' },
  { type: 'twitter',   label: 'Twitter',   icon: '🐦' },
  { type: 'linkedin',  label: 'Linkedin',  icon: '💼' },
  { type: 'followers', label: 'Followers', icon: '👥' },
  { type: 'quote',     label: 'Quote',     icon: '💬' },
];

const COLOR_SWATCHES = [
  { color: '#c8981a', label: 'Gold' },
  { color: '#4A9ED6', label: 'Blue' },
  { color: '#3b7dd8', label: 'Dark Blue' },
  { color: '#22c55e', label: 'Green' },
  { color: '#ec4899', label: 'Pink' },
  { color: '#f97316', label: 'Orange' },
  { color: '#ef4444', label: 'Red' },
  { color: '#14b8a6', label: 'Teal' },
  { color: '#1a1a1a', label: 'Dark' },
];

const BG_STYLES: { value: WidgetBgStyle; label: string }[] = [
  { value: 'white',  label: 'Clean' },
  { value: 'glass',  label: 'Glass' },
  { value: 'warm',   label: 'Warm' },
  { value: 'tinted', label: 'Tinted' },
  { value: 'dark',   label: 'Dark' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getWidgetLabel(type: WidgetType): string {
  return {
    bio: 'Bio Card', activity: 'Activity', followers: 'Followers',
    photos: 'Photos', linkedin: 'LinkedIn', twitter: 'Twitter', quote: 'Quote',
    instagram: 'Instagram', spotify: 'Spotify', youtube: 'YouTube',
    tiktok: 'TikTok', github: 'GitHub', weather: 'Weather',
    apple: 'Apple Music', snapchat: 'Snapchat',
  }[type];
}

const LARGE_DEFAULT_TYPES: ReadonlySet<WidgetType> = new Set(['bio', 'activity', 'photos']);

function getDefaultSize(type: WidgetType): WidgetSize {
  return LARGE_DEFAULT_TYPES.has(type) ? 'large' : 'small';
}

// ── Layout / content constants ─────────────────────────────────────────────────
const MIN_SMALL_WIDGET_HEIGHT = 120;
const BIO_SMALL_TRUNCATE      = 35;   // chars shown in compact bio
const BIO_LARGE_TRUNCATE      = 55;
const PLACEHOLDER_FOLLOWING   = 524;  // mock — replace with real data prop when available

function getCardBg(style: WidgetBgStyle, accent: string): React.CSSProperties {
  switch (style) {
    case 'glass':  return { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
    case 'warm':   return { background: 'linear-gradient(135deg, #fff8ed, #fff3d6)' };
    case 'tinted': return { background: `${accent}12` };
    case 'dark':   return { background: 'rgba(20,20,35,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' };
    default:       return { background: '#ffffff' };
  }
}

function getTextColor(style: WidgetBgStyle): string {
  return style === 'dark' ? '#ffffff' : '#1a1a1a';
}
function getDimColor(style: WidgetBgStyle): string {
  return style === 'dark' ? 'rgba(255,255,255,0.55)' : '#999';
}

// ── Dot-grid icon (iOS-style drag/settings handle) ────────────────────────────

function DotGrid() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 4px)', gap: '3px', opacity: 0.32 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#444' }} />
      ))}
    </div>
  );
}

function SparkLine({ data, color, height = 56 }: { data: number[]; color: string; height?: number }) {
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
  const W = 200, H = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / r) * (H - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 38 }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, height: `${(v / max) * 100}%`,
          background: i === data.length - 1 ? color : `${color}44`,
          borderRadius: '3px 3px 0 0',
        }} />
      ))}
    </div>
  );
}

// ── Widget Config Sheet ────────────────────────────────────────────────────────

function WidgetConfigSheet({
  widget, onClose, onSave,
}: {
  widget: Widget;
  onClose: () => void;
  onSave: (config: WidgetConfig, size: WidgetSize) => void;
}) {
  const cfg  = { ...DEFAULT_CONFIG, ...widget.config };
  const [size,       setSize]       = useState<WidgetSize>(widget.size ?? getDefaultSize(widget.type));
  const [color,      setColor]      = useState(cfg.accentColor);
  const [bgStyle,    setBgStyle]    = useState<WidgetBgStyle>(cfg.bgStyle);
  const [quoteText,  setQuoteText]  = useState(cfg.quoteText ?? DEFAULT_CONFIG.quoteText!);
  const [liRole,     setLiRole]     = useState(cfg.linkedinRole ?? DEFAULT_CONFIG.linkedinRole!);
  const [liCompany,  setLiCompany]  = useState(cfg.linkedinCompany ?? DEFAULT_CONFIG.linkedinCompany!);
  const [twHandle,   setTwHandle]   = useState(cfg.twitterHandle ?? DEFAULT_CONFIG.twitterHandle!);
  const [actDays,    setActDays]    = useState<7|30|90>(cfg.activityDays ?? 7);
  const [photoCount, setPhotoCount] = useState<3|6|9>(cfg.photoCount ?? 3);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    background: 'rgba(240,244,250,0.9)', border: '1px solid rgba(160,195,240,0.30)',
    color: '#1a1a1a', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#888',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    display: 'block', marginBottom: 6, marginTop: 16,
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
        background: '#f5f7fa',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        maxHeight: '82svh', overflowY: 'auto',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
      }}>
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#ddd' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 0' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a' }}>
              {getWidgetLabel(widget.type)}
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>Customize Dream</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%', background: '#e8eaed',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={15} style={{ color: '#666' }} />
          </button>
        </div>

        <div style={{ padding: '0 18px 8px' }}>

          {/* ── Widget Size ── */}
          <label style={sectionLabel}>Size</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['small', 'large'] as WidgetSize[]).map(s => (
              <button key={s} onClick={() => setSize(s)} style={{
                padding: '12px 0', borderRadius: 12,
                background: size === s ? color : 'rgba(255,255,255,0.85)',
                border: size === s ? 'none' : '1px solid rgba(160,195,240,0.25)',
                color: size === s ? '#fff' : '#555',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: size === s ? `0 3px 10px ${color}44` : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                {/* Mini size preview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: s === 'small' ? '1fr' : '1fr 1fr',
                  gap: 3,
                  width: s === 'small' ? 20 : 44,
                  height: 20,
                }}>
                  {(s === 'small' ? [1] : [1, 2]).map(n => (
                    <div key={n} style={{
                      borderRadius: 4,
                      background: size === s ? 'rgba(255,255,255,0.45)' : `${color}25`,
                    }} />
                  ))}
                </div>
                {s === 'small' ? 'Half width' : 'Full width'}
              </button>
            ))}
          </div>

          {/* ── Accent Color ── */}
          <label style={sectionLabel}>Accent Color</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {COLOR_SWATCHES.map(({ color: c, label }) => (
              <button key={c} onClick={() => setColor(c)} title={label} style={{
                width: 34, height: 34, borderRadius: '50%', background: c,
                border: color === c ? '3px solid #fff' : '3px solid transparent',
                outline: color === c ? `2.5px solid ${c}` : 'none',
                cursor: 'pointer', flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'transform 0.1s',
                transform: color === c ? 'scale(1.15)' : 'scale(1)',
              }} />
            ))}
          </div>

          {/* ── Background Style ── */}
          <label style={sectionLabel}>Background</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {BG_STYLES.map(({ value, label }) => (
              <button key={value} onClick={() => setBgStyle(value)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 10,
                background: bgStyle === value ? color : 'rgba(255,255,255,0.8)',
                border: bgStyle === value ? 'none' : '1px solid rgba(160,195,240,0.25)',
                color: bgStyle === value ? '#fff' : '#555',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: bgStyle === value ? `0 3px 10px ${color}44` : 'none',
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── Widget-specific options ── */}
          {widget.type === 'quote' && (
            <>
              <label style={sectionLabel}>Quote Text</label>
              <textarea value={quoteText} onChange={e => setQuoteText(e.target.value)}
                rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </>
          )}

          {widget.type === 'linkedin' && (
            <>
              <label style={sectionLabel}>Role / Title</label>
              <input value={liRole} onChange={e => setLiRole(e.target.value)} style={inputStyle} />
              <label style={sectionLabel}>Company</label>
              <input value={liCompany} onChange={e => setLiCompany(e.target.value)} style={inputStyle} />
            </>
          )}

          {widget.type === 'twitter' && (
            <>
              <label style={sectionLabel}>Twitter Handle</label>
              <input value={twHandle} onChange={e => setTwHandle(e.target.value)}
                placeholder="@handle" style={inputStyle} />
            </>
          )}

          {widget.type === 'activity' && (
            <>
              <label style={sectionLabel}>Time Range</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([7, 30, 90] as const).map(d => (
                  <button key={d} onClick={() => setActDays(d)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 10,
                    background: actDays === d ? color : 'rgba(255,255,255,0.8)',
                    border: actDays === d ? 'none' : '1px solid rgba(160,195,240,0.25)',
                    color: actDays === d ? '#fff' : '#555',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>
                    {d}d
                  </button>
                ))}
              </div>
            </>
          )}

          {widget.type === 'photos' && (
            <>
              <label style={sectionLabel}>Photo Count</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([3, 6, 9] as const).map(n => (
                  <button key={n} onClick={() => setPhotoCount(n)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 10,
                    background: photoCount === n ? color : 'rgba(255,255,255,0.8)',
                    border: photoCount === n ? 'none' : '1px solid rgba(160,195,240,0.25)',
                    color: photoCount === n ? '#fff' : '#555',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>
                    {n}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Apply ── */}
          <button onClick={() => {
            onSave({
              accentColor: color, bgStyle,
              quoteText, linkedinRole: liRole, linkedinCompany: liCompany,
              twitterHandle: twHandle, activityDays: actDays, photoCount,
            }, size);
            onClose();
          }} style={{
            width: '100%', marginTop: 20, padding: '14px 0',
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            border: 'none', borderRadius: 14,
            color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
            boxShadow: `0 6px 20px ${color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Check size={16} /> Apply Changes
          </button>
        </div>
      </div>
    </>
  );
}

// ── Connector-sourced widget shell ────────────────────────────────────────────

function ConnectorSourcedWidget({
  symbol, brandColor, bgColor, name, sub,
  textColor, dimColor, connected, accent, extra, size,
}: {
  symbol: string; brandColor: string; bgColor: string;
  name: string; sub: string; textColor: string; dimColor: string;
  connected?: boolean; accent: string;
  extra?: React.ReactNode;
  size: WidgetSize;
}) {
  const isLarge = size === 'large';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isLarge ? 10 : 6 }}>
        <div style={{
          width: isLarge ? 34 : 28, height: isLarge ? 34 : 28,
          borderRadius: isLarge ? 10 : 8,
          background: bgColor,
          border: `1.5px solid ${brandColor}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: symbol.length > 2 ? 13 : (isLarge ? 18 : 15),
          fontWeight: 900, color: brandColor,
        }}>
          {symbol}
        </div>
        <div>
          <div style={{ fontSize: isLarge ? 15 : 13, fontWeight: 700, color: textColor }}>{name}</div>
          <div style={{ fontSize: 10, color: dimColor }}>{sub}</div>
        </div>
      </div>
      {extra}
      {connected ? (
        <div style={{
          marginTop: 8, padding: '6px 10px', borderRadius: 9,
          background: bgColor, fontSize: 10, color: brandColor, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <Check size={9} /> Connected
        </div>
      ) : (
        <Link
          href="/connectors"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
            padding: '7px 12px', borderRadius: 9,
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            fontSize: 10, fontWeight: 700, color: '#fff', textDecoration: 'none',
            boxShadow: `0 3px 8px ${accent}44`,
          }}
        >
          <Plug size={9} /> Connect
        </Link>
      )}
    </div>
  );
}

// ── Widget content (size-aware) ────────────────────────────────────────────────

interface WidgetContentProps {
  type: WidgetType;
  size: WidgetSize;
  config: WidgetConfig;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  coverUrl?: string | null;
  followers: number;
  posts: number;
  likes: number;
}

const PLACEHOLDER_PHOTO_SRCS = [
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=200&q=75',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&q=75',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&q=75',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=75',
];

function WidgetContent(p: WidgetContentProps) {
  const { type, size, config, displayName, avatarUrl, bio, coverUrl, followers, posts, likes } = p;
  const accent    = config.accentColor;
  const textColor = getTextColor(config.bgStyle);
  const dimColor  = getDimColor(config.bgStyle);
  const initials  = (displayName || 'D')[0].toUpperCase();
  const isLarge   = size === 'large';

  switch (type) {

    // ── Bio ──────────────────────────────────────────────────────────────────
    case 'bio': {
      if (!isLarge) {
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#fff',
              }}>
                {avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: textColor, lineHeight: 1.2 }}>{displayName}</div>
                {bio && (
                  <div style={{ fontSize: 10, color: dimColor, lineHeight: 1.3, marginTop: 2 }}>
                    {bio.length > BIO_SMALL_TRUNCATE ? bio.slice(0, BIO_SMALL_TRUNCATE) + '…' : bio}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ icon: <Heart size={11} />, label: 'Like' }, { icon: <Share2 size={11} />, label: 'Share' }].map(({ icon, label }) => (
                <button key={label} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                  padding: '6px 0', borderRadius: 9,
                  background: config.bgStyle === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 600, color: dimColor,
                }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        );
      }
      // large
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#fff',
            }}>
              {avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: textColor }}>{displayName}</div>
              {bio && (
                <div style={{ fontSize: 11, color: dimColor, marginTop: 2, lineHeight: 1.35 }}>
                  {bio.length > BIO_LARGE_TRUNCATE ? bio.slice(0, BIO_LARGE_TRUNCATE) + '…' : bio}
                </div>
              )}
            </div>
          </div>
          {coverUrl
            ? (
              <div style={{ borderRadius: 14, overflow: 'hidden', height: 130 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )
            : <div style={{ borderRadius: 14, height: 120, background: `linear-gradient(135deg, ${accent}30, ${accent}18)` }} />
          }
          <div style={{ display: 'flex', gap: 4 }}>
            {[{ icon: <Heart size={13} />, label: 'Like' },
              { icon: <MessageCircle size={13} />, label: 'Comment' },
              { icon: <Share2 size={13} />, label: 'Share' }].map(({ icon, label }) => (
              <button key={label} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '7px 0', borderRadius: 10,
                background: config.bgStyle === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, color: dimColor,
              }}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // ── Activity ─────────────────────────────────────────────────────────────
    case 'activity': {
      if (!isLarge) {
        return (
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, color: textColor, marginBottom: 6 }}>Activity</div>
            <SparkLine data={[100, 130, 115, 160, 180, 165, 205]} color={accent} height={40} />
            <div style={{ fontSize: 10, color: dimColor, marginTop: 4 }}>
              {posts || 12} Posts · {likes || 46} Likes
            </div>
          </div>
        );
      }
      return (
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: textColor, marginBottom: 4 }}>Activity Summary</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: dimColor, marginBottom: 2 }}>
            <span>200</span><span>150</span><span>100</span>
          </div>
          <SparkLine data={[100, 120, 115, 145, 160, 155, 180, 175, 195, 205]} color={accent} height={64} />
          <div style={{ marginTop: 8, fontSize: 12, color: dimColor, lineHeight: 1.8 }}>
            <span style={{ fontWeight: 600, color: textColor }}>Last {config.activityDays ?? 7} Days</span><br />
            {posts || 12} Posts &nbsp;·&nbsp; {likes || 46} Likes
          </div>
        </div>
      );
    }

    // ── Followers ─────────────────────────────────────────────────────────────
    case 'followers': {
      const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n || 0);
      if (!isLarge) {
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${accent}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={13} style={{ color: accent }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 12, color: textColor }}>Followers</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: textColor, lineHeight: 1 }}>{fmt(followers)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 10, color: dimColor }}>
              <span style={{ fontSize: 12 }}>🪙</span> Following {PLACEHOLDER_FOLLOWING}
            </div>
          </div>
        );
      }
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${accent}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} style={{ color: accent }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: textColor }}>Followers</span>
          </div>
          <div style={{ display: 'flex', gap: 28, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: textColor, lineHeight: 1 }}>{fmt(followers)}</div>
              <div style={{ fontSize: 10, color: dimColor, marginTop: 3 }}>Followers</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: textColor, lineHeight: 1 }}>{PLACEHOLDER_FOLLOWING}</div>
              <div style={{ fontSize: 10, color: dimColor, marginTop: 3 }}>Following</div>
            </div>
          </div>
          <SparkLine data={[40, 55, 48, 62, 70, 65, 80]} color={accent} height={44} />
          <div style={{ fontSize: 10, color: dimColor, marginTop: 4 }}>Growth — last 7 days</div>
        </div>
      );
    }

    // ── Photos ────────────────────────────────────────────────────────────────
    case 'photos': {
      const count = isLarge ? 4 : 3;
      const cols  = isLarge ? 2 : 3;
      return (
        <div>
          <div style={{ fontWeight: 700, fontSize: isLarge ? 15 : 12, color: textColor, marginBottom: 8 }}>
            Recent Photos
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 5 }}>
            {PLACEHOLDER_PHOTO_SRCS.slice(0, count).map((src, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: '#eee' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          {isLarge && (
            <div style={{ fontSize: 11, color: dimColor, marginTop: 8 }}>
              Last 7 Days: {posts || 10} Posts, {likes || 38} Likes
            </div>
          )}
        </div>
      );
    }

    // ── LinkedIn ──────────────────────────────────────────────────────────────
    case 'linkedin': {
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isLarge ? 10 : 8 }}>
            <div style={{
              width: isLarge ? 30 : 26, height: isLarge ? 30 : 26, borderRadius: 7,
              background: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 11 }}>in</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: isLarge ? 15 : 13, color: textColor }}>
              {isLarge ? 'LinkedIn Job Alert' : 'LinkedIn'}
            </span>
          </div>
          <div style={{ fontSize: isLarge ? 13 : 12, color: textColor, lineHeight: 1.5, marginBottom: isLarge ? 4 : 8 }}>
            {config.linkedinRole ?? 'Senior UX Designer'}<br />
            at {config.linkedinCompany ?? 'Google'}
          </div>
          {isLarge && (
            <div style={{ fontSize: 11, color: dimColor, marginBottom: 10 }}>
              200+ applicants · Posted 2 days ago
            </div>
          )}
          <button style={{
            width: '100%', padding: isLarge ? '11px 0' : '9px 0',
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            border: 'none', borderRadius: 10, color: '#fff',
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            boxShadow: `0 3px 10px ${accent}44`,
          }}>
            Apply Now
          </button>
        </div>
      );
    }

    // ── Twitter ───────────────────────────────────────────────────────────────
    case 'twitter': {
      if (!isLarge) {
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: '#1DA1F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>𝕏</span>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: textColor }}>Twitter</div>
                <div style={{ fontSize: 10, color: dimColor }}>@{config.twitterHandle ?? 'TechNews'}</div>
              </div>
            </div>
            <BarChart data={[3, 5, 4, 7, 6, 8, 7]} color={accent} />
            <div style={{ fontSize: 10, color: dimColor, marginTop: 4 }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      }
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#1DA1F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>𝕏</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>Twitter</div>
                <div style={{ fontSize: 11, color: dimColor }}>@{config.twitterHandle ?? 'TechNews'}</div>
              </div>
            </div>
          </div>
          <div style={{
            padding: '10px 12px', borderRadius: 12, marginBottom: 10,
            background: config.bgStyle === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
          }}>
            <div style={{ fontSize: 12, color: textColor, lineHeight: 1.55 }}>
              BREAKING: Major AI breakthrough announced today. Stocks surge.{' '}
              <span style={{ color: accent }}>#AI #Tech</span>
            </div>
            <div style={{ fontSize: 10, color: dimColor, marginTop: 6 }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Today
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <BarChart data={[3, 5, 4, 7, 6, 8, 7]} color={accent} />
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: dimColor, marginLeft: 12, flexShrink: 0 }}>
              <span style={{ color: '#1DA1F2' }}>♥ 1.2K</span>
              <span>♻ 5.4K</span>
            </div>
          </div>
          <button style={{
            width: '100%', marginTop: 10, padding: '8px 0',
            background: 'none', border: `1.5px solid ${accent}44`,
            borderRadius: 10, color: accent, fontWeight: 700, fontSize: 11, cursor: 'pointer',
          }}>
            View Thread
          </button>
        </div>
      );
    }

    // ── Quote ─────────────────────────────────────────────────────────────────
    case 'quote': {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: isLarge ? 110 : 80 }}>
          <div style={{ fontSize: isLarge ? 36 : 26, color: `${accent}55`, lineHeight: 1, marginBottom: 4 }}>&ldquo;</div>
          <p style={{ fontSize: isLarge ? 13 : 11, color: textColor, fontStyle: 'italic', lineHeight: 1.55, margin: 0 }}>
            {config.quoteText ?? DEFAULT_CONFIG.quoteText}
          </p>
        </div>
      );
    }

    // ── Connector widgets ─────────────────────────────────────────────────────

    case 'instagram': return (
      <ConnectorSourcedWidget size={size}
        symbol="📸" brandColor="#E1306C" bgColor="rgba(225,48,108,0.12)"
        name="Instagram" sub="Timeline & stories" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
      />
    );

    case 'spotify': return (
      <ConnectorSourcedWidget size={size}
        symbol="♫" brandColor="#1DB954" bgColor="rgba(29,185,84,0.12)"
        name="Spotify" sub="Now playing & playlists" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
      />
    );

    case 'youtube': return (
      <ConnectorSourcedWidget size={size}
        symbol="▶" brandColor="#FF0000" bgColor="rgba(255,0,0,0.10)"
        name="YouTube" sub="Subscriptions feed" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
      />
    );

    case 'tiktok': return (
      <ConnectorSourcedWidget size={size}
        symbol="🎬" brandColor="#69C9D0" bgColor="rgba(105,201,208,0.12)"
        name="TikTok" sub="Following feed" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
      />
    );

    case 'github': return (
      <ConnectorSourcedWidget size={size}
        symbol="⬡" brandColor="#6e40c9" bgColor="rgba(110,64,201,0.12)"
        name="GitHub" sub="Activity & pull requests" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
      />
    );

    case 'weather': return (
      <ConnectorSourcedWidget size={size}
        symbol="☁" brandColor="#4A9ED6" bgColor="rgba(74,158,214,0.12)"
        name="Weather" sub="Live forecast" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
        extra={<div style={{ fontSize: isLarge ? 28 : 22, fontWeight: 800, color: '#4A9ED6', marginTop: 4 }}>72°F ⛅</div>}
      />
    );

    case 'apple': return (
      <ConnectorSourcedWidget size={size}
        symbol="♩" brandColor="#FA243C" bgColor="rgba(250,36,60,0.10)"
        name="Apple Music" sub="Library & recent plays" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
      />
    );

    case 'snapchat': return (
      <ConnectorSourcedWidget size={size}
        symbol="👻" brandColor="#c8981a" bgColor="rgba(255,252,0,0.15)"
        name="Snapchat" sub="Stories & memories" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
      />
    );

    default: return null;
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ProfileWidgetGridProps {
  displayName: string;
  handle: string;
  avatarUrl?: string | null;
  bio?: string | null;
  coverUrl?: string | null;
  followers?: number;
  posts?: number;
  likes?: number;
  isEditing?: boolean;
  initialWidgets?: Widget[];
  onSave?: (widgets: Widget[]) => void;
}

export default function ProfileWidgetGrid({
  displayName, handle: _handle, avatarUrl, bio, coverUrl,
  followers = 0, posts = 12, likes = 46,
  isEditing = false,
  initialWidgets, onSave,
}: ProfileWidgetGridProps) {
  const [widgets, setWidgets]                           = useState<Widget[]>(initialWidgets ?? DEFAULT_WIDGETS);
  const [showConnectorPicker, setShowConnectorPicker]   = useState(false);
  const [configWidget, setConfigWidget]                 = useState<Widget | null>(null);
  const dragSrc                                         = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx]                   = useState<number | null>(null);

  // ── Supabase persistence helpers ─────────────────────────────────────────────
  // Fire-and-forget: never block the UI. Optimistic updates happen immediately
  // in local state; the PATCH call syncs to Supabase in the background.
  // Only runs for widgets that have a DB-backed instanceId.

  const patchInstance = useCallback(
    async (instanceId: string, patch: Record<string, unknown>) => {
      try {
        const res = await fetch('/api/widgets/instances', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instance_id: instanceId, ...patch }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.warn('[ProfileWidgetGrid] instance patch failed:', err);
        }
      } catch (e) {
        console.warn('[ProfileWidgetGrid] instance patch error:', e);
      }
    },
    [],
  );

  /**
   * After a reorder, sync every widget that has an instanceId.
   * Maps array position → focus_rank (0 = first / highest priority).
   */
  const syncOrder = useCallback(
    (ordered: Widget[]) => {
      ordered.forEach((w, idx) => {
        if (w.instanceId) {
          void patchInstance(w.instanceId, { focus_rank: idx });
        }
      });
    },
    [patchInstance],
  );

  /**
   * After a visibility change, sync the single affected widget.
   * Uses tierToDbVisibility from types/widgets to convert to DB enum.
   */
  const syncVisibility = useCallback(
    (w: Widget, tier: WidgetShellVisibilityTier) => {
      if (w.instanceId) {
        void patchInstance(w.instanceId, { visibility: tierToDbVisibility(tier) });
      }
    },
    [patchInstance],
  );

  // Drag-and-drop
  const onDragStart = (i: number) => { dragSrc.current = i; };
  const onDrop = (i: number) => {
    if (dragSrc.current === null || dragSrc.current === i) return;
    const next = [...widgets];
    const [moved] = next.splice(dragSrc.current, 1);
    next.splice(i, 0, moved);
    dragSrc.current = null;
    setDragOverIdx(null);
    setWidgets(next);
    onSave?.(next);
    // Sync new sort order to Supabase for any DB-backed instances.
    syncOrder(next);
  };

  const addWidget = (type: WidgetType) => {
    if (widgets.some(w => w.type === type)) return;
    const next = [...widgets, {
      id: `${type}-${Date.now()}`,
      type,
      size: getDefaultSize(type),
      config: { ...DEFAULT_CONFIG },
    }];
    setWidgets(next);
    onSave?.(next);
  };

  const removeWidget = (id: string) => {
    const next = widgets.filter(w => w.id !== id);
    setWidgets(next);
    onSave?.(next);
  };

  /** Save both config and size from the config sheet */
  const saveWidget = (widgetId: string, cfg: WidgetConfig, size: WidgetSize) => {
    const next = widgets.map(w => w.id === widgetId ? { ...w, config: cfg, size } : w);
    setWidgets(next);
    onSave?.(next);
  };

  /** Quick toggle between small and large directly on the card */
  const toggleSize = (widgetId: string) => {
    const next = widgets.map(w => {
      if (w.id !== widgetId) return w;
      const current = w.size ?? getDefaultSize(w.type);
      return { ...w, size: (current === 'small' ? 'large' : 'small') as WidgetSize };
    });
    setWidgets(next);
    onSave?.(next);
  };

  /**
   * Cycle widget visibility tier: hidden → everyone → followers-only → hidden.
   * Optimistic: local state updates immediately; DB sync fires in background.
   */
  const cycleVisibility = (widgetId: string) => {
    const CYCLE: WidgetShellVisibilityTier[] = ['hidden', 'everyone', 'followers-only'];
    let synced: Widget | undefined;
    const next = widgets.map(w => {
      if (w.id !== widgetId) return w;
      const current = w.visibilityTier ?? 'hidden';
      const nextTier = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
      synced = { ...w, visibilityTier: nextTier };
      return synced;
    });
    setWidgets(next);
    onSave?.(next);
    // Persist to Supabase for DB-backed instances.
    if (synced) syncVisibility(synced, synced.visibilityTier ?? 'hidden');
  };

  const handleConnectorAdd = (connector: PickerConnector) => {
    addWidget(connector.widgetType as WidgetType);
  };

  const getConfig  = (w: Widget): WidgetConfig => ({ ...DEFAULT_CONFIG, ...w.config });
  const getSize    = (w: Widget): WidgetSize   => w.size ?? getDefaultSize(w.type);
  const isFullSpan = (w: Widget): boolean      => getSize(w) === 'large';

  const cardStyle = (w: Widget, idx: number): React.CSSProperties => ({
    ...getCardBg(getConfig(w).bgStyle, getConfig(w).accentColor),
    borderRadius: 20,
    padding: isFullSpan(w) ? 18 : 14,
    boxShadow: dragOverIdx === idx && isEditing
      ? '0 0 0 3px #c8981a, 0 4px 20px rgba(200,152,26,0.22)'
      : isEditing ? '0 2px 12px rgba(0,0,0,0.06)' : '0 2px 16px rgba(0,0,0,0.08)',
    border: dragOverIdx === idx && isEditing
      ? '2px dashed #c8981a'
      : isEditing
      ? '2px dashed rgba(0,0,0,0.11)'
      : '1.5px solid rgba(0,0,0,0.05)',
    position: 'relative',
    cursor: isEditing ? 'grab' : 'default',
    transition: 'box-shadow 0.15s, border-color 0.15s, opacity 0.15s',
    gridColumn: isFullSpan(w) ? 'span 2' : 'span 1',
    minHeight: isFullSpan(w) ? undefined : MIN_SMALL_WIDGET_HEIGHT,
    opacity: dragSrc.current === idx && isEditing ? 0.45 : 1,
  });

  const contentProps = (w: Widget): WidgetContentProps => ({
    type: w.type, size: getSize(w), config: getConfig(w),
    displayName, avatarUrl, bio, coverUrl, followers, posts, likes,
  });

  // Profile strength
  const totalAvailable = WIDGET_TRAY.length + TOP_10_CONNECTORS.length;
  const remaining      = totalAvailable - widgets.length;
  const strengthPct    = Math.round((widgets.length / totalAvailable) * 100);
  let strengthLabel    = 'Just started';
  if (strengthPct >= 85) strengthLabel = 'Complete!';
  else if (strengthPct >= 60) strengthLabel = 'Looking great';
  else if (strengthPct >= 30) strengthLabel = 'Taking shape';

  return (
    <div style={{ paddingBottom: isEditing ? 96 : 0 }}>

      {/* ── Profile Strength bar (edit mode only) ── */}
      {isEditing && (
        <div style={{
          marginBottom: 16, padding: '14px 16px',
          background: 'rgba(255,255,255,0.75)', borderRadius: 18,
          border: '1.5px solid rgba(200,152,26,0.18)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>Profile Strength</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#c8981a' }}>{strengthPct}% · {strengthLabel}</span>
          </div>
          <div style={{ height: 6, background: 'rgba(0,0,0,0.07)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99, width: `${strengthPct}%`,
              background: 'linear-gradient(90deg, #c8981a, #e0b830)',
              transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            }} />
          </div>
          {remaining > 0 && (
            <div style={{ marginTop: 6, fontSize: 10, color: '#888' }}>
              Add {remaining} more widget{remaining !== 1 ? 's' : ''} to level up your profile
            </div>
          )}
        </div>
      )}

      {/* ── Unified 2-col widget grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
        {widgets.map((w, idx) => (
          <div
            key={w.id}
            style={cardStyle(w, idx)}
            draggable={isEditing}
            onDragStart={() => onDragStart(idx)}
            onDragOver={e => { e.preventDefault(); if (isEditing) setDragOverIdx(idx); }}
            onDragLeave={() => setDragOverIdx(null)}
            onDrop={() => onDrop(idx)}
          >
            {/* Edit-mode controls */}
            {isEditing && (
              <>
                {/* Remove — top left */}
                <button
                  onClick={() => removeWidget(w.id)}
                  style={{
                    position: 'absolute', top: 8, left: 8, zIndex: 2,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#ff5f57', border: 'none', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.20)',
                  }}
                >
                  <X size={10} style={{ color: '#fff' }} />
                </button>

                {/* Size toggle + visibility + settings — top right */}
                <div style={{
                  position: 'absolute', top: 8, right: 8, zIndex: 2,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <button
                    onClick={() => toggleSize(w.id)}
                    title={getSize(w) === 'small' ? 'Expand to full width' : 'Shrink to half width'}
                    aria-label={getSize(w) === 'small' ? 'Expand widget to full width' : 'Shrink widget to half width'}
                    style={{
                      height: 22, padding: '0 6px', borderRadius: 7,
                      background: 'rgba(255,255,255,0.88)',
                      border: '1px solid rgba(0,0,0,0.09)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 1,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}
                  >
                    {getSize(w) === 'small'
                      ? <><ChevronLeft size={9} /><ChevronRight size={9} /></>
                      : <><ChevronRight size={9} /><ChevronLeft size={9} /></>
                    }
                  </button>

                  {/* Visibility cycle button — hidden / everyone / followers-only */}
                  <button
                    onClick={() => cycleVisibility(w.id)}
                    title={
                      (w.visibilityTier ?? 'hidden') === 'hidden'
                        ? 'Hidden (click to make public)'
                        : (w.visibilityTier ?? 'hidden') === 'everyone'
                        ? 'Public — everyone (click for followers-only)'
                        : 'Followers-only (click to hide)'
                    }
                    aria-label={`Widget visibility: ${w.visibilityTier ?? 'hidden'}`}
                    style={{
                      width: 26, height: 22, borderRadius: 7,
                      background: (w.visibilityTier ?? 'hidden') === 'hidden'
                        ? 'rgba(255,255,255,0.88)'
                        : (w.visibilityTier ?? 'hidden') === 'everyone'
                        ? 'rgba(200,152,26,0.15)'
                        : 'rgba(74,158,214,0.15)',
                      border: (w.visibilityTier ?? 'hidden') === 'hidden'
                        ? '1px solid rgba(0,0,0,0.09)'
                        : (w.visibilityTier ?? 'hidden') === 'everyone'
                        ? '1px solid rgba(200,152,26,0.35)'
                        : '1px solid rgba(74,158,214,0.35)',
                      cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}
                  >
                    {(w.visibilityTier ?? 'hidden') === 'hidden'
                      ? <EyeOff size={10} style={{ color: '#999' }} />
                      : (w.visibilityTier ?? 'hidden') === 'everyone'
                      ? <Eye size={10} style={{ color: '#c8981a' }} />
                      : <Lock size={10} style={{ color: '#4A9ED6' }} />
                    }
                  </button>

                  <button
                    onClick={() => setConfigWidget(w)}
                    aria-label={`Customize ${getWidgetLabel(w.type)} widget`}
                    style={{
                      width: 26, height: 26, borderRadius: 8,
                      background: 'rgba(255,255,255,0.88)',
                      border: '1px solid rgba(0,0,0,0.09)', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}
                  >
                    <DotGrid />
                  </button>
                </div>
              </>
            )}

            {/* Content — pad top in edit mode to clear the controls */}
            <div style={{ paddingTop: isEditing ? 18 : 0 }}>
              <WidgetContent {...contentProps(w)} />
            </div>
          </div>
        ))}
      </div>

      {/* ── ∞ gold button ── */}
      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #c8981a, #e0b830)',
          boxShadow: '0 4px 18px rgba(200,152,26,0.40)',
          fontSize: 22, color: '#fff', fontWeight: 800, cursor: 'pointer',
        }}>
          ∞
        </div>
      </div>

      {/* ── Fixed bottom widget chip strip (edit mode only) ── */}
      {isEditing && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90,
          background: 'rgba(240,245,252,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(160,195,240,0.35)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.09)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 6 }}>
            <div style={{ width: 32, height: 3, borderRadius: 99, background: 'rgba(0,0,0,0.15)' }} />
          </div>
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            padding: '0 14px 10px',
            scrollbarWidth: 'none',
          } as React.CSSProperties}>
            {WIDGET_TRAY.map(({ type, label, icon }) => {
              const active = widgets.some(w => w.type === type);
              return (
                <button
                  key={type}
                  onClick={() => addWidget(type as WidgetType)}
                  disabled={active}
                  style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 99,
                    background: active ? 'rgba(200,152,26,0.10)' : 'rgba(255,255,255,0.90)',
                    border: active ? '1.5px solid rgba(200,152,26,0.30)' : '1.5px solid rgba(0,0,0,0.09)',
                    cursor: active ? 'default' : 'pointer',
                    fontSize: 12, fontWeight: 600,
                    color: active ? '#c8981a' : '#333',
                    boxShadow: active ? 'none' : '0 1px 4px rgba(0,0,0,0.07)',
                    transition: 'all 0.15s',
                    opacity: active ? 0.65 : 1,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{active ? '✓' : icon}</span>
                  {!active && <span style={{ fontSize: 11 }}>+</span>}
                  {label}
                </button>
              );
            })}
            <button
              onClick={() => setShowConnectorPicker(true)}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 99,
                background: 'linear-gradient(135deg, rgba(200,152,26,0.12), rgba(74,158,214,0.10))',
                border: '1.5px solid rgba(200,152,26,0.28)',
                cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: '#c8981a',
                boxShadow: '0 1px 6px rgba(200,152,26,0.15)',
              }}
            >
              <Plug size={12} /> Connect…
            </button>
          </div>
        </div>
      )}

      {/* Widget config sheet */}
      {configWidget && (
        <WidgetConfigSheet
          widget={configWidget}
          onClose={() => setConfigWidget(null)}
          onSave={(cfg, size) => saveWidget(configWidget.id, cfg, size)}
        />
      )}

      {/* Connector widget picker */}
      {isEditing && showConnectorPicker && (
        <ConnectorWidgetPicker
          activeWidgetTypes={widgets.map(w => w.type)}
          onAdd={handleConnectorAdd}
          onClose={() => setShowConnectorPicker(false)}
        />
      )}
    </div>
  );
}
