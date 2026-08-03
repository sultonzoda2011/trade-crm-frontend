import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import { getDebtorFilters } from './configs/filters';
import { useDebtorsModals, useDebtorsStore } from './store';
import { debtorsApi } from '~/api/debtors'
import { CreateDebtorModal } from '~/components/modals/CreateDebtorModal'
import { EditDebtorModal } from '~/components/modals/EditDebtorModal'

const SEARCH_KEY = 'Name';

export default function DebtorsPage() {
  const { t } = useTranslation(['debtors', 'common']);
  const queryClient = useQueryClient();
  const { can } = useCan();
  const deleteModal = useDebtorsModals((s) => s.delete);
  const createModal = useDebtorsModals((s) => s.create);

  const {
    page, limit, search, filters,
    setPage, setLimit, setSearch,
    setFilters, resetFilters,
  } = useDebtorsStore();

  const debouncedSearch = useDebounce(search);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['debtors', page, limit, debouncedSearch, filters],
    queryFn: () => {
      const dateFrom = filters.find((f) => f.key === 'dateFrom')?.value as string | undefined;
      const dateTo = filters.find((f) => f.key === 'dateTo')?.value as string | undefined;
      const sortBy = (filters.find((f) => f.key === 'sortBy')?.value as string) || 'createdAt';
      const sortOrder = (filters.find((f) => f.key === 'sortOrder')?.value as 'asc' | 'desc') || 'desc';
      const mf = filters.filter((f) => !['dateFrom', 'dateTo', 'sortBy', 'sortOrder'].includes(f.key));
      return debtorsApi.getAll(page, limit, { search: debouncedSearch || undefined, dateFrom, dateTo, sortBy, sortOrder }, mf);
    },
    staleTime: 30_000,
  });

  const { mutate: deleteStudent, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => debtorsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['debtors'] });
      toast.success(t('actions.deleteSuccess', { defaultValue: 'Удалено' }));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError', { defaultValue: 'Ошибка при удалении' }));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const filterConfig = useMemo(() => getDebtorFilters(t), [t]);
  const debtors = useMemo(() => response?.data?.data ?? [], [response]);
  const totalPages = response?.data?.meta?.totalPages || 1;

  const { table } = useDataTable({
    columns,
    data: debtors,
    storageKey: 'debtors-table-columns',
    initialVisibility: { updatedAt: false, '_count.transactions': false, createdAt: false },
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
            {can(Action.DEBTORS_CREATE) && (
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
      <CreateDebtorModal />
      <EditDebtorModal />
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
