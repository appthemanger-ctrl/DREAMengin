'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ProfileShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '9px 18px',
        borderRadius: 12,
        background: copied
          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
          : 'linear-gradient(135deg, var(--de-gold), var(--de-accent))',
        border: 'none',
        color: 'white',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
        letterSpacing: '0.02em',
      }}
      aria-label="Copy profile link"
    >
      {copied ? (
        <>
          <Check size={15} />
          Copied!
        </>
      ) : (
        <>
          <Share2 size={15} />
          Share Profile
        </>
      )}
    </button>
  );
}
