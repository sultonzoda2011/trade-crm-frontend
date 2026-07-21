import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { usersApi } from '~/api/users';
import { CreateUserModal } from '~/components/modals/CreateUserModal';
import { EditUserModal } from '~/components/modals/EditUserModal';
import { ColumnToggle } from '~/components/shared/ColumnToggle';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { CustomInput } from '~/components/shared/CustomInput';
import { DataTable } from '~/components/shared/DataTable';
import { FilterSheet } from '~/components/shared/FilterSheet';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useDebounce } from '~/hooks/useDebounce';
import { getColumns } from './configs/columns';
import { getUserFilters } from './configs/filters';
import { useUsersModals, useUsersStore } from './store';

const SEARCH_KEY = 'Name';

export default function UsersPage() {
  const { t } = useTranslation(['users', 'common']);
  const queryClient = useQueryClient();
  const { can } = useCan();
  const deleteModal = useUsersModals((s) => s.delete);
  const createModal = useUsersModals((s) => s.create);

  const { page, limit, search, filters, setPage, setLimit, setSearch, setFilters, resetFilters } = useUsersStore();

  const debouncedSearch = useDebounce(search);

  const queryFilters = useMemo(
    () => (debouncedSearch ? [{ key: 'search', value: debouncedSearch }, ...filters] : filters),
    [debouncedSearch, filters]
  );

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['users', page, limit, debouncedSearch, filters],
    queryFn: () => usersApi.getAll(page, limit, queryFilters),
    staleTime: 30_000,
  });

  const { mutate: deleteStudent, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('actions.deleteSuccess', { defaultValue: 'Удалено' }));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError', { defaultValue: 'Ошибка при удалении' }));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const filterConfig = useMemo(() => getUserFilters(t), [t]);
  const users = useMemo(() => response?.data?.data ?? [], [response]);
  const totalPages = response?.data?.meta?.totalPages || 1;

  const { table } = useDataTable({
    columns,
    data: users,
    storageKey: 'users-table-columns',
  });

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      </div>
      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CustomInput
            placeholder={`${t('filters.search')}...`}
            className="w-full sm:max-w-96"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="text-muted-foreground h-4 w-4" />}
          />
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <FilterSheet config={filterConfig} filters={filters} onApply={setFilters} onReset={resetFilters} />
            <ColumnToggle table={table} />
            {can(Action.USERS_CREATE) && (
              <Button className="shrink-0 gap-2" onClick={() => createModal.open()}>
                <Plus className="h-4 w-4" data-icon="inline-start" />
                <span className="hidden sm:inline">{t('create')}</span>
              </Button>
            )}
          </div>
        </div>
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
          onlimitChange={setLimit}
        />
      </div>
      <CreateUserModal />
      <EditUserModal />
      <ConfirmDialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => !open && deleteModal.close()}
        onConfirm={() => deleteModal.data != null && deleteStudent(deleteModal.data)}
        isLoading={isDeletePending}
        title={t('actions.confirm')}
        description={t('actions.areYouSure')}
      />
    </div>
  );
}
