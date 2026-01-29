\begin{verbatim}
import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { FlaskConical, Download, Plus, Code, FileText } from 'lucide-react';

interface LabProjectPageProps {
  params: { id: string };
}

type Profile = {
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Notebook = {
  id: string;
  version: number;
  created_at: string;
  content: string | null;
};

type Attachment = {
  id: string;
  name: string;
  storage_path: string;
};

type ProjectMember = {
  user_id: string;
};

type Project = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  visibility: string;
  created_at: string;

  profiles: Profile | null;
  notebooks: Notebook[] | null;
  attachments: Attachment[] | null;
  project_members: ProjectMember[] | null;
};

export default async function LabProjectPage({ params }: LabProjectPageProps) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // IMPORTANT: include project_members so access checks work + avoid undefined typing
  const { data: project, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      profiles(handle, display_name, avatar_url),
      notebooks(*),
      attachments(*),
      project_members(user_id)
    `
    )
    .eq('id', params.id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Cast once, so the rest of the file is strongly typed
  const typedProject = project as unknown as Project;

  const isOwner = user?.id === typedProject.owner_id;

  const hasAccess =
    isOwner ||
    typedProject.visibility === 'public' ||
    (!!user &&
      (typedProject.project_members ?? []).some(
        (m: ProjectMember) => m.user_id === user.id
      ));

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
                  by @{typedProject.profiles?.handle ?? 'unknown'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {typedProject.title}
              </h1>
              {typedProject.description && (
                <p className="text-slate-600 max-w-2xl">
                  {typedProject.description}
                </p>
              )}
            </div>
            {isOwner && (
              <Link
                href={`/lab/${typedProject.id}/edit`}
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
            {/* Notebooks */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Notebooks
                </h2>
                {isOwner && (
                  <Link
                    href={`/lab/${typedProject.id}/notebook/new`}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Notebook
                  </Link>
                )}
              </div>

              <div className="space-y-3">
                {(typedProject.notebooks ?? []).map((notebook: Notebook) => (
                  <Link
                    key={notebook.id}
                    href={`/lab/${typedProject.id}/notebook/${notebook.id}`}
                    className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">
                        Notebook v{notebook.version}
                      </span>
                      <span className="text-sm text-slate-500">
                        {new Date(notebook.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {notebook.content && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {notebook.content.slice(0, 150)}...
                      </p>
                    )}
                  </Link>
                ))}

                {(typedProject.notebooks ?? []).length === 0 && (
                  <p className="text-sm text-slate-500">No notebooks</p>
                )}
              </div>
            </div>

            {/* Widgets/Embeds */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center mb-4">
                <Code className="w-5 h-5 mr-2" />
                Widgets & Simulations
              </h2>
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-2">
                    Physics Simulation
                  </h3>
                  <iframe
                    src="https://phet.colorado.edu/sims/html/waves-intro/latest/waves-intro_en.html"
                    width="100%"
                    height="400"
                    className="border border-slate-300 rounded"
                    title="Waves Intro Simulation"
                  />
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-2">
                    Circuit Builder
                  </h3>
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
                {(typedProject.attachments ?? []).map(
                  (attachment: Attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.storage_path}
                      className="flex items-center p-2 hover:bg-slate-50 rounded text-sm"
                    >
                      <Download className="w-4 h-4 mr-2 text-slate-400" />
                      <span className="text-slate-700 truncate">
                        {attachment.name}
                      </span>
                    </a>
                  )
                )}

                {(typedProject.attachments ?? []).length === 0 && (
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
                  <span className="font-medium capitalize">
                    {typedProject.visibility}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Created</span>
                  <span className="font-medium">
                    {new Date(typedProject.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Notebooks</span>
                  <span className="font-medium">
                    {(typedProject.notebooks ?? []).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Attachments</span>
                  <span className="font-medium">
                    {(typedProject.attachments ?? []).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
\end{verbatim}
