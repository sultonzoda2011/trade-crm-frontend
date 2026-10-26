import { useMemo, useRef } from 'react';
import type { CustomSelectOption } from '~/components/shared/CustomSelect';

/**
 * Кэширует все опции, которые когда-либо попадали в `options`, по строковому `value`.
 * При серверном поиске выбранная опция может исчезнуть из текущей выдачи `options`,
 * но её подпись должна оставаться видимой в поле.
 */
export function useOptionLabelCache(
  options: CustomSelectOption[],
  value?: string | number | null
): CustomSelectOption | null {
  const cacheRef = useRef<Map<string, CustomSelectOption>>(new Map());
  for (const opt of options) {
    cacheRef.current.set(String(opt.value), opt);
  }

  return useMemo(() => {
    if (value === null || value === undefined || value === '') return null;
    return cacheRef.current.get(String(value)) ?? null;
  }, [value, options]);
}
