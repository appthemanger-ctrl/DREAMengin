import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FlaskConical, Plus, Lock, Globe } from 'lucide-react';

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

  // Demo projects when no real data exists
  const demoMyProjects = [
    {
      id: 'demo-my-1',
      title: 'Quantum Particle Simulator',
      description: 'Interactive visualization of quantum particle behavior using wave functions.',
      visibility: 'public',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
    },
    {
      id: 'demo-my-2',
      title: 'Neural Network Playground',
      description: 'Build and train simple neural networks in the browser.',
      visibility: 'private',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
    },
  ];

  const demoPublicProjects = [
    {
      id: 'demo-pub-1',
      title: 'Solar System Model',
      description: 'Interactive 3D model of our solar system with real orbital data.',
      visibility: 'public',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      profiles: { handle: 'astro', display_name: 'Astro Labs', avatar_url: null }
    },
    {
      id: 'demo-pub-2',
      title: 'DNA Sequencer',
      description: 'Visualize DNA sequences and find patterns in genetic code.',
      visibility: 'public',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      profiles: { handle: 'biotech', display_name: 'BioTech Research', avatar_url: null }
    },
    {
      id: 'demo-pub-3',
      title: 'Climate Data Explorer',
      description: 'Analyze historical climate data and visualize trends.',
      visibility: 'public',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      profiles: { handle: 'climate', display_name: 'Climate Watch', avatar_url: null }
    },
    {
      id: 'demo-pub-4',
      title: 'Music Theory Toolkit',
      description: 'Learn music theory with interactive chord and scale visualizations.',
      visibility: 'public',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
      profiles: { handle: 'musiclab', display_name: 'Music Lab', avatar_url: null }
    },
  ];

  const myProjects = myProjectsData && myProjectsData.length > 0 ? myProjectsData : demoMyProjects;
  const publicProjects = publicProjectsData && publicProjectsData.length > 0 ? publicProjectsData : demoPublicProjects;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <FlaskConical className="w-8 h-8 mr-3 text-slate-700" />
            <h1 className="text-3xl font-bold text-slate-900">Lab</h1>
          </div>
          <Link
            href="/lab/new"
            className="flex items-center bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* My Projects */}
          <div className="col-span-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">My Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {myProjects?.map((project) => (
                <Link
                  key={project.id}
                  href={`/lab/${project.id}`}
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">{project.title}</h3>
                    <span className={`flex items-center text-xs ${
                      project.visibility === 'public' ? 'text-green-600' : 'text-slate-500'
                    }`}>
                      {project.visibility === 'public' ? (
                        <Globe className="w-3 h-3 mr-1" />
                      ) : (
                        <Lock className="w-3 h-3 mr-1" />
                      )}
                      {project.visibility}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-3">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>

            {/* Public Projects */}
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Explore Public Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicProjects?.map((project) => (
                <Link
                  key={project.id}
                  href={`/lab/${project.id}`}
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center mb-3">
                    {project.profiles?.avatar_url ? (
                      <img
                        src={project.profiles.avatar_url}
                        alt={project.profiles.display_name || project.profiles.handle}
                        className="w-8 h-8 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-bold text-slate-500">
                          {(project.profiles?.display_name || project.profiles?.handle)?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-700">
                      {project.profiles?.display_name || project.profiles?.handle}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{project.title}</h3>
                  {project.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
              <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/lab/new"
                  className="block px-4 py-2 bg-slate-800 text-white text-sm rounded-md hover:bg-slate-700 text-center"
                >
                  Create New Project
                </Link>
                <Link
                  href="/lab/templates"
                  className="block px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50 text-center"
                >
                  Browse Templates
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3">Project Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Projects</span>
                  <span className="font-medium">{myProjects?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Public</span>
                  <span className="font-medium">
                    {myProjects?.filter(p => p.visibility === 'public').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Private</span>
                  <span className="font-medium">
                    {myProjects?.filter(p => p.visibility === 'private').length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Demo banner when showing demo items */}
            {(!myProjectsData || myProjectsData.length === 0) && (
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
                <p className="text-sm text-purple-700 font-medium">
                  These are sample projects. Create your first project to get started!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
