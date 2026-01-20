import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, UserPlus } from 'lucide-react';

export default async function DiscoverPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all public profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .not('id', 'eq', user?.id || '');

  // Fetch recent public posts
  const { data: posts } = await supabase
    .from('app_posts')
    .select(`
      *,
      profiles!inner(handle, display_name, avatar_url)
    `)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users and posts..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="col-span-8">
            {/* Friend Suggestions */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Find Friends</h2>
              <div className="grid grid-cols-3 gap-4">
                {profiles?.slice(0, 6).map((profile) => (
                  <div key={profile.id} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex flex-col items-center">
                      {profile.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={profile.display_name || profile.handle}
                          width={64}
                          height={64}
                          className="rounded-full object-cover mb-3"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                          <span className="text-xl font-bold text-slate-500">
                            {(profile.display_name || profile.handle)?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <h3 className="font-medium text-slate-900 text-center">
                        {profile.display_name || profile.handle}
                      </h3>
                      <p className="text-sm text-slate-500 text-center mb-3">
                        @{profile.handle}
                      </p>
                      <Link
                        href={`/profile/${profile.handle}`}
                        className="w-full text-center px-3 py-1 bg-slate-800 text-white text-sm rounded-md hover:bg-slate-700"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Public Posts */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Posts</h2>
              <div className="space-y-4">
                {posts?.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-start space-x-3">
                      {post.profiles?.avatar_url ? (
                        <Image
                          src={post.profiles.avatar_url}
                          alt={post.profiles.display_name || post.profiles.handle || ''}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-slate-500">
                            {(post.profiles?.display_name || post.profiles?.handle)?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Link
                            href={`/profile/${post.profiles?.handle}`}
                            className="font-medium text-slate-900 hover:underline"
                          >
                            {post.profiles?.display_name || post.profiles?.handle}
                          </Link>
                          <span className="text-sm text-slate-500">
                            @{post.profiles?.handle}
                          </span>
                        </div>
                        <p className="text-slate-700">{post.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3">Categories</h3>
              <div className="space-y-2">
                <Link href="/discover?category=science" className="block text-sm text-slate-600 hover:text-slate-900">
                  Science
                </Link>
                <Link href="/discover?category=music" className="block text-sm text-slate-600 hover:text-slate-900">
                  Music
                </Link>
                <Link href="/discover?category=tech" className="block text-sm text-slate-600 hover:text-slate-900">
                  Technology
                </Link>
                <Link href="/discover?category=art" className="block text-sm text-slate-600 hover:text-slate-900">
                  Art
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}