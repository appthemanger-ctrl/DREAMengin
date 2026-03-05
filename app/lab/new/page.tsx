'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, Loader2, Globe, Lock, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function NewProjectPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
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
    <div className="de-sky-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/lab" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <FlaskConical className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>New Project</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        {/* Quick Start Templates */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Quick Start Templates</span></div>
          <div className="de-widget-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {templates.map((template) => (
              <button
                key={template.name}
                type="button"
                onClick={() => {
                  setTitle(template.name);
                  setDescription(template.description);
                }}
                style={{
                  padding: '14px 12px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(160,195,240,0.3)',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--de-accent)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(160,195,240,0.3)'; }}
              >
                <span style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>{template.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', display: 'block', marginBottom: 2 }}>{template.name}</span>
                <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{template.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(160,195,240,0.25)' }} />
          <span style={{ fontSize: 12, color: 'var(--de-text-dim)', fontWeight: 500 }}>or create from scratch</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(160,195,240,0.25)' }} />
        </div>

        {/* Project form */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Project Details</span></div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Title */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Project Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Awesome Project"
                required
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', minHeight: 48 }}
              />
            </label>

            {/* Description */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={4}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)', fontSize: 14, outline: 'none', resize: 'none' }}
              />
            </label>

            {/* Visibility */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Visibility</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  style={{
                    padding: '14px 12px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', border: 'none',
                    background: visibility === 'private' ? 'rgba(42,138,184,0.12)' : 'rgba(255,255,255,0.4)',
                    outline: visibility === 'private' ? '1.5px solid var(--de-accent)' : '1px solid rgba(160,195,240,0.3)',
                  }}
                >
                  <Lock className="w-5 h-5 mb-1.5" style={{ color: visibility === 'private' ? 'var(--de-accent)' : 'var(--de-text-dim)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', display: 'block' }}>Private</span>
                  <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Only you can see</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  style={{
                    padding: '14px 12px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', border: 'none',
                    background: visibility === 'public' ? 'rgba(42,138,184,0.12)' : 'rgba(255,255,255,0.4)',
                    outline: visibility === 'public' ? '1.5px solid var(--de-accent)' : '1px solid rgba(160,195,240,0.3)',
                  }}
                >
                  <Globe className="w-5 h-5 mb-1.5" style={{ color: visibility === 'public' ? 'var(--de-accent)' : 'var(--de-text-dim)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', display: 'block' }}>Public</span>
                  <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Anyone can view</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="de-notice" style={{ background: 'rgba(220,68,68,0.08)', borderColor: 'rgba(220,68,68,0.25)', color: '#dc4444' }}>
                {error}
              </div>
            )}
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !title}
              className="de-btn de-btn-primary"
              style={{ width: '100%', gap: 8 }}
            >
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating…</> : <><FlaskConical className="w-5 h-5" /> Create Project</>}
            </button>
          </div>
        </div>

        {/* What can you build */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Sparkles className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">What can you build?</span>
          </div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
              Labs are your personal workspace for experiments, simulations, data visualizations,
              and creative coding projects. Add notebooks, embed widgets, attach files, and collaborate with others.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
