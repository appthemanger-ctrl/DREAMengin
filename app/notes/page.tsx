import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Notes – Dreamengin', description: 'Your personal notes and ideas.' };

type Note = { id: number; title: string | null };

export default async function NotesPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: notes } = await supabase
    .from('notes')
    .select('id, title')
    .order('id', { ascending: false });

  const noteList: Note[] = notes ?? [];

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/daydream/create" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <FileText className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Notes</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Your Notes</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)' }}>
              {noteList.length} notes
            </span>
          </div>
          {noteList.length > 0 ? (
            <div className="de-widget-body" style={{ padding: '4px 6px' }}>
              {noteList.map((note) => (
                <div key={note.id} className="de-row" style={{ borderRadius: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(42,138,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--de-heading)' }}>
                      {note.title || `Note #${note.id}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="de-widget-body flex flex-col items-center py-8 gap-3">
              <FileText className="w-10 h-10 opacity-20" style={{ color: 'var(--de-accent)' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--de-heading)' }}>No notes yet</p>
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
                Use the Create Daydream to capture ideas, tasks, and notes.
              </p>
            </div>
          )}
          <div className="de-widget-actions">
            <Link href="/daydream/create" className="de-btn de-btn-primary text-xs" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus className="w-3 h-3" /> New Note
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
