import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Palette, Share2, ImageIcon, BarChart2, Users, TrendingUp } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import BrandingEngin from '@/components/daydream/BrandingEngin';
import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader';
import { connection } from 'next/server';

export const metadata = { title: 'Brand Daydream – Dreamengin', description: 'Build and manage your personal brand identity.' };

const ACCENT = '#ec4899';

const WIDGETS: DaydreamWidget[] = [
  { id: 'post',      emoji: '📢', label: 'New Post',     desc: 'Create and share content',    color: '#ec4899', href: '/daydream/create' },
  { id: 'profile',   emoji: '👤', label: 'Edit ProfileDream', desc: 'Update your public presence', color: '#2a8ab8', href: '/edit-profiledream' },
  { id: 'analytics', emoji: '📊', label: 'Analytics',    desc: 'Track your reach and growth', color: '#6366f1', href: '/daydream/analytics' },
  { id: 'appearance',emoji: '🎨', label: 'Appearance',   desc: 'Gradient theme and style',    color: '#f59e0b', href: '/settings/appearance' },
  { id: 'connectors',emoji: '🔌', label: 'Social Links', desc: 'Connect your platforms',      color: '#0ea5e9', href: '/connectors' },
  { id: 'view',      emoji: '🌐', label: 'View Profile', desc: 'See what visitors see',       color: '#22c55e', href: '/view-profile' },
  { id: 'shop',      emoji: '🛍️', label: 'Your Shop',    desc: 'Sell products and services',  color: '#c8981a', href: '/shop' },
  { id: 'music',     emoji: '🎵', label: 'Music Studio', desc: 'Your artist side',            color: '#8b5cf6', href: '/daydream/music' },
];

export default async function BrandDaydreamPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Brand"
      enginName="BrandingEngin"
      accentColor={ACCENT}
      daydreamType="brand"
      widgets={WIDGETS}
      sideBComponent={BrandingEngin}
    >
    <div className="de-sky-bg min-h-screen">
      <AuthenticatedPageHeader
        backHref="/homedream"
        title="Brand"
        subtitle="Identity, profile projection, scheduling, and visual polish in one premium brand surface."
        icon={<Palette className="w-4 h-4" />}
        accentColor="#ec4899"
        badge="Daydream"
      />

      <div className="de-auth-content space-y-4">

        {/* ── Feature 1: Profile Card ── */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Profile Card</span></div>
          <div className="de-widget-body flex items-center gap-4">
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(236,72,153,0.25)', flexShrink: 0 }}>
              <span style={{ fontSize: 22 }}>👤</span>
            </div>
            <div>
              <div className="font-bold" style={{ color: 'var(--de-heading)' }}>Your Name</div>
              <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>@handle · Edit your profile to update</div>
            </div>
          </div>
          <div className="de-widget-actions">
            <Link href="/edit-profiledream" className="de-btn de-btn-ghost text-xs">Edit ProfileDream</Link>
            <Link href="/view-profile" className="de-btn de-btn-primary text-xs">View Profile</Link>
          </div>
        </div>

        {/* ── Feature 2: Brand Health Score ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>💪</span>
            <span className="de-widget-title ml-2">Brand Health Score</span>
          </div>
          <div className="de-widget-body">
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>74</div>
              <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 4 }}>/ 100 — Good</div>
              <div style={{ margin: '10px auto', height: 8, maxWidth: 200, borderRadius: 4, background: 'rgba(0,0,0,0.07)' }}>
                <div style={{ height: '100%', borderRadius: 4, width: '74%', background: 'linear-gradient(90deg, #22c55e, #6366f1)' }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center' }}>
              Open <strong>BrandingEngin</strong> for per-dimension breakdown and improvement tips.
            </p>
          </div>
        </div>

        {/* ── Feature 3: Quick Analytics ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <BarChart2 className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Quick Analytics</span>
            <Link href="/daydream/analytics" className="text-xs font-semibold ml-auto" style={{ color: ACCENT }}>Full View →</Link>
          </div>
          <div className="de-widget-body">
            <div className="grid grid-cols-3 gap-3">
              {[['—', 'Reach'], ['—', 'Engagement'], ['—', 'Growth']].map(([val, lbl]) => (
                <div key={lbl} className="de-metric de-surface">
                  <span className="de-metric-value">{val}</span>
                  <span className="de-metric-label">{lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 4: Color Palette ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Palette className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Brand Color Palette</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', gap: 6 }}>
              {['#ec4899','#f9a8d4','#c026d3','#fbbf24','#1e1b4b','#f0fdf4'].map(c => (
                <div key={c} title={c} style={{ flex: 1, height: 36, borderRadius: 8, background: c, border: '2px solid rgba(255,255,255,0.4)' }} />
              ))}
            </div>
            <p style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 8 }}>Your brand palette — generated from your accent color. Full generator in BrandingEngin.</p>
          </div>
        </div>

        {/* ── Feature 5: A/B Tests ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Active A/B Tests</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: ACCENT, background: 'rgba(236,72,153,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>0 active</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
              Create A/B tests for post variants, bio copy, and campaign creative in <strong>BrandingEngin</strong> (Side B). Track which variant wins by engagement.
            </p>
          </div>
          <div className="de-widget-actions">
            <Link href="/daydream/brand" className="de-btn de-btn-primary text-xs">Open BrandingEngin</Link>
          </div>
        </div>

        {/* ── Feature 6: Campaign ROI Calculator ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">💰 Campaign ROI Calculator</span>
          </div>
          <div className="de-widget-body">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Budget',  val: '$—', color: '#6366f1' },
                { label: 'CPM',     val: '$—', color: '#ec4899' },
                { label: 'ROI',     val: '—%', color: '#22c55e' },
              ].map(r => (
                <div key={r.label} style={{ padding: '10px 8px', borderRadius: 9, background: `${r.color}0e`, border: `1px solid ${r.color}20`, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: r.color }}>{r.val}</div>
                  <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2 }}>{r.label}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 8 }}>Enter spend and results in BrandingEngin to calculate live ROI.</p>
          </div>
        </div>

        {/* ── Feature 7: Audience Segments ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Users className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Audience Segments</span>
          </div>
          <div className="de-widget-body">
            {[
              { name: 'The Hustler',  pct: 38, color: '#6366f1', desc: '22–28 · Tech' },
              { name: 'The Creative', pct: 29, color: '#ec4899', desc: '18–24 · Art' },
              { name: 'The Builder',  pct: 21, color: '#0ea5e9', desc: '28–36 · Dev' },
            ].map(seg => (
              <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '7px 10px', borderRadius: 9, background: `${seg.color}0a`, border: `1px solid ${seg.color}18` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{seg.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{seg.desc}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: seg.color }}>{seg.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature 8: Brand Voice ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">🎯 Brand Voice AI</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Bold', 'Creative', 'Authentic', 'Aspirational'].map(tone => (
                <span key={tone} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}25` }}>
                  {tone}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 8 }}>
              Generate on-brand copy in BrandingEngin. Your brand voice is auto-learned from your content.
            </p>
          </div>
        </div>

        {/* ── Feature 9: Competitor Watch ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <TrendingUp className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Competitor Watch</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Track up to 5 competitor handles. See their follower count, posting frequency, and engagement trends.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['@competitor1', '@competitor2', '@competitor3'].map(h => (
                <div key={h} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}12` }}>
                  <span style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>{h}</span>
                  <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>Add in BrandingEngin →</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 10: Typography Kit ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Typography Kit</span>
          </div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { role: 'Display', sample: 'DREAMengin', size: 22, weight: 800 },
              { role: 'Body',    sample: 'Building the future of creativity.', size: 13, weight: 400 },
              { role: 'Caption', sample: 'v2.0.0 · production', size: 11, weight: 500 },
            ].map(t => (
              <div key={t.role} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}12` }}>
                <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginBottom: 3 }}>{t.role}</div>
                <div style={{ fontSize: t.size, fontWeight: t.weight, color: 'var(--de-heading)' }}>{t.sample}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature 11: Sponsorship Pitch ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Sponsorship Pitch Generator</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Auto-generate a media kit pitch email for sponsors — populated with your follower stats, engagement rate, and content focus.
            </p>
            <div style={{ padding: '10px 12px', borderRadius: 9, background: `${ACCENT}07`, border: `1px solid ${ACCENT}18`, fontSize: 11, color: 'var(--de-text)', lineHeight: 1.6 }}>
              &ldquo;Hi [Sponsor], I&apos;m a creator with [X] followers and 5.2% engagement. My audience is highly engaged in creative tech. I&apos;d love to partner…&rdquo;
            </div>
          </div>
          <div className="de-widget-actions">
            <Link href="/daydream/brand" className="de-btn de-btn-primary text-xs">Generate Full Pitch →</Link>
          </div>
        </div>

        {/* ── Feature 12: Press Kit ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Press Kit</span>
          </div>
          <div className="de-widget-body">
            {[
              { label: 'Creator Bio',    status: '✅' },
              { label: 'Logo / Avatar',  status: '✅' },
              { label: 'Audience Stats', status: '✅' },
              { label: 'Media Kit PDF',  status: '📄' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', marginBottom: 4, borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}10` }}>
                <span style={{ fontSize: 11, color: 'var(--de-heading)' }}>{item.label}</span>
                <span style={{ fontSize: 14 }}>{item.status}</span>
              </div>
            ))}
          </div>
          <div className="de-widget-actions">
            <Link href="/daydream/brand" className="de-btn de-btn-ghost text-xs">Build Press Kit →</Link>
          </div>
        </div>

        {/* ── Feature 13: Social Media Bio Optimizer ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Bio Optimizer</span>
          </div>
          <div className="de-widget-body">
            {[
              { platform: '📸 Instagram', bio: '✨ Creative tech builder · DMs open 🚀', chars: 40 },
              { platform: '🐦 X / Twitter', bio: 'Building @DREAMengin daily 🔥', chars: 30 },
            ].map(b => (
              <div key={b.platform} style={{ marginBottom: 8, padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}12` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, marginBottom: 3 }}>{b.platform} · {b.chars} chars</div>
                <div style={{ fontSize: 11, color: 'var(--de-heading)' }}>{b.bio}</div>
              </div>
            ))}
            <p style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>Full platform-optimized bios in BrandingEngin.</p>
          </div>
        </div>

        {/* ── Feature 14: Mood Board ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">🎨 Mood Board</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {['#ec4899','#8b5cf6','#1e1b4b','#f9a8d4','#fbbf24','rgba(30,27,75,0.5)'].map((bg, i) => (
                <div key={i} style={{ height: 52, borderRadius: 10, background: bg, border: '2px solid rgba(255,255,255,0.25)' }} />
              ))}
            </div>
            <p style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 8 }}>Visual brand mood board — expandable in BrandingEngin with image uploads.</p>
          </div>
        </div>

        {/* ── Feature 15: Content Theme Planner ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">📅 Content Theme Planner</span>
          </div>
          <div className="de-widget-body">
            {['April: Community Spotlight 👥', 'May: Build in Public 🔨', 'June: Creator Collab Month 🤝'].map(theme => (
              <div key={theme} style={{ padding: '7px 10px', marginBottom: 6, borderRadius: 9, background: `${ACCENT}08`, border: `1px solid ${ACCENT}15`, fontSize: 12, color: 'var(--de-heading)', fontWeight: 600 }}>
                {theme}
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature 16: Persona Builder ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Users className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Target Persona</span>
          </div>
          <div className="de-widget-body">
            <div style={{ padding: '12px 14px', borderRadius: 12, background: `${ACCENT}07`, border: `1px solid ${ACCENT}18` }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: ACCENT, marginBottom: 6 }}>The Hustler Creator</div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
                Age 22–28 · Mobile-first · Motivated by growth & income · Consumes daily content
                on TikTok &amp; Instagram · Interested in productivity, building, and creativity.
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature 17: Brand Story Timeline ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Brand Story Timeline</span>
          </div>
          <div className="de-widget-body">
            {[
              { date: '2023', event: 'Started creating content' },
              { date: '2024', event: 'Reached 10K followers' },
              { date: '2025', event: 'Launched DREAMengin' },
              { date: 'Now',  event: 'Building toward 100K' },
            ].map(m => (
              <div key={m.date} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, minWidth: 32, marginTop: 2 }}>{m.date}</span>
                <div style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}12`, fontSize: 11, color: 'var(--de-heading)' }}>
                  {m.event}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature 18: Revenue Tracker ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">💰 Revenue Tracker</span>
          </div>
          <div className="de-widget-body">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Affiliate', val: '$340', color: '#6366f1' },
                { label: 'Brand Deals', val: '$1,200', color: ACCENT },
                { label: 'Shop', val: '$280', color: '#22c55e' },
              ].map(r => (
                <div key={r.label} style={{ padding: '10px 8px', borderRadius: 9, background: `${r.color}0e`, border: `1px solid ${r.color}20`, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: r.color }}>{r.val}</div>
                  <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2 }}>{r.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 19: Game Engine Visual Presets ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">🎮 Game Engine Visual Presets</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>FREE</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Apply your brand color palette to the Game Engine visual theme — affects post-processing and HUD colors across all games.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { name: 'Brand Pink', accent: '#ec4899', active: true },
                { name: 'Neon Gold',  accent: '#c8981a', active: false },
                { name: 'Dream Blue', accent: '#2a8ab8', active: false },
              ].map(preset => (
                <div key={preset.name} style={{ flex: 1, padding: '10px 8px', borderRadius: 10, background: `${preset.accent}14`, border: `2px solid ${preset.accent}${preset.active ? '80' : '25'}`, textAlign: 'center' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: preset.accent, margin: '0 auto 5px' }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: preset.accent }}>{preset.name}</div>
                  {preset.active && <div style={{ fontSize: 9, color: '#22c55e', marginTop: 2 }}>● Active</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 20: Shop Integration ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">🛍 Shop Integration</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Sell digital products, presets, and services directly from your brand profile. Connect your DreamShop to your analytics for ROI tracking.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/shop" className="de-btn de-btn-ghost text-xs" style={{ flex: 1, justifyContent: 'center' }}>View Shop</Link>
              <Link href="/shop/sell" className="de-btn de-btn-primary text-xs" style={{ flex: 1, justifyContent: 'center' }}>+ New Listing</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
    </DaydreamShell>
  );
}
