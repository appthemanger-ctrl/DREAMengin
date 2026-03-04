import React from 'react';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import './Feed.css';

const FeedItem = ({ post, isActive }) => {
  return (
    <div className={`feed-item ${isActive ? 'active' : ''}`}>
      <VideoPlayer 
        post={post} 
        isActive={isActive} 
      />
      <div className="post-info">
        <div className="user-info">
          <img 
            src={post.author.avatar || '/default-avatar.png'} 
            alt={post.author.displayName} 
            className="avatar"
          />
          <div>
            <h3 className="display-name">{post.author.displayName}</h3>
            <p className="handle">@{post.author.handle}</p>
          </div>
        </div>
        <p className="post-content">{post.content}</p>
      </div>
    </div>
  );
};

export default FeedItem;