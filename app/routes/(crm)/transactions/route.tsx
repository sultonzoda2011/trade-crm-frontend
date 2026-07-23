import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { transactionsApi } from '~/api/transactions'
import { CreatePaymentModal } from '~/components/modals/CreatePaymentModal'
import { CreateTransactionModal } from '~/components/modals/CreateTransactionModal'
import { ColumnToggle } from '~/components/shared/ColumnToggle'
import { ConfirmDialog } from '~/components/shared/ConfirmDialog'
import { CustomInput } from '~/components/shared/CustomInput'
import { DataTable } from '~/components/shared/DataTable'
import { FilterSheet } from '~/components/shared/FilterSheet'
import { Button } from '~/components/ui/button'
import { Action } from '~/config/actions'
import { useCan } from '~/hooks/useCan'
import { useDataTable } from '~/hooks/useDataTable'
import { useDebounce } from '~/hooks/useDebounce'
import { getColumns } from './configs/columns'
import { getTransactionFilters } from './configs/filters'
import { useTransactionsModals, useTransactionsStore } from './store'

export default function TransactionsPage() {
  const { t } = useTranslation(['transactions', 'common']);
  const queryClient = useQueryClient();
  const { can } = useCan();
  const deleteModal = useTransactionsModals((s) => s.delete);
  const createModal = useTransactionsModals((s) => s.create);

  const { page, limit, search, filters, setPage, setLimit, setSearch, setFilters, resetFilters } =
    useTransactionsStore();

  const debouncedSearch = useDebounce(search);

  const queryFilters = useMemo(
    () => (debouncedSearch ? [{ key: 'search', value: debouncedSearch }, ...filters] : filters),
    [debouncedSearch, filters],
  );

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['transactions', page, limit, queryFilters],
    queryFn: () => transactionsApi.getAll(page, limit, queryFilters),
    staleTime: 30_000,
  });

  const { mutate: deleteTransaction, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(t('actions.deleteSuccess', { ns: 'common', defaultValue: 'Удалено' }));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError', { ns: 'common', defaultValue: 'Ошибка при удалении' }));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const transactions = useMemo(() => response?.data?.data ?? [], [response]);
  const totalPages = response?.data?.meta?.totalPages || 1;

  const { table } = useDataTable({
    columns,
    data: transactions,
    storageKey: 'transactions-table-columns',
  });

  const filterConfig = useMemo(() => getTransactionFilters(t), [t]);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      </div>
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CustomInput
            placeholder={`${t('filters.search', { ns: 'common' })}...`}
            className="w-full sm:max-w-96"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="text-muted-foreground h-4 w-4" />}
          />
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <FilterSheet config={filterConfig} filters={filters} onApply={setFilters} onReset={resetFilters} />
            <ColumnToggle table={table} />
            {can(Action.TRANSACTIONS_CREATE) && (
              <Button className="shrink-0 gap-2" onClick={() => createModal.open()}>
                <Plus className="h-4 w-4" />
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
      <CreateTransactionModal />
      <CreatePaymentModal />
      <ConfirmDialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => !open && deleteModal.close()}
        onConfirm={() => deleteModal.data != null && deleteTransaction(deleteModal.data)}
        isLoading={isDeletePending}
        title={t('actions.confirm', { ns: 'common' })}
        description={t('actions.areYouSure', { ns: 'common' })}
      />
    </div>
  );
}
