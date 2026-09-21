import { useState, type Key } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Nft } from '../data/nfts';
import { RARITY } from '../data/nfts';

interface MicroPixlCardProps {
  nft: Nft;
  index: number;
  isSelected?: boolean;
  onClick?: () => void;
  onHover?: (nft: Nft | null) => void;
  key?: Key;
}

const TINTS = [
  '#dbe3f6', // blue soft
  '#e8f1c9', // lime soft
  '#f4e6d3', // sand soft
  '#e4d9c2', // cream-2
  '#e9e2f0', // purple soft
  '#dcece2', // mint soft
  '#ffe8df', // coral soft
  '#fef2cf', // amber soft
];

export default function MicroPixlCard({
  nft,
  index,
  isSelected,
  onClick,
  onHover,
}: MicroPixlCardProps) {
  const reduced = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const rarityConfig = RARITY[nft.rarity];
  const bgTint = TINTS[index % TINTS.length];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onPointerEnter={() => {
        setIsHovered(true);
        onHover?.(nft);
      }}
      onPointerLeave={() => {
        setIsHovered(false);
        onHover?.(null);
      }}
      onFocus={() => onHover?.(nft)}
      onBlur={() => onHover?.(null)}
      className={`group relative w-full cursor-pointer text-left transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
        isSelected ? 'z-20' : 'z-0 hover:z-20'
      }`}
      whileHover={reduced ? undefined : { y: -4, scale: 1.05 }}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
    >
      <div
        className={`relative flex flex-col rounded-lg sm:rounded-xl p-1 sm:p-1.5 transition-colors ${
          isSelected
            ? 'ring-2 ring-ink bg-paper shadow-[3px_3px_0_var(--color-ink)]'
            : 'bg-paper shadow-[2px_2px_0_var(--color-ink)] hover:shadow-[4px_4px_0_var(--color-ink)]'
        }`}
        style={{
          border: '2px solid var(--color-ink)',
        }}
      >
        {/* Micro Image Container */}
        <div
          className="relative aspect-square w-full overflow-hidden rounded-md sm:rounded-lg"
          style={{
            background: bgTint,
            border: '1.5px solid var(--color-ink)',
          }}
        >
          <img
            src={nft.image}
            alt={nft.name}
            loading="lazy"
            className="pixelated block h-full w-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Micro ID Badge */}
          <span
            className="absolute left-1 top-1 rounded bg-paper/95 px-1 py-0.2 font-display text-[8px] sm:text-[9px] font-bold text-ink leading-tight shadow-sm"
            style={{ border: '1px solid var(--color-ink)' }}
          >
            #{nft.id}
          </span>

          {/* Micro Rarity Dot / Indicator */}
          <span
            title={nft.rarity}
            className="absolute right-1 top-1 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shadow-xs"
            style={{
              backgroundColor: rarityConfig.bg,
              border: '1px solid var(--color-ink)',
            }}
          />
        </div>

        {/* Micro Title Label */}
        <div className="mt-1 flex items-center justify-between gap-1 px-0.5">
          <span className="font-display text-[9px] sm:text-[10px] font-bold leading-tight text-ink truncate">
            {nft.short}
          </span>
          <span
            className="hidden sm:inline-block text-[8px] font-bold uppercase tracking-tight px-1 py-0.2 rounded"
            style={{
              backgroundColor: rarityConfig.bg,
              color: rarityConfig.fg,
              border: '1px solid var(--color-ink)',
              fontSize: '7px',
              lineHeight: '10px',
            }}
          >
            {nft.rarity[0]}
          </span>
        </div>

        {/* Hover Micro Sparkle / Tooltip */}
        {isHovered && !reduced && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-chip bg-ink px-2 py-0.5 font-display text-[9px] text-paper shadow-md z-30"
          >
            Click to inspect
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
