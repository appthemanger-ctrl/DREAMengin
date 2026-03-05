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
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {templates.map((template) => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => {
                    setTitle(template.name);
                    setDescription(template.description);
                  }}
                  style={{
                    padding: 16, borderRadius: 12,
                    border: '1px solid var(--de-border)',
                    background: 'var(--de-mist)',
                    textAlign: 'left', cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: 22, display: 'block', marginBottom: 6 }}>{template.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)', display: 'block' }}>{template.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{template.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--de-border)' }} />
          <span style={{ padding: '0 12px', fontSize: 12, color: 'var(--de-text-dim)' }}>or create from scratch</span>
          <div style={{ flex: 1, height: 1, background: 'var(--de-border)' }} />
        </div>

        {/* Create from scratch form */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Project Details</span></div>
          <form onSubmit={handleSubmit}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Visibility</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    style={{
                      padding: '12px 14px', borderRadius: 10,
                      border: `1px solid ${visibility === 'private' ? 'var(--de-accent)' : 'var(--de-border)'}`,
                      background: visibility === 'private' ? 'rgba(42,138,184,0.12)' : 'var(--de-mist)',
                      textAlign: 'left', cursor: 'pointer', minHeight: 44,
                    }}
                  >
                    <Lock className="w-4 h-4 mb-1" style={{ color: visibility === 'private' ? 'var(--de-accent)' : 'var(--de-text-dim)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, display: 'block', color: 'var(--de-heading)' }}>Private</span>
                    <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Only you can see</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    style={{
                      padding: '12px 14px', borderRadius: 10,
                      border: `1px solid ${visibility === 'public' ? 'var(--de-accent)' : 'var(--de-border)'}`,
                      background: visibility === 'public' ? 'rgba(42,138,184,0.12)' : 'var(--de-mist)',
                      textAlign: 'left', cursor: 'pointer', minHeight: 44,
                    }}
                  >
                    <Globe className="w-4 h-4 mb-1" style={{ color: visibility === 'public' ? 'var(--de-accent)' : 'var(--de-text-dim)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, display: 'block', color: 'var(--de-heading)' }}>Public</span>
                    <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Anyone can view</span>
                  </button>
                </div>
              </div>

              {error && <div className="de-notice error">{error}</div>}
            </div>
            <div className="de-widget-actions">
              <button
                type="submit"
                disabled={isLoading || !title}
                className="de-btn de-btn-primary"
                style={{ width: '100%', gap: 8 }}
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Creating…</>
                ) : (
                  <><FlaskConical className="w-5 h-5" /> Create Project</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="de-widget">
          <div className="de-widget-body">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--de-accent)', marginTop: 2 }} />
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--de-heading)' }}>What can you build?</h3>
                <p style={{ fontSize: 13, color: 'var(--de-text-dim)' }}>
                  Labs are your personal workspace for experiments, simulations, data visualizations,
                  and creative coding projects. Add notebooks, embed widgets, attach files, and collaborate with others.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
