'use client';

import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface IdariButtonProps {
  isAdmin: boolean;
}

export default function IdariButton({ isAdmin }: IdariButtonProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  if (!isAdmin) {
    return null;
  }

  return (
    <button
      onClick={() => router.push('/admin')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="de-btn de-btn-gold"
      style={{
        position: 'fixed',
        bottom: 96,
        right: 24,
        width: 48,
        height: 48,
        borderRadius: 9999,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
      }}
      aria-label="Open Idari Admin Panel"
      title="Idari — Admin Agent"
    >
      <Sparkles className="w-5 h-5" />
      {isHovered && (
        <span style={{
          position: 'absolute',
          right: '100%',
          marginRight: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(160,195,240,0.45)',
          color: 'var(--de-heading)',
          fontSize: 12,
          fontWeight: 700,
          padding: '6px 12px',
          borderRadius: 9999,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          Idari Admin
        </span>
      )}
    </button>
  );
}
