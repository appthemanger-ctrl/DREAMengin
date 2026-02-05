'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, X, Edit3, Image, Video, Mic, FileText, 
  Calendar, Users, Zap, Sparkles
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
}

export default function FloatingActionBubble() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Initialize position at bottom right
    setPosition({
      x: window.innerWidth - 100,
      y: window.innerHeight - 100
    });
  }, []);

  const quickActions: QuickAction[] = [
    {
      id: 'post',
      label: 'New Post',
      icon: Edit3,
      color: 'from-blue-500 to-cyan-500',
      action: () => console.log('Create post')
    },
    {
      id: 'photo',
      label: 'Upload Photo',
      icon: Image,
      color: 'from-purple-500 to-pink-500',
      action: () => console.log('Upload photo')
    },
    {
      id: 'video',
      label: 'Upload Video',
      icon: Video,
      color: 'from-orange-500 to-red-500',
      action: () => console.log('Upload video')
    },
    {
      id: 'voice',
      label: 'Voice Note',
      icon: Mic,
      color: 'from-green-500 to-emerald-500',
      action: () => console.log('Record voice')
    },
    {
      id: 'document',
      label: 'Upload Doc',
      icon: FileText,
      color: 'from-indigo-500 to-purple-500',
      action: () => console.log('Upload document')
    },
    {
      id: 'event',
      label: 'Create Event',
      icon: Calendar,
      color: 'from-pink-500 to-rose-500',
      action: () => console.log('Create event')
    },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded) return; // Don't drag when expanded
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragStart.y));
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const getActionPosition = (index: number, total: number) => {
    const radius = 120;
    const angleStep = (Math.PI * 1.5) / (total - 1);
    const angle = angleStep * index - Math.PI / 4;
    
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: isDragging ? 'none' : 'all 0.3s ease'
      }}
    >
      {/* Action buttons that expand in an arc */}
      {isExpanded && quickActions.map((action, index) => {
        const pos = getActionPosition(index, quickActions.length);
        const Icon = action.icon;
        
        return (
          <button
            key={action.id}
            onClick={() => {
              action.action();
              setIsExpanded(false);
            }}
            className="absolute pointer-events-auto"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              animation: `slideIn 0.3s ease ${index * 0.05}s both`
            }}
          >
            <div className="relative group">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${action.color} shadow-lg flex items-center justify-center text-white transform hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              
              {/* Tooltip */}
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {action.label}
              </div>
            </div>
          </button>
        );
      })}

      {/* Main floating button */}
      <button
        onMouseDown={handleMouseDown}
        onClick={() => !isDragging && setIsExpanded(!isExpanded)}
        className={`pointer-events-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl flex items-center justify-center text-white transform transition-all duration-300 ${
          isDragging ? 'scale-110 cursor-grabbing' : 'cursor-grab hover:scale-110'
        } ${isExpanded ? 'rotate-45' : ''}`}
      >
        {isExpanded ? (
          <X className="w-7 h-7" />
        ) : (
          <Plus className="w-7 h-7" />
        )}
        
        {/* Pulsing ring effect */}
        {!isExpanded && (
          <>
            <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-30" />
            <span className="absolute inset-0 rounded-full bg-purple-600 animate-pulse opacity-30" />
          </>
        )}
      </button>

      {/* Sparkle effects */}
      {isExpanded && (
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute w-4 h-4 text-yellow-400 animate-bounce" style={{ top: -20, left: -10 }} />
          <Sparkles className="absolute w-3 h-3 text-pink-400 animate-bounce" style={{ top: -15, right: -5, animationDelay: '0.2s' }} />
          <Zap className="absolute w-4 h-4 text-blue-400 animate-bounce" style={{ bottom: -20, left: 10, animationDelay: '0.1s' }} />
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0) translate(-50%, -50%);
          }
          to {
            opacity: 1;
            transform: scale(1) translate(0, 0);
          }
        }
      `}</style>
    </div>
  );
}
