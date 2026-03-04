import { useState, useEffect, useCallback } from 'react';
import { fetchFeed } from '../services/api';

const useSocialData = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchFeed(page);
      setPosts(prev => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading]);

  useEffect(() => {
    loadPosts();
  }, []);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore: loadPosts
  };
};

export default useSocialData;