'use client';

/**
 * HomeFeedTV — Vertical scroll-snap "TV feed" for the Home page.
 *
 * A3 requirements:
 * - Vertical scroll container with CSS scroll-snap: y mandatory
 * - Each item is a full-screen-ish "program card" (height ~85vh)
 * - IntersectionObserver detects active program (>=60% visible)
 * - Only active item can animate/autoplay; others static
 *
 * A4/A5 requirements:
 * - Pattern A: TV rows — vertical feed of horizontal carousels of large Dream cards
 * - 6 Daydream channel chips (analytics, brand, games, media-vault, music, play)
 * - Channel selection persists to localStorage
 *
 * A6 requirements:
 * - Stub feed items (can render news/social later)
 * - Each "program" card: title/source/time, optional media poster, short excerpt, Open action
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DREAMS } from '@/lib/dreams/catalog';
import type { FeedItem } from '@/lib/dreams/types';
import DreamCardLarge from './DreamCardLarge';

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Channel = 'analytics' | 'brand' | 'games' | 'media-vault' | 'music' | 'play';

type ProgramCard = {
  id: string;
  title: string;
  source: string;
  time: string;
  poster?: string;
  excerpt: string;
  url?: string;
  dreamId?: string;
};

/* ─── Constants ──────────────────────────────────────────────────────────── */
const CHANNEL_STORAGE_KEY    = 'dreamengin:home:channel:v1';
const CHANNELS: Array<{ id: Channel; label: string; icon: string }> = [
  { id: 'analytics',  label: 'Analytics', icon: '📊' },
  { id: 'brand',      label: 'Brand',     icon: '✦'  },
  { id: 'games',      label: 'Games',     icon: '🎮' },
  { id: 'media-vault',label: 'Vault',     icon: '📺' },
  { id: 'music',      label: 'Music',     icon: '🎵' },
  { id: 'play',       label: 'Play',      icon: '🕹️' },
];

/* ─── Stub data ──────────────────────────────────────────────────────────── */
const STUB_PROGRAMS: ProgramCard[] = [
  {
    id: 'p1',
    title: 'Your creative universe, personalized',
    source: 'DREAMengin',
    time: 'now',
    excerpt: 'Activate dreams below to populate your live feed with content from each channel.',
    dreamId: 'daydream',
  },
  {
    id: 'p2',
    title: 'Top picks in Music this week',
    source: 'Music Channel',
    time: '2m ago',
    excerpt: 'Trending tracks, new releases, and curated playlists from your connected sources.',
    dreamId: 'music',
  },
  {
    id: 'p3',
    title: 'Brand spotlight: new tools for creators',
    source: 'Brand Channel',
    time: '14m ago',
    excerpt: 'Explore new brand assets, logo builders, and identity design tools.',
    dreamId: 'brand',
  },
  {
    id: 'p4',
    title: 'Game nights & leaderboards',
    source: 'Games Channel',
    time: '1h ago',
    excerpt: 'Check your rankings, discover new titles, and connect with other players.',
    dreamId: 'games',
  },
];

/* ─── Program Card ───────────────────────────────────────────────────────── */
function ProgramCardView({
  card,
  isActive,
  isReducedMotion,
}: {
  card: ProgramCard;
  isActive: boolean;
  isReducedMotion: boolean;
}) {
  const dream = card.dreamId ? DREAMS.find((d) => d.id === card.dreamId) : null;

  return (
    <div
      style={{
        height: '85vh',
        minHeight: 480,
        flexShrink: 0,
        scrollSnapAlign: 'start',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: isActive
          ? 'rgba(5,12,35,0.0)'
          : 'rgba(5,12,35,0.0)',
        transition: isReducedMotion ? 'none' : 'opacity 0.3s',
        opacity: isActive ? 1 : 0.7,
      }}
    >
      {/* Program header */}
      <div
        style={{
          background: 'rgba(5,15,45,0.72)',
          border: '1px solid rgba(100,150,255,0.12)',
          borderRadius: 20,
          padding: '20px 18px',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Source + time */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {dream && (
              <span style={{ fontSize: 18, lineHeight: 1 }}>{dream.icon}</span>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(212,168,67,0.7)',
              }}
            >
              {card.source}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(160,185,255,0.35)' }}>
            {card.time}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'rgba(240,244,255,0.95)',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          }}
        >
          {card.title}
        </div>

        {/* Excerpt */}
        <div
          style={{
            fontSize: 14,
            color: 'rgba(180,200,255,0.55)',
            lineHeight: 1.6,
            flex: 1,
          }}
        >
          {card.excerpt}
        </div>

        {/* Open action */}
        {card.url && (
          <a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              alignSelf: 'flex-start',
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(100,150,255,0.8)',
              textDecoration: 'none',
              padding: '8px 16px',
              background: 'rgba(100,150,255,0.1)',
              border: '1px solid rgba(100,150,255,0.2)',
              borderRadius: 20,
              letterSpacing: '0.04em',
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Open ↗
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── Dream Row (horizontal carousel of large cards) ─────────────────────── */
function DreamRow({
  title,
  dreamIds,
  active,
  scrollKey,
}: {
  title: string;
  dreamIds: string[];
  active: Set<string>;
  scrollKey: string;
}) {
  const scrollRef   = useRef<HTMLDivElement>(null);
  const savedScroll = useRef<number>(0);

  useEffect(() => {
    // Restore scroll position for this row
    try {
      const saved = sessionStorage.getItem(`dreamengin:row:scroll:${scrollKey}`);
      if (saved && scrollRef.current) {
        scrollRef.current.scrollLeft = Number(saved);
      }
    } catch { /* noop */ }
  }, [scrollKey]);

  const onScroll = () => {
    if (!scrollRef.current) return;
    savedScroll.current = scrollRef.current.scrollLeft;
    try {
      sessionStorage.setItem(
        `dreamengin:row:scroll:${scrollKey}`,
        String(savedScroll.current),
      );
    } catch { /* noop */ }
  };

  const dreams = dreamIds
    .map((id) => DREAMS.find((d) => d.id === id))
    .filter(Boolean) as typeof DREAMS;

  if (dreams.length === 0) return null;

  return (
    <div
      style={{
        height: '85vh',
        minHeight: 480,
        flexShrink: 0,
        scrollSnapAlign: 'start',
        padding: '20px 0 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Row header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingRight: 16,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(212,168,67,0.75)',
          }}
        >
          {title}
        </span>
        <span
          style={{
            marginLeft: 8,
            fontSize: 11,
            color: 'rgba(160,185,255,0.3)',
          }}
        >
          {dreams.length}
        </span>
      </div>

      {/* Horizontal scroll of DreamCardLarge */}
      <div
        ref={(el) => { (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
        onScroll={onScroll}
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingRight: 16,
          paddingBottom: 8,
          scrollbarWidth: 'none',
          flex: 1,
          alignItems: 'flex-start',
        }}
      >
        {dreams.map((dream) => (
          <DreamCardLarge
            key={dream.id}
            dream={dream}
            isActive={active.has(dream.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Channel descriptor map ─────────────────────────────────────────────── */
const CHANNEL_DREAM_IDS: Record<Channel, string[]> = {
  analytics:    ['analytics', 'dr-eams', 'feed-settings', 'connectors'],
  brand:        ['brand', 'dream-effects', 'lab', 'daydream-brand'],
  games:        ['games', 'daydream-games', 'physics-lab', 'dream-a'],
  'media-vault':['music-lib', 'daydream-music', 'music', 'daydream'],
  music:        ['music', 'daydream-music', 'dream-a', 'dream-b'],
  play:         ['games', 'daydream-games', 'daydream', 'lab'],
};

/* ─── HomeFeedTV ─────────────────────────────────────────────────────────── */
type Props = {
  items: FeedItem[];
  loading: boolean;
  onRefresh: () => void;
  active: Set<string>;
};

export default function HomeFeedTV({ items: _items, loading: _loading, onRefresh: _onRefresh, active }: Props) {
  const [channel, setChannel]           = useState<Channel>('music');
  const [activeCard, setActiveCard]     = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const cardRefs                        = useRef<(Element | null)[]>([]);

  /* Restore channel preference + check reduced-motion */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHANNEL_STORAGE_KEY) as Channel | null;
      if (saved && CHANNELS.some((c) => c.id === saved)) setChannel(saved);
    } catch { /* noop */ }

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* Persist channel selection */
  const selectChannel = useCallback((ch: Channel) => {
    setChannel(ch);
    try { localStorage.setItem(CHANNEL_STORAGE_KEY, ch); } catch { /* noop */ }
  }, []);

  /* IntersectionObserver — detect active program (>=60% visible) */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = cardRefs.current.findIndex((el) => el === entry.target);
            if (idx >= 0) setActiveCard(idx);
          }
        });
      },
      { threshold: 0.6 },
    );
    cardRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [channel]);

  const currentChannel = CHANNELS.find((c) => c.id === channel);
  const channelRowTitle = `${currentChannel?.icon ?? ''} ${currentChannel?.label ?? ''} Dreams`;
  const dreamIds = CHANNEL_DREAM_IDS[channel];

  return (
    <div style={{ width: '100%', minHeight: '100dvh' }}>
      {/* Channel strip */}
      <div
        style={{
          position: 'sticky',
          top: 52, // below the header
          zIndex: 10,
          padding: '8px 16px',
          background: 'rgba(2,8,24,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(100,150,255,0.08)',
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}
      >
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => selectChannel(ch.id)}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: 20,
              border: channel === ch.id
                ? '1px solid rgba(212,168,67,0.5)'
                : '1px solid rgba(100,150,255,0.15)',
              background: channel === ch.id
                ? 'rgba(212,168,67,0.14)'
                : 'rgba(100,150,255,0.06)',
              color: channel === ch.id
                ? 'rgba(240,210,130,0.95)'
                : 'rgba(160,185,255,0.5)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              transition: isReducedMotion ? 'none' : 'background 0.15s, border-color 0.15s, color 0.15s',
              minHeight: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span>{ch.icon}</span>
            {ch.label}
          </button>
        ))}
      </div>

      {/* TV Feed — vertical scroll-snap container */}
      <div
        data-tv-feed
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          height: 'calc(100dvh - 52px - 53px)', // full height minus header and channel strip
          scrollbarWidth: 'none',
        } as React.CSSProperties}
      >
        {/* Stub program card (first snap panel) */}
        <div
          ref={(el) => { cardRefs.current[0] = el; }}
          style={{ scrollSnapAlign: 'start', height: '85vh', minHeight: 480, flexShrink: 0 }}
        >
          <ProgramCardView
            card={STUB_PROGRAMS[0]}
            isActive={activeCard === 0}
            isReducedMotion={isReducedMotion}
          />
        </div>

        {/* Channel-specific Dream row */}
        <div ref={(el) => { cardRefs.current[1] = el; }}>
          <DreamRow
            title={channelRowTitle}
            dreamIds={dreamIds}
            active={active}
            scrollKey={`${channel}-row-0`}
          />
        </div>

        {/* All Dreams row */}
        <div ref={(el) => { cardRefs.current[2] = el; }}>
          <DreamRow
            title="All Dreams"
            dreamIds={DREAMS.slice(0, 8).map((d) => d.id)}
            active={active}
            scrollKey="all-row"
          />
        </div>
      </div>
    </div>
  );
}
