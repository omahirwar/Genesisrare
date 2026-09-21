import { useState } from 'react';
import { useWhitelist } from './whitelist-context';
import { useWeb3 } from '../lib/web3';
import { IS_CHECKER_PAUSED, SHOW_WL_CHECKER_NAV } from '../lib/config';
import RareMark from './RareMark';
import { Sparkles, Copy, Check, ExternalLink } from 'lucide-react';

export default function Navbar() {
  const { open, openChecker } = useWhitelist();
  const { account, shortAccount, isConnected, connectWallet, openConnectModal, disconnectWallet, walletName } = useWeb3();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const copyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full border-b border-[#111] bg-[#eeeeee] sticky top-0 z-50">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Breadcrumb / Identity */}
        <div className="flex items-center gap-3">
          <a href="#top" className="flex items-center gap-2 text-[#111] no-underline">
            <RareMark size={22} />
            <span className="font-['Silkscreen'] text-[15px] sm:text-[16px] tracking-tight">RARE PEOPLE</span>
          </a>
          <span className="text-[#888] hidden sm:inline">/</span>
          <span className="font-['Sometype_Mono'] text-[12px] text-[#666] lowercase hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] border border-[#111]" />
            <span>robinhood chain · genesis nft drop</span>
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Official X / Twitter Link */}
          <a
            href="https://x.com/RarePeoplesNFT"
            target="_blank"
            rel="noopener noreferrer"
            className="rf-btn text-[12px] py-1.5 px-2.5 sm:px-3 bg-[#eeeeee] hover:bg-[#111] hover:text-[#eeeeee] text-[#111] font-mono inline-flex items-center gap-1.5 transition-colors"
            title="Follow Rare People on X (@RarePeoplesNFT)"
          >
            <span className="font-bold">𝕏</span>
            <span className="hidden md:inline">@RarePeoplesNFT</span>
          </a>

          <a
            href="/mint"
            className="rf-btn text-[12px] py-1.5 px-3 bg-[#eeeeee] hover:bg-[#e4e4e4]"
          >
            [ mint ]
          </a>

          {/* WL Checker Trigger — restore by setting SHOW_WL_CHECKER_NAV true */}
          {SHOW_WL_CHECKER_NAV && (
          <button
            type="button"
            onClick={openChecker}
            className={`rf-btn text-[12px] py-1.5 px-3 ${
              IS_CHECKER_PAUSED
                ? 'bg-[#fef08a] border-[#854d0e] text-[#854d0e] hover:bg-[#fde047]'
                : 'bg-[#eeeeee] hover:bg-[#e4e4e4]'
            }`}
          >
            {IS_CHECKER_PAUSED ? '[ wl checker · paused ]' : '[ wl checker ]'}
          </button>
          )}

          {/* Join Whitelist Trigger */}
          <button
            type="button"
            onClick={open}
            className="rf-btn text-[12px] py-1.5 px-3 bg-[#ccff00] hover:bg-[#bbf000] text-[#111] font-medium hidden sm:inline-flex"
          >
            [ join whitelist ]
          </button>

          {/* Real Web3 Wallet Button */}
          {!isConnected ? (
            <button
              type="button"
              onClick={openConnectModal}
              className="rf-btn rf-btn-dark text-[12px] py-1.5 px-3"
            >
              [ connect wallet ]
            </button>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="rf-btn rf-btn-dark text-[12px] py-1.5 px-3 flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
                <span>[ {shortAccount} ]</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-[#eeeeee] border-2 border-[#111] shadow-[4px_4px_0_#111] p-3 z-50 font-['Sometype_Mono'] text-[12px]">
                  <div className="text-[10px] text-[#888] uppercase mb-1">
                    Connected: {walletName}
                  </div>
                  <div className="text-[#111] font-mono break-all mb-3 text-[11px] bg-[#fff] p-2 border border-[#111]">
                    {account}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="w-full text-left py-1 px-2 hover:bg-[#e4e4e4] border border-[#111] flex items-center justify-between"
                    >
                      <span>Copy Address</span>
                      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-[#666]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        openChecker();
                      }}
                      className="w-full text-left py-1 px-2 hover:bg-[#e4e4e4] border border-[#111] flex items-center justify-between"
                    >
                      <span>Check WL Status</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#ccff00]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        openConnectModal();
                      }}
                      className="w-full text-left py-1 px-2 hover:bg-[#e4e4e4] border border-[#111] flex items-center justify-between text-[11px]"
                    >
                      <span>Switch Wallet / Options</span>
                      <ExternalLink className="w-3 h-3 text-[#666]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        disconnectWallet();
                      }}
                      className="w-full text-left py-1 px-2 hover:bg-red-100 text-red-700 border border-red-300 mt-1"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
