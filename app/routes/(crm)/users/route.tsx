import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flexRender } from '@tanstack/react-table';
import { Plus, Store, UserRound } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { toast } from 'sonner';
import { marketsApi } from '~/api/markets';
import { usersApi } from '~/api/users';
import { CreateUserModal } from '~/components/modals/CreateUserModal';
import { EditUserModal } from '~/components/modals/EditUserModal';
import { ColumnToggle } from '~/components/shared/ColumnToggle';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { DataTable } from '~/components/shared/DataTable';
import { EntityMobileCard } from '~/components/shared/EntityMobileCard';
import { FilterSheet } from '~/components/shared/FilterSheet';
import { ListPageToolbar } from '~/components/shared/ListPageToolbar';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { ROLE_CONFIG } from '~/config/enumOptions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useDebounce } from '~/hooks/useDebounce';
import { mapToOptions } from '~/lib/mapToOptions';
import { getColumns } from '~/routes/(crm)/users/configs/columns';
import { getUserFilters } from '~/routes/(crm)/users/configs/filters';
import { useUsersModals, useUsersStore } from '~/routes/(crm)/users/store';

export default function UsersPage() {
  const { t } = useTranslation(['users', 'common']);
  const queryClient = useQueryClient();
  const location = useLocation();
  const { can } = useCan();
  const deleteModal = useUsersModals((s) => s.delete);
  const createModal = useUsersModals((s) => s.create);

  const { page, limit, search, filters, setPage, setLimit, setSearch, setFilters, resetFilters } = useUsersStore();

  const debouncedSearch = useDebounce(search);

  const { data: marketsResponse } = useQuery({
    queryKey: ['markets', 'list'],
    queryFn: () => marketsApi.getAll(1, 100, {}, []),
    staleTime: 60_000,
  });

  const marketOptions = useMemo(() => mapToOptions(marketsResponse?.data?.data ?? [], 'id', 'name'), [marketsResponse]);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['users', page, limit, debouncedSearch, filters],
    queryFn: () => {
      const dateFrom = filters.find((f) => f.key === 'dateFrom')?.value as string | undefined;
      const dateTo = filters.find((f) => f.key === 'dateTo')?.value as string | undefined;
      const sortBy = (filters.find((f) => f.key === 'sortBy')?.value as string) || 'createdAt';
      const sortOrder = (filters.find((f) => f.key === 'sortOrder')?.value as 'asc' | 'desc') || 'desc';
      const mf = filters.filter((f) => !['dateFrom', 'dateTo', 'sortBy', 'sortOrder'].includes(f.key));
      return usersApi.getAll(
        page,
        limit,
        { search: debouncedSearch || undefined, dateFrom, dateTo, sortBy, sortOrder },
        mf
      );
    },
    staleTime: 30_000,
  });

  const { mutate: deleteUser, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('actions.deleteSuccess'));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError'));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const filterConfig = useMemo(() => getUserFilters(t, marketOptions), [t, marketOptions]);
  const users = useMemo(() => response?.data.data ?? [], [response]);
  const totalPages = response?.data.meta?.totalPages || 1;

  const { table } = useDataTable({
    columns,
    data: users,
    storageKey: 'users-table-columns',
    initialVisibility: { 'market.name': false },
  });

  return (
    <div className="flex-1 space-y-4">
      <ListPageToolbar
        title={t('title')}
        searchPlaceholder={t('filters.search')}
        searchValue={search}
        onSearchChange={setSearch}>
        <FilterSheet config={filterConfig} filters={filters} onApply={setFilters} onReset={resetFilters} />
        <ColumnToggle table={table} />
        {can(Action.USERS_CREATE) && (
          <Button
            size="icon"
            aria-label={t('create')}
            className="shrink-0 sm:w-auto sm:gap-1.5 sm:px-3"
            onClick={() => createModal.open()}>
            <Plus data-icon="inline-start" />
            <span className="hidden sm:inline">{t('create')}</span>
          </Button>
        )}
      </ListPageToolbar>
      <DataTable
        table={table}
        pinLastColumn
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        page={page}
        limit={limit}
        totalPages={totalPages}
        onPageChange={setPage}
        onLimitChange={setLimit}
        getRowLink={(row) => ({
          to: `/users/${row.original.id}`,
          state: { fromPath: location.pathname, fromName: t('title') },
        })}
        mobileFields={{
          role: 'primary',
          'market.name': 'secondary',
        }}
        renderMobileCard={(row) => {
          const actionsCell = row.getVisibleCells().find((cell) => cell.column.id === 'actions');
          const u = row.original;
          const roleCfg = ROLE_CONFIG[u.role];
          return (
            <EntityMobileCard
              image={u.image}
              fallbackIcon={UserRound}
              title={u.name}
              subtitle={u.email}
              actionsCell={actionsCell && flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}
              badges={roleCfg ? [{ label: roleCfg.label(t), className: roleCfg.className }] : []}
              stats={[{ icon: Store, label: t('fields.market'), value: u.market?.name ?? '—' }]}
            />
          );
        }}
      />
      <CreateUserModal />
      <EditUserModal />
      <ConfirmDialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => !open && deleteModal.close()}
        onConfirm={() => deleteModal.data != null && deleteUser(deleteModal.data)}
        isLoading={isDeletePending}
        title={t('actions.confirm')}
        description={t('actions.areYouSure')}
      />
    </div>
  );
}
