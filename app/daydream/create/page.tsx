import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lightbulb, CheckSquare, Calendar, FolderKanban, ImageIcon, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create – DREAMengin', description: 'Ideas, tasks, calendar, projects, and media.' };

export default async function CreateDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const widgets = [
    { icon: Lightbulb,    label: 'Ideas',        desc: 'Capture ideas before they slip away.',      color: '#f59e0b' },
    { icon: CheckSquare,  label: 'Tasks',         desc: 'Your to-dos, prioritised and trackable.',   color: '#10b981' },
    { icon: Calendar,     label: 'Calendar',      desc: 'Schedule, plan, and review your timeline.', color: '#6366f1' },
    { icon: FolderKanban, label: 'Projects',      desc: 'Kanban boards for active projects.',        color: '#0ea5e9' },
    { icon: ImageIcon,    label: 'Media Library', desc: 'Browse and attach media to your work.',     color: '#ec4899' },
  ];

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <PlusCircle className="w-5 h-5" style={{ color: '#6366f1' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Create</h1>
          <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>Daydream</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>Everything you make lives here as widgets—not pages.</p>

        {widgets.map(({ icon: Icon, label, desc, color }) => (
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
              <button type="button" className="de-btn de-btn-ghost text-xs">+ Add {label.slice(0, -1) || label}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
