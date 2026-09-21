import type { Variants } from 'motion/react';

/* Shared motion language — one vocabulary used across the whole site. */

// Easing curves (no linear/robotic motion anywhere).
export const EASE_OUT = [0.16, 1, 0.3, 1] as const; // expressive ease-out
export const EASE_ARCADE = [0.2, 0.8, 0.2, 1] as const; // snappy UI

// Springs
export const springSoft = { type: 'spring', stiffness: 120, damping: 18, mass: 0.9 } as const;
export const springPop = { type: 'spring', stiffness: 420, damping: 26, mass: 0.7 } as const;
export const springSlow = { type: 'spring', stiffness: 60, damping: 20, mass: 1 } as const;

// Reveal on load / scroll — a restrained fade + rise.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};

// Clip reveal for oversized display type.
export const clipReveal: Variants = {
  hidden: { opacity: 0, y: '18%', clipPath: 'inset(0 0 100% 0)' },
  show: {
    opacity: 1,
    y: '0%',
    clipPath: 'inset(0 0 0% 0)',
    transition: { duration: 0.85, ease: EASE_OUT },
  },
};

// Stagger container.
export const stagger = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

// Spring-in for the character / large art.
export const springInUp: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.92 },
  show: { opacity: 1, y: 0, scale: 1, transition: { ...springSoft, delay: 0.1 } },
};
