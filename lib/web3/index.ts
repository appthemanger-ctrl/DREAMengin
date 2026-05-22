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
export { DEFAULT_CHAIN_ID, SUPPORTED_CHAINS, Web3Error } from './types';
export type {
    ChainConfig, EngagementPayload,
    EngagementStats, IpfsContent, IpfsUploadResult, WalletAccount,
    WalletConnectionState, WalletProvider
} from './types';

// Wallet client
export { Web3Client, web3Client } from './client';

// Engagement
export {
    applyOptimisticEngagement, clearOptimisticDelta, getEngagementStats, getOptimisticDelta, trackEngagement
} from './engagement';

// IPFS
export {
    getFromIpfs, isIpfsCid, pinCid,
    resolveIpfsUrl, uploadFileToIpfs, uploadToIpfs
} from './ipfs';
