import { motion, AnimatePresence, useTransform, useMotionValue, type MotionValue } from 'motion/react';
import { useMemo, type Key } from 'react';

/* ---------- Floating decorative pixels (parallax at different depths) ---------- */

export interface BitSpec {
  top: string;
  left: string;
  size: number;
  color: string;
  depth: number; // parallax px range — bigger = "closer" / faster
  rotate?: number;
  shape?: 'square' | 'plus';
  delay?: number;
}

function Bit({ spec, px, py, reduced }: { spec: BitSpec; px: MotionValue<number>; py: MotionValue<number>; reduced: boolean; key?: Key }) {
  const x = useTransform(px, [-1, 1], [spec.depth, -spec.depth]);
  const y = useTransform(py, [-1, 1], [spec.depth * 0.72, -spec.depth * 0.72]);
  const s = spec.size;

  return (
    <motion.div
      className="absolute"
      style={{ top: spec.top, left: spec.left, x: reduced ? 0 : x, y: reduced ? 0 : y }}
      aria-hidden
    >
      <motion.div
        animate={reduced ? undefined : { y: [0, -7, 0], rotate: [spec.rotate ?? 0, (spec.rotate ?? 0) + 6, spec.rotate ?? 0] }}
        transition={{ duration: 4 + (spec.delay ?? 0), repeat: Infinity, ease: 'easeInOut', delay: spec.delay ?? 0 }}
        style={{ rotate: spec.rotate ?? 0 }}
      >
        {spec.shape === 'plus' ? (
          <svg width={s} height={s} viewBox="0 0 6 6" shapeRendering="crispEdges">
            <rect x="2" y="0" width="2" height="6" fill={spec.color} stroke="var(--color-ink)" strokeWidth="0.5" />
            <rect x="0" y="2" width="6" height="2" fill={spec.color} stroke="var(--color-ink)" strokeWidth="0.5" />
          </svg>
        ) : (
          <div style={{ width: s, height: s, background: spec.color, border: '2px solid var(--color-ink)' }} />
        )}
      </motion.div>
    </motion.div>
  );
}

export function FloatingBits({
  items,
  pointer,
  reduced = false,
  className = '',
}: {
  items: BitSpec[];
  pointer?: { x: MotionValue<number>; y: MotionValue<number> };
  reduced?: boolean;
  className?: string;
}) {
  const zx = useMotionValue(0);
  const zy = useMotionValue(0);
  const px = pointer?.x ?? zx;
  const py = pointer?.y ?? zy;
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {items.map((spec, i) => (
        <Bit key={i} spec={spec} px={px} py={py} reduced={reduced} />
      ))}
    </div>
  );
}

/* ---------- Particle burst (card hover) ---------- */

const PARTICLE_COLORS = ['var(--color-lime)', 'var(--color-amber)', 'var(--color-blue)', 'var(--color-coral)'];

export function Particles({ show }: { show: boolean }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 30 + Math.random() * 26;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 10,
          size: 4 + Math.round(Math.random() * 4),
          color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        };
      }),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-visible" aria-hidden>
      <AnimatePresence>
        {show &&
          bits.map((b, i) => (
            <motion.span
              key={i}
              className="absolute"
              style={{ width: b.size, height: b.size, background: b.color, border: '1.5px solid var(--color-ink)' }}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], x: b.x, y: b.y, scale: [0, 1, 0.5], rotate: 90 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.62, ease: 'easeOut', delay: i * 0.02 }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}
