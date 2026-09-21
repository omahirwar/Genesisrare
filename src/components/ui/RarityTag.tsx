import { RARITY, type Rarity } from '../../data/nfts';

export default function RarityTag({ rarity, className = '' }: { rarity: Rarity; className?: string }) {
  const c = RARITY[rarity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1 font-display text-[10px] leading-none ${className}`}
      style={{ background: c.bg, color: c.fg, border: '2px solid var(--color-ink)' }}
    >
      <span
        className="inline-block h-1.5 w-1.5"
        style={{ background: c.fg, opacity: 0.9 }}
        aria-hidden
      />
      {rarity}
    </span>
  );
}
