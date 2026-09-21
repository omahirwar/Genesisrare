import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import WalletModal from '../components/WalletModal';

export type WalletType = 'okx' | 'metamask' | 'rabby' | 'other' | null;

export interface Web3ContextType {
  account: string | null;
  chainId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  walletType: WalletType;
  walletName: string;
  hasInjectedProvider: boolean;
  error: string | null;
  isModalOpen: boolean;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  connectWallet: (walletChoice?: WalletType) => Promise<string | null>;
  disconnectWallet: () => void;
  shortAccount: string;
  switchToRobinhood: () => Promise<void>;
}

const EVM_REGEX = /^0x[a-fA-F0-9]{40}$/;

declare global {
  interface Window {
    ethereum?: any;
    okxwallet?: any;
    rabby?: any;
  }
}

export function getProviderForWallet(type?: WalletType): { provider: any; name: string; downloadUrl: string } {
  if (typeof window === 'undefined') {
    return { provider: null, name: 'Web3 Wallet', downloadUrl: '' };
  }

  let eth = window.ethereum;
  let okx = window.okxwallet;
  let rabby = window.rabby;

  // Check parent frame in case preview is framed
  try {
    if (!eth && window.parent && (window.parent as any).ethereum) {
      eth = (window.parent as any).ethereum;
    }
    if (!okx && window.parent && (window.parent as any).okxwallet) {
      okx = (window.parent as any).okxwallet;
    }
  } catch {
    // Cross-origin restriction
  }

  if (type === 'okx') {
    const p = okx?.ethereum || okx || (eth?.isOkxWallet ? eth : null) || eth?.providers?.find((x: any) => x.isOkxWallet);
    return { provider: p || null, name: 'OKX Wallet', downloadUrl: 'https://www.okx.com/web3' };
  }

  if (type === 'rabby') {
    const p = rabby || (eth?.isRabby ? eth : null) || eth?.providers?.find((x: any) => x.isRabby);
    return { provider: p || null, name: 'Rabby Wallet', downloadUrl: 'https://rabby.io/' };
  }

  if (type === 'metamask') {
    const p = eth?.providers?.find((x: any) => x.isMetaMask && !x.isRabby && !x.isOkxWallet) || 
              (eth?.isMetaMask && !eth?.isRabby && !eth?.isOkxWallet ? eth : null) || 
              (eth && !eth?.isRabby && !eth?.isOkxWallet ? eth : null);
    return { provider: p || null, name: 'MetaMask', downloadUrl: 'https://metamask.io/download/' };
  }

  // 'other' or generic
  const p = eth || okx || rabby;
  return { provider: p || null, name: 'Other Web3 Wallet', downloadUrl: 'https://metamask.io/download/' };
}

export function getActiveProvider(type?: WalletType): any {
  if (type) {
    const { provider } = getProviderForWallet(type);
    if (provider) return provider;
  }
  return getInjectedProvider();
}

export function getInjectedProvider(): any {
  if (typeof window === 'undefined') return null;
  if (window.ethereum) return window.ethereum;
  if (window.okxwallet) return window.okxwallet;
  if (window.rabby) return window.rabby;
  try {
    if (window.parent && (window.parent as any).ethereum) return (window.parent as any).ethereum;
    if (window.parent && (window.parent as any).okxwallet) return (window.parent as any).okxwallet;
  } catch {
    // ignore
  }
  return null;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  walletType: null,
  walletName: 'Wallet',
  hasInjectedProvider: false,
  error: null,
  isModalOpen: false,
  openConnectModal: () => {},
  closeConnectModal: () => {},
  connectWallet: async () => null,
  disconnectWallet: () => {},
  shortAccount: '',
  switchToRobinhood: async () => {},
});

export function shortenAddress(addr: string | null | undefined): string {
  if (!addr) return '';
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>('0x2775');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [walletName, setWalletName] = useState<string>('Web3 Wallet');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasInjectedProvider = typeof window !== 'undefined' && Boolean(getInjectedProvider());

  const openConnectModal = useCallback(() => {
    setError(null);
    setIsModalOpen(true);
  }, []);

  const closeConnectModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Try silent reconnect on initial mount if user previously authorized
  useEffect(() => {
    try {
      const savedConnected = localStorage.getItem('rp_connected');
      const savedAccount = localStorage.getItem('rp_account');
      const savedName = localStorage.getItem('rp_wallet_name');
      const savedType = localStorage.getItem('rp_wallet_type') as WalletType;
      if (savedConnected === 'true' && savedAccount && EVM_REGEX.test(savedAccount)) {
        setAccount(savedAccount);
        if (savedName) setWalletName(savedName);
        if (savedType) setWalletType(savedType);
      }
    } catch {
      // ignore
    }

    const eth = getInjectedProvider();
    if (!eth) return;

    const checkExistingConnection = async () => {
      try {
        const accounts: string[] = await eth.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          const acc = accounts[0];
          setAccount(acc);
          localStorage.setItem('rp_connected', 'true');
          localStorage.setItem('rp_account', acc);
          const cid: string = await eth.request({ method: 'eth_chainId' });
          setChainId(cid);
        }
      } catch (err) {
        console.debug('No active wallet session', err);
      }
    };

    checkExistingConnection();

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setAccount(null);
        setChainId(null);
        localStorage.removeItem('rp_connected');
        localStorage.removeItem('rp_account');
      } else {
        setAccount(accounts[0]);
        localStorage.setItem('rp_connected', 'true');
        localStorage.setItem('rp_account', accounts[0]);
      }
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(newChainId);
    };

    if (eth.on) {
      eth.on('accountsChanged', handleAccountsChanged);
      eth.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (eth.removeListener) {
        eth.removeListener('accountsChanged', handleAccountsChanged);
        eth.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Real connection handler for OKX, MetaMask, Rabby, Other
  const connectWallet = useCallback(async (walletChoice: WalletType = 'other'): Promise<string | null> => {
    setError(null);
    const { provider, name, downloadUrl } = getProviderForWallet(walletChoice);

    if (!provider) {
      const msg = `${name} extension is not detected in your browser. Install ${name} or open this window directly.`;
      setError(msg);
      // If user clicked a specific wallet that is not installed, open download link
      if (typeof window !== 'undefined' && downloadUrl) {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      }
      return null;
    }

    setIsConnecting(true);
    try {
      const accounts: string[] = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error(`No accounts authorized in ${name}.`);
      }

      const activeAccount = accounts[0];
      setAccount(activeAccount);
      setWalletType(walletChoice);
      setWalletName(name);

      localStorage.setItem('rp_connected', 'true');
      localStorage.setItem('rp_account', activeAccount);
      localStorage.setItem('rp_wallet_name', name);
      localStorage.setItem('rp_wallet_type', walletChoice || 'other');

      const cid: string = await provider.request({ method: 'eth_chainId' }).catch(() => null);
      if (cid) setChainId(cid);

      setIsModalOpen(false);
      return activeAccount;
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      let message = `Failed to connect with ${name}.`;
      if (err.code === 4001) {
        message = `Connection request was rejected in ${name}.`;
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect handler
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setError(null);
    setWalletType(null);
    setWalletName('Web3 Wallet');
    localStorage.removeItem('rp_connected');
    localStorage.removeItem('rp_account');
    localStorage.removeItem('rp_wallet_name');
    localStorage.removeItem('rp_wallet_type');
  }, []);

  // Switch to Robinhood Chain network helper
  const switchToRobinhood = useCallback(async () => {
    const eth = getInjectedProvider();
    if (!eth) return;
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1237' }],
      }).catch(async (switchError: any) => {
        if (switchError.code === 4902) {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x1237',
                chainName: 'Robinhood Chain',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://rpc.mainnet.chain.robinhood.com'],
                blockExplorerUrls: ['https://robinhoodchain.blockscout.com'],
              },
            ],
          });
        }
      });
    } catch (err) {
      console.warn('Network switch notice:', err);
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isConnected: Boolean(account),
        isConnecting,
        walletType,
        walletName,
        hasInjectedProvider,
        error,
        isModalOpen,
        openConnectModal,
        closeConnectModal,
        connectWallet,
        disconnectWallet,
        shortAccount: shortenAddress(account),
        switchToRobinhood,
      }}
    >
      {children}
      <WalletModal />
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
