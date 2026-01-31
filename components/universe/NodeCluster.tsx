'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Home, Search, Store, Music, FlaskConical, MessageSquare,
  BarChart3, Settings, Users, Sparkles, Radio, Puzzle,
  type LucideIcon
} from 'lucide-react';

interface FeatureNode {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  status: 'active' | 'inactive' | 'new' | 'beta';
  color: string;
  notifications?: number;
}

interface NodeClusterProps {
  activeRoute?: string;
  compact?: boolean;
}

const featureNodes: FeatureNode[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/home',
    icon: Home,
    description: 'Your personal feed',
    status: 'active',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'discover',
    label: 'Discover',
    href: '/discover',
    icon: Search,
    description: 'Explore content',
    status: 'active',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    description: 'Conversations',
    status: 'active',
    color: 'from-emerald-500 to-teal-500',
    notifications: 3,
  },
  {
    id: 'music',
    label: 'Music',
    href: '/music',
    icon: Music,
    description: 'Audio library',
    status: 'active',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'shop',
    label: 'Shop',
    href: '/shop',
    icon: Store,
    description: 'Marketplace',
    status: 'active',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'lab',
    label: 'Lab',
    href: '/lab',
    icon: FlaskConical,
    description: 'Experiments',
    status: 'beta',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Insights',
    status: 'active',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'connectors',
    label: 'Connectors',
    href: '/connectors',
    icon: Puzzle,
    description: 'Integrations',
    status: 'new',
    color: 'from-rose-500 to-pink-500',
  },
];

export default function NodeCluster({ activeRoute, compact = false }: NodeClusterProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  if (compact) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {featureNodes.map((node) => {
          const Icon = node.icon;
          const isActive = activeRoute === node.href;
          
          return (
            <Link
              key={node.id}
              href={node.href}
              className={`relative flex flex-col items-center p-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-primary/10 ring-1 ring-primary/30' 
                  : 'hover:bg-secondary'
              }`}
            >
              <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
                {node.notifications && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
                    {node.notifications}
                  </span>
                )}
              </div>
              <span className="mt-2 text-xs font-medium text-foreground">{node.label}</span>
              {node.status === 'beta' && (
                <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-500 rounded">
                  BETA
                </span>
              )}
              {node.status === 'new' && (
                <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-500 rounded">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Connection lines background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" aria-hidden="true">
        <defs>
          <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Connecting lines would go here based on node positions */}
      </svg>

      {/* Node grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {featureNodes.map((node, index) => {
          const Icon = node.icon;
          const isActive = activeRoute === node.href;
          const isHovered = hoveredNode === node.id;
          
          return (
            <Link
              key={node.id}
              href={node.href}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${
                isActive 
                  ? 'bg-card ring-2 ring-primary shadow-lg shadow-primary/10' 
                  : 'bg-card/50 hover:bg-card hover:shadow-xl'
              }`}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              {/* Glow effect on hover */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${node.color} opacity-0 transition-opacity duration-300 ${
                  isHovered ? 'opacity-5' : ''
                }`}
              />
              
              {/* Node icon */}
              <div className="relative mb-3">
                <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="w-6 h-6 text-white" />
                  
                  {/* Pulse effect for active nodes */}
                  {isActive && (
                    <span className={`absolute inset-0 rounded-xl bg-gradient-to-br ${node.color} animate-ping opacity-30`} />
                  )}
                </div>
                
                {/* Status indicator */}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
                  node.status === 'active' ? 'bg-emerald-500' :
                  node.status === 'beta' ? 'bg-amber-500' :
                  node.status === 'new' ? 'bg-blue-500' : 'bg-muted'
                }`} />
                
                {/* Notification badge */}
                {node.notifications && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
                    {node.notifications}
                  </span>
                )}
              </div>

              {/* Node info */}
              <h3 className="font-semibold text-foreground mb-1">{node.label}</h3>
              <p className="text-xs text-muted-foreground">{node.description}</p>

              {/* Status badge */}
              {(node.status === 'beta' || node.status === 'new') && (
                <div className={`absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                  node.status === 'beta' 
                    ? 'bg-amber-500/20 text-amber-500' 
                    : 'bg-emerald-500/20 text-emerald-500'
                }`}>
                  {node.status}
                </div>
              )}

              {/* Hover arrow */}
              <div className={`absolute bottom-3 right-3 transition-all duration-300 ${
                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
              }`}>
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
