import type { ActiveFilter } from '~/types/filters';

/** Одна сторона несовместимой пары: фильтр `key` со значением из `values`. */
export interface FilterRuleSide {
  key: string;
  values: readonly string[];
}

/**
 * Два фильтра, которые не бывают вместе: ни одна запись не подходит под обе стороны.
 * Правило симметрично — достаточно описать пару один раз.
 */
export type FilterConflict = readonly [FilterRuleSide, FilterRuleSide];

function valueOf(filters: ActiveFilter[], key: string): string | undefined {
  const v = filters.find((f) => f.key === key)?.value;
  return v == null || v === '' ? undefined : String(v);
}

/**
 * Какой из выбранных фильтров не даёт выбрать `key = value`. `undefined` — ничего не мешает.
 *
 * Уже выбранное значение не блокируется никогда: иначе его нельзя было бы снять, а фильтр
 * из ссылки (дашборд, адресная строка) с несовместимой парой застрял бы в списке навсегда.
 */
export function findBlockingFilter(
  rules: readonly FilterConflict[] | undefined,
  filters: ActiveFilter[],
  key: string,
  value: string | number | boolean
): ActiveFilter | undefined {
  if (!rules || rules.length === 0) return undefined;
  const candidate = String(value);
  if (valueOf(filters, key) === candidate) return undefined;

  for (const [a, b] of rules) {
    for (const [self, other] of [
      [a, b],
      [b, a],
    ] as const) {
      if (self.key !== key || !self.values.includes(candidate)) continue;
      const selected = valueOf(filters, other.key);
      if (selected !== undefined && other.values.includes(selected)) return { key: other.key, value: selected };
    }
  }
  return undefined;
}

export function isOptionBlocked(
  rules: readonly FilterConflict[] | undefined,
  filters: ActiveFilter[],
  key: string,
  value: string | number | boolean
): boolean {
  return findBlockingFilter(rules, filters, key, value) !== undefined;
}
