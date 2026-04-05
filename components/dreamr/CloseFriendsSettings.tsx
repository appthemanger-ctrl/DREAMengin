'use client';

/**
 * CloseFriendsSettings — manage the Close Friends list (spec §4).
 *
 * Allows the user to search for other users by handle, add them to
 * Close Friends, and remove existing entries.
 *
 * Close-friends posts are only visible to users in this list; they bypass
 * the public rate limit (50/5 min vs 10/5 min for public posts).
 */

import { useCallback, useEffect, useState } from 'react';
import { Users, UserPlus, UserMinus, Search, Loader2, X } from 'lucide-react';

interface Friend {
  friend_id: string;
  added_at: string;
  profiles: {
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface SearchResult {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
}

const ACCENT = '#c8981a';

export default function CloseFriendsSettings() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [actionId, setActionId] = useState<string | null>(null);

  // ── Load current close friends ─────────────────────────────────────────────
  const loadFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/close-friends');
      if (!res.ok) throw new Error('Failed to load close friends');
      const data = await res.json();
      setFriends(data.close_friends ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadFriends(); }, [loadFriends]);

  // ── Search for users ───────────────────────────────────────────────────────
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(query)}&limit=10`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data.profiles ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // ── Add a friend ───────────────────────────────────────────────────────────
  const addFriend = useCallback(async (friendId: string) => {
    setActionId(friendId);
    try {
      const res = await fetch('/api/close-friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_id: friendId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to add');
      }
      setSearchQuery('');
      setSearchResults([]);
      await loadFriends();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add friend');
    } finally {
      setActionId(null);
    }
  }, [loadFriends]);

  // ── Remove a friend ────────────────────────────────────────────────────────
  const removeFriend = useCallback(async (friendId: string) => {
    setActionId(friendId);
    try {
      const res = await fetch(`/api/close-friends?friend_id=${encodeURIComponent(friendId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to remove');
      }
      await loadFriends();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove friend');
    } finally {
      setActionId(null);
    }
  }, [loadFriends]);

  const friendIds = new Set(friends.map(f => f.friend_id));

  return (
    <div className="flex flex-col gap-6 p-4 rounded-xl" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="w-5 h-5" style={{ color: ACCENT }} />
        <div>
          <h2 className="text-white font-semibold text-base">Close Friends</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Close-friends posts are only visible to people on this list. No rate limit on close-friends posts.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 rounded-lg px-3 py-2">
          <X className="w-4 h-4 shrink-0" />
          {error}
          <button className="ml-auto text-zinc-400 hover:text-white" onClick={() => setError(null)}>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by handle…"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-zinc-500 flex-1 outline-none"
          />
          {searching && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin shrink-0" />}
        </div>

        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden z-20 shadow-xl">
            {searchResults.map(result => {
              const alreadyAdded = friendIds.has(result.id);
              return (
                <div key={result.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                    {result.avatar_url && (
                      <img src={result.avatar_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {result.display_name || `@${result.handle}`}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">@{result.handle}</p>
                  </div>
                  <button
                    disabled={alreadyAdded || actionId === result.id}
                    onClick={() => addFriend(result.id)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                    style={{
                      background: alreadyAdded ? 'rgba(200,152,26,0.1)' : 'rgba(200,152,26,0.15)',
                      color: ACCENT,
                      border: `1px solid rgba(200,152,26,0.25)`,
                    }}
                  >
                    {actionId === result.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <UserPlus className="w-3 h-3" />}
                    {alreadyAdded ? 'Added' : 'Add'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Current list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
        </div>
      ) : friends.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">No close friends yet.</p>
          <p className="text-zinc-600 text-xs mt-1">Search above to add people.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {friends.map(f => (
            <li key={f.friend_id} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-9 h-9 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                {f.profiles?.avatar_url && (
                  <img src={f.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {f.profiles?.display_name || (f.profiles?.handle ? `@${f.profiles.handle}` : f.friend_id)}
                </p>
                {f.profiles?.handle && (
                  <p className="text-xs text-zinc-400 truncate">@{f.profiles.handle}</p>
                )}
              </div>
              <button
                disabled={actionId === f.friend_id}
                onClick={() => removeFriend(f.friend_id)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors text-zinc-400 hover:text-red-400 hover:bg-red-950/30 disabled:opacity-50"
              >
                {actionId === f.friend_id
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <UserMinus className="w-3 h-3" />}
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-zinc-600">
        {friends.length} {friends.length === 1 ? 'person' : 'people'} on your close friends list.
      </p>
    </div>
  );
}
