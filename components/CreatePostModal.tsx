'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadBlobToLedgerStorage } from '@/lib/media/ledger';
import { X, Image as ImageIcon, Video, Music, Send, Loader2, Check, Trash2 } from 'lucide-react';

interface CreatePostModalProps {
  onClose: () => void;
  userId: string;
}

type MediaType = 'image' | 'video' | 'audio' | null;

interface UploadedMedia {
  type: MediaType;
  url: string;
  file: File;
}

export default function CreatePostModal({ onClose, userId }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('followers');
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: MediaType) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File ${file.name} must be smaller than 50MB`);
        continue;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      setUploadedMedia(prev => [...prev, {
        type,
        url: previewUrl,
        file
      }]);
    }

    // Reset input
    if (e.target) e.target.value = '';
  };

  const removeMedia = (index: number) => {
    setUploadedMedia(prev => {
      const newMedia = [...prev];
      URL.revokeObjectURL(newMedia[index].url);
      newMedia.splice(index, 1);
      return newMedia;
    });
  };

  const uploadMediaToStorage = async (media: UploadedMedia): Promise<string> => {
    const bucketMap: Record<string, string> = {
      image: 'images',
      video: 'videos',
      audio: 'audio',
    };

    const bucket = bucketMap[media.type || 'image'] || 'files';
    const ext = media.file.name.split('.').pop();
    const filename = `${userId}/posts/${Date.now()}-${crypto.randomUUID()}.${ext}.ledger`;

    try {
      const upload = await uploadBlobToLedgerStorage(supabase, {
        bucket,
        storagePath: filename,
        blob: media.file,
        fileName: media.file.name,
        mimeType: media.file.type,
      });
      return upload.mediaUrl;
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload ${media.file.name}: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && uploadedMedia.length === 0) return;

    setIsSubmitting(true);
    setUploadProgress('');

    try {
      // Upload all media files
      const mediaUrls: Record<string, string[]> = {
        images: [],
        videos: [],
        audio: [],
      };

      if (uploadedMedia.length > 0) {
        setUploadProgress('Uploading media...');
        for (const media of uploadedMedia) {
          const url = await uploadMediaToStorage(media);
          if (media.type === 'image') mediaUrls.images.push(url);
          else if (media.type === 'video') mediaUrls.videos.push(url);
          else if (media.type === 'audio') mediaUrls.audio.push(url);
        }
      }

      setUploadProgress('Creating post...');

      const { error } = await supabase
        .from('app_posts')
        .insert({
          user_id: userId,
          content,
          visibility,
          media_json: mediaUrls
        });

      if (!error) {
        // Also create a feed item for the post
        await supabase
          .from('feed_items')
          .insert({
            user_id: userId,
            source: 'app',
            external_id: crypto.randomUUID(),
            title: content.slice(0, 100),
            summary: content,
            ts: new Date().toISOString(),
            dedupe_hash: `${userId}-app-${Date.now()}`,
            visibility: visibility,
            media_json: mediaUrls
          });

        setContent('');
        setUploadedMedia([]);
        onClose();
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Post creation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create Post</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-500"
          />

          {/* Media Preview */}
          {uploadedMedia.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {uploadedMedia.map((media, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {media.type === 'image' && (
                    <img src={media.url} alt="Upload preview" className="w-full h-full object-cover" />
                  )}
                  {media.type === 'video' && (
                    <video src={media.url} className="w-full h-full object-cover" />
                  )}
                  {media.type === 'audio' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {media.type}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadProgress}
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(e) => handleFileSelect(e, 'image')}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            onChange={(e) => handleFileSelect(e, 'video')}
            className="hidden"
          />
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => handleFileSelect(e, 'audio')}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isSubmitting}
                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                title="Add photos"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={isSubmitting}
                className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors disabled:opacity-50"
                title="Add video"
              >
                <Video className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                disabled={isSubmitting}
                className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50"
                title="Add audio"
              >
                <Music className="w-5 h-5" />
              </button>
              
              <div className="ml-2">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  disabled={isSubmitting}
                  className="text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="followers">Followers</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (!content.trim() && uploadedMedia.length === 0)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
