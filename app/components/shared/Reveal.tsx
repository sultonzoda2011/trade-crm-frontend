import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

interface RevealProps {
  children: ReactNode;
  /** Position in a group — later items start a beat later. Capped so long lists do not drag. */
  index?: number;
  className?: string;
}

const STAGGER_STEP = 0.045;
const STAGGER_CAP = 11;

/** Fade-and-rise entrance for a card or row. Respects "reduce motion" through the app-wide `MotionConfig`. */
export function Reveal({ children, index = 0, className }: RevealProps) {
  return (
    <motion.div
      className={cn('h-full', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: Math.min(index, STAGGER_CAP) * STAGGER_STEP }}>
      {children}
    </motion.div>
  );
}
