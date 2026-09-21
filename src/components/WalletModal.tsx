import { useEffect } from 'react';
import { motion } from 'motion/react';
import { springPop } from '../lib/motion';
import { useWeb3, getProviderForWallet } from '../lib/web3';
import RareMark from './RareMark';
import { 
  Check, 
  Copy, 
  ExternalLink, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { useState } from 'react';

export default function WalletModal() {
  const {
    account,
    isConnected,
    isConnecting,
    walletName,
    error,
    isModalOpen,
    closeConnectModal,
    connectWallet,
    disconnectWallet,
  } = useWeb3();

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeConnectModal();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, closeConnectModal]);

  if (!isModalOpen) return null;

  const handleCopy = async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const openInNewTab = () => {
    try {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    } catch {
      // fallback
    }
  };

  const isOkxDetected = Boolean(getProviderForWallet('okx').provider);
  const isMetaMaskDetected = Boolean(getProviderForWallet('metamask').provider);
  const isRabbyDetected = Boolean(getProviderForWallet('rabby').provider);

  return (
    <motion.div
      className="fixed inset-0 z-[160] grid place-items-center p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={closeConnectModal}
        className="fixed inset-0 cursor-default bg-black/60 backdrop-blur-[2px]"
      />

      {/* Modal Card */}
      <motion.div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[480px] bg-[#eeeeee] border-2 border-[#111] shadow-[6px_6px_0_#111] my-auto overflow-hidden font-['Sometype_Mono'] text-[#111]"
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: springPop }}
        exit={{ opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.15 } }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#111] text-[#eeeeee] border-b-2 border-[#111]">
          <div className="flex items-center gap-2">
            <RareMark size={20} />
            <span className="font-['Silkscreen'] text-[14px] tracking-wider text-[#eeeeee]">
              CONNECT WALLET
            </span>
          </div>
          <button
            type="button"
            onClick={closeConnectModal}
            className="text-[12px] font-mono px-2 py-0.5 bg-[#222] hover:bg-[#333] text-[#eeeeee] border border-[#444] cursor-pointer"
          >
            [ close ✕ ]
          </button>
        </div>

        {/* Chain Info */}
        <div className="bg-[#e4e4e4] px-4 py-2 border-b border-[#ccc] flex items-center justify-between text-[11px] text-[#444]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ccff00] border border-[#111]" />
            <span className="font-bold text-[#111]">Robinhood EVM Chain</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[#666]">
            STANDARD EIP-1193
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-500 text-red-900 text-[12px] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-red-950">Notice</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* If already connected */}
          {isConnected && account ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#fff] border-2 border-[#111] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#666]">
                  <span className="uppercase tracking-wider">Active: {walletName}</span>
                  <span className="inline-flex items-center gap-1 text-green-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </span>
                </div>
                <div className="font-mono text-[13px] text-[#111] break-all bg-[#f4f4f4] p-2 border border-[#ccc]">
                  {account}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 py-1.5 px-3 bg-[#eeeeee] hover:bg-[#e4e4e4] border border-[#111] text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Copy className="w-3.5 h-3.5 text-[#555]" />}
                    <span>{copied ? 'Copied' : 'Copy Address'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      disconnectWallet();
                      closeConnectModal();
                    }}
                    className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 text-[12px] flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>

              <div className="text-[12px] text-[#555] text-center">
                Want to switch to another wallet? Select one below:
              </div>
            </div>
          ) : null}

          {/* Wallet Options: OKX, MetaMask, Rabby, Other ONLY */}
          <div className="space-y-2.5">
            {/* 1. OKX */}
            <button
              type="button"
              onClick={() => connectWallet('okx')}
              disabled={isConnecting}
              className="w-full p-3 bg-[#fff] hover:bg-[#fafafa] border-2 border-[#111] shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-between cursor-pointer group text-left disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#000] text-[#fff] font-black text-[12px] flex items-center justify-center border border-[#111]">
                  OKX
                </div>
                <div>
                  <div className="font-bold text-[13px] text-[#111]">OKX Wallet</div>
                  <div className="text-[10px] text-[#666]">OKX Web3 Browser Extension</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isOkxDetected && (
                  <span className="text-[10px] bg-green-100 text-green-800 border border-green-400 px-1.5 py-0.5 font-bold">
                    DETECTED
                  </span>
                )}
                <span className="font-['Silkscreen'] text-[11px] text-[#111] group-hover:text-black flex items-center gap-1">
                  [ CONNECT ] <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

            {/* 2. MetaMask */}
            <button
              type="button"
              onClick={() => connectWallet('metamask')}
              disabled={isConnecting}
              className="w-full p-3 bg-[#fff] hover:bg-[#fafafa] border-2 border-[#111] shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-between cursor-pointer group text-left disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#f6851b] text-[#fff] font-bold text-[13px] flex items-center justify-center border border-[#111]">
                  🦊
                </div>
                <div>
                  <div className="font-bold text-[13px] text-[#111]">MetaMask</div>
                  <div className="text-[10px] text-[#666]">Universal EVM Web3 Extension</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isMetaMaskDetected && (
                  <span className="text-[10px] bg-green-100 text-green-800 border border-green-400 px-1.5 py-0.5 font-bold">
                    DETECTED
                  </span>
                )}
                <span className="font-['Silkscreen'] text-[11px] text-[#111] group-hover:text-black flex items-center gap-1">
                  [ CONNECT ] <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

            {/* 3. Rabby */}
            <button
              type="button"
              onClick={() => connectWallet('rabby')}
              disabled={isConnecting}
              className="w-full p-3 bg-[#fff] hover:bg-[#fafafa] border-2 border-[#111] shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-between cursor-pointer group text-left disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#7055ff] text-[#fff] font-bold text-[13px] flex items-center justify-center border border-[#111]">
                  🐰
                </div>
                <div>
                  <div className="font-bold text-[13px] text-[#111]">Rabby Wallet</div>
                  <div className="text-[10px] text-[#666]">Game-changing Multi-chain Web3</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isRabbyDetected && (
                  <span className="text-[10px] bg-green-100 text-green-800 border border-green-400 px-1.5 py-0.5 font-bold">
                    DETECTED
                  </span>
                )}
                <span className="font-['Silkscreen'] text-[11px] text-[#111] group-hover:text-black flex items-center gap-1">
                  [ CONNECT ] <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

            {/* 4. Other */}
            <button
              type="button"
              onClick={() => connectWallet('other')}
              disabled={isConnecting}
              className="w-full p-3 bg-[#fff] hover:bg-[#fafafa] border-2 border-[#111] shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-between cursor-pointer group text-left disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#111] text-[#ccff00] font-black text-[12px] flex items-center justify-center border border-[#111]">
                  ✦
                </div>
                <div>
                  <div className="font-bold text-[13px] text-[#111]">Other Wallets</div>
                  <div className="text-[10px] text-[#666]">Coinbase, Trust, or Injected EVM</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-['Silkscreen'] text-[11px] text-[#111] group-hover:text-black flex items-center gap-1">
                  [ CONNECT ] <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          </div>

          {/* Iframe helper */}
          <div className="p-3 bg-[#f6f6f6] border border-[#111] text-[11px] space-y-1.5">
            <div className="text-[#444] leading-relaxed">
              If extension popup doesn't appear in preview iframe:
            </div>
            <button
              type="button"
              onClick={openInNewTab}
              className="w-full py-1.5 px-3 bg-[#ccff00] hover:bg-[#bbf000] text-[#111] font-bold text-[11px] border border-[#111] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open in Full Window for Extension Popup</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-[#ccc] flex items-center justify-between text-[10px] text-[#777]">
            <span>Genesis Mint: 21 Sep 2026 · Robinhood EVM</span>
            <span className="font-mono font-bold text-[#444]">0.00 ETH</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
