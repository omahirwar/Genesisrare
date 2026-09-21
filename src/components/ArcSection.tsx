import RareMark from './RareMark';
import { Zap, ShieldCheck, Layers } from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    k: 'ZERO FRICTION GAS',
    v: 'Sub-cent transaction fees for minting and transferring your Rare Person avatar.',
  },
  {
    icon: ShieldCheck,
    k: 'INSTANT FINALITY',
    v: 'Instant block confirmations on Robinhood EVM architecture with instant NFT mint settlement.',
  },
  {
    icon: Layers,
    k: 'ON-CHAIN IDENTITY',
    v: 'Permanent sovereign Web3 persona tied directly to your Robinhood EVM address.',
  },
];

export default function ArcSection() {
  return (
    <section id="chain" className="py-12 sm:py-16 bg-[#eeeeee] border-t border-[#111]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#111]">
          <div className="space-y-1">
            <div className="rf-label">infrastructure · l2 evm</div>
            <h2 className="font-['Silkscreen'] text-[22px] sm:text-[28px] text-[#111]">
              POWERED BY ROBINHOOD CHAIN
            </h2>
          </div>
          <div className="font-['Sometype_Mono'] text-[12px] text-[#666]">
            Chain ID: 10101 · EVM Compatible
          </div>
        </div>

        {/* 3-Column Box Matrix */}
        <div className="border border-[#111] bg-[#eeeeee] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#111]">
          {FEATURES.map((f, i) => (
            <div key={f.k} className="p-6 space-y-3 bg-[#eeeeee]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#ccff00] border border-[#111]" />
                <h3 className="font-['Silkscreen'] text-[14px] sm:text-[15px] text-[#111]">
                  {f.k}
                </h3>
              </div>
              <p className="font-['Archivo'] text-[14px] text-[#444] leading-relaxed">
                {f.v}
              </p>
              <div className="pt-2 font-['Sometype_Mono'] text-[11px] text-[#888]">
                [ 0{i + 1} // PROTOCOL SPEC ]
              </div>
            </div>
          ))}
        </div>

        {/* Network Details Banner */}
        <div
          className="border border-[#111] p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ backgroundImage: 'var(--dither-12)' }}
        >
          <div className="bg-[#eeeeee] p-3 border border-[#111] flex items-center gap-3">
            <RareMark size={24} />
            <div>
              <div className="font-['Silkscreen'] text-[13px] text-[#111]">ROBINHOOD NETWORK DEPLOYMENT</div>
              <div className="font-['Sometype_Mono'] text-[11px] text-[#666]">Mint drops 21 September 2026 · 4,444 Supply</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rf-signal-tag">
              network live
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
