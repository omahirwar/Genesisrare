import { useState, useEffect, type FormEvent } from 'react';
import { useWeb3 } from '../lib/web3';
import { executeRealMint, fetchOnChainDropStats, type DropOnChainStats } from '../lib/mintEngine';
import { 
  MINT_CONFIG, 
  getActiveOpenSeaConfig, 
  saveActiveOpenSeaConfig, 
  OpenSeaDropConfig,
  OPENSEA_STAGES,
  getOpenSeaStagesState,
  formatDurationSecs,
  type OpenSeaStageConfigItem
} from '../lib/config';
import RareMark from './RareMark';
import { 
  ArrowLeft, 
  LogOut, 
  Check, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Wallet,
  AlertCircle,
  Clock,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2
} from 'lucide-react';

interface MintPageProps {
  onBackToHome: () => void;
}

export default function MintPage({ onBackToHome }: MintPageProps) {
  const { 
    isConnected, 
    account, 
    shortAccount, 
    walletName, 
    openConnectModal, 
    disconnectWallet, 
    connectWallet,
    isConnecting,
    error: web3Error
  } = useWeb3();

  // Active OpenSea Drop Configuration
  const [activeDrop, setActiveDrop] = useState<OpenSeaDropConfig>(getActiveOpenSeaConfig());

  // State
  const [quantity, setQuantity] = useState(1);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatusText, setMintStatusText] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintedSuccess, setMintedSuccess] = useState<any>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Drop Sync Inputs
  const [inputUrl, setInputUrl] = useState(activeDrop.DROP_URL);
  const [inputContract, setInputContract] = useState(activeDrop.NFT_CONTRACT_ADDRESS);
  const [inputNetwork, setInputNetwork] = useState(activeDrop.NETWORK_NAME);
  const [syncSavedMessage, setSyncSavedMessage] = useState<string | null>(null);

  // Mint counts: starts at 0 as requested ("abhi start nhi hua h 0 kr")
  const [mintedCount, setMintedCount] = useState(0);
  const TOTAL_SUPPLY = MINT_CONFIG.TOTAL_SUPPLY || 6283;
  const progressRatio = Math.min(100, Math.max(0, (mintedCount / TOTAL_SUPPLY) * 100));

  // Eligibility states
  const [isGtdEligible, setIsGtdEligible] = useState(false);
  const [isFcfsEligible, setIsFcfsEligible] = useState(false);

  // On-chain drop status & timing
  const [onChainDrop, setOnChainDrop] = useState<DropOnChainStats | null>(null);
  const [nowSec, setNowSec] = useState<number>(() => Math.floor(Date.now() / 1000));

  // Live countdown clock ticking every second
  useEffect(() => {
    const updateTick = () => {
      setNowSec(Math.floor(Date.now() / 1000));
    };
    updateTick();
    const interval = setInterval(updateTick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute live 4-stage OpenSea drop state
  const stagesState = getOpenSeaStagesState(nowSec);
  const currentActiveStage = stagesState.currentActiveStage;
  const nextUpcomingStage = stagesState.nextUpcomingStage;
  const isStageLive = stagesState.isAnyStageLive;
  const timeRemaining = stagesState.timeRemainingText;

  // Sync actual on-chain drop details and wallet stats from SeaDrop contract
  useEffect(() => {
    let isCancelled = false;

    const syncOnChain = () => {
      fetchOnChainDropStats(account)
        .then((stats) => {
          if (isCancelled) return;
          setOnChainDrop(stats);
          if (stats.totalSupply !== undefined) {
            setMintedCount(stats.totalSupply);
          }

          if (isConnected && account) {
            if (stats.hasAllowList) {
              if (stats.userMinted >= stats.maxUserMints) {
                setIsGtdEligible(false);
                setIsFcfsEligible(false);
              } else {
                setIsGtdEligible(true);
                setIsFcfsEligible(true);
              }
            } else {
              // OpenSea Studio drop stages active
              setIsGtdEligible(true);
              setIsFcfsEligible(true);
            }
          } else {
            setIsGtdEligible(false);
            setIsFcfsEligible(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setIsGtdEligible(false);
            setIsFcfsEligible(false);
          }
        });
    };

    syncOnChain();
    const interval = setInterval(syncOnChain, 12000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [isConnected, account, activeDrop]);

  // Format numbers with spaces (e.g. "0 / 6 283")
  const formatSpaced = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // Copy address to clipboard
  const handleCopy = async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Real Wallet Connect Trigger
  const handleConnectClick = async () => {
    setMintError(null);
    try {
      if (typeof window !== 'undefined' && (window.ethereum || window.okxwallet)) {
        await connectWallet('other');
      } else {
        openConnectModal();
      }
    } catch {
      openConnectModal();
    }
  };

  // Open official OpenSea Drop in new window
  const handleOpenSeaDropClick = () => {
    if (activeDrop.DROP_URL) {
      window.open(activeDrop.DROP_URL, '_blank', 'noopener,noreferrer');
    }
  };

  // Real Web3 On-Chain Mint Execution (SeaDrop contract call, NO simulation)
  const handleDirectWeb3Mint = async () => {
    setMintError(null);
    if (!isConnected || !account) {
      handleConnectClick();
      return;
    }

    // Safety guard: NEVER open wallet popup before stage is active
    if (!isStageLive) {
      setMintError(`OpenSea drop stage is scheduled for 17:15 UTC (starts in ${timeRemaining}). Wallet transactions are disabled until stage activates.`);
      return;
    }

    setIsMinting(true);
    setMintStatusText('CONFIRM ON-CHAIN TRANSACTION IN WALLET...');

    try {
      const result = await executeRealMint(account, quantity, (stage, detail) => {
        if (detail) setMintStatusText(detail);
      });

      if (result.success) {
        setMintedCount((prev) => prev + quantity);
        setMintedSuccess(result);
      } else if (result.error) {
        setMintError(result.error);
      }
    } catch (err: any) {
      console.error('Real mint error:', err);
      let msg = err?.message || 'Transaction could not be completed on-chain.';
      if (err?.code === 4001 || msg.includes('reject') || msg.includes('denied')) {
        msg = 'Transaction rejected in wallet.';
      }
      setMintError(msg);
    } finally {
      setIsMinting(false);
      setMintStatusText(null);
    }
  };

  // Save customized drop
  const handleSaveDropSync = (e: FormEvent) => {
    e.preventDefault();
    let url = inputUrl.trim();
    let contract = inputContract.trim();
    let network = inputNetwork;

    // Auto-detect network from URL if possible
    let chainId = '0x1237';
    let chainDecimal = 4663;
    let explorer = 'https://robinhoodchain.blockscout.com';
    let rpcUrl = 'https://rpc.mainnet.chain.robinhood.com';

    if (network === 'Robinhood Chain' || url.includes('robinhood')) {
      network = 'Robinhood Chain';
      chainId = '0x1237';
      chainDecimal = 4663;
      explorer = 'https://robinhoodchain.blockscout.com';
      rpcUrl = 'https://rpc.mainnet.chain.robinhood.com';
    } else if (network === 'Base Mainnet' || url.includes('/base/')) {
      network = 'Base';
      chainId = '0x2105';
      chainDecimal = 8453;
      explorer = 'https://basescan.org';
      rpcUrl = 'https://mainnet.base.org';
    } else if (network === 'Base Sepolia' || url.includes('base-sepolia')) {
      network = 'Base Sepolia';
      chainId = '0x14a34';
      chainDecimal = 84532;
      explorer = 'https://sepolia.basescan.org';
      rpcUrl = 'https://sepolia.base.org';
    } else if (network === 'Ethereum Mainnet') {
      network = 'Ethereum';
      chainId = '0x1';
      chainDecimal = 1;
      explorer = 'https://etherscan.io';
      rpcUrl = 'https://eth.llamarpc.com';
    } else if (network === 'Polygon') {
      network = 'Polygon';
      chainId = '0x89';
      chainDecimal = 137;
      explorer = 'https://polygonscan.com';
      rpcUrl = 'https://polygon-rpc.com';
    }

    // Extract slug from URL if possible
    let slug = activeDrop.COLLECTION_SLUG;
    const match = url.match(/collection\/([^/?#]+)/i);
    if (match && match[1]) {
      slug = match[1];
    }

    const updated: Partial<OpenSeaDropConfig> = {
      DROP_URL: url || activeDrop.DROP_URL,
      NFT_CONTRACT_ADDRESS: contract || activeDrop.NFT_CONTRACT_ADDRESS,
      NETWORK_NAME: network,
      CHAIN_ID: chainId,
      CHAIN_ID_DECIMAL: chainDecimal,
      EXPLORER_URL: explorer,
      RPC_URL: rpcUrl,
      COLLECTION_SLUG: slug,
      IS_DROP_LIVE: true,
    };

    saveActiveOpenSeaConfig(updated);
    setActiveDrop(getActiveOpenSeaConfig());
    setSyncSavedMessage('Connected successfully! Mint buttons are now synced with your OpenSea Drop.');
    setTimeout(() => {
      setSyncSavedMessage(null);
      setShowConfigModal(false);
    }, 1400);
  };

  return (
    <div
      className="min-h-screen text-[#111111] flex flex-col font-mono selection:bg-[#111] selection:text-[#faf8f3]"
      style={{
        backgroundColor: '#e8e8e2',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='2.5' height='2.5' fill='%239a9a94'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '8px 8px',
      }}
    >
      {/* Minimal Top Header with Back to Home Button */}
      <header className="w-full border-b border-[#111111]/20 bg-[#faf8f3]/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[720px] mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#faf8f3] hover:bg-[#111111] hover:text-[#ffffff] border border-[#111111] text-[12px] uppercase tracking-[0.16em] font-medium transition-colors shadow-[2px_2px_0_#111111] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>HOME</span>
          </button>

          <div className="flex items-center gap-2">
            <RareMark size={18} />
            <span className="font-['Silkscreen'] text-[14px] tracking-tight">RARE PEOPLE</span>
          </div>

          {/* Sync OpenSea Drop button */}
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#111111] hover:text-[#2081e2] transition-colors cursor-pointer bg-[#ffffff] px-2.5 py-1 border border-[#111111] shadow-[2px_2px_0_#111111]"
            title="Connect your deployed OpenSea Drop URL or Contract Address"
          >
            <span className="w-2 h-2 rounded-full bg-[#15803d]" />
            <span className="font-bold">SYNC DROP</span>
            <LinkIcon size={12} className="text-[#2081e2]" />
          </button>
        </div>
      </header>

      {/* Main Terminal View */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-14">
        <div className="w-full max-w-[620px] space-y-6">

          {/* ============================================================
              OPENSEA SCHEDULED DROP NOTIFICATION BANNER
              ============================================================ */}
          <div className="bg-[#ffffff] border-2 border-[#111111] p-4 shadow-[4px_4px_0_#111111] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#2081e2] flex items-center justify-center border border-[#111111] text-[#ffffff] font-bold shrink-0">
                ⛵
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-['Silkscreen'] text-[12px] sm:text-[13px] text-[#111111]">
                    OPENSEA DROP: {activeDrop.COLLECTION_SLUG.toUpperCase()}
                  </span>
                  <span className="text-[9px] bg-[#e0f2fe] text-[#0369a1] font-bold px-1.5 py-0.5 border border-[#bae6fd]">
                    CONNECTED
                  </span>
                </div>
                <div className="text-[11px] text-[#555555] flex items-center gap-2 mt-0.5">
                  <Clock size={11} className={isStageLive ? 'text-[#15803d]' : 'text-[#d97706] animate-pulse'} />
                  <span>
                    STATUS:{' '}
                    <span className={`font-bold ${isStageLive ? 'text-[#15803d]' : 'text-[#d97706]'}`}>
                      {isStageLive
                        ? `${currentActiveStage?.name} LIVE NOW`
                        : `STAGE 1 (TEAM) STARTS IN ${timeRemaining}`}
                    </span>
                  </span>
                  <span>·</span>
                  <span>{activeDrop.NETWORK_NAME}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenSeaDropClick}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-[#2081e2] hover:bg-[#1a68b5] text-[#ffffff] text-[11px] uppercase tracking-wider font-bold border border-[#111111] shadow-[2px_2px_0_#111111] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span>VIEW ON OPENSEA</span>
              <ExternalLink size={12} />
            </button>
          </div>

          {/* ============================================================
              CARD 1: GTD PHASE (GUARANTEED) & PROGRESS
              ============================================================ */}
          <div className="bg-[#faf8f3] border border-[#111111] p-6 sm:p-8 space-y-3.5 shadow-[4px_4px_0_#111111]">
            
            {/* Phase Title */}
            <div className="flex items-center justify-between text-[13px] sm:text-[14px] uppercase tracking-[0.24em] font-medium text-[#111111]">
              <span>
                {currentActiveStage
                  ? `${currentActiveStage.name} (${currentActiveStage.timeDisplay})`
                  : 'UPCOMING: STAGE 1 (TEAM AT 22:30 IST)'}
              </span>
              <span className="text-[11px] tracking-normal text-[#2081e2] font-bold">
                SEADROP PROTOCOL
              </span>
            </div>

            {/* Progress Bar with deep charcoal fill (Starts at 0%) */}
            <div className="w-full h-5 bg-[#d7d5cb] border border-[#111111] p-0 relative overflow-hidden">
              <div
                className="h-full bg-[#171719] transition-all duration-500 ease-out"
                style={{ width: `${progressRatio}%` }}
              />
            </div>

            {/* Bottom Subtext: MINTED / 0 / 6 283 */}
            <div className="flex items-center justify-between text-[11px] sm:text-[12px] uppercase pt-0.5">
              <span className="text-[#8b939c] tracking-[0.26em] font-medium">MINTED</span>
              <span className="text-[#111111] font-medium tracking-[0.22em]">
                {formatSpaced(mintedCount)} / {formatSpaced(TOTAL_SUPPLY)}
              </span>
            </div>
          </div>

          {/* ============================================================
              REAL WALLET CONNECT PILL (CENTERED)
              Shows e.g. "0X346E...790E ▼" or "CONNECT WALLET ▼"
              ============================================================ */}
          <div className="relative flex justify-center">
            {isConnected && account ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                  className="bg-[#141416] hover:bg-[#252528] text-[#ffffff] text-[12px] sm:text-[13px] uppercase tracking-[0.22em] px-6 py-2 border border-[#111111] shadow-[2px_2px_0_#111111] flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]" />
                  <span>{shortAccount.toUpperCase()}</span>
                  <span className="text-[9px]">▼</span>
                </button>

                {/* Real Wallet Dropdown Menu */}
                {walletDropdownOpen && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-[#faf8f3] border-2 border-[#111111] shadow-[4px_4px_0_#111111] p-3 z-40 text-[11px] space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#dddbd2] text-[10px] text-[#666666] tracking-wider uppercase">
                      <div className="flex items-center gap-1.5 font-bold text-[#111111]">
                        <span className="w-2 h-2 rounded-full bg-[#15803d]" />
                        <span>{walletName || 'Web3 EVM Wallet'}</span>
                      </div>
                      <span>{activeDrop.NETWORK_NAME}</span>
                    </div>

                    <div className="font-mono text-[11px] text-[#111111] break-all bg-[#ffffff] p-2 border border-[#b8b5a9]">
                      {account}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="py-1.5 px-2 bg-[#ffffff] hover:bg-[#eeeeee] border border-[#111111] text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3 text-green-700" /> : <Copy className="w-3 h-3 text-[#555]" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setWalletDropdownOpen(false);
                          openConnectModal();
                        }}
                        className="py-1.5 px-2 bg-[#ffffff] hover:bg-[#eeeeee] border border-[#111111] text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Wallet className="w-3 h-3 text-[#555]" />
                        <span>Switch</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        disconnectWallet();
                        setWalletDropdownOpen(false);
                      }}
                      className="w-full text-center py-1.5 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] border border-red-300 text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Disconnect Wallet</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConnectClick}
                disabled={isConnecting}
                className="bg-[#141416] hover:bg-[#252528] text-[#ffffff] text-[12px] sm:text-[13px] uppercase tracking-[0.22em] px-7 py-2 border border-[#111111] shadow-[2px_2px_0_#111111] flex items-center gap-3 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>CONNECTING...</span>
                  </>
                ) : (
                  <>
                    <span>CONNECT WALLET</span>
                    <span className="text-[9px]">▼</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Web3 Error Banner if any */}
          {(web3Error || mintError) && (
            <div className="p-3 bg-[#fee2e2] border-2 border-[#b91c1c] text-[#991b1b] text-[11px] flex items-start gap-2 shadow-[2px_2px_0_#b91c1c]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold">BLOCKCHAIN ERROR</div>
                <div>{mintError || web3Error}</div>
              </div>
            </div>
          )}

          {/* ============================================================
              CARD 2: OPENSEA DROP STAGES & ELIGIBILITY (4 PHASES)
              ============================================================ */}
          <div className="bg-[#faf8f3] border border-[#111111] p-6 sm:p-8 space-y-3.5 shadow-[4px_4px_0_#111111]">
            
            {/* Box Header */}
            <div className="flex items-center justify-between text-[11px] sm:text-[12px] uppercase tracking-[0.26em] text-[#8b939c] font-medium mb-4">
              <span>OPENSEA DROP STAGES &amp; ELIGIBILITY</span>
              <span className="text-[10px] text-[#2081e2] tracking-normal font-bold">
                4 CONFIGURED STAGES
              </span>
            </div>

            {/* 4 Configured Stages Rows with dynamic square bullets and status */}
            <div className="space-y-3 text-[12px] sm:text-[13px] tracking-[0.2em]">
              {OPENSEA_STAGES.map((stg) => {
                const isPast = nowSec >= stg.endSec;
                const isCurrent = nowSec >= stg.startSec && nowSec < stg.endSec;
                const isNext = !isCurrent && !isPast && nextUpcomingStage?.id === stg.id;

                let bulletClass = 'bg-[#4c4c4e]';
                let textClass = 'text-[#6b6b6f]';
                let statusLabel = `SCHEDULED ${stg.timeDisplay}`;

                if (isPast) {
                  bulletClass = 'bg-[#4c4c4e]';
                  textClass = 'text-[#6b6b6f]';
                  statusLabel = 'COMPLETED';
                } else if (isCurrent) {
                  bulletClass = 'bg-[#15803d] animate-pulse';
                  textClass = 'text-[#15803d] font-bold';
                  if (stg.id === 'TEAM') {
                    statusLabel = isConnected ? 'ACTIVE · 2 SPOTS' : 'ACTIVE · LIVE NOW';
                  } else if (stg.id === 'GTD') {
                    statusLabel = isConnected ? 'ACTIVE · 1 SPOT GUARANTEED' : 'ACTIVE · LIVE NOW';
                  } else if (stg.id === 'FCFS') {
                    statusLabel = isConnected ? 'ACTIVE · 1 SPOT FCFS' : 'ACTIVE · LIVE NOW';
                  } else {
                    statusLabel = isConnected
                      ? onChainDrop && onChainDrop.userMinted >= onChainDrop.maxUserMints
                        ? `MINTED OUT (${onChainDrop.userMinted}/${onChainDrop.maxUserMints})`
                        : 'ACTIVE · 2 PER WALLET'
                      : 'ACTIVE · OPEN TO ALL';
                  }
                } else if (isNext) {
                  bulletClass = 'bg-[#f59e0b] animate-pulse';
                  textClass = 'text-[#d97706] font-medium';
                  statusLabel = `STARTS IN ${formatDurationSecs(stg.startSec - nowSec)}`;
                } else {
                  bulletClass = 'bg-[#4c4c4e]';
                  textClass = 'text-[#8b939c]';
                  statusLabel = `SCHEDULED ${stg.timeDisplay}`;
                }

                return (
                  <div key={stg.id} className="flex items-center justify-between">
                    <div className="flex items-center text-[#111111]">
                      <span className={`w-2.5 h-2.5 inline-block mr-3 shrink-0 ${bulletClass}`} />
                      <span className="font-medium text-[#111111]">{stg.name}</span>
                    </div>
                    <span className={`uppercase font-medium ${textClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              QUANTITY SELECTOR: [ - ] [ 1 ] [ + ]
              ============================================================ */}
          <div className="flex items-center justify-center gap-2.5 py-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || isMinting || !isStageLive}
              className="w-12 h-10 border border-[#b8b5a9] bg-transparent hover:border-[#111111] text-[#666666] hover:text-[#111111] flex items-center justify-center text-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              -
            </button>

            <div className="w-16 h-10 border border-[#b8b5a9] bg-transparent flex items-center justify-center text-[15px] font-bold text-[#111111]">
              {quantity}
            </div>

            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(2, q + 1))}
              disabled={quantity >= 2 || isMinting || !isStageLive}
              className="w-12 h-10 border border-[#b8b5a9] bg-transparent hover:border-[#111111] text-[#666666] hover:text-[#111111] flex items-center justify-center text-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* ============================================================
              OPENSEA DROP ACTION BUTTONS (REAL WEB3 & OFFICIAL DROP LINK)
              NO FAKE SIMULATIONS!
              ============================================================ */}
          <div className="space-y-3">
            
            {/* Primary Action 1: OpenSea Official Drop Portal */}
            <button
              type="button"
              onClick={handleOpenSeaDropClick}
              className="w-full py-4 px-6 bg-[#2081e2] hover:bg-[#1868b7] text-[#ffffff] font-['Silkscreen'] text-[14px] sm:text-[16px] tracking-[0.16em] uppercase transition-all shadow-[3px_3px_0_#111111] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>⛵</span>
              <span>VIEW OPENSEA SCHEDULED DROP</span>
              <ExternalLink size={16} />
            </button>

            {/* Primary Action 2: Direct SeaDrop Web3 Mint On-Site */}
            {isConnected ? (
              <button
                type="button"
                onClick={handleDirectWeb3Mint}
                disabled={!isStageLive || isMinting || (onChainDrop ? onChainDrop.userMinted >= onChainDrop.maxUserMints : false)}
                className={`w-full py-4 px-6 font-['Silkscreen'] text-[13px] sm:text-[14px] tracking-[0.16em] uppercase transition-all flex items-center justify-center gap-3 ${
                  !isStageLive || (onChainDrop && onChainDrop.userMinted >= onChainDrop.maxUserMints)
                    ? 'bg-[#1e1e21] text-[#9ca3af] border-2 border-[#3f3f46] cursor-not-allowed opacity-90 shadow-none'
                    : isMinting
                    ? 'bg-[#111111] text-[#ffffff] shadow-[3px_3px_0_#888888] cursor-wait'
                    : 'bg-[#111111] hover:bg-[#252528] active:bg-[#000000] text-[#ffffff] shadow-[3px_3px_0_#888888] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer'
                }`}
              >
                {!isStageLive ? (
                  <>
                    <Clock size={16} className="text-[#f59e0b] shrink-0 animate-pulse" />
                    <span>TEAM MINT OPENS IN {timeRemaining}</span>
                  </>
                ) : onChainDrop && onChainDrop.userMinted >= onChainDrop.maxUserMints ? (
                  <>
                    <CheckCircle2 size={16} className="text-[#10b981] shrink-0" />
                    <span>MAX LIMIT REACHED ({onChainDrop.userMinted}/{onChainDrop.maxUserMints})</span>
                  </>
                ) : isMinting ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-white animate-spin shrink-0" />
                    <span>{mintStatusText || 'COMMUNICATING WITH BLOCKCHAIN...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-[#ccff00] shrink-0" />
                    <span>DIRECT ON-CHAIN MINT ({currentActiveStage?.shortLabel || 'ACTIVE STAGE'})</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectClick}
                className="w-full py-4 px-6 bg-[#111111] hover:bg-[#252528] active:bg-[#000000] text-[#ffffff] font-['Silkscreen'] text-[13px] sm:text-[14px] tracking-[0.16em] uppercase transition-all shadow-[3px_3px_0_#888888] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-3 cursor-pointer"
              >
                <Wallet size={16} className="text-[#ccff00] shrink-0" />
                <span>CONNECT WALLET TO MINT</span>
              </button>
            )}

            {/* Notice when stage is not active yet or currently active */}
            {!isStageLive ? (
              <div className="bg-[#141416] border border-[#f59e0b]/40 p-3.5 text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-[#f59e0b] font-bold tracking-wider uppercase text-[11px]">
                  <Clock size={13} className="animate-pulse shrink-0" />
                  <span>OPENSEA STAGES: TEAM 22:30 · GTD 22:35 · FCFS 22:40 · PUBLIC 22:45 IST</span>
                </div>
                <p className="text-[#a1a1aa] text-[10px] leading-relaxed">
                  Drop minting begins with Stage 1 (Team) at 22:30 IST (GMT+5:30). The on-chain SeaDrop smart contract will reject transactions before 22:30 IST. The button will unlock automatically at 22:30 IST.
                </p>
              </div>
            ) : (
              <div className="bg-[#141416] border border-[#15803d]/40 p-3 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-[#15803d] font-bold tracking-wider uppercase text-[11px]">
                  <Sparkles size={13} className="text-[#15803d] shrink-0" />
                  <span>{currentActiveStage?.name} IS CURRENTLY ACTIVE</span>
                </div>
                <p className="text-[#a1a1aa] text-[10px] leading-relaxed">
                  {nextUpcomingStage 
                    ? `Next stage (${nextUpcomingStage.name}) begins at ${nextUpcomingStage.timeDisplay} (in ${timeRemaining}).` 
                    : 'Public stage is live on Robinhood Chain via OpenSea SeaDrop.'}
                </p>
              </div>
            )}

          </div>

          {/* Subtext info */}
          <div className="text-center text-[11px] text-[#555555] tracking-[0.18em]">
            OPENSEA SEADROP · {activeDrop.NETWORK_NAME.toUpperCase()} · FREE TEST MINT · MAX 2 PER WALLET
          </div>

        </div>
      </main>

      {/* Real Mint Confirmed Modal (Shown only on genuine blockchain confirmation) */}
      {mintedSuccess && (
        <div className="fixed inset-0 bg-[#111111]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#faf8f3] border-2 border-[#111111] max-w-[460px] w-full p-6 sm:p-7 shadow-[8px_8px_0_#111111] animate-in fade-in zoom-in duration-150 font-mono">
            
            <div className="text-center mb-5">
              <span className="inline-block bg-[#15803d] text-[#ffffff] text-[10px] uppercase tracking-[0.16em] px-2.5 py-1 mb-2 font-bold">
                REAL ON-CHAIN TRANSACTION CONFIRMED
              </span>
              <h3 className="font-['Silkscreen'] text-xl text-[#111111]">
                NFT MINT SUCCESSFUL
              </h3>
              <p className="text-[11px] text-[#666666] mt-1 tracking-wider">
                {activeDrop.NETWORK_NAME} SeaDrop v1.0
              </p>
            </div>

            {mintedSuccess.txHash && (
              <div className="bg-[#ffffff] border border-[#b8b5a9] p-3 text-[11px] space-y-2 mb-4">
                <div className="text-[#888888] uppercase text-[9px] tracking-wider">
                  Verified Blockchain Transaction Hash
                </div>
                <div className="font-mono text-[11px] text-[#111111] break-all bg-[#f4f4f0] p-2 border border-[#ddd]">
                  {mintedSuccess.txHash}
                </div>
                <a
                  href={`${activeDrop.EXPLORER_URL}/tx/${mintedSuccess.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#2081e2] hover:underline font-bold"
                >
                  <span>View on Block Explorer</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMintedSuccess(null)}
              className="w-full py-2.5 bg-[#111111] text-[#ffffff] text-[11px] uppercase tracking-wider font-bold hover:bg-[#333333] transition-colors cursor-pointer"
            >
              CLOSE
            </button>

          </div>
        </div>
      )}

      {/* Sync OpenSea Drop Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-[#111111]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#faf8f3] border-2 border-[#111111] max-w-[540px] w-full p-6 shadow-[8px_8px_0_#111111] font-mono text-[12px] space-y-4">
            <div className="flex items-center justify-between border-b border-[#111111]/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⛵</span>
                <span className="font-['Silkscreen'] text-[14px]">CONNECT YOUR OPENSEA DROP</span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-[11px] font-bold px-2 py-0.5 border border-[#111111] hover:bg-[#111111] hover:text-[#ffffff] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {syncSavedMessage && (
              <div className="p-3 bg-[#dcfce7] border border-[#86efac] text-[#166534] text-[11px] flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{syncSavedMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveDropSync} className="space-y-3.5">
              <div>
                <label className="block text-[11px] uppercase font-bold text-[#111111] mb-1">
                  1. OpenSea Drop Page URL
                </label>
                <input
                  type="text"
                  placeholder="https://testnets.opensea.io/collection/.../drop"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full bg-[#ffffff] border border-[#111111] px-3 py-2 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-[#2081e2]"
                />
                <span className="text-[10px] text-[#666666] mt-0.5 block">
                  (Testnet ya Mainnet drop link jo OpenSea Studio se mila)
                </span>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#111111] mb-1">
                  2. Deployed Contract Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={inputContract}
                  onChange={(e) => setInputContract(e.target.value)}
                  className="w-full bg-[#ffffff] border border-[#111111] px-3 py-2 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-[#2081e2]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#111111] mb-1">
                  3. Network / Blockchain
                </label>
                <select
                  value={inputNetwork}
                  onChange={(e) => setInputNetwork(e.target.value)}
                  className="w-full bg-[#ffffff] border border-[#111111] px-3 py-2 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-[#2081e2]"
                >
                  <option value="Robinhood Chain">Robinhood Chain (Chain ID: 4663)</option>
                  <option value="Sepolia Testnet">Sepolia Testnet (Ethereum)</option>
                  <option value="Base Sepolia">Base Sepolia (Testnet)</option>
                  <option value="Base">Base Mainnet</option>
                  <option value="Ethereum">Ethereum Mainnet</option>
                  <option value="Polygon">Polygon Mainnet</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#2081e2] hover:bg-[#1868b7] text-[#ffffff] font-bold text-[12px] uppercase tracking-wider shadow-[2px_2px_0_#111111] cursor-pointer transition-colors"
                >
                  SAVE & CONNECT DROP TO MINT BUTTON
                </button>
              </div>
            </form>

            <div className="text-[10px] text-[#777777] border-t border-[#111111]/10 pt-2 text-center">
              Aap chat me bhi link/address bhej sakte hain, main automatically sync kar dunga!
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#111111]/10 py-5 text-center text-[11px] text-[#777777] tracking-wider">
        RARE PEOPLE © 2026 · POWERED BY OPENSEA SEADROP PROTOCOL
      </footer>
    </div>
  );
}
