'use client';

import { useState, useCallback } from 'react';
import { Share2 } from 'lucide-react';
import SocialShareSheet from '@/components/ui/SocialShareSheet';

interface ProfileShareButtonProps {
  /** The URL to share. Defaults to the current page URL. */
  url?: string;
  /** Optional text / caption */
  text?: string;
}

export default function ProfileShareButton({ url, text }: ProfileShareButtonProps = {}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = useCallback(async () => {
    // Try the native Web Share API first (mobile / supported browsers)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'DREAMengin Profile',
          text: text ?? 'Check out this profile on DREAMengin',
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to sheet
      }
    }
    // Fallback: open the platform share sheet
    setSheetOpen(true);
  }, [shareUrl, text]);

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '9px 18px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, var(--de-gold), var(--de-accent))',
          border: 'none',
          color: 'white',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          letterSpacing: '0.02em',
        }}
        aria-label="Share profile"
      >
        <Share2 size={15} />
        Share Profile
      </button>

      <SocialShareSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        url={shareUrl}
        text={text ?? 'Check out this profile on DREAMengin'}
      />
    </>
  );
}
