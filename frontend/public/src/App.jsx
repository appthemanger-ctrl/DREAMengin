import React from 'react';
import Feed from './components/Feed/Feed';
import WalletConnect from './components/WalletConnect/WalletConnect';
import { BlockchainProvider } from './contexts/BlockchainContext.';
import './index.css';

function App() {
  return (
    <BlockchainProvider>
      <div className="app-container">
        <header className="app-header">
          <h1>DecentraFeed</h1>
          <WalletConnect />
        </header>
        <main className="feed-main">
          <Feed />
        </main>
      </div>
    </BlockchainProvider>
  );
}

export default App;