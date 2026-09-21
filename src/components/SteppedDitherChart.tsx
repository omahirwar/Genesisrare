import { useState } from 'react';
import RareMark from './RareMark';

interface TraitSample {
  id: string;
  name: string;
  tier: string;
  type: string;
  head: string;
  eyes: string;
  accent: string;
  rarityRank: number;
}

const SAMPLE_AVATARS: TraitSample[] = [
  {
    id: '#0001',
    name: 'Genesis Rebel',
    tier: 'Mythic 1/1',
    type: 'Sovereign Cyborg',
    head: 'Robinhood Lime Beanie',
    eyes: 'Laser Visor (1-bit)',
    accent: 'Gold Arc Pendant',
    rarityRank: 1,
  },
  {
    id: '#0042',
    name: 'Arc Punk',
    tier: 'Legendary',
    type: 'Pixel Human',
    head: 'Dark Cyber Hoodie',
    eyes: '3D Anaglyph Shades',
    accent: 'Signal Wire',
    rarityRank: 42,
  },
  {
    id: '#0444',
    name: 'Robinhood Scout',
    tier: 'Epic',
    type: 'Nomad',
    head: 'Pixel Balaclava',
    eyes: 'Amber Monocle',
    accent: 'Terminal Badge',
    rarityRank: 188,
  },
  {
    id: '#4444',
    name: 'Last Citizen',
    tier: 'Rare',
    type: 'Cyber Druid',
    head: 'Glitch Halo',
    eyes: 'Retro CRT Glow',
    accent: 'Arc Mark Tattoo',
    rarityRank: 444,
  },
];

export default function SteppedDitherChart() {
  const [activeTab, setActiveTab] = useState<'curve' | 'traits'>('curve');
  const [selectedAvatar, setSelectedAvatar] = useState<TraitSample>(SAMPLE_AVATARS[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: string } | null>(null);

  // Stepped polygon curve points representing on-chain NFT Rarity Tier Distribution
  const stairsPath =
    'M 0 190 L 25 190 L 25 160 L 50 160 L 50 138 L 85 138 L 85 120 L 140 120 L 140 105 L 210 105 L 210 94 L 320 94 L 320 86 L 440 86 L 440 78 L 530 78 L 530 74 L 590 74 L 590 70';
  const fillPath = `${stairsPath} L 590 200 L 0 200 Z`;

  return (
    <div className="rf-box bg-[#eeeeee] flex flex-col">
      {/* Box Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#111] bg-[#eeeeee]">
        <div className="flex items-center gap-2">
          <RareMark size={20} />
          <span className="font-['Silkscreen'] text-[13px] tracking-wide text-[#111]">
            RARE PEOPLE // NFT SPECIFICATION
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-[#111] bg-[#fff] p-0.5 text-[11px] font-['Sometype_Mono']">
            <button
              type="button"
              onClick={() => setActiveTab('curve')}
              className={`px-2 py-0.5 cursor-pointer transition-colors ${
                activeTab === 'curve' ? 'bg-[#111] text-[#fff]' : 'text-[#555] hover:text-[#111]'
              }`}
            >
              rarity curve
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('traits')}
              className={`px-2 py-0.5 cursor-pointer transition-colors ${
                activeTab === 'traits' ? 'bg-[#111] text-[#fff]' : 'text-[#555] hover:text-[#111]'
              }`}
            >
              trait preview
            </button>
          </div>
          <span className="rf-signal-tag hidden sm:inline-block">mint: 21 sep</span>
        </div>
      </div>

      {activeTab === 'curve' ? (
        /* Chart Canvas Area */
        <div className="relative w-full h-[230px] sm:h-[270px] overflow-hidden select-none bg-[#eeeeee]">
          {/* Dotted horizontal grid lines */}
          <div
            className="absolute inset-x-0 top-[28%] h-[1px]"
            style={{
              backgroundImage: 'linear-gradient(to right, #111 50%, transparent 50%)',
              backgroundSize: '8px 1px',
              opacity: 0.35,
            }}
          />
          <div
            className="absolute inset-x-0 top-[60%] h-[1px]"
            style={{
              backgroundImage: 'linear-gradient(to right, #111 50%, transparent 50%)',
              backgroundSize: '8px 1px',
              opacity: 0.2,
            }}
          />

          {/* SVG Stepped Curve with Authentic 2x2 Dither fill */}
          <svg
            viewBox="0 0 600 200"
            preserveAspectRatio="none"
            className="w-full h-full block"
            shapeRendering="crispEdges"
          >
            <defs>
              <pattern id="chartDitherNFT" width="2" height="2" patternUnits="userSpaceOnUse">
                <rect width="1" height="1" fill="#111111" />
              </pattern>
            </defs>

            {/* Dither filled polygon under staircase curve */}
            <path d={fillPath} fill="url(#chartDitherNFT)" opacity="0.32" />

            {/* Solid staircase border */}
            <path
              d={stairsPath}
              fill="none"
              stroke="#111111"
              strokeWidth="2"
              shapeRendering="crispEdges"
            />

            {/* Terminal pixel square marker */}
            <rect x="586" y="66" width="8" height="8" fill="#111111" />
          </svg>

          {/* Static on-chart tier labels */}
          <div className="absolute left-3 bottom-3 font-['Sometype_Mono'] text-[10px] text-[#777] flex items-center gap-3">
            <span>◄ COMMON (55%)</span>
            <span>·</span>
            <span>RARE (27%)</span>
            <span>·</span>
            <span>EPIC (13%)</span>
            <span>·</span>
            <span className="text-[#111] font-bold">MYTHIC 1/1 (1.1%) ►</span>
          </div>

          {/* Live Hover Tracker / Tooltip */}
          <div
            className="absolute inset-0 cursor-crosshair"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const tokenNumber = Math.max(1, Math.round(pct * 4444));
              let tier = 'Common (1-Bit)';
              if (tokenNumber > 2444 && tokenNumber <= 3644) tier = 'Rare (Cyan/Amber)';
              else if (tokenNumber > 3644 && tokenNumber <= 4244) tier = 'Epic (Cyber Visors)';
              else if (tokenNumber > 4244 && tokenNumber <= 4394) tier = 'Legendary (Mythic Gear)';
              else if (tokenNumber > 4394) tier = 'Ultra 1/1 Sovereign';

              setHoveredPoint({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                val: `NFT #${tokenNumber.toString().padStart(4, '0')} // ${tier}`,
              });
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          />

          {hoveredPoint && (
            <div
              className="pointer-events-none absolute z-20 bg-[#111] text-[#eee] px-2.5 py-1 font-['Sometype_Mono'] text-[11px] shadow-[2px_2px_0_#fff]"
              style={{
                left: Math.min(hoveredPoint.x + 10, 360),
                top: Math.max(10, hoveredPoint.y - 30),
              }}
            >
              {hoveredPoint.val}
            </div>
          )}
        </div>
      ) : (
        /* Trait Inspector Panel */
        <div className="p-4 sm:p-5 bg-[#eeeeee] space-y-4">
          <div className="flex flex-wrap gap-2 pb-2 border-b border-[#111]">
            {SAMPLE_AVATARS.map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => setSelectedAvatar(av)}
                className={`px-2.5 py-1 text-[12px] font-['Sometype_Mono'] border border-[#111] transition-colors cursor-pointer ${
                  selectedAvatar.id === av.id
                    ? 'bg-[#111] text-[#fff]'
                    : 'bg-[#fff] text-[#111] hover:bg-[#e4e4e4]'
                }`}
              >
                {av.id} {av.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-['Sometype_Mono'] text-[12px]">
            <div className="p-3 bg-[#fff] border border-[#111] space-y-1">
              <div className="text-[10px] text-[#888]">RARITY RANK</div>
              <div className="font-['Silkscreen'] text-[16px] text-[#111]">#{selectedAvatar.rarityRank} / 4,444</div>
              <div className="text-[11px] text-green-700 font-bold">{selectedAvatar.tier}</div>
            </div>

            <div className="p-3 bg-[#fff] border border-[#111] space-y-1">
              <div className="text-[10px] text-[#888]">AVATAR ARCHETYPE</div>
              <div className="font-['Silkscreen'] text-[14px] text-[#111]">{selectedAvatar.type}</div>
              <div className="text-[11px] text-[#666]">100% On-Chain Layer</div>
            </div>
          </div>

          <div className="border border-[#111] bg-[#fff] divide-y divide-[#eee] font-['Sometype_Mono'] text-[11px]">
            <div className="p-2 flex justify-between">
              <span className="text-[#888]">Headwear:</span>
              <span className="text-[#111] font-medium">{selectedAvatar.head}</span>
            </div>
            <div className="p-2 flex justify-between">
              <span className="text-[#888]">Eyewear:</span>
              <span className="text-[#111] font-medium">{selectedAvatar.eyes}</span>
            </div>
            <div className="p-2 flex justify-between">
              <span className="text-[#888]">Accessory:</span>
              <span className="text-[#111] font-medium">{selectedAvatar.accent}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Smart Contract Specifications Toggle */}
      <div className="border-t border-[#111] bg-[#eeeeee]">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="w-full text-left px-4 py-2 font-['Sometype_Mono'] text-[12px] text-[#111] hover:bg-[#e4e4e4] transition-colors flex items-center gap-1.5 cursor-pointer select-none"
        >
          <span className="text-[10px]">{showSettings ? '▼' : '►'}</span>
          <span>smart contract & nft specifications</span>
        </button>

        {showSettings && (
          <div className="p-4 border-t border-[#111] bg-[#f4f4f4] font-['Sometype_Mono'] text-[12px] text-[#444] space-y-2">
            <div className="flex justify-between flex-wrap">
              <span className="text-[#888]">Token Standard:</span>
              <span className="text-[#111]">ERC-721 (Non-Fungible Token)</span>
            </div>
            <div className="flex justify-between flex-wrap">
              <span className="text-[#888]">Network:</span>
              <span className="text-[#111]">Robinhood EVM (Chain ID 10101)</span>
            </div>
            <div className="flex justify-between flex-wrap">
              <span className="text-[#888]">Total Collection Supply:</span>
              <span className="text-[#111]">4,444 Unique Avatars (Immutable)</span>
            </div>
            <div className="flex justify-between flex-wrap">
              <span className="text-[#888]">Mint Price:</span>
              <span className="text-[#111]">0.00 ETH (Free Fair Mint)</span>
            </div>
            <div className="flex justify-between flex-wrap">
              <span className="text-[#888]">Contract Address:</span>
              <span className="text-[#111] font-mono select-all">[ coming soon ]</span>
            </div>
            <div className="flex justify-between flex-wrap">
              <span className="text-[#888]">Metadata Storage:</span>
              <span className="text-[#111]">100% On-Chain Trait Hashes</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
