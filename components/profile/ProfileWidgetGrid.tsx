'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, Users, Settings2, X, Check, Plug } from 'lucide-react';
import ConnectorWidgetPicker, { type PickerConnector, TOP_10_CONNECTORS } from '@/components/connectors/ConnectorWidgetPicker';

// ── Types ─────────────────────────────────────────────────────────────────────

export type WidgetType =
  | 'bio' | 'activity' | 'followers' | 'photos'
  | 'linkedin' | 'twitter' | 'quote'
  | 'instagram' | 'spotify' | 'youtube' | 'tiktok'
  | 'github' | 'weather' | 'apple' | 'snapchat';

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
  config?: WidgetConfig;
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
  { id: 'bio',       type: 'bio' },
  { id: 'followers', type: 'followers' },
  { id: 'activity',  type: 'activity' },
  { id: 'photos',    type: 'photos' },
  { id: 'twitter',   type: 'twitter' },
  { id: 'linkedin',  type: 'linkedin' },
  { id: 'quote',     type: 'quote' },
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
  { color: '#6366f1', label: 'Indigo' },
  { color: '#22c55e', label: 'Green' },
  { color: '#ec4899', label: 'Pink' },
  { color: '#f97316', label: 'Orange' },
  { color: '#ef4444', label: 'Red' },
  { color: '#14b8a6', label: 'Teal' },
  { color: '#8b5cf6', label: 'Purple' },
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function DragHandle() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 5px)', gap: '3px', opacity: 0.28 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#444' }} />
      ))}
    </div>
  );
}

function SparkLine({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
  const W = 200, H = 56;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / r) * (H - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 56 }} preserveAspectRatio="none">
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
  onSave: (config: WidgetConfig) => void;
}) {
  const cfg = { ...DEFAULT_CONFIG, ...widget.config };
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
  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#888',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    display: 'block', marginBottom: 6, marginTop: 14,
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
            <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>Customize widget</div>
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

          {/* ── Accent Color ── */}
          <label style={labelStyle}>Accent Color</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {COLOR_SWATCHES.map(({ color: c, label }) => (
              <button key={c} onClick={() => setColor(c)} title={label} style={{
                width: 34, height: 34, borderRadius: '50%', background: c,
                border: color === c ? `3px solid #fff` : '3px solid transparent',
                outline: color === c ? `2.5px solid ${c}` : 'none',
                cursor: 'pointer', flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'transform 0.1s',
                transform: color === c ? 'scale(1.15)' : 'scale(1)',
              }} />
            ))}
          </div>

          {/* ── Background Style ── */}
          <label style={labelStyle}>Background</label>
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
              <label style={labelStyle}>Quote Text</label>
              <textarea value={quoteText} onChange={e => setQuoteText(e.target.value)}
                rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </>
          )}

          {widget.type === 'linkedin' && (
            <>
              <label style={labelStyle}>Role / Title</label>
              <input value={liRole} onChange={e => setLiRole(e.target.value)} style={inputStyle} />
              <label style={labelStyle}>Company</label>
              <input value={liCompany} onChange={e => setLiCompany(e.target.value)} style={inputStyle} />
            </>
          )}

          {widget.type === 'twitter' && (
            <>
              <label style={labelStyle}>Twitter Handle</label>
              <input value={twHandle} onChange={e => setTwHandle(e.target.value)}
                placeholder="@handle" style={inputStyle} />
            </>
          )}

          {widget.type === 'activity' && (
            <>
              <label style={labelStyle}>Time Range</label>
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
              <label style={labelStyle}>Photo Count</label>
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

          {/* ── Save ── */}
          <button onClick={() => {
            onSave({
              accentColor: color, bgStyle,
              quoteText, linkedinRole: liRole, linkedinCompany: liCompany,
              twitterHandle: twHandle, activityDays: actDays, photoCount,
            });
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
// Branded card shown for connector-backed widget types.

function ConnectorSourcedWidget({
  symbol, brandColor, bgColor, name, sub,
  textColor, dimColor, connected, accent, extra,
}: {
  symbol: string; brandColor: string; bgColor: string;
  name: string; sub: string; textColor: string; dimColor: string;
  connected?: boolean; accent: string;
  extra?: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: bgColor,
          border: `1.5px solid ${brandColor}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: symbol.length > 2 ? 14 : 18,
          fontWeight: 900, color: brandColor,
        }}>
          {symbol}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{name}</div>
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

// ── Widget content renderer ────────────────────────────────────────────────────

interface WidgetContentProps {
  type: WidgetType;
  config: WidgetConfig;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  coverUrl?: string | null;
  followers: number;
  posts: number;
  likes: number;
}

function WidgetContent(p: WidgetContentProps) {
  const { type, config, displayName, avatarUrl, bio, coverUrl, followers, posts, likes } = p;
  const accent = config.accentColor;
  const textColor = getTextColor(config.bgStyle);
  const dimColor  = getDimColor(config.bgStyle);
  const initials  = (displayName || 'D')[0].toUpperCase();

  switch (type) {

    case 'bio': return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: textColor }}>{displayName}</div>
            {bio && <div style={{ fontSize: 11, color: dimColor, marginTop: 2, lineHeight: 1.3 }}>
              {bio.length > 40 ? bio.slice(0, 40) + '…' : bio}
            </div>}
          </div>
        </div>
        {coverUrl
          ? <div style={{ borderRadius: 14, overflow: 'hidden', height: 120 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          : <div style={{ borderRadius: 14, height: 110, background: `linear-gradient(135deg, ${accent}30, ${accent}18)` }} />
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

    case 'followers': return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={14} style={{ color: accent }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: textColor }}>Followers</span>
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: textColor, lineHeight: 1 }}>
          {followers >= 1000 ? `${(followers / 1000).toFixed(1)}K` : followers || '0'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
          <span style={{ fontSize: 15 }}>🪙</span>
          <span style={{ fontSize: 11, color: dimColor }}>Following 524</span>
        </div>
      </div>
    );

    case 'activity': return (
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: textColor, marginBottom: 4 }}>Activity Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: dimColor, marginBottom: 2 }}>
          <span>200</span><span>150</span><span>100</span>
        </div>
        <SparkLine data={[100, 130, 115, 160, 180, 165, 205]} color={accent} />
        <div style={{ marginTop: 8, fontSize: 11, color: dimColor, lineHeight: 1.7 }}>
          <span>Last {config.activityDays ?? 7} Days:</span><br />
          {posts || 12} Posts, {likes || 46} Likes
        </div>
      </div>
    );

    case 'photos': return (
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: textColor, marginBottom: 8 }}>Recent Photos</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(config.photoCount ?? 3, 3)}, 1fr)`, gap: 5 }}>
          {[
            'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=120&q=75',
            'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=120&q=75',
            'https://images.unsplash.com/photo-1552053831-71594a27632d?w=120&q=75',
          ].slice(0, config.photoCount ?? 3).map((src, i) => (
            <div key={i} style={{ aspectRatio: '1', borderRadius: 9, overflow: 'hidden', background: '#eee' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>
    );

    case 'linkedin': return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#0A66C2',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 11 }}>in</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: textColor }}>LinkedIn</span>
        </div>
        <div style={{ fontSize: 12, color: textColor, lineHeight: 1.45, marginBottom: 10 }}>
          {config.linkedinRole ?? 'Senior UX Designer'}<br />
          at {config.linkedinCompany ?? 'Google'}
        </div>
        <button style={{
          width: '100%', padding: '9px 0',
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          border: 'none', borderRadius: 10, color: '#fff',
          fontWeight: 700, fontSize: 12, cursor: 'pointer',
          boxShadow: `0 3px 10px ${accent}44`,
        }}>
          Apply Now
        </button>
      </div>
    );

    case 'twitter': return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#1DA1F2',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>𝕏</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: textColor }}>Twitter</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: textColor, marginBottom: 2 }}>
          @{config.twitterHandle ?? 'TechNews'}
        </div>
        <div style={{ fontSize: 11, color: dimColor, marginBottom: 8 }}>
          Latest posts &amp; updates
        </div>
        <BarChart data={[3, 5, 4, 7, 6, 8, 7]} color={accent} />
        <div style={{ fontSize: 10, color: dimColor, marginTop: 4 }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Today
        </div>
      </div>
    );

    case 'quote': return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 90 }}>
        <div style={{ fontSize: 28, color: `${accent}55`, lineHeight: 1, marginBottom: 4 }}>"</div>
        <p style={{ fontSize: 12, color: textColor, fontStyle: 'italic', lineHeight: 1.55, margin: 0 }}>
          {config.quoteText ?? DEFAULT_CONFIG.quoteText}
        </p>
      </div>
    );

    // ── Connector-sourced widgets ─────────────────────────────────────────────
    // Each shows a branded card with "Connect" CTA if not yet linked.
    // Data content shown once connected.

    case 'instagram': return (
      <ConnectorSourcedWidget
        symbol="📸" brandColor="#E1306C" bgColor="rgba(225,48,108,0.12)"
        name="Instagram" sub="Timeline & stories" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
      />
    );

    case 'spotify': return (
      <ConnectorSourcedWidget
        symbol="♫" brandColor="#1DB954" bgColor="rgba(29,185,84,0.12)"
        name="Spotify" sub="Now playing & playlists" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
      />
    );

    case 'youtube': return (
      <ConnectorSourcedWidget
        symbol="▶" brandColor="#FF0000" bgColor="rgba(255,0,0,0.10)"
        name="YouTube" sub="Subscriptions feed" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
      />
    );

    case 'tiktok': return (
      <ConnectorSourcedWidget
        symbol="🎬" brandColor="#69C9D0" bgColor="rgba(105,201,208,0.12)"
        name="TikTok" sub="Following feed" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
      />
    );

    case 'github': return (
      <ConnectorSourcedWidget
        symbol="⬡" brandColor="#6e40c9" bgColor="rgba(110,64,201,0.12)"
        name="GitHub" sub="Activity & pull requests" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
      />
    );

    case 'weather': return (
      <ConnectorSourcedWidget
        symbol="☁" brandColor="#4A9ED6" bgColor="rgba(74,158,214,0.12)"
        name="Weather" sub="Live forecast" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
        extra={<div style={{ fontSize: 24, fontWeight: 800, color: '#4A9ED6', marginTop: 4 }}>72°F ⛅</div>}
      />
    );

    case 'apple': return (
      <ConnectorSourcedWidget
        symbol="♩" brandColor="#FA243C" bgColor="rgba(250,36,60,0.10)"
        name="Apple Music" sub="Library & recent plays" textColor={textColor} dimColor={dimColor}
        connected accent={accent}
      />
    );

    case 'snapchat': return (
      <ConnectorSourcedWidget
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
  const [widgets, setWidgets]     = useState<Widget[]>(initialWidgets ?? DEFAULT_WIDGETS);
  const [showTray, setShowTray]   = useState(false);
  const [showConnectorPicker, setShowConnectorPicker] = useState(false);
  const [configWidget, setConfigWidget] = useState<Widget | null>(null);
  const dragSrc = useRef<number | null>(null);

  const bioWidget   = widgets.find(w => w.type === 'bio');
  const gridWidgets = widgets.filter(w => w.type !== 'bio');

  // Drag handlers
  const onDragStart = (i: number) => { dragSrc.current = i; };
  const onDrop = (i: number) => {
    if (dragSrc.current === null || dragSrc.current === i) return;
    const next = [...widgets];
    const [moved] = next.splice(dragSrc.current, 1);
    next.splice(i, 0, moved);
    dragSrc.current = null;
    setWidgets(next);
    onSave?.(next);
  };

  const addWidget = (type: WidgetType) => {
    if (widgets.some(w => w.type === type)) return;
    const next = [...widgets, { id: `${type}-${Date.now()}`, type, config: { ...DEFAULT_CONFIG } }];
    setWidgets(next);
    onSave?.(next);
  };

  const removeWidget = (id: string) => {
    const next = widgets.filter(w => w.id !== id);
    setWidgets(next);
    onSave?.(next);
  };

  const saveConfig = (widgetId: string, cfg: WidgetConfig) => {
    const next = widgets.map(w => w.id === widgetId ? { ...w, config: cfg } : w);
    setWidgets(next);
    onSave?.(next);
  };

  // Called when user confirms adding a connector widget from the picker
  const handleConnectorAdd = (connector: PickerConnector) => {
    addWidget(connector.widgetType as WidgetType);
  };

  const getConfig = (w: Widget): WidgetConfig => ({ ...DEFAULT_CONFIG, ...w.config });

  const bioTagsDisplay = bio
    ? bio.split('|').map(t => t.trim()).filter(Boolean).join(' | ')
    : '';

  const cardStyle = (w: Widget): React.CSSProperties => {
    const cfg = getConfig(w);
    return {
      ...getCardBg(cfg.bgStyle, cfg.accentColor),
      borderRadius: 20,
      padding: 16,
      boxShadow: isEditing ? '0 2px 12px rgba(0,0,0,0.06)' : '0 2px 16px rgba(0,0,0,0.08)',
      border: isEditing ? '2px dashed rgba(0,0,0,0.14)' : '1.5px solid rgba(0,0,0,0.05)',
      position: 'relative',
      cursor: isEditing ? 'grab' : 'default',
      transition: 'box-shadow 0.15s',
    };
  };

  const contentProps = (w: Widget): WidgetContentProps => ({
    type: w.type, config: getConfig(w),
    displayName, avatarUrl, bio, coverUrl, followers, posts, likes,
  });

  return (
    <div>
      {/* Bio card — full width */}
      {bioWidget && (() => {
        const idx = widgets.indexOf(bioWidget);
        return (
          <div
            style={{ ...cardStyle(bioWidget), marginBottom: 14 }}
            draggable={isEditing}
            onDragStart={() => onDragStart(idx)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop(idx)}
          >
            {isEditing && (
              <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, display: 'flex', gap: 6 }}>
                <button onClick={() => setConfigWidget(bioWidget)} style={{
                  width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Settings2 size={13} style={{ color: '#666' }} />
                </button>
                <DragHandle />
              </div>
            )}
            <WidgetContent {...contentProps(bioWidget)} />
          </div>
        );
      })()}

      {/* 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {gridWidgets.map(w => {
          const globalIdx = widgets.findIndex(x => x.id === w.id);
          return (
            <div
              key={w.id}
              style={cardStyle(w)}
              draggable={isEditing}
              onDragStart={() => onDragStart(globalIdx)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(globalIdx)}
            >
              {isEditing && (
                <>
                  <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                    <button onClick={() => removeWidget(w.id)} style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: '#ff5f57', border: 'none', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <X size={11} style={{ color: '#fff' }} />
                    </button>
                  </div>
                  <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', gap: 5 }}>
                    <button onClick={() => setConfigWidget(w)} style={{
                      width: 24, height: 24, borderRadius: 7, background: 'rgba(255,255,255,0.85)',
                      border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Settings2 size={12} style={{ color: '#666' }} />
                    </button>
                    <DragHandle />
                  </div>
                </>
              )}
              <WidgetContent {...contentProps(w)} />
            </div>
          );
        })}
      </div>

      {/* Bio tags */}
      {bioTagsDisplay && (
        <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: '#888', letterSpacing: '0.01em' }}>
          {bioTagsDisplay}
        </div>
      )}

      {/* ∞ gold button */}
      <div style={{ textAlign: 'center', marginTop: 22 }}>
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

      {/* + Favorite Widgets tray (edit mode) */}
      {isEditing && (
        <div style={{
          marginTop: 20,
          background: 'rgba(255,255,255,0.88)',
          borderRadius: 22,
          border: '1.5px solid rgba(0,0,0,0.07)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.07)',
          overflow: 'hidden',
        }}>
          <button onClick={() => setShowTray(t => !t)} style={{
            width: '100%', padding: '14px 18px',
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 14, fontWeight: 700, color: '#1a1a1a',
          }}>
            <span style={{ fontSize: 16 }}>＋</span>
            Favorite Widgets
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: showTray ? (i === 0 ? '#c8981a' : '#ddd') : '#ddd' }} />
              ))}
            </div>
          </button>
          {showTray && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 16px', scrollbarWidth: 'none' }}>
              {WIDGET_TRAY.map(({ type, label, icon }) => {
                const active = widgets.some(w => w.type === type);
                return (
                  <button key={type} onClick={() => addWidget(type as WidgetType)} disabled={active} style={{
                    flexShrink: 0, width: 76, padding: '10px 0 8px',
                    borderRadius: 14,
                    background: active ? 'rgba(200,152,26,0.08)' : '#f5f5f5',
                    border: active ? '1.5px solid rgba(200,152,26,0.3)' : '1.5px solid transparent',
                    cursor: active ? 'default' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    opacity: active ? 0.55 : 1,
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#444' }}>{label}</span>
                    {active && <span style={{ fontSize: 9, color: '#c8981a', fontWeight: 700 }}>Added</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Connect a Service — S.I.C.C. ── */}
          <div style={{
            margin: '0 14px 14px',
            borderTop: showTray ? '1px solid rgba(0,0,0,0.06)' : 'none',
            paddingTop: showTray ? 14 : 0,
          }}>
            <button
              onClick={() => setShowConnectorPicker(true)}
              style={{
                width: '100%', padding: '13px 16px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(200,152,26,0.09) 0%, rgba(74,158,214,0.07) 100%)',
                border: '1.5px solid rgba(200,152,26,0.22)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'transform 0.1s',
              }}
              onPointerDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
              onPointerUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #c8981a, #e0b830)',
                boxShadow: '0 3px 10px rgba(200,152,26,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plug size={16} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a' }}>
                  Connect a Service
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                  Twitter · Instagram · LinkedIn + 7 more
                </div>
              </div>
              {/* Mini connector icons — derived from TOP_10_CONNECTORS */}
              <div style={{ display: 'flex', gap: -4 }}>
                {TOP_10_CONNECTORS.slice(0, 5).map((c, i) => (
                  <div key={c.id} style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: c.brandColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: c.symbol.length > 1 ? 8 : 10, fontWeight: 900, color: '#fff',
                    marginLeft: i > 0 ? -6 : 0,
                    border: '1.5px solid #f8f8f8',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                  }}>
                    {c.symbol}
                  </div>
                ))}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Widget config sheet */}
      {configWidget && (
        <WidgetConfigSheet
          widget={configWidget}
          onClose={() => setConfigWidget(null)}
          onSave={(cfg) => saveConfig(configWidget.id, cfg)}
        />
      )}

      {/* Connector widget picker — edit mode only */}
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
