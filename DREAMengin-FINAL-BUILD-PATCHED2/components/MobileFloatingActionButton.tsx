'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, X, Edit3, Image, Video, Mic, Camera, 
  FileText, Calendar, Users, Sparkles
} from 'lucide-react';

interface MobileAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
}

export default function MobileFloatingActionButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide FAB when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
        setIsExpanded(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const quickActions: MobileAction[] = [
    {
      id: 'post',
      label: 'Write Post',
      icon: Edit3,
      color: 'from-blue-500 to-cyan-500',
      action: () => console.log('Create post')
    },
    {
      id: 'photo',
      label: 'Take Photo',
      icon: Camera,
      color: 'from-purple-500 to-pink-500',
      action: () => console.log('Take photo')
    },
    {
      id: 'gallery',
      label: 'Upload Photo',
      icon: Image,
      color: 'from-green-500 to-emerald-500',
      action: () => console.log('Upload photo')
    },
    {
      id: 'video',
      label: 'Record Video',
      icon: Video,
      color: 'from-orange-500 to-red-500',
      action: () => console.log('Record video')
    },
    {
      id: 'voice',
      label: 'Voice Note',
      icon: Mic,
      color: 'from-indigo-500 to-purple-500',
      action: () => console.log('Record voice')
    },
    {
      id: 'document',
      label: 'Upload Document',
      icon: FileText,
      color: 'from-pink-500 to-rose-500',
      action: () => console.log('Upload document')
    },
    {
      id: 'event',
      label: 'Create Event',
      icon: Calendar,
      color: 'from-yellow-500 to-orange-500',
      action: () => console.log('Create event')
    },
    {
      id: 'collab',
      label: 'Start Collaboration',
      icon: Users,
      color: 'from-teal-500 to-cyan-500',
      action: () => console.log('Start collaboration')
    },
  ];

  const handleActionClick = (action: MobileAction) => {
    action.action();
    setIsExpanded(false);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <>
      {/* Bottom Sheet Overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          isExpanded ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 safe-area-bottom">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span>Create Content</span>
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Actions Grid */}
          <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                
                return (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action)}
                    className="flex flex-col items-center space-y-2 active:scale-95 transition-transform"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} shadow-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`fixed right-6 z-40 transition-all duration-300 md:hidden ${
          isVisible ? 'bottom-24 opacity-100' : 'bottom-16 opacity-0 pointer-events-none'
        }`}
        aria-label="Create content"
      >
        <div className="relative">
          {/* Pulsing rings */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-ping opacity-30" />
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse opacity-30" />
          
          {/* Main button */}
          <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl flex items-center justify-center transition-transform active:scale-95 ${
            isExpanded ? 'rotate-45' : 'rotate-0'
          }`}>
            <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          
          {/* Notification badge */}
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">3</span>
          </div>
        </div>
      </button>
    </>
  );
}
