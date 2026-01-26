'use client';

import Link from 'next/link';
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
  MessageSquare
} from 'lucide-react';

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
    <nav className="bg-slate-800/60 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">DreamEngin</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link 
              href="/discover" 
              className={`flex items-center text-sm font-medium transition-colors ${pathname === '/discover' ? 'text-purple-300' : 'text-gray-400 hover:text-purple-400'}`}
            >
              <Search className="w-5 h-5 inline mr-1" />
              Discover
            </Link>
            
            <Link 
              href="/shop" 
              className={`flex items-center text-sm font-medium transition-colors ${pathname === '/shop' ? 'text-purple-300' : 'text-gray-400 hover:text-purple-400'}`}
            >
              <Store className="w-5 h-5 inline mr-1" />
              Shop
            </Link>

            {isLoggedIn && (
              <>
                <Link 
                  href="/home" 
                  className={`flex items-center text-sm font-medium transition-colors ${pathname === '/home' ? 'text-purple-300' : 'text-gray-400 hover:text-purple-400'}`}
                >
                  <Home className="w-5 h-5 inline mr-1" />
                  Home
                </Link>
                
                <Link 
                  href="/music" 
                  className={`flex items-center text-sm font-medium transition-colors ${pathname === '/music' ? 'text-purple-300' : 'text-gray-400 hover:text-purple-400'}`}
                >
                  <Music className="w-5 h-5 inline mr-1" />
                  Music
                </Link>
                
                <Link 
                  href="/lab" 
                  className={`flex items-center text-sm font-medium transition-colors ${pathname === '/lab' ? 'text-purple-300' : 'text-gray-400 hover:text-purple-400'}`}
                >
                  <FlaskConical className="w-5 h-5 inline mr-1" />
                  Lab
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Link 
                  href="/messages" 
                  className={`flex items-center text-sm font-medium transition-colors ${pathname === '/messages' ? 'text-purple-300' : 'text-gray-400 hover:text-purple-400'}`}
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-sm font-medium text-gray-400 hover:text-purple-400"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-md shadow-lg py-1 z-50">
                      <Link
                        href="/edit-profile"
                        className="block px-4 py-2 text-sm text-gray-200 hover:bg-slate-700 hover:text-white"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Edit Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-200 hover:bg-slate-700 hover:text-white"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="w-4 h-4 inline mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-slate-700 hover:text-white"
                      >
                        <LogOut className="w-4 h-4 inline mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link 
                href="/login" 
                className="text-sm font-medium text-gray-100 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}