import { useState, useEffect, type FormEvent } from 'react';
import { EVM_REGEX } from '../../lib/db';
import { useWeb3 } from '../lib/web3';
import { useWhitelist } from './whitelist-context';
import { IS_CHECKER_PAUSED } from '../lib/config';
import RareMark from './RareMark';
import { AlertCircle, PauseCircle, Clock } from 'lucide-react';

interface WLCheckResult {
  whitelisted: boolean;
  wallet: string;
  submittedAt?: string;
  spot?: number;
  total?: number;
}

interface WLCheckerProps {
  initialAddress?: string;
  compact?: boolean;
}

export default function WLChecker({ initialAddress = '', compact = false }: WLCheckerProps) {
  const { account, isConnected, openConnectModal } = useWeb3();
  const { open: openWhitelist } = useWhitelist();

  const [inputWallet, setInputWallet] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WLCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!IS_CHECKER_PAUSED && isConnected && account) {
      setInputWallet(account);
      handleCheck(account);
    }
  }, [isConnected, account]);

  const handleCheck = async (targetWallet?: string) => {
    if (IS_CHECKER_PAUSED) {
      setError('Whitelist checker is currently paused. Please check back later.');
      return;
    }
    const w = (targetWallet || inputWallet).trim();
    if (!w) {
      setError('Please paste or select a wallet address.');
      return;
    }
    if (!EVM_REGEX.test(w)) {
      setError('Invalid EVM address. Please provide a standard 0x address (42 characters).');
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      // 1. Try backend whitelist endpoint
      let isVerified = false;
      let checkData: any = null;

      // 1. Query the cached whitelist endpoint with a 3.5s timeout
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        let res = await fetch(`/api/whitelist?check=${encodeURIComponent(w)}`, { signal: controller.signal });
        let contentType = res.headers.get('content-type') || '';

        if (!res.ok || contentType.includes('text/html')) {
          res = await fetch(`/api/whitelist/check?wallet=${encodeURIComponent(w)}`, { signal: controller.signal });
          contentType = res.headers.get('content-type') || '';
        }

        clearTimeout(timeout);

        if (res.ok && !contentType.includes('text/html')) {
          const data = await res.json();
          if (typeof data.whitelisted === 'boolean') {
            checkData = data;
            if (data.whitelisted) isVerified = true;
          }
        }
      } catch {
        // Timed out or local network issue
      }

      // 2. Direct fallback to Google Apps Script Web App if not verified yet
      if (!isVerified) {
        try {
          const gController = new AbortController();
          const gTimeout = setTimeout(() => gController.abort(), 6000);
          const gRes = await fetch(
            `https://script.google.com/macros/s/AKfycbyBdWvIT9UUlyOTz7v4Xjj5KNDrRnb0R3lvwlZ_jHJkYw1xEm9OMsMoXlwqNL-2evgR/exec?wallet=${encodeURIComponent(w)}`,
            { signal: gController.signal }
          );
          clearTimeout(gTimeout);
          if (gRes.ok) {
            const gData = await gRes.json();
            if (gData && typeof gData.whitelisted === 'boolean' && gData.whitelisted) {
              checkData = {
                whitelisted: true,
                wallet: w,
                spot: gData.spot || 1,
                total: gData.total || (checkData?.total ?? 1),
              };
              isVerified = true;
            }
          }
        } catch {
          // Ignore Google script cross-fetch failure
        }
      }

      if (checkData) {
        setResult(checkData);
      } else {
        setResult({
          whitelisted: false,
          wallet: w,
          total: 0,
        });
      }
    } catch {
      setError('Network error while checking whitelist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleCheck();
  };

  const checkConnectedAccount = () => {
    if (account) {
      setInputWallet(account);
      handleCheck(account);
    } else {
      openConnectModal();
    }
  };

  return (
    <div id="wl-checker" className={`w-full ${compact ? '' : 'py-10 sm:py-14 bg-[#eeeeee]'}`}>
      <div className={`mx-auto max-w-[840px] ${compact ? '' : 'px-4 sm:px-6'}`}>
        <div className="bg-[#eeeeee] border-2 border-[#111] shadow-[6px_6px_0_0_#111] p-6 sm:p-10 text-left">
          
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#111]">
            <div className="flex items-center gap-2">
              <RareMark size={24} />
              <h2 className="font-['Silkscreen'] text-[18px] sm:text-[22px] text-[#111]">
                WHITELIST CHECKER
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {IS_CHECKER_PAUSED ? (
                <span className="px-2.5 py-1 bg-[#fef08a] border border-[#854d0e] text-[#854d0e] font-['Silkscreen'] text-[11px] font-bold">
                  [ CHECKER PAUSED ]
                </span>
              ) : (
                <span className="rf-signal-tag">mint: 21 sep</span>
              )}
              <span className="font-['Sometype_Mono'] text-[11px] text-[#666]">robinhood chain</span>
            </div>
          </div>

          {IS_CHECKER_PAUSED ? (
            <div className="mt-4 p-4 bg-[#fffbeb] border-2 border-[#b45309] text-[#78350f] font-['Sometype_Mono'] space-y-2">
              <div className="flex items-center gap-2 font-['Silkscreen'] text-[13px] text-[#92400e]">
                <PauseCircle className="w-4 h-4 text-[#b45309]" />
                <span>CHECKER TEMPORARILY DISABLED</span>
              </div>
              <p className="text-[12px] text-[#78350f] leading-relaxed">
                Live allocation verification is currently paused while final whitelist snapshots are being synchronized. For announcements and priority updates, follow us on{' '}
                <a
                  href="https://x.com/RarePeoplesNFT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold text-[#92400e] hover:text-[#111]"
                >
                  X (@RarePeoplesNFT)
                </a>
                .
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openWhitelist}
                  className="rf-btn bg-[#111] hover:bg-[#222] text-[#fff] text-[11px] py-1.5 px-3 font-medium cursor-pointer"
                >
                  [ join whitelist registration ]
                </button>
                <a
                  href="https://x.com/RarePeoplesNFT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rf-btn bg-[#fff] hover:bg-[#eee] text-[#111] text-[11px] py-1.5 px-3 font-medium cursor-pointer inline-flex items-center gap-1"
                >
                  <span>𝕏 Follow @RarePeoplesNFT</span>
                </a>
              </div>
            </div>
          ) : (
            <p className="font-['Archivo'] text-[14px] sm:text-[15px] text-[#444] leading-relaxed mt-4">
              Verify if your Robinhood EVM address is registered for the <strong>21 September 2026</strong> drop. Total supply is fixed at <strong>4,444</strong> Rare People.
            </p>
          )}

          {/* Quick Check with connected account */}
          <div className="mt-4 pt-2">
            {isConnected && account ? (
              <button
                type="button"
                disabled={IS_CHECKER_PAUSED}
                onClick={checkConnectedAccount}
                className={`rf-btn text-[12px] py-1.5 px-3 flex items-center gap-2 ${
                  IS_CHECKER_PAUSED
                    ? 'bg-[#e5e5e5] text-[#888] border-[#999] opacity-70 cursor-not-allowed'
                    : 'bg-[#eeeeee] hover:bg-[#e4e4e4]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${IS_CHECKER_PAUSED ? 'bg-[#999]' : 'bg-[#ccff00]'}`} />
                <span>
                  [ 1-click check: {account.slice(0, 6)}...{account.slice(-4)} {IS_CHECKER_PAUSED ? '(paused)' : ''} ]
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={IS_CHECKER_PAUSED}
                onClick={checkConnectedAccount}
                className={`rf-btn text-[12px] py-1.5 px-3 flex items-center gap-2 ${
                  IS_CHECKER_PAUSED
                    ? 'bg-[#e5e5e5] text-[#888] border-[#999] opacity-70 cursor-not-allowed'
                    : 'bg-[#eeeeee] hover:bg-[#e4e4e4]'
                }`}
              >
                <span>[ connect wallet for 1-click check {IS_CHECKER_PAUSED ? '(paused)' : ''} ]</span>
              </button>
            )}
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                disabled={IS_CHECKER_PAUSED}
                value={inputWallet}
                onChange={(e) => {
                  setInputWallet(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={
                  IS_CHECKER_PAUSED
                    ? "checker currently paused · verification on hold"
                    : "0x... paste your robinhood evm address"
                }
                spellCheck={false}
                autoComplete="off"
                className={`flex-1 px-3.5 py-2.5 font-['Sometype_Mono'] text-[13px] border border-[#111] outline-none ${
                  IS_CHECKER_PAUSED
                    ? 'bg-[#f0f0f0] text-[#888] cursor-not-allowed border-[#999]'
                    : 'bg-[#fff] text-[#111] placeholder:text-[#888]'
                }`}
              />
              <button
                type="submit"
                disabled={IS_CHECKER_PAUSED || loading}
                className={`rf-btn text-[13px] py-2.5 px-5 shrink-0 ${
                  IS_CHECKER_PAUSED
                    ? 'bg-[#999] text-[#fff] border-[#777] cursor-not-allowed opacity-75'
                    : 'rf-btn-dark'
                }`}
              >
                {IS_CHECKER_PAUSED
                  ? '[ checker paused ]'
                  : loading
                  ? '[ verifying... ]'
                  : '[ verify status ]'}
              </button>
            </div>

            {error && (
              <div className="p-2 border border-red-400 bg-red-50 text-red-700 font-['Sometype_Mono'] text-[12px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Result Output */}
          {result && (
            <div className="mt-6 border border-[#111] bg-[#f7f7f7] p-5 font-['Sometype_Mono'] space-y-3">
              {result.whitelisted ? (
                <div>
                  <div className="flex items-center gap-2 text-[#111] pb-2 border-b border-[#111]">
                    <span className="w-3 h-3 bg-[#ccff00] border border-[#111]" />
                    <span className="font-['Silkscreen'] text-[14px]">STATUS: ALLOCATED & APPROVED</span>
                    {result.spot && <span className="ml-auto text-[12px] text-[#666]">SPOT #{result.spot}</span>}
                  </div>

                  <div className="pt-3 space-y-1.5 text-[12px] text-[#333]">
                    <div className="flex justify-between flex-wrap">
                      <span className="text-[#888]">Wallet Address:</span>
                      <span className="font-mono text-[#111] select-all">{result.wallet}</span>
                    </div>
                    <div className="flex justify-between flex-wrap">
                      <span className="text-[#888]">Mint Schedule:</span>
                      <span className="text-[#111]">21 September 2026</span>
                    </div>
                    <div className="flex justify-between flex-wrap">
                      <span className="text-[#888]">Collection Supply:</span>
                      <span className="text-[#111]">4,444 Rare People</span>
                    </div>
                    <div className="flex justify-between flex-wrap">
                      <span className="text-[#888]">Chain:</span>
                      <span className="text-[#111]">Robinhood Chain (EVM)</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#111] flex items-center justify-between text-[11px] text-[#666]">
                    <span>Spot confirmed for priority drop phase.</span>
                    <span className="text-[#111] font-bold">[ 1 MINT RESERVED ]</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-amber-800 pb-2 border-b border-[#111]">
                    <span className="w-3 h-3 bg-[#111]" />
                    <span className="font-['Silkscreen'] text-[13px] text-[#111]">STATUS: NOT YET REGISTERED</span>
                  </div>

                  <p className="pt-2 font-['Archivo'] text-[13px] text-[#555]">
                    The address <code className="text-[#111]">{result.wallet}</code> is not currently on the priority whitelist. Registration is currently open!
                  </p>

                  <div className="mt-3 pt-2">
                    <button
                      type="button"
                      onClick={openWhitelist}
                      className="rf-btn bg-[#ccff00] hover:bg-[#bbf000] text-[#111] text-[12px] font-medium"
                    >
                      [ register this address now ]
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
