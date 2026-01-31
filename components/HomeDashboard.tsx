'use client';

import { useState, useEffect } from 'react';
import { 
  Home, Compass, ShoppingBag, Music, MessageSquare, 
  Users, Zap, TrendingUp, Bell, Settings, Search,
  Plus, ArrowRight, Sparkles, Star, Award
} from 'lucide-react';
import Link from 'next/link';
import { UniverseShell, UniverseCard, UniverseCardContent, TorusCore, NodeCluster, NodeItem } from '@/components/universe';
import FeedCard from './FeedCard';
import { cn } from '@/lib/utils';

interface FeedItem {
  id: string;
  type: string;
  content: any;
  ts: string;
  profiles: {
    display_name: string;
    handle: string;
    avatar_url: string;
  };
}

interface HomeDashboardProps {
  feed: FeedItem[];
  widgets: any[];
  userId: string;
  notifications: any[];
  unreadMessages: number;
}

export default function HomeDashboard({
  feed,
  widgets,
  userId,
  notifications,
  unreadMessages
}: HomeDashboardProps) {
  const [activeSection, setActiveSection] = useState('feed');
  const [showTorus, setShowTorus] = useState(true);

  // Navigation nodes for the universe interface
  const navigationNodes: NodeItem[] = [
    { id: 'feed', label: 'Feed', href: '#feed', icon: Home, active: activeSection === 'feed' },
    { id: 'discover', label: 'Discover', href: '/discover', icon: Compass },
    { id: 'shop', label: 'Shop', href: '/shop', icon: ShoppingBag },
    { id: 'music', label: 'Music', href: '/music', icon: Music },
    { id: 'messages', label: 'Messages', href: '/messages', icon: MessageSquare, badge: unreadMessages > 0 ? unreadMessages : undefined },
    { id: 'community', label: 'Community', href: '/community', icon: Users },
  ];

  // Quick action nodes
  const quickActions: NodeItem[] = [
    { id: 'create', label: 'Create', href: '/create', icon: Plus, description: 'New post' },
    { id: 'trending', label: 'Trending', href: '/trending', icon: TrendingUp },
    { id: 'boost', label: 'Boost', href: '/boost', icon: Zap },
    { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <UniverseShell showStars>
      <main className="min-h-screen pb-24 md:pb-8">
        {/* Universe Hero Section - Only on larger screens */}
        <section className="hidden md:block relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-8">
              {/* Torus visualization */}
              <div className="flex-shrink-0">
                <TorusCore 
                  size="md" 
                  rings={3} 
                  speed="slow"
                  glowIntensity="medium"
                  interactive
                />
              </div>
              
              {/* Welcome message */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Welcome back to DREAMengin
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Your creative universe awaits. Explore, create, and connect.
                </p>
                
                {/* Quick stats */}
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Star className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{feed.length} new posts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{notifications.length} notifications</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Header */}
        <header className="md:hidden sticky top-14 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-foreground">Home</h1>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-muted transition-colors">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-full hover:bg-muted transition-colors relative">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar - Navigation Nodes */}
            <aside className="hidden lg:block lg:col-span-3">
              <UniverseCard className="sticky top-24">
                <UniverseCardContent className="p-4">
                  <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                    Navigation
                  </h2>
                  <NodeCluster 
                    nodes={navigationNodes} 
                    layout="list"
                    showConnections={false}
                  />
                  
                  <div className="border-t border-border/50 my-4" />
                  
                  <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                    Quick Actions
                  </h2>
                  <NodeCluster 
                    nodes={quickActions} 
                    layout="list"
                    showConnections={false}
                  />
                </UniverseCardContent>
              </UniverseCard>
            </aside>

            {/* Main Feed */}
            <div className="lg:col-span-6 space-y-4">
              {/* Create Post Card - Mobile friendly */}
              <UniverseCard className="overflow-hidden">
                <UniverseCardContent className="p-4">
                  <Link 
                    href="/create"
                    className="flex items-center gap-3 w-full"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 h-10 px-4 rounded-full bg-muted/50 flex items-center text-muted-foreground text-sm hover:bg-muted transition-colors">
                      Share something amazing...
                    </div>
                    <button className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:scale-95">
                      <Plus className="w-5 h-5" />
                    </button>
                  </Link>
                </UniverseCardContent>
              </UniverseCard>

              {/* Feed Items */}
              {feed.length > 0 ? (
                feed.map((item) => (
                  <FeedCard 
                    key={item.id} 
                    item={item}
                    userId={userId}
                  />
                ))
              ) : (
                <UniverseCard>
                  <UniverseCardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Your feed is empty
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Start following creators or explore trending content
                    </p>
                    <Link 
                      href="/discover"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors active:scale-95"
                    >
                      Discover <ArrowRight className="w-4 h-4" />
                    </Link>
                  </UniverseCardContent>
                </UniverseCard>
              )}
            </div>

            {/* Right Sidebar - Widgets & Trending */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="space-y-4 sticky top-24">
                {/* Trending Section */}
                <UniverseCard>
                  <UniverseCardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Trending
                      </h2>
                      <Link 
                        href="/trending"
                        className="text-xs text-primary hover:underline"
                      >
                        See all
                      </Link>
                    </div>
                    
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div 
                          key={i}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            #{i}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              Topic {i}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {Math.floor(Math.random() * 10)}k posts
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </UniverseCardContent>
                </UniverseCard>

                {/* Active Creators */}
                <UniverseCard>
                  <UniverseCardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-foreground flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        Top Creators
                      </h2>
                    </div>
                    
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div 
                          key={i}
                          className="flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {String.fromCharCode(64 + i)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              Creator {i}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @creator{i}
                            </p>
                          </div>
                          <button className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-95">
                            Follow
                          </button>
                        </div>
                      ))}
                    </div>
                  </UniverseCardContent>
                </UniverseCard>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </UniverseShell>
  );
}
