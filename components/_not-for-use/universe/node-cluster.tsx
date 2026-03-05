'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface NodeItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  active?: boolean;
  badge?: string | number;
}

interface NodeClusterProps {
  nodes: NodeItem[];
  className?: string;
  layout?: 'radial' | 'grid' | 'list';
  showConnections?: boolean;
  interactive?: boolean;
}

export function NodeCluster({
  nodes,
  className,
  layout = 'grid',
  showConnections = true,
  interactive = true,
}: NodeClusterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Calculate positions for radial layout
  useEffect(() => {
    if (layout !== 'radial' || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) * 0.7;

    const positions = new Map<string, { x: number; y: number }>();
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI - Math.PI / 2;
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });
    setNodePositions(positions);
  }, [nodes, layout]);

  if (layout === 'list') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {nodes.map((node) => (
          <NodeListItem
            key={node.id}
            node={node}
            isHovered={hoveredNode === node.id}
            onHover={() => setHoveredNode(node.id)}
            onLeave={() => setHoveredNode(null)}
          />
        ))}
      </div>
    );
  }

  if (layout === 'grid') {
    return (
      <div
        className={cn(
          'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4',
          className
        )}
      >
        {nodes.map((node) => (
          <NodeGridItem
            key={node.id}
            node={node}
            isHovered={hoveredNode === node.id}
            connectedToHovered={showConnections && hoveredNode !== null && hoveredNode !== node.id}
            onHover={() => setHoveredNode(node.id)}
            onLeave={() => setHoveredNode(null)}
          />
        ))}
      </div>
    );
  }

  // Radial layout
  return (
    <div
      ref={containerRef}
      className={cn('relative w-full aspect-square max-w-md mx-auto', className)}
    >
      {/* Connection lines */}
      {showConnections && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodes.map((node, i) => {
            const pos = nodePositions.get(node.id);
            const centerX = containerRef.current?.clientWidth ? containerRef.current.clientWidth / 2 : 0;
            const centerY = containerRef.current?.clientHeight ? containerRef.current.clientHeight / 2 : 0;
            
            if (!pos) return null;
            
            return (
              <line
                key={`line-${node.id}`}
                x1={centerX}
                y1={centerY}
                x2={pos.x}
                y2={pos.y}
                className={cn(
                  'transition-all duration-300',
                  hoveredNode === node.id
                    ? 'stroke-primary'
                    : 'stroke-muted-foreground/20'
                )}
                strokeWidth={hoveredNode === node.id ? 2 : 1}
                strokeDasharray={hoveredNode === node.id ? 'none' : '4 4'}
              />
            );
          })}
        </svg>
      )}

      {/* Center hub */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                   w-12 h-12 rounded-full bg-primary/20 border border-primary/40
                   flex items-center justify-center"
        style={{
          boxShadow: '0 0 30px hsl(var(--glow-primary) / 0.3)',
        }}
      >
        <div className="w-4 h-4 rounded-full bg-primary animate-pulse-glow" />
      </div>

      {/* Nodes */}
      {nodes.map((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return null;

        return (
          <div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{
              left: pos.x,
              top: pos.y,
              transform: `translate(-50%, -50%) ${hoveredNode === node.id ? 'scale(1.1)' : 'scale(1)'}`,
            }}
          >
            <NodeRadialItem
              node={node}
              isHovered={hoveredNode === node.id}
              onHover={() => setHoveredNode(node.id)}
              onLeave={() => setHoveredNode(null)}
            />
          </div>
        );
      })}
    </div>
  );
}

// Individual node components

function NodeGridItem({
  node,
  isHovered,
  connectedToHovered,
  onHover,
  onLeave,
}: {
  node: NodeItem;
  isHovered: boolean;
  connectedToHovered?: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const Icon = node.icon;

  return (
    <Link
      href={node.href}
      className={cn(
        'group relative flex flex-col items-center justify-center p-4 rounded-xl',
        'bg-card/50 border border-border/50 backdrop-blur-sm',
        'transition-all duration-300 min-h-[120px]',
        isHovered && 'bg-card border-primary/50 shadow-glow-sm scale-105',
        connectedToHovered && 'opacity-60',
        node.active && 'border-primary/30 bg-primary/5'
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Active indicator */}
      {node.active && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-node-active animate-pulse" />
      )}

      {/* Badge */}
      {node.badge && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium rounded-full bg-accent text-accent-foreground">
          {node.badge}
        </span>
      )}

      {/* Icon with glow */}
      <div
        className={cn(
          'relative p-3 rounded-full mb-3 transition-all duration-300',
          'bg-secondary/50',
          isHovered && 'bg-primary/20'
        )}
      >
        {isHovered && (
          <div
            className="absolute inset-0 rounded-full animate-pulse-glow"
            style={{
              background: 'radial-gradient(circle, hsl(var(--glow-primary) / 0.4) 0%, transparent 70%)',
            }}
          />
        )}
        <Icon
          className={cn(
            'relative w-6 h-6 transition-colors duration-300',
            isHovered ? 'text-primary' : 'text-muted-foreground'
          )}
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-sm font-medium text-center transition-colors duration-300',
          isHovered ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {node.label}
      </span>

      {/* Description on hover */}
      {node.description && isHovered && (
        <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
          {node.description}
        </p>
      )}
    </Link>
  );
}

function NodeListItem({
  node,
  isHovered,
  onHover,
  onLeave,
}: {
  node: NodeItem;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const Icon = node.icon;

  return (
    <Link
      href={node.href}
      className={cn(
        'group flex items-center gap-4 p-3 rounded-lg',
        'bg-card/30 border border-transparent',
        'transition-all duration-200',
        isHovered && 'bg-card border-border shadow-glow-sm',
        node.active && 'bg-primary/5 border-primary/20'
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div
        className={cn(
          'p-2 rounded-lg transition-colors duration-200',
          isHovered ? 'bg-primary/20' : 'bg-secondary/50'
        )}
      >
        <Icon
          className={cn(
            'w-5 h-5 transition-colors duration-200',
            isHovered ? 'text-primary' : 'text-muted-foreground'
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'block font-medium transition-colors duration-200',
            isHovered ? 'text-foreground' : 'text-foreground/80'
          )}
        >
          {node.label}
        </span>
        {node.description && (
          <span className="block text-xs text-muted-foreground truncate">
            {node.description}
          </span>
        )}
      </div>

      {node.active && (
        <div className="w-2 h-2 rounded-full bg-node-active animate-pulse" />
      )}

      {node.badge && (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent text-accent-foreground">
          {node.badge}
        </span>
      )}
    </Link>
  );
}

function NodeRadialItem({
  node,
  isHovered,
  onHover,
  onLeave,
}: {
  node: NodeItem;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const Icon = node.icon;

  return (
    <Link
      href={node.href}
      className="group flex flex-col items-center"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div
        className={cn(
          'relative p-3 rounded-full transition-all duration-300',
          'bg-card border border-border/50',
          isHovered && 'border-primary shadow-glow-md scale-110',
          node.active && 'border-primary/50'
        )}
      >
        {/* Glow effect */}
        {(isHovered || node.active) && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(var(--glow-primary) / 0.3) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
          />
        )}

        <Icon
          className={cn(
            'relative w-5 h-5 transition-colors duration-300',
            isHovered || node.active ? 'text-primary' : 'text-muted-foreground'
          )}
        />

        {node.active && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-node-active animate-pulse" />
        )}
      </div>

      <span
        className={cn(
          'mt-2 text-xs font-medium transition-all duration-300',
          isHovered ? 'text-foreground opacity-100' : 'text-muted-foreground opacity-70'
        )}
      >
        {node.label}
      </span>
    </Link>
  );
}

export default NodeCluster;
