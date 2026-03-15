'use client';

/**
 * ContentEngin — Side B control layer for the Create Daydream.
 *
 * Responsibilities (README spec §13.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - Recent Drafts: fetch latest 5 rows from the `notes` table.
 *   - Content Calendar: 7-day scheduler with inline add forms.
 *   - Publishing Queue: manage and publish/remove scheduled items via POST /api/posts.
 *   - Smart Draft Generator: template-based draft text + save to POST /api/drafts.
 *   - Cross-Platform Targets: toggle + broadcast via dualRuntimeBridge.
 *
 * Follows AXIOM 3 (every element enables real action) and LAW.md §3 (no fake buttons).
 *
 * ACTION_AUDIT.md alignment:
 *   - publishItem now calls POST /api/posts (was fake-wired: local state only).
 *   - saveDraft now calls POST /api/drafts (was fake-wired: no /api/drafts route).
 *   - scheduled_at is passed to /api/drafts so schedule posts persist server-side.
 */

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, FileText } from 'lucide-react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';

interface Props {
  onBack: () => void;
}

interface Note {
  id: number;
  title: string;
}

interface CalendarItem {
  id: string;
  type: 'Post' | 'Video' | 'Story' | 'Thread';
  title: string;
  /** ISO datetime string — set when the item is scheduled for future publish */
  scheduled_at?: string;
}

/** Maps CalendarItem.type to the content_type enum used by /api/posts and /api/drafts */
const TYPE_TO_CONTENT_TYPE: Record<CalendarItem['type'], string> = {
  Post: 'post',
  Video: 'video',
  Story: 'story',
  Thread: 'thread',
};

const ACCENT = '#f59e0b';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TYPE_EMOJI: Record<CalendarItem['type'], string> = {
  Post: '📝', Video: '🎬', Story: '✨', Thread: '🧵',
};
const CONTENT_TYPES: CalendarItem['type'][] = ['Post', 'Video', 'Story', 'Thread'];
const PLATFORMS = ['Feed', 'Stories', 'DreamDM', 'Twitter', 'Instagram', 'TikTok'];
const DRAFT_TYPES = ['Caption', 'Tweet Thread', 'Short Bio', 'Video Script'] as const;
type DraftType = typeof DRAFT_TYPES[number];

function generateDraft(type: DraftType, topic: string): string {
  const t = topic || 'your topic';
  switch (type) {
    case 'Caption':
      return `✨ ${t} — making it happen. Drop a 🔥 below!\n#${t.replace(/\s+/g, '').substring(0, 20)} #DREAMengin #Create`;
    case 'Tweet Thread':
      return `1/ ${t} — a thread 🧵\n\n2/ Key insight: [your main point]\n\n3/ Why it matters: [impact]\n\n4/ How to start: [first step]\n\n5/ Bottom line: Follow for more ${t} content 🔁`;
    case 'Short Bio':
      return `${t} creator | Making ${t} accessible for everyone | Building in public on DREAMengin ✨`;
    case 'Video Script':
      return `[Hook] ${t} will change everything.\n\n[Problem] Most people struggle with [current pain point].\n\n[Solution] Here's how ${t} solves it: [explain]\n\n[CTA] Follow for more ${t} content!`;
  }
}

const btnBase: React.CSSProperties = {
  border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
  fontSize: 12, padding: '5px 12px', transition: 'opacity 0.12s',
};

export default function ContentEngin({ onBack }: Props) {
  // ── Existing: Recent Drafts ──
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
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

  // ── Content Calendar ──
  const [calendarItems, setCalendarItems] = useState<Record<string, CalendarItem[]>>(
    () => Object.fromEntries(DAYS.map(d => [d, []]))
  );
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [formType, setFormType] = useState<CalendarItem['type']>('Post');
  const [formTitle, setFormTitle] = useState('');
  /** ISO datetime for scheduled publish — empty string means "publish immediately" */
  const [formScheduledAt, setFormScheduledAt] = useState('');

  function addCalendarItem(day: string) {
    if (!formTitle.trim()) return;
    const item: CalendarItem = {
      id: `${Date.now()}-${Math.random()}`,
      type: formType,
      title: formTitle.trim(),
      scheduled_at: formScheduledAt || undefined,
    };
    setCalendarItems(prev => ({ ...prev, [day]: [...prev[day], item] }));
    setFormTitle('');
    setFormScheduledAt('');
    setOpenDay(null);
  }

  function removeCalendarItem(day: string, id: string) {
    setCalendarItems(prev => ({ ...prev, [day]: prev[day].filter(i => i.id !== id) }));
  }

  // ── Publishing Queue ──
  const [publishedCount, setPublishedCount] = useState(0);
  const [publishMsg, setPublishMsg] = useState('');
  const publishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allQueued: Array<CalendarItem & { day: string }> = DAYS.flatMap(day =>
    calendarItems[day].map(item => ({ ...item, day }))
  );

  /**
   * publishItem — POST the queued item to /api/posts (real effect, not local state only).
   *
   * If the item has a scheduled_at value, it is first saved as a draft via POST /api/drafts
   * so the schedule persists server-side; it is then removed from the local queue.
   *
   * If no scheduled_at, it publishes immediately to /api/posts.
   *
   * LAW.md §3 — every visible action must do something real.
   */
  async function publishItem(day: string, id: string) {
    const item = calendarItems[day]?.find(i => i.id === id);
    if (!item) return;

    try {
      if (item.scheduled_at) {
        // Save as a scheduled draft — persists server-side
        const res = await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: item.title,
            content_type: TYPE_TO_CONTENT_TYPE[item.type],
            title: `${item.type}: ${item.title}`,
            scheduled_at: item.scheduled_at,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error((err as { error?: string }).error ?? 'Failed to schedule draft');
        }
      } else {
        // Publish immediately to the feed
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: item.title,
            visibility: 'public',
            media_urls: [],
            content_type: TYPE_TO_CONTENT_TYPE[item.type],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error((err as { error?: string }).error ?? 'Failed to publish');
        }
      }

      removeCalendarItem(day, id);
      setPublishedCount(c => c + 1);
      const action = item.scheduled_at ? 'Scheduled' : 'Published';
      setPublishMsg(`✅ ${action}: ${item.title}`);
    } catch (err) {
      setPublishMsg(`⚠️ ${err instanceof Error ? err.message : 'Publish failed'}`);
    }

    if (publishTimerRef.current) clearTimeout(publishTimerRef.current);
    publishTimerRef.current = setTimeout(() => setPublishMsg(''), 4000);
  }

  // ── Smart Draft Generator ──
  const [draftType, setDraftType] = useState<DraftType>('Caption');
  const [draftTopic, setDraftTopic] = useState('');
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  /** Schedule datetime for the draft — empty = no schedule */
  const [draftScheduledAt, setDraftScheduledAt] = useState('');
  const [draftSaveMsg, setDraftSaveMsg] = useState('');
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silently ignore */ }
  }

  /**
   * saveDraft — POST the generated draft text to /api/drafts (real effect).
   * Maps DraftType → content_type used by /api/drafts.
   * Includes scheduled_at when the user has set a schedule datetime.
   *
   * LAW.md §3 — every visible action must do something real.
   * ACTION_AUDIT.md — was labelled 🟡 fake-wired (no backend scheduler confirmed).
   */
  const DRAFT_TYPE_TO_CONTENT_TYPE: Record<DraftType, string> = {
    'Caption': 'caption',
    'Tweet Thread': 'tweet_thread',
    'Short Bio': 'bio',
    'Video Script': 'script',
  };

  async function saveDraft() {
    if (!draft.trim()) return;
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: draft.trim(),
          content_type: DRAFT_TYPE_TO_CONTENT_TYPE[draftType],
          title: draftTopic ? `${draftType}: ${draftTopic}` : draftType,
          scheduled_at: draftScheduledAt || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error((err as { error?: string }).error ?? 'Failed to save draft');
      }
      setDraftSaveMsg(draftScheduledAt ? '✅ Draft scheduled!' : '✅ Draft saved!');
    } catch (err) {
      setDraftSaveMsg(`⚠️ ${err instanceof Error ? err.message : 'Save failed'}`);
    }
    if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = setTimeout(() => setDraftSaveMsg(''), 4000);
  }

  // ── Cross-Platform Targets ──
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [broadcastMsg, setBroadcastMsg] = useState('');

  function togglePlatform(p: string) {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  }

  function broadcast() {
    if (selectedPlatforms.size === 0) return;
    bridge.emit('create', 'create:published', {
      contentId: 'draft-' + Date.now(),
      platform: [...selectedPlatforms].join(','),
    });
    setBroadcastMsg(`Broadcast sent to ${selectedPlatforms.size} platform${selectedPlatforms.size > 1 ? 's' : ''}`);
    setTimeout(() => setBroadcastMsg(''), 3000);
  }

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
          <div style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENT}, rgba(200,152,26,0.8))`,
          }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>ContentEngin</div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Create · Control Layer</div>
          </div>
          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
          >Side B</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>

        {/* ── Recent Drafts ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Recent Drafts</span>
          </div>
          <div className="de-widget-body">
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>Loading drafts…</p>
            ) : notes.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                <FileText className="w-6 h-6 flex-shrink-0" style={{ color: ACCENT, opacity: 0.3 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>No drafts yet</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Open the Create Daydream to start writing.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notes.map(note => (
                  <div key={note.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(160,195,240,0.18)',
                  }}>
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT, opacity: 0.7 }} />
                    <span style={{
                      flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                    }}>{note.title}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
                      padding: '2px 8px', borderRadius: 999,
                      background: 'rgba(160,195,240,0.18)', color: 'var(--de-text-dim)',
                      border: '1px solid rgba(160,195,240,0.25)',
                    }}>Draft</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Content Calendar ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Content Calendar</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {DAYS.map(day => (
                <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)' }}>{day}</span>
                  <div style={{
                    width: '100%', minHeight: 48, borderRadius: 8,
                    background: 'rgba(255,255,255,0.45)',
                    border: `1px solid rgba(160,195,240,0.2)`,
                    padding: '4px 3px',
                    display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center',
                  }}>
                    {calendarItems[day].map(item => (
                      <span
                        key={item.id}
                        title={item.title}
                        style={{
                          fontSize: 10, fontWeight: 600,
                          background: `${ACCENT}20`, color: 'var(--de-heading)',
                          borderRadius: 4, padding: '1px 4px',
                          maxWidth: '100%', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          cursor: 'default', width: '100%', textAlign: 'center',
                        }}
                      >
                        {TYPE_EMOJI[item.type]}{item.title.length > 6 ? item.title.substring(0, 6) + '…' : item.title}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setOpenDay(openDay === day ? null : day); setFormTitle(''); setFormType('Post'); }}
                      style={{
                        ...btnBase,
                        padding: '1px 6px', fontSize: 14, borderRadius: 6,
                        background: `${ACCENT}15`, color: ACCENT, marginTop: 'auto',
                      }}
                      aria-label={`Add to ${day}`}
                    >+</button>
                  </div>
                  {/* Inline mini-form */}
                  {openDay === day && (
                    <div style={{
                      position: 'absolute', zIndex: 50,
                      background: 'rgba(230,240,255,0.97)',
                      border: `1px solid ${ACCENT}40`,
                      borderRadius: 10, padding: '10px 12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      display: 'flex', flexDirection: 'column', gap: 7,
                      minWidth: 180,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{day} — Add Item</div>
                      <select
                        value={formType}
                        onChange={e => setFormType(e.target.value as CalendarItem['type'])}
                        style={{ fontSize: 12, borderRadius: 6, padding: '3px 6px', border: `1px solid ${ACCENT}40`, background: 'white' }}
                      >
                        {CONTENT_TYPES.map(t => <option key={t} value={t}>{TYPE_EMOJI[t]} {t}</option>)}
                      </select>
                      <input
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        placeholder="Title…"
                        style={{ fontSize: 12, borderRadius: 6, padding: '4px 8px', border: `1px solid rgba(160,195,240,0.4)`, background: 'white' }}
                       onKeyDown={e => { if (e.key === 'Enter') addCalendarItem(day); }}
                      />
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 3 }}>Schedule (optional)</label>
                        <input
                          type="datetime-local"
                          value={formScheduledAt}
                          onChange={e => setFormScheduledAt(e.target.value)}
                          style={{ fontSize: 12, borderRadius: 6, padding: '4px 8px', border: `1px solid rgba(160,195,240,0.4)`, background: 'white', width: '100%' }}
                        />
                      </div>
                       <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" onClick={() => addCalendarItem(day)} style={{ ...btnBase, background: ACCENT, color: 'white', flex: 1 }}>Add</button>
                        <button type="button" onClick={() => setOpenDay(null)} style={{ ...btnBase, background: 'rgba(160,195,240,0.2)', color: 'var(--de-text-dim)', flex: 1 }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Publishing Queue ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Publishing Queue</span>
            {publishedCount > 0 && (
              <span style={{
                marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                background: `${ACCENT}20`, color: ACCENT,
                borderRadius: 999, padding: '2px 10px',
              }}>✅ {publishedCount} published</span>
            )}
          </div>
          <div className="de-widget-body">
            {publishMsg && (
              <div style={{ fontSize: 12, fontWeight: 600, color: publishMsg.startsWith('⚠️') ? '#ef4444' : '#16a34a', marginBottom: 8 }}>{publishMsg}</div>
            )}
            {allQueued.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                No items queued. Use the Content Calendar above to schedule content.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allQueued.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(160,195,240,0.18)',
                  }}>
                    <span style={{ fontSize: 16 }}>{TYPE_EMOJI[item.type]}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                    {item.scheduled_at && (
                      <span style={{ fontSize: 10, color: '#6366f1', background: 'rgba(99,102,241,0.1)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>🗓</span>
                    )}
                    <span style={{ fontSize: 10, color: 'var(--de-text-dim)', flexShrink: 0, marginRight: 6 }}>{item.day}</span>
                    <button type="button" onClick={() => publishItem(item.day, item.id)} style={{ ...btnBase, background: ACCENT, color: 'white' }}>{item.scheduled_at ? 'Schedule' : 'Publish Now'}</button>
                    <button type="button" onClick={() => removeCalendarItem(item.day, item.id)} style={{ ...btnBase, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Smart Draft Generator ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Smart Draft Generator</span>
          </div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Draft Type</label>
                <select
                  value={draftType}
                  onChange={e => setDraftType(e.target.value as DraftType)}
                  style={{ width: '100%', fontSize: 13, borderRadius: 8, padding: '6px 10px', border: `1px solid rgba(160,195,240,0.35)`, background: 'rgba(255,255,255,0.7)' }}
                >
                  {DRAFT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Topic</label>
                <input
                  value={draftTopic}
                  onChange={e => setDraftTopic(e.target.value)}
                  placeholder="e.g. photography, fitness…"
                  style={{ width: '100%', fontSize: 13, borderRadius: 8, padding: '6px 10px', border: `1px solid rgba(160,195,240,0.35)`, background: 'rgba(255,255,255,0.7)' }}
                />
              </div>
            </div>
            <div className="de-widget-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setDraft(generateDraft(draftType, draftTopic))}
                style={{ ...btnBase, background: ACCENT, color: 'white', padding: '7px 18px', fontSize: 13 }}
              >Generate Draft</button>
              {draft && (
                <button
                  type="button"
                  onClick={copyDraft}
                  style={{ ...btnBase, background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(160,195,240,0.2)', color: copied ? '#16a34a' : 'var(--de-heading)', padding: '7px 18px', fontSize: 13 }}
                >{copied ? '✅ Copied!' : 'Copy to Clipboard'}</button>
              )}
              {draft && (
                <button
                  type="button"
                  onClick={saveDraft}
                  style={{ ...btnBase, background: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)', padding: '7px 18px', fontSize: 13 }}
                >💾 Save Draft</button>
              )}
            </div>
            {draft && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Schedule publish (optional)</label>
                  <input
                    type="datetime-local"
                    value={draftScheduledAt}
                    onChange={e => setDraftScheduledAt(e.target.value)}
                    style={{ fontSize: 12, borderRadius: 8, padding: '5px 10px', border: `1px solid rgba(160,195,240,0.35)`, background: 'rgba(255,255,255,0.7)', width: '100%' }}
                  />
                </div>
                {draftSaveMsg && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: draftSaveMsg.startsWith('⚠️') ? '#ef4444' : '#16a34a' }}>{draftSaveMsg}</span>
                )}
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={6}
                  style={{
                    width: '100%', borderRadius: 10, padding: '10px 12px', fontSize: 13,
                    border: `1px solid rgba(160,195,240,0.35)`,
                    background: 'rgba(255,255,255,0.65)',
                    color: 'var(--de-heading)', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.55,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Cross-Platform Targets ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Cross-Platform Targets</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--de-text-dim)' }}>
              {selectedPlatforms.size} platform{selectedPlatforms.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PLATFORMS.map(p => {
                const active = selectedPlatforms.has(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    style={{
                      ...btnBase,
                      padding: '6px 14px', fontSize: 13,
                      background: active ? `${ACCENT}22` : 'rgba(160,195,240,0.15)',
                      color: active ? ACCENT : 'var(--de-text-dim)',
                      border: `1.5px solid ${active ? ACCENT : 'rgba(160,195,240,0.25)'}`,
                    }}
                  >{p}</button>
                );
              })}
            </div>
            <div className="de-widget-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={broadcast}
                disabled={selectedPlatforms.size === 0}
                style={{
                  ...btnBase,
                  background: selectedPlatforms.size > 0 ? ACCENT : 'rgba(160,195,240,0.2)',
                  color: selectedPlatforms.size > 0 ? 'white' : 'var(--de-text-dim)',
                  padding: '7px 20px', fontSize: 13,
                  opacity: selectedPlatforms.size === 0 ? 0.5 : 1,
                  cursor: selectedPlatforms.size === 0 ? 'not-allowed' : 'pointer',
                }}
              >Broadcast</button>
              {broadcastMsg && (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>{broadcastMsg}</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
