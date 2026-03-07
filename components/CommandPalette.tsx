'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, Home, Compass, Settings, User, MessageSquare,
  TrendingUp, ShoppingBag, Music, FileText, Calendar,
  Command, ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<unknown>;
  keywords: string[];
  action: () => void;
  category: string;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: CommandItem[] = [
    {
      id: 'home',
      label: 'Go to Home',
      icon: Home,
      keywords: ['home', 'feed', 'dashboard'],
      action: () => router.push('/homedream'),
      category: 'Navigation'
    },
    {
      id: 'discover',
      label: 'Explore Discover',
      icon: Compass,
      keywords: ['discover', 'explore', 'find'],
      action: () => router.push('/discover'),
      category: 'Navigation'
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      icon: TrendingUp,
      keywords: ['analytics', 'stats', 'metrics', 'insights'],
      action: () => router.push('/analytics'),
      category: 'Navigation'
    },
    {
      id: 'shop',
      label: 'Open Shop',
      icon: ShoppingBag,
      keywords: ['shop', 'store', 'merch', 'buy'],
      action: () => router.push('/shop'),
      category: 'Navigation'
    },
    {
      id: 'music',
      label: 'Browse Music',
      icon: Music,
      keywords: ['music', 'audio', 'tracks', 'songs'],
      action: () => router.push('/music'),
      category: 'Navigation'
    },
    {
      id: 'messages',
      label: 'Open Messages',
      icon: MessageSquare,
      keywords: ['messages', 'chat', 'dm', 'inbox'],
      action: () => router.push('/messages'),
      category: 'Navigation'
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: Settings,
      keywords: ['settings', 'preferences', 'config'],
      action: () => router.push('/settings'),
      category: 'Settings'
    },
    {
      id: 'profile',
      label: 'View Profile',
      icon: User,
      keywords: ['profile', 'account', 'me'],
      action: () => router.push('/edit-profiledream'),
      category: 'Settings'
    },
  ];

  const filteredCommands = search
    ? commands.filter(cmd =>
        cmd.label.toLowerCase().includes(search.toLowerCase()) ||
        cmd.keywords.some(kw => kw.toLowerCase().includes(search.toLowerCase()))
      )
    : commands;

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+K or CTRL+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setSearch('');
        setSelectedIndex(0);
      }

      // ESC to close
      if (e.key === 'Escape') {
        setIsOpen(false);
      }

      // Navigation
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => 
            Math.min(prev + 1, filteredCommands.length - 1)
          );
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            setIsOpen(false);
            setSearch('');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!isOpen) return null;

  let currentIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
        {/* Search Input */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-700 px-4">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 py-4 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400"
          />
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-600">
              ESC
            </kbd>
            <span>to close</span>
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p>No commands found</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const itemIndex = currentIndex++;
                  const Icon = cmd.icon;
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        setIsOpen(false);
                        setSearch('');
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected
                            ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`font-medium ${
                          isSelected
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {cmd.label}
                        </span>
                      </div>
                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
                  ↑↓
                </kbd>
                <span>to navigate</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
                  ↵
                </kbd>
                <span>to select</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Command className="w-3 h-3" />
              <span>+</span>
              <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
                K
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
