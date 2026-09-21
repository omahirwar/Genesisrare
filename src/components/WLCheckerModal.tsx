import { useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { springPop } from '../lib/motion';
import WLChecker from './WLChecker';

interface WLCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WLCheckerModal({ isOpen, onClose }: WLCheckerModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[150] grid place-items-center p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-black/60"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[620px] my-auto"
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: springPop }}
        exit={{ opacity: 0, y: 16, scale: 0.96, transition: { duration: 0.15 } }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 rf-btn text-[12px] py-1 px-2.5 bg-[#eeeeee] hover:bg-[#e4e4e4]"
        >
          [ close ✕ ]
        </button>

        <WLChecker compact />
      </motion.div>
    </motion.div>
  );
}
