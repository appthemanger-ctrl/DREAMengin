// PRIMARY_HOME_COMPONENT
// This is the canonical entry point for the signed-in Home experience.
// All Home UI changes must be made here. Do not create alternative Home components.
// See docs/PRIMARY_FLOW.md and docs/HOME_FEED_TV_SPEC.md for constraints.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StarfieldCanvas from '@/components/dreamengin/StarfieldCanvas';
import DreamsGrid from '@/components/home/DreamsGrid';
import HomeFeedTV from '@/components/home/HomeFeedTV';
import { useDreamFeed } from '@/lib/dreams/useDreamFeed';

type ProfileLike = {
  id?: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
};

type Face = 'home' | 'profile';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function HomeSystem({ profile, userId: _userId, initialPosts: _initialPosts }: { userId: string; profile: ProfileLike | null; initialPosts: any[] }) {
  const [face, setFace] = useState<Face>('home');

  const { items, active, loading, forceRefresh } = useDreamFeed();

  return (
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      <StarfieldCanvas />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100dvh',
          /* reserve bottom inset for the global Golden Button overlay */
          paddingBottom: 100,
          background: 'linear-gradient(180deg,#020818 0%,#040d2c 55%,#020818 100%)',
        }}
      >
        {/* ── Top bar ── */}
        <header
          style={{
            position: 'sticky', top: 0, zIndex: 20,
            background: 'rgba(2,8,24,0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(100,150,255,0.1)',
            padding: '0 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: 52,
          }}
        >
          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo1.PNG" alt="" width={28} height={28}
              style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(240,244,255,0.92)', letterSpacing: '0.02em' }}>
              {face === 'profile' && profile?.display_name
                ? profile.display_name
                : 'DREAMengin'}
            </span>
          </div>

          {/* Face tabs */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 2,
              background: 'rgba(100,150,255,0.08)',
              borderRadius: 20, padding: 3,
            }}
          >
            {(['home', 'profile'] as Face[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFace(f)}
                style={{
                  background: face === f ? 'rgba(100,150,255,0.2)' : 'transparent',
                  border: face === f ? '1px solid rgba(100,150,255,0.3)' : '1px solid transparent',
                  borderRadius: 16, padding: '5px 14px',
                  fontSize: 11, fontWeight: 700,
                  color: face === f ? 'rgba(180,210,255,0.95)' : 'rgba(160,185,255,0.4)',
                  cursor: 'pointer', textTransform: 'capitalize',
                  transition: 'color 0.15s',
                }}
              >
                {f === 'home' ? '⌂ Home' : '◉ Profile'}
              </button>
            ))}
          </div>

          {/* Avatar */}
          <div style={{ width: 28 }}>
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" width={28} height={28}
                style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(212,168,67,0.4)' }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(100,150,255,0.15)', border: '1px solid rgba(100,150,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                👤
              </div>
            )}
          </div>
        </header>

        {/* ── Page content — conditional on face ── */}
        {face === 'home' && (
          /* TV feed replaces old UniversalFeed + DreamsGrid tiny-icon grid (A3, A4) */
          <HomeFeedTV
            items={items}
            loading={loading}
            onRefresh={forceRefresh}
            active={active}
          />
        )}

        {face === 'profile' && (
          <main style={{ maxWidth: 680, margin: '0 auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Profile card */}
            <ProfileCard profile={profile} />

            {/* Dreams grid — pin mode edits public profile */}
            <DreamsGrid mode="profile" />
          </main>
        )}
      </div>
    </div>
  );
}

/* ── Profile card shown on the Profile face ── */
function ProfileCard({ profile }: { profile: ProfileLike | null }) {
  return (
    <div
      style={{
        background: 'rgba(5,15,45,0.65)',
        border: '1px solid rgba(212,168,67,0.2)',
        borderRadius: 20,
        padding: '20px 18px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" width={56} height={56}
            style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(212,168,67,0.5)', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(100,150,255,0.1)', border: '2px solid rgba(100,150,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            👤
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'rgba(240,244,255,0.95)', marginBottom: 2 }}>
            {profile?.display_name || 'Your Name'}
          </div>
          {profile?.handle && (
            <div style={{ fontSize: 12, color: 'rgba(160,185,255,0.55)' }}>@{profile.handle}</div>
          )}
        </div>
      </div>

      {profile?.bio && (
        <p style={{ fontSize: 13, color: 'rgba(200,220,255,0.65)', lineHeight: 1.55, margin: '0 0 14px' }}>
          {profile.bio}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href="/edit-profile"
          style={{ fontSize: 11, fontWeight: 700, padding: '7px 16px',
            background: 'rgba(100,150,255,0.12)', border: '1px solid rgba(100,150,255,0.25)',
            borderRadius: 20, color: 'rgba(160,200,255,0.8)', textDecoration: 'none' }}>
          ✏️ Edit Profile
        </Link>
        {profile?.handle && (
          <Link href={`/profile/${profile.handle}`}
            style={{ fontSize: 11, fontWeight: 700, padding: '7px 16px',
              background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)',
              borderRadius: 20, color: 'rgba(212,168,67,0.8)', textDecoration: 'none' }}>
            ◉ View Public Page
          </Link>
        )}
      </div>
    </div>
  );
}
