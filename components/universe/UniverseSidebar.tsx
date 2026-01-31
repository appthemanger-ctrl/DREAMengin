'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home, Search, Store, Music, FlaskConical, MessageSquare,
  BarChart3, Settings, Users, Bell, LogOut, ChevronLeft,
  ChevronRight, Sparkles, Shield, Puzzle, type LucideIcon
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  isNew?: boolean;
}

interface UniverseSidebarProps {
  session: any;
  isAdmin?: boolean;
  onLogout?: () => void;
}

const mainNavItems: NavItem[] = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'Discover', href: '/discover', icon: Search },
  { label: 'Messages', href: '/messages', icon: MessageSquare, badge: 3 },
  { label: 'Music', href: '/music', icon: Music },
  { label: 'Shop', href: '/shop', icon: Store },
  { label: 'Lab', href: '/lab', icon: FlaskConical, isNew: true },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Connectors', href: '/connectors', icon: Puzzle },
];

const bottomNavItems: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function UniverseSidebar({ session, isAdmin, onLogout }: UniverseSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    return (
      <Link
        href={item.href}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        }`}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full" />
        )}

        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110'} transition-transform`} />
        
        {!isCollapsed && (
          <>
            <span className="font-medium">{item.label}</span>
            
            {item.badge && (
              <span className={`ml-auto px-2 py-0.5 text-xs font-bold rounded-full ${
                isActive 
                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                  : 'bg-destructive text-destructive-foreground'
              }`}>
                {item.badge}
              </span>
            )}
            
            {item.isNew && !item.badge && (
              <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-500 rounded">
                New
              </span>
            )}
          </>
        )}

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            {item.label}
            {item.badge && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-card border-r border-border flex flex-col transition-all duration-300 z-40 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center h-16 px-4 border-b border-border ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">DREAM</span>
          </Link>
        )}
        
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg hover:bg-secondary transition-colors ${isCollapsed ? 'absolute -right-3 top-6 bg-card border border-border shadow-sm' : ''}`}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {mainNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        
        {isAdmin && (
          <>
            <div className={`my-3 border-t border-border ${isCollapsed ? '' : 'mx-2'}`} />
            <NavLink item={{ label: 'Admin', href: '/admin', icon: Shield }} />
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-border space-y-1">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        
        {session && onLogout && (
          <button
            onClick={onLogout}
            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        )}
      </div>

      {/* User profile section */}
      {session && !isCollapsed && (
        <div className="p-3 border-t border-border">
          <Link
            href="/edit-profile"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {session.user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {session.user?.user_metadata?.display_name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session.user?.email}
              </p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
