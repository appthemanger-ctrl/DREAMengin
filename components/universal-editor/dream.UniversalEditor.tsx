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

function safeMediaSource(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return url.toString();
    if (url.protocol === 'blob:' && typeof window !== 'undefined') {
      return url.origin === window.location.origin ? url.toString() : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function UniversalEditor({ target, onSaved }: UniversalEditorProps) {
  const [content, setContent] = useState(target.content);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const mediaSrc = useMemo(() => safeMediaSource(content), [content]);
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
        mediaSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaSrc} alt={target.filename ?? 'Dropped image'} className="mb-3 max-h-64 w-full rounded-[18px] object-contain" />
        ) : (
          <p className="mb-3 rounded-[18px] border border-red-300/30 bg-red-950/30 p-3 text-sm text-red-200">
            Unsafe image URL blocked. Use https or local blob media.
          </p>
        )
      ) : target.type === 'video' ? (
        mediaSrc ? (
          <video src={mediaSrc} controls className="mb-3 max-h-64 w-full rounded-[18px]" />
        ) : (
          <p className="mb-3 rounded-[18px] border border-red-300/30 bg-red-950/30 p-3 text-sm text-red-200">
            Unsafe video URL blocked. Use https or local blob media.
          </p>
        )
      ) : target.type === 'audio' ? (
        mediaSrc ? (
          <audio src={mediaSrc} controls className="mb-3 w-full" />
        ) : (
          <p className="mb-3 rounded-[18px] border border-red-300/30 bg-red-950/30 p-3 text-sm text-red-200">
            Unsafe audio URL blocked. Use https or local blob media.
          </p>
        )
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
