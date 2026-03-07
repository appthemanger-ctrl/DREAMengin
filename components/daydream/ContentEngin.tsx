'use client';

/**
 * ContentEngin — Side B control layer for the Create Daydream.
 *
 * Responsibilities (README spec §13.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - Recent Drafts: fetch latest 5 rows from the `notes` table.
 *   - Publishing Queue: placeholder for future scheduled-post support.
 *   - Content Calendar: link to /daydream/create.
 *   - Templates: placeholder for future template library.
 *
 * Notes on the `notes` table: the current schema (20260305000000_create_notes.sql)
 * is a minimal bootstrap — it stores id and title only with no user ownership column.
 * The component fetches the newest entries by id and shows them as draft seeds;
 * this will automatically improve once the notes schema gains a user_id column.
 *
 * Follows AXIOM 3 (every element enables real action) and LAW.md §3 (no fake buttons).
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, FileText, CalendarDays, LayoutTemplate, Send } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface Note {
  id: number;
  title: string;
}

const ACCENT = '#f59e0b';

export default function ContentEngin({ onBack }: Props) {
  const [notes, setNotes]   = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    // notes table: id (serial), title (text) — no user filter available yet.
    supabase
      .from('notes')
      .select('id, title')
      .order('id', { ascending: false })
      .limit(5)
      .then((res: Awaited<ReturnType<ReturnType<typeof createClient>['from']>['select']>) => {
        if (!cancelled) {
          setNotes((res.data as Note[] | null) ?? []);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

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
            aria-label="Back to Create"
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
              ContentEngin
            </div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Create · Control Layer</div>
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

        {/* Recent Drafts */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Recent Drafts</span>
          </div>

          <div className="de-widget-body">
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                Loading drafts…
              </p>
            ) : notes.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                <FileText className="w-6 h-6 flex-shrink-0" style={{ color: ACCENT, opacity: 0.3 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                    No drafts yet
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                    Open the Create Daydream to start writing.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notes.map(note => (
                  <div
                    key={note.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(160,195,240,0.18)',
                    }}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT, opacity: 0.7 }} />
                    <span
                      style={{
                        flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                      }}
                    >
                      {note.title}
                    </span>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
                        padding: '2px 8px', borderRadius: 999,
                        background: 'rgba(160,195,240,0.18)', color: 'var(--de-text-dim)',
                        border: '1px solid rgba(160,195,240,0.25)',
                      }}
                    >
                      Draft
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Publishing Queue */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Publishing Queue</span>
          </div>

          <div className="de-widget-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${ACCENT}12`,
                  border: `1px solid ${ACCENT}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Send className="w-4 h-4" style={{ color: ACCENT, opacity: 0.8 }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                  Queue is empty
                </div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.4 }}>
                  Schedule posts and they will appear here before publishing.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Calendar */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Content Calendar</span>
          </div>

          <div className="de-widget-body">
            <Link
              href="/daydream/create"
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
                  <CalendarDays className="w-4 h-4" style={{ color: ACCENT }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                    Open Create Daydream
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                    Manage your calendar and scheduled content
                  </div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--de-text-dim)' }}>→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Templates */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Templates</span>
          </div>

          <div className="de-widget-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${ACCENT}12`,
                  border: `1px solid ${ACCENT}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <LayoutTemplate className="w-4 h-4" style={{ color: ACCENT, opacity: 0.7 }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                  No templates yet
                </div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.4 }}>
                  Save a content structure as a template to reuse it.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
