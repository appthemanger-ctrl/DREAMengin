import Web3 from 'web3';

/**
 * Checks if MetaMask is installed
 * @returns {boolean}
 */
export const isMetaMaskInstalled = () => {
  return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
};

/**
 * Gets the current network name from chainId
 * @param {number} chainId 
 * @returns {string} Network name
 */
export const getNetworkName = (chainId) => {
  switch (parseInt(chainId)) {
    case 1: return 'Mainnet';
    case 3: return 'Ropsten';
    case 4: return 'Rinkeby';
    case 5: return 'Goerli';
    case 42: return 'Kovan';
    case 137: return 'Polygon';
    case 80001: return 'Mumbai';
    default: return 'Unknown';
  }
};

/**
 * Shortens an Ethereum address
 * @param {string} address 
 * @param {number} chars 
 * @returns {string} Shortened address
 */
export const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

/**
 * Converts wei to ether
 * @param {string|BigNumber} wei 
 * @returns {string} Ether value
 */
export const weiToEther = (wei) => {
  return Web3.utils.fromWei(wei, 'ether');
};

/**
 * Converts ether to wei
 * @param {string|number} ether 
 * @returns {string} Wei value
 */
export const etherToWei = (ether) => {
  return Web3.utils.toWei(ether.toString(), 'ether');
};