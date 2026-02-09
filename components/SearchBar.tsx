'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Loader2, X, User } from 'lucide-react';

interface SearchUser {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface SearchPost {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Close results on outside click
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setUsers([]);
      setPosts([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
          setPosts(data.posts || []);
          setShowResults(true);
        }
      } catch {
        // Search failed silently
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div ref={containerRef} className="relative max-w-2xl">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.trim() && (users.length > 0 || posts.length > 0)) {
            setShowResults(true);
          }
        }}
        placeholder="Search users and posts..."
        className="w-full pl-12 pr-10 py-3.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-[44px]"
      />
      {isSearching && (
        <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
      )}
      {query && !isSearching && (
        <button
          onClick={() => {
            setQuery('');
            setShowResults(false);
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Search results dropdown */}
      {showResults && (users.length > 0 || posts.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
          {/* Users */}
          {users.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                People
              </div>
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.handle}`}
                  onClick={() => setShowResults(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                >
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.display_name || user.handle}
                      width={36}
                      height={36}
                      className="rounded-full object-cover ring-1 ring-border"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center ring-1 ring-border">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {user.display_name || user.handle}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">@{user.handle}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Posts */}
          {posts.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                Posts
              </div>
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/profile/${post.profiles?.handle}`}
                  onClick={() => setShowResults(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors"
                >
                  {post.profiles?.avatar_url ? (
                    <Image
                      src={post.profiles.avatar_url}
                      alt={post.profiles.display_name || post.profiles.handle}
                      width={36}
                      height={36}
                      className="rounded-full object-cover ring-1 ring-border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center ring-1 ring-border flex-shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      @{post.profiles?.handle}
                    </p>
                    <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {showResults && query.trim() && users.length === 0 && posts.length === 0 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg p-6 text-center z-50">
          <p className="text-muted-foreground text-sm">No results for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
