import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Lightbulb, CheckSquare, Calendar, FolderKanban, ImageIcon, PlusCircle, FileText, BarChart2, Video, Brain, RefreshCw, Sparkles } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import ContentEngin from '@/engins/ContentEngin';
import OpenDaydreamSideBButton from '@/components/daydream/OpenDaydreamSideBButton';
import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader';
import { connection } from 'next/server';

const WIDGETS: DaydreamWidget[] = [
  { id: 'note',      emoji: '📝', label: 'Quick Note',   desc: 'Capture a thought instantly',  color: '#f59e0b', href: '/engines/create/editor' },
  { id: 'task',      emoji: '✅', label: 'New Task',     desc: 'Add to your to-do list',       color: '#10b981', href: '/engines/create/editor' },
  { id: 'idea',      emoji: '💡', label: 'New Idea',     desc: 'Drop an idea before it fades', color: '#f59e0b', href: '/engines/create/editor' },
  { id: 'project',   emoji: '📁', label: 'New Project',  desc: 'Start a project board',        color: '#0ea5e9', href: '/engines/create' },
  { id: 'post',      emoji: '📢', label: 'Share Post',   desc: 'Post an update to your feed',  color: '#ec4899', href: '/create' },
  { id: 'calendar',  emoji: '📅', label: 'Calendar',     desc: 'View your schedule',           color: '#6366f1', href: '/engines/create/calendar' },
  { id: 'media',     emoji: '🖼️', label: 'Media',        desc: 'Attach photos or videos',      color: '#8b5cf6', href: '/daydream/media-vault' },
  { id: 'connectors',emoji: '🔌', label: 'Connectors',   desc: 'Link your tools',              color: '#c8981a', href: '/connectors' },
];

export const metadata = { title: 'Create – Dreamengin', description: 'Ideas, tasks, calendar, projects, and media.' };

const ACCENT = '#fb923c';

export default async function CreateDaydreamPage() {
  await connection();
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
        subtitle="Editor · multi-platform scheduler · AI optimizer · analytics."
        icon={<PlusCircle className="w-4 h-4" />}
        accentColor="#fb923c"
        badge="Create Daydream · 2026 Edition"
      />

      <div className="de-auth-content space-y-4">
        <div style={{ padding: '12px 16px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(245,158,11,0.08) 100%)', border: '1px solid rgba(251,146,60,0.18)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '2px 8px', borderRadius: 9999, background: 'linear-gradient(135deg, rgba(251,146,60,0.15) 0%, rgba(245,158,11,0.15) 100%)', border: '1px solid rgba(251,146,60,0.25)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fb923c' }}>Content 2026 · Rich Text · Multi-Platform · AI Optimizer</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--de-text-dim)', margin: 0 }}>Set up your content here on Side A. Open ContentEngin (Side B) to write, schedule, and publish.</p>
        </div>

        {WIDGETS.map(({ emoji, label, desc, color, href }) => (
          <div key={label} className="de-widget">
            <div className="de-widget-header">
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {emoji}
                </div>
                <span className="de-widget-title">{label}</span>
              </div>
            </div>
            <div className="de-widget-body">
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', margin: 0 }}>{desc}</p>
              {href && (
                <Link href={href} style={{ marginTop: 8, display: 'inline-block', fontSize: 12, fontWeight: 600, color }}>Open →</Link>
              )}
            </div>
          </div>
        ))}

        {/* ── Open ContentEngin CTA ── */}
        <div className="de-widget" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(251,191,36,0.04))' }}>
          <div className="de-widget-header">
            <Sparkles className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Ready to Create?</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10, lineHeight: 1.6 }}>
              Open <strong>ContentEngin (Side B)</strong> for the full creation suite — draft composer, content calendar, publishing queue, and more.
            </p>
          </div>
          <div className="de-widget-actions">
            <Link href="/engines/create" className="de-btn de-btn-ghost text-xs">Open Full ContentEngin</Link>
            <OpenDaydreamSideBButton label="Open ContentEngin →" />
          </div>
        </div>

      </div>
    </div>
    </DaydreamShell>
  );
}

