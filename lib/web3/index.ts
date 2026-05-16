/**
 * lib/web3/index.ts
 *
 * Public surface for DREAMengin's Web3 layer.
 *
 * Import from here instead of from individual sub-modules:
 *
 *   import { web3Client, trackEngagement, uploadToIpfs } from '@/lib/web3';
 */

// Types
export type {
  WalletProvider,
  WalletAccount,
  WalletConnectionState,
  EngagementPayload,
  EngagementStats,
  IpfsUploadResult,
  IpfsContent,
  ChainConfig,
} from './types';
export { Web3Error, SUPPORTED_CHAINS, DEFAULT_CHAIN_ID } from './types';

// Wallet client
export { Web3Client, web3Client } from './client';

// Engagement
export {
  trackEngagement,
  getEngagementStats,
  applyOptimisticEngagement,
  getOptimisticDelta,
  clearOptimisticDelta,
} from './engagement';

// IPFS
export {
  uploadToIpfs,
  uploadFileToIpfs,
  getFromIpfs,
  pinCid,
  resolveIpfsUrl,
  isIpfsCid,
} from './ipfs';
