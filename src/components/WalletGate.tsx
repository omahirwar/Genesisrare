import { useWeb3, getProviderForWallet } from '../lib/web3';
import RareMark from './RareMark';
import { 
  AlertCircle, 
  ArrowRight, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Coins, 
  Lock
} from 'lucide-react';

export default function WalletGate() {
  const { connectWallet, isConnecting, error } = useWeb3();

  const isOkxDetected = Boolean(getProviderForWallet('okx').provider);
  const isMetaMaskDetected = Boolean(getProviderForWallet('metamask').provider);
  const isRabbyDetected = Boolean(getProviderForWallet('rabby').provider);

  const openInNewTab = () => {
    try {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    } catch {
      // fallback
    }
  };

  return (
    <div className="min-h-screen bg-[#eeeeee] text-[#111] flex flex-col font-['Archivo'] selection:bg-[#111] selection:text-[#eeeeee]">
      
      {/* -------------------------------------------------------------
          TOP VINTAGE ANNOUNCEMENT TICKER & HEADER
          ------------------------------------------------------------- */}
      <header className="border-b-2 border-[#111] bg-[#111] text-[#eeeeee] text-[12px] font-['Sometype_Mono']">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RareMark size={20} />
            <span className="font-['Silkscreen'] text-[13px] tracking-wider text-[#eeeeee]">
              RARE PEOPLE
            </span>
            <span className="hidden sm:inline-block text-[#888]">/</span>
            <span className="hidden sm:inline-block text-[#ccff00] text-[11px] uppercase tracking-wider">
              Genesis Drop Portal
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
            <a
              href="/mint"
              className="flex items-center gap-1 bg-[#ccff00] hover:bg-[#bbf000] border border-[#555] px-2 py-0.5 text-[#111] font-medium transition-colors"
            >
              [ mint ]
            </a>
            <a
              href="https://x.com/RarePeoplesNFT"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-[#222] hover:bg-[#333] border border-[#555] px-2 py-0.5 text-[#ccff00] hover:text-[#fff] transition-colors"
              title="Official X / Twitter: @RarePeoplesNFT"
            >
              <span className="font-bold">𝕏</span>
              <span className="font-mono">@RarePeoplesNFT</span>
            </a>
            <span className="hidden sm:inline-block text-[#888]">·</span>
            <span className="hidden sm:flex items-center gap-1.5 bg-[#222] border border-[#444] px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" />
              <span className="text-[#eee]">Robinhood EVM</span>
            </span>
            <span className="hidden md:inline text-[#888]">·</span>
            <span className="hidden md:inline font-mono text-[#eee]">21 SEP 2026</span>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          MAIN INTRO & ACCESS BODY
          ------------------------------------------------------------- */}
      <main className="flex-1 max-w-[1240px] mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full space-y-10">
        
        {/* ============================================================
            HERO INTRO SECTION: MASCOT + TITLE + LORE
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-4">
          
          {/* Left: Project Introduction */}
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#fff] border border-[#111] shadow-[2px_2px_0_#111] text-[11px] font-mono uppercase tracking-wider">
              <span className="w-2 h-2 bg-[#ccff00] border border-[#111]" />
              <span>Genesis Allocation Stage</span>
              <span className="text-[#888]">·</span>
              <span className="text-[#666]">Chain ID 10101</span>
            </div>

            <h1 className="font-['Silkscreen'] text-[32px] sm:text-[44px] md:text-[52px] text-[#111] leading-none tracking-tight">
              RARE PEOPLE
            </h1>

            <p className="font-['Archivo'] text-[16px] sm:text-[18px] text-[#222] max-w-[700px] leading-relaxed">
              <strong>4,444 sovereign pixel art collectibles</strong> launching natively on the Robinhood EVM Chain. An exclusive autonomous community built on 100% on-chain traits and zero-gas allocation reservations.
            </p>

            <div className="flex flex-wrap gap-2 pt-1 text-[12px] font-['Sometype_Mono']">
              <span className="px-2.5 py-1 bg-[#fff] border border-[#111] font-bold">
                ✦ 0.00 ETH Fair Mint
              </span>
              <span className="px-2.5 py-1 bg-[#fff] border border-[#111] font-bold">
                ✦ 4,444 Total Supply
              </span>
              <span className="px-2.5 py-1 bg-[#fff] border border-[#111] font-bold">
                ✦ Robinhood EVM
              </span>
            </div>
          </div>

          {/* Right: Rare People Genesis Avatar Display */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="w-full max-w-[320px] bg-[#fff] border-2 border-[#111] shadow-[6px_6px_0_#111] overflow-hidden">
              <div className="bg-[#111] text-[#eeeeee] px-3 py-1.5 flex items-center justify-between text-[11px] font-['Sometype_Mono']">
                <span>GENESIS ARTIFACT #0001</span>
                <span className="text-[#ccff00]">RARE PEOPLE</span>
              </div>
              <div className="p-6 flex items-center justify-center bg-[#0c0d0e] relative">
                <div className="w-48 h-48 relative flex items-center justify-center">
                  <img 
                    src="/assets/logo.svg" 
                    alt="Rare People Genesis Avatar" 
                    className="w-full h-full object-contain [image-rendering:pixelated] drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
                  />
                </div>
              </div>
              <div className="p-3 bg-[#fff] border-t border-[#111] text-[11px] font-mono text-[#555] flex justify-between">
                <span>Rarity: Sovereign (1/1)</span>
                <span className="text-black font-bold">Robinhood L1</span>
              </div>
            </div>
          </div>

        </div>

        {/* ============================================================
            METRIC MATRIX STRIP
            ============================================================ */}
        <div className="border-2 border-[#111] bg-[#eeeeee] grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 divide-x divide-[#111] shadow-[4px_4px_0_#111]">
          <div className="p-4 bg-[#fff]">
            <div className="text-[10px] uppercase tracking-wider font-mono text-[#777]">Collection Size</div>
            <div className="font-['Silkscreen'] text-[22px] sm:text-[26px] text-[#111] mt-1">4,444</div>
            <div className="text-[11px] text-[#555] font-mono mt-0.5">Unique 1/1 Tokens</div>
          </div>
          <div className="p-4 bg-[#fff]">
            <div className="text-[10px] uppercase tracking-wider font-mono text-[#777]">Mint Price</div>
            <div className="font-['Silkscreen'] text-[22px] sm:text-[26px] text-[#111] mt-1">0.00 ETH</div>
            <div className="text-[11px] text-[#555] font-mono mt-0.5">100% Free Mint</div>
          </div>
          <div className="p-4 bg-[#fff]">
            <div className="text-[10px] uppercase tracking-wider font-mono text-[#777]">Network</div>
            <div className="font-['Silkscreen'] text-[20px] sm:text-[24px] text-[#111] mt-1">ROBINHOOD</div>
            <div className="text-[11px] text-[#555] font-mono mt-0.5">EVM Chain ID 10101</div>
          </div>
          <div className="p-4 bg-[#fff]">
            <div className="text-[10px] uppercase tracking-wider font-mono text-[#777]">Genesis Date</div>
            <div className="font-['Silkscreen'] text-[20px] sm:text-[24px] text-[#111] mt-1">21 SEP 2026</div>
            <div className="text-[11px] text-[#555] font-mono mt-0.5">Whitelist Phase 1</div>
          </div>
        </div>

        {/* ============================================================
            ACCESS TERMINAL: 4 WALLETS TO ENTER
            ============================================================ */}
        <div className="bg-[#fff] border-2 border-[#111] shadow-[6px_6px_0_#111] overflow-hidden">
          
          {/* Terminal Header */}
          <div className="bg-[#111] text-[#eeeeee] px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#111]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#ccff00]" />
              <span className="font-['Silkscreen'] text-[13px] sm:text-[14px] text-[#eeeeee] tracking-wide">
                AUTHENTICATION TERMINAL // CONNECT WALLET TO ENTER
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#ccff00] bg-[#222] px-2 py-0.5 border border-[#333]">
              STANDARD EIP-1193
            </span>
          </div>

          <div className="p-5 sm:p-7 space-y-6">
            
            {/* Terminal Instructions */}
            <div className="space-y-1">
              <h2 className="font-['Silkscreen'] text-[18px] sm:text-[20px] text-[#111]">
                STEP 01: SELECT YOUR WEB3 WALLET
              </h2>
              <p className="font-['Archivo'] text-[14px] text-[#555]">
                To enter the Rare People portal, check your whitelist spot, and claim your genesis allocation, connect your wallet below.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-500 text-red-900 text-[12px] font-mono flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-red-950">Connection Notice</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {/* 4 Wallet Choices ONLY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-['Sometype_Mono']">
              
              {/* 1. OKX Wallet */}
              <button
                type="button"
                onClick={() => connectWallet('okx')}
                disabled={isConnecting}
                className="p-4 bg-[#fbfbfb] hover:bg-[#fff] border-2 border-[#111] shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col justify-between gap-3 text-left cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#000] text-[#fff] font-black text-[13px] flex items-center justify-center border border-[#111]">
                      OKX
                    </div>
                    <div>
                      <div className="font-bold text-[14px] text-[#111]">OKX Wallet</div>
                      <div className="text-[11px] text-[#666]">OKX Web3 Extension</div>
                    </div>
                  </div>
                  {isOkxDetected && (
                    <span className="text-[10px] bg-green-100 text-green-800 border border-green-400 px-1.5 py-0.5 font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="w-full pt-2 border-t border-[#e0e0e0] flex items-center justify-between text-[11px] font-['Silkscreen'] text-[#111]">
                  <span>[ CONNECT OKX ]</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-black" />
                </div>
              </button>

              {/* 2. MetaMask */}
              <button
                type="button"
                onClick={() => connectWallet('metamask')}
                disabled={isConnecting}
                className="p-4 bg-[#fbfbfb] hover:bg-[#fff] border-2 border-[#111] shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col justify-between gap-3 text-left cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f6851b] text-[#fff] font-bold text-[16px] flex items-center justify-center border border-[#111]">
                      🦊
                    </div>
                    <div>
                      <div className="font-bold text-[14px] text-[#111]">MetaMask</div>
                      <div className="text-[11px] text-[#666]">Universal EVM Web3 Extension</div>
                    </div>
                  </div>
                  {isMetaMaskDetected && (
                    <span className="text-[10px] bg-green-100 text-green-800 border border-green-400 px-1.5 py-0.5 font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="w-full pt-2 border-t border-[#e0e0e0] flex items-center justify-between text-[11px] font-['Silkscreen'] text-[#111]">
                  <span>[ CONNECT METAMASK ]</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-black" />
                </div>
              </button>

              {/* 3. Rabby Wallet */}
              <button
                type="button"
                onClick={() => connectWallet('rabby')}
                disabled={isConnecting}
                className="p-4 bg-[#fbfbfb] hover:bg-[#fff] border-2 border-[#111] shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col justify-between gap-3 text-left cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#7055ff] text-[#fff] font-bold text-[16px] flex items-center justify-center border border-[#111]">
                      🐰
                    </div>
                    <div>
                      <div className="font-bold text-[14px] text-[#111]">Rabby Wallet</div>
                      <div className="text-[11px] text-[#666]">Game-changing Multi-chain Web3</div>
                    </div>
                  </div>
                  {isRabbyDetected && (
                    <span className="text-[10px] bg-green-100 text-green-800 border border-green-400 px-1.5 py-0.5 font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="w-full pt-2 border-t border-[#e0e0e0] flex items-center justify-between text-[11px] font-['Silkscreen'] text-[#111]">
                  <span>[ CONNECT RABBY ]</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-black" />
                </div>
              </button>

              {/* 4. Other Wallets */}
              <button
                type="button"
                onClick={() => connectWallet('other')}
                disabled={isConnecting}
                className="p-4 bg-[#fbfbfb] hover:bg-[#fff] border-2 border-[#111] shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col justify-between gap-3 text-left cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#111] text-[#ccff00] font-black text-[15px] flex items-center justify-center border border-[#111]">
                      ✦
                    </div>
                    <div>
                      <div className="font-bold text-[14px] text-[#111]">Other Wallets</div>
                      <div className="text-[11px] text-[#666]">Coinbase, Trust, or Injected EVM</div>
                    </div>
                  </div>
                </div>

                <div className="w-full pt-2 border-t border-[#e0e0e0] flex items-center justify-between text-[11px] font-['Silkscreen'] text-[#111]">
                  <span>[ CONNECT OTHER ]</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-black" />
                </div>
              </button>

            </div>

            {/* Sandbox / Iframe Full-Window Helper */}
            <div className="p-3.5 bg-[#f4f4f4] border border-[#111] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] font-mono">
              <div className="text-[#333]">
                <strong>Preview Notice:</strong> If your extension popup does not trigger inside the embedded preview:
              </div>
              <button
                type="button"
                onClick={openInNewTab}
                className="py-1.5 px-3 bg-[#ccff00] hover:bg-[#bbf000] text-[#111] font-bold text-[11px] border border-[#111] flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Open in Full Window ↗</span>
              </button>
            </div>

          </div>
        </div>

        {/* ============================================================
            FEATURE & LORE TEASERS (INTRO STORY)
            ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <div className="p-5 bg-[#fff] border-2 border-[#111] shadow-[4px_4px_0_#111] space-y-2">
            <div className="w-8 h-8 bg-[#111] text-[#ccff00] flex items-center justify-center border border-[#111]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-['Silkscreen'] text-[15px] text-[#111]">100% ON-CHAIN</h3>
            <p className="font-['Archivo'] text-[13px] text-[#555] leading-relaxed">
              Every single trait, color palette, and accessory is immutably inscribed into the Robinhood EVM smart contracts.
            </p>
          </div>

          <div className="p-5 bg-[#fff] border-2 border-[#111] shadow-[4px_4px_0_#111] space-y-2">
            <div className="w-8 h-8 bg-[#111] text-[#ccff00] flex items-center justify-center border border-[#111]">
              <Coins className="w-4 h-4" />
            </div>
            <h3 className="font-['Silkscreen'] text-[15px] text-[#111]">0.00 ETH FAIR DROP</h3>
            <p className="font-['Archivo'] text-[13px] text-[#555] leading-relaxed">
              No private sales, no team reserve dumps. All 4,444 collectibles are free to claim for verified community whitelists.
            </p>
          </div>

          <div className="p-5 bg-[#fff] border-2 border-[#111] shadow-[4px_4px_0_#111] space-y-2">
            <div className="w-8 h-8 bg-[#111] text-[#ccff00] flex items-center justify-center border border-[#111]">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-['Silkscreen'] text-[15px] text-[#111]">ROBINHOOD NETWORK</h3>
            <p className="font-['Archivo'] text-[13px] text-[#555] leading-relaxed">
              Pioneering high-throughput, ultra-low gas minting natively supported by the Robinhood crypto ecosystem.
            </p>
          </div>

        </div>

      </main>

      {/* -------------------------------------------------------------
          RETRO FOOTER
          ------------------------------------------------------------- */}
      <footer className="border-t-2 border-[#111] bg-[#e4e4e4] py-4 text-[12px] font-mono text-[#555]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-700" />
            <span>Secure Web3 Gateway · Robinhood EVM Chain</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://x.com/RarePeoplesNFT"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#111] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span className="font-bold">𝕏</span>
              <span>@RarePeoplesNFT</span>
            </a>
            <span>·</span>
            <span>Genesis Mint: 21 September 2026 · 4,444 Rare People</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
