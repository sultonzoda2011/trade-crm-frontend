import { useTranslation } from 'react-i18next';
import { FilterChip as Chip, FilterChipGroup as ChipGroup, getFilterValue } from '~/components/shared/FilterChips';
import { DEBTOR_FILTER_RULES } from '~/config/filterRules';
import { isOptionBlocked } from '~/lib/filter-rules';
import { applyFilter } from '~/store/useTableStore';
import type { ActiveFilter } from '~/types/filters';

type DebtScope = 'all' | 'withDebt' | 'overdue';
const RISKS = ['HIGH', 'MEDIUM', 'LOW'] as const;

/** Что показываем: «с долгом» и «просрочен» — два ключа фильтра, но для пользователя это один выбор. */
function getDebtScope(filters: ActiveFilter[]): DebtScope {
  if (getFilterValue(filters, 'overdue') === 'true') return 'overdue';
  if (getFilterValue(filters, 'hasActiveDebts') === 'true') return 'withDebt';
  return 'all';
}

interface DebtorQuickFiltersProps {
  filters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
}

/**
 * Быстрые фильтры должников под поиском. Пишут в те же ключи, что и шторка
 * (`hasActiveDebts`, `overdue`, `risk`), поэтому состояние совпадает с ней и с URL.
 * Внутри каждой группы выбран один пункт.
 */
export function DebtorQuickFilters({ filters, onChange }: DebtorQuickFiltersProps) {
  const { t } = useTranslation(['debtors', 'common']);
  const scope = getDebtScope(filters);
  const risk = getFilterValue(filters, 'risk');
  // Пункт отключается, если не сочетается с фильтром, выбранным в шторке (например, «Нет активных долгов»).
  const blocked = (key: string, value: string) => isOptionBlocked(DEBTOR_FILTER_RULES, filters, key, value);

  const selectScope = (next: DebtScope) => {
    let result = applyFilter(filters, 'hasActiveDebts', '');
    result = applyFilter(result, 'overdue', '');
    if (next === 'withDebt') result = applyFilter(result, 'hasActiveDebts', 'true');
    if (next === 'overdue') result = applyFilter(result, 'overdue', 'true');
    onChange(result);
  };

  const selectRisk = (next: string | undefined) => onChange(applyFilter(filters, 'risk', next ?? ''));

  return (
    <div className="space-y-3">
      <ChipGroup label={t('quick.debtScope')}>
        <Chip active={scope === 'all'} onClick={() => selectScope('all')}>
          {t('filters.all', { ns: 'common' })}
        </Chip>
        <Chip
          active={scope === 'withDebt'}
          disabled={blocked('hasActiveDebts', 'true')}
          onClick={() => selectScope('withDebt')}>
          {t('quick.withDebt')}
        </Chip>
        <Chip active={scope === 'overdue'} disabled={blocked('overdue', 'true')} onClick={() => selectScope('overdue')}>
          {t('quick.overdue')}
        </Chip>
      </ChipGroup>
      <ChipGroup label={t('risk.title')}>
        <Chip active={!risk} onClick={() => selectRisk(undefined)}>
          {t('filters.all', { ns: 'common' })}
        </Chip>
        {RISKS.map((r) => (
          <Chip key={r} active={risk === r} disabled={blocked('risk', r)} onClick={() => selectRisk(r)}>
            {t(`risk.${r}`)}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  );
}

/** Плашки «Есть активные долги» и т.п. дублируют чипсы, поэтому прячем только те значения, что чипсы показывают. */
export function filtersNotShownByDebtorChips(filters: ActiveFilter[]): ActiveFilter[] {
  return filters.filter((f) => {
    if ((f.key === 'hasActiveDebts' || f.key === 'overdue') && String(f.value) === 'true') return false;
    if (f.key === 'risk' && (RISKS as readonly string[]).includes(String(f.value))) return false;
    return true;
  });
}
