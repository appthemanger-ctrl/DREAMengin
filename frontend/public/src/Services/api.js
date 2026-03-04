import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

export const fetchFeed = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/feed`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch feed');
  }
};

export const getEngagementStats = async (contentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/engagement/stats/${contentId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to get engagement stats');
  }
};

export const uploadToIPFS = async (content) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ipfs/upload`, { content });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to upload to IPFS');
  }
};