import React, { useContext } from 'react';
import { BlockchainContext } from '../../contexts/BlockchainContext';
import './WalletConnect.css';

const WalletConnect = () => {
  const { 
    account, 
    connectWallet, 
    disconnectWallet, 
    chainId, 
    isConnecting 
  } = useContext(BlockchainContext);

  const shortenAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="wallet-connect">
      {account ? (
        <div className="wallet-info">
          <span className="network-badge">{chainId === 1 ? 'Mainnet' : 'Testnet'}</span>
          <span className="account-address">{shortenAddress(account)}</span>
          <button className="disconnect-btn" onClick={disconnectWallet}>Disconnect</button>
        </div>
      ) : (
        <button 
          className="connect-btn"
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
};

export default WalletConnect;