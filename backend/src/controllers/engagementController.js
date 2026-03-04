import Web3 from 'web3';
import SocialEngagementABI from '../../contracts/build/contracts/SocialEngagement.json' assert { type: 'json' };

const web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(SocialEngagementABI.abi, contractAddress);

export const trackEngagement = async (req, res) => {
  try {
    const { contentId, action, userAddress } = req.body;
    
    if (!['like', 'repost', 'comment'].includes(action)) {
      return res.status(400).json({ error: 'Invalid engagement action' });
    }
    
    // Call blockchain contract
    const txData = contract.methods[`${action}Content`](contentId).encodeABI();
    
    // In production, this would be signed by the user's wallet
    // For demo, we're using a server-managed wallet
    const tx = {
      from: process.env.SERVER_WALLET,
      to: contractAddress,
      data: txData,
      gas: 500000
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(
      tx, 
      process.env.SERVER_PRIVATE_KEY
    );
    
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    res.json({ 
      success: true,
      transactionHash: receipt.transactionHash
    });
  } catch (error) {
    console.error('Engagement tracking error:', error);
    res.status(500).json({ error: 'Failed to track engagement' });
  }
};

export const getEngagementStats = async (req, res) => {
  try {
    const { contentId } = req.params;
    const stats = await contract.methods.contentEngagement(contentId).call();
    
    res.json({
      likes: stats.likes,
      reposts: stats.reposts,
      comments: stats.comments
    });
  } catch (error) {
    console.error('Engagement stats error:', error);
    res.status(500).json({ error: 'Failed to get engagement stats' });
  }
};