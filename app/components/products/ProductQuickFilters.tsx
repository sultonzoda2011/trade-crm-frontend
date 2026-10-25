import { useTranslation } from 'react-i18next';
import { FilterChip as Chip, FilterChipGroup as ChipGroup, getFilterValue } from '~/components/shared/FilterChips';
import { getProductHealthOptions, getReorderPriorityOptions } from '~/config/analyticsBadges';
import { applyFilter } from '~/store/useTableStore';
import type { ActiveFilter } from '~/types/filters';

const FILTER_KEYS = ['health', 'reorderPriority'] as const;

interface ProductQuickFiltersProps {
  filters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
}

/**
 * Быстрые фильтры товаров: состояние склада и срочность закупки. Пишут в те же
 * ключи, что и шторка (`health`, `reorderPriority`), поэтому совпадают с ней и с URL
 * (в том числе с переходами с дашборда). Внутри группы выбран один пункт.
 */
export function ProductQuickFilters({ filters, onChange }: ProductQuickFiltersProps) {
  const { t } = useTranslation(['products', 'common']);
  const health = getFilterValue(filters, 'health');
  const reorder = getFilterValue(filters, 'reorderPriority');

  const select = (key: (typeof FILTER_KEYS)[number], next: string | undefined) =>
    onChange(applyFilter(filters, key, next ?? ''));

  return (
    <div className="space-y-3">
      <ChipGroup label={t('filters.health')}>
        <Chip active={!health} onClick={() => select('health', undefined)}>
          {t('filters.all', { ns: 'common' })}
        </Chip>
        {getProductHealthOptions(t).map((o) => (
          <Chip key={o.value} active={health === o.value} onClick={() => select('health', o.value)}>
            {o.label}
          </Chip>
        ))}
      </ChipGroup>
      <ChipGroup label={t('filters.reorderPriority')}>
        <Chip active={!reorder} onClick={() => select('reorderPriority', undefined)}>
          {t('filters.all', { ns: 'common' })}
        </Chip>
        {getReorderPriorityOptions(t).map((o) => (
          <Chip key={o.value} active={reorder === o.value} onClick={() => select('reorderPriority', o.value)}>
            {o.label}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  );
}

/** Плашки для состояния и срочности дублируют чипсы, поэтому прячем только их. */
export function filtersNotShownByProductChips(filters: ActiveFilter[]): ActiveFilter[] {
  return filters.filter((f) => !(FILTER_KEYS as readonly string[]).includes(f.key));
}
