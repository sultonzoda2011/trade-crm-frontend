import { Plus, Store, UserRound } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { sellersApi } from '~/api/sellers';
import { EntityMobileCard } from '~/components/shared/EntityMobileCard';
import { ListPageLayout } from '~/components/shared/ListPageLayout';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useEntityList } from '~/hooks/useEntityList';
import { getClientUser } from '~/lib/auth-utils';
import { buildRowSwipeActions } from '~/lib/swipe-actions';
import { getColumns } from '~/routes/(crm)/sellers/configs/columns';
import { getSellerFilters } from '~/routes/(crm)/sellers/configs/filters';
import { useSellersModals, useSellersStore } from '~/routes/(crm)/sellers/store';

export default function SellersPage() {
  const { t } = useTranslation(['sellers', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = useCan();
  const deleteModal = useSellersModals((s) => s.delete);

  const list = useEntityList({ entity: 'sellers', store: useSellersStore, api: sellersApi, t, deleteModal });
  const filterConfig = useMemo(() => getSellerFilters(t), [t]);
  const columns = useMemo(() => getColumns({ t }), [t]);

  const { table } = useDataTable({
    columns,
    data: list.rows,
    storageKey: 'sellers-table-columns',
  });

  return (
    <ListPageLayout
      title={t('title')}
      searchPlaceholder={t('filters.search')}
      list={list}
      table={table}
      filterConfig={filterConfig}
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
      getSwipeActions={(row) =>
        buildRowSwipeActions({
          t,
          onEdit: can(Action.SELLERS_EDIT)
            ? () =>
                navigate(`/sellers/${row.original.id}/edit`, {
                  state: { fromPath: location.pathname, fromName: t('title') },
                })
            : undefined,
          onDelete:
            can(Action.SELLERS_DELETE) && getClientUser()?.id !== row.original.id
              ? () => deleteModal.open(row.original.id)
              : undefined,
        })
      }
      createAction={
        can(Action.SELLERS_CREATE) ? (
          <Button
            aria-label={t('create')}
            className="min-w-0 flex-1 gap-1.5 px-4 sm:flex-initial"
            onClick={() => navigate('/sellers/create')}>
            <Plus data-icon="inline-start" />
            <span>{t('create')}</span>
          </Button>
        ) : null
      }
      renderCard={(row) => {
        const s = row.original;
        return (
          <EntityMobileCard
            image={s.image}
            fallbackIcon={UserRound}
            title={s.name}
            subtitle={s.email}
            stats={[{ icon: Store, label: t('fields.market'), value: s.market?.name ?? '—' }]}
          />
        );
      }}
    />
  );
}
