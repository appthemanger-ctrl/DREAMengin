'use client';

import { Search, Filter, X, TrendingUp, Users, FileText, Music, ShoppingBag, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'lab' | 'music' | 'product';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  metadata?: Record<string, string>;
}

export default function AdvancedSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const searchRef = useRef<HTMLDivElement>(null);

  const filters = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'lab', label: 'Lab Projects', icon: TrendingUp },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'products', label: 'Products', icon: ShoppingBag }
  ];

  // Mock search results - in production, this would call your search API
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'user',
      title: 'Dr. Sarah Chen',
      description: 'Quantum physicist and AI researcher',
      url: '/profile/sarahchen',
      metadata: { followers: '2.3K', posts: '145' }
    },
    {
      id: '2',
      type: 'post',
      title: 'The Future of Quantum Computing',
      description: 'Exploring how quantum algorithms will revolutionize cryptography...',
      url: '/post/123',
      metadata: { likes: '456', comments: '89' }
    },
    {
      id: '3',
      type: 'lab',
      title: 'Neural Network Optimization',
      description: 'Research project on improving training efficiency',
      url: '/lab/456',
      metadata: { members: '12', papers: '3' }
    },
    {
      id: '4',
      type: 'music',
      title: 'Electron Dreams EP',
      description: 'Electronic fusion experimental album',
      url: '/music/789',
      metadata: { plays: '12.5K', duration: '24:32' }
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length > 0) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const filtered = mockResults.filter(r => {
          const matchesQuery = r.title.toLowerCase().includes(query.toLowerCase()) ||
                              r.description.toLowerCase().includes(query.toLowerCase());
          const matchesFilter = selectedFilter === 'all' ||
                               (selectedFilter === 'users' && r.type === 'user') ||
                               (selectedFilter === 'posts' && r.type === 'post') ||
                               (selectedFilter === 'lab' && r.type === 'lab') ||
                               (selectedFilter === 'music' && r.type === 'music') ||
                               (selectedFilter === 'products' && r.type === 'product');
          return matchesQuery && matchesFilter;
        });
        setResults(filtered);
        setIsLoading(false);
      }, 300);
    } else {
      setResults([]);
    }
  }, [query, selectedFilter]);

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'post':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'lab':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'music':
        return <Music className="w-4 h-4 text-pink-500" />;
      case 'product':
        return <ShoppingBag className="w-4 h-4 text-orange-500" />;
    }
  };

  const getTypeBadge = (type: SearchResult['type']) => {
    const badges = {
      user: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      post: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      lab: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      music: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
      product: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
    };
    return badges[type];
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search users, posts, projects, music..."
          className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 dark:bg-slate-800 dark:text-white"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {isOpen && (query.length > 0 || selectedFilter !== 'all') && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Filters */}
          <div className="flex gap-2 p-3 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    selectedFilter === filter.id
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <div className="animate-spin w-8 h-8 border-4 border-slate-300 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full mx-auto"></div>
                <p className="mt-3 text-sm">Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {query ? 'No results found' : 'Start typing to search'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {results.map((result) => (
                  <a
                    key={result.id}
                    href={result.url}
                    className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getTypeIcon(result.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-medium text-slate-900 dark:text-white truncate">
                            {result.title}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadge(result.type)}`}>
                            {result.type}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {result.description}
                        </p>
                        {result.metadata && (
                          <div className="flex gap-3 mt-2 text-xs text-slate-500 dark:text-slate-500">
                            {Object.entries(result.metadata).map(([key, value]) => (
                              <span key={key}>
                                {key}: <span className="font-medium">{value}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {results.length > 0 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                Press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs">↵</kbd> to open first result
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
