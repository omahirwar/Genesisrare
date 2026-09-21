import RareMark from './RareMark';

const SYSTEM_SPECS = [
  { label: 'NFT standard', value: 'ERC-721 / Robinhood EVM' },
  { label: 'Total supply', value: '4,444 Rare People (Fixed)' },
  { label: 'Mint mechanism', value: 'Guaranteed Whitelist / Fair Drop' },
  { label: 'Mint date', value: '21 September 2026' },
  { label: 'Network gas', value: '< $0.001 per transaction' },
  { label: 'Whitelist quota', value: 'Guaranteed Priority Access' },
];

export default function About() {
  return (
    <section id="about" className="py-12 sm:py-16 bg-[#eeeeee] border-t border-[#111]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#111]">
          <div className="space-y-1">
            <div className="rf-label">robinhood chain · architecture</div>
            <h2 className="font-['Silkscreen'] text-[22px] sm:text-[28px] text-[#111]">
              ABOUT RARE PEOPLE
            </h2>
          </div>
          <div className="rf-signal-tag">
            4,444 fixed supply
          </div>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Explanatory Copy */}
          <div className="lg:col-span-7 space-y-4 font-['Archivo'] text-[15px] text-[#333] leading-relaxed">
            <p>
              <strong>Rare People</strong> is a fair-launch digital collectible experiment engineered specifically for the <strong>Robinhood EVM Chain</strong>. Handcrafted with crisp 1-bit and retro color palettes, each character represents an immutable sovereign identity on-chain.
            </p>
            <p>
              Unlike legacy NFT releases that suffer from gas wars and unfair front-running bots, Rare People utilizes a guaranteed priority whitelist allocation model. Whitelisted participants receive guaranteed first-access priority when the drop goes live on <strong>21 September 2026</strong>.
            </p>
            <p>
              Every attribute, pixel palette, and trait hash is stored with on-chain permanence, providing true provenance with zero dependencies on third-party centralized servers.
            </p>

            <div className="pt-4 flex flex-wrap gap-2">
              <span className="rf-btn text-[11px] py-1 px-2.5 bg-[#eeeeee] cursor-default">
                [ fair allocation ]
              </span>
              <span className="rf-btn text-[11px] py-1 px-2.5 bg-[#eeeeee] cursor-default">
                [ zero gas wars ]
              </span>
              <span className="rf-btn text-[11px] py-1 px-2.5 bg-[#eeeeee] cursor-default">
                [ 100% on-chain ]
              </span>
              <span className="rf-btn text-[11px] py-1 px-2.5 bg-[#ccff00] text-[#111] font-medium cursor-default">
                [ mint 21 sep ]
              </span>
            </div>
          </div>

          {/* Right: Technical Spec Matrix Box */}
          <div className="lg:col-span-5 border border-[#111] bg-[#eeeeee]">
            <div className="px-4 py-2.5 border-b border-[#111] flex items-center justify-between bg-[#e6e6e6]">
              <div className="flex items-center gap-2">
                <RareMark size={18} />
                <span className="font-['Silkscreen'] text-[12px] text-[#111]">SYSTEM SPECIFICATION</span>
              </div>
              <span className="font-['Sometype_Mono'] text-[11px] text-[#666]">v1.0.4</span>
            </div>

            <div className="divide-y divide-[#111] font-['Sometype_Mono'] text-[12px]">
              {SYSTEM_SPECS.map((spec) => (
                <div key={spec.label} className="flex justify-between px-4 py-2.5 hover:bg-[#eaeaea] transition-colors">
                  <span className="text-[#777]">{spec.label}</span>
                  <span className="text-[#111] font-medium text-right">{spec.value}</span>
                </div>
              ))}
            </div>

            <div
              className="p-4 border-t border-[#111] flex items-center justify-between"
              style={{ backgroundImage: 'var(--dither-12)' }}
            >
              <div className="bg-[#eeeeee] p-2 border border-[#111] text-[11px] font-['Sometype_Mono'] w-full flex justify-between">
                <span>Network Status:</span>
                <span className="text-green-700 font-bold">Robinhood Mainnet Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
