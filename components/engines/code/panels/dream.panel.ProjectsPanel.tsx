'use client';

/**
 * ProjectsPanel — Project manager for the Code Engine app.
 *
 * Lists Supabase projects, create new, open in codespace.
 * Lives at /engines/code/projects.
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { FolderOpen, Plus, ExternalLink, Loader2, RefreshCw, GitBranch, Clock } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  language?: string;
}

const LANG_COLORS: Record<string, string> = {
  python:     '#3b82f6',
  javascript: '#f59e0b',
  typescript: '#2563eb',
  rust:       '#ef4444',
  go:         '#06b6d4',
  default:    '#6366f1',
};

export default function ProjectsPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLang, setNewLang] = useState('typescript');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProjects() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error: err } = await supabase
      .from('projects')
      .select('id, title, description, created_at, language')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (err) setError(err.message);
    else setProjects(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadProjects(); }, []);

  async function createProject() {
    if (!newTitle.trim()) return;
    setCreating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }
    const { error: err } = await supabase.from('projects').insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      language: newLang,
      owner_id: user.id,
    });
    if (err) setError(err.message);
    else {
      setNewTitle('');
      setNewDesc('');
      setShowForm(false);
      await loadProjects();
    }
    setCreating(false);
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Projects</h1>
            <p className="text-sm text-white/50">Your code projects · open in Codespace</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadProjects}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowForm((f) => !f)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3ee]/20 hover:bg-[#22d3ee]/30 text-[#22d3ee] text-xs font-medium transition-all"
            >
              <Plus size={13} />
              New
            </button>
          </div>
        </div>

        {/* New project form */}
        {showForm && (
          <div className="mb-5 p-4 rounded-xl bg-white/[0.04] border border-[#22d3ee]/20">
            <h3 className="text-sm font-semibold text-white mb-3">New Project</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Project name"
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#22d3ee]/50"
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#22d3ee]/50"
              />
              <select
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#22d3ee]/50"
              >
                {Object.keys(LANG_COLORS).filter((l) => l !== 'default').map((l) => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={createProject}
                  disabled={creating || !newTitle.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#22d3ee] hover:bg-[#06b6d4] text-black text-sm font-bold transition-colors disabled:opacity-40"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create
                </button>
                <button onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-white/40 hover:text-white text-sm transition-colors">Cancel</button>
              </div>
            </div>
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#22d3ee]" />
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="text-center py-16 text-white/30 text-sm">
            <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
            No projects yet — create your first one above.
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="space-y-2">
            {projects.map((proj) => {
              const langColor = LANG_COLORS[proj.language ?? 'default'] ?? LANG_COLORS.default;
              return (
                <div
                  key={proj.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#22d3ee]/30 transition-all"
                >
                  <div
                    className="w-2 h-10 rounded-full flex-shrink-0"
                    style={{ background: langColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{proj.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {proj.language && (
                        <span className="text-xs" style={{ color: langColor }}>{proj.language}</span>
                      )}
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        <Clock size={10} />
                        {formatDate(proj.created_at)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/lab/${proj.id}/codespace`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#22d3ee]/10 text-white/50 hover:text-[#22d3ee] text-xs transition-all"
                  >
                    <ExternalLink size={12} />
                    Open
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
