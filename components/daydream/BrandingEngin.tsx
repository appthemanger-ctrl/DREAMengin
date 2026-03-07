'use client';

/**
 * BrandingEngin — Side B control layer for the Brand Daydream.
 *
 * Responsibilities (README spec §11.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - Brand Kit: link to appearance settings and public profile.
 *   - Analytics: link to algorithm/signal settings.
 *   - Campaigns: direct entry point to DreamAds create flow.
 *   - Audience: fetch follower count from the `follows` table.
 *
 * The public profile link uses /u/[handle] — handle is fetched from the profiles table.
 * Security: profile and follower count are read for auth.uid() only.
 * Follows AXIOM 4 (security by default) and AXIOM 5 (privacy by design).
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Palette, BarChart2, Megaphone, Users } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface ProfileData {
  handle: string;
  display_name: string | null;
  follower_count: number;
}

const ACCENT = '#ec4899';

export default function BrandingEngin({ onBack }: Props) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user;
      if (!user || cancelled) { setLoading(false); return; }

      // Fetch profile row and follower count in parallel
      const [profileRes, followsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('handle, display_name')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('follows')
          .select('follower_id', { count: 'exact', head: true })
          .eq('followed_id', user.id),
      ]);

      if (!cancelled) {
        const pdata = profileRes.data as { handle: string; display_name: string | null } | null;
        setProfile({
          handle:         pdata?.handle ?? '',
          display_name:   pdata?.display_name ?? null,
          follower_count: followsRes.count ?? 0,
        });
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const publicProfileHref = profile?.handle ? `/u/${profile.handle}` : '/view-profile';

  return (
    <div className="de-sky-bg min-h-screen">

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full"
            style={{
              background: 'rgba(160,195,240,0.15)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Back to Brand"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>

          <div
            style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg, ${ACCENT}, rgba(200,152,26,0.8))`,
            }}
          />

          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>
              BrandingEngin
            </div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Brand · Control Layer</div>
          </div>

          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
          >
            Side B
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>

        {/* Brand Kit */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Brand Kit</span>
          </div>

          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Appearance */}
              <Link
                href="/settings/appearance"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.55)',
                    border: `1px solid ${ACCENT}18`,
                    transition: 'transform 0.12s',
                    cursor: 'pointer',
                  }}
                  onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
                  onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                  onPointerLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: `${ACCENT}15`,
                      border: `1px solid ${ACCENT}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Palette className="w-4 h-4" style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                      Appearance
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                      Gradient theme, avatar, and style
                    </div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--de-text-dim)' }}>→</span>
                </div>
              </Link>

              {/* Public Profile */}
              <Link
                href={publicProfileHref}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.55)',
                    border: `1px solid ${ACCENT}18`,
                    transition: 'transform 0.12s',
                    cursor: 'pointer',
                  }}
                  onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
                  onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                  onPointerLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: `${ACCENT}15`,
                      border: `1px solid ${ACCENT}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>🌐</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                      Public Profile
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                      {loading
                        ? 'Loading…'
                        : profile?.handle
                          ? `@${profile.handle} — see what visitors see`
                          : 'Set your handle to publish your profile'}
                    </div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--de-text-dim)' }}>→</span>
                </div>
              </Link>

            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Analytics</span>
          </div>

          <div className="de-widget-body">
            <Link
              href="/settings/algorithm"
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.55)',
                  border: `1px solid ${ACCENT}18`,
                  cursor: 'pointer',
                  transition: 'transform 0.12s',
                }}
                onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
                onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                onPointerLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: `${ACCENT}15`, border: `1px solid ${ACCENT}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <BarChart2 className="w-4 h-4" style={{ color: ACCENT }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                    Algorithm &amp; Signals
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                    Tune your content reach and visibility
                  </div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--de-text-dim)' }}>→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Campaigns */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Campaigns</span>
          </div>

          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 12 }}>
              DreamAds campaigns let you promote your content and profile to targeted audiences.
            </p>
          </div>

          <div className="de-widget-actions">
            <Link href="/ads/create" className="de-btn de-btn-primary text-xs">
              <Megaphone className="w-3 h-3 mr-1" />
              Create Campaign
            </Link>
          </div>
        </div>

        {/* Audience */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Audience</span>
          </div>

          <div className="de-widget-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: `${ACCENT}12`, border: `1px solid ${ACCENT}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Users className="w-6 h-6" style={{ color: ACCENT, opacity: 0.8 }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 28, fontWeight: 900, color: 'var(--de-heading)',
                    lineHeight: 1, letterSpacing: '-0.02em',
                  }}
                >
                  {loading ? '—' : profile?.follower_count.toLocaleString() ?? '0'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 2 }}>
                  Followers
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
