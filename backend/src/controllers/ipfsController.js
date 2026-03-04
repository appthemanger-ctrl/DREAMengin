import IpfsService from '../services/ipfsService.js';

const ipfs = new IpfsService();

export const uploadContent = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const cid = await ipfs.uploadContent(content);
    await ipfs.pinContent(cid);
    
    res.json({ 
      cid,
      url: `ipfs://${cid}`,
      gatewayUrl: `https://ipfs.io/ipfs/${cid}`
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload content' });
  }
};

export const getContent = async (req, res) => {
  try {
    const { cid } = req.params;
    const content = await ipfs.getContent(cid);
    
    // Set appropriate content type
    res.set('Content-Type', 'text/plain');
    res.send(content);
  } catch (error) {
    console.error('IPFS retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve content' });
  }
};