'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Send, Image as ImageIcon, Music, Link as LinkIcon, Globe, Lock, Loader2, X, Video } from 'lucide-react';
import Link from 'next/link';

interface MediaAttachment {
  url: string;
  type: string;
  name: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [media, setMedia] = useState<MediaAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'media');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setMedia((prev) => [...prev, { url: data.url, type: data.type, name: data.name }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() && media.length === 0) return;

    setIsSubmitting(true);
    setError('');

    try {
      const mediaUrls = media.map((m) => ({ url: m.url, type: m.type, name: m.name }));
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          visibility,
          media_urls: mediaUrls,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      router.push('/home');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Create Post</h1>
          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={(!content.trim() && media.length === 0) || isSubmitting || isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors active:scale-95 min-h-[44px]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full min-h-[200px] p-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-lg"
              autoFocus
            />
            <div className="flex justify-end mt-2">
              <span className={`text-sm ${content.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {content.length}/500
              </span>
            </div>
          </div>

          {/* Media Preview */}
          {media.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {media.map((m, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-border bg-card">
                  {m.type.startsWith('image/') ? (
                    <Image
                      src={m.url}
                      alt={m.name}
                      width={400}
                      height={300}
                      className="w-full h-40 object-cover"
                    />
                  ) : m.type.startsWith('video/') ? (
                    <video src={m.url} className="w-full h-40 object-cover" controls />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center bg-muted">
                      <Music className="w-8 h-8 text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground truncate">{m.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-primary">Uploading media...</span>
            </div>
          )}

          {/* Attachments */}
          <div className="flex items-center gap-2 p-4 bg-card border border-border rounded-2xl">
            <span className="text-sm text-muted-foreground mr-2">Add:</span>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Add image"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <ImageIcon className="w-5 h-5 text-primary" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Add video"
              onClick={() => videoInputRef.current?.click()}
              disabled={isUploading}
            >
              <Video className="w-5 h-5 text-primary" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Add music"
              onClick={() => {
                router.push('/music/upload');
              }}
            >
              <Music className="w-5 h-5 text-primary" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Add link"
              onClick={() => {
                const url = prompt('Enter a URL:');
                if (url) {
                  setContent((prev) => prev + (prev ? '\n' : '') + url);
                }
              }}
            >
              <LinkIcon className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
            <span className="text-sm text-muted-foreground">Visibility:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  visibility === 'public'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Globe className="w-4 h-4" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  visibility === 'private'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Lock className="w-4 h-4" />
                Private
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm">
              {error}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
