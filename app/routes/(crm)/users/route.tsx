import { useQuery } from '@tanstack/react-query';
import { Plus, Store, UserRound } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { marketsApi } from '~/api/markets';
import { usersApi } from '~/api/users';
import { EntityMobileCard } from '~/components/shared/EntityMobileCard';
import { ListPageLayout } from '~/components/shared/ListPageLayout';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { ROLE_CONFIG } from '~/config/enumOptions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useEntityList } from '~/hooks/useEntityList';
import { mapToOptions } from '~/lib/mapToOptions';
import { queryKeys } from '~/lib/query-keys';
import { getColumns } from '~/routes/(crm)/users/configs/columns';
import { getUserFilters } from '~/routes/(crm)/users/configs/filters';
import { useUsersModals, useUsersStore } from '~/routes/(crm)/users/store';

export default function UsersPage() {
  const { t } = useTranslation(['users', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = useCan();
  const deleteModal = useUsersModals((s) => s.delete);

  const list = useEntityList({ entity: 'users', store: useUsersStore, api: usersApi, t, deleteModal });

  const { data: marketsResponse } = useQuery({
    queryKey: queryKeys.options('markets', { scope: 'user-form', limit: 100 }),
    queryFn: () => marketsApi.getAll(1, 100, {}, []),
  });

  const marketOptions = useMemo(() => mapToOptions(marketsResponse?.data?.data ?? [], 'id', 'name'), [marketsResponse]);
  const filterConfig = useMemo(() => getUserFilters(t, marketOptions), [t, marketOptions]);

  const columns = useMemo(() => getColumns({ t }), [t]);

  const { table } = useDataTable({
    columns,
    data: list.rows,
    storageKey: 'users-table-columns',
    initialVisibility: { 'market.name': false },
  });

  return (
    <ListPageLayout
      title={t('title')}
      searchPlaceholder={t('filters.search')}
      list={list}
      table={table}
      filterConfig={filterConfig}
      getRowLink={(row) => ({
        to: `/users/${row.original.id}`,
        state: { fromPath: location.pathname, fromName: t('title') },
      })}
      createAction={
        can(Action.USERS_CREATE) ? (
          <Button
            aria-label={t('create')}
            className="min-w-0 flex-1 gap-1.5 px-4 sm:flex-initial"
            onClick={() => navigate('/users/create')}>
            <Plus data-icon="inline-start" />
            <span>{t('create')}</span>
          </Button>
        ) : null
      }
      renderCard={(row, actions) => {
        const u = row.original;
        const roleCfg = ROLE_CONFIG[u.role];
        return (
          <EntityMobileCard
            image={u.image}
            fallbackIcon={UserRound}
            title={u.name}
            subtitle={u.email}
            actionsCell={actions}
            badges={roleCfg ? [{ label: roleCfg.label(t), className: roleCfg.className }] : []}
            stats={[{ icon: Store, label: t('fields.market'), value: u.market?.name ?? '—' }]}
          />
        );
      }}
    />
  );
}
