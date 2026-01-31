import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Sparkles, Users, Zap, Shield, ArrowRight, Music, Beaker } from 'lucide-react';

export default async function DiscoverPage() {
  const supabase = await createServerClient();
  
  let user = null;
  let profiles = null;
  let posts = null;
  
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;

    // Fetch all public profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .not('id', 'eq', user?.id || '');
    profiles = profilesData;

    // Fetch recent public posts
    const { data: postsData } = await supabase
      .from('app_posts')
      .select(`
        *,
        profiles!inner(handle, display_name, avatar_url)
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(20);
    posts = postsData;
  } catch {
    // Supabase not configured
  }

  const categories = [
    { name: 'Science', slug: 'science', icon: Zap, color: 'from-yellow-500 to-orange-500' },
    { name: 'Music', slug: 'music', icon: Music, color: 'from-pink-500 to-rose-500' },
    { name: 'Technology', slug: 'tech', icon: Shield, color: 'from-cyan-500 to-blue-500' },
    { name: 'Labs', slug: 'labs', icon: Beaker, color: 'from-purple-500 to-violet-500' },
  ];

  return (
    <div className="min-h-screen bg-universe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl glass-dark p-6 md:p-10 mb-8">
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Dr. Eams mascot */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-pink-500/30 blur-2xl scale-125" />
              <Image
                src="/dr-eams.jpeg"
                alt="Dr. Eams"
                width={160}
                height={160}
                className="relative w-32 h-32 md:w-40 md:h-40 object-contain animate-float-gentle animate-glow-pulse"
                priority
              />
            </div>
            
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center cosmic-glow">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">Dream</span>
                  <span>Engin</span>
                </h1>
              </div>
              <p className="mt-3 text-base md:text-lg text-white/60 max-w-xl leading-relaxed">
                Your privacy-first creator OS with AI-powered tools, social connections, and infinite possibilities.
              </p>
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                <Link 
                  href="/login" 
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all cosmic-glow min-h-[48px] active:scale-95"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/home" 
                  className="inline-flex items-center justify-center px-6 py-3 glass-dark text-white font-medium rounded-xl hover:bg-white/10 border border-white/10 transition-all min-h-[48px] active:scale-95"
                >
                  Continue
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search users and posts..."
              className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-[44px]"
            />
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 order-2 lg:order-1">
            {/* Friend Suggestions */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Find Friends</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profiles?.slice(0, 6).map((profile) => (
                  <div key={profile.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                    <div className="flex flex-col items-center">
                      {profile.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={profile.display_name || profile.handle}
                          width={64}
                          height={64}
                          className="rounded-full object-cover mb-3 ring-2 ring-border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-3 ring-2 ring-border">
                          <span className="text-xl font-bold text-muted-foreground">
                            {(profile.display_name || profile.handle)?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <h3 className="font-medium text-foreground text-center text-sm">
                        {profile.display_name || profile.handle}
                      </h3>
                      <p className="text-xs text-muted-foreground text-center mb-3">
                        @{profile.handle}
                      </p>
                      <Link
                        href={`/profile/${profile.handle}`}
                        className="w-full text-center px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors min-h-[44px] flex items-center justify-center"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              {(!profiles || profiles.length === 0) && (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No creators to show yet</p>
                </div>
              )}
            </section>

            {/* Recent Public Posts */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Recent Posts</h2>
              <div className="space-y-4">
                {posts?.map((post) => (
                  <div key={post.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-start gap-3">
                      {post.profiles?.avatar_url ? (
                        <Image
                          src={post.profiles.avatar_url}
                          alt={post.profiles.display_name || post.profiles.handle || ''}
                          width={40}
                          height={40}
                          className="rounded-full object-cover ring-2 ring-border flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center ring-2 ring-border flex-shrink-0">
                          <span className="text-sm font-bold text-muted-foreground">
                            {(post.profiles?.display_name || post.profiles?.handle)?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Link
                            href={`/profile/${post.profiles?.handle}`}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {post.profiles?.display_name || post.profiles?.handle}
                          </Link>
                          <span className="text-sm text-muted-foreground">
                            @{post.profiles?.handle}
                          </span>
                        </div>
                        <p className="text-secondary-foreground leading-relaxed">{post.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!posts || posts.length === 0) && (
                  <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No posts to show yet</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 order-1 lg:order-2">
            <div className="bg-card border border-border rounded-xl p-5 sticky top-6">
              <h3 className="font-semibold text-foreground mb-4">Categories</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <Link 
                    key={category.slug}
                    href={`/discover?category=${category.slug}`} 
                    className="flex items-center gap-3 px-3 py-2.5 text-secondary-foreground hover:bg-secondary hover:text-foreground rounded-lg transition-colors min-h-[44px]"
                  >
                    <category.icon className="w-4 h-4 text-muted-foreground" />
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
