'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Send, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
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
}

interface Props {
  postId: string;
}

function Avatar({ profile, size = 32 }: { profile: CommentProfile | null; size?: number }) {
  const initials = (
    profile?.display_name || profile?.handle || '?'
  )[0].toUpperCase();

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
  const [input, setInput] = useState('');
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

    fetch(`/api/comments?post_id=${encodeURIComponent(postId)}`)
      .then((res) => res.json())
      .then(({ data, error: err }) => {
        if (err) {
          setError(err);
        } else {
          setComments(data ?? []);
        }
      })
      .catch(() => setError('Failed to load comments'))
      .finally(() => setLoading(false));
  }, [postId, isDemo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content: text }),
      });
      const { data, error: err } = await res.json();

      if (!res.ok || err) {
        setSubmitError(err || 'Failed to post comment');
      } else if (data) {
        setComments((prev) => [...prev, data as Comment]);
        setInput('');
        inputRef.current?.focus();
      }
    } catch {
      setSubmitError('Network error — try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId }),
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {
      // Silently fail — comment stays visible; will sync on next load
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
      <div className="px-4 pt-3 pb-2 space-y-3 max-h-80 overflow-y-auto">
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
            <div key={comment.id} className="flex gap-2.5 items-start group">
              <Avatar profile={comment.profile} size={28} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color: 'var(--de-heading)' }}>
                    {comment.profile?.display_name || comment.profile?.handle || 'Unknown'}
                  </span>
                  {comment.profile?.handle && (
                    <span className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
                      @{comment.profile.handle}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
                    · {formatRelativeTime(comment.created_at)}
                  </span>
                </div>
                <p
                  className="text-xs mt-0.5 leading-relaxed break-words"
                  style={{ color: 'var(--de-text)' }}
                >
                  {comment.content}
                </p>
              </div>
              {/* Delete button — shown on hover; RLS ensures only owner can delete */}
              <button
                onClick={() => handleDelete(comment.id)}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-xs transition-opacity flex-shrink-0 p-1 rounded"
                style={{ color: 'var(--de-text-dim)' }}
                aria-label="Delete comment"
                title="Delete your comment"
              >
                ×
              </button>
            </div>
          ))}
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="px-4 pb-4 pt-2 border-t flex gap-2 items-end"
        style={{ borderColor: 'rgba(160,195,240,0.2)' }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          placeholder={isDemo ? 'Comments disabled on demo posts' : 'Add a comment…'}
          disabled={isDemo || submitting}
          rows={1}
          maxLength={1000}
          className="flex-1 resize-none text-xs rounded-xl px-3 py-2 outline-none transition-colors"
          style={{
            background: 'rgba(160,195,240,0.12)',
            border: '1px solid rgba(160,195,240,0.3)',
            color: 'var(--de-text)',
            minHeight: 36,
            maxHeight: 100,
          }}
        />
        <button
          type="submit"
          disabled={isDemo || submitting || !input.trim()}
          className="de-btn de-btn-primary flex-shrink-0"
          style={{ padding: '7px 12px', opacity: (!input.trim() || isDemo) ? 0.5 : 1 }}
          aria-label="Post comment"
        >
          {submitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </form>

      {submitError && (
        <p className="px-4 pb-3 text-xs" style={{ color: '#e05d5d' }}>
          {submitError}
        </p>
      )}
    </div>
  );
}
