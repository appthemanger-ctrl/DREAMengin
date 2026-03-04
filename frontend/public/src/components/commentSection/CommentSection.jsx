import React, { useState, useEffect } from 'react';
import CommentList from './CommentList';
import { generateLiveKitToken } from '../../services/livekit';
import { useRoom } from '@livekit/components-react';
import './CommentSection.css';

const CommentSection = ({ postId, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const room = useRoom();

  useEffect(() => {
    const connectToRoom = async () => {
      try {
        const token = await generateLiveKitToken(postId);
        await room.connect(`wss://${process.env.REACT_APP_LIVEKIT_URL}`, token);
        setIsConnected(true);
        
        // Listen for incoming comments
        room.on('dataReceived', (payload) => {
          if (payload.topic === `comment:${postId}`) {
            const comment = JSON.parse(payload.payload);
            setComments(prev => [...prev, comment]);
          }
        });
      } catch (error) {
        console.error('Error connecting to LiveKit room:', error);
      }
    };

    connectToRoom();
    
    return () => {
      room.disconnect();
    };
  }, [postId, room]);

  const sendComment = async () => {
    if (!newComment.trim() || !isConnected) return;
    
    const comment = {
      id: Date.now().toString(),
      text: newComment,
      timestamp: new Date(),
      author: {
        id: 'current-user', // In real app, use actual user info
        name: 'You'
      }
    };
    
    try {
      // Send comment via LiveKit data channel
      await room.engine.sendData(JSON.stringify(comment), {
        destination: 'all',
        topic: `comment:${postId}`
      });
      
      // Add to local state
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error sending comment:', error);
    }
  };

  return (
    <div className="comment-section-overlay">
      <div className="comment-section">
        <div className="comment-header">
          <h3>Comments</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <CommentList comments={comments} />
        
        <div className="comment-input-container">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="comment-input"
            onKeyPress={(e) => e.key === 'Enter' && sendComment()}
          />
          <button 
            className="send-btn"
            onClick={sendComment}
            disabled={!newComment.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;