import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, Download, Code, FileText, Terminal } from 'lucide-react';

interface LabProjectPageProps {
  params: Promise<{ id: string }>;
}

type Profile = {
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Attachment = {
  id: string;
  name: string;
  storage_path: string;
};

type Project = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  visibility: string;
  created_at: string;

  profiles: Profile | null;
  attachments: Attachment[] | null;
};

export const dynamic = 'force-dynamic';

export default async function LabProjectPage({ params }: LabProjectPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // NOTE: Notebooks aren't set up yet, so we do NOT query them here.
  // This prevents runtime/db errors while you're still building the feature.
  const { data: projectRaw, error } = await supabase
    .from('projects')
    .select(
      `
      id,
      owner_id,
      title,
      description,
      visibility,
      created_at,
      profiles(handle, display_name, avatar_url),
      attachments(id, name, storage_path)
    `
    )
    .eq('id', id)
    .single();

  if (error || !projectRaw) {
    notFound();
  }

  const project = projectRaw as unknown as Project;

  const isOwner = user?.id === project.owner_id;

  // Simple access rule until members table exists:
  // owner can view anything, others only public projects
  const hasAccess = isOwner || project.visibility === 'public';

  if (!hasAccess) {
    redirect('/lab');
  }

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/lab" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <FlaskConical className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold flex-1 truncate" style={{ color: 'var(--de-heading)' }}>{project.title}</h1>
          <div className="flex items-center gap-2">
            <Link
              href={`/lab/${project.id}/codespace`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              <Terminal size={14} />
              Open CodeSpace
            </Link>
            {isOwner && (
              <Link href={`/lab/${project.id}/edit`} className="de-btn de-btn-ghost" style={{ fontSize: 13, padding: '6px 14px' }}>
                Edit Project
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">

          {/* Main Content */}
          <div className="col-span-12 md:col-span-8 space-y-6">

            {/* Renders & Simulations */}
            <div className="de-widget">
              <div className="de-widget-header">
                <span className="de-widget-title flex items-center gap-2">
                  <Code className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                  Renders &amp; Simulations
                </span>
              </div>
              <div className="de-widget-body space-y-4">
                <div style={{ border: '1px solid var(--de-border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div className="de-widget-body" style={{ paddingBottom: 8 }}>
                    <div className="font-medium text-sm mb-2" style={{ color: 'var(--de-heading)' }}>Physics Simulation</div>
                  </div>
                  <iframe
                    src="https://phet.colorado.edu/sims/html/waves-intro/latest/waves-intro_en.html"
                    width="100%"
                    height="400"
                    style={{ border: 'none', display: 'block' }}
                    title="Waves Intro Simulation"
                  />
                </div>

                <div style={{ border: '1px solid var(--de-border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div className="de-widget-body" style={{ paddingBottom: 8 }}>
                    <div className="font-medium text-sm mb-2" style={{ color: 'var(--de-heading)' }}>Circuit Builder</div>
                  </div>
                  <iframe
                    src="https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html"
                    width="100%"
                    height="400"
                    style={{ border: 'none', display: 'block' }}
                    title="Circuit Construction Kit DC"
                  />
                </div>
              </div>
            </div>

            {/* Notebooks */}
            <div className="de-widget">
              <div className="de-widget-header">
                <span className="de-widget-title flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                  Notebooks
                </span>
              </div>
              <div className="de-widget-body">
                <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>
                  Notebooks aren&apos;t enabled yet. (We&apos;ll wire this up after the Supabase table + policies exist.)
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-12 md:col-span-4 space-y-6">

            {/* Attachments */}
            <div className="de-widget">
              <div className="de-widget-header">
                <span className="de-widget-title flex items-center gap-2">
                  <Download className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                  Attachments
                </span>
              </div>
              <div className="de-widget-body">
                {(project.attachments ?? []).length > 0 ? (
                  <div className="space-y-1">
                    {(project.attachments ?? []).map((attachment: Attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.storage_path}
                        className="de-row"
                        style={{ textDecoration: 'none' }}
                      >
                        <Download className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--de-text-dim)' }} />
                        <span className="text-sm truncate" style={{ color: 'var(--de-text)' }}>{attachment.name}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>No attachments</p>
                )}
              </div>
            </div>

            {/* Project Info */}
            <div className="de-widget">
              <div className="de-widget-header">
                <span className="de-widget-title">Project Info</span>
              </div>
              <div className="de-widget-body space-y-3">
                <div className="de-row">
                  <span className="text-sm" style={{ color: 'var(--de-text-dim)' }}>Visibility</span>
                  <span className="text-sm font-semibold capitalize" style={{ color: 'var(--de-heading)' }}>{project.visibility}</span>
                </div>
                <div className="de-row">
                  <span className="text-sm" style={{ color: 'var(--de-text-dim)' }}>Created</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="de-row">
                  <span className="text-sm" style={{ color: 'var(--de-text-dim)' }}>Attachments</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{(project.attachments ?? []).length}</span>
                </div>
                {project.profiles?.handle && (
                  <div className="de-row">
                    <span className="text-sm" style={{ color: 'var(--de-text-dim)' }}>Author</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--de-accent)' }}>@{project.profiles.handle}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
