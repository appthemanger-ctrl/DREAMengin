import React from 'react';
import { FaHeart, FaRetweet, FaComment } from 'react-icons/fa';
import './VideoPlayer.css';

const EngagementOverlay = ({ engagement, onLike, onRepost, onComment }) => {
  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count;
  };

  return (
    <div className="engagement-overlay">
      <div className="engagement-buttons">
        <button className="engagement-btn" onClick={onLike}>
          <FaHeart className="icon" />
          <span>{formatCount(engagement.likes)}</span>
        </button>
        <button className="engagement-btn" onClick={onRepost}>
          <FaRetweet className="icon" />
          <span>{formatCount(engagement.reposts)}</span>
        </button>
        <button className="engagement-btn" onClick={onComment}>
          <FaComment className="icon" />
          <span>{formatCount(engagement.comments)}</span>
        </button>
      </div>
    </div>
  );
};

export default EngagementOverlay;