'use client';

/**
 * SocialShareSheet
 *
 * A bottom-sheet that lets users share a URL + optional text to social
 * platforms or copy the link to clipboard.
 *
 * Usage:
 *   <SocialShareSheet
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     url="https://dreamengin.app/u/somehandle"
 *     text="Check out this profile on DREAMengin"
 *   />
 */

import { useState, useCallback, useEffect } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { PROFILE_SHARE_PLATFORMS, type SocialPlatform } from '@/lib/social/platforms';

interface SocialShareSheetProps {
  open: boolean;
  onClose: () => void;
  /** The URL to share */
  url: string;
  /** Optional text / caption to accompany the share */
  text?: string;
  /** Override the list of platforms shown (defaults to PROFILE_SHARE_PLATFORMS) */
  platforms?: SocialPlatform[];
}

export default function SocialShareSheet({
  open,
  onClose,
  url,
  text,
  platforms = PROFILE_SHARE_PLATFORMS,
}: SocialShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2200);
    });
  }, [url]);

  const openPlatform = useCallback((platform: SocialPlatform) => {
    const shareUrl = platform.buildShareUrl(url, text);
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=480');
  }, [url, text]);

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: 'rgba(10,30,60,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet */}
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(245,242,228,0.97) 100%)',
          borderRadius: '28px 28px 0 0',
          border: '1.5px solid rgba(255,255,255,0.8)',
          borderBottom: 'none',
          boxShadow: '0 -8px 48px rgba(42,138,184,0.18)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
          animation: 'de-slide-up 0.28s cubic-bezier(0,0.55,0.45,1)',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(160,195,240,0.5)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px 8px',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading, #1a2b4a)' }}>
            Share
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share sheet"
            style={{
              background: 'rgba(160,195,240,0.15)',
              border: '1px solid rgba(160,195,240,0.3)',
              borderRadius: 10,
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--de-text, #444)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* URL preview */}
        <div style={{ padding: '4px 20px 14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(160,195,240,0.3)',
          }}>
            <ExternalLink size={13} style={{ color: 'var(--de-accent, #2a8ab8)', flexShrink: 0 }} />
            <span style={{
              flex: 1,
              fontSize: 12,
              fontFamily: 'monospace',
              color: 'var(--de-text, #555)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {url}
            </span>
            <button
              type="button"
              onClick={copyLink}
              aria-label="Copy link"
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 8,
                border: 'none',
                background: copyFailed
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : copied
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : 'linear-gradient(135deg, var(--de-gold, #c8981a), var(--de-accent, #2a8ab8))',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
            >
              {copyFailed
                ? <><X size={12} /> Failed</>
                : copied
                  ? <><Check size={12} /> Copied!</>
                  : <><Copy size={12} /> Copy</>
              }
            </button>
          </div>
        </div>

        {/* Platform grid */}
        <div style={{ padding: '0 20px 8px' }}>
          <p style={{ fontSize: 11, color: 'var(--de-muted, #888)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Share to
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
            gap: 10,
          }}>
            {platforms.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => openPlatform(platform)}
                aria-label={`Share on ${platform.label}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 6px',
                  borderRadius: 14,
                  border: '1.5px solid rgba(160,195,240,0.2)',
                  background: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 14px ${platform.color}33`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = '';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
                }}
              >
                {/* Coloured circle with emoji */}
                <span style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: platform.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {platform.emoji}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text, #555)', textAlign: 'center', lineHeight: 1.2 }}>
                  {platform.label.replace('/ Twitter', '').replace('X ', 'X').trim()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
