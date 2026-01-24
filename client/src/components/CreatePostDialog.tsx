import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { X, Image as ImageIcon, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostDialog({ isOpen, onClose }: CreatePostDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: { title?: string; content: string; mediaUrl?: string }) => {
      return await apiRequest('POST', '/api/feed', {
        type: 'post',
        ...data,
      });
    },
    onSuccess: () => {
      toast({ title: 'Post created!', description: 'Your post is now live.' });
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      setTitle('');
      setContent('');
      setMediaUrl('');
      onClose();
    },
    onError: () => {
      toast({ title: 'Failed to create post', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({ title: 'Please add some content', variant: 'destructive' });
      return;
    }
    createMutation.mutate({ 
      title: title.trim() || undefined, 
      content: content.trim(),
      mediaUrl: mediaUrl.trim() || undefined,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
          >
            <div className="glass-strong p-6 m-4" data-testid="dialog-create-post">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Create Post
                </h2>
                <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-dialog">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="glass-input w-full"
                    data-testid="input-post-title"
                  />
                </div>

                <div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="glass-input w-full h-32 resize-none"
                    required
                    data-testid="input-post-content"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Add media (optional)</span>
                  </div>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="glass-input w-full"
                    data-testid="input-post-media"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    data-testid="button-cancel-post"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 bg-primary hover:bg-primary/90 gap-2"
                    data-testid="button-submit-post"
                  >
                    {createMutation.isPending ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
