import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useSearchParams } from 'react-router';
import { sellersApi } from '~/api/sellers';
import { PageHeader } from '~/components/layout/PageHeader';
import { CustomSelect } from '~/components/shared/CustomSelect';
import { Label } from '~/components/ui/label';
import { PERIOD_OPTIONS } from '~/config/period';
import { mapToOptions } from '~/lib/mapToOptions';
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
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  };

  const { data: sellersResponse } = useQuery({
    queryKey: ['sellers', 'list'],
    queryFn: () => sellersApi.getAll(1, 100, {}, []),
    staleTime: 60_000,
  });

  const sellerOptions = useMemo(
    () => mapToOptions(sellersResponse?.data?.data ?? [], 'id', 'name'),
    [sellersResponse]
  );

  const tabs = [
    { to: '/dashboard', label: t('tabs.overview'), end: true },
    { to: '/dashboard/inventory', label: t('tabs.inventory'), end: false },
    { to: '/dashboard/products', label: t('tabs.products'), end: false },
    { to: '/dashboard/sellers', label: t('tabs.sellers'), end: false },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-5 pb-8">
      <PageHeader
        title={t('title')}
        actions={
          <>
            <div className="flex items-center gap-2">
              <Label className="text-xs">{t('period.from')}</Label>
              <CustomSelect
                options={PERIOD_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
                value={period}
                onChange={(v) => updateParam('period', v ? String(v) : '')}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">{t('seller')}</Label>
              <CustomSelect
                options={[{ value: '', label: t('allSellers') }, ...sellerOptions]}
                value={sellerId ?? ''}
                onChange={(v) => updateParam('sellerId', v ? String(v) : '')}
              />
            </div>
          </>
        }
      />

      <nav
        className="border-border -mx-3 flex gap-1 overflow-x-auto border-b px-3 md:-mx-6 md:px-6"
        aria-label={t('title')}>
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={{ pathname: tab.to, search: searchParams.toString() }}
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
