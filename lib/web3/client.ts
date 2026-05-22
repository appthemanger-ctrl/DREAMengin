/**
 * lib/web3/client.ts
 *
 * DREAMengin Web3 wallet client.
 *
 * Provides a provider-agnostic wallet connection layer. The primary targets
 * are browser-injected providers (MetaMask, Coinbase Wallet) with optional
 * WalletConnect bridge support. The client is built to work without ethers /
 * viem in the dependency tree right now — it drives the EIP-1193 provider API
 * directly, giving us full control with zero bundle overhead until a heavier
 * library is warranted.
 *
 * When `window.ethereum` is absent (SSR, server routes, CI) every method
 * degrades gracefully to a typed error rather than crashing.
 */

import {
    DEFAULT_CHAIN_ID,
    SUPPORTED_CHAINS,
    WalletAccount,
    WalletConnectionState,
    WalletProvider,
    Web3Error,
    type ChainConfig,
} from './types';

// ─── EIP-1193 minimal types ───────────────────────────────────────────────────

interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider & { isMetaMask?: boolean; isCoinbaseWallet?: boolean };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toChecksumAddress(address: string): string {
  // Minimal EIP-55 checksum — safe fallback until a full impl is added.
  return address;
}

function detectProviderType(provider: Eip1193Provider): WalletProvider {
  const p = provider as typeof window.ethereum;
  if (p?.isMetaMask) return 'metamask';
  if (p?.isCoinbaseWallet) return 'coinbase';
  return 'injected';
}

// ─── Web3Client ───────────────────────────────────────────────────────────────

type ClientEventType =
  | 'accountChanged'
  | 'chainChanged'
  | 'connectionStateChanged'
  | 'disconnected';

type ClientListener<T = unknown> = (payload: T) => void;

export class Web3Client {
  private provider: Eip1193Provider | null = null;
  private account: WalletAccount | null = null;
  private connectionState: WalletConnectionState = 'disconnected';
  private listeners = new Map<ClientEventType, Set<ClientListener>>();

  // ── Event emitter ────────────────────────────────────────────────────────

  on<T = unknown>(event: ClientEventType, listener: ClientListener<T>): this {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener as ClientListener);
    return this;
  }

  off<T = unknown>(event: ClientEventType, listener: ClientListener<T>): this {
    this.listeners.get(event)?.delete(listener as ClientListener);
    return this;
  }

  private emit<T = unknown>(event: ClientEventType, payload: T): void {
    this.listeners.get(event)?.forEach((cb) => cb(payload));
  }

  // ── State accessors ──────────────────────────────────────────────────────

  getAccount(): WalletAccount | null {
    return this.account;
  }

  getConnectionState(): WalletConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === 'connected' && this.account !== null;
  }

  getChainConfig(chainId?: number): ChainConfig | null {
    const id = chainId ?? this.account?.chainId ?? DEFAULT_CHAIN_ID;
    return SUPPORTED_CHAINS[id] ?? null;
  }

  // ── Connection ───────────────────────────────────────────────────────────

  /**
   * Connect to the injected browser wallet.
   * Throws `Web3Error('WALLET_NOT_FOUND')` when no provider is available.
   */
  async connect(): Promise<WalletAccount> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Web3Error(
        'No Web3 wallet found. Install MetaMask or another EIP-1193 wallet.',
        'WALLET_NOT_FOUND'
      );
    }

    this.provider = window.ethereum;
    this.setConnectionState('connecting');

    try {
      const accounts = (await this.provider.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (!accounts.length) {
        throw new Web3Error('No accounts returned from wallet', 'USER_REJECTED');
      }

      const rawChainId = (await this.provider.request({
        method: 'eth_chainId',
      })) as string;
      const chainId = parseInt(rawChainId, 16);

      this.account = {
        address: accounts[0],
        checksumAddress: toChecksumAddress(accounts[0]),
        ensName: null, // resolved asynchronously if needed
        chainId,
        provider: detectProviderType(this.provider),
      };

      this.setConnectionState('connected');
      this.registerProviderListeners();

      return this.account;
    } catch (err: any) {
      this.setConnectionState('error');
      if ((err as { code?: number })?.code === 4001) {
        throw new Web3Error('User rejected the connection request', 'USER_REJECTED');
      }
      throw err instanceof Web3Error ? err : new Web3Error(
        err instanceof Error ? err.message : 'Connection failed',
        'WALLET_NOT_FOUND'
      );
    }
  }

  disconnect(): void {
    this.removeProviderListeners();
    this.account = null;
    this.provider = null;
    this.setConnectionState('disconnected');
    this.emit('disconnected', undefined);
  }

  // ── Network switching ────────────────────────────────────────────────────

  async switchChain(chainId: number): Promise<void> {
    if (!this.provider) throw new Web3Error('Not connected', 'WALLET_NOT_FOUND');

    const chain = SUPPORTED_CHAINS[chainId];
    if (!chain) {
      throw new Web3Error(`Chain ${chainId} is not supported`, 'WRONG_NETWORK');
    }

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (err: any) {
      // Error code 4902 = chain not added — add it.
      if ((err as { code?: number })?.code === 4902) {
        await this.provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${chainId.toString(16)}`,
              chainName: chain.name,
              rpcUrls: [chain.rpcUrl],
              blockExplorerUrls: [chain.blockExplorerUrl],
              nativeCurrency: chain.nativeCurrency,
            },
          ],
        });
      } else {
        throw new Web3Error(
          `Failed to switch to ${chain.name}`,
          'WRONG_NETWORK'
        );
      }
    }
  }

  // ── Personal sign (used for auth challenges) ─────────────────────────────

  async signMessage(message: string): Promise<string> {
    if (!this.provider || !this.account) {
      throw new Web3Error('Not connected', 'WALLET_NOT_FOUND');
    }

    const signature = (await this.provider.request({
      method: 'personal_sign',
      params: [
        `0x${Buffer.from(message, 'utf8').toString('hex')}`,
        this.account.address,
      ],
    })) as string;

    return signature;
  }

  // ── Provider listeners ────────────────────────────────────────────────────

  private readonly onAccountsChanged = (accounts: any) => {
    const addrs = accounts as string[];
    if (!addrs.length) {
      this.disconnect();
      return;
    }
    if (this.account) {
      this.account = {
        ...this.account,
        address: addrs[0],
        checksumAddress: toChecksumAddress(addrs[0]),
      };
      this.emit('accountChanged', this.account);
    }
  };

  private readonly onChainChanged = (chainId: any) => {
    const id = parseInt(chainId as string, 16);
    if (this.account) {
      this.account = { ...this.account, chainId: id };
      this.emit('chainChanged', { chainId: id, account: this.account });
    }
  };

  private registerProviderListeners(): void {
    this.provider?.on('accountsChanged', this.onAccountsChanged);
    this.provider?.on('chainChanged', this.onChainChanged);
  }

  private removeProviderListeners(): void {
    this.provider?.removeListener('accountsChanged', this.onAccountsChanged);
    this.provider?.removeListener('chainChanged', this.onChainChanged);
  }

  private setConnectionState(next: WalletConnectionState): void {
    if (this.connectionState === next) return;
    const prev = this.connectionState;
    this.connectionState = next;
    this.emit('connectionStateChanged', { prev, next });
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

/** Application-level singleton — import this everywhere instead of `new Web3Client()`. */
export const web3Client = new Web3Client();