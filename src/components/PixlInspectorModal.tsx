import { useEffect, type Key } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import type { Nft } from '../data/nfts';
import { RARITY } from '../data/nfts';
import { springPop } from '../lib/motion';
import { useWhitelist } from './whitelist-context';
import PixelButton from './ui/PixelButton';

interface PixlInspectorModalProps {
  nft: Nft | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  key?: Key;
}

export default function PixlInspectorModal({
  nft,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: PixlInspectorModalProps) {
  const { open: openWhitelist } = useWhitelist();

  useEffect(() => {
    if (!nft) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext && hasNext) onNext();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [nft, onClose, onPrev, onNext, hasPrev, hasNext]);

  if (!nft) return null;

  const rStyle = RARITY[nft.rarity];

  return (
    <motion.div
      className="fixed inset-0 z-[110] grid place-items-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <button
        aria-label="Close inspector"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ background: 'rgba(23,20,11,0.65)' }}
      />

      {/* Modal Dialog */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspector-title"
        className="sticker-lg rounded-art relative z-10 w-full max-w-[540px] bg-paper p-6 sm:p-8"
        initial={{ opacity: 0, y: 25, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: springPop }}
        exit={{ opacity: 0, y: 15, scale: 0.96, transition: { duration: 0.16 } }}
      >
        {/* Top Header Tag */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="rounded-chip px-2.5 py-1 font-display text-[11px] text-ink"
              style={{
                background: 'var(--color-lime)',
                border: '2px solid var(--color-ink)',
                boxShadow: '2px 2px 0 var(--color-ink)',
              }}
            >
              RARE PERSON #{nft.id}
            </span>
            <span
              className="rounded-chip px-2.5 py-1 font-display text-[11px]"
              style={{
                background: rStyle.bg,
                color: rStyle.fg,
                border: '2px solid var(--color-ink)',
              }}
            >
              {nft.rarity}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-chip font-display text-ink transition-transform hover:scale-110 active:scale-95"
            style={{ border: '2px solid var(--color-ink)', background: 'var(--color-cream-2)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Center Presentation: Enlarged Pixel View & Title */}
        <div className="mt-5 grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
          {/* Magnified Pixel Artwork */}
          <div
            className="rounded-panel relative aspect-square overflow-hidden p-3"
            style={{
              background: 'var(--color-cream-2)',
              border: '3px solid var(--color-ink)',
              boxShadow: '4px 4px 0 var(--color-ink)',
            }}
          >
            <img
              src={nft.image}
              alt={nft.name}
              className="pixelated h-full w-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
            <span
              className="absolute bottom-2 left-2 rounded-chip bg-paper px-2 py-0.5 font-display text-[9px] text-ink"
              style={{ border: '1.5px solid var(--color-ink)' }}
            >
              32×32 SPRITE
            </span>
          </div>

          {/* Details & Specs */}
          <div>
            <h3
              id="inspector-title"
              className="font-display text-ink"
              style={{ fontSize: 'clamp(1.4rem,4vw,1.8rem)', lineHeight: 1.1 }}
            >
              {nft.short}
            </h3>
            <p className="mt-1 font-sans text-[13px] text-ink-soft">
              Part of the 4,444 Rare People collection on Robinhood. Mint: 21 Sep.
            </p>

            {/* Navigation Buttons between Micro Pixls */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="sticker flex flex-1 items-center justify-center gap-1 rounded-chip bg-paper py-2 font-display text-[12px] text-ink disabled:opacity-40"
              >
                ← PREV
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="sticker flex flex-1 items-center justify-center gap-1 rounded-chip bg-paper py-2 font-display text-[12px] text-ink disabled:opacity-40"
              >
                NEXT →
              </button>
            </div>
          </div>
        </div>

        {/* Traits Breakdown Grid */}
        <div className="mt-5">
          <div className="font-display text-[11px] text-ink-soft">PROPERTIES & TRAITS</div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(nft.traits).map(([key, value]) => (
              <div
                key={key}
                className="rounded-chip p-2.5 text-left"
                style={{
                  background: 'var(--color-cream)',
                  border: '2px solid var(--color-ink)',
                }}
              >
                <div className="font-display text-[9px] uppercase tracking-wider text-ink-soft">
                  {key}
                </div>
                <div className="mt-0.5 font-sans text-[12px] font-bold text-ink truncate">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <PixelButton
            variant="primary"
            size="md"
            onClick={() => {
              onClose();
              openWhitelist();
            }}
          >
            WHITELIST FOR 21 SEP
          </PixelButton>

          <PixelButton variant="ghost" size="sm" onClick={onClose}>
            BACK TO GRID
          </PixelButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
