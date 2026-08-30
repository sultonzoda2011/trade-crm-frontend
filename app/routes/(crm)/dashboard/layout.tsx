import { CalendarDays } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useSearchParams } from 'react-router';

import { sellersApi } from '~/api/sellers';
import { PageHeader } from '~/components/layout/PageHeader';
import { CustomSelect } from '~/components/shared/CustomSelect';
import { Label } from '~/components/ui/label';
import { PERIOD_OPTIONS, type Period } from '~/config/period';
import { useAsyncSelectOptions } from '~/hooks/useAsyncSelectOptions';
import { getPeriodRange } from '~/lib/date';
import { formatDate } from '~/lib/format';
import { cn } from '~/lib/utils';

export interface DashboardFilters {
  period: string;
  sellerId: string | undefined;
}

/**
 * Раньше весь дашборд (инсайты, метрики, тренд, долги, склад, топ товаров,
 * категории, отчёт по продавцам) был одной длинной страницей — на мобильном
 * это был экран непрерывного скролла на 10+ секций. Теперь общий заголовок
 * и фильтры (период/продавец) живут здесь и переживают переключение вкладок
 * через query-параметры — можно поделиться ссылкой на конкретную вкладку с
 * уже применённым фильтром.
 */
export default function DashboardLayout() {
  const { t } = useTranslation(['dashboard', 'common']);

  const [searchParams, setSearchParams] = useSearchParams();

  const period = searchParams.get('period') ?? 'month';
  const sellerId = searchParams.get('sellerId') ?? undefined;

  const updateParam = (key: 'period' | 'sellerId', value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);

        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }

        return next;
      },
      { replace: true }
    );
  };

  // Продавцов может быть много — фильтр ищет по имени на сервере, а не грузит первые 100.
  const sellers = useAsyncSelectOptions({
    queryKey: ['sellers', 'list'],
    fetcher: async (search) => (await sellersApi.getAll(1, 20, { search: search || undefined }, []))?.data?.data ?? [],
    getValue: (s) => s.id,
    getLabel: (s) => s.name,
  });

  const validPeriod: Period = PERIOD_OPTIONS.some((option) => option.value === period) ? (period as Period) : 'month';

  const range = useMemo(() => getPeriodRange(validPeriod), [validPeriod]);

  const tabs = [
    {
      to: '/dashboard',
      label: t('tabs.overview'),
      end: true,
    },
    {
      to: '/dashboard/inventory',
      label: t('tabs.inventory'),
      end: false,
    },
    {
      to: '/dashboard/products',
      label: t('tabs.products'),
      end: false,
    },
    {
      to: '/dashboard/sellers',
      label: t('tabs.sellers'),
      end: false,
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4 pb-6">
      <PageHeader
        title={t('title')}
        actions={
          <>
            <div className="flex items-center gap-2">
              <Label className="text-xs">{t('period.from')}</Label>

              <CustomSelect
                options={PERIOD_OPTIONS.map((option) => ({
                  value: option.value,
                  label: t(option.labelKey),
                }))}
                value={period}
                onChange={(value) => updateParam('period', value ? String(value) : '')}
              />
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs">{t('seller')}</Label>

              <CustomSelect
                options={[
                  {
                    value: '',
                    label: t('allSellers'),
                  },
                  ...sellers.options,
                ]}
                value={sellerId ?? ''}
                onChange={(value) => updateParam('sellerId', value ? String(value) : '')}
                onSearch={sellers.onSearch}
                loading={sellers.loading}
              />
            </div>

            <span className="text-muted-foreground flex items-center gap-1.5 text-xs whitespace-nowrap tabular-nums">
              <CalendarDays className="size-3.5 shrink-0" />

              {formatDate(range.from.toDate())}

              {range.to ? ` - ${formatDate(range.to.toDate())}` : ''}
            </span>
          </>
        }
      />

      <nav
        className="border-border -mx-3 flex gap-1 overflow-x-auto border-b px-3 md:-mx-6 md:px-6"
        aria-label={t('title')}>
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={{
              pathname: tab.to,
              search: searchParams.toString(),
            }}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              )
            }>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ period, sellerId } satisfies DashboardFilters} />
    </div>
  );
}
