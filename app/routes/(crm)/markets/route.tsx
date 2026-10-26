import { useQuery } from '@tanstack/react-query';
import { Package, Plus, Receipt, Store, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { marketsApi } from '~/api/markets';
import { usersApi } from '~/api/users';
import { EntityMobileCard } from '~/components/shared/EntityMobileCard';
import { ListPageLayout } from '~/components/shared/ListPageLayout';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useEntityList } from '~/hooks/useEntityList';
import { mapToOptions } from '~/lib/mapToOptions';
import { queryKeys } from '~/lib/query-keys';
import { buildRowSwipeActions } from '~/lib/swipe-actions';
import { getColumns } from '~/routes/(crm)/markets/configs/columns';
import { getMarketFilters } from '~/routes/(crm)/markets/configs/filters';
import { useMarketsModals, useMarketsStore } from '~/routes/(crm)/markets/store';
import { Role } from '~/types/common';

export default function MarketsPage() {
  const { t } = useTranslation(['markets', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = useCan();
  const deleteModal = useMarketsModals((s) => s.delete);

  const list = useEntityList({ entity: 'markets', store: useMarketsStore, api: marketsApi, t, deleteModal });

  // Список владельцев для фильтра `ownerId` — страница доступна только Admin
  // (ROUTE_PERMISSIONS['/markets']), поэтому запрос `/users` ничем не огорожен.
  const { data: ownersResponse } = useQuery({
    queryKey: queryKeys.options('users', { scope: 'owners', limit: 100 }),
    queryFn: () => usersApi.getAll(1, 100, {}, [{ key: 'role', value: Role.Owner }]),
  });
  const ownerOptions = useMemo(() => mapToOptions(ownersResponse?.data?.data ?? [], 'id', 'name'), [ownersResponse]);
  const filterConfig = useMemo(() => getMarketFilters(t, ownerOptions), [t, ownerOptions]);
  const columns = useMemo(() => getColumns({ t }), [t]);

  const { table } = useDataTable({
    columns,
    data: list.rows,
    storageKey: 'markets-table-columns',
    initialVisibility: { 'count.transactions': false, createdAt: false },
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
      getRowLink={(row) => ({
        to: `/markets/${row.original.id}`,
        state: { fromPath: location.pathname, fromName: t('title') },
      })}
      getSwipeActions={(row) =>
        buildRowSwipeActions({
          t,
          onEdit: can(Action.MARKETS_EDIT)
            ? () =>
                navigate(`/markets/${row.original.id}/edit`, {
                  state: { fromPath: location.pathname, fromName: t('title') },
                })
            : undefined,
          onDelete: can(Action.MARKETS_DELETE) ? () => deleteModal.open(row.original.id) : undefined,
        })
      }
      createAction={
        can(Action.MARKETS_CREATE) ? (
          <Button
            aria-label={t('create')}
            className="min-w-0 flex-1 gap-1.5 px-4 sm:flex-initial"
            onClick={() => navigate('/markets/create')}>
            <Plus data-icon="inline-start" />
            <span>{t('create')}</span>
          </Button>
        ) : null
      }
      renderCard={(row) => {
        const m = row.original;
        return (
          <EntityMobileCard
            image={m.image}
            fallbackIcon={Store}
            title={m.name}
            subtitle={m.address}
            stats={[
              { icon: Package, label: t('fields.products', 'Товары'), value: m.count.products },
              { icon: Users, label: t('fields.debtors', 'Должники'), value: m.count.debtors },
              { icon: Receipt, label: t('fields.transactions', 'Транзакции'), value: m.count.transactions },
            ]}
            badges={m.owner?.name ? [{ label: m.owner.name }] : []}
          />
        );
      }}
    />
  );
}
