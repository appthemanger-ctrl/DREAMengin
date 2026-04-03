'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search, Home, Compass, Settings, User, MessageSquare,
  TrendingUp, ShoppingBag, Music, Gamepad2, FlaskConical,
  Code2, Palette, PenLine, Stars, ArrowRight, Zap, Flame,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  iconBg: string;
  keywords: string[];
  action: () => void;
  category: string;
  shortcut?: string;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const commands: CommandItem[] = [
    {
      id: 'home',
      label: 'HomeDream',
      description: 'Your private daily surface',
      icon: Home,
      iconColor: '#38bdf8',
      iconBg: 'rgba(56,189,248,0.12)',
      keywords: ['home', 'feed', 'dashboard', 'homedream'],
      action: () => router.push('/homedream'),
      category: 'Surfaces',
      shortcut: '⌘H',
    },
    {
      id: 'messages',
      label: 'DreamDM',
      description: 'Messages and conversations',
      icon: MessageSquare,
      iconColor: '#34d399',
      iconBg: 'rgba(52,211,153,0.12)',
      keywords: ['messages', 'chat', 'dm', 'inbox', 'dreamdm'],
      action: () => router.push('/messages'),
      category: 'Surfaces',
      shortcut: '⌘M',
    },
    {
      id: 'profile',
      label: 'Edit ProfileDream',
      description: 'Build your public presence',
      icon: User,
      iconColor: '#a78bfa',
      iconBg: 'rgba(167,139,250,0.12)',
      keywords: ['profile', 'account', 'me', 'edit'],
      action: () => router.push('/edit-profiledream'),
      category: 'Surfaces',
    },
    {
      id: 'music',
      label: 'Music Daydream',
      description: 'Create, organize and release music',
      icon: Music,
      iconColor: '#f472b6',
      iconBg: 'rgba(244,114,182,0.12)',
      keywords: ['music', 'audio', 'tracks', 'songs', 'starmaker'],
      action: () => router.push('/daydream/music'),
      category: 'Daydreams',
    },
    {
      id: 'games',
      label: 'Games Daydream',
      description: 'Play and build games',
      icon: Gamepad2,
      iconColor: '#fbbf24',
      iconBg: 'rgba(251,191,36,0.12)',
      keywords: ['games', 'play', 'game', 'gaming'],
      action: () => router.push('/daydream/games'),
      category: 'Daydreams',
    },
    {
      id: 'lab',
      label: 'Lab Daydream',
      description: 'Experiments and prototypes',
      icon: FlaskConical,
      iconColor: '#34d399',
      iconBg: 'rgba(52,211,153,0.12)',
      keywords: ['lab', 'experiment', 'prototype', 'science'],
      action: () => router.push('/daydream/lab'),
      category: 'Daydreams',
    },
    {
      id: 'code',
      label: 'Code Daydream',
      description: 'Projects, snippets and deployments',
      icon: Code2,
      iconColor: '#38bdf8',
      iconBg: 'rgba(56,189,248,0.12)',
      keywords: ['code', 'dev', 'programming', 'engineer'],
      action: () => router.push('/daydream/code'),
      category: 'Daydreams',
    },
    {
      id: 'brand',
      label: 'Brand Daydream',
      description: 'Campaigns, identity and assets',
      icon: Palette,
      iconColor: '#f97316',
      iconBg: 'rgba(249,115,22,0.12)',
      keywords: ['brand', 'design', 'campaign', 'identity'],
      action: () => router.push('/daydream/brand'),
      category: 'Daydreams',
    },
    {
      id: 'create',
      label: 'Create Daydream',
      description: 'Write, compose, and publish',
      icon: PenLine,
      iconColor: '#a78bfa',
      iconBg: 'rgba(167,139,250,0.12)',
      keywords: ['create', 'write', 'compose', 'post', 'content'],
      action: () => router.push('/daydream/create'),
      category: 'Daydreams',
    },
    {
      id: 'forge',
      label: 'Forge Daydream',
      description: 'Orchestrate all engines from one surface',
      icon: Flame,
      iconColor: '#ef4444',
      iconBg: 'rgba(239,68,68,0.12)',
      keywords: ['forge', 'meta', 'orchestrate', 'engines', 'status', 'matrix'],
      action: () => router.push('/daydream/forge'),
      category: 'Daydreams',
    },
    // ── Engine Apps (standalone full-screen shells) ─────────────────────────
    {
      id: 'engines-hub',
      label: 'Engines Hub',
      description: 'All engine apps in one view',
      icon: Zap,
      iconColor: '#c8981a',
      iconBg: 'rgba(200,152,26,0.12)',
      keywords: ['engines', 'hub', 'all', 'apps'],
      action: () => router.push('/engines'),
      category: 'Engines',
    },
    {
      id: 'engine-games',
      label: 'GameEngin App',
      description: 'Full-screen game engine with library, scores, builder',
      icon: Gamepad2,
      iconColor: '#c8981a',
      iconBg: 'rgba(200,152,26,0.12)',
      keywords: ['game', 'engine', 'app', 'fullscreen', 'gameengin'],
      action: () => router.push('/engines/games'),
      category: 'Engines',
    },
    {
      id: 'engine-music',
      label: 'StarMakerEngin App',
      description: 'Full-screen DAW with studio, arrange, library',
      icon: Music,
      iconColor: '#a855f7',
      iconBg: 'rgba(168,85,247,0.12)',
      keywords: ['music', 'engine', 'app', 'daw', 'starmaker', 'studio'],
      action: () => router.push('/engines/music'),
      category: 'Engines',
    },
    {
      id: 'engine-code',
      label: 'CodeEngin App',
      description: 'Full-screen IDE with notebook, projects, AI',
      icon: Code2,
      iconColor: '#22d3ee',
      iconBg: 'rgba(34,211,238,0.12)',
      keywords: ['code', 'engine', 'app', 'ide', 'notebook'],
      action: () => router.push('/engines/code'),
      category: 'Engines',
    },
    {
      id: 'engine-lab',
      label: 'LabEngin App',
      description: 'Full-screen experiments, data viz, quantum',
      icon: FlaskConical,
      iconColor: '#10b981',
      iconBg: 'rgba(16,185,129,0.12)',
      keywords: ['lab', 'engine', 'app', 'experiment', 'quantum'],
      action: () => router.push('/engines/lab'),
      category: 'Engines',
    },
    {
      id: 'engine-brand',
      label: 'BrandingEngin App',
      description: 'Full-screen identity, analytics, campaigns',
      icon: Palette,
      iconColor: '#f472b6',
      iconBg: 'rgba(244,114,182,0.12)',
      keywords: ['brand', 'engine', 'app', 'identity', 'campaign'],
      action: () => router.push('/engines/brand'),
      category: 'Engines',
    },
    {
      id: 'engine-create',
      label: 'ContentEngin App',
      description: 'Full-screen editor, calendar, publish queue',
      icon: PenLine,
      iconColor: '#fb923c',
      iconBg: 'rgba(251,146,60,0.12)',
      keywords: ['create', 'content', 'engine', 'app', 'editor', 'publish'],
      action: () => router.push('/engines/create'),
      category: 'Engines',
    },
    {
      id: 'discover',
      label: 'Discover',
      description: 'Explore the DREAMengin universe',
      icon: Compass,
      iconColor: '#38bdf8',
      iconBg: 'rgba(56,189,248,0.10)',
      keywords: ['discover', 'explore', 'find', 'browse'],
      action: () => router.push('/discover'),
      category: 'Platform',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'Stats, metrics and insights',
      icon: TrendingUp,
      iconColor: '#34d399',
      iconBg: 'rgba(52,211,153,0.10)',
      keywords: ['analytics', 'stats', 'metrics', 'insights'],
      action: () => router.push('/analytics'),
      category: 'Platform',
    },
    {
      id: 'shop',
      label: 'DreamShop',
      description: 'Official platform commerce',
      icon: ShoppingBag,
      iconColor: '#fbbf24',
      iconBg: 'rgba(251,191,36,0.10)',
      keywords: ['shop', 'store', 'merch', 'buy', 'dreamshop'],
      action: () => router.push('/shop'),
      category: 'Platform',
    },
    {
      id: 'constellation',
      label: 'Dream Constellation',
      description: 'Visual map of all your surfaces',
      icon: Stars,
      iconColor: '#c084fc',
      iconBg: 'rgba(192,132,252,0.12)',
      keywords: ['constellation', 'map', 'surfaces', 'explore', 'graph'],
      action: () => router.push('/daydream/constellation'),
      category: 'Platform',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Preferences and account',
      icon: Settings,
      iconColor: 'rgba(148,180,220,0.70)',
      iconBg: 'rgba(148,180,220,0.08)',
      keywords: ['settings', 'preferences', 'config', 'account'],
      action: () => router.push('/settings'),
      category: 'System',
    },
  ];

  const filteredCommands = search
    ? commands.filter(cmd =>
        cmd.label.toLowerCase().includes(search.toLowerCase()) ||
        (cmd.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
        cmd.keywords.some(kw => kw.toLowerCase().includes(search.toLowerCase()))
      )
    : commands;

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setSearch('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') setIsOpen(false);
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
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
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => { setSelectedIndex(0); }, [search]);

  if (!isOpen) return null;

  let globalIndex = 0;

  return (
    <div className="cmd-backdrop" onClick={() => setIsOpen(false)}>
      {/* Modal — stop propagation so clicks inside don't close */}
      <div className="cmd-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Command palette" aria-modal="true">
        {/* ── Search row ── */}
        <div className="cmd-search-row">
          <Search className="cmd-search-icon" style={{ width: 18, height: 18 }} />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search commands, surfaces, daydreams…"
            className="cmd-search-input"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="cmd-kbd">ESC</span>
        </div>

        {/* ── Results ── */}
        <div className="cmd-results" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="cmd-empty">
              <Zap style={{ width: 28, height: 28, margin: '0 auto 10px', opacity: 0.3, display: 'block' }} />
              <p>No results for &ldquo;{search}&rdquo;</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div className="cmd-category">{category}</div>
                {cmds.map(cmd => {
                  const itemIndex = globalIndex++;
                  const isSelected = itemIndex === selectedIndex;
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      className={`cmd-item${isSelected ? ' selected' : ''}`}
                      onClick={() => { cmd.action(); setIsOpen(false); setSearch(''); }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                    >
                      <span
                        className="cmd-item-icon"
                        style={{ background: cmd.iconBg, borderColor: `${cmd.iconColor}20`, color: cmd.iconColor }}
                      >
                        <Icon style={{ width: 15, height: 15 }} />
                      </span>
                      <span style={{ flex: 1, textAlign: 'left' }}>
                        <span className="cmd-item-label">{cmd.label}</span>
                        {cmd.description && (
                          <span style={{ display: 'block', fontSize: 11, color: 'rgba(148,180,220,0.45)', marginTop: 1 }}>
                            {cmd.description}
                          </span>
                        )}
                      </span>
                      {cmd.shortcut && (
                        <span className="cmd-kbd cmd-item-hint">{cmd.shortcut}</span>
                      )}
                      {isSelected && !cmd.shortcut && (
                        <ArrowRight style={{ width: 13, height: 13, color: 'rgba(56,189,248,0.50)', flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: '1px solid rgba(56,189,248,0.08)',
          background: 'rgba(4,10,24,0.60)',
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(148,180,220,0.38)' }}>
              <span className="cmd-kbd">↑↓</span> navigate
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(148,180,220,0.38)' }}>
              <span className="cmd-kbd">↵</span> open
            </span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(148,180,220,0.30)' }}>
            <span className="cmd-kbd">⌘K</span>
          </span>
        </div>
      </div>
    </div>
  );
}
