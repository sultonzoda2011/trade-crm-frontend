import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { AnimatedNumber } from '~/components/shared/AnimatedNumber';
import { SuccessCheck } from '~/components/shared/SuccessCheck';
import { fmtTJS } from '~/lib/format';
import { useSuccessStore } from '~/store/useSuccessStore';

const DEFAULT_DURATION_MS = 1900;

/**
 * The «done» moment, one instance for the whole app (mounted in the CRM layout).
 *
 * A glass card with the drawn check, the headline and — when money moved — the
 * sum counting up. It dismisses itself, on a tap, or on Escape; a new success
 * replaces the previous one instead of stacking.
 */
export function SuccessDialog() {
  const current = useSuccessStore((s) => s.current);
  const hide = useSuccessStore((s) => s.hide);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(hide, current.duration ?? DEFAULT_DURATION_MS);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [current, hide]);

  return (
    <AnimatePresence>
      {current ? (
        <motion.div
          key={current.id}
          role="status"
          aria-live="polite"
          onClick={hide}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 px-6 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}>
          <motion.div
            className="liquid-glass relative flex w-full max-w-72 flex-col items-center gap-1 rounded-[2rem] px-6 pt-7 pb-6 text-center"
            initial={{ opacity: 0, scale: 0.84, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
            <SuccessCheck className="mb-3" />

            <motion.p
              className="text-lg leading-snug font-semibold"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.25 }}>
              {current.title}
            </motion.p>

            {typeof current.amount === 'number' ? (
              <motion.p
                className="text-success font-mono text-2xl font-bold tabular-nums"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.25 }}>
                <AnimatedNumber value={current.amount} format={(v) => fmtTJS(Math.round(v))} />
              </motion.p>
            ) : null}

            {current.description ? (
              <motion.p
                className="text-muted-foreground text-sm leading-snug"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.25 }}>
                {current.description}
              </motion.p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
