import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Lightbulb, CheckSquare, Calendar, FolderKanban, ImageIcon, PlusCircle } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import ContentEngin from '@/components/daydream/ContentEngin';
import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader';

const WIDGETS: DaydreamWidget[] = [
  { id: 'note',      emoji: '📝', label: 'Quick Note',  desc: 'Capture a thought instantly',  color: '#f59e0b', href: '/daydream/create' },
  { id: 'task',      emoji: '✅', label: 'New Task',    desc: 'Add to your to-do list',       color: '#10b981', href: '/daydream/create' },
  { id: 'idea',      emoji: '💡', label: 'New Idea',    desc: 'Drop an idea before it fades', color: '#f59e0b', href: '/daydream/create' },
  { id: 'project',   emoji: '📁', label: 'New Project', desc: 'Start a project board',        color: '#0ea5e9', href: '/daydream/create' },
  { id: 'post',      emoji: '📢', label: 'Share Post',  desc: 'Post an update to your feed',  color: '#ec4899', href: '/create' },
  { id: 'calendar',  emoji: '📅', label: 'Calendar',    desc: 'View your schedule',           color: '#6366f1', href: '/daydream/create' },
  { id: 'media',     emoji: '🖼️', label: 'Media',       desc: 'Attach photos or videos',      color: '#8b5cf6', href: '/daydream/media-vault' },
  { id: 'connectors',emoji: '🔌', label: 'Connectors',  desc: 'Link your tools',              color: '#c8981a', href: '/connectors' },
];

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create – Dreamengin', description: 'Ideas, tasks, calendar, projects, and media.' };

const ACCENT = '#f59e0b';

export default async function CreateDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Create"
      enginName="ContentEngin"
      accentColor={ACCENT}
      daydreamType="create"
      widgets={WIDGETS}
      sideBComponent={ContentEngin}
    >
    <div className="de-sky-bg min-h-screen">
      <AuthenticatedPageHeader
        backHref="/homedream"
        title="Create"
        subtitle="Capture ideas, tasks, media, and launch-ready content without breaking flow."
        icon={<PlusCircle className="w-4 h-4" />}
        accentColor="#6366f1"
        badge="Daydream"
      />

      <div className="de-auth-content space-y-4">
        <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>Everything you make lives here as widgets—not pages.</p>

        {widgets.map(({ icon: Icon, label, singular, desc, color, addHref }) => (
          <div key={label} className="de-widget">
            <div className="de-widget-header">
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="de-widget-title">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature 7: Content Repurposer ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <FileText className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Content Repurposer</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { from: '📝 Blog Post', to: '🐦 Tweet Thread' },
                { from: '🎬 Long Video', to: '📱 5 Reels' },
                { from: '🎙 Podcast', to: '📝 Newsletter' },
                { from: '🧵 Thread', to: '📸 Carousel' },
              ].map(r => (
                <div key={r.from} style={{ padding: '9px 10px', borderRadius: 9, background: `${ACCENT}08`, border: `1px solid ${ACCENT}15` }}>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{r.from}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginTop: 2 }}>→ {r.to}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 8: SEO Title Optimizer ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <BarChart2 className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">SEO Title Optimizer</span>
          </div>
          <div className="de-widget-body">
            {[
              { title: 'How I Built [X] in [Time]', score: 92, color: '#22c55e' },
              { title: 'The Ultimate Guide to [Topic]', score: 85, color: '#f59e0b' },
              { title: '[N] Things I Learned from [X]', score: 88, color: '#22c55e' },
            ].map(t => (
              <div key={t.title} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', marginBottom: 5, borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}15` }}>
                <span style={{ fontSize: 11, color: 'var(--de-heading)' }}>{t.title}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: t.color }}>{t.score}pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature 9: Multi-Platform Scheduler ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Calendar className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Multi-Platform Scheduler</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { platform: '📸 Instagram', optimal: 'Wed 6 PM' },
                { platform: '🎵 TikTok',    optimal: 'Fri 7 PM' },
                { platform: '🐦 X',         optimal: 'Thu 9 AM' },
                { platform: '▶️ YouTube',   optimal: 'Sat 2 PM' },
              ].map(p => (
                <div key={p.platform} style={{ padding: '9px 10px', borderRadius: 9, background: `${ACCENT}08`, border: `1px solid ${ACCENT}15` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 2 }}>{p.platform}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>Best: {p.optimal}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 10: Publishing Queue ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">📤 Publishing Queue</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--de-text-dim)', background: 'rgba(0,0,0,0.06)', padding: '2px 7px', borderRadius: 5 }}>0 queued</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center', padding: '12px 0' }}>
              No posts queued. Draft and schedule from <strong>ContentEngin</strong> (Side B).
            </p>
          </div>
        </div>

        {/* ── Feature 11: AI Caption Generator ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">✨ AI Caption Generator</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 8 }}>
              Describe your post and get 3 caption variants — short, medium, and story-style — optimized for each platform.
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Short', 'Medium', 'Story'].map(v => (
                <div key={v} style={{ flex: 1, padding: '7px 4px', borderRadius: 8, background: `${ACCENT}10`, border: `1px solid ${ACCENT}20`, textAlign: 'center', fontSize: 11, fontWeight: 700, color: ACCENT }}>{v}</div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 12: Hashtag Optimizer ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title"># Hashtag Optimizer</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['#dreamlife', '#creator', '#buildinpublic', '#contentgame', '#dreamengin', '#buildingthefuture'].map(tag => (
                <span key={tag} style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}25` }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 13: Short Video Editor ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Video className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Short Video Editor</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 8 }}>
              Trim, caption, and format video clips for Reels, TikTok, and YouTube Shorts — all from the browser.
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Trim', 'Caption', 'Format', 'Export'].map(a => (
                <div key={a} style={{ flex: 1, padding: '7px 4px', borderRadius: 8, background: `${ACCENT}10`, border: `1px solid ${ACCENT}20`, textAlign: 'center', fontSize: 11, fontWeight: 700, color: ACCENT }}>{a}</div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 14: Template Gallery ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">🎨 Template Gallery</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { name: 'Product Drop', emoji: '🛍' },
                { name: 'Story Arc',    emoji: '📖' },
                { name: 'How-To',       emoji: '🎓' },
                { name: 'Reaction',     emoji: '😮' },
                { name: 'Q&A',          emoji: '💬' },
                { name: 'Day-in-Life',  emoji: '📅' },
              ].map(t => (
                <div key={t.name} style={{ padding: '10px 6px', borderRadius: 9, background: `${ACCENT}08`, border: `1px solid ${ACCENT}15`, textAlign: 'center' }}>
                  <div style={{ fontSize: 20 }}>{t.emoji}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--de-text-dim)', marginTop: 4 }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 15: Content Analytics Summary ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <BarChart2 className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title">Content Analytics</span>
            <Link href="/daydream/analytics" className="text-xs font-semibold ml-auto" style={{ color: ACCENT }}>Full View →</Link>
          </div>
          <div className="de-widget-body">
            <div className="grid grid-cols-3 gap-3">
              {[['—', 'Posts'], ['—', 'Avg Eng'], ['—', 'Top Reach']].map(([val, lbl]) => (
                <div key={lbl} className="de-metric de-surface">
                  <span className="de-metric-value">{val}</span>
                  <span className="de-metric-label">{lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 16: Ad Copy Generator ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">📣 Ad Copy Generator</span>
          </div>
          <div className="de-widget-body">
            <div style={{ padding: '10px 12px', borderRadius: 9, background: `${ACCENT}07`, border: `1px solid ${ACCENT}18` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 3 }}>Stop wasting time. Start creating.</div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 6 }}>DREAMengin gives you analytics, publishing, and brand tools creators actually use.</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT }}>Start Free Today →</div>
            </div>
            <p style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 6 }}>Generate Awareness, Conversion, and Retargeting variants in ContentEngin.</p>
          </div>
        </div>

        {/* ── Feature 17: Newsletter Template ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">✉ Newsletter Template</span>
          </div>
          <div className="de-widget-body">
            <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', fontSize: 11, color: 'var(--de-text)', lineHeight: 1.7 }}>
              <strong>Subject: [Hook] — Issue #[N]</strong><br />
              👋 Hey [First Name],<br />
              • 🔥 [Main insight]<br />
              • 💡 [Tip or tool]<br />
              • 📖 [Curated read]<br />
              [Your Name] 🚀
            </div>
          </div>
        </div>

        {/* ── Feature 18: Co-authoring Draft ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">👥 Co-authoring Draft</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 8 }}>
              Collaborate on drafts with co-authors in real-time. Mentions, comments, and version history included.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['@coauthor1', '@creator2'].map(h => (
                <div key={h} style={{ flex: 1, padding: '7px 10px', borderRadius: 9, background: `${ACCENT}08`, border: `1px solid ${ACCENT}15`, textAlign: 'center', fontSize: 11, fontWeight: 700, color: ACCENT }}>{h}</div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 19: Performance Predictor ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">📈 Performance Predictor</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { type: '📱 Reel', score: 91, label: 'High' },
                { type: '📝 Carousel', score: 84, label: 'Strong' },
                { type: '🐦 Thread', score: 72, label: 'Moderate' },
                { type: '📸 Static', score: 58, label: 'Average' },
              ].map(f => (
                <div key={f.type} style={{ padding: '8px 8px', borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}12`, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, marginBottom: 3 }}>{f.type}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: f.score >= 80 ? '#22c55e' : f.score >= 65 ? ACCENT : '#ef4444' }}>{f.score}%</div>
                  <div style={{ fontSize: 9, color: 'var(--de-text-dim)' }}>{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 20: Game Cinematic Intro Templates ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">🎮 Cinematic Intro Templates</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>FREE</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Game-engine-powered animated video intros — rendered by EliteGameEngine WebGPU in the browser.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { name: 'Neon Burst', emoji: '✨', tier: 'Free' },
                { name: 'Drift Intro', emoji: '🏎', tier: 'Premium' },
                { name: 'Galaxy Fly', emoji: '🌌', tier: 'Premium' },
                { name: 'Glitch Cut', emoji: '⚡', tier: 'Free' },
              ].map(t => (
                <div key={t.name} style={{ padding: '9px 9px', borderRadius: 9, background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)' }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{t.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)' }}>{t.name}</div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: t.tier === 'Free' ? '#22c55e' : '#8b5cf6', background: t.tier === 'Free' ? 'rgba(34,197,94,0.1)' : 'rgba(139,92,246,0.1)', padding: '1px 5px', borderRadius: 4 }}>{t.tier}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="de-widget-actions">
            <Link href="/daydream/create" className="de-btn de-btn-primary text-xs">Open ContentEngin →</Link>
          </div>
        </div>

      </div>
    </div>
    </DaydreamShell>
  );
}
