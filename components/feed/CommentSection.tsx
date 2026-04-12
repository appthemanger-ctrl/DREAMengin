'use client';

const COMMENT_MAX_LENGTH = 300;

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { MessageCircle, Loader2, AlertCircle, Send } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface CommentProfile {
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: CommentProfile | null;
  optimistic?: boolean;
}

interface Props {
  postId: string;
}

function Avatar({ profile, size = 32 }: { profile: CommentProfile | null; size?: number }) {
  const initials = (profile?.display_name || profile?.handle || '?')[0].toUpperCase();

  if (profile?.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt={profile.display_name || profile.handle || 'User'}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, rgba(42,138,184,0.25), rgba(200,152,26,0.18))',
        border: '1.5px solid rgba(42,138,184,0.3)',
        color: 'var(--de-accent)',
      }}
    >
      {initials}
    </div>
  );
}

export default function CommentSection({ postId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Skip fetching for demo posts
  const isDemo = postId.startsWith('demo-');

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();

    fetch(`/api/comments?post_id=${encodeURIComponent(postId)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then(({ data, error: err }) => {
        if (err) {
          setError(err);
        } else {
          setComments(data ?? []);
        }
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError('Failed to load comments');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [postId, isDemo]);

  const handleDelete = async (commentId: string) => {
    // Optimistic remove
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      const res = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId }),
      });
      if (!res.ok) {
        // Reload comments if delete failed
        const r = await fetch(`/api/comments?post_id=${encodeURIComponent(postId)}`);
        const { data } = await r.json();
        if (data) setComments(data);
      }
    } catch {
      // Reload to restore state
      fetch(`/api/comments?post_id=${encodeURIComponent(postId)}`)
        .then(r => r.json())
        .then(({ data }) => { if (data) setComments(data); })
        .catch(() => {});
    }
  };

  const handleSubmit = async () => {
    const text = draft.trim();
    if (!text || submitting) return;

    setSubmitError(null);
    setSubmitting(true);

    // Optimistic insertion — comment appears instantly
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: Comment = {
      id: optimisticId,
      post_id: postId,
      user_id: '',
      content: text,
      created_at: new Date().toISOString(),
      profile: null,
      optimistic: true,
    };
    setComments(prev => [...prev, optimistic]);
    setDraft('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content: text }),
      });

      // Parse body once — needed whether success or error
      const body = await res.json().catch(() => ({})) as { data?: Comment; error?: string };

      if (!res.ok) {
        throw new Error(body.error ?? 'Failed to post comment');
      }

      const saved = body.data;

      // Replace optimistic entry with the real one from the server
      setComments(prev =>
        prev.map(c => (c.id === optimisticId && saved ? { ...saved, optimistic: false } : c)),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      setSubmitError(msg);
      // Remove the failed optimistic entry
      setComments(prev => prev.filter(c => c.id !== optimisticId));
      // Restore the draft so the user can retry
      setDraft(text);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div
      className="de-widget mt-0 rounded-t-none border-t-0"
      style={{
        background: 'rgba(220,232,248,0.45)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(160,195,240,0.25)',
      }}
    >
      {/* Comment list */}
      <div className="px-4 pt-3 pb-2 space-y-3 max-h-72 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-6 gap-2" style={{ color: 'var(--de-text-dim)' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading comments…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 py-4 text-xs" style={{ color: '#e05d5d' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && comments.length === 0 && (
          <div className="flex flex-col items-center py-6 gap-2">
            <MessageCircle className="w-6 h-6 opacity-20" style={{ color: 'var(--de-accent)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--de-text-dim)' }}>
              Be the first to comment
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-2.5 items-start group"
              style={{ opacity: comment.optimistic ? 0.65 : 1, transition: 'opacity 300ms' }}
            >
              <Avatar profile={comment.profile} size={28} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color: 'var(--de-heading)' }}>
                    {comment.profile?.display_name || comment.profile?.handle || 'You'}
                  </span>
                  {comment.profile?.handle && (
                    <span className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
                      @{comment.profile.handle}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
                    · {formatRelativeTime(comment.created_at)}
                  </span>
                  {comment.optimistic && (
                    <span className="text-xs" style={{ color: 'var(--de-text-dim)', fontStyle: 'italic' }}>
                      sending…
                    </span>
                  )}
                </div>
                <p
                  className="text-xs mt-0.5 leading-relaxed break-words"
                  style={{ color: 'var(--de-text)' }}
                >
                  {comment.content}
                </p>
              </div>
              {!comment.optimistic && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-xs transition-opacity flex-shrink-0 p-1 rounded"
                  style={{ color: 'var(--de-text-dim)' }}
                  aria-label="Delete comment"
                  title="Delete your comment"
                >
                  ×
                </button>
              )}
            </div>
          ))}
      </div>

      {/* Inline comment input */}
      <div
        className="px-4 pb-4 pt-2 border-t"
        style={{ borderColor: 'rgba(160,195,240,0.2)' }}
      >
        {isDemo ? (
          <p className="text-xs text-center" style={{ color: 'var(--de-text-dim)', padding: '4px 0' }}>
            Comments disabled on demo posts
          </p>
        ) : (
          <>
            {submitError && (
              <p className="text-xs mb-2" style={{ color: '#e05d5d' }}>
                {submitError} — tap send to retry
              </p>
            )}
            <div
              className="flex items-end gap-2"
              style={{
                background: 'rgba(160,195,240,0.10)',
                border: '1px solid rgba(160,195,240,0.22)',
                borderRadius: 14,
                padding: '8px 10px',
              }}
            >
              <textarea
                ref={inputRef}
                value={draft}
                onChange={e => setDraft(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
                onKeyDown={handleKeyDown}
                placeholder="Write a comment… (⌘↵ to send)"
                rows={1}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: 12,
                  color: 'var(--de-text)',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  maxHeight: 80,
                  overflowY: 'auto',
                }}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={!draft.trim() || submitting}
                aria-label="Send comment"
                style={{
                  flexShrink: 0,
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  border: 'none',
                  cursor: draft.trim() && !submitting ? 'pointer' : 'default',
                  background: draft.trim() && !submitting
                    ? 'linear-gradient(135deg,#87CEEB,#5ba8d4 55%,#c8981a)'
                    : 'rgba(160,195,240,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 200ms',
                }}
              >
                {submitting
                  ? <Loader2 size={13} style={{ color: 'var(--de-accent)', animation: 'spin 0.7s linear infinite' }} />
                  : <Send size={13} style={{ color: draft.trim() ? '#fff' : 'var(--de-text-dim)' }} />
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
