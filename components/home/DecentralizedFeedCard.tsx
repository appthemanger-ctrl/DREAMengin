'use client';

// components/home/DecentralizedFeedCard.tsx
// Post card for a single decentralized social post.
// Styled to match DREAMengin's dark space aesthetic.

import React, { useState } from 'react';
import type { NormalizedPost } from '@/lib/social/decentralizedFeed';

const PLATFORM_META: Record<
  string,
  { icon: string; label: string; color: string }
> = {
  mastodon: { icon: '🐘', label: 'Mastodon', color: '#6364ff' },
  bluesky:  { icon: '🦋', label: 'Bluesky',  color: '#0085ff' },
  nostr:    { icon: '⚡', label: 'Nostr',    color: 'rgba(100,150,255,0.9)' },
  internal: { icon: '✨', label: 'DREAMengin', color: '#22c55e' },
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

const MAX_CONTENT = 280;

export default function DecentralizedFeedCard({ post }: { post: NormalizedPost }) {
  const [expanded, setExpanded] = useState(false);
  const meta = PLATFORM_META[post.platform] ?? PLATFORM_META.internal;
  const isLong = post.content.length > MAX_CONTENT;
  const displayContent =
    isLong && !expanded
      ? post.content.slice(0, MAX_CONTENT) + '…'
      : post.content;

  const initials = post.author.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        background: 'rgba(5,15,45,0.55)',
        border: '1px solid rgba(100,150,255,0.1)',
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 10,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>
          {post.author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              width={32}
              height={32}
              style={{ borderRadius: '50%', objectFit: 'cover', display: 'block' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `${meta.color}33`,
                border: `1px solid ${meta.color}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: meta.color,
              }}
            >
              {initials || '?'}
            </div>
          )}
        </div>

        {/* Author info + platform badge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 12, fontWeight: 700,
                color: 'rgba(240,244,255,0.9)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '60%',
              }}
            >
              {post.author.displayName}
            </span>
            <span
              style={{
                fontSize: 10, color: 'var(--de-text-dim, rgba(160,185,255,0.4))',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '40%',
              }}
            >
              {post.author.handle}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 10, fontWeight: 600,
                color: meta.color,
                background: `${meta.color}1a`,
                border: `1px solid ${meta.color}44`,
                borderRadius: 6,
                padding: '1px 6px',
                whiteSpace: 'nowrap',
              }}
            >
              {meta.icon} {meta.label}
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--de-text-dim, rgba(160,185,255,0.35))', marginTop: 2 }}>
            {timeAgo(post.createdAt)}
          </div>
        </div>
      </div>

      {/* Content */}
      <p
        style={{
          fontSize: 12, lineHeight: 1.6,
          color: 'rgba(220,230,255,0.85)',
          margin: 0, marginBottom: 8,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}
      >
        {displayContent}
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(100,150,255,0.7)', fontSize: 11, padding: '0 4px',
            }}
          >
            {expanded ? 'show less' : 'show more'}
          </button>
        )}
      </p>

      {/* Media preview */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.mediaUrls[0]}
          alt="media"
          style={{
            width: '100%', maxHeight: 180,
            objectFit: 'cover', borderRadius: 8,
            marginBottom: 8, display: 'block',
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      )}

      {/* Footer: engagement + link */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 10, color: 'var(--de-text-dim, rgba(160,185,255,0.4))',
        }}
      >
        {post.likeCount != null && (
          <span>❤ {post.likeCount.toLocaleString()}</span>
        )}
        {post.repostCount != null && (
          <span>🔁 {post.repostCount.toLocaleString()}</span>
        )}
        {post.replyCount != null && (
          <span>💬 {post.replyCount.toLocaleString()}</span>
        )}
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginLeft: 'auto',
              color: meta.color,
              fontSize: 10, fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            View on {meta.label} ↗
          </a>
        )}
      </div>
    </div>
  );
}
