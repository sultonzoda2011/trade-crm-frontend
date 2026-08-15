import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import type { Instance } from 'flatpickr/dist/types/instance';
import type { Options } from 'flatpickr/dist/types/options';

export function useFlatpickr(options: Partial<Options>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<Instance | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const fp = flatpickr(inputRef.current, options);
    fpRef.current = Array.isArray(fp) ? fp[0] : fp;
    return () => fpRef.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { inputRef, fpRef };
}
