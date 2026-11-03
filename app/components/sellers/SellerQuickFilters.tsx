import { useTranslation } from 'react-i18next';
import { FilterChip as Chip, FilterChipGroup as ChipGroup, getFilterValue } from '~/components/shared/FilterChips';
import { applyFilter } from '~/store/useTableStore';
import type { ActiveFilter } from '~/types/filters';
import type { SellerPeriod, SellerStatus } from '~/types/sellers';

export const SELLER_PERIODS: SellerPeriod[] = ['today', 'week', 'month', 'year'];
const STATUSES: SellerStatus[] = ['active', 'disabled', 'all'];

/** Период по умолчанию — месяц: у него нет значения в фильтре, поэтому URL остаётся чистым. */
export const DEFAULT_PERIOD: SellerPeriod = 'month';

export function getSellerPeriod(filters: ActiveFilter[]): SellerPeriod {
  const v = getFilterValue(filters, 'period');
  return SELLER_PERIODS.includes(v as SellerPeriod) ? (v as SellerPeriod) : DEFAULT_PERIOD;
}

export function getSellerStatus(filters: ActiveFilter[]): SellerStatus {
  const v = getFilterValue(filters, 'status');
  return STATUSES.includes(v as SellerStatus) ? (v as SellerStatus) : 'active';
}

interface SellerQuickFiltersProps {
  filters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
  counts?: { active: number; disabled: number };
}

/**
 * Быстрые фильтры продавцов: кого показывать и за какой период считать «продал / заработал».
 * Пишут в те же ключи (`status`, `period`), что и шторка фильтров и URL. «Работают» и «Месяц» —
 * значения по умолчанию, поэтому в фильтр они не попадают.
 */
export function SellerQuickFilters({ filters, onChange, counts }: SellerQuickFiltersProps) {
  const { t } = useTranslation('sellers');
  const status = getSellerStatus(filters);
  const period = getSellerPeriod(filters);

  const selectStatus = (next: SellerStatus) => onChange(applyFilter(filters, 'status', next === 'active' ? '' : next));
  const selectPeriod = (next: SellerPeriod) =>
    onChange(applyFilter(filters, 'period', next === DEFAULT_PERIOD ? '' : next));

  // Чип «Отключены» нужен только если такие есть — иначе это лишняя кнопка в пустоту.
  const showDisabled = status === 'disabled' || status === 'all' || (counts?.disabled ?? 0) > 0;

  return (
    <div className="space-y-3">
      {showDisabled && (
        <ChipGroup label={t('quick.show')}>
          {STATUSES.map((s) => (
            <Chip key={s} active={status === s} onClick={() => selectStatus(s)}>
              {t(`status.${s}`)}
              {counts && s !== 'all' && counts[s === 'active' ? 'active' : 'disabled'] > 0
                ? ` · ${counts[s === 'active' ? 'active' : 'disabled']}`
                : ''}
            </Chip>
          ))}
        </ChipGroup>
      )}
      <ChipGroup label={t('quick.period')}>
        {SELLER_PERIODS.map((p) => (
          <Chip key={p} active={period === p} onClick={() => selectPeriod(p)}>
            {t(`period.${p}`)}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  );
}

/** Плашки «Работают» / «Месяц» повторяют чипсы — прячем из плашек то, что чипсы уже показывают. */
export function filtersNotShownBySellerChips(filters: ActiveFilter[]): ActiveFilter[] {
  return filters.filter((f) => f.key !== 'status' && f.key !== 'period');
}
