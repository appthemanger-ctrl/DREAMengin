'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, Loader2, Globe, Lock, Sparkles } from 'lucide-react';

export default function NewProjectPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          owner_id: user.id,
          title,
          description,
          visibility
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/lab/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  // Template suggestions
  const templates = [
    { name: 'Physics Simulation', icon: '🔬', description: 'Interactive physics experiments' },
    { name: 'Data Visualization', icon: '📊', description: 'Charts and data analysis' },
    { name: 'AI Experiment', icon: '🤖', description: 'Machine learning playground' },
    { name: 'Creative Coding', icon: '🎨', description: 'Generative art and visuals' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/lab" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">New Project</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Templates */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Quick Start Templates</h2>
          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => (
              <button
                key={template.name}
                type="button"
                onClick={() => {
                  setTitle(template.name);
                  setDescription(template.description);
                }}
                className="p-4 bg-card border border-border rounded-xl text-left hover:border-primary/50 transition-colors group"
              >
                <span className="text-2xl mb-2 block">{template.icon}</span>
                <span className="font-medium text-foreground block text-sm">{template.name}</span>
                <span className="text-xs text-muted-foreground">{template.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">or create from scratch</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Project"
              required
              className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[48px]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={4}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  visibility === 'private'
                    ? 'bg-primary/10 border-primary text-foreground'
                    : 'bg-card border-border text-foreground hover:border-primary/50'
                }`}
              >
                <Lock className={`w-5 h-5 mb-2 ${visibility === 'private' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium block text-sm">Private</span>
                <span className="text-xs text-muted-foreground">Only you can see</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  visibility === 'public'
                    ? 'bg-primary/10 border-primary text-foreground'
                    : 'bg-card border-border text-foreground hover:border-primary/50'
                }`}
              >
                <Globe className={`w-5 h-5 mb-2 ${visibility === 'public' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium block text-sm">Public</span>
                <span className="text-xs text-muted-foreground">Anyone can view</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !title}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FlaskConical className="w-5 h-5" />
                Create Project
              </>
            )}
          </button>
        </form>

        {/* Info Section */}
        <div className="mt-8 p-4 bg-muted/50 rounded-xl">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground mb-1">What can you build?</h3>
              <p className="text-sm text-muted-foreground">
                Labs are your personal workspace for experiments, simulations, data visualizations, 
                and creative coding projects. Add notebooks, embed widgets, attach files, and collaborate with others.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
