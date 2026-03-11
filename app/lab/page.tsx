import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FlaskConical, Plus, Lock, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

// No demo projects - users see their actual projects only
const DEMO_PROJECTS: never[] = [];

type ProjectCard = {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  created_at: string;
  renderUrl?: string | null;
  isDemo?: boolean;
  profiles?: { handle: string; display_name: string | null; avatar_url: string | null } | null;
};

function VisibilityBadge({ visibility }: { visibility: string }) {
  const isPublic = visibility === 'public';
  return (
    <span
      className="de-tag flex items-center gap-1"
      style={{
        color: isPublic ? '#34d399' : 'var(--de-text-dim)',
        background: isPublic ? 'rgba(52,211,153,0.12)' : 'var(--de-mist)',
        border: `1px solid ${isPublic ? 'rgba(52,211,153,0.3)' : 'var(--de-border)'}`,
        fontSize: 10,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 6,
      }}
    >
      {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
      {visibility}
    </span>
  );
}

function ProjectCard({ project, showIframe = true }: { project: ProjectCard; showIframe?: boolean }) {
  return (
    <div className="de-widget" style={{ overflow: 'hidden' }}>
      {showIframe && project.renderUrl && (
        <div style={{ height: 120, overflow: 'hidden', borderBottom: '1px solid var(--de-border)', pointerEvents: 'none' }}>
          <iframe
            src={project.renderUrl}
            width="100%"
            height="120"
            style={{ border: 'none', display: 'block', pointerEvents: 'none' }}
            sandbox="allow-scripts"
            title={project.title}
          />
        </div>
      )}
      <div className="de-widget-body">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="font-bold" style={{ color: 'var(--de-heading)', fontSize: 15 }}>{project.title}</div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <VisibilityBadge visibility={project.visibility} />
          </div>
        </div>
        {project.description && (
          <p className="line-clamp-2 text-sm mb-3" style={{ color: 'var(--de-text-dim)' }}>{project.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
            {new Date(project.created_at).toLocaleDateString()}
          </span>
          <Link
            href={`/lab/${project.id}/codespace`}
            className="de-btn de-btn-ghost"
            style={{ fontSize: 12, padding: '4px 12px' }}
          >
            Open CodeSpace →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function LabPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's projects
  const { data: myProjectsData } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch public projects
  const { data: publicProjectsData } = await supabase
    .from('projects')
    .select(`
      *,
      profiles!inner(handle, display_name, avatar_url)
    `)
    .eq('visibility', 'public')
    .not('owner_id', 'eq', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const myProjects: ProjectCard[] = myProjectsData ?? [];
  const publicProjects: ProjectCard[] = publicProjectsData ?? [];
  const displayMyProjects: ProjectCard[] = myProjects;

  const featuredRenders: ProjectCard[] = [];

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <FlaskConical className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--de-heading)' }}>Lab</h1>
          <Link href="/lab/new" className="de-btn de-btn-primary flex items-center gap-2" style={{ fontSize: 13, padding: '6px 14px' }}>
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* My Projects */}
        <section>
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">My Projects</span>
            </div>
            <div className="de-widget-body">
              {displayMyProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {displayMyProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} showIframe />
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm py-8" style={{ color: 'var(--de-text-dim)' }}>
                  No projects yet. Create your first project to get started.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Featured Renders - hidden when no featured renders available */}
        {featuredRenders.length > 0 && (
          <section>
            <div className="de-widget">
              <div className="de-widget-header">
                <span className="de-widget-title">Featured Renders</span>
              </div>
              <div className="de-widget-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredRenders.map((project) => (
                    <div key={project.id} className="de-widget" style={{ overflow: 'hidden' }}>
                      <div style={{ height: 180, overflow: 'hidden', borderBottom: '1px solid var(--de-border)', pointerEvents: 'none' }}>
                        <iframe
                          src={project.renderUrl ?? ''}
                          width="100%"
                          height="180"
                          style={{ border: 'none', display: 'block', pointerEvents: 'none' }}
                          sandbox="allow-scripts"
                          title={project.title}
                        />
                      </div>
                      <div className="de-widget-body">
                        <div className="font-bold mb-1" style={{ color: 'var(--de-heading)', fontSize: 14 }}>{project.title}</div>
                        <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{project.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Public Projects */}
        {publicProjects.length > 0 && (
          <section>
            <div className="de-widget">
              <div className="de-widget-header">
                <span className="de-widget-title">Public Projects</span>
              </div>
              <div className="de-widget-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publicProjects.map((project) => (
                    <div key={project.id} className="de-widget">
                      <div className="de-widget-body">
                        <div className="flex items-center gap-2 mb-2">
                          {project.profiles?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={project.profiles.avatar_url} alt={project.profiles.display_name ?? project.profiles.handle} className="w-7 h-7 rounded-full" />
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--de-mist)', color: 'var(--de-heading)' }}>
                              {(project.profiles?.display_name ?? project.profiles?.handle)?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium" style={{ color: 'var(--de-text-dim)' }}>
                            {project.profiles?.display_name ?? project.profiles?.handle}
                          </span>
                        </div>
                        <div className="font-bold mb-1" style={{ color: 'var(--de-heading)', fontSize: 15 }}>{project.title}</div>
                        {project.description && (
                          <p className="text-sm line-clamp-2" style={{ color: 'var(--de-text-dim)' }}>{project.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
