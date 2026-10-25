import { useTranslation } from 'react-i18next';
import { FilterChip as Chip, FilterChipGroup as ChipGroup, getFilterValue } from '~/components/shared/FilterChips';
import type { Period } from '~/config/period';
import { getPeriodDateParams } from '~/lib/date';
import { applyFilter } from '~/store/useTableStore';
import type { ActiveFilter } from '~/types/filters';

/** Периоды, для которых есть и готовый диапазон дат, и цифры дашборда за тот же период. */
export const QUICK_PERIODS: Exclude<Period, 'year'>[] = ['today', 'week', 'month'];

type Kind = 'all' | 'SALE' | 'DEBT' | 'REFUND';
const KINDS: Kind[] = ['all', 'SALE', 'DEBT', 'REFUND'];
const KIND_LABEL_KEY: Record<Kind, string> = {
  all: 'list.quick.all',
  SALE: 'list.quick.sale',
  DEBT: 'list.quick.debt',
  REFUND: 'list.quick.refund',
};

type DebtState = 'all' | 'OUTSTANDING' | 'OVERDUE';
const DEBT_STATES: DebtState[] = ['all', 'OUTSTANDING', 'OVERDUE'];
const DEBT_STATE_LABEL_KEY: Record<DebtState, string> = {
  all: 'list.quick.all',
  OUTSTANDING: 'list.quick.unpaid',
  OVERDUE: 'list.quick.overdue',
};

type Payment = 'all' | 'CASH' | 'CARD';
const PAYMENTS: Payment[] = ['all', 'CASH', 'CARD'];

/** Какой из быстрых периодов сейчас выбран. `null` — даты заданы вручную (диапазон из фильтра). */
export function getActivePeriod(filters: ActiveFilter[]): Exclude<Period, 'year'> | 'all' | null {
  const from = getFilterValue(filters, 'dateFrom');
  const to = getFilterValue(filters, 'dateTo');
  if (!from && !to) return 'all';
  return (
    QUICK_PERIODS.find((p) => {
      const r = getPeriodDateParams(p);
      return r.dateFrom === from && r.dateTo === to;
    }) ?? null
  );
}

/** Выбранный тип операции. `null` — тип задан значением, которого у чипсов нет (плашка останется). */
function getActiveKind(filters: ActiveFilter[]): Kind | null {
  const type = getFilterValue(filters, 'type');
  if (!type) return 'all';
  return type === 'SALE' || type === 'DEBT' || type === 'REFUND' ? type : null;
}

/** Выбранное состояние долга. `null` — например «Скоро срок»: у чипсов его нет, плашка останется. */
function getActiveDebtState(filters: ActiveFilter[]): DebtState | null {
  const state = getFilterValue(filters, 'debtStatus');
  if (!state) return 'all';
  return state === 'OUTSTANDING' || state === 'OVERDUE' ? state : null;
}

/** Выбранный способ оплаты. `null` — например «Кредит»: у чипсов его нет, плашка останется. */
function getActivePayment(filters: ActiveFilter[]): Payment | null {
  const payment = getFilterValue(filters, 'paymentType');
  if (!payment) return 'all';
  return payment === 'CASH' || payment === 'CARD' ? payment : null;
}

/**
 * Фильтры, которые чипсы уже показывают сами. Плашки «Продажа ×» рядом с горящим
 * чипсом «Продажи» — дубль, поэтому в ActiveFilterPills отдаём только остальное.
 */
export function filtersNotShownByChips(filters: ActiveFilter[]): ActiveFilter[] {
  const periodCovered = getActivePeriod(filters) !== null;
  const kindCovered = getActiveKind(filters) !== null;
  const debtCovered = getActiveDebtState(filters) !== null;
  const paymentCovered = getActivePayment(filters) !== null;
  return filters.filter((f) => {
    if ((f.key === 'dateFrom' || f.key === 'dateTo') && periodCovered) return false;
    if (f.key === 'type' && kindCovered) return false;
    if (f.key === 'debtStatus' && debtCovered) return false;
    if (f.key === 'paymentType' && paymentCovered) return false;
    return true;
  });
}

interface TransactionQuickFiltersProps {
  filters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
}

/**
 * Быстрые фильтры под поиском — те же `dateFrom/dateTo`, `type`, `debtStatus` и
 * `paymentType`, что и в шторке фильтров, поэтому они живут в одном состоянии
 * и попадают в адресную строку. Четыре независимые группы, в каждой выбран один
 * пункт, поэтому сочетать можно, например, «Продажи» + «Не закрыты» + «Карта».
 */
export function TransactionQuickFilters({ filters, onChange }: TransactionQuickFiltersProps) {
  const { t } = useTranslation(['transactions', 'common']);
  const period = getActivePeriod(filters);
  const kind = getActiveKind(filters);
  const debtState = getActiveDebtState(filters);
  const payment = getActivePayment(filters);

  const selectPeriod = (next: Exclude<Period, 'year'> | 'all') => {
    let result = applyFilter(applyFilter(filters, 'dateFrom', ''), 'dateTo', '');
    if (next !== 'all') {
      const r = getPeriodDateParams(next);
      result = applyFilter(applyFilter(result, 'dateFrom', r.dateFrom), 'dateTo', r.dateTo);
    }
    onChange(result);
  };

  const selectKind = (next: Kind) => onChange(applyFilter(filters, 'type', next === 'all' ? '' : next));
  const selectDebtState = (next: DebtState) => onChange(applyFilter(filters, 'debtStatus', next === 'all' ? '' : next));
  const selectPayment = (next: Payment) => onChange(applyFilter(filters, 'paymentType', next === 'all' ? '' : next));

  return (
    <div className="space-y-3">
      <ChipGroup label={t('list.quick.period')}>
        <Chip active={period === 'all'} onClick={() => selectPeriod('all')}>
          {t('list.quick.anyDate')}
        </Chip>
        {QUICK_PERIODS.map((p) => (
          <Chip key={p} active={period === p} onClick={() => selectPeriod(p)}>
            {t(`period.${p}`, { ns: 'common' })}
          </Chip>
        ))}
      </ChipGroup>
      <ChipGroup label={t('list.quick.kind')}>
        {KINDS.map((k) => (
          <Chip key={k} active={kind === k} onClick={() => selectKind(k)}>
            {t(KIND_LABEL_KEY[k])}
          </Chip>
        ))}
      </ChipGroup>
      <ChipGroup label={t('debtStatus.title')}>
        {DEBT_STATES.map((d) => (
          <Chip key={d} active={debtState === d} onClick={() => selectDebtState(d)}>
            {t(DEBT_STATE_LABEL_KEY[d])}
          </Chip>
        ))}
      </ChipGroup>
      <ChipGroup label={t('fields.paymentType')}>
        {PAYMENTS.map((p) => (
          <Chip key={p} active={payment === p} onClick={() => selectPayment(p)}>
            {p === 'all' ? t('list.quick.all') : t(`paymentType.${p}`)}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  );
}
