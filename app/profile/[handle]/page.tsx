import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Music, ExternalLink, Store, FlaskConical, Edit2 } from 'lucide-react';

interface ProfilePageProps {
  params: Promise<{ handle: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;
  const supabase = await createServerClient();
  
  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  // Fetch profile by handle
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('handle', handle)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch public content
  const [{ data: music }, { data: merch }, { data: projects }] = await Promise.all([
    supabase
      .from('music_releases')
      .select('*')
      .eq('owner_id', profile.id)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('merch')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('projects')
      .select('*')
      .eq('owner_id', profile.id)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const isOwner = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Profile Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.handle}
                  width={128}
                  height={128}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-slate-500">
                    {(profile.display_name || profile.handle)?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {profile.display_name || profile.handle}
                  </h1>
                  <p className="text-lg text-slate-500">@{profile.handle}</p>
                </div>
                
                {isOwner && (
                  <Link
                    href="/edit-profile"
                    className="flex items-center px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Link>
                )}
              </div>

              {profile.bio && (
                <p className="mt-4 text-slate-600 max-w-xl">{profile.bio}</p>
              )}

              {/* Links */}
              {profile.links && profile.links.length > 0 && (
                <div className="mt-4 flex space-x-4">
                  {profile.links.map((link: any, index: number) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      {link.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="col-span-8 space-y-8">
            {/* Music Section */}
            {music && music.length > 0 && (
              <section>
                <div className="flex items-center mb-4">
                  <Music className="w-5 h-5 mr-2 text-slate-600" />
                  <h2 className="text-xl font-semibold text-slate-900">Music</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {music.map((track) => (
                    <div key={track.id} className="bg-white rounded-lg p-4 shadow-sm">
                      <h3 className="font-medium text-slate-900 mb-2">{track.title}</h3>
                      {track.embed_url && (
                        <iframe
                          src={track.embed_url}
                          width="100%"
                          height="80"
                          allow="autoplay; clipboard-write; encrypted-media"
                          className="rounded"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Lab Projects Section */}
            {projects && projects.length > 0 && (
              <section>
                <div className="flex items-center mb-4">
                  <FlaskConical className="w-5 h-5 mr-2 text-slate-600" />
                  <h2 className="text-xl font-semibold text-slate-900">Lab Projects</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/lab/${project.id}`}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-medium text-slate-900">{project.title}</h3>
                      {project.description && (
                        <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Merch Section */}
            {merch && merch.length > 0 && (
              <section>
                <div className="flex items-center mb-4">
                  <Store className="w-5 h-5 mr-2 text-slate-600" />
                  <h2 className="text-xl font-semibold text-slate-900">Merch</h2>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {merch.map((item) => (
                    <Link
                      key={item.id}
                      href="/shop"
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.title || ''}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                      )}
                      <h3 className="font-medium text-slate-900 text-sm">{item.title}</h3>
                      <p className="text-sm text-slate-600">${item.price}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3">Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Followers</span>
                  <span className="font-medium">123</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Following</span>
                  <span className="font-medium">45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Posts</span>
                  <span className="font-medium">89</span>
                </div>
              </div>
            </div>

            {/* Theme Preview */}
            {profile.theme && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-3">Theme</h3>
                <div 
                  className="w-full h-20 rounded-md"
                  style={{ backgroundColor: profile.theme.primary || '#1E3A5F' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
