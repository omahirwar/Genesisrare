import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  tone?: 'paper' | 'cream' | 'lime' | 'blue' | 'ink';
  size?: 'md' | 'lg';
}

const TONE: Record<NonNullable<Props['tone']>, { bg: string; fg?: string }> = {
  paper: { bg: 'var(--color-paper)' },
  cream: { bg: 'var(--color-cream-2)' },
  lime: { bg: 'var(--color-lime)' },
  blue: { bg: 'var(--color-blue)', fg: 'var(--color-paper)' },
  ink: { bg: 'var(--color-ink)', fg: 'var(--color-paper)' },
};

/** The signature tactile container: thick ink border + hard offset shadow. */
export default function Panel({ children, className = '', tone = 'paper', size = 'md' }: Props) {
  const t = TONE[tone];
  return (
    <div
      className={`${size === 'lg' ? 'sticker-lg rounded-art' : 'sticker rounded-panel'} ${className}`}
      style={{ background: t.bg, color: t.fg }}
    >
      {children}
    </div>
  );
}
