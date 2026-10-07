import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  /** How a (possibly fractional, mid-flight) number is printed — `fmtTJS` for money. */
  format?: (value: number) => string;
  className?: string;
}

const defaultFormat = (value: number) => String(Math.round(value));

/**
 * A figure that counts to its value instead of snapping to it.
 *
 * First paint counts up from zero; every later change (a new period, a new
 * seller) eases from what is currently on screen to the new figure, so the eye
 * sees which way the number moved. The text node is written directly on each
 * frame — no React render per tick. With "reduce motion" on, it just shows the value.
 */
export function AnimatedNumber({ value, format = defaultFormat, className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const formatRef = useRef(format);
  formatRef.current = format;
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (reduced) {
      shown.current = value;
      node.textContent = formatRef.current(value);
      return;
    }

    const controls = animate(shown.current, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        shown.current = latest;
        node.textContent = formatRef.current(latest);
      },
      onComplete: () => {
        shown.current = value;
        node.textContent = formatRef.current(value);
      },
    });
    return () => controls.stop();
  }, [value, reduced]);

  // The server/first render shows the final figure so nothing is blank if JS is slow; the effect then counts from 0.
  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
