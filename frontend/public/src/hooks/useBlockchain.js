import { useContext } from 'react';
import { BlockchainContext } from '../contexts/BlockchainContext';

const useBlockchain = () => {
  const { 
    contract, 
    likeContent, 
    repostContent,
    commentContent
  } = useContext(BlockchainContext);

  const likePost = async (contentId) => {
    if (!contract) throw new Error('Wallet not connected');
    return likeContent(contentId);
  };

  const repostPost = async (contentId) => {
    if (!contract) throw new Error('Wallet not connected');
    return repostContent(contentId);
  };

  const commentOnPost = async (contentId, comment) => {
    if (!contract) throw new Error('Wallet not connected');
    return commentContent(contentId, comment);
  };

  return {
    likePost,
    repostPost,
    commentOnPost
  };
};

export default useBlockchain;