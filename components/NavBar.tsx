import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  Settings, 
  LogOut,
  User as UserIcon,
  MessageSquare,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import DrEamsModeToggle from './DrEamsModeToggle';
import BrandLogo from './BrandLogo';

export default function NavBar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isLoggedIn = !!user;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav aria-label="Site navigation" className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo — Golden Button handles primary navigation */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <BrandLogo
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-lg font-bold bg-gradient-to-r from-[var(--de-gold)] to-[var(--de-accent)] bg-clip-text text-transparent hidden sm:block tracking-tight">
              Dreamengin
            </span>
          </Link>

          {/* Right side — auth controls only; nav is via Golden Button */}
          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              <>
                <Link 
                  href="/messages"
                  aria-label="Messages"
                  className={`p-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--de-gold)] ${pathname === '/messages' ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <MessageSquare className="w-5 h-5" aria-hidden="true" />
                  <span className="sr-only">Messages</span>
                </Link>

                <NotificationCenter />
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    aria-label="Open profile menu"
                    aria-expanded={isProfileOpen}
                    className="flex items-center space-x-2 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--de-gold)]"
                  >
                    <UserIcon className="w-5 h-5" aria-hidden="true" />
                  </button>
                  
                  {isProfileOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg py-1 z-50 border border-slate-200 dark:border-slate-700" role="menu" aria-label="Profile options">
                        <Link
                          href="/edit-profiledream"
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
