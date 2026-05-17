/**
 * lib/web3/types.ts
 *
 * Type definitions for DREAMengin's Web3 layer — wallet connection,
 * on-chain engagement tracking, and IPFS content addressing.
 *
 * These types form the contract between the on-chain backend, the IPFS
 * content store, and the DREAMengin feed system. They are intentionally
 * provider-agnostic so the implementation can swap between ethers / viem /
 * wagmi without touching callers.
 */

// ─── Wallet ───────────────────────────────────────────────────────────────────

export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase' | 'injected';

export interface WalletAccount {
  address: string;
  /** Checksummed EIP-55 address */
  checksumAddress: string;
  /** ENS name if resolved, otherwise null */
  ensName: string | null;
  /** Chain ID the wallet is connected to */
  chainId: number;
  provider: WalletProvider;
}

export type WalletConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export class Web3Error extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'WALLET_NOT_FOUND'
      | 'USER_REJECTED'
      | 'WRONG_NETWORK'
      | 'TX_FAILED'
      | 'IPFS_ERROR'
      | 'CONTRACT_ERROR'
  ) {
    super(message);
    this.name = 'Web3Error';
  }
}

// ─── On-chain engagement ──────────────────────────────────────────────────────

/** Mirrors the backend engagementController shape */
export interface EngagementPayload {
  contentId: string;
  /** CID on IPFS if the content is stored decentrally */
  contentCid?: string;
  type: 'like' | 'repost' | 'comment';
  /** Wallet address of the engaging user */
  actor: string;
  /** ISO timestamp — defaults to now */
  timestamp?: string;
  /** EVM transaction hash once the engagement is settled on-chain */
  txHash?: string;
}

export interface EngagementStats {
  contentId: string;
  likes: number;
  reposts: number;
  comments: number;
  /** Chain-verified engagement count (may lag behind optimistic count) */
  verifiedLikes: number;
  /** Whether the current wallet has liked this content */
  hasLiked: boolean;
}

// ─── IPFS ─────────────────────────────────────────────────────────────────────

export interface IpfsUploadResult {
  /** v1 CID string */
  cid: string;
  /** Full ipfs:// URI */
  uri: string;
  /** Public HTTP gateway URL for in-browser preview */
  gatewayUrl: string;
  /** Size in bytes */
  size: number;
}

export interface IpfsContent {
  cid: string;
  /** Decoded UTF-8 string content */
  content: string;
  /** MIME type if determinable, otherwise null */
  mimeType: string | null;
}

// ─── Network config ───────────────────────────────────────────────────────────

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  /** DREAMengin engagement contract address on this chain */
  engagementContractAddress: string | null;
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    engagementContractAddress: null, // set when contract is deployed
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    engagementContractAddress: null,
  },
  11155111: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    engagementContractAddress: null,
  },
};

export const DEFAULT_CHAIN_ID = 137; // Polygon — low gas, high throughput
