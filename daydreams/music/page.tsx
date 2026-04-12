import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Music,
  DiscAlbum,
  TrendingUp,
  Upload,
  Sparkles,
  Radio,
  BarChart3,
  Globe,
  DollarSign,
  Share2,
  Clock,
  CheckCircle,
  Zap,
} from 'lucide-react';
import SoundRecorder from '@/components/music/SoundRecorder';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import StarMakerEngin from '@/engins/StarMakerEngin';
import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { connection } from 'next/server';

export const metadata = {
  title: 'Artist Hub – DREAMengin',
  description: 'Your artist command center — release pipeline, distribution, audience, and monetization.',
};

const WIDGETS: DaydreamWidget[] = [
  { id: 'record',      emoji: '🎙️', label: 'Record',         desc: 'Open the production studio',   color: '#2a8ab8', href: '/daydream/music' },
  { id: 'upload',      emoji: '📤', label: 'Upload Track',   desc: 'Add a track to your library',  color: '#6366f1', href: '/music/upload' },
  { id: 'releases',    emoji: '🎵', label: 'My Releases',    desc: 'Albums, singles, and EPs',     color: '#c8981a', href: '/music' },
  { id: 'analytics',   emoji: '📊', label: 'Music Stats',    desc: 'Streams, plays, and reach',    color: '#22c55e', href: '/daydream/analytics' },
  { id: 'distribute',  emoji: '🌍', label: 'Distribute',     desc: 'Send to Spotify, Apple, etc.', color: '#00bcd4', href: '/music' },
  { id: 'monetize',    emoji: '💰', label: 'Monetize',       desc: 'Royalties, splits, sync',      color: '#f59e0b', href: '/music' },
  { id: 'share',       emoji: '🔗', label: 'Share to Feed',  desc: 'Post a track or update',       color: '#ec4899', href: '/daydream/create' },
  { id: 'brand',       emoji: '🎨', label: 'Brand Hub',      desc: 'Your artist identity',         color: '#0ea5e9', href: '/daydream/brand' },
];

// ── Release pipeline stages ─────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { id: 'idea',    label: 'Idea',    emoji: '💡', color: '#6366f1', desc: 'Capture concepts, voice memos, loops' },
  { id: 'demo',    label: 'Demo',    emoji: '🎛️', color: '#00bcd4', desc: 'Beat + reference vocal, rough arrangement' },
  { id: 'record',  label: 'Record',  emoji: '🎙️', color: '#a855f7', desc: 'Studio-quality takes, overdubs, layers' },
  { id: 'mix',     label: 'Mix',     emoji: '🎚️', color: '#f97316', desc: 'Balance, EQ, stereo width, dynamics' },
  { id: 'master',  label: 'Master',  emoji: '💿', color: '#ec4899', desc: 'Loudness, limiter, final chain' },
  { id: 'live',    label: 'Live',    emoji: '🚀', color: '#22c55e', desc: 'Published on all platforms' },
] as const;

// ── Distribution platforms ───────────────────────────────────────────────────

const DIST_PLATFORMS = [
  { name: 'Spotify',       icon: '🎧', score: 72, color: '#1ed760' },
  { name: 'Apple Music',   icon: '🍎', score: 68, color: '#fc3c44' },
  { name: 'YouTube Music', icon: '▶️',  score: 81, color: '#ff0000' },
  { name: 'TikTok',        icon: '🎵', score: 85, color: '#69c9d0' },
  { name: 'Amazon Music',  icon: '📦', score: 61, color: '#ff9900' },
  { name: 'SoundCloud',    icon: '☁️',  score: 77, color: '#ff5500' },
] as const;

// ── Monetization items ───────────────────────────────────────────────────────

const MONETIZE_ITEMS = [
  { label: 'Streaming Royalties',  icon: <TrendingUp className="w-4 h-4" />,  status: 'active',   color: '#22c55e' },
  { label: 'Split Sheets',         icon: <Share2 className="w-4 h-4" />,       status: 'setup',    color: '#00bcd4' },
  { label: 'Sync Licensing',       icon: <Zap className="w-4 h-4" />,          status: 'pending',  color: '#f59e0b' },
  { label: 'Content ID',           icon: <CheckCircle className="w-4 h-4" />,  status: 'active',   color: '#22c55e' },
  { label: 'Direct Fan Support',   icon: <DollarSign className="w-4 h-4" />,   status: 'setup',    color: '#00bcd4' },
  { label: 'Brand Placements',     icon: <Globe className="w-4 h-4" />,        status: 'pending',  color: '#f59e0b' },
] as const;

// ── Promo schedule ───────────────────────────────────────────────────────────

const PROMO_TIMELINE = [
  { day: '-14d', label: 'Tease clip',      platform: 'TikTok / IG Reels',  done: true  },
  { day: '-7d',  label: 'Cover art drop',  platform: 'Instagram / Twitter', done: true  },
  { day: '-3d',  label: 'Pre-save link',   platform: 'Spotify / Apple',    done: false },
  { day: '0d',   label: 'Release day',     platform: 'All platforms',      done: false },
  { day: '+3d',  label: 'Reaction video',  platform: 'YouTube Shorts',     done: false },
  { day: '+7d',  label: 'Playlist pitches',platform: 'Spotify Editorial',  done: false },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

export default async function MusicArtistHubPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');

  return (
    <DaydreamShell
      title="Artist Hub"
      enginName="StarMakerEngin"
      accentColor="#2a8ab8"
      daydreamType="music"
      widgets={WIDGETS}
      sideBComponent={StarMakerEngin}
    >
      <div style={{ background: '#0d0f17', minHeight: '100vh', color: '#e2e5ee' }}>
        {/* Header */}
        <AuthenticatedPageHeader
          backHref="/homedream"
          title="Artist Hub"
          subtitle="Release pipeline · Distribution · Audience · Monetization"
          icon={<Music className="w-4 h-4" />}
          accentColor="#2a8ab8"
          badge="Daydream"
        />

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 120px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Hero CTA ── */}
          <div style={{
            padding: '20px 24px', borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(0,208,240,0.14) 0%, rgba(168,85,247,0.12) 100%)',
            border: '1px solid rgba(0,208,240,0.2)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#00d0f0', marginBottom: 8 }}>
              Your Artist Command Center
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.1, color: '#e2e5ee', marginBottom: 8 }}>
              From idea to chart-ready release — in one place.
            </div>
            <div style={{ fontSize: 13, color: '#6e7585', lineHeight: 1.7, marginBottom: 16 }}>
              Artist Hub is where your music lives after the studio session. Manage every step of your release pipeline, track distribution readiness, understand your audience, and grow your income — all while your StarMakerEngin session stays hot on Side&nbsp;B.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/music/upload" style={{
                padding: '10px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                background: 'rgba(0,208,240,0.2)', color: '#00d0f0',
                border: '1px solid rgba(0,208,240,0.4)', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Upload className="w-3.5 h-3.5" /> Upload a Track
              </Link>
              <Link href="/daydream/brand" style={{
                padding: '10px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                background: 'rgba(255,255,255,0.06)', color: '#6e7585',
                border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Radio className="w-3.5 h-3.5" /> Open Brand Hub
              </Link>
            </div>
          </div>

          {/* ── Sound Recorder (quick capture) ── */}
          <Section title="Quick Capture" icon={<Sparkles className="w-3.5 h-3.5" />} badge="Live Rec" badgeColor="#ef4444">
            <SoundRecorder />
          </Section>

          {/* ── Release Pipeline ── */}
          <Section title="Release Pipeline" icon={<Zap className="w-3.5 h-3.5" />} badge="6 stages" badgeColor="#00bcd4">
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {PIPELINE_STAGES.map((stage, i) => (
                <div key={stage.id} style={{
                  flexShrink: 0, minWidth: 90,
                  padding: '12px 10px', borderRadius: 10,
                  background: `${stage.color}10`,
                  border: `1px solid ${stage.color}30`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  position: 'relative',
                }}>
                  {/* Arrow connector */}
                  {i < PIPELINE_STAGES.length - 1 && (
                    <div style={{
                      position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 12, color: 'rgba(255,255,255,0.2)', zIndex: 1,
                    }}>▶</div>
                  )}
                  <span style={{ fontSize: 20 }}>{stage.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: stage.color }}>{stage.label}</span>
                  <span style={{ fontSize: 9, color: '#6e7585', textAlign: 'center', lineHeight: 1.4 }}>
                    {stage.desc}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#6e7585', marginTop: 8 }}>
              Move tracks through each stage in StarMakerEngin (Side B). When you reach Master → Live, come back here to launch distribution.
            </p>
          </Section>

          {/* ── Distribution Readiness ── */}
          <Section title="Distribution Readiness" icon={<Globe className="w-3.5 h-3.5" />}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {DIST_PLATFORMS.map(p => (
                <div key={p.name} style={{
                  padding: '10px', borderRadius: 9,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e5ee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 5, overflow: 'hidden' }}>
                    <div style={{
                      width: `${p.score}%`, height: '100%', borderRadius: 999,
                      background: p.color, transition: 'width 0.4s',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6e7585' }}>
                    <span>Readiness</span>
                    <span style={{ fontWeight: 700, color: p.score >= 75 ? '#22c55e' : p.score >= 60 ? '#f59e0b' : '#ef4444' }}>
                      {p.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/music" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginTop: 10, padding: '9px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'rgba(0,208,240,0.08)', color: '#00d0f0',
              border: '1px solid rgba(0,208,240,0.22)', textDecoration: 'none',
            }}>
              <Globe className="w-3.5 h-3.5" /> Manage Distribution Settings
            </Link>
          </Section>

          {/* ── Audience Insights ── */}
          <Section title="Audience Insights" icon={<BarChart3 className="w-3.5 h-3.5" />} badge="Analytics" badgeColor="#a855f7">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Total Streams',  value: '—',    color: '#00bcd4' },
                { label: 'Followers',      value: '—',    color: '#a855f7' },
                { label: 'Playlist Adds',  value: '—',    color: '#22c55e' },
                { label: 'Save Rate',      value: '—',    color: '#f59e0b' },
                { label: 'Skip Rate',      value: '—',    color: '#ef4444' },
                { label: 'Discovery %',    value: '—',    color: '#00d0f0' },
              ].map(stat => (
                <div key={stat.label} style={{
                  padding: '10px 12px', borderRadius: 9,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#6e7585', marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <Link href="/daydream/analytics" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'rgba(168,85,247,0.08)', color: '#a855f7',
              border: '1px solid rgba(168,85,247,0.22)', textDecoration: 'none',
            }}>
              <BarChart3 className="w-3.5 h-3.5" /> Open Full Analytics
            </Link>
          </Section>

          {/* ── Monetization Tracker ── */}
          <Section title="Monetization Tracker" icon={<DollarSign className="w-3.5 h-3.5" />} badge="Revenue" badgeColor="#f59e0b">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {MONETIZE_ITEMS.map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 9,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <span style={{ color: item.color, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#e2e5ee' }}>{item.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, flexShrink: 0,
                    background: item.status === 'active' ? 'rgba(34,197,94,0.12)' : item.status === 'setup' ? 'rgba(0,208,240,0.1)' : 'rgba(245,158,11,0.1)',
                    color: item.status === 'active' ? '#22c55e' : item.status === 'setup' ? '#00bcd4' : '#f59e0b',
                    border: `1px solid ${item.status === 'active' ? 'rgba(34,197,94,0.25)' : item.status === 'setup' ? 'rgba(0,208,240,0.25)' : 'rgba(245,158,11,0.25)'}`,
                  }}>
                    {item.status === 'active' ? '✓ Active' : item.status === 'setup' ? 'Set Up' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Promotion Scheduler ── */}
          <Section title="Promotion Scheduler" icon={<Clock className="w-3.5 h-3.5" />} badge="Timeline" badgeColor="#ec4899">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PROMO_TIMELINE.map(item => (
                <div key={item.day} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 9,
                  background: item.done ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${item.done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  opacity: item.done ? 0.7 : 1,
                }}>
                  <div style={{
                    width: 38, flexShrink: 0, fontSize: 10, fontWeight: 800,
                    fontFamily: 'monospace', textAlign: 'right',
                    color: item.day === '0d' ? '#ec4899' : item.done ? '#22c55e' : '#6e7585',
                  }}>
                    {item.day}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: item.done ? '#6e7585' : '#e2e5ee', textDecoration: item.done ? 'line-through' : 'none' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 10, color: '#6e7585' }}>{item.platform}</div>
                  </div>
                  {item.done
                    ? <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                    : <div style={{ width: 16, height: 16, borderRadius: 999, border: '1.5px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                  }
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#6e7585', marginTop: 8 }}>
              Plan your pre-release and post-release cadence. Use Brand Hub + Create Daydream to generate the assets for each step.
            </p>
          </Section>

          {/* ── My Releases quick view ── */}
          <Section title="Label & Releases" icon={<DiscAlbum className="w-3.5 h-3.5" />}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              {[
                { icon: DiscAlbum,  label: 'Albums',   count: '—' },
                { icon: TrendingUp, label: 'Streams',  count: '—' },
                { icon: Upload,     label: 'Releases', count: '—' },
              ].map(({ icon: Icon, label, count }) => (
                <div key={label} style={{
                  padding: '12px', borderRadius: 9, textAlign: 'center',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <Icon className="w-5 h-5" style={{ color: '#2a8ab8' }} />
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#e2e5ee' }}>{count}</span>
                  <span style={{ fontSize: 10, color: '#6e7585' }}>{label}</span>
                </div>
              ))}
            </div>
            <Link href="/music/upload" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: 'rgba(42,138,184,0.15)', color: '#2a8ab8',
              border: '1px solid rgba(42,138,184,0.35)', textDecoration: 'none',
            }}>
              <Upload className="w-3.5 h-3.5" /> + New Release
            </Link>
          </Section>

        </div>
      </div>
    </DaydreamShell>
  );
}

// ── Section wrapper component ─────────────────────────────────────────────────

function Section({
  title, icon, badge, badgeColor, children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: '#141720',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 14px',
        background: '#111420',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ color: '#00d0f0', display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#6e7585',
        }}>
          {title}
        </span>
        {badge && badgeColor && (
          <span style={{
            marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
            background: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}30`,
          }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ padding: '14px' }}>
        {children}
      </div>
    </div>
  );
}
