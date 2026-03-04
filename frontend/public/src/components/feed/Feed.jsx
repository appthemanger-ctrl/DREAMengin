import React, { useState, useEffect } from 'react';
import FeedItem from './FeedItem';
import { useSocialData } from '../../hooks/useSocialData';
import './Feed.css';

const Feed = () => {
  const { posts, loading, error, loadMore } = useSocialData();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleScroll = (e) => {
      if (e.deltaY > 0) {
        setCurrentIndex(prev => Math.min(prev + 1, posts.length - 1));
      } else {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('wheel', handleScroll);
    return () => window.removeEventListener('wheel', handleScroll);
  }, [posts.length]);

  // Load more when reaching near the end
  useEffect(() => {
    if (currentIndex >= posts.length - 3 && !loading) {
      loadMore();
    }
  }, [currentIndex, posts.length, loading, loadMore]);

  if (error) return <div className="error">Error loading feed: {error.message}</div>;
  
  return (
    <div className="feed-container">
      {posts.map((post, index) => (
        <FeedItem 
          key={post.id} 
          post={post} 
          isActive={index === currentIndex} 
        />
      ))}
      {loading && <div className="loading">Loading more posts...</div>}
    </div>
  );
};

export default Feed;