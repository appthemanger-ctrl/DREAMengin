'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Image, Send } from 'lucide-react';

interface CreatePostModalProps {
  onClose: () => void;
  userId: string;
}

export default function CreatePostModal({ onClose, userId }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('followers');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('app_posts')
      .insert({
        user_id: userId,
        content,
        visibility,
        media_json: {}
      });

    if (!error) {
      // Also create a feed item for the post
      await supabase
        .from('feed_items')
        .insert({
          user_id: userId,
          source: 'app',
          external_id: crypto.randomUUID(),
          title: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
          summary: content,
          ts: new Date().toISOString(),
          dedupe_hash: `${userId}-app-${Date.now()}`,
          visibility: visibility
        });

      setContent('');
      onClose();
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800/70 backdrop-blur-lg border border-slate-600 rounded-lg p-6 w-full max-w-lg mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Create Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-purple-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-32 p-3 bg-slate-700/60 text-gray-100 border border-slate-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-600"
            required
          />

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-slate-700 rounded-md transition-colors"
              >
                <Image className="w-5 h-5" />
              </button>
              
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="text-sm bg-slate-700/60 text-gray-100 border border-slate-600 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-600"
              >
                <option value="followers">Followers</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md disabled:opacity-50 flex items-center transition-colors"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
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