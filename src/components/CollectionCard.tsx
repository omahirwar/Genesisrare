import { useRef, useState, type PointerEvent, type Key } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';
import type { Nft } from '../data/nfts';
import { fadeUp } from '../lib/motion';
import RarityTag from './ui/RarityTag';
import { Particles } from './ui/PixelBits';

// controlled soft backdrops so the grid has rhythm without noise
const TINTS = ['#dbe3f6', '#e8f1c9', '#f4e6d3', '#e4d9c2', '#e9e2f0', '#dcece2'];

export default function CollectionCard({ nft, index }: { nft: Nft; index: number; key?: Key }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  const rxV = useMotionValue(0);
  const ryV = useMotionValue(0);
  const rotateX = useSpring(rxV, { stiffness: 260, damping: 20 });
  const rotateY = useSpring(ryV, { stiffness: 260, damping: 20 });

  const onMove = (e: PointerEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rxV.set(-py * 9);
    ryV.set(px * 11);
  };
  const onLeave = () => {
    rxV.set(0);
    ryV.set(0);
    setHover(false);
  };

  return (
    <motion.div variants={fadeUp} className="[perspective:800px]">
      <motion.article
        ref={ref}
        onPointerMove={onMove}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={onLeave}
        className="sticker rounded-panel relative bg-paper p-3"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileHover={reduced ? undefined : { y: -4, boxShadow: '7px 8px 0 var(--color-ink)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <div className="relative">
          <Particles show={hover && !reduced} />
          <div
            className="rounded-chip relative overflow-hidden"
            style={{ background: TINTS[index % TINTS.length], border: '2px solid var(--color-ink)' }}
          >
            <img
              src={nft.image}
              alt={`Rare Person ${nft.id} — ${nft.short}`}
              loading="lazy"
              className="pixelated block aspect-square w-full"
              style={{ imageRendering: 'pixelated' }}
            />
            <span
              className="absolute left-2 top-2 rounded-chip bg-paper px-2 py-0.5 font-display text-[10px] text-ink"
              style={{ border: '2px solid var(--color-ink)' }}
            >
              #{nft.id}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-3">
          <h3 className="font-display text-[15px] leading-none text-ink">{nft.short}</h3>
          <RarityTag rarity={nft.rarity} />
        </div>
      </motion.article>
    </motion.div>
  );
}
