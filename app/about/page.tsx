import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Sparkles, 
  Shield, 
  Users, 
  Music, 
  Beaker, 
  MessageCircle,
  ShoppingBag,
  BarChart3,
  Settings,
  Globe,
  Lock,
  Cpu,
  Heart,
  ArrowRight,
  Twitter
} from 'lucide-react';
import { StarsBackground } from '@/components/StarsBackground';

export default function AboutPage() {

  const features = [
    {
      icon: Shield,
      title: 'Privacy-First',
      description: 'Your data belongs to you. End-to-end encryption, no tracking, no selling your info. We built DreamEngin to respect your privacy at every level.',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Cpu,
      title: 'AI-Powered Tools',
      description: 'Inner Dreams AI helps you create, organize, and explore. Get intelligent suggestions, automate tasks, and unlock your creative potential.',
      color: 'from-purple-500 to-violet-600'
    },
    {
      icon: Users,
      title: 'Social Connections',
      description: 'Discover and connect with creators who share your passions. Follow, message, collaborate, and build your community.',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Music,
      title: 'Music Integration',
      description: 'Share your music, embed tracks from YouTube and Spotify, and showcase your sound. Perfect for artists, producers, and music lovers.',
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: Beaker,
      title: 'Creative Labs',
      description: 'Build and share interactive experiments. Physics simulations, data visualizations, AI projects - your playground for innovation.',
      color: 'from-violet-500 to-purple-600'
    },
    {
      icon: ShoppingBag,
      title: 'Merch Shop',
      description: 'Sell your creations directly to your audience. Set up your store, list items, and earn from your work - all within the platform.',
      color: 'from-orange-500 to-amber-600'
    },
  ];

  const pages = [
    { name: 'Home Dashboard', path: '/home', icon: Sparkles, description: 'Your personalized feed with posts from people you follow, AI insights, and quick access to everything.' },
    { name: 'Discover', path: '/discover', icon: Globe, description: 'Find new creators, trending content, and expand your network.' },
    { name: 'Messages', path: '/messages', icon: MessageCircle, description: 'Direct messaging with end-to-end encryption. Chat privately with anyone.' },
    { name: 'Music', path: '/music', icon: Music, description: 'Browse and share music. Upload your own or embed from streaming platforms.' },
    { name: 'Shop', path: '/shop', icon: ShoppingBag, description: 'Buy and sell merch, digital goods, and creator products.' },
    { name: 'Labs', path: '/lab', icon: Beaker, description: 'Create and explore interactive experiments and scientific visualizations.' },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, description: 'Track your growth, engagement, and audience insights.' },
    { name: 'Settings', path: '/settings', icon: Settings, description: 'Customize your experience, manage privacy, and configure your account.' },
  ];

  return (
    <div className="min-h-screen bg-universe relative overflow-hidden">
      {/* Stars background */}
      <StarsBackground />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-universe/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors p-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all text-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 pb-20">
        
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-pink-500/30 blur-2xl scale-150" />
              <Image
                src="/dr-eams.jpeg"
                alt="Dr. Eams"
                width={160}
                height={160}
                className="relative w-32 h-32 object-contain"
                priority
              />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              DreamEngin
            </span>
          </h1>
          
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            DreamEngin is a privacy-first creator operating system. It is a place where artists, developers, musicians, and dreamers come together to create, share, and connect - all while keeping your data yours.
          </p>
        </section>

        {/* Meet Dr. Eams */}
        <section className="mb-16">
          <div className="glass-dark rounded-3xl p-6 sm:p-8 border border-white/10">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Image
                src="/dr-eams.jpeg"
                alt="Dr. Eams"
                width={120}
                height={120}
                className="w-24 h-24 object-contain"
              />
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Meet Dr. Eams</h2>
                <p className="text-white/70 leading-relaxed">
                  Dr. Eams is your AI companion and guide throughout DreamEngin. Powered by Inner Dreams AI, Dr. Eams helps you navigate the platform, offers creative suggestions, answers questions, and assists with everything from writing posts to organizing your projects. Think of Dr. Eams as your personal assistant who is always here to help.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">What Makes Us Different</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="glass-dark rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pages Overview */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Explore the Platform</h2>
          <div className="space-y-3">
            {pages.map((page) => (
              <div 
                key={page.path}
                className="glass-dark rounded-xl p-4 border border-white/10 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <page.icon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white">{page.name}</h3>
                  <p className="text-sm text-white/60">{page.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy Commitment */}
        <section className="mb-16">
          <div className="glass-dark rounded-3xl p-6 sm:p-8 border border-green-500/20 bg-green-500/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Our Privacy Promise</h2>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">&#10003;</span>
                    We never sell your data to advertisers or third parties
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">&#10003;</span>
                    End-to-end encryption on all private messages
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">&#10003;</span>
                    You control who sees your content with granular privacy settings
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">&#10003;</span>
                    Delete your data anytime - we actually delete it
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">&#10003;</span>
                    No behavioral tracking or surveillance capitalism
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Dreaming?</h2>
          <p className="text-white/60 mb-6">Join creators who value their privacy and creative freedom.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-2xl hover:from-purple-500 hover:to-blue-500 transition-all cosmic-glow active:scale-95"
          >
            Create Your Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">DreamEngin</span>
          </div>
          
          {/* Social Links */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <a
              href="https://x.com/dreamenginx"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 glass-dark rounded-full text-white/70 hover:text-white transition-colors"
            >
              <Twitter className="w-4 h-4" />
              <span className="text-sm">Follow @dreamenginx</span>
            </a>
          </div>
          
          <p className="text-sm text-white/40 flex items-center justify-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400" /> for dreamers everywhere
          </p>
        </footer>
      </main>
    </div>
  );
}
