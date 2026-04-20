'use client';

/**
 * QueuePanel — Publishing queue for the Content Engine app.
 *
 * Manage scheduled items, publish immediately, or remove from queue.
 * Lives at /engines/create/queue.
 */

import { useState } from 'react';
import { Send, Trash2, Clock, CheckCircle, Loader2, Plus, AlertCircle } from 'lucide-react';

type ContentType = 'Post' | 'Video' | 'Story' | 'Thread';
type ItemStatus = 'scheduled' | 'publishing' | 'published' | 'failed';

interface QueueItem {
  id: string;
  type: ContentType;
  title: string;
  preview: string;
  scheduledAt: string | null;
  status: ItemStatus;
}

const TYPE_COLORS: Record<ContentType, string> = {
  Post:   '#fb923c',
  Video:  '#a855f7',
  Story:  '#22d3ee',
  Thread: '#10b981',
};

const INIT_ITEMS: QueueItem[] = [
  { id: '1', type: 'Post',   title: 'New drop announcement', preview: 'Just dropped something big 🔥…', scheduledAt: new Date(Date.now() + 3600000).toISOString(), status: 'scheduled' },
  { id: '2', type: 'Video',  title: 'Tutorial: Getting started', preview: "HOOK: Here's what most people get wrong…", scheduledAt: new Date(Date.now() + 86400000).toISOString(), status: 'scheduled' },
  { id: '3', type: 'Thread', title: 'Industry insights', preview: '1/ A thread on the future of…', scheduledAt: null, status: 'scheduled' },
];

export default function QueuePanel() {
  const [items, setItems] = useState<QueueItem[]>(INIT_ITEMS);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ContentType>('Post');
  const [showAdd, setShowAdd] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);

  async function publishItem(id: string) {
    setPublishing(id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'publishing' } : i));
    try {
      const item = items.find((i) => i.id === id)!;
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: item.preview, content_type: item.type.toLowerCase() }),
      });
      if (!res.ok) throw new Error('Publish failed');
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'published' } : i));
    } catch {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'failed' } : i));
    }
    setPublishing(null);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function addItem() {
    if (!newTitle.trim()) return;
    setItems((prev) => [...prev, {
      id: Date.now().toString(),
      type: newType,
      title: newTitle.trim(),
      preview: `${newTitle.trim()}…`,
      scheduledAt: null,
      status: 'scheduled',
    }]);
    setNewTitle('');
    setShowAdd(false);
  }

  const formatScheduled = (iso: string | null) => {
    if (!iso) return 'Now';
    const d = new Date(iso);
    const diff = d.getTime() - Date.now();
    if (diff < 0) return 'Overdue';
    if (diff < 3600000) return `${Math.ceil(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.ceil(diff / 3600000)}h`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Publishing Queue</h1>
            <p className="text-sm text-white/50">{items.filter((i) => i.status === 'scheduled').length} items scheduled</p>
          </div>
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fb923c]/20 hover:bg-[#fb923c]/30 text-[#fb923c] text-xs font-medium transition-all"
          >
            <Plus size={13} />
            Add
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="mb-5 flex gap-2 flex-wrap p-3 rounded-xl bg-white/[0.04] border border-[#fb923c]/20">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as ContentType)}
              className="px-2.5 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
            >
              {(['Post', 'Video', 'Story', 'Thread'] as ContentType[]).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Content title"
              className="flex-1 min-w-[120px] px-2.5 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#fb923c]/50"
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
            />
            <button
              onClick={addItem}
              disabled={!newTitle.trim()}
              className="px-3 py-1.5 rounded-lg bg-[#fb923c] hover:bg-[#f97316] text-black text-sm font-bold transition-colors disabled:opacity-40"
            >
              Add
            </button>
          </div>
        )}

        {/* Queue */}
        <div className="space-y-2">
          {items.map((item) => {
            const accent = TYPE_COLORS[item.type];
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border transition-all"
                style={{
                  borderColor: item.status === 'publishing'
                    ? `${accent}55`
                    : item.status === 'published'
                    ? '#10b98133'
                    : item.status === 'failed'
                    ? '#ef444433'
                    : 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="w-1.5 h-full min-h-[40px] rounded-full flex-shrink-0 mt-1"
                  style={{ background: accent }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: accent }}>{item.type}</span>
                    <span className="text-sm font-semibold text-white truncate">{item.title}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 truncate">{item.preview}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {item.status === 'published' ? (
                      <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={11} />Published</span>
                    ) : item.status === 'failed' ? (
                      <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle size={11} />Failed</span>
                    ) : item.status === 'publishing' ? (
                      <span className="flex items-center gap-1 text-xs text-[#fb923c]"><Loader2 size={11} className="animate-spin" />Publishing…</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-white/30"><Clock size={11} />{formatScheduled(item.scheduledAt)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                  {(item.status === 'scheduled' || item.status === 'failed') && (
                    <button
                      onClick={() => publishItem(item.id)}
                      disabled={!!publishing}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: `${accent}20`, color: accent }}
                    >
                      <Send size={11} />
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm">
            <Send size={32} className="mx-auto mb-3 opacity-30" />
            Queue is empty — add content above.
          </div>
        )}
      </div>
    </div>
  );
}
