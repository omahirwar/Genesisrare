import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { useMagnetic } from '../../lib/hooks';
import { EASE_ARCADE } from '../../lib/motion';

type Variant = 'primary' | 'dark' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  variant?: Variant;
  size?: Size;
  pill?: boolean;
  magnetic?: boolean;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  ariaLabel?: string;
}

const VARIANTS: Record<Variant, { bg: string; fg: string; shadow: string }> = {
  primary: { bg: 'var(--color-lime)', fg: 'var(--color-ink)', shadow: 'var(--color-ink)' },
  dark: { bg: 'var(--color-ink)', fg: 'var(--color-paper)', shadow: 'var(--color-lime)' },
  ghost: { bg: 'var(--color-paper)', fg: 'var(--color-ink)', shadow: 'var(--color-ink)' },
};

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-[12px]',
  md: 'px-6 py-3 text-[13px]',
  lg: 'px-8 py-4 text-[15px]',
};

export default function PixelButton({
  variant = 'primary',
  size = 'md',
  pill = true,
  magnetic = true,
  href,
  onClick,
  children,
  className = '',
  type = 'button',
  ariaLabel,
}: Props) {
  const mag = useMagnetic(magnetic ? 0.28 : 0);
  const v = VARIANTS[variant];

  const inner = (
    <motion.span
      className="inline-flex items-center justify-center gap-2 select-none"
      whileHover={{ y: -1, boxShadow: `6px 7px 0 ${v.shadow}` }}
      whileTap={{ y: 3, scale: 0.97, boxShadow: `0px 0px 0 ${v.shadow}` }}
      transition={{ duration: 0.14, ease: EASE_ARCADE }}
      style={{
        display: 'inline-flex',
        background: v.bg,
        color: v.fg,
        border: '3px solid var(--color-ink)',
        boxShadow: `4px 5px 0 ${v.shadow}`,
        borderRadius: pill ? 999 : 14,
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.01em',
        lineHeight: 1,
      }}
    >
      <span className={SIZES[size]}>{children}</span>
    </motion.span>
  );

  const commonProps = {
    ref: mag.ref as never,
    onPointerMove: mag.onPointerMove,
    onPointerLeave: mag.onPointerLeave,
    style: { x: mag.x, y: mag.y, display: 'inline-block' },
    className,
    'aria-label': ariaLabel,
  };

  if (href) {
    return (
      <motion.a href={href} {...commonProps}>
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.button type={type} onClick={onClick} {...commonProps}>
      {inner}
    </motion.button>
  );
}
