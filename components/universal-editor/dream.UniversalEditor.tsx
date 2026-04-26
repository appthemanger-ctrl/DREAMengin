'use client';

import { useMemo, useState } from 'react';
import { classifyDrop, type DreamDrop } from '@/lib/runtime/coercionTable';

export interface UniversalEditorProps {
  target: DreamDrop;
  onSaved?: (draftId: string) => void;
}

function titleFor(target: DreamDrop): string {
  const label = classifyDrop(target);
  return `${label} draft${target.filename ? ` · ${target.filename}` : ''}`;
}

export function UniversalEditor({ target, onSaved }: UniversalEditorProps) {
  const [content, setContent] = useState(target.content);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const preview = useMemo(() => {
    if (target.type !== 'engin-state') return content;
    try {
      return JSON.stringify(JSON.parse(content || '{}'), null, 2);
    } catch {
      return content;
    }
  }, [content, target.type]);

  async function saveDraft() {
    setStatus('saving');
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleFor(target),
          content,
          content_type: target.type === 'video' ? 'video' : target.type === 'audio' ? 'script' : 'post',
        }),
      });
      if (!res.ok) throw new Error('save failed');
      const json = await res.json();
      setStatus('saved');
      onSaved?.(json.draft?.id ?? '');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="rounded-[24px] border border-white/10 bg-black/50 p-4 text-white shadow-2xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-de-gold">Universal Editor</p>
          <h2 className="text-lg font-bold">{titleFor(target)}</h2>
        </div>
        <span className="rounded-full border border-de-gold/40 px-3 py-1 text-xs text-de-gold">{target.type}</span>
      </div>

      {target.type === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={content} alt={target.filename ?? 'Dropped image'} className="mb-3 max-h-64 w-full rounded-[18px] object-contain" />
      ) : target.type === 'video' ? (
        <video src={content} controls className="mb-3 max-h-64 w-full rounded-[18px]" />
      ) : target.type === 'audio' ? (
        <audio src={content} controls className="mb-3 w-full" />
      ) : (
        <textarea
          value={preview}
          onChange={(e) => setContent(e.target.value)}
          className="mb-3 min-h-48 w-full rounded-[18px] border border-white/10 bg-white/5 p-3 font-mono text-sm outline-none focus:border-de-gold/60"
        />
      )}

      {(target.type === 'url' || target.type === 'image' || target.type === 'video' || target.type === 'audio') && (
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mb-3 w-full rounded-[14px] border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-de-gold/60"
          aria-label="Dropped content URL"
        />
      )}

      <button
        type="button"
        onClick={saveDraft}
        disabled={status === 'saving'}
        className="rounded-full bg-de-gold px-4 py-2 text-sm font-bold text-black disabled:opacity-60"
      >
        {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Save private draft'}
      </button>
      {status === 'error' && <p className="mt-2 text-xs text-red-300">Could not save draft.</p>}
    </section>
  );
}
