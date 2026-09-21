import { useState, useEffect } from 'react';
import { useWhitelist } from './whitelist-context';
import { useWeb3 } from '../lib/web3';
import { IS_CHECKER_PAUSED } from '../lib/config';
import RareMark from './RareMark';
import SteppedDitherChart from './SteppedDitherChart';
import { Check, XCircle, Loader2 } from 'lucide-react';

export default function Hero() {
  const { open, openChecker } = useWhitelist();
  const { isConnected, shortAccount, account, openConnectModal } = useWeb3();
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [wlStatus, setWlStatus] = useState<{
    loading: boolean;
    whitelisted: boolean | null;
    spot?: number;
  }>({
    loading: false,
    whitelisted: null,
  });

  useEffect(() => {
    if (IS_CHECKER_PAUSED) {
      setWlStatus({ loading: false, whitelisted: null });
      setClaimStatus(null);
      return;
    }

    if (!isConnected || !account) {
      setWlStatus({ loading: false, whitelisted: null });
      setClaimStatus(null);
      return;
    }

    let isMounted = true;
    setWlStatus({ loading: true, whitelisted: null });

    async function checkAccountWL() {
      try {
        const res = await fetch(`/api/whitelist?check=${encodeURIComponent(account!)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.whitelisted === 'boolean' && data.whitelisted) {
            setWlStatus({
              loading: false,
              whitelisted: true,
              spot: data.spot,
            });
            setClaimStatus(`Allocation verified! 1 Rare People spot reserved for 21 Sep drop.`);
            return;
          }
        }
      } catch {
        // Backend attempt error
      }

      // Direct fallback to Google Script Web App
      try {
        const gRes = await fetch(
          `https://script.google.com/macros/s/AKfycbyBdWvIT9UUlyOTz7v4Xjj5KNDrRnb0R3lvwlZ_jHJkYw1xEm9OMsMoXlwqNL-2evgR/exec?wallet=${encodeURIComponent(account!)}`
        );
        if (gRes.ok) {
          const gData = await gRes.json();
          if (isMounted && typeof gData.whitelisted === 'boolean' && gData.whitelisted) {
            setWlStatus({
              loading: false,
              whitelisted: true,
              spot: gData.spot,
            });
            setClaimStatus(`Allocation verified! 1 Rare People spot reserved for 21 Sep drop.`);
            return;
          }
        }
      } catch {
        // Fallback error
      }

      if (isMounted) {
        setWlStatus({ loading: false, whitelisted: false });
        setClaimStatus(`No allocation found for this wallet. Join the whitelist to reserve a spot.`);
      }
    }

    checkAccountWL();
    return () => {
      isMounted = false;
    };
  }, [isConnected, account]);

  return (
    <section id="top" className="w-full bg-[#eeeeee] text-[#111] pt-6 sm:pt-8 pb-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8">
        
        {/* ============================================================
            SECTION 1: TOP INTRO & DITHER MASCOT BADGE
            ============================================================ */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          {/* Left Title & Subtitle */}
          <div className="space-y-2 max-w-[760px]">
            <div className="rf-label flex items-center gap-1.5">
              <span>robinhood chain</span>
              <span>·</span>
              <span>genesis nft drop</span>
            </div>

            <h1 className="font-['Silkscreen'] text-[28px] sm:text-[38px] md:text-[44px] text-[#111] leading-none tracking-tight">
              RARE PEOPLE GENESIS
            </h1>

            <p className="font-['Archivo'] text-[15px] sm:text-[16px] text-[#222] leading-normal pt-1">
              4,444 handcrafted pixel art collectibles releasing on Robinhood EVM Chain. Whitelist reservations are open for the <strong>21 September 2026</strong> drop.
            </p>
          </div>

          {/* Right Mascot Frame with Dither Background */}
          <div className="self-start md:self-end shrink-0">
            <RareMark withDitherBox size={36} />
          </div>
        </div>

        {/* ============================================================
            SECTION 2: 4-COLUMN STAT MATRIX (NFT Collection Metrics)
            ============================================================ */}
        <div className="border border-[#111] bg-[#eeeeee] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#111]">
          {/* Box 1: Dithered background */}
          <div className="p-4 sm:p-5 flex flex-col justify-between relative bg-cover" style={{ backgroundImage: 'var(--dither-25)' }}>
            <div className="bg-[#eeeeee]/90 p-1 inline-block w-fit mb-4">
              <span className="rf-label">total collection supply</span>
            </div>
            <div className="bg-[#eeeeee]/95 p-1.5 border border-[#111] w-fit">
              <div className="font-['Silkscreen'] text-[22px] sm:text-[26px] text-[#111] leading-none">4,444</div>
              <div className="rf-label text-[#888] mt-1">UNIQUE 1/1 PIXELS</div>
            </div>
          </div>

          {/* Box 2 */}
          <div className="p-4 sm:p-5 flex flex-col justify-between bg-[#eeeeee]">
            <span className="rf-label">mint price</span>
            <div className="mt-4">
              <div className="font-['Sometype_Mono'] font-bold text-[18px] sm:text-[20px] text-[#111] leading-none tracking-tight">
                0.00 ETH
              </div>
              <div className="rf-label text-[#888] mt-1">FREE FAIR MINT · ROBINHOOD EVM</div>
            </div>
          </div>

          {/* Box 3 */}
          <div className="p-4 sm:p-5 flex flex-col justify-between bg-[#eeeeee]">
            <span className="rf-label">mint schedule</span>
            <div className="mt-4">
              <div className="font-['Silkscreen'] text-[22px] sm:text-[26px] text-[#111] leading-none">
                21 SEP 2026
              </div>
              <div className="rf-label text-[#888] mt-1">PHASE 1 GUARANTEED WL</div>
            </div>
          </div>

          {/* Box 4 */}
          <div className="p-4 sm:p-5 flex flex-col justify-between bg-[#eeeeee]">
            <span className="rf-label">distribution model</span>
            <div className="mt-2">
              <div className="font-['Silkscreen'] text-[15px] sm:text-[16px] text-[#111] leading-tight mb-1">
                FAIR NFT DROP
              </div>
              <div className="font-['Archivo'] text-[13px] text-[#555] leading-snug">
                100% on-chain traits. Zero gas wars. 1 mint reserved per verified Robinhood wallet.
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            SECTION 3: 2-COLUMN MAIN CONTENT
            Left (65%): Stepped Dither Chart & Trait Previewer
            Right (35%): Stack of 2 Chunky Raised Cards
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: NFT Specification & Trait Chart */}
          <div className="lg:col-span-7 xl:col-span-8">
            <SteppedDitherChart />
          </div>

          {/* Right Column: 2 Cards with 2px border and 6px shadow */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Card 1: GENESIS NFT MINT */}
            <div className="bg-[#eeeeee] border-2 border-[#111] shadow-[6px_6px_0_0_#111] p-6 sm:p-7 space-y-4">
              <h2 className="font-['Silkscreen'] text-[18px] sm:text-[20px] text-[#111] leading-snug">
                GENESIS NFT MINT
              </h2>
              <p className="font-['Archivo'] text-[14px] sm:text-[15px] text-[#444] leading-relaxed">
                Whitelist spots are actively allocated for the <strong>21 September 2026</strong> drop. Connect your Robinhood EVM wallet to reserve your guaranteed mint.
              </p>

              {!isConnected ? (
                <button
                  type="button"
                  onClick={openConnectModal}
                  className="w-full py-3 px-4 bg-[#111] hover:bg-[#222] text-[#eeeeee] font-['Sometype_Mono'] text-[14px] text-center border border-[#111] shadow-[2px_2px_0_#111] transition-all cursor-pointer"
                >
                  [ connect wallet ]
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="w-full py-3 px-4 bg-[#111] text-[#eeeeee] font-['Sometype_Mono'] text-[13px] text-center border border-[#111] flex items-center justify-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${wlStatus.whitelisted ? 'bg-[#ccff00]' : 'bg-[#ff4444]'}`} />
                    <span>[ connected: {shortAccount} ]</span>
                  </div>

                  {IS_CHECKER_PAUSED ? (
                    <div className="space-y-2">
                      <div className="w-full py-2.5 px-4 bg-[#fffbeb] border border-[#b45309] text-[#78350f] font-['Sometype_Mono'] text-[12px] text-center">
                        [ checker paused · verification on hold ]
                      </div>
                      <button
                        type="button"
                        onClick={open}
                        className="w-full py-2.5 px-4 bg-[#ccff00] hover:bg-[#bbf000] text-[#111] font-['Sometype_Mono'] text-[13px] text-center border border-[#111] font-medium transition-all cursor-pointer"
                      >
                        [ join whitelist registration ]
                      </button>
                    </div>
                  ) : wlStatus.loading ? (
                    <div className="w-full py-2.5 px-4 bg-[#fff] border border-[#111] flex items-center justify-center gap-2 font-['Sometype_Mono'] text-[12px] text-[#111]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking whitelist status...</span>
                    </div>
                  ) : wlStatus.whitelisted ? (
                    <div className="space-y-2">
                      <div className="w-full py-2.5 px-4 bg-[#ccff00] text-[#111] font-['Sometype_Mono'] text-[13px] text-center border border-[#111] font-medium">
                        [ allocation confirmed · spot #{wlStatus.spot || 1} ]
                      </div>
                      <div className="p-2 bg-[#fff] border border-[#111] font-['Sometype_Mono'] text-[11px] text-[#111]">
                        Allocation verified! 1 Rare People spot reserved for 21 Sep drop.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={open}
                        className="w-full py-2.5 px-4 bg-[#111] hover:bg-[#222] text-[#fff] font-['Sometype_Mono'] text-[13px] text-center border border-[#111] font-medium transition-all cursor-pointer"
                      >
                        [ join whitelist now ]
                      </button>
                      <div className="p-2 bg-[#fff] border border-[#111] font-['Sometype_Mono'] text-[11px] text-[#d00]">
                        No allocation found for this wallet. Join the whitelist to reserve a spot.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card 2: GENESIS & WHITELIST */}
            <div className="bg-[#eeeeee] border-2 border-[#111] shadow-[6px_6px_0_0_#111] p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-['Silkscreen'] text-[18px] sm:text-[20px] text-[#111] leading-snug">
                  GENESIS & WL CHECKER
                </h2>
                {IS_CHECKER_PAUSED ? (
                  <span className="px-2 py-0.5 bg-[#fef08a] border border-[#854d0e] text-[#854d0e] font-['Silkscreen'] text-[10px] font-bold">
                    [ PAUSED ]
                  </span>
                ) : (
                  <span className="rf-signal-tag">live</span>
                )}
              </div>
              <p className="font-['Archivo'] text-[14px] sm:text-[15px] text-[#444] leading-relaxed">
                4,444 Rare People are releasing on Robinhood EVM chain on <strong>21 September 2026</strong>. Check your whitelist status.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={openChecker}
                  className="flex-1 py-3 px-4 bg-[#eeeeee] hover:bg-[#e4e4e4] text-[#111] font-['Sometype_Mono'] text-[13px] text-center border-2 border-[#111] shadow-[2px_2px_0_#111] transition-all cursor-pointer"
                >
                  {IS_CHECKER_PAUSED ? '[ check whitelist spot (paused) ]' : '[ check whitelist spot ]'}
                </button>
                <button
                  type="button"
                  onClick={open}
                  className="py-3 px-4 bg-[#ccff00] hover:bg-[#bbf000] text-[#111] font-['Sometype_Mono'] text-[13px] text-center border-2 border-[#111] shadow-[2px_2px_0_#111] transition-all cursor-pointer font-medium"
                >
                  [ join wl ]
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            SECTION 4: YOUR MINT RESERVATION (NFT Mint Mechanics)
            ============================================================ */}
        <div className="pt-8 space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <h2 className="font-['Silkscreen'] text-[16px] sm:text-[18px] text-[#111]">
              YOUR MINT RESERVATION
            </h2>
            <span className="font-['Sometype_Mono'] text-[13px] text-[#666]">
              {isConnected
                ? IS_CHECKER_PAUSED
                  ? 'checker paused'
                  : wlStatus.loading
                  ? 'checking...'
                  : wlStatus.whitelisted
                  ? '1 spot verified'
                  : 'no allocation'
                : 'connect wallet'}
            </span>
          </div>

          {/* Dither pattern wide banner with centered status box */}
          <div
            className="border border-[#111] p-8 sm:p-12 flex items-center justify-center"
            style={{ backgroundImage: 'var(--dither-25)' }}
          >
            <div className="bg-[#eeeeee] border border-[#111] shadow-[3px_3px_0_#111] px-6 py-4 text-center max-w-md">
              {!isConnected ? (
                <div className="space-y-3">
                  <div className="font-['Sometype_Mono'] text-[13px] text-[#111]">
                    Connect wallet to check your NFT reservation.
                  </div>
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="py-1.5 px-4 bg-[#111] hover:bg-[#222] text-[#eeeeee] font-['Sometype_Mono'] text-[12px] border border-[#111] cursor-pointer"
                  >
                    [ connect wallet ]
                  </button>
                </div>
              ) : IS_CHECKER_PAUSED ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-[#854d0e] font-['Silkscreen'] text-[12px]">
                    <span>CHECKER CURRENTLY PAUSED</span>
                  </div>
                  <div className="font-['Sometype_Mono'] text-[12px] text-[#111] break-all">
                    {account}
                  </div>
                  <div className="inline-block bg-[#fffbeb] text-[#92400e] border border-[#b45309] px-2 py-0.5 text-[10px] font-['Sometype_Mono']">
                    live verification on hold · registrations active
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={open}
                      className="py-1.5 px-4 bg-[#ccff00] hover:bg-[#bbf000] text-[#111] font-['Sometype_Mono'] text-[12px] border border-[#111] font-medium cursor-pointer"
                    >
                      [ join whitelist registration ]
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {wlStatus.loading ? (
                    <div className="flex items-center justify-center gap-2 font-['Sometype_Mono'] text-[13px] text-[#111] py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#111]" />
                      <span>CHECKING ALLOCATION...</span>
                    </div>
                  ) : wlStatus.whitelisted ? (
                    <>
                      <div className="flex items-center justify-center gap-1.5 text-green-700 font-['Silkscreen'] text-[13px]">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>WALLET ALLOCATED</span>
                      </div>
                      <div className="font-['Sometype_Mono'] text-[12px] text-[#111] break-all">
                        {account}
                      </div>
                      <div className="rf-signal-tag text-[10px]">
                        1 spot confirmed for 21 sep drop
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-1.5 text-red-600 font-['Silkscreen'] text-[13px]">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>NO ALLOCATION FOUND</span>
                      </div>
                      <div className="font-['Sometype_Mono'] text-[12px] text-[#111] break-all">
                        {account}
                      </div>
                      <div className="inline-block bg-[#ffefef] text-[#c00] border border-[#c00] px-2 py-0.5 text-[10px] font-['Sometype_Mono']">
                        not whitelisted · 0 spots reserved
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={open}
                          className="py-1.5 px-4 bg-[#ccff00] hover:bg-[#bbf000] text-[#111] font-['Sometype_Mono'] text-[12px] border border-[#111] font-medium cursor-pointer"
                        >
                          [ join whitelist ]
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3-Column Connected Feature Matrix (NFT Drop Specifications) */}
          <div className="border border-[#111] bg-[#eeeeee] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#111]">
            {/* Box 1 */}
            <div className="p-5 space-y-2">
              <h3 className="font-['Silkscreen'] text-[14px] sm:text-[15px] text-[#111]">
                PHASE 1: GUARANTEED WL
              </h3>
              <p className="font-['Archivo'] text-[13px] text-[#555] leading-relaxed">
                Verified Robinhood addresses receive a dedicated 24-hour priority mint window with 100% guaranteed allocation.
              </p>
            </div>

            {/* Box 2 */}
            <div className="p-5 space-y-2">
              <h3 className="font-['Silkscreen'] text-[14px] sm:text-[15px] text-[#111]">
                100% ON-CHAIN ARTWORK
              </h3>
              <p className="font-['Archivo'] text-[13px] text-[#555] leading-relaxed">
                All 4,444 pixel characters, color palettes, and trait combinations are stored immutably on Robinhood EVM smart contracts.
              </p>
            </div>

            {/* Box 3 */}
            <div className="p-5 space-y-2">
              <h3 className="font-['Silkscreen'] text-[14px] sm:text-[15px] text-[#111]">
                FAIR DROP MECHANICS
              </h3>
              <p className="font-['Archivo'] text-[13px] text-[#555] leading-relaxed">
                Strict 1 mint per wallet quota with zero front-running bots, sub-cent gas fees, and instant verifiable on-chain reveal.
              </p>
            </div>
          </div>

          {/* Bottom Info Bar with contract address & external links */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-[12px] font-['Sometype_Mono'] text-[#666]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#111]">Robinhood Chain</span>
              <span>·</span>
              <span className="text-[#888]">nft contract</span>
              <span className="font-mono text-[#111] bg-[#fff] px-1.5 py-0.5 border border-[#111] text-[11px] select-all">
                [ coming soon ]
              </span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="#about"
                className="hover:text-[#111] hover:underline flex items-center gap-1"
              >
                [ about Robinhood Chain ↗ ]
              </a>
              <button
                type="button"
                onClick={openChecker}
                className="hover:text-[#111] hover:underline cursor-pointer"
              >
                [ check WL spot ↗ ]
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
