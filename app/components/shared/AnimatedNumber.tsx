import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  /** How a number is printed — `fmtTJS` for money. */
  format?: (value: number) => string;
  className?: string;
}

const defaultFormat = (value: number) => String(Math.round(value));

/**
 * Displays a figure immediately on mount and smoothly interpolates when the
 * value changes (e.g. switching period or seller filter).
 */
export function AnimatedNumber({ value, format = defaultFormat, className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  const formatRef = useRef(format);
  formatRef.current = format;
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const from = shown.current;
    if (reduced || from === value) {
      shown.current = value;
      node.textContent = formatRef.current(value);
      return;
    }

    const bothIntegers = Number.isInteger(from) && Number.isInteger(value);

    const controls = animate(from, value, {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        const current = bothIntegers ? Math.round(latest) : latest;
        shown.current = current;
        node.textContent = formatRef.current(current);
      },
      onComplete: () => {
        shown.current = value;
        node.textContent = formatRef.current(value);
      },
    });
    return () => controls.stop();
  }, [value, reduced]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
