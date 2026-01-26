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
    <div className="min-h-screen py-8">
      {/* Hero section using the swirling water world image to make the page feel alive */}
      <section className="relative h-64 md:h-80 lg:h-96 w-full mb-12 overflow-hidden rounded-lg shadow-lg">
        {/* Background image filling the container */}
        <Image
          src="/hero.jpg"
          alt="Dream world"
          fill
          sizes="100vw"
          priority
          className="object-cover object-center"
        />
        {/* Overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent"></div>
        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
            Explore New Dreams
          </h1>
          <p className="max-w-2xl text-sm md:text-lg text-gray-200/90">
            Dive into a universe of curated content and discover creators that inspire you. Your journey starts here.
          </p>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users and posts..."
              className="w-full pl-10 pr-4 py-3 bg-slate-700/60 text-gray-100 placeholder-gray-500 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8">
            {/* Friend Suggestions */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Find Friends</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles?.slice(0, 6).map((profile) => (
                  <div key={profile.id} className="bg-slate-800/60 backdrop-blur-lg border border-slate-700 rounded-lg p-4 shadow-md">
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
                        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-3 border border-slate-600">
                          <span className="text-xl font-bold text-gray-400">
                            {(profile.display_name || profile.handle)?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <h3 className="font-medium text-gray-100 text-center">
                        {profile.display_name || profile.handle}
                      </h3>
                      <p className="text-sm text-gray-400 text-center mb-3">
                        @{profile.handle}
                      </p>
                      <Link
                        href={`/profile/${profile.handle}`}
                        className="w-full text-center px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
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
              <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
              <div className="space-y-4">
                {posts?.map((post) => (
                  <div key={post.id} className="bg-slate-800/60 backdrop-blur-lg border border-slate-700 rounded-lg p-4 shadow-md">
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
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600">
                          <span className="text-sm font-bold text-gray-400">
                            {(post.profiles?.display_name || post.profiles?.handle)?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Link
                            href={`/profile/${post.profiles?.handle}`}
                            className="font-medium text-gray-100 hover:underline"
                          >
                            {post.profiles?.display_name || post.profiles?.handle}
                          </Link>
                          <span className="text-sm text-gray-400">
                            @{post.profiles?.handle}
                          </span>
                        </div>
                        <p className="text-gray-300">{post.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4 mt-8 lg:mt-0">
            <div className="bg-slate-800/60 backdrop-blur-lg border border-slate-700 rounded-lg p-4 shadow-md">
              <h3 className="font-semibold mb-3">Categories</h3>
              <div className="space-y-2">
                <Link href="/discover?category=science" className="block text-sm text-gray-300 hover:text-purple-400 transition-colors">
                  Science
                </Link>
                <Link href="/discover?category=music" className="block text-sm text-gray-300 hover:text-purple-400 transition-colors">
                  Music
                </Link>
                <Link href="/discover?category=tech" className="block text-sm text-gray-300 hover:text-purple-400 transition-colors">
                  Technology
                </Link>
                <Link href="/discover?category=art" className="block text-sm text-gray-300 hover:text-purple-400 transition-colors">
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