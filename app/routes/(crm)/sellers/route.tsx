import { Plus, UserCheck, UserX, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { sellersApi } from '~/api/sellers';
import { SellerDialogs } from '~/components/sellers/SellerDialogs';
import { SellerMobileCard } from '~/components/sellers/SellerMobileCard';
import {
  filtersNotShownBySellerChips,
  getSellerPeriod,
  SellerQuickFilters,
} from '~/components/sellers/SellerQuickFilters';
import { SellersSummary, useSellerCounts } from '~/components/sellers/SellersSummary';
import { ListPageLayout } from '~/components/shared/ListPageLayout';
import type { SwipeAction } from '~/components/shared/SwipeableRow';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useEntityList } from '~/hooks/useEntityList';
import { useSellerAccess } from '~/hooks/useSellerActions';
import { getClientUser } from '~/lib/auth-utils';
import { buildRowSwipeActions } from '~/lib/swipe-actions';
import { getColumns } from '~/routes/(crm)/sellers/configs/columns';
import { getSellerFilters } from '~/routes/(crm)/sellers/configs/filters';
import { useSellersModals, useSellersStore } from '~/routes/(crm)/sellers/store';

/** Сначала те, кому больше всего должны: владелец открывает список, чтобы рассчитаться. */
const DEFAULT_SORT = { sortBy: 'balance', sortOrder: 'desc' } as const;

export default function SellersPage() {
  const { t } = useTranslation(['sellers', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = useCan();
  const deleteModal = useSellersModals((s) => s.delete);
  const payoutModal = useSellersModals((s) => s.payout);
  const deactivateModal = useSellersModals((s) => s.deactivate);
  const { activate } = useSellerAccess();

  // `getList` — со статистикой; у `sellersApi.getAll` (для выпадашек) её нет.
  const list = useEntityList({
    entity: 'sellers',
    store: useSellersStore,
    api: { getAll: sellersApi.getList, delete: sellersApi.delete },
    t,
    deleteModal,
    defaultSort: DEFAULT_SORT,
  });
  const filterConfig = useMemo(() => getSellerFilters(t), [t]);
  const columns = useMemo(() => getColumns({ t }), [t]);
  const period = getSellerPeriod(list.filters);
  const counts = useSellerCounts(period);

  const { table } = useDataTable({
    columns,
    data: list.rows,
    storageKey: 'sellers-table-columns',
  });

  return (
    <>
      <ListPageLayout
        title={t('title')}
        searchPlaceholder={t('filters.search')}
        list={list}
        table={table}
        filterConfig={filterConfig}
        quickFilters={
          <div className="space-y-4">
            <SellersSummary period={period} />
            <SellerQuickFilters filters={list.filters} onChange={list.setFilters} counts={counts} />
          </div>
        }
        pillFilters={filtersNotShownBySellerChips(list.filters)}
        showFilterPills
        syncUrl
        // Как и в колонке действий: свою карточку открываем как /profile —
        // отдельной страницы «продавец сам о себе» нет.
        getRowLink={(row) =>
          getClientUser()?.id === row.original.id
            ? { to: '/profile' }
            : {
                to: `/sellers/${row.original.id}`,
                state: { fromPath: location.pathname, fromName: t('title') },
              }
        }
        getSwipeActions={(row) => {
          const seller = row.original;
          const isSelf = getClientUser()?.id === seller.id;
          const balance = seller.stats?.balance ?? 0;
          const leading: SwipeAction[] = [];
          if (balance > 0 && can(Action.SELLERS_PAYOUT)) {
            leading.push({
              key: 'payout',
              label: t('payout.swipe'),
              icon: Wallet,
              tone: 'success' as const,
              onSelect: () => payoutModal.open(seller),
            });
          }
          if (can(Action.SELLERS_EDIT) && !isSelf) {
            leading.push(
              seller.isActive
                ? {
                    key: 'deactivate',
                    label: t('access.deactivateShort'),
                    icon: UserX,
                    tone: 'destructive' as const,
                    onSelect: () => deactivateModal.open({ id: seller.id, name: seller.name }),
                  }
                : {
                    key: 'activate',
                    label: t('access.activateShort'),
                    icon: UserCheck,
                    tone: 'success' as const,
                    onSelect: () => activate.mutate(seller.id),
                  }
            );
          }
          // Удаление — только в карточке: там известно, есть ли у продавца история.
          return buildRowSwipeActions({
            t,
            leading,
            onEdit: can(Action.SELLERS_EDIT)
              ? () =>
                  navigate(`/sellers/${seller.id}/edit`, {
                    state: { fromPath: location.pathname, fromName: t('title') },
                  })
              : undefined,
          });
        }}
        createAction={
          can(Action.SELLERS_CREATE) ? (
            <Button
              aria-label={t('create')}
              className="min-w-0 flex-1 gap-1.5 px-4 sm:flex-initial"
              onClick={() => navigate('/sellers/create')}>
              <Plus data-icon="inline-start" />
              <span className="truncate">{t('create')}</span>
            </Button>
          ) : null
        }
        renderCard={(row) => <SellerMobileCard row={row} t={t} />}
      />
      <SellerDialogs />
    </>
  );
}
