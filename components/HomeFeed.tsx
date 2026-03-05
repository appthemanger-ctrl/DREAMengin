'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  Plus, Image as ImageIcon, Sparkles, TrendingUp, Users,
  Send, Loader2, Globe, Lock, X
} from 'lucide-react';

interface Post {
  id: string;
  content: string;
  visibility: string;
  media_url?: string | null;
  created_at: string;
  profiles: {
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count?: number;
  comments_count?: number;
}

interface HomeFeedProps {
  userId: string;
  userHandle: string;
  userAvatar: string | null;
  userDisplayName: string;
  initialPosts: Post[];
  /**
   * When true, renders inside the Core Dream surface (no full-page chrome).
   */
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
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState<'public' | 'private'>('public');
  const [isPosting, setIsPosting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'feed' | 'trending' | 'following'>('feed');
  const [postError, setPostError] = useState<string | null>(null);

  const handleCreatePost = async () => {
    const trimmed = newPostContent.trim();
    if (!trimmed || isPosting) return;
    setIsPosting(true);
    setPostError(null);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          visibility: newPostVisibility,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Unable to create your post right now.');
      }

      const createdPost: Post = {
        id: data?.post?.id || `${Date.now()}`,
        content: data?.post?.content || trimmed,
        visibility: data?.post?.visibility || newPostVisibility,
        media_url: data?.post?.media_url || null,
        created_at: data?.post?.created_at || new Date().toISOString(),
        profiles: {
          handle: data?.post?.profiles?.handle || userHandle,
          display_name: data?.post?.profiles?.display_name || userDisplayName,
          avatar_url: data?.post?.profiles?.avatar_url || userAvatar,
        },
        likes_count: 0,
        comments_count: 0,
      };

      setPosts((prev) => [createdPost, ...prev]);
      setNewPostContent('');
      setShowComposer(false);
    } catch (err) {
      console.error('Failed to create post:', err);
      setPostError(err instanceof Error ? err.message : 'Unable to create your post right now.');
    } finally {
      setIsPosting(false);
    }
  };

  const toggleLike = async (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      });
    } catch {
      // Silently fail, optimistic UI
    }
  };

  const toggleSave = (postId: string) => {
    setSavedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className={embedded ? 'h-full' : 'min-h-screen de-sky-bg'}>
      <div className={embedded ? 'h-full px-4 pt-4 pb-4' : 'max-w-3xl mx-auto px-4 pt-4 pb-24 md:pb-8'}>
        {/* Feed Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-card rounded-2xl border border-border p-1">
          {[
            { id: 'feed' as const, label: 'For You', icon: Sparkles },
            { id: 'trending' as const, label: 'Trending', icon: TrendingUp },
            { id: 'following' as const, label: 'Following', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Composer */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          {!showComposer ? (
            <button
              onClick={() => setShowComposer(true)}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                {userAvatar ? (
                  <Image src={userAvatar} alt={userHandle} width={40} height={40} className="rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    {(userDisplayName || '?')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-muted-foreground flex-1">What&apos;s on your mind?</span>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                <Plus className="w-5 h-5 text-primary" />
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  {userAvatar ? (
                    <Image src={userAvatar} alt={userHandle} width={40} height={40} className="rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">
                      {(userDisplayName || '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share something with the community..."
                    className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base min-h-[80px]"
                    autoFocus
                  />
                </div>
              </div>

              {postError ? (
                <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {postError}
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Add image">
                    <ImageIcon className="w-5 h-5 text-primary" />
                  </button>
                  <button
                    onClick={() => setNewPostVisibility(newPostVisibility === 'public' ? 'private' : 'public')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground"
                    title={`Visibility: ${newPostVisibility}`}
                  >
                    {newPostVisibility === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {newPostVisibility === 'public' ? 'Public' : 'Private'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowComposer(false); setNewPostContent(''); }}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || isPosting}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors min-h-[40px]"
                  >
                    {isPosting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">Be the first to share something with the community!</p>
              <button
                onClick={() => setShowComposer(true)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors min-h-[48px]"
              >
                Create a Post
              </button>
            </div>
          ) : (
            posts.map(post => (
              <article
                key={post.id}
                className="bg-card rounded-2xl border border-border p-4 hover:border-primary/20 transition-colors"
              >
                {/* Post Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Link href={`/profile/${post.profiles?.handle}`} className="flex-shrink-0">
                    {post.profiles?.avatar_url ? (
                      <Image
                        src={post.profiles.avatar_url}
                        alt={post.profiles.display_name || post.profiles.handle}
                        width={44}
                        height={44}
                        className="rounded-full object-cover ring-2 ring-border"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center ring-2 ring-border">
                        <span className="text-sm font-bold text-muted-foreground">
                          {(post.profiles?.display_name || post.profiles?.handle)?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/profile/${post.profiles?.handle}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors text-sm"
                      >
                        {post.profiles?.display_name || post.profiles?.handle}
                      </Link>
                      <span className="text-sm text-muted-foreground">@{post.profiles?.handle}</span>
                      <span className="text-xs text-muted-foreground">· {timeAgo(post.created_at)}</span>
                    </div>
                  </div>

                  <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Post Content */}
                <p className="text-foreground leading-relaxed mb-4 whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Post Media */}
                {post.media_url && (
                  <div className="rounded-xl overflow-hidden mb-4 border border-border">
                    <Image
                      src={post.media_url}
                      alt="Post media"
                      width={600}
                      height={400}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px] ${
                      likedPosts.has(post.id)
                        ? 'text-red-500 bg-red-500/10'
                        : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                    <span>{(post.likes_count || 0) + (likedPosts.has(post.id) ? 1 : 0)}</span>
                  </button>

                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors min-h-[40px]">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments_count || 0}</span>
                  </button>

                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors min-h-[40px]">
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleSave(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px] ${
                      savedPosts.has(post.id)
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${savedPosts.has(post.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
