import React from 'react';
import './CommentSection.css';

const CommentList = ({ comments }) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="no-comments">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="comment-list">
      {comments.map(comment => (
        <div key={comment.id} className="comment-item">
          <div className="comment-header">
            <span className="comment-author">{comment.author.name}</span>
            <span className="comment-time">
              {formatTimeAgo(comment.timestamp)}
            </span>
          </div>
          <div className="comment-text">{comment.text}</div>
        </div>
      ))}
    </div>
  );
};

// Helper function to format time
const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const commentTime = new Date(timestamp);
  const diffSeconds = Math.floor((now - commentTime) / 1000);
  
  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
};

export default CommentList;