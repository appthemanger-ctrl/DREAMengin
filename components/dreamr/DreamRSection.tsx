'use client';

/**
 * DreamRSection — The DreamR Station inside HomeDream.
 *
 * Five neomorphic tabs, each surfacing a real dreamengin capability under
 * the DreamR "Human Media Platform" brand:
 *
 *  📡 Feed     — Vertical snap-scroll DreamRFeed (swipe-left for creator panel)
 *  ✦  Create   — Cross-platform post composer (text, image, video, audio)
 *  🧬 Platform — Unified creator identity: profile card + all connected networks
 *  📊 Signal   — Real analytics (views, likes, followers, comments) + time range
 *  🌟 Journey  — Creative dot-trail: your history across dreamengin surfaces
 *
 * The Journey tab is the uniquely dreamengin feature: no other social platform
 * shows you the creative history BEHIND your content. Your music sessions, game
 * sessions, lab experiments, code commits — all dots on your DreamR timeline.
 *
 * Visual language: neomorphism on pearl-sky base (#e8eff6),
 * sky-blue (#5ba8d4) and gold (#c8981a) accents,
 * Plus Jakarta Sans (--font-dreamr) throughout.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Radio, PlusCircle, Layers, BarChart2, MapPin,
  Heart, Eye, Users, MessageCircle,
  TrendingUp, TrendingDown, Minus,
  Image as ImageIcon, Video, Music, Send, Loader2,
  Check, ExternalLink, RefreshCw, Plug,
  ChevronRight,
} from 'lucide-react';
import type { FeedPost } from '@/lib/feed/useLiveFeed';
import DreamRFeed from '@/dreamdmbar/homedream/dreamr/algorithms/dreamrfeed';
import JourneyTrail from '@/components/daydream/JourneyTrail';
import { uploadBlobToLedgerStorage } from '@/lib/media/ledger';
import { createClient } from '@/lib/supabase/client';

// ── Design tokens ──────────────────────────────────────────────────────────────

const DR = {
  bg:          '#e8eff6',
  sky:         '#5ba8d4',
  skyLight:    '#87CEEB',
  gold:        '#c8981a',
  goldLight:   '#f0c040',
  text:        '#1a2840',
  textDim:     'rgba(26,40,64,0.50)',
  font:        'var(--font-dreamr,"Plus Jakarta Sans",system-ui,sans-serif)',
  shadowLight: 'rgba(255,255,255,0.90)',
  shadowDark:  'rgba(163,189,218,0.45)',
} as const;

function nmRaised(s = 5): string {
  return `${-s}px ${-s}px ${s * 2.4}px ${DR.shadowLight}, ${s}px ${s}px ${s * 2.8}px ${DR.shadowDark}`;
}
function nmInset(s = 4): string {
  return `inset ${-s}px ${-s}px ${s * 2}px ${DR.shadowLight}, inset ${s}px ${s}px ${s * 2.4}px ${DR.shadowDark}`;
}

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = 'feed' | 'create' | 'platform' | 'signal' | 'journey';

interface ProfileLike {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  followers_count?: number | null;
  following_count?: number | null;
  posts_count?: number | null;
}

interface ConnectorEntry {
  provider: string;
  name?: string;
  icon?: string;
  status: string;
}

interface AnalyticsData {
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_followers: number;
  views_change: number;
  likes_change: number;
  comments_change: number;
  followers_change: number;
}

interface DreamRSectionProps {
  profile: ProfileLike | null;
  initialPosts: FeedPost[];
  onOpenUrl?: (url: string, title?: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'feed',     label: 'Feed',     icon: <Radio     size={16} /> },
  { id: 'create',   label: 'Create',   icon: <PlusCircle size={16} /> },
  { id: 'platform', label: 'Platform', icon: <Layers    size={16} /> },
  { id: 'signal',   label: 'Signal',   icon: <BarChart2 size={16} /> },
  { id: 'journey',  label: 'Journey',  icon: <MapPin    size={16} /> },
];

// Known connector platform metadata for the Platform tab
const PLATFORM_META: Record<string, { emoji: string; label: string; color: string }> = {
  mastodon:   { emoji: '🐘', label: 'Mastodon',   color: '#6364FF' },
  bluesky:    { emoji: '🦋', label: 'Bluesky',    color: '#0085ff' },
  twitter:    { emoji: '✖️', label: 'X / Twitter', color: '#000000' },
  instagram:  { emoji: '📸', label: 'Instagram',  color: '#E1306C' },
  youtube:    { emoji: '📺', label: 'YouTube',    color: '#FF0000' },
  tiktok:     { emoji: '🎬', label: 'TikTok',     color: '#010101' },
  spotify:    { emoji: '🎵', label: 'Spotify',    color: '#1DB954' },
  reddit:     { emoji: '🤖', label: 'Reddit',     color: '#FF4500' },
  github:     { emoji: '🐙', label: 'GitHub',     color: '#24292e' },
  nostr:      { emoji: '⚡', label: 'Nostr',      color: '#8b5cf6' },
  linkedin:   { emoji: '💼', label: 'LinkedIn',   color: '#0A66C2' },
  discord:    { emoji: '🎮', label: 'Discord',    color: '#5865F2' },
  soundcloud: { emoji: '☁️', label: 'SoundCloud', color: '#FF5500' },
};

function TrendIcon({ v }: { v: number }) {
  if (v > 0) return <TrendingUp size={12} style={{ color: '#22c55e' }} />;
  if (v < 0) return <TrendingDown size={12} style={{ color: '#ef4444' }} />;
  return <Minus size={12} style={{ color: DR.textDim }} />;
}

// ── Sub-views ──────────────────────────────────────────────────────────────────

// ── Create tab ────────────────────────────────────────────────────────────────

function CreateTab({ userId, profile }: { userId: string; profile: ProfileLike | null }) {
  const supabase = createClient();
  const [content,    setContent]    = useState('');
  const [vis,        setVis]        = useState<'public' | 'followers' | 'private'>('public');
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [mediaFile,  setMediaFile]  = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [audioFile,  setAudioFile]  = useState<File | null>(null);
  const imgRef   = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const charLimit = 500;
  const remaining = charLimit - content.length;

  const handleMedia = (e: React.ChangeEvent<HTMLInputElement>, _type: 'image' | 'video') => {
    const f = e.target.files?.[0]; if (!f) return;
    setMediaFile(f);
    setMediaPreview(URL.createObjectURL(f));
    e.target.value = '';
  };

  const handleAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setAudioFile(f);
    e.target.value = '';
  };

  const handlePost = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      let mediaUrl: string | null = null;
      // Upload media if present (image/video takes precedence over audio)
      const uploadTarget = mediaFile ?? audioFile;
      if (uploadTarget) {
        const bucket = uploadTarget.type.startsWith('image/')
          ? 'images'
          : uploadTarget.type.startsWith('video/')
            ? 'videos'
            : uploadTarget.type.startsWith('audio/')
              ? 'audio'
              : 'files';
        const ext = uploadTarget.name.split('.').pop() ?? 'bin';
        const upload = await uploadBlobToLedgerStorage(supabase, {
          bucket,
          storagePath: `${userId}/dreamr/${Date.now()}-${crypto.randomUUID()}.${ext}.ledger`,
          blob: uploadTarget,
          fileName: uploadTarget.name,
          mimeType: uploadTarget.type,
        });
        mediaUrl = upload.mediaUrl;
      }
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content, visibility: vis, media_urls: mediaUrl ? [mediaUrl] : [] }),
      });
      setSent(true);
      setContent(''); setMediaFile(null); setMediaPreview(null); setAudioFile(null);
      setTimeout(() => setSent(false), 2500);
    } catch { /* non-critical */ }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePost();
    }
  };

  return (
    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14, fontFamily: DR.font }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt="" width={36} height={36}
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', boxShadow: nmRaised(3) }} />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${DR.skyLight},${DR.sky})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', boxShadow: nmRaised(3) }}>
            {(profile?.display_name ?? profile?.handle ?? '?')[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: DR.text }}>
            {profile?.display_name ?? profile?.handle ?? 'You'}
          </div>
          <div style={{ fontSize: 11, color: DR.sky, fontWeight: 600 }}>@{profile?.handle ?? '—'}</div>
        </div>
      </div>

      {/* Text area */}
      <div style={{ background: DR.bg, borderRadius: 16, boxShadow: nmInset(5), padding: 14 }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value.slice(0, charLimit))}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind? Share your human media…"
          rows={4}
          style={{
            width: '100%', border: 'none', background: 'transparent',
            resize: 'none', outline: 'none',
            fontFamily: DR.font, fontSize: 14, fontWeight: 500,
            color: DR.text, lineHeight: 1.55,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: DR.textDim, fontWeight: 500 }}>⌘↵ to post</span>
          <span style={{ fontSize: 11, color: remaining < 50 ? '#ef4444' : DR.textDim, fontWeight: 600 }}>
            {remaining}
          </span>
        </div>
      </div>

      {/* Media preview */}
      {mediaPreview && (
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', boxShadow: nmRaised(4) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaPreview} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
          <button
            type="button" onClick={() => { setMediaFile(null); setMediaPreview(null); }}
            style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.60)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 14 }}
          >×</button>
        </div>
      )}

      {/* Audio attachment preview */}
      {audioFile && (
        <div style={{ background: DR.bg, borderRadius: 12, boxShadow: nmRaised(3), padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,${DR.skyLight},${DR.sky} 55%,${DR.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Music size={14} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: DR.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{audioFile.name}</div>
            <div style={{ fontSize: 10, color: DR.textDim, fontWeight: 500 }}>Audio track attached</div>
          </div>
          <button
            type="button" onClick={() => setAudioFile(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: DR.textDim, fontSize: 16, padding: 4 }}
          >×</button>
        </div>
      )}

      {/* Toolbar row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Media buttons */}
        {[
          { ref: imgRef, icon: <ImageIcon size={15} />, accept: 'image/*', type: 'image' as const, label: 'Photo' },
          { ref: videoRef, icon: <Video size={15} />, accept: 'video/*', type: 'video' as const, label: 'Video' },
        ].map(({ ref, icon, accept, type, label }) => (
          <button key={label} type="button" onClick={() => ref.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 99, background: DR.bg, border: 'none', boxShadow: nmRaised(3), cursor: 'pointer', fontFamily: DR.font, fontSize: 12, fontWeight: 600, color: DR.textDim }}>
            {icon}{label}
            <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={e => handleMedia(e, type)} />
          </button>
        ))}

        {/* Audio button — for StarMaker tracks */}
        <button type="button" onClick={() => audioRef.current?.click()}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 99, background: audioFile ? `linear-gradient(135deg,${DR.skyLight},${DR.sky})` : DR.bg, border: 'none', boxShadow: audioFile ? `0 3px 12px rgba(91,168,212,0.30)` : nmRaised(3), cursor: 'pointer', fontFamily: DR.font, fontSize: 12, fontWeight: 600, color: audioFile ? '#fff' : DR.textDim }}>
          <Music size={15} />Audio
          <input ref={audioRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleAudio} />
        </button>

        {/* Visibility */}
        <select
          value={vis}
          onChange={e => setVis(e.target.value as typeof vis)}
          style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: 99, background: DR.bg, border: 'none', boxShadow: nmRaised(3), fontFamily: DR.font, fontSize: 12, fontWeight: 600, color: DR.textDim, cursor: 'pointer', outline: 'none' }}
        >
          <option value="public">🌍 Public</option>
          <option value="followers">👥 Followers</option>
          <option value="private">🔒 Private</option>
        </select>
      </div>

      {/* Post button */}
      <button
        type="button" onClick={handlePost}
        disabled={!content.trim() || sending || sent}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
          background: sent
            ? `linear-gradient(135deg,#22c55e,#16a34a)`
            : content.trim()
              ? `linear-gradient(135deg,${DR.skyLight} 0%,${DR.sky} 55%,${DR.gold} 100%)`
              : DR.bg,
          boxShadow: content.trim() && !sent ? `0 6px 24px rgba(91,168,212,0.38)` : nmRaised(4),
          color: content.trim() ? '#fff' : DR.textDim,
          fontFamily: DR.font, fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em',
          cursor: content.trim() ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 220ms',
        }}
      >
        {sending ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> :
         sent    ? <><Check size={16} /> Posted to DreamR</> :
                   <><Send size={16} /> Post to DreamR</>}
      </button>

      {/* Cross-platform note */}
      <div style={{ textAlign: 'center', fontSize: 11, color: DR.textDim, lineHeight: 1.5 }}>
        Your connected platforms will sync automatically via{' '}
        <Link href="/connectors" style={{ color: DR.sky, fontWeight: 600, textDecoration: 'none' }}>Connectors</Link>
      </div>
    </div>
  );
}

// ── Platform tab ──────────────────────────────────────────────────────────────

function PlatformTab({ profile, onOpenUrl }: { profile: ProfileLike | null; onOpenUrl?: (url: string, title?: string) => void }) {
  const [connectors, setConnectors] = useState<ConnectorEntry[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    fetch('/api/connectors/status')
      .then(r => r.ok ? r.json() : { statuses: {} })
      .then(d => {
        const statuses: Record<string, string> = d.statuses ?? {};
        const entries: ConnectorEntry[] = Object.entries(statuses).map(([provider, status]) => ({
          provider, status: status as string,
          name: PLATFORM_META[provider]?.label ?? provider,
          icon: PLATFORM_META[provider]?.emoji ?? '🔌',
        }));
        setConnectors(entries);
      })
      .catch(() => setConnectors([]))
      .finally(() => setLoading(false));
  }, []);

  const connected    = connectors.filter(c => c.status === 'connected');
  const notConnected = connectors.filter(c => c.status !== 'connected').slice(0, 6);
  const avatarLetter = (profile?.display_name ?? profile?.handle ?? '?')[0]?.toUpperCase() ?? '?';

  return (
    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: DR.font }}>

      {/* Profile identity card */}
      <div style={{ background: DR.bg, borderRadius: 20, boxShadow: nmRaised(7), padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt="" width={60} height={60}
              style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', boxShadow: nmRaised(5) }} />
          ) : (
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg,${DR.skyLight} 0%,${DR.sky} 55%,${DR.gold} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff', boxShadow: nmRaised(5) }}>
              {avatarLetter}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: DR.text, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {profile?.display_name ?? profile?.handle ?? 'Your Profile'}
            </div>
            <div style={{ fontSize: 12, color: DR.sky, fontWeight: 600, marginTop: 3 }}>
              @{profile?.handle ?? '—'}
            </div>
            {profile?.bio && (
              <div style={{ fontSize: 12, color: DR.textDim, marginTop: 5, lineHeight: 1.45 }}>
                {profile.bio.slice(0, 80)}{(profile.bio?.length ?? 0) > 80 ? '…' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Followers', value: profile?.followers_count ?? 0 },
            { label: 'Following', value: profile?.following_count ?? 0 },
            { label: 'Posts',     value: profile?.posts_count ?? 0 },
          ].map(s => (
            <div key={s.label} style={{ background: DR.bg, borderRadius: 12, boxShadow: nmInset(3), padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: DR.text, letterSpacing: '-0.02em' }}>{s.value.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: DR.textDim, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            type="button"
            onClick={() => onOpenUrl?.('/view-profile', 'View Profile')}
            style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${DR.skyLight},${DR.sky} 60%,${DR.gold})`, color: '#fff', fontFamily: DR.font, fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: `0 4px 16px rgba(91,168,212,0.30)` }}>
            View Public Profile
          </button>
          <button
            type="button"
            onClick={() => onOpenUrl?.('/edit-profiledream', 'Edit Profile')}
            style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: DR.bg, color: DR.textDim, fontFamily: DR.font, fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: nmRaised(3) }}>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Connected platforms */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', color: DR.textDim, textTransform: 'uppercase', marginBottom: 10 }}>
          Connected Networks ({connected.length})
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 56, borderRadius: 14, background: DR.bg, boxShadow: nmInset(3) }} />)}
          </div>
        ) : connected.length === 0 ? (
          <div style={{ background: DR.bg, borderRadius: 16, boxShadow: nmRaised(4), padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔌</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: DR.text, marginBottom: 4 }}>No platforms connected yet</div>
            <div style={{ fontSize: 12, color: DR.textDim, marginBottom: 12 }}>Connect your social networks to unify your human media presence</div>
            <button
              type="button"
              onClick={() => onOpenUrl?.('/connectors', 'Connectors')}
              style={{ padding: '9px 20px', borderRadius: 99, background: `linear-gradient(135deg,${DR.skyLight},${DR.sky})`, border: 'none', color: '#fff', fontFamily: DR.font, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plug size={13} /> Connect Platforms
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {connected.map(c => {
              const meta = PLATFORM_META[c.provider];
              return (
                <div key={c.provider} style={{ background: DR.bg, borderRadius: 14, boxShadow: nmRaised(4), padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: DR.bg, boxShadow: nmRaised(3), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {meta?.emoji ?? '🔌'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: DR.text }}>{meta?.label ?? c.provider}</div>
                    <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600, marginTop: 2 }}>● Connected</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggested to connect */}
      {notConnected.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', color: DR.textDim, textTransform: 'uppercase', marginBottom: 10 }}>
            Add to your DreamR presence
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {notConnected.map(c => {
              const meta = PLATFORM_META[c.provider];
              return (
                <button
                  key={c.provider}
                  type="button"
                  onClick={() => onOpenUrl?.('/connectors', 'Connectors')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 99, background: DR.bg, border: 'none', boxShadow: nmRaised(3), cursor: 'pointer', fontFamily: DR.font, fontSize: 12, fontWeight: 600, color: DR.textDim }}>
                  <span>{meta?.emoji ?? '🔌'}</span>
                  <span>{meta?.label ?? c.provider}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onOpenUrl?.('/connectors', 'Connectors')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 99, background: DR.bg, border: 'none', boxShadow: nmRaised(3), cursor: 'pointer', fontFamily: DR.font, fontSize: 12, fontWeight: 600, color: DR.sky }}>
              All networks <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Signal tab (real analytics — creator-only) ────────────────────────────────
// Privacy model:
//   VIEWS   = the only public metric, shown on feed cards.
//   All other metrics (likes, comments, followers) = private to this tab only.
//   No setting to make them public. No count displayed anywhere else.

function SignalTab() {
  type Range = '7d' | '30d' | '90d';
  const [range,   setRange]   = useState<Range>('30d');
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback((r: Range) => {
    setLoading(true);
    fetch(`/api/analytics?range=${r}`)
      .then(res => res.ok ? res.json() : null)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  // Views is the public metric — shown first, full-width, distinct styling.
  // Likes / Comments / Followers are private — shown below with a lock badge.
  const privateMetrics = data ? [
    { icon: <Heart size={17} />,          label: 'Likes',     value: data.total_likes,     change: data.likes_change,     color: '#f472b6' },
    { icon: <MessageCircle size={17} />,  label: 'Comments',  value: data.total_comments,  change: data.comments_change,  color: '#818cf8' },
    { icon: <Users size={17} />,          label: 'Followers', value: data.total_followers, change: data.followers_change, color: DR.gold },
  ] : [];

  // Engagement rate (likes + comments / views * 100)
  const engRate = data && data.total_views > 0
    ? (((data.total_likes + data.total_comments) / data.total_views) * 100).toFixed(1)
    : null;

  return (
    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: DR.font }}>

      {/* Header + range switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: DR.text, letterSpacing: '-0.02em' }}>Signal</div>
          <div style={{ fontSize: 11, color: DR.textDim, marginTop: 2 }}>Your DreamR performance</div>
        </div>
        <div style={{ display: 'flex', gap: 4, background: DR.bg, borderRadius: 99, padding: 4, boxShadow: nmInset(3) }}>
          {(['7d', '30d', '90d'] as Range[]).map(r => (
            <button key={r} type="button" onClick={() => setRange(r)}
              style={{ padding: '6px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontFamily: DR.font, fontSize: 11, fontWeight: 700,
                background: range === r ? `linear-gradient(135deg,${DR.sky},${DR.gold})` : 'transparent',
                color: range === r ? '#fff' : DR.textDim,
                boxShadow: range === r ? `0 2px 10px rgba(91,168,212,0.30)` : 'none',
                transition: 'all 180ms',
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── VIEWS — the public metric, featured full-width ── */}
      {loading ? (
        <div style={{ height: 96, borderRadius: 18, background: DR.bg, boxShadow: nmInset(4) }} />
      ) : data ? (
        <div style={{ background: DR.bg, borderRadius: 18, boxShadow: nmRaised(7), padding: '18px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 15, background: `linear-gradient(135deg,${DR.skyLight},${DR.sky} 55%,${DR.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: nmRaised(4), flexShrink: 0 }}>
            <Eye size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
              <span style={{ fontWeight: 800, fontSize: 28, color: DR.text, letterSpacing: '-0.03em' }}>
                {data.total_views >= 1000 ? `${(data.total_views / 1000).toFixed(1)}k` : data.total_views.toLocaleString()}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: data.views_change > 0 ? '#22c55e' : data.views_change < 0 ? '#ef4444' : DR.textDim }}>
                <TrendIcon v={data.views_change} />
                {data.views_change > 0 ? '+' : ''}{data.views_change}%
              </span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: DR.sky }}>
              Views · Public Metric
            </div>
            <div style={{ fontSize: 10, color: DR.textDim, marginTop: 3 }}>
              The only metric visible on your posts · last {range}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Engagement rate ── */}
      {engRate !== null && (
        <div style={{ background: DR.bg, borderRadius: 16, boxShadow: nmRaised(5), padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: DR.bg, boxShadow: nmRaised(3), display: 'flex', alignItems: 'center', justifyContent: 'center', color: DR.gold }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: DR.gold, letterSpacing: '-0.02em' }}>{engRate}%</div>
            <div style={{ fontSize: 10, color: DR.textDim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Engagement Rate</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 10, color: DR.textDim, textAlign: 'right', lineHeight: 1.4 }}>
            Private signal<br />creator only
          </div>
        </div>
      )}

      {/* ── Private metrics — creator-only section ── */}
      <div>
        {/* Section header with lock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', color: DR.textDim, textTransform: 'uppercase' }}>
            Creator Insights
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: DR.bg, boxShadow: nmRaised(2), borderRadius: 99, padding: '3px 9px', fontSize: 9, fontWeight: 800, color: DR.gold, letterSpacing: '0.08em' }}>
            🔒 Private — never shown publicly
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 84, borderRadius: 14, background: DR.bg, boxShadow: nmInset(3) }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {privateMetrics.map(m => (
              <div key={m.label} style={{ background: DR.bg, borderRadius: 14, boxShadow: nmRaised(5), padding: '12px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ color: m.color }}>{m.icon}</div>
                  <span style={{ fontSize: 9, fontWeight: 800, color: m.change > 0 ? '#22c55e' : m.change < 0 ? '#ef4444' : DR.textDim }}>
                    {m.change > 0 ? '+' : ''}{m.change}%
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: DR.text, letterSpacing: '-0.02em' }}>
                  {m.value >= 1000 ? `${(m.value / 1000).toFixed(1)}k` : m.value.toLocaleString()}
                </div>
                <div style={{ fontSize: 9, color: DR.textDim, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh */}
      <button
        type="button" onClick={() => load(range)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 12, background: DR.bg, border: 'none', boxShadow: nmRaised(3), cursor: 'pointer', fontFamily: DR.font, fontSize: 12, fontWeight: 600, color: DR.textDim }}>
        <RefreshCw size={13} /> Refresh Signal
      </button>

      {/* ── How DreamR decides what you see ── */}
      <div style={{ background: DR.bg, borderRadius: 18, boxShadow: nmRaised(6), padding: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: DR.text, letterSpacing: '-0.01em', marginBottom: 4 }}>
          How DreamR decides what you see
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: DR.textDim, lineHeight: 1.6 }}>
          The feed celebrates humanity — not trends. Scroll shows everyone.
          Swipe left goes deeper into one creator's world.
        </p>

        {/* Rewarded signals */}
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: DR.sky, marginBottom: 8 }}>
          What the feed rewards
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {[
            { label: 'Crafted, thoughtful writing',         weight: '22%' },
            { label: 'Original media — your own photos, art, music', weight: '22%' },
            { label: 'Made with dreamengin tools',           weight: '18%' },
            { label: 'Genuine language, real expression',    weight: '15%' },
            { label: 'Freshness — new voices surface naturally', weight: '13%' },
            { label: 'Resonance — when something moves people', weight: '10%' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: DR.bg, borderRadius: 10, boxShadow: nmRaised(2), padding: '9px 12px' }}>
              <div style={{ width: 36, height: 5, borderRadius: 99, background: `linear-gradient(90deg,${DR.skyLight},${DR.sky} ${s.weight},rgba(135,180,220,0.15) ${s.weight})`, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: DR.text, flex: 1 }}>{s.label}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: DR.sky, flexShrink: 0 }}>{s.weight}</span>
            </div>
          ))}
        </div>

        {/* Never ranked on */}
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: DR.textDim, marginBottom: 8 }}>
          Never used to rank
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {['Follower count', 'Like count', 'Share velocity', 'Political content', 'Viral momentum alone'].map(label => (
            <span key={label} style={{ fontSize: 11, fontWeight: 600, color: DR.textDim, background: DR.bg, boxShadow: nmInset(2), padding: '5px 11px', borderRadius: 99 }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Journey tab ────────────────────────────────────────────────────────────────

function JourneyTab() {
  return (
    <div style={{ padding: '20px 18px 0', fontFamily: DR.font }}>
      {/* Intro card */}
      <div style={{ background: DR.bg, borderRadius: 18, boxShadow: nmRaised(6), padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg,${DR.skyLight},${DR.sky} 55%,${DR.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: nmRaised(3) }}>
            <MapPin size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: DR.text, letterSpacing: '-0.01em' }}>Your Creative Journey</div>
            <div style={{ fontSize: 11, color: DR.textDim, marginTop: 1 }}>Every dot is a moment on dreamengin</div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: DR.textDim, lineHeight: 1.55 }}>
          DreamR is the stage. dreamengin is the studio. Every session in Music, Games, Lab, 
          Code, or Brand leaves a dot on your journey — the creative history behind your human media.
        </p>
      </div>

      {/* The actual JourneyTrail component (real data from /api/journey) */}
      <div style={{
        background: DR.bg, borderRadius: 18, boxShadow: nmInset(4),
        padding: '12px 4px',
        /* Override JourneyTrail dark theme tokens with DreamR pearl */
        filter: 'none',
      }}>
        <style>{`
          .dreamr-journey-wrap .journey-dot-group-label { color: ${DR.textDim} !important; font-family: ${DR.font} !important; font-size: 10px !important; }
          .dreamr-journey-wrap .journey-dot-label { color: ${DR.text} !important; font-family: ${DR.font} !important; }
          .dreamr-journey-wrap .journey-empty { color: ${DR.textDim} !important; font-family: ${DR.font} !important; }
        `}</style>
        <div className="dreamr-journey-wrap">
          <JourneyTrail limit={30} compact />
        </div>
      </div>
    </div>
  );
}

// ── Main DreamRSection ─────────────────────────────────────────────────────────

export default function DreamRSection({ profile, initialPosts, onOpenUrl }: DreamRSectionProps) {
  const [tab, setTab] = useState<Tab>('feed');
  const userId = profile?.id ?? '';

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100%',
        background: DR.bg,
        fontFamily: DR.font,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── DreamR brand header ──────────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          background: DR.bg,
          padding: '14px 18px 0',
          boxShadow: `0 2px 0 rgba(163,189,218,0.15)`,
        }}
      >
        {/* Logo + tagline */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 12,
                background: `linear-gradient(135deg,${DR.skyLight} 0%,${DR.sky} 52%,${DR.gold} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: nmRaised(4),
              }}
            >
              <span style={{ fontSize: 19, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>D</span>
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 800, color: DR.sky, letterSpacing: '-0.03em' }}>Dream</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: DR.gold, letterSpacing: '-0.03em' }}>R</span>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: DR.textDim, textTransform: 'uppercase', lineHeight: 1, marginTop: 1 }}>
                Human Media Platform
              </div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: DR.textDim, fontWeight: 500, textAlign: 'right', lineHeight: 1.4 }}>
            powered by<br />
            <span style={{ fontWeight: 700, color: DR.sky }}>dreamengin</span>
          </div>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex', gap: 4,
            background: DR.bg, borderRadius: 14,
            boxShadow: nmInset(4),
            padding: 4,
          }}
        >
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '8px 4px 6px',
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: DR.font,
                  background: active
                    ? `linear-gradient(135deg,${DR.skyLight} 0%,${DR.sky} 55%,${DR.gold} 100%)`
                    : 'transparent',
                  boxShadow: active ? `0 4px 14px rgba(91,168,212,0.32)` : 'none',
                  color: active ? '#fff' : DR.textDim,
                  transition: 'all 200ms',
                }}
                aria-label={t.label}
              >
                <span style={{ color: active ? '#fff' : DR.textDim }}>{t.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Feed — full-height snap scroll */}
        <div style={{ position: 'absolute', inset: 0, display: tab === 'feed' ? 'block' : 'none' }}>
          {userId ? (
            <DreamRFeed
              userId={userId}
              userHandle={profile?.handle ?? ''}
              userAvatar={profile?.avatar_url ?? null}
              userDisplayName={profile?.display_name ?? profile?.handle ?? ''}
              initialPosts={initialPosts}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DR.textDim, fontSize: 13 }}>
              Sign in to see your DreamR feed
            </div>
          )}
        </div>

        {/* Create, Platform, Signal, Journey — scrollable */}
        {tab !== 'feed' && (
          <div style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {tab === 'create'   && <CreateTab   userId={userId} profile={profile} />}
            {tab === 'platform' && <PlatformTab profile={profile} onOpenUrl={onOpenUrl} />}
            {tab === 'signal'   && <SignalTab />}
            {tab === 'journey'  && <JourneyTab />}
          </div>
        )}
      </div>

      {/* Spin keyframe for loader */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
