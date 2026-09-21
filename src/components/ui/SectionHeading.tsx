import { motion } from 'motion/react';
import { clipReveal, fadeUp, stagger } from '../../lib/motion';

interface Props {
  title: string;
  sub?: string;
  align?: 'left' | 'center';
  id?: string;
  className?: string;
  titleClassName?: string;
}

/** Big pixel-display heading with a clip reveal on scroll. No tracked-caps eyebrow. */
export default function SectionHeading({ title, sub, align = 'left', id, className = '', titleClassName = '' }: Props) {
  return (
    <motion.div
      id={id}
      className={`${align === 'center' ? 'text-center mx-auto' : ''} ${className}`}
      variants={stagger(0.12)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
    >
      <motion.div variants={fadeUp} className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : ''} mb-5`} aria-hidden>
        <span className="inline-block h-2.5 w-2.5 bg-lime" style={{ border: '2px solid var(--color-ink)' }} />
        <span className="inline-block h-2.5 w-2.5 bg-blue" style={{ border: '2px solid var(--color-ink)' }} />
        <span className="inline-block h-2.5 w-2.5 bg-amber" style={{ border: '2px solid var(--color-ink)' }} />
      </motion.div>
      <motion.h2
        variants={clipReveal}
        className={`font-display leading-[0.92] tracking-tight text-ink ${titleClassName}`}
        style={{ fontSize: 'clamp(2.4rem, 6.4vw, 5rem)' }}
      >
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          variants={fadeUp}
          className={`font-sans text-ink-soft mt-5 text-[17px] leading-relaxed ${align === 'center' ? 'mx-auto' : ''}`}
          style={{ maxWidth: '54ch' }}
        >
          {sub}
        </motion.p>
      )}
    </motion.div>
  );
}
