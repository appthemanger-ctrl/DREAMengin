'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, Store, Music, MessageSquare,
  Plus, User, type LucideIcon
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface MobileBottomNavProps {
  session: any;
  onCreateClick?: () => void;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'Discover', href: '/discover', icon: Search },
  { label: 'Shop', href: '/shop', icon: Store },
  { label: 'Music', href: '/music', icon: Music },
  { label: 'Messages', href: '/messages', icon: MessageSquare, badge: 3 },
];

export default function MobileBottomNav({ session, onCreateClick }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide nav when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Bottom Navigation */}
      <nav 
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-card/80 backdrop-blur-xl border-t border-border" />
        
        {/* Safe area padding for iOS */}
        <div className="relative pb-safe">
          <div className="grid grid-cols-5 h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center"
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-full" />
                  )}
                  
                  <div className={`relative p-2 rounded-2xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary/10 scale-110' 
                      : 'active:scale-95'
                  }`}>
                    <Icon className={`w-5 h-5 transition-colors ${
                      isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground'
                    }`} />
                    
                    {/* Badge */}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  
                  <span className={`text-[10px] font-medium mt-0.5 transition-colors ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Floating Action Button */}
      {session && (
        <button
          onClick={onCreateClick}
          className={`fixed right-4 z-40 md:hidden transition-all duration-300 ${
            isVisible ? 'bottom-20' : 'bottom-4'
          }`}
          aria-label="Create new content"
        >
          <div className="relative">
            {/* Pulsing background */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-ping opacity-25" />
            
            {/* Main button */}
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform">
              <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </button>
      )}

      {/* Bottom spacer for content */}
      <div className="h-16 md:hidden" />
    </>
  );
}
