import { useEffect, useRef, type PointerEvent } from 'react';
import { useMotionValue, useSpring, useReducedMotion, type MotionValue } from 'motion/react';
import { springPop } from './motion';

/**
 * Global pointer position, normalized to [-1, 1] from viewport center,
 * spring-smoothed. Disabled for reduced-motion and coarse (touch) pointers.
 * One instance is shared so decorative layers can move at different speeds.
 */
export function usePointer(): { x: MotionValue<number>; y: MotionValue<number>; enabled: boolean } {
  const reduced = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 80, damping: 20, mass: 0.6 });
  const y = useSpring(rawY, { stiffness: 80, damping: 20, mass: 0.6 });
  const enabled = !reduced;

  useEffect(() => {
    if (reduced) return;
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth) * 2 - 1);
      rawY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced, rawX, rawY]);

  return { x, y, enabled };
}

/**
 * Magnetic hover: element drifts toward the cursor while hovered, springs back on leave.
 * Returns a ref, spring motion values, and pointer handlers to spread onto a motion element.
 */
export function useMagnetic(strength = 0.3) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, springPop);
  const sy = useSpring(y, springPop);

  const onPointerMove = (e: PointerEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { ref, x: sx, y: sy, onPointerMove, onPointerLeave };
}
