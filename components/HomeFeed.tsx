'use client';

/**
 * HomeFeed — Live feed component for the HomeDream Surface.
 *
 * Phase 8 §A: Upgraded from static on-mount fetch to full Supabase Realtime
 * push-based live feed via useLiveFeed (lib/feed/useLiveFeed.ts).
 *
 * New behaviour:
 *   - Realtime channel subscribes to app_posts INSERT/UPDATE + feed_items INSERT
 *   - A green live dot in the tab bar shows the channel is connected
 *   - When other users post, a "N new posts" banner appears; tap to flush
 *   - Own posts prepend immediately (seamless with optimistic insert)
 *   - Like/comment counts sync via UPDATE events (no re-fetch)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  Plus, Image as ImageIcon, Sparkles, TrendingUp, Users,
  Send, Loader2, Globe, Lock, ArrowUp, Wifi, X,
  FileText, Radio, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useLiveFeed, type FeedPost } from '@/lib/feed/useLiveFeed';
import SocialShareSheet from '@/components/ui/SocialShareSheet';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import { createClient } from '@/lib/supabase/client';
import { isCompactRuntimeViewport } from '@/lib/ui/runtimeViewport';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profile: { handle: string; display_name: string | null; avatar_url: string | null } | null;
}

interface HomeFeedProps {
  userId: string;
  userHandle: string;
  userAvatar: string | null;
  userDisplayName: string;
  initialPosts: FeedPost[];
  embedded?: boolean;
}

export default function HomeFeed({
  userId,
  userHandle,
  userAvatar,
  userDisplayName,
  initialPosts,
  embedded = false,
}: HomeFeedProps) {
  const { posts, newCount, flushNew, isLive, replacePosts, prependPost, updatePost } =
    useLiveFeed(userId, initialPosts);

  const { setBarIntent } = useDreamSystem();

  const [tabLoading, setTabLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState<'public' | 'private'>('public');
  const [isPosting, setIsPosting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'feed' | 'trending' | 'following'>('feed');
  const [postError, setPostError] = useState<string | null>(null);
  const [sharePost, setSharePost] = useState<FeedPost | null>(null);
  const [selectedImages, setSelectedImages] = useState<{ file: File; preview: string }[]>([]);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // ── Inline comments state ─────────────────────────────────────────────────
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [commentLoadingSet, setCommentLoadingSet] = useState<Set<string>>(new Set());

  const handleCommentFromBar = useCallback((post: FeedPost) => {
    setBarIntent({
      mode: 'comment',
      targetPostId: post.id,
      targetLabel: post.profiles?.display_name || post.profiles?.handle || undefined,
    });
  }, [setBarIntent]);

  const loadComments = useCallback(async (postId: string) => {
    if (commentsMap[postId]) return; // already loaded
    setCommentLoadingSet(prev => new Set(prev).add(postId));
    try {
      const res = await fetch(`/api/comments?post_id=${encodeURIComponent(postId)}&limit=20`);
      if (res.ok) {
        const data = await res.json() as { data?: Comment[] };
        setCommentsMap(prev => ({ ...prev, [postId]: data.data ?? [] }));
      }
    } catch { /* silent */ } finally {
      setCommentLoadingSet(prev => { const s = new Set(prev); s.delete(postId); return s; });
    }
  }, [commentsMap]);

  const toggleComments = useCallback(async (postId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
        void loadComments(postId);
      }
      return next;
    });
  }, [loadComments]);

  const prevInitialRef = useRef(initialPosts);
  useEffect(() => {
    const updateViewport = () => {
      const width = window.visualViewport?.width ?? window.innerWidth;
      setViewportWidth(width);
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    window.visualViewport?.addEventListener('resize', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      window.visualViewport?.removeEventListener('resize', updateViewport);
    };
  }, []);

  useEffect(() => {
    if (prevInitialRef.current !== initialPosts) {
      prevInitialRef.current = initialPosts;
      replacePosts(initialPosts);
    }
  }, [initialPosts, replacePosts]);

  useEffect(() => {
    if (activeTab === 'feed') {
      replacePosts(initialPosts);
      return;
    }
    setTabLoading(true);
    const params = new URLSearchParams({ limit: '20' });
    if (activeTab === 'trending')  params.set('sort', 'trending');
    if (activeTab === 'following') params.set('feed', 'following');
    fetch(`/api/posts?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { posts?: FeedPost[] }) => { if (data.posts) replacePosts(data.posts); })
      .catch(() => {})
      .finally(() => setTabLoading(false));
   
  }, [activeTab]);

  const handleSharePost = useCallback((post: FeedPost) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://dreamengin.app'}/posts/${post.id}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: `Post by @${post.profiles.handle}`, text: post.content.slice(0, 120), url })
        .catch(() => setSharePost(post));
    } else {
      setSharePost(post);
    }
  }, []);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 50 * 1024 * 1024; // 50 MB
    for (const file of files) {
      if (file.size > maxSize) continue;
      if (!file.type.startsWith('image/')) continue;
      setSelectedImages((prev) => [...prev, { file, preview: URL.createObjectURL(file) }]);
    }
    if (e.target) e.target.value = '';
  }, []);

  const removeImage = useCallback((idx: number) => {
    setSelectedImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const handleCreatePost = async () => {
    const trimmed = newPostContent.trim();
    if (!trimmed && selectedImages.length === 0) return;
    if (isPosting) return;
    setIsPosting(true);
    setPostError(null);
    try {
      // Upload images to Supabase storage
      const mediaUrls: string[] = [];
      if (selectedImages.length > 0) {
        const supabase = createClient();
        for (const img of selectedImages) {
          const ext = img.file.name.split('.').pop() ?? 'jpg';
          const filename = `${userId}/posts/${Date.now()}-${crypto.randomUUID()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('images')
            .upload(filename, img.file, { cacheControl: '3600', upsert: false });
          if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);
          const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filename);
          mediaUrls.push(publicUrl);
        }
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed || '📷',
          visibility: newPostVisibility,
          media_urls: mediaUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Unable to create your post right now.');
      const createdPost: FeedPost = {
        id: data?.post?.id || `${Date.now()}`,
        content: data?.post?.content || trimmed || '📷',
        visibility: data?.post?.visibility || newPostVisibility,
        media_url: mediaUrls[0] || data?.post?.media_url || null,
        created_at: data?.post?.created_at || new Date().toISOString(),
        profiles: {
          handle: data?.post?.profiles?.handle || userHandle,
          display_name: data?.post?.profiles?.display_name || userDisplayName,
          avatar_url: data?.post?.profiles?.avatar_url || userAvatar,
        },
        likes_count: 0,
        comments_count: 0,
        source: 'post',
      };
      prependPost(createdPost);
      setNewPostContent('');
      setSelectedImages((prev) => { prev.forEach((img) => URL.revokeObjectURL(img.preview)); return []; });
      setShowComposer(false);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Unable to create your post right now.');
    } finally {
      setIsPosting(false);
    }
  };

  const toggleLike = async (postId: string) => {
    const alreadyLiked = likedPosts.has(postId);
    setLikedPosts(prev => { const n = new Set(prev); if (alreadyLiked) n.delete(postId); else n.add(postId); return n; });
    const cur = posts.find((p) => p.id === postId)?.likes_count ?? 0;
    updatePost(postId, { likes_count: Math.max(0, cur + (alreadyLiked ? -1 : 1)) });
    try {
      if (alreadyLiked) {
        await fetch(`/api/likes?content_type=post&content_id=${encodeURIComponent(postId)}`, { method: 'DELETE' });
      } else {
        await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content_type: 'post', content_id: postId }) });
      }
    } catch {
      setLikedPosts(prev => { const n = new Set(prev); if (alreadyLiked) n.add(postId); else n.delete(postId); return n; });
      updatePost(postId, { likes_count: cur });
    }
  };

  const toggleSave = async (postId: string) => {
    const alreadySaved = savedPosts.has(postId);
    setSavedPosts(prev => { const n = new Set(prev); if (alreadySaved) n.delete(postId); else n.add(postId); return n; });
    try {
      if (alreadySaved) {
        await fetch(`/api/favorites?target_type=post&target_id=${encodeURIComponent(postId)}`, { method: 'DELETE' });
      } else {
        await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_type: 'post', target_id: postId }) });
      }
    } catch {
      setSavedPosts(prev => { const n = new Set(prev); if (alreadySaved) n.add(postId); else n.delete(postId); return n; });
    }
  };

  const timeAgo = (date: string) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  const isCompactEmbedded = embedded && isCompactRuntimeViewport(viewportWidth);

  return (
    <>
    <div className={embedded ? 'h-full' : 'min-h-screen de-sky-bg'} style={embedded ? { display: 'flex', flexDirection: 'column' } : undefined}>
      <div
        className={embedded ? (isCompactEmbedded ? 'px-3 pt-3 pb-3' : 'px-4 pt-4 pb-4') : 'max-w-3xl mx-auto px-4 pt-4 pb-24 md:pb-8'}
        style={embedded ? { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } : undefined}
      >

        {/* Tabs + live indicator */}
        <div className="flex items-center gap-1 mb-6 bg-card rounded-2xl border border-border p-1" style={embedded ? { flexShrink: 0 } : undefined}>
          {[
            { id: 'feed'      as const, label: 'For You',   icon: Sparkles },
            { id: 'trending'  as const, label: 'Trending',  icon: TrendingUp },
            { id: 'following' as const, label: 'Following', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tabLoading && activeTab === tab.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <tab.icon className="w-4 h-4" />}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
          <div
            title={isLive ? 'Live — posts stream in real time' : 'Connecting…'}
            aria-label={isLive ? 'Live feed active' : 'Connecting to live feed'}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', flexShrink: 0, fontSize: 10, fontWeight: 700, color: isLive ? '#16a34a' : 'var(--de-text-dim)', transition: 'color 0.3s' }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: isLive ? '#22c55e' : 'rgba(160,195,240,0.45)',
                boxShadow: isLive ? '0 0 6px rgba(34,197,94,0.7)' : 'none',
                animation: isLive ? 'de-live-blink 2s ease-in-out infinite' : 'none',
                transition: 'background 0.3s, box-shadow 0.3s',
              }}
            />
            <Wifi size={11} />
          </div>
        </div>

        {/* New-posts banner */}
        {newCount > 0 && (
          <button
            type="button"
            onClick={flushNew}
            aria-live="polite"
            aria-label={`${newCount} new post${newCount === 1 ? '' : 's'} — tap to show`}
            className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.07))', border: '1px solid rgba(34,197,94,0.30)', color: '#16a34a', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', WebkitTapHighlightColor: 'transparent', cursor: 'pointer', ...(embedded ? { flexShrink: 0 } : {}) }}
          >
            <ArrowUp size={14} />
            {newCount} new post{newCount === 1 ? '' : 's'} — tap to show
          </button>
        )}

        {/* Composer */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-6" style={embedded ? { flexShrink: 0 } : undefined}>
          {!showComposer ? (
            <button onClick={() => setShowComposer(true)} className="w-full flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                {userAvatar ? <Image src={userAvatar} alt={userHandle} width={40} height={40} className="rounded-full object-cover" /> : <span className="text-sm font-bold text-muted-foreground">{(userDisplayName || '?')[0].toUpperCase()}</span>}
              </div>
              <span className="text-muted-foreground flex-1">What&apos;s on your mind?</span>
              <div className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary" /><Plus className="w-5 h-5 text-primary" /></div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  {userAvatar ? <Image src={userAvatar} alt={userHandle} width={40} height={40} className="rounded-full object-cover" /> : <span className="text-sm font-bold text-muted-foreground">{(userDisplayName || '?')[0].toUpperCase()}</span>}
                </div>
                <div className="flex-1">
                  <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Share something with the community..." className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base min-h-[80px]" autoFocus />
                </div>
              </div>
              {/* Image previews */}
              {selectedImages.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedImages.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5" aria-label="Remove image"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              {postError && <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{postError}</div>}
              <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Add image"><ImageIcon className="w-5 h-5 text-primary" /></button>
                  <button onClick={() => setNewPostVisibility(v => v === 'public' ? 'private' : 'public')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground">
                    {newPostVisibility === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {newPostVisibility === 'public' ? 'Public' : 'Private'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setShowComposer(false); setNewPostContent(''); setSelectedImages((prev) => { prev.forEach((img) => URL.revokeObjectURL(img.preview)); return []; }); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[40px]">Cancel</button>
                  <button onClick={handleCreatePost} disabled={(!newPostContent.trim() && selectedImages.length === 0) || isPosting} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors min-h-[40px]">
                    {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" />Post</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Posts — scrollable context box */}
        <div
          style={{
            background: 'var(--de-card, rgba(255,255,255,0.92))',
            borderRadius: 20,
            border: '1px solid var(--de-border, rgba(180,185,200,0.22))',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            ...(embedded ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : {}),
          }}
        >
          <div
            style={{
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              ...(embedded
                ? { flex: 1, minHeight: 0 }
                : { maxHeight: 'calc(100vh - 280px)' }),
            }}
          >
          {posts.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">Be the first to share something with the community!</p>
              <button onClick={() => setShowComposer(true)} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors min-h-[48px]">Create a Post</button>
            </div>
          ) : (
            posts.map((post, postIdx) => (
              <article
                key={post.id}
                className="bg-card hover:border-primary/20 transition-colors"
                style={{
                  borderBottom: postIdx < posts.length - 1 ? '1px solid var(--de-border, rgba(180,185,200,0.15))' : 'none',
                  padding: '16px',
                }}
              >
                {/* Content type badge — always visible */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  {post.source === 'connector' && post.provider ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 100, background: 'rgba(74,158,214,0.10)', border: '1px solid rgba(74,158,214,0.25)', fontSize: 10, fontWeight: 700, color: '#4A9ED6', letterSpacing: '0.04em', textTransform: 'capitalize' as const }}>
                      <Radio size={10} />
                      {post.provider}
                    </span>
                  ) : post.source === 'share' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 100, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)', fontSize: 10, fontWeight: 700, color: '#16a34a', letterSpacing: '0.04em' }}>
                      <RefreshCw size={10} />
                      Share
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 100, background: 'rgba(200,152,26,0.10)', border: '1px solid rgba(200,152,26,0.25)', fontSize: 10, fontWeight: 700, color: '#c8981a', letterSpacing: '0.04em' }}>
                      <FileText size={10} />
                      Post
                    </span>
                  )}
                  {post.visibility === 'private' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 100, background: 'rgba(160,160,180,0.10)', border: '1px solid rgba(160,160,180,0.25)', fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.04em' }}>
                      <Lock size={10} />
                      Private
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-3 mb-3">
                  <Link href={`/profile/${post.profiles?.handle}`} className="flex-shrink-0">
                    {post.profiles?.avatar_url ? (
                      <Image src={post.profiles.avatar_url} alt={post.profiles.display_name || post.profiles.handle} width={44} height={44} className="rounded-full object-cover ring-2 ring-border" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center ring-2 ring-border">
                        <span className="text-sm font-bold text-muted-foreground">{(post.profiles?.display_name || post.profiles?.handle)?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/profile/${post.profiles?.handle}`} className="font-semibold text-foreground hover:text-primary transition-colors text-sm">{post.profiles?.display_name || post.profiles?.handle}</Link>
                      <span className="text-sm text-muted-foreground">@{post.profiles?.handle}</span>
                      <span className="text-xs text-muted-foreground">· {timeAgo(post.created_at)}</span>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                <p className="text-foreground leading-relaxed mb-4 whitespace-pre-wrap" style={{ display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
                {post.media_url && (
                  <div className="rounded-xl overflow-hidden mb-4 border border-border">
                    <Image src={post.media_url} alt="Post media" width={600} height={400} className="w-full h-auto object-cover" style={{ maxHeight: 240, objectFit: 'cover' }} />
                  </div>
                )}
                {post.source !== 'connector' && (
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <button onClick={() => void toggleLike(post.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px] ${likedPosts.has(post.id) ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'}`} aria-label={likedPosts.has(post.id) ? 'Unlike post' : 'Like post'}>
                      <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                      <span>{post.likes_count ?? 0}</span>
                    </button>
                    <button
                      onClick={() => { void toggleComments(post.id); handleCommentFromBar(post); }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px] ${expandedComments.has(post.id) ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
                      aria-label={expandedComments.has(post.id) ? 'Hide comments' : 'Show comments'}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments_count || 0}</span>
                      {expandedComments.has(post.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button onClick={() => handleSharePost(post)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors min-h-[40px]" aria-label="Share post">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => void toggleSave(post.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px] ${savedPosts.has(post.id) ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`} aria-label={savedPosts.has(post.id) ? 'Unsave post' : 'Save post'}>
                      <Bookmark className={`w-4 h-4 ${savedPosts.has(post.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                )}
                {/* ── Inline comment thread ─────────────────────────────────────── */}
                {expandedComments.has(post.id) && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(180,185,200,0.15)' }}>
                    {commentLoadingSet.has(post.id) ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, maxHeight: 240, overflowY: 'auto', overscrollBehavior: 'contain' }}>
                          {(commentsMap[post.id] ?? []).length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-3">No comments yet — be first!</p>
                          ) : (
                            (commentsMap[post.id] ?? []).map(c => (
                              <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(42,138,184,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--de-accent)' }}>
                                  {c.profile?.avatar_url ? (
                                    <Image src={c.profile.avatar_url} alt={c.profile.handle} width={28} height={28} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    (c.profile?.display_name || c.profile?.handle)?.[0]?.toUpperCase()
                                  )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 2 }}>
                                    {c.profile?.display_name || c.profile?.handle}
                                    <span style={{ fontWeight: 400, color: 'var(--de-text-dim)', marginLeft: 4 }}>· {timeAgo(c.created_at)}</span>
                                  </div>
                                  <p style={{ fontSize: 13, color: 'var(--de-text)', lineHeight: 1.45 }}>{c.content}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {/* DreamBar comment prompt */}
                        <button
                          type="button"
                          onClick={() => handleCommentFromBar(post)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 12px', borderRadius: 999,
                            border: '1px solid rgba(180,185,200,0.28)',
                            background: 'rgba(255,255,255,0.55)', color: 'var(--de-text-dim)',
                            fontSize: 13, cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <MessageCircle size={13} style={{ flexShrink: 0, color: 'var(--de-accent)' }} aria-hidden />
                          <span>Comment via DreamBar ↑</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
                {post.source === 'connector' && (post as FeedPost & { permalink?: string }).permalink && (
                  <div style={{ paddingTop: 8, borderTop: '1px solid rgba(180,185,200,0.12)' }}>
                    <a href={(post as FeedPost & { permalink?: string }).permalink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#4A9ED6', fontWeight: 600 }}>View original ↗</a>
                  </div>
                )}
              </article>
            ))
          )}
          </div>
        </div>
      </div>
    </div>
    {sharePost && (
      <SocialShareSheet open={!!sharePost} onClose={() => setSharePost(null)}
        url={`${typeof window !== 'undefined' ? window.location.origin : 'https://dreamengin.app'}/posts/${sharePost.id}`}
        text={sharePost.content.slice(0, 120)}
      />
    )}
    </>
  );
}
