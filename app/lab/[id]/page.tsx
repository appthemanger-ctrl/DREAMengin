import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { FlaskConical, Download, Code, FileText } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center mb-3">
                <FlaskConical className="w-6 h-6 mr-2 text-slate-600" />
                <span className="text-sm text-slate-500">
                  by @{project.profiles?.handle ?? 'unknown'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.title}</h1>
              {project.description && (
                <p className="text-slate-600 max-w-2xl">{project.description}</p>
              )}
            </div>

            {isOwner && (
              <Link
                href={`/lab/${project.id}/edit`}
                className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
              >
                Edit Project
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="col-span-8">
            {/* Notebooks (not enabled yet) */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Notebooks
                </h2>
              </div>

              <p className="text-sm text-slate-500">
                Notebooks aren’t enabled yet. (We’ll wire this up after the Supabase table + policies exist.)
              </p>
            </div>

            {/* Widgets/Embeds */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center mb-4">
                <Code className="w-5 h-5 mr-2" />
                Widgets & Simulations
              </h2>

              <div className="space-y-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-2">Physics Simulation</h3>
                  <iframe
                    src="https://phet.colorado.edu/sims/html/waves-intro/latest/waves-intro_en.html"
                    width="100%"
                    height="400"
                    className="border border-slate-300 rounded"
                    title="Waves Intro Simulation"
                  />
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-2">Circuit Builder</h3>
                  <iframe
                    src="https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html"
                    width="100%"
                    height="400"
                    className="border border-slate-300 rounded"
                    title="Circuit Construction Kit DC"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-4">
            {/* Attachments */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Attachments
              </h3>

              <div className="space-y-2">
                {(project.attachments ?? []).map((attachment: Attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.storage_path}
                    className="flex items-center p-2 hover:bg-slate-50 rounded text-sm"
                  >
                    <Download className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="text-slate-700 truncate">{attachment.name}</span>
                  </a>
                ))}

                {(project.attachments ?? []).length === 0 && (
                  <p className="text-sm text-slate-500">No attachments</p>
                )}
              </div>
            </div>

            {/* Project Info */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3">Project Info</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Visibility</span>
                  <span className="font-medium capitalize">{project.visibility}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Created</span>
                  <span className="font-medium">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Attachments</span>
                  <span className="font-medium">{(project.attachments ?? []).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
