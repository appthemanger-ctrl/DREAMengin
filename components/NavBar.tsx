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
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold text-slate-800">DreamEngin</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link 
              href="/discover" 
              className={`text-sm font-medium ${pathname === '/discover' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Search className="w-5 h-5 inline mr-1" />
              Discover
            </Link>
            
            <Link 
              href="/shop" 
              className={`text-sm font-medium ${pathname === '/shop' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Store className="w-5 h-5 inline mr-1" />
              Shop
            </Link>

            {isLoggedIn && (
              <>
                <Link 
                  href="/home" 
                  className={`text-sm font-medium ${pathname === '/home' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Home className="w-5 h-5 inline mr-1" />
                  Home
                </Link>
                
                <Link 
                  href="/music" 
                  className={`text-sm font-medium ${pathname === '/music' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Music className="w-5 h-5 inline mr-1" />
                  Music
                </Link>
                
                <Link 
                  href="/lab" 
                  className={`text-sm font-medium ${pathname === '/lab' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
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
                  className={`text-sm font-medium ${pathname === '/messages' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        href="/edit-profile"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Edit Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="w-4 h-4 inline mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
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
                className="text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md"
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