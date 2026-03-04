'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Image as ImageIcon, Music, Link as LinkIcon, Globe, Lock, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const ALLOWED_IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
type UploadedImage = { path: string; publicUrl: string };

export default function CreatePostPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [selectedImages, setSelectedImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const selectedImagesRef = useRef<Array<{ file: File; preview: string }>>([]);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => () => {
    selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const images = files
      .filter((file) => {
        if (!file.type.startsWith('image/')) return false;
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        return ALLOWED_IMAGE_EXT.has(ext);
      })
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setSelectedImages((prev) => [...prev, ...images]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const uploadSelectedImages = async () => {
    const uploads = selectedImages.map(async (image) => {
      const ext = (image.file.name.split('.').pop() || 'jpg').toLowerCase();
      if (!ALLOWED_IMAGE_EXT.has(ext)) throw new Error(`Unsupported image type: ${ext}`);
      const path = `posts/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, image.file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      return {
        path,
        publicUrl: supabase.storage.from('images').getPublicUrl(path).data.publicUrl,
      };
    });

    const results = await Promise.allSettled(uploads);
    const successfulUploads = results
      .filter((result): result is PromiseFulfilledResult<UploadedImage> => result.status === 'fulfilled')
      .map((result) => result.value);
    const failedUploads = results.filter((result) => result.status === 'rejected');

    if (failedUploads.length > 0) {
      if (successfulUploads.length > 0) {
        const { error: cleanupError } = await supabase.storage.from('images').remove(successfulUploads.map((upload) => upload.path));
        if (cleanupError) {
          console.error('Failed to rollback uploaded images:', cleanupError.message);
        }
      }
      const firstFailure = failedUploads[0];
      if (firstFailure.reason instanceof Error) throw firstFailure.reason;
      console.error('Image upload failed with non-Error rejection:', firstFailure.reason);
      throw new Error(`Failed to upload ${failedUploads.length} image(s)`);
    }

    return successfulUploads.map((upload) => upload.publicUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedImages.length === 0) return;

    setIsSubmitting(true);
    setError('');

    try {
      const mediaUrls = await uploadSelectedImages();
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, visibility, media_urls: mediaUrls }),
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
            onClick={handleSubmit}
            disabled={(!content.trim() && selectedImages.length === 0) || isSubmitting}
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

          {/* Attachments */}
          <div className="flex items-center gap-2 p-4 bg-card border border-border rounded-2xl">
            <span className="text-sm text-muted-foreground mr-2">Add:</span>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Add image"
            >
              <ImageIcon className="w-5 h-5 text-primary" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Add music"
            >
              <Music className="w-5 h-5 text-primary" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Add link"
            >
              <LinkIcon className="w-5 h-5 text-primary" />
            </button>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          {selectedImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.preview} alt={image.file.name} className="w-full h-28 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

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
