import React, { createContext, useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import SocialEngagementABI from '../../contracts/build/contracts/SocialEngagement.json';

export const BlockchainContext = createContext();

export const BlockchainProvider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const initWeb3 = useCallback(async () => {
    if (window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        // Get network ID
        const id = await web3Instance.eth.net.getId();
        setChainId(id);
        
        // Load contract
        const networkData = SocialEngagementABI.networks[id];
        if (networkData) {
          const contractInstance = new web3Instance.eth.Contract(
            SocialEngagementABI.abi,
            networkData.address
          );
          setContract(contractInstance);
        }
        
        return web3Instance;
      } catch (error) {
        console.error('Error initializing Web3:', error);
      }
    } else {
      console.warn('No Ethereum provider detected');
    }
    return null;
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }
    
    setIsConnecting(true);
    try {
      const web3Instance = await initWeb3();
      if (!web3Instance) return;
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      setAccount(accounts[0]);
      localStorage.setItem('walletConnected', 'true');
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [initWeb3]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setContract(null);
    localStorage.removeItem('walletConnected');
  }, []);

  const likeContent = useCallback(async (contentId) => {
    if (!contract || !account) return;
    
    return contract.methods.likeContent(contentId).send({ from: account });
  }, [contract, account]);

  const repostContent = useCallback(async (contentId) => {
    if (!contract || !account) return;
    
    return contract.methods.repostContent(contentId).send({ from: account });
  }, [contract, account]);

  const commentContent = useCallback(async (contentId, comment) => {
    if (!contract || !account) return;
    
    return contract.methods.commentContent(contentId, comment).send({ from: account });
  }, [contract, account]);

  // Auto-connect on load if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('walletConnected');
      if (wasConnected && window.ethereum) {
        await connectWallet();
      }
    };
    
    autoConnect();
  }, [connectWallet]);

  // Handle account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;
    
    const handleAccountsChanged = (accounts) => {
      setAccount(accounts[0] || null);
    };
    
    const handleChainChanged = (chainId) => {
      window.location.reload();
    };
    
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  return (
    <BlockchainContext.Provider
      value={{
        web3,
        account,
        contract,
        chainId,
        isConnecting,
        connectWallet,
        disconnectWallet,
        likeContent,
        repostContent,
        commentContent
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};