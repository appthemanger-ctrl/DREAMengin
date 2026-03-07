'use client';

/**
 * CodeEngin — Side B control layer for the Code Daydream.
 *
 * Responsibilities (README spec §10.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - List the user's code projects from the `projects` table.
 *   - Surface entry points: New Project → /codespace, GitHub connector → /connectors.
 *   - Show a Deployments placeholder for future CI/CD integration.
 *
 * Security: filters projects by owner_id = auth.uid() on top of server-side RLS.
 * Follows AXIOM 3 (every element enables real action) and AXIOM 4 (security by default).
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Code2, FolderOpen, Rocket, Github } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface Project {
  id: string;
  title: string;
  visibility: string;
}

const ACCENT = '#3b7dd8';

export default function CodeEngin({ onBack }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user;
      if (!user || cancelled) { setLoading(false); return; }
      const { data } = await supabase
        .from('projects')
        .select('id, title, visibility')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15);
      if (!cancelled) {
        setProjects((data as Project[] | null) ?? []);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="de-sky-bg min-h-screen">

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full"
            style={{
              background: 'rgba(160,195,240,0.15)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Back to Code"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>

          <div
            style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg, ${ACCENT}, rgba(200,152,26,0.8))`,
            }}
          />

          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>
              CodeEngin
            </div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Code · Control Layer</div>
          </div>

          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
          >
            Side B
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>

        {/* Projects */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Projects</span>
            {projects.length > 0 && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${ACCENT}18`, color: ACCENT }}
              >
                {projects.length}
              </span>
            )}
          </div>

          <div className="de-widget-body">
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                Loading projects…
              </p>
            ) : projects.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                <FolderOpen className="w-6 h-6 flex-shrink-0" style={{ color: ACCENT, opacity: 0.3 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                    No projects yet
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                    Create your first project in Codespace.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {projects.map(p => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(160,195,240,0.18)',
                    }}
                  >
                    <Code2 className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT, opacity: 0.7 }} />
                    <span
                      style={{
                        flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                      }}
                    >
                      {p.title}
                    </span>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
                        padding: '2px 8px', borderRadius: 999,
                        background: p.visibility === 'public' ? 'rgba(34,197,94,0.12)' : 'rgba(160,195,240,0.18)',
                        color: p.visibility === 'public' ? '#22c55e' : 'var(--de-text-dim)',
                        border: p.visibility === 'public' ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(160,195,240,0.25)',
                      }}
                    >
                      {p.visibility === 'public' ? 'Public' : 'Private'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="de-widget-actions">
            <Link href="/codespace" className="de-btn de-btn-primary text-xs">
              + New Project
            </Link>
          </div>
        </div>

        {/* Deployments */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Deployments</span>
          </div>

          <div className="de-widget-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: `${ACCENT}12`,
                  border: `1px solid ${ACCENT}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Rocket className="w-5 h-5" style={{ color: ACCENT, opacity: 0.7 }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                  No deployments yet
                </div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.4 }}>
                  Connect GitHub or push a project to trigger deployments here.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GitHub Connector */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">GitHub</span>
          </div>

          <div className="de-widget-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(100,116,139,0.12)',
                  border: '1px solid rgba(100,116,139,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Github className="w-5 h-5" style={{ color: 'var(--de-heading)', opacity: 0.6 }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                  Not connected
                </div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                  Link GitHub to sync repositories and trigger builds.
                </div>
              </div>
            </div>
          </div>

          <div className="de-widget-actions">
            <Link href="/connectors" className="de-btn de-btn-ghost text-xs">
              Connect GitHub →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
