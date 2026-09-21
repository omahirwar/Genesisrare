import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Check, Copy, LogOut, ChevronDown, ExternalLink, X } from 'lucide-react';
import { useWeb3 } from '../lib/web3';

export default function ConnectWalletButton() {
  const {
    account,
    shortAccount,
    isConnected,
    isConnecting,
    walletName,
    hasInjectedProvider,
    openConnectModal,
    connectWallet,
    disconnectWallet,
  } = useWeb3();

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleConnect = async () => {
    openConnectModal();
  };

  const copyAddress = async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {isConnected && account ? (
        <div>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-chip px-3 py-1.5 font-display text-[12px] font-bold text-ink transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            style={{
              background: 'var(--color-paper)',
              border: '2px solid var(--color-ink)',
              boxShadow: '2px 2px 0 var(--color-ink)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-500" />
            </span>
            <span className="hidden xs:inline-block text-ink/70 font-sans text-[11px]">Robinhood</span>
            <span className="tracking-wide">{shortAccount}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Account Dropdown Menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-72 rounded-panel p-3.5 z-50 text-left"
                style={{
                  background: 'var(--color-paper)',
                  border: '3px solid var(--color-ink)',
                  boxShadow: '4px 4px 0 var(--color-ink)',
                }}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-ink/10">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-lime-500" />
                    <span className="font-display text-[12px] text-ink">{walletName}</span>
                  </div>
                  <span className="rounded-chip bg-cream-2 px-2 py-0.5 font-display text-[9px] text-ink border border-ink/30">
                    ROBINHOOD EVM
                  </span>
                </div>

                <div className="p-2 rounded-chip bg-cream mb-3">
                  <span className="block font-sans text-[10px] text-ink-soft uppercase tracking-wider">
                    Connected Wallet
                  </span>
                  <p className="font-sans text-[12px] text-ink break-all font-mono select-all mt-0.5">
                    {account}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-chip font-display text-[12px] text-ink hover:bg-cream-2 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {copied ? <Check className="h-3.5 w-3.5 text-lime-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied to clipboard!' : 'Copy Address'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      disconnectWallet();
                      setMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-chip font-display text-[12px] text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="h-3.5 w-3.5" />
                      Disconnect Wallet
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex items-center gap-1.5 rounded-chip px-3 py-1.5 font-display text-[12px] font-bold text-ink transition-all hover:bg-cream-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
          style={{
            background: 'var(--color-lime)',
            border: '2px solid var(--color-ink)',
            boxShadow: '2px 2px 0 var(--color-ink)',
          }}
        >
          <Wallet className="h-3.5 w-3.5" />
          <span>{isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}</span>
        </button>
      )}
    </div>
  );
}
