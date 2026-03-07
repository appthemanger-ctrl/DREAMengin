'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Home, Compass, ShoppingBag, Music, MessageSquare,
  Plus, Bell, Search, User, Menu, X, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { usePathname } from 'next/navigation';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';

interface MobileNavBarProps {
  user: User | null;
}

export default function MobileNavBarEnhanced({ user }: MobileNavBarProps) {
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Use the new iOS-safe scroll hook for both top and bottom nav
  const isNavVisible = useHideOnScroll({ threshold: 80, delta: 10 });

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const navItems = [
    { href: '/homedream', icon: Home, label: 'HomeDream' },
    { href: '/discover', icon: Compass, label: 'Discover' },
    { href: '/create', icon: Plus, label: 'Create', isSpecial: true },
    { href: '/music', icon: Music, label: 'Music' },
    { href: '/messages', icon: MessageSquare, label: 'Messages' },
  ];

  return (
    <>
      {/* Top App Bar - Auto-hides on scroll down */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out will-change-transform ${
          !isNavVisible ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DREAM
              </span>
            </Link>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-full active:scale-95 transition-transform"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              
              <button
                className="relative p-2 rounded-full active:scale-95 transition-transform"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>

              <Link
                href="/settings"
                className="p-2 rounded-full active:scale-95 transition-transform"
                aria-label="Settings"
              >
                <User className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Expandable Search Bar */}
          <div 
            className={`overflow-hidden transition-all duration-300 ${
              showSearch ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search posts, people, tags..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Animated gradient line */}
        <div className="h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x" />
      </header>

      {/* Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: !isNavVisible ? 'translate3d(0, 140%, 0)' : 'translate3d(0, 0, 0)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 safe-area-bottom">
          <div className="grid grid-cols-5 h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center relative group"
                >
                  {/* Active indicator pill */}
                  {isActive && !item.isSpecial && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-full" />
                  )}
                  
                  {item.isSpecial ? (
                    <div className="w-12 h-12 -mt-5 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 active:scale-95 transition-transform">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <>
                      <div className={`p-2 rounded-2xl transition-all ${
                        isActive 
                          ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 scale-110' 
                          : 'active:scale-95'
                      }`}>
                        <Icon className={`w-5 h-5 transition-colors ${
                          isActive 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-slate-600 dark:text-slate-400'
                        }`} />
                      </div>
                      
                      <span className={`text-xs font-medium mt-1 transition-colors ${
                        isActive 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {item.label}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Spacer for fixed positioning */}
      <div className="h-14" />
      <div className="h-16 md:hidden" /> {/* Bottom nav spacer */}
    </>
  );
}
