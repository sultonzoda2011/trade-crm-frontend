import { motion } from 'motion/react';
import { cn } from '~/lib/utils';

interface SuccessCheckProps {
  className?: string;
}

/**
 * The «done» mark: a green disc pops in, a ring ripples off it, and the check
 * is drawn stroke by stroke. Motion drives it (spring + path length), so it is
 * one self-contained piece that can sit in a dialog, a sheet or an empty state.
 */
export function SuccessCheck({ className }: SuccessCheckProps) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-hidden="true" className={cn('text-success size-20', className)}>
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ scale: 0.9, opacity: 0.5 }}
        animate={{ scale: 1.45, opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease: 'easeOut' }}
        style={{ transformOrigin: '32px 32px' }}
      />
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        fill="currentColor"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        style={{ transformOrigin: '32px 32px' }}
      />
      <motion.path
        d="M20 33.5L28.5 42L44.5 24"
        fill="none"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.38, delay: 0.18, ease: [0.5, 0, 0.2, 1] }}
      />
    </svg>
  );
}
