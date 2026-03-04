import React, { useRef, useEffect, useState } from 'react';
import EngagementOverlay from './EngagementOverlay';
import CommentSection from '../CommentSection/CommentSection';
import { useBlockchain } from '../../hooks/useBlockchain';
import './VideoPlayer.css';

const VideoPlayer = ({ post, isActive }) => {
  const videoRef = useRef(null);
  const { likePost, repostPost } = useBlockchain();
  const [showComments, setShowComments] = useState(false);
  const [engagement, setEngagement] = useState(post.engagement);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive]);

  const handleLike = async () => {
    try {
      await likePost(post.id);
      setEngagement(prev => ({ ...prev, likes: prev.likes + 1 }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleRepost = async () => {
    try {
      await repostPost(post.id);
      setEngagement(prev => ({ ...prev, reposts: prev.reposts + 1 }));
    } catch (error) {
      console.error('Error reposting:', error);
    }
  };

  return (
    <div className="video-player-container">
      <video
        ref={videoRef}
        src={post.mediaUrl}
        loop
        muted={!isActive}
        playsInline
        className="video-element"
      />
      
      <EngagementOverlay 
        engagement={engagement}
        onLike={handleLike}
        onRepost={handleRepost}
        onComment={() => setShowComments(true)}
      />
      
      {showComments && (
        <CommentSection 
          postId={post.id} 
          onClose={() => setShowComments(false)} 
        />
      )}
    </div>
  );
};

export default VideoPlayer;