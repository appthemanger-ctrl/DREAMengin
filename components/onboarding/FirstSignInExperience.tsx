'use client';

import React, { useState } from 'react';
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

/**
 * FirstSignInExperience — The new user HomeDream welcome screen
 * 
 * Matches the design spec:
 * - "dreamengin" wordmark header
 * - Frosted glass containers
 * - Home / Feed navigation
 * - Placeholder widget cards
 * - My Dreams section
 * - Gold infinity button at bottom
 */
export default function FirstSignInExperience({ profile, onComplete }: Props) {
  const [activeTab, setActiveTab] = useState<'home' | 'feed'>('home');
  const name = profile?.display_name || 'Dreamer';
  const avatarUrl = profile?.avatar_url;

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background: 'linear-gradient(148deg, #c8dff5 0%, #d8eaf8 55%, #f5e8c4 100%)',
      }}
    >
      {/* Header with wordmark */}
      <header className="pt-12 pb-6 px-5 text-center">
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
      <main className="flex-1 px-4 pb-28 overflow-y-auto">
        {/* Profile pill (for profile view) */}
        <div
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
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

        {/* Main glass container */}
        <div
          style={{
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            padding: '20px 18px',
            marginBottom: 16,
          }}
        >
          {/* Navigation tabs */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: activeTab === 'home' ? 700 : 500,
                color: activeTab === 'home' ? 'var(--de-heading, #0f2a5c)' : 'rgba(60,100,160,0.5)',
                padding: 0,
                transition: 'color 0.15s',
              }}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: activeTab === 'feed' ? 700 : 500,
                color: activeTab === 'feed' ? 'var(--de-heading, #0f2a5c)' : 'rgba(60,100,160,0.5)',
                padding: 0,
                transition: 'color 0.15s',
              }}
            >
              Feed
            </button>
          </div>

          {/* Placeholder widget cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Widget card 1 - horizontal bars */}
            <div
              style={{
                background: 'rgba(230,238,248,0.65)',
                borderRadius: 16,
                padding: '16px 14px',
                minHeight: 70,
              }}
            >
              <div
                style={{
                  width: '45%',
                  height: 10,
                  background: 'rgba(160,190,230,0.45)',
                  borderRadius: 5,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  width: '65%',
                  height: 10,
                  background: 'rgba(160,190,230,0.35)',
                  borderRadius: 5,
                }}
              />
            </div>

            {/* Widget card 2 - larger placeholder */}
            <div
              style={{
                background: 'rgba(230,238,248,0.55)',
                borderRadius: 16,
                padding: 16,
                minHeight: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '80%',
                  height: 10,
                  background: 'rgba(160,190,230,0.35)',
                  borderRadius: 5,
                }}
              />
            </div>
          </div>
        </div>

        {/* My Dreams section */}
        <div
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            padding: '16px 18px',
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--de-heading, #0f2a5c)',
              marginBottom: 14,
            }}
          >
            My Dreams
          </h3>

          {/* Dream thumbnail placeholder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: 'rgba(200,210,225,0.55)',
                position: 'relative',
              }}
            >
              {/* Small dot indicator */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 6,
                  left: 6,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.85)',
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Gold infinity button - fixed at bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
        }}
      >
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

            /* 3-D metallic gold sphere with marble texture effect */
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
              0 0 40px rgba(212, 168, 67, 0.35)
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
    </div>
  );
}
