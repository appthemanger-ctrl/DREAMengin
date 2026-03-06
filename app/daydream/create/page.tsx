import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lightbulb, CheckSquare, Calendar, FolderKanban, ImageIcon, PlusCircle } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';

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
export const metadata = { title: 'Create – DREAMengin', description: 'Ideas, tasks, calendar, projects, and media.' };

export default async function CreateDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const widgets = [
    { icon: Lightbulb,    label: 'Ideas',        singular: 'Idea',         desc: 'Capture ideas before they slip away.',      color: '#f59e0b' },
    { icon: CheckSquare,  label: 'Tasks',        singular: 'Task',         desc: 'Your to-dos, prioritised and trackable.',   color: '#10b981' },
    { icon: Calendar,     label: 'Calendar',     singular: 'Event',        desc: 'Schedule, plan, and review your timeline.', color: '#6366f1' },
    { icon: FolderKanban, label: 'Projects',     singular: 'Project',      desc: 'Kanban boards for active projects.',        color: '#0ea5e9' },
    { icon: ImageIcon,    label: 'Media Library',singular: 'Media Item',   desc: 'Browse and attach media to your work.',     color: '#ec4899' },
  ];

  return (
    <DaydreamShell
      title="Create"
      accentColor="#f59e0b"
      widgets={WIDGETS}
    >
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/daydream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1 }}>dreamengin</div>
            <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
              <PlusCircle className="w-4 h-4" style={{ color: '#6366f1' }} />
              <h1 className="text-base font-bold" style={{ color: 'var(--de-heading)' }}>Create</h1>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>Daydream</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>Everything you make lives here as widgets—not pages.</p>

        {widgets.map(({ icon: Icon, label, singular, desc, color }) => (
          <div key={label} className="de-widget">
            <div className="de-widget-header">
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="de-widget-title">{label}</span>
              </div>
            </div>
            <div className="de-widget-body">
              <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>{desc}</p>
              <div className="mt-3 flex items-center justify-center py-4" style={{ color: 'var(--de-text-dim)', fontSize: 12 }}>
                No {label.toLowerCase()} yet
              </div>
            </div>
            <div className="de-widget-actions">
              <button type="button" className="de-btn de-btn-ghost text-xs">+ Add {singular}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </DaydreamShell>
  );
}
