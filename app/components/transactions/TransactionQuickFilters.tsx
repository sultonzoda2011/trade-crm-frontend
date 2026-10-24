import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Period } from '~/config/period';
import { getPeriodDateParams } from '~/lib/date';
import { haptic } from '~/lib/haptics';
import { cn } from '~/lib/utils';
import { applyFilter } from '~/store/useTableStore';
import type { ActiveFilter } from '~/types/filters';

/** Периоды, для которых есть и готовый диапазон дат, и цифры дашборда за тот же период. */
export const QUICK_PERIODS: Exclude<Period, 'year'>[] = ['today', 'week', 'month'];

type Kind = 'all' | 'SALE' | 'DEBT' | 'REFUND' | 'OUTSTANDING' | 'OVERDUE';
const KINDS: Kind[] = ['all', 'SALE', 'DEBT', 'REFUND', 'OUTSTANDING', 'OVERDUE'];
const PAYMENTS = ['CASH', 'CARD'] as const;

const KIND_LABEL_KEY: Record<Kind, string> = {
  all: 'list.quick.all',
  SALE: 'list.quick.sale',
  DEBT: 'list.quick.debt',
  REFUND: 'list.quick.refund',
  OUTSTANDING: 'list.quick.unpaid',
  OVERDUE: 'list.quick.overdue',
};

function valueOf(filters: ActiveFilter[], key: string): string | undefined {
  const v = filters.find((f) => f.key === key)?.value;
  return v == null || v === '' ? undefined : String(v);
}

/** Какой из быстрых периодов сейчас выбран. `null` — даты заданы вручную (диапазон из фильтра). */
export function getActivePeriod(filters: ActiveFilter[]): Exclude<Period, 'year'> | 'all' | null {
  const from = valueOf(filters, 'dateFrom');
  const to = valueOf(filters, 'dateTo');
  if (!from && !to) return 'all';
  return (
    QUICK_PERIODS.find((p) => {
      const r = getPeriodDateParams(p);
      return r.dateFrom === from && r.dateTo === to;
    }) ?? null
  );
}

/** Выбранный «вид» операций: тип или состояние долга. `null` — задан чем-то, чего у чипсов нет. */
function getActiveKind(filters: ActiveFilter[]): Kind | null {
  const type = valueOf(filters, 'type');
  const debtStatus = valueOf(filters, 'debtStatus');
  if (debtStatus) return debtStatus === 'OUTSTANDING' || debtStatus === 'OVERDUE' ? (debtStatus as Kind) : null;
  if (!type) return 'all';
  return type === 'SALE' || type === 'DEBT' || type === 'REFUND' ? type : null;
}

/**
 * Фильтры, которые чипсы уже показывают сами. Плашки «Продажа ×» рядом с горящим
 * чипсом «Продажи» — дубль, поэтому в ActiveFilterPills отдаём только остальное.
 */
export function filtersNotShownByChips(filters: ActiveFilter[]): ActiveFilter[] {
  const periodCovered = getActivePeriod(filters) !== null;
  const kindCovered = getActiveKind(filters) !== null;
  const payment = valueOf(filters, 'paymentType');
  const paymentCovered = payment === 'CASH' || payment === 'CARD';
  return filters.filter((f) => {
    if ((f.key === 'dateFrom' || f.key === 'dateTo') && periodCovered) return false;
    if ((f.key === 'type' || f.key === 'debtStatus') && kindCovered) return false;
    if (f.key === 'paymentType' && paymentCovered) return false;
    return true;
  });
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        haptic('selection');
        onClick();
      }}
      className={cn(
        'h-10 shrink-0 touch-manipulation rounded-full px-4 text-sm font-medium whitespace-nowrap transition-[background-color,color,transform] duration-200 select-none [-webkit-tap-highlight-color:transparent] active:scale-95 md:h-9',
        active ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground active:bg-muted'
      )}>
      {children}
    </button>
  );
}

// На телефоне ряд выходит за поля страницы (-mx-3) и прокручивается пальцем до самого края экрана.
const ROW = 'scrollbar-hide -mx-3 flex snap-x gap-2 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:px-0';

interface TransactionQuickFiltersProps {
  filters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
}

/**
 * Быстрые фильтры под поиском — те же `dateFrom/dateTo`, `type`, `debtStatus` и
 * `paymentType`, что и в шторке фильтров, поэтому они живут в одном состоянии
 * и попадают в адресную строку. Период и вид операции — две независимые группы;
 * внутри вида выбран один пункт, способ оплаты включается и выключается отдельно.
 */
export function TransactionQuickFilters({ filters, onChange }: TransactionQuickFiltersProps) {
  const { t } = useTranslation(['transactions', 'common']);
  const period = getActivePeriod(filters);
  const kind = getActiveKind(filters);
  const payment = valueOf(filters, 'paymentType');

  const selectPeriod = (next: Exclude<Period, 'year'> | 'all') => {
    let result = applyFilter(applyFilter(filters, 'dateFrom', ''), 'dateTo', '');
    if (next !== 'all') {
      const r = getPeriodDateParams(next);
      result = applyFilter(applyFilter(result, 'dateFrom', r.dateFrom), 'dateTo', r.dateTo);
    }
    onChange(result);
  };

  const selectKind = (next: Kind) => {
    let result = applyFilter(applyFilter(filters, 'type', ''), 'debtStatus', '');
    if (next === 'SALE' || next === 'DEBT' || next === 'REFUND') result = applyFilter(result, 'type', next);
    else if (next !== 'all') result = applyFilter(result, 'debtStatus', next);
    onChange(result);
  };

  const togglePayment = (next: (typeof PAYMENTS)[number]) =>
    onChange(applyFilter(filters, 'paymentType', payment === next ? '' : next));

  return (
    <div className="space-y-2">
      <div role="group" aria-label={t('list.quick.period')} className={ROW}>
        <Chip active={period === 'all'} onClick={() => selectPeriod('all')}>
          {t('list.quick.anyDate')}
        </Chip>
        {QUICK_PERIODS.map((p) => (
          <Chip key={p} active={period === p} onClick={() => selectPeriod(p)}>
            {t(`period.${p}`, { ns: 'common' })}
          </Chip>
        ))}
      </div>
      <div role="group" aria-label={t('list.quick.kind')} className={ROW}>
        {KINDS.map((k) => (
          <Chip key={k} active={kind === k} onClick={() => selectKind(k)}>
            {t(KIND_LABEL_KEY[k])}
          </Chip>
        ))}
        {PAYMENTS.map((p) => (
          <Chip key={p} active={payment === p} onClick={() => togglePayment(p)}>
            {t(`paymentType.${p}`)}
          </Chip>
        ))}
      </div>
    </div>
  );
}
