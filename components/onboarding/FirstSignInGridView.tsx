'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

type Props = {
  profile?: ProfileLike | null;
  onComplete?: () => void;
};

/* App tiles for the blurred grid */
const APP_TILES = [
  { id: 'tiktok', label: 'TikTok', color: '#010101' },
  { id: 'music', label: 'Music', color: '#fc3c44' },
  { id: 'pods', label: 'Pods', color: '#8e44ad' },
  { id: 'brands', label: 'Brands', color: '#3498db' },
  { id: 'notes', label: 'Notes', color: '#f39c12' },
  { id: 'files', label: 'Files', color: '#2980b9' },
  { id: 'photos', label: 'Photos', color: '#27ae60' },
  { id: 'camera', label: 'Camera', color: '#e74c3c' },
  { id: 'friends', label: 'Friends', color: '#9b59b6' },
  { id: 'photos2', label: 'Photos', color: '#1abc9c' },
  { id: 'lastnight', label: 'Last Night', color: '#34495e' },
  { id: 'brands2', label: 'Brands', color: '#e67e22' },
  { id: 'create', label: 'Create', color: '#16a085' },
] as const;

/**
 * FirstSignInGridView — The profile/grid view for new users
 * 
 * Matches the design spec (IMG_5523):
 * - "dreamengin" wordmark header
 * - User profile pill with avatar and chevron
 * - Frosted/blurred widget grid overlay
 * - Gold spherical button at bottom with glow
 */
export default function FirstSignInGridView({ profile, onComplete }: Props) {
  const name = profile?.display_name || 'Dreamer';
  const avatarUrl = profile?.avatar_url;

  return (
    <div
      className="min-h-screen w-full flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(148deg, #c8dff5 0%, #d8eaf8 55%, #f5e8c4 100%)',
      }}
    >
      {/* Header with wordmark */}
      <header className="pt-12 pb-6 px-5 text-center relative z-10">
        <span
          className="de-wordmark"
          style={{
            fontSize: 28,
            fontStyle: 'italic',
            letterSpacing: '-0.01em',
          }}
        >
          <span style={{ color: '#8a9aaa' }}>dream</span>
          <span style={{ color: '#7a5c28' }}>engin</span>
        </span>
      </header>

      {/* Main content area */}
      <main className="flex-1 px-4 pb-28 overflow-hidden relative">
        {/* Profile pill */}
        <div
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 32,
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: avatarUrl ? undefined : 'linear-gradient(135deg, #2a8ab8, #c8981a)',
              border: '2px solid rgba(200,152,26,0.3)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              name[0]?.toUpperCase()
            )}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Chevron */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(200,152,26,0.08)',
              border: '1px solid rgba(200,152,26,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight size={18} style={{ color: 'rgba(200,152,26,0.7)' }} />
          </div>
        </div>

        {/* Blurred widget grid container */}
        <div
          style={{
            background: 'rgba(255,255,255,0.45)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.65)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            padding: 16,
            marginBottom: 16,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Row 1: 3 widgets */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  background: `rgba(${100 + i * 40}, ${150 + i * 20}, ${200}, 0.35)`,
                  filter: 'blur(1px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            ))}
          </div>

          {/* Row 2: Large widget + 2 small */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div
              style={{
                flex: 2,
                height: 80,
                borderRadius: 16,
                background: 'rgba(180,200,230,0.4)',
                filter: 'blur(1px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: 12,
              }}
            >
              <div
                style={{
                  width: '60%',
                  height: 8,
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  width: '40%',
                  height: 8,
                  background: 'rgba(255,255,255,0.4)',
                  borderRadius: 4,
                }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  borderRadius: 14,
                  background: 'rgba(160,190,220,0.35)',
                  filter: 'blur(1px)',
                }}
              />
              <div
                style={{
                  flex: 1,
                  borderRadius: 14,
                  background: 'rgba(140,180,210,0.35)',
                  filter: 'blur(1px)',
                }}
              />
            </div>
          </div>

          {/* Row 3: 3 square widgets */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  aspectRatio: '1',
                  borderRadius: 16,
                  background: `rgba(${140 + i * 30}, ${170 + i * 20}, ${210}, 0.35)`,
                  filter: 'blur(1px)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Underlying app icons grid (heavily blurred) */}
        <div
          style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.35)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderRadius: 24,
            padding: 14,
            filter: 'blur(2px)',
            opacity: 0.85,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
            }}
          >
            {APP_TILES.slice(0, 12).map((app) => (
              <div
                key={app.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${app.color}40`,
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    color: 'rgba(60,80,120,0.6)',
                    fontWeight: 500,
                  }}
                >
                  {app.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Gold button with glow effect - fixed at bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
        }}
      >
        {/* Glow ring */}
        <div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,168,67,0.4) 0%, transparent 70%)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />

        <button
          type="button"
          onClick={onComplete}
          aria-label="Continue to DREAMengin"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',

            /* 3-D metallic gold sphere */
            background: `
              radial-gradient(
                circle at 36% 32%,
                #fffde0 0%,
                #f7e07a 12%,
                #d4a843 38%,
                #a16207 68%,
                #6b3c03 100%
              )
            `,
            boxShadow: `
              inset 0 2px 4px rgba(255, 255, 220, 0.85),
              inset -3px -3px 10px rgba(80, 40, 0, 0.40),
              0 6px 24px rgba(100, 58, 4, 0.55),
              0 2px 8px rgba(212, 168, 67, 0.50),
              0 0 0 1.5px rgba(180, 120, 20, 0.45),
              0 0 60px rgba(212, 168, 67, 0.45)
            `,
            transition: 'transform 0.1s ease, box-shadow 0.1s ease',
          }}
        >
          {/* Highlight sheen */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '14%',
              left: '18%',
              width: '36%',
              height: '22%',
              borderRadius: '50%',
              background: 'rgba(255,255,245,0.55)',
              filter: 'blur(3px)',
              pointerEvents: 'none',
            }}
          />
          {/* Infinity symbol */}
          <svg
            width="28"
            height="14"
            viewBox="0 0 80 36"
            style={{ opacity: 0.82, flexShrink: 0, position: 'relative' }}
            aria-hidden="true"
          >
            <path
              d="M10 18c8-10 18-10 28 0s20 10 28 0"
              fill="none"
              stroke="#fffde0"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M10 18c8 10 18 10 28 0s20-10 28 0"
              fill="none"
              stroke="#fffde0"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Pulse animation keyframes */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
