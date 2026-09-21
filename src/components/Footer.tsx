import RareMark from './RareMark';
import { useWhitelist } from './whitelist-context';

export default function Footer() {
  const { openChecker } = useWhitelist();

  return (
    <footer className="w-full bg-[#eeeeee] border-t border-[#111] py-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Pixel Icon & Title */}
        <div className="flex items-center gap-2.5">
          <RareMark size={22} />
          <span className="font-['Silkscreen'] text-[14px] sm:text-[15px] text-[#111] tracking-tight">
            RARE PEOPLE
          </span>
          <span className="text-[#888]">·</span>
          <span className="font-['Sometype_Mono'] text-[11px] text-[#666]">
            4,444 on Robinhood EVM
          </span>
        </div>

        {/* Right: Links */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[12px] font-['Sometype_Mono'] text-[#555]">
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
          <a
            href="https://explorer.robinhood.com/address/0x7225bD38dCbf678F1196FD0590101C4dd7A0e2CB"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#111] hover:underline inline-flex items-center gap-1 font-mono text-[11px] text-[#111]"
            title="0x7225bD38dCbf678F1196FD0590101C4dd7A0e2CB"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Contract: 0x7225...e2CB</span>
          </a>
          <span>·</span>
          <a href="#about" className="hover:text-[#111] hover:underline">
            About
          </a>
          <span>·</span>
          <a href="#chain" className="hover:text-[#111] hover:underline">
            Robinhood Chain
          </a>
          <span>·</span>
          <button
            type="button"
            onClick={openChecker}
            className="hover:text-[#111] hover:underline cursor-pointer"
          >
            WL Checker
          </button>
          <span>·</span>
          <a href="/mint" className="hover:text-[#111] hover:underline">
            Mint
          </a>
          <span>·</span>
          <a href="#faq" className="hover:text-[#111] hover:underline">
            FAQ
          </a>
        </div>
      </div>
    </footer>
  );
}
