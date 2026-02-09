'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  Plus, Image as ImageIcon, Sparkles, TrendingUp, Users,
  Send, Loader2, Globe, Lock, X, Video
} from 'lucide-react';

interface MediaItem {
  url: string;
  type: string;
  name?: string;
}

interface Post {
  id: string;
  content: string;
  visibility: string;
  media_url?: string | null;
  media_json?: MediaItem[] | null;
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
}

export default function HomeFeed({
  userId,
  userHandle,
  userAvatar,
  userDisplayName,
  initialPosts,
}: HomeFeedProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState<'public' | 'private'>('public');
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [composerMedia, setComposerMedia] = useState<MediaItem[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'feed' | 'trending' | 'following'>('feed');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'media');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setComposerMedia((prev) => [...prev, { url: data.url, type: data.type, name: data.name }]);
      }
    } catch {
      // Upload failed silently
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if ((!newPostContent.trim() && composerMedia.length === 0) || isPosting) return;
    setIsPosting(true);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPostContent || '(media)',
          visibility: newPostVisibility,
          media_urls: composerMedia,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Add the new post to the feed
        const newPost: Post = {
          id: data.post?.id || `${Date.now()}`,
          content: newPostContent,
          visibility: newPostVisibility,
          media_json: composerMedia.length > 0 ? composerMedia : null,
          created_at: new Date().toISOString(),
          profiles: {
            handle: userHandle,
            display_name: userDisplayName,
            avatar_url: userAvatar,
          },
          likes_count: 0,
          comments_count: 0,
        };
        setPosts([newPost, ...posts]);
        setNewPostContent('');
        setComposerMedia([]);
        setShowComposer(false);
      }
    } catch (err) {
      console.error('Failed to create post:', err);
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
    <div className="min-h-screen bg-background">
      {/* Hidden file input for image/video upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUploadFile(f);
          e.target.value = '';
        }}
      />

      <div className="max-w-3xl mx-auto px-4 pt-4 pb-24 md:pb-8">
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

              {/* Composer media preview */}
              {composerMedia.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {composerMedia.map((m, i) => (
                    <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-border">
                      {m.type.startsWith('image/') ? (
                        <Image src={m.url} alt={m.name || ''} width={96} height={96} className="w-full h-full object-cover" />
                      ) : m.type.startsWith('video/') ? (
                        <video src={m.url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">{m.name}</div>
                      )}
                      <button
                        type="button"
                        onClick={() => setComposerMedia((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {isUploading && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Add image or video"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
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
                    disabled={(!newPostContent.trim() && composerMedia.length === 0) || isPosting || isUploading}
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
                {post.media_json && Array.isArray(post.media_json) && post.media_json.length > 0 && (
                  <div className={`grid gap-2 mb-4 ${post.media_json.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.media_json.map((m: MediaItem, idx: number) => (
                      <div key={idx} className="rounded-xl overflow-hidden border border-border">
                        {m.type?.startsWith('video/') ? (
                          <video src={m.url} controls className="w-full h-auto max-h-96 object-cover" />
                        ) : (
                          <Image src={m.url} alt={m.name || 'media'} width={600} height={400} className="w-full h-auto object-cover" />
                        )}
                      </div>
                    ))}
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
