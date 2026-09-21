import { useWhitelist } from './whitelist-context';
import { useWeb3 } from '../lib/web3';
import { IS_CHECKER_PAUSED } from '../lib/config';
import RareMark from './RareMark';

export default function FinalCTA() {
  const { open, openChecker } = useWhitelist();
  const { isConnected, openConnectModal } = useWeb3();

  return (
    <section className="py-12 sm:py-16 bg-[#eeeeee] border-t border-[#111]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div
          className="border border-[#111] p-8 sm:p-14 text-center relative"
          style={{ backgroundImage: 'var(--dither-25)' }}
        >
          <div className="bg-[#eeeeee] border-2 border-[#111] shadow-[6px_6px_0_0_#111] p-6 sm:p-10 max-w-[680px] mx-auto space-y-4">
            <div className="flex justify-center">
              <RareMark size={32} />
            </div>

            <h2 className="font-['Silkscreen'] text-[20px] sm:text-[28px] text-[#111] leading-tight">
              JOIN RARE PEOPLE ON ROBINHOOD
            </h2>

            <p className="font-['Archivo'] text-[15px] text-[#444] leading-relaxed max-w-[48ch] mx-auto">
              4,444 sovereign pixel characters. Built natively for Robinhood EVM chain. Mint drops <strong>21 September 2026</strong>.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://x.com/RarePeoplesNFT"
                target="_blank"
                rel="noopener noreferrer"
                className="rf-btn bg-[#111] hover:bg-[#222] text-[#fff] text-[13px] py-2.5 px-5 font-medium inline-flex items-center gap-1.5"
              >
                <span className="font-bold">𝕏</span>
                <span>Follow @RarePeoplesNFT</span>
              </a>

              <button
                type="button"
                onClick={open}
                className="rf-btn bg-[#ccff00] hover:bg-[#bbf000] text-[#111] text-[13px] py-2.5 px-5 font-medium"
              >
                [ join whitelist ]
              </button>

              <button
                type="button"
                onClick={openChecker}
                className="rf-btn text-[13px] py-2.5 px-5 bg-[#eeeeee] hover:bg-[#e4e4e4]"
              >
                {IS_CHECKER_PAUSED ? '[ check wl spot (paused) ]' : '[ check wl spot ]'}
              </button>

              {!isConnected && (
                <button
                  type="button"
                  onClick={openConnectModal}
                  className="rf-btn rf-btn-dark text-[13px] py-2.5 px-5"
                >
                  [ connect wallet ]
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
