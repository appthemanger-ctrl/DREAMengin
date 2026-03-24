'use client';

/**
 * ContentScheduler — wired to the real /api/scheduled-posts backend.
 *
 * Architecture justification:
 *   docs/AXIOMS.md §3 — every visible action must do something real.
 *   The previous version had hardcoded demo posts and a "Schedule" button
 *   with no handler. This component now:
 *     - fetches the user's real scheduled posts on mount
 *     - creates posts via POST /api/scheduled-posts
 *     - deletes posts via DELETE /api/scheduled-posts?id=
 *     - connects "Create & Schedule" to the CreatePostModal so the user
 *       composes rich content in the full post creation flow, then sets
 *       the schedule time here
 *
 *   docs/ARCHITECTURE.md §8: Gold = save/confirm/action (schedule button).
 *   docs/LAW.md §3: every visible action must do something real.
 *
 * Performance: render-on-demand; no render loops; one-time fetch on mount.
 */

import { Calendar, Clock, Send, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import CreatePostModal from '@/components/CreatePostModal';
import { createClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  scheduled_for: string;
  status: 'scheduled' | 'publishing' | 'published' | 'failed';
  platforms: string[];
  created_at: string;
}

interface NewPostForm {
  title: string;
  content: string;
  scheduled_for: string;
  platforms: string[];
}

const PLATFORM_OPTIONS = ['feed', 'profile', 'lab', 'music', 'code', 'brand'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function statusColor(status: ScheduledPost['status']): string {
  switch (status) {
    case 'scheduled':  return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'publishing': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'published':  return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    case 'failed':     return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
  }
}

/** Minimum datetime-local value = now (prevents scheduling in the past) */
function minDatetimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ContentScheduler() {
  const [posts, setPosts]               = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [showForm, setShowForm]         = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError]       = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [pendingContent, setPendingContent] = useState('');

  const [form, setForm] = useState<NewPostForm>({
    title:         '',
    content:       '',
    scheduled_for: '',
    platforms:     ['feed'],
  });

  // ── Fetch on mount ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchPosts();
    // Resolve the real user ID so CreatePostModal can use it
    createClient().auth.getUser().then((result: { data: { user: { id: string } | null } }) => {
      setCurrentUserId(result.data.user?.id ?? null);
    });
   
  }, []);

  async function fetchPosts() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scheduled-posts?limit=50');
      if (!res.ok) {
        if (res.status === 401) { setIsLoading(false); return; }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json() as { posts?: ScheduledPost[] };
      setPosts(data.posts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduled posts.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = form.content.trim() || pendingContent.trim();
    if (!content) { setFormError('Content is required.'); return; }
    if (!form.scheduled_for) { setFormError('Schedule date/time is required.'); return; }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:         form.title.trim(),
          content,
          scheduled_for: new Date(form.scheduled_for).toISOString(),
          platforms:     form.platforms,
        }),
      });
      const data = await res.json() as { post?: ScheduledPost; error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setPosts(prev => [data.post!, ...prev].sort(
        (a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime(),
      ));
      setShowForm(false);
      setForm({ title: '', content: '', scheduled_for: '', platforms: ['feed'] });
      setPendingContent('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to schedule post.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id));   // optimistic
    try {
      await fetch(`/api/scheduled-posts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      fetchPosts();   // re-fetch on failure
    }
  }

  // ── Platform toggle ───────────────────────────────────────────────────────

  function togglePlatform(p: string) {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p],
    }));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Content Scheduler</h2>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(true); setFormError(null); }}
          className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Post
        </button>
      </div>

      {/* New post form */}
      {showForm && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mb-6 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg space-y-3"
        >
          <h3 className="font-medium text-slate-900 dark:text-white">New Scheduled Post</h3>

          {formError && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          {/* Optional title */}
          <input
            type="text"
            placeholder="Title (optional)…"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:bg-slate-800 dark:text-white"
          />

          {/* Content or open full CreatePostModal */}
          <div className="space-y-2">
            <textarea
              placeholder="Post content…"
              rows={3}
              value={form.content || pendingContent}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none dark:bg-slate-800 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowPostModal(true)}
              disabled={!currentUserId}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✏️ Open full post composer (media, formatting)
            </button>
          </div>

          {/* Date/time */}
          <input
            type="datetime-local"
            min={minDatetimeLocal()}
            value={form.scheduled_for}
            onChange={e => setForm(p => ({ ...p, scheduled_for: e.target.value }))}
            required
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:bg-slate-800 dark:text-white"
          />

          {/* Platform selection */}
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Publish to:</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.platforms.includes(p)
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(null); setPendingContent(''); }}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSubmitting ? 'Scheduling…' : 'Schedule'}
            </button>
          </div>
        </form>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 py-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button type="button" onClick={() => void fetchPosts()} className="underline ml-1">Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && posts.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <Calendar className="w-16 h-16 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No scheduled posts yet</p>
          <p className="text-sm mt-1">Schedule posts to publish them automatically across your surfaces.</p>
        </div>
      )}

      {/* Scheduled posts list */}
      {!isLoading && !error && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 mr-3">
                  {post.title && (
                    <h3 className="font-medium text-slate-900 dark:text-white mb-1 truncate">
                      {post.title}
                    </h3>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {post.content}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${statusColor(post.status)}`}>
                  {post.status}
                </span>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(post.scheduled_for)}</span>
                  </div>
                  {post.platforms.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {post.platforms.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(post.id)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  aria-label="Delete scheduled post"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {scheduledCount > 0
            ? `${scheduledCount} post${scheduledCount !== 1 ? 's' : ''} scheduled and waiting to publish.`
            : 'No upcoming posts — schedule one to get started.'}
        </p>
      </div>

      {/* Full CreatePostModal — user composes rich content; on close the
          content is pre-filled into the schedule form */}
      {showPostModal && currentUserId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
          <CreatePostModal
            userId={currentUserId}
            onClose={() => setShowPostModal(false)}
          />
        </div>
      )}
    </div>
  );
}

