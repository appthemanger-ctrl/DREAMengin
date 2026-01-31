"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  Home, 
  Search, 
  Store, 
  Music, 
  FlaskConical, 
  Settings, 
  LogOut,
  User,
  MessageSquare,
  PlusCircle
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import DrEamsModeToggle from './DrEamsModeToggle';

export default function NavBar({ session }: { session: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isLoggedIn = !!session;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3">
            <Image 
              src="/images/dreamengin-logo.jpeg" 
              alt="DREAMengin" 
              width={40} 
              height={40}
              className="object-contain rounded-lg"
            />
            <span className="text-xl font-bold text-foreground hidden sm:block">
              DREAMengin
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link 
              href="/discover" 
              className={`text-sm font-medium transition-colors ${pathname === '/discover' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Search className="w-5 h-5 inline mr-1" />
              Discover
            </Link>
            
            <Link 
              href="/shop" 
              className={`text-sm font-medium transition-colors ${pathname === '/shop' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Store className="w-5 h-5 inline mr-1" />
              Shop
            </Link>

            {isLoggedIn && (
              <>
                <Link 
                  href="/home" 
                  className={`text-sm font-medium transition-colors ${pathname === '/home' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Home className="w-5 h-5 inline mr-1" />
                  Home
                </Link>
                
                <Link 
                  href="/music" 
                  className={`text-sm font-medium transition-colors ${pathname === '/music' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Music className="w-5 h-5 inline mr-1" />
                  Music
                </Link>
                
                <Link 
                  href="/lab" 
                  className={`text-sm font-medium transition-colors ${pathname === '/lab' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <FlaskConical className="w-5 h-5 inline mr-1" />
                  Lab
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => router.push('/home?modal=create')}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create
                </button>

                <Link 
                  href="/messages" 
                  className={`p-2 rounded-lg transition-colors ${pathname === '/messages' ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>

                <NotificationCenter />
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  
                  {isProfileOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg py-1 z-50 border border-slate-200 dark:border-slate-700">
                        <Link
                          href="/edit-profile"
                          className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Edit Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings className="w-4 h-4 inline mr-2" />
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <LogOut className="w-4 h-4 inline mr-2" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <ThemeToggle />
                <DrEamsModeToggle />
              </>
            ) : (
              <>
                <ThemeToggle />
                <DrEamsModeToggle />
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
